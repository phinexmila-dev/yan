/**
 * dev-console.js — 内置开发者调试控制台
 * 类似浏览器 F12 DevTools，用于排查 bug 和闪退问题
 * 
 * 功能：
 *   - Console 面板：拦截所有 console 输出 + 全局错误捕获
 *   - Network 面板：监控 XHR/Fetch 请求
 *   - Storage 面板：查看 localStorage / sessionStorage / IndexedDB
 *   - Performance 面板：内存、DOM 节点、FPS 监控
 *   - Elements 面板：简易 DOM 查看器
 *   - 日志持久化到 IndexedDB（闪退后可恢复查看）
 * 
 * 激活方式：三指长按 1.5 秒 / 音量键上下交替按 3 次 / 设置中开启
 * 
 * 设计规范：
 *   - 禁止渐变色
 *   - 禁止 emoji
 *   - 仅使用 SVG 图标
 *   - 扁平深色主题
 */
;(function() {
    'use strict';

    // ========== 防重复初始化 ==========
    if (window.__DEV_CONSOLE_LOADED) return;
    window.__DEV_CONSOLE_LOADED = true;

    // ========== SVG 图标库 ==========
    var SVG = {
        console: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="16" height="13" rx="2"/><polyline points="5,9 8,12 5,15" transform="translate(0,-3)"/><line x1="10" y1="13" x2="15" y2="13"/></svg>',
        network: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="10" cy="10" r="7"/><ellipse cx="10" cy="10" rx="3" ry="7"/><line x1="3" y1="10" x2="17" y2="10"/></svg>',
        storage: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><ellipse cx="10" cy="5" rx="7" ry="3"/><path d="M3,5 v4 c0,1.66 3.13,3 7,3 s7-1.34 7-3 V5"/><path d="M3,9 v4 c0,1.66 3.13,3 7,3 s7-1.34 7-3 V9"/></svg>',
        performance: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="16" height="14" rx="2"/><polyline points="5,13 8,8 11,11 15,5"/></svg>',
        elements: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="7,4 3,10 7,16"/><polyline points="13,4 17,10 13,16"/><line x1="11" y1="3" x2="9" y2="17"/></svg>',
        close: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="5" x2="15" y2="15"/><line x1="15" y1="5" x2="5" y2="15"/></svg>',
        clear: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="10" cy="10" r="7"/><line x1="7" y1="7" x2="13" y2="13"/><line x1="13" y1="7" x2="7" y2="13"/></svg>',
        export: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M10,3 v10"/><polyline points="6,9 10,13 14,9"/><path d="M3,14 v2 h14 v-2"/></svg>',
        filter: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><polygon points="2,3 18,3 12,10 12,16 8,18 8,10"/></svg>',
        search: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8.5" cy="8.5" r="5.5"/><line x1="13" y1="13" x2="17" y2="17"/></svg>',
        warning: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M10,2 L18,17 H2 Z"/><line x1="10" y1="8" x2="10" y2="12"/><circle cx="10" cy="14.5" r="0.5" fill="currentColor"/></svg>',
        error: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="10" cy="10" r="7"/><line x1="10" y1="6" x2="10" y2="11"/><circle cx="10" cy="13.5" r="0.5" fill="currentColor"/></svg>',
        info: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="10" cy="10" r="7"/><line x1="10" y1="9" x2="10" y2="14"/><circle cx="10" cy="6.5" r="0.5" fill="currentColor"/></svg>',
        bug: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><ellipse cx="10" cy="12" rx="5" ry="5"/><path d="M8,7 Q10,5 12,7"/><line x1="3" y1="9" x2="5" y2="10"/><line x1="17" y1="9" x2="15" y2="10"/><line x1="3" y1="14" x2="5" y2="13"/><line x1="17" y1="14" x2="15" y2="13"/><line x1="5" y1="17" x2="6" y2="16"/><line x1="15" y1="17" x2="14" y2="16"/></svg>',
        minimize: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="14" x2="16" y2="14"/></svg>',
        maximize: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="4" y="4" width="12" height="12" rx="1"/></svg>',
        trash: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3,5 h14"/><path d="M8,5 V3 h4 v2"/><path d="M5,5 l1,12 h8 l1-12"/><line x1="8" y1="8" x2="8" y2="14"/><line x1="12" y1="8" x2="12" y2="14"/></svg>',
        copy: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="6" y="6" width="10" height="11" rx="1"/><path d="M4,14 V3 h10"/></svg>',
        refresh: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M15,5 A6,6 0 1,0 16,12"/><polyline points="15,2 15,6 11,6"/></svg>',
        pin: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M10,2 v6 M7,8 h6 l1,5 H6 l1-5z M10,13 v5"/></svg>',
        settings: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="10" cy="10" r="3"/><path d="M10,2 v2 M10,16 v2 M2,10 h2 M16,10 h2 M4.9,4.9 l1.4,1.4 M13.7,13.7 l1.4,1.4 M4.9,15.1 l1.4-1.4 M13.7,6.3 l1.4-1.4"/></svg>',
        expand: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="6,8 10,12 14,8"/></svg>',
        collapse: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="6,12 10,8 14,12"/></svg>',
        pause: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><line x1="7" y1="5" x2="7" y2="15"/><line x1="13" y1="5" x2="13" y2="15"/></svg>',
        play: '<svg viewBox="0 0 20 20" fill="currentColor" stroke="none"><polygon points="6,4 16,10 6,16"/></svg>',
        memory: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="4" y="4" width="12" height="12" rx="2"/><rect x="7" y="7" width="6" height="6" rx="1"/><line x1="7" y1="2" x2="7" y2="4"/><line x1="10" y1="2" x2="10" y2="4"/><line x1="13" y1="2" x2="13" y2="4"/><line x1="7" y1="16" x2="7" y2="18"/><line x1="10" y1="16" x2="10" y2="18"/><line x1="13" y1="16" x2="13" y2="18"/></svg>'
    };

    // ========== 配置 ==========
    var CONFIG = {
        MAX_MEMORY_LOGS: 800,
        MAX_PERSISTED_LOGS: 2000,
        PERF_SAMPLE_INTERVAL: 5000,
        FPS_SAMPLE_INTERVAL: 1000,
        DB_NAME: 'YanDevConsole',
        DB_VERSION: 1,
        STORE_NAME: 'logs',
        ACTIVATION_TOUCHES: 3,
        ACTIVATION_HOLD_MS: 1500
    };

    // ========== 日志存储 ==========
    var logBuffer = [];
    var networkLogs = [];
    var perfSnapshots = [];
    var isVisible = false;
    var isPaused = false;
    var activeTab = 'console';
    var consoleFilter = 'all';
    var searchQuery = '';
    var panelHeight = 45; // vh percentage
    var db = null;

    // ========== IndexedDB 持久化 ==========
    function openDB(callback) {
        if (db) { callback && callback(db); return; }
        try {
            var req = indexedDB.open(CONFIG.DB_NAME, CONFIG.DB_VERSION);
            req.onupgradeneeded = function(e) {
                var d = e.target.result;
                if (!d.objectStoreNames.contains(CONFIG.STORE_NAME)) {
                    var store = d.createObjectStore(CONFIG.STORE_NAME, { keyPath: 'id', autoIncrement: true });
                    store.createIndex('time', 'time');
                    store.createIndex('type', 'type');
                }
            };
            req.onsuccess = function(e) {
                db = e.target.result;
                callback && callback(db);
            };
            req.onerror = function() {
                console.warn('[DevConsole] IndexedDB open failed');
            };
        } catch(e) {}
    }

    function persistLog(entry) {
        openDB(function(d) {
            try {
                var tx = d.transaction(CONFIG.STORE_NAME, 'readwrite');
                var store = tx.objectStore(CONFIG.STORE_NAME);
                store.add(entry);
                // 限制总数
                var countReq = store.count();
                countReq.onsuccess = function() {
                    if (countReq.result > CONFIG.MAX_PERSISTED_LOGS) {
                        var cursor = store.openCursor();
                        var toDelete = countReq.result - CONFIG.MAX_PERSISTED_LOGS;
                        cursor.onsuccess = function(ev) {
                            if (ev.target.result && toDelete > 0) {
                                ev.target.result.delete();
                                toDelete--;
                                ev.target.result.continue();
                            }
                        };
                    }
                };
            } catch(e) {}
        });
    }

    function loadPersistedLogs(callback) {
        openDB(function(d) {
            try {
                var tx = d.transaction(CONFIG.STORE_NAME, 'readonly');
                var store = tx.objectStore(CONFIG.STORE_NAME);
                var req = store.getAll();
                req.onsuccess = function() {
                    callback(req.result || []);
                };
                req.onerror = function() {
                    callback([]);
                };
            } catch(e) { callback([]); }
        });
    }

    function clearPersistedLogs() {
        openDB(function(d) {
            try {
                var tx = d.transaction(CONFIG.STORE_NAME, 'readwrite');
                tx.objectStore(CONFIG.STORE_NAME).clear();
            } catch(e) {}
        });
    }

    // ========== 日志收集器 ==========
    function pushLog(entry) {
        if (isPaused) return;
        entry.id = Date.now() + '-' + Math.random().toString(36).substr(2, 6);
        entry.time = entry.time || Date.now();
        logBuffer.push(entry);
        if (logBuffer.length > CONFIG.MAX_MEMORY_LOGS) {
            logBuffer.splice(0, logBuffer.length - CONFIG.MAX_MEMORY_LOGS);
        }
        // 错误类型始终持久化
        if (entry.type === 'error' || entry.type === 'promise-error' || entry.type === 'warn') {
            persistLog(entry);
        }
        // 如果面板可见且在 console tab，实时更新
        if (isVisible && activeTab === 'console') {
            appendLogEntry(entry);
        }
    }

    function pushNetworkLog(entry) {
        entry.id = Date.now() + '-' + Math.random().toString(36).substr(2, 6);
        networkLogs.push(entry);
        if (networkLogs.length > 200) {
            networkLogs.splice(0, networkLogs.length - 200);
        }
        if (isVisible && activeTab === 'network') {
            renderNetworkPanel();
        }
    }

    // ========== 全局错误捕获 ==========
    var _origOnError = window.onerror;
    window.onerror = function(msg, url, line, col, error) {
        pushLog({
            type: 'error',
            source: 'global',
            msg: String(msg),
            url: url || '',
            line: line || 0,
            col: col || 0,
            stack: error && error.stack ? error.stack : ''
        });
        persistLog({
            type: 'error',
            source: 'global',
            time: Date.now(),
            msg: String(msg),
            url: url || '',
            line: line || 0,
            col: col || 0,
            stack: error && error.stack ? error.stack : ''
        });
        if (_origOnError) _origOnError.apply(window, arguments);
        return true; // 阻止默认崩溃行为
    };

    window.addEventListener('unhandledrejection', function(e) {
        var reason = e.reason;
        var msg = reason ? (reason.message || String(reason)) : 'Unknown Promise Rejection';
        var stack = reason && reason.stack ? reason.stack : '';
        pushLog({
            type: 'promise-error',
            source: 'promise',
            msg: msg,
            stack: stack
        });
        e.preventDefault();
    });

    // 捕获资源加载错误
    window.addEventListener('error', function(e) {
        if (e.target && e.target !== window && (e.target.tagName === 'SCRIPT' || e.target.tagName === 'LINK' || e.target.tagName === 'IMG')) {
            pushLog({
                type: 'error',
                source: 'resource',
                msg: 'Resource load failed: ' + (e.target.src || e.target.href || ''),
                tag: e.target.tagName
            });
        }
    }, true);

    // ========== Console 拦截 ==========
    var _origConsole = {};
    ['log', 'warn', 'error', 'info', 'debug'].forEach(function(method) {
        _origConsole[method] = console[method] ? console[method].bind(console) : function() {};
        console[method] = function() {
            var args = Array.prototype.slice.call(arguments);
            _origConsole[method].apply(console, args);
            // 过滤掉 DevConsole 自身的输出
            var firstArg = args[0];
            if (typeof firstArg === 'string' && firstArg.indexOf('[DevConsole]') === 0) return;
            pushLog({
                type: method,
                source: 'console',
                msg: args.map(function(a) {
                    if (a === null) return 'null';
                    if (a === undefined) return 'undefined';
                    if (typeof a === 'object') {
                        try { return JSON.stringify(a, null, 2); }
                        catch(e) { return '[Circular Object]'; }
                    }
                    return String(a);
                }).join(' ')
            });
        };
    });

    // ========== 网络请求监控 ==========
    // --- XHR ---
    var _origXHROpen = XMLHttpRequest.prototype.open;
    var _origXHRSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function(method, url) {
        this._devMeta = { method: method.toUpperCase(), url: String(url), startTime: 0 };
        return _origXHROpen.apply(this, arguments);
    };
    XMLHttpRequest.prototype.send = function(body) {
        var meta = this._devMeta;
        if (meta) {
            meta.startTime = Date.now();
            meta.requestBody = body ? (typeof body === 'string' ? body.substring(0, 500) : '[Binary]') : '';
            var self = this;
            this.addEventListener('loadend', function() {
                meta.duration = Date.now() - meta.startTime;
                meta.status = self.status;
                meta.statusText = self.statusText || '';
                meta.responseSize = self.response ? (typeof self.response === 'string' ? self.response.length : (self.response.byteLength || 0)) : 0;
                try {
                    meta.responsePreview = typeof self.responseText === 'string' ? self.responseText.substring(0, 300) : '';
                } catch(e) { meta.responsePreview = ''; }
                meta.time = Date.now();
                pushNetworkLog(meta);
            });
            this.addEventListener('error', function() {
                meta.duration = Date.now() - meta.startTime;
                meta.status = 0;
                meta.statusText = 'Network Error';
                meta.time = Date.now();
                pushNetworkLog(meta);
            });
            this.addEventListener('timeout', function() {
                meta.duration = Date.now() - meta.startTime;
                meta.status = 0;
                meta.statusText = 'Timeout';
                meta.time = Date.now();
                pushNetworkLog(meta);
            });
        }
        return _origXHRSend.apply(this, arguments);
    };

    // --- Fetch ---
    if (window.fetch) {
        var _origFetch = window.fetch;
        window.fetch = function(input, init) {
            var url = typeof input === 'string' ? input : (input && input.url ? input.url : String(input));
            var method = (init && init.method) ? init.method.toUpperCase() : 'GET';
            var startTime = Date.now();
            var meta = { method: method, url: url, startTime: startTime };

            return _origFetch.apply(window, arguments).then(function(response) {
                meta.duration = Date.now() - startTime;
                meta.status = response.status;
                meta.statusText = response.statusText || '';
                meta.time = Date.now();
                // 克隆 response 来读取大小
                try {
                    var cloned = response.clone();
                    cloned.text().then(function(text) {
                        meta.responseSize = text.length;
                        meta.responsePreview = text.substring(0, 300);
                        pushNetworkLog(meta);
                    }).catch(function() {
                        pushNetworkLog(meta);
                    });
                } catch(e) {
                    pushNetworkLog(meta);
                }
                return response;
            }).catch(function(err) {
                meta.duration = Date.now() - startTime;
                meta.status = 0;
                meta.statusText = err.message || 'Fetch Error';
                meta.time = Date.now();
                pushNetworkLog(meta);
                throw err;
            });
        };
    }

    // ========== 性能监控 ==========
    var fpsFrames = 0;
    var fpsLast = performance.now();
    var currentFPS = 0;

    function measureFPS() {
        fpsFrames++;
        var now = performance.now();
        if (now - fpsLast >= CONFIG.FPS_SAMPLE_INTERVAL) {
            currentFPS = Math.round(fpsFrames * 1000 / (now - fpsLast));
            fpsFrames = 0;
            fpsLast = now;
        }
        requestAnimationFrame(measureFPS);
    }
    requestAnimationFrame(measureFPS);

    function collectPerfSnapshot() {
        var snap = {
            time: Date.now(),
            fps: currentFPS,
            domNodes: document.querySelectorAll('*').length,
            heapUsed: 0,
            heapTotal: 0,
            heapLimit: 0
        };
        if (performance.memory) {
            snap.heapUsed = performance.memory.usedJSHeapSize;
            snap.heapTotal = performance.memory.totalJSHeapSize;
            snap.heapLimit = performance.memory.jsHeapSizeLimit;
        }
        perfSnapshots.push(snap);
        if (perfSnapshots.length > 120) {
            perfSnapshots.splice(0, perfSnapshots.length - 120);
        }
        return snap;
    }

    // [PERF-iOS发热修复] iOS上完全禁用性能采集定时器
    // performance.memory 在 Safari 上不可用，这个定时器纯属浪费CPU
    var _dcIsIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    if (!_dcIsIOS) {
        // 非iOS：保留性能采集但降低频率（5秒→30秒）
        setInterval(function() {
            if (document.hidden) return; // 页面不可见时跳过
            var snap = collectPerfSnapshot();
            // 内存使用率超过 80% 时自动记录警告
            if (snap.heapLimit > 0 && snap.heapUsed / snap.heapLimit > 0.8) {
                pushLog({
                    type: 'warn',
                    source: 'perf',
                    msg: '[MEMORY WARNING] Heap usage: ' + formatBytes(snap.heapUsed) + ' / ' + formatBytes(snap.heapLimit) + ' (' + Math.round(snap.heapUsed / snap.heapLimit * 100) + '%)'
                });
            }
        }, 30000); // 从5秒改为30秒，减少80%的CPU唤醒
    }

    // ========== 工具函数 ==========
    function formatTime(ts) {
        var d = new Date(ts);
        var h = d.getHours().toString().padStart(2, '0');
        var m = d.getMinutes().toString().padStart(2, '0');
        var s = d.getSeconds().toString().padStart(2, '0');
        var ms = d.getMilliseconds().toString().padStart(3, '0');
        return h + ':' + m + ':' + s + '.' + ms;
    }

    function formatBytes(bytes) {
        if (!bytes || bytes === 0) return '0 B';
        var units = ['B', 'KB', 'MB', 'GB'];
        var i = Math.floor(Math.log(bytes) / Math.log(1024));
        return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + units[i];
    }

    function formatDuration(ms) {
        if (!ms) return '0ms';
        if (ms < 1000) return ms + 'ms';
        return (ms / 1000).toFixed(2) + 's';
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function truncate(str, max) {
        if (!str) return '';
        if (str.length <= max) return str;
        return str.substring(0, max) + '...';
    }

    // ========== UI 构建 ==========
    var panelEl = null;
    var logContainerEl = null;
    var triggerBtnEl = null;

    function createPanel() {
        if (panelEl) return;

        // 注入样式
        var styleEl = document.createElement('style');
        styleEl.id = 'dev-console-styles';
        styleEl.textContent = getStyles();
        document.head.appendChild(styleEl);

        // 创建面板
        panelEl = document.createElement('div');
        panelEl.id = 'dc-panel';
        panelEl.className = 'dc-panel';
        panelEl.innerHTML = buildPanelHTML();
        document.body.appendChild(panelEl);

        // 创建触发按钮
        triggerBtnEl = document.createElement('div');
        triggerBtnEl.id = 'dc-trigger';
        triggerBtnEl.className = 'dc-trigger';
        triggerBtnEl.innerHTML = SVG.bug;
        triggerBtnEl.addEventListener('click', function(e) {
            e.stopPropagation();
            togglePanel();
        });
        document.body.appendChild(triggerBtnEl);

        // 绑定事件
        bindEvents();

        _origConsole.log('[DevConsole] Panel created');
    }

    function buildPanelHTML() {
        return '' +
            '<div class="dc-resize-handle" id="dc-resize-handle"></div>' +
            '<div class="dc-header">' +
                '<div class="dc-tabs">' +
                    '<button class="dc-tab dc-tab-active" data-tab="console">' + SVG.console + '<span>Console</span></button>' +
                    '<button class="dc-tab" data-tab="network">' + SVG.network + '<span>Network</span></button>' +
                    '<button class="dc-tab" data-tab="storage">' + SVG.storage + '<span>Storage</span></button>' +
                    '<button class="dc-tab" data-tab="performance">' + SVG.performance + '<span>Perf</span></button>' +
                    '<button class="dc-tab" data-tab="elements">' + SVG.elements + '<span>Elements</span></button>' +
                '</div>' +
                '<div class="dc-header-actions">' +
                    '<button class="dc-btn dc-btn-icon" id="dc-btn-pause" title="Pause">' + SVG.pause + '</button>' +
                    '<button class="dc-btn dc-btn-icon" id="dc-btn-clear" title="Clear">' + SVG.trash + '</button>' +
                    '<button class="dc-btn dc-btn-icon" id="dc-btn-export" title="Export">' + SVG.export + '</button>' +
                    '<button class="dc-btn dc-btn-icon" id="dc-btn-minimize" title="Minimize">' + SVG.minimize + '</button>' +
                    '<button class="dc-btn dc-btn-icon" id="dc-btn-close" title="Close">' + SVG.close + '</button>' +
                '</div>' +
            '</div>' +
            '<div class="dc-toolbar" id="dc-toolbar-console">' +
                '<div class="dc-filter-group">' +
                    '<button class="dc-filter-btn dc-filter-active" data-filter="all">All</button>' +
                    '<button class="dc-filter-btn" data-filter="error">' + SVG.error + 'Errors</button>' +
                    '<button class="dc-filter-btn" data-filter="warn">' + SVG.warning + 'Warnings</button>' +
                    '<button class="dc-filter-btn" data-filter="log">Log</button>' +
                    '<button class="dc-filter-btn" data-filter="info">Info</button>' +
                    '<button class="dc-filter-btn" data-filter="debug">Debug</button>' +
                '</div>' +
                '<div class="dc-search-box">' +
                    SVG.search +
                    '<input type="text" class="dc-search-input" id="dc-search" placeholder="Filter...">' +
                '</div>' +
            '</div>' +
            '<div class="dc-toolbar dc-toolbar-hidden" id="dc-toolbar-network">' +
                '<div class="dc-filter-group">' +
                    '<button class="dc-filter-btn dc-filter-active" data-netfilter="all">All</button>' +
                    '<button class="dc-filter-btn" data-netfilter="xhr">XHR</button>' +
                    '<button class="dc-filter-btn" data-netfilter="fetch">Fetch</button>' +
                    '<button class="dc-filter-btn" data-netfilter="error">Failed</button>' +
                '</div>' +
            '</div>' +
            '<div class="dc-body">' +
                '<div class="dc-content dc-content-active" id="dc-content-console"></div>' +
                '<div class="dc-content" id="dc-content-network"></div>' +
                '<div class="dc-content" id="dc-content-storage"></div>' +
                '<div class="dc-content" id="dc-content-performance"></div>' +
                '<div class="dc-content" id="dc-content-elements"></div>' +
            '</div>' +
            '<div class="dc-input-bar" id="dc-input-bar">' +
                '<span class="dc-prompt">&gt;</span>' +
                '<input type="text" class="dc-cmd-input" id="dc-cmd-input" placeholder="Enter JS expression...">' +
            '</div>';
    }

    // ========== 事件绑定 ==========
    function bindEvents() {
        // Tab 切换
        panelEl.querySelectorAll('.dc-tab').forEach(function(btn) {
            btn.addEventListener('click', function() {
                switchTab(btn.getAttribute('data-tab'));
            });
        });

        // Console 过滤器
        panelEl.querySelectorAll('[data-filter]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                consoleFilter = btn.getAttribute('data-filter');
                panelEl.querySelectorAll('[data-filter]').forEach(function(b) { b.classList.remove('dc-filter-active'); });
                btn.classList.add('dc-filter-active');
                renderConsolePanel();
            });
        });

        // 搜索
        var searchInput = panelEl.querySelector('#dc-search');
        if (searchInput) {
            searchInput.addEventListener('input', function() {
                searchQuery = searchInput.value.toLowerCase();
                renderConsolePanel();
            });
        }

        // 操作按钮
        var btnPause = panelEl.querySelector('#dc-btn-pause');
        if (btnPause) {
            btnPause.addEventListener('click', function() {
                isPaused = !isPaused;
                btnPause.innerHTML = isPaused ? SVG.play : SVG.pause;
                btnPause.title = isPaused ? 'Resume' : 'Pause';
                btnPause.classList.toggle('dc-btn-active', isPaused);
            });
        }

        var btnClear = panelEl.querySelector('#dc-btn-clear');
        if (btnClear) {
            btnClear.addEventListener('click', function() {
                if (activeTab === 'console') {
                    logBuffer.length = 0;
                    clearPersistedLogs();
                    renderConsolePanel();
                } else if (activeTab === 'network') {
                    networkLogs.length = 0;
                    renderNetworkPanel();
                }
            });
        }

        var btnExport = panelEl.querySelector('#dc-btn-export');
        if (btnExport) {
            btnExport.addEventListener('click', exportLogs);
        }

        var btnMinimize = panelEl.querySelector('#dc-btn-minimize');
        if (btnMinimize) {
            btnMinimize.addEventListener('click', function() {
                panelEl.classList.remove('dc-panel-visible');
                isVisible = false;
                triggerBtnEl.classList.add('dc-trigger-visible');
            });
        }

        var btnClose = panelEl.querySelector('#dc-btn-close');
        if (btnClose) {
            btnClose.addEventListener('click', function() {
                hidePanel();
            });
        }

        // JS 命令输入
        var cmdInput = panelEl.querySelector('#dc-cmd-input');
        if (cmdInput) {
            var cmdHistory = [];
            var cmdHistoryIdx = -1;
            cmdInput.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    var expr = cmdInput.value.trim();
                    if (!expr) return;
                    cmdHistory.push(expr);
                    cmdHistoryIdx = cmdHistory.length;
                    pushLog({ type: 'input', source: 'eval', msg: '> ' + expr });
                    try {
                        var result = eval(expr);
                        pushLog({ type: 'output', source: 'eval', msg: typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result) });
                    } catch(err) {
                        pushLog({ type: 'error', source: 'eval', msg: err.message, stack: err.stack || '' });
                    }
                    cmdInput.value = '';
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    if (cmdHistoryIdx > 0) {
                        cmdHistoryIdx--;
                        cmdInput.value = cmdHistory[cmdHistoryIdx];
                    }
                } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    if (cmdHistoryIdx < cmdHistory.length - 1) {
                        cmdHistoryIdx++;
                        cmdInput.value = cmdHistory[cmdHistoryIdx];
                    } else {
                        cmdHistoryIdx = cmdHistory.length;
                        cmdInput.value = '';
                    }
                }
            });
        }

        // 拖拽调整高度
        var resizeHandle = panelEl.querySelector('#dc-resize-handle');
        if (resizeHandle) {
            var startY = 0;
            var startH = 0;
            var onMove = function(e) {
                var clientY = e.touches ? e.touches[0].clientY : e.clientY;
                var delta = startY - clientY;
                var newH = startH + (delta / window.innerHeight * 100);
                newH = Math.max(20, Math.min(85, newH));
                panelHeight = newH;
                panelEl.style.height = newH + 'vh';
            };
            var onEnd = function() {
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onEnd);
                document.removeEventListener('touchmove', onMove);
                document.removeEventListener('touchend', onEnd);
                panelEl.classList.remove('dc-resizing');
            };
            resizeHandle.addEventListener('mousedown', function(e) {
                startY = e.clientY;
                startH = panelHeight;
                panelEl.classList.add('dc-resizing');
                document.addEventListener('mousemove', onMove);
                document.addEventListener('mouseup', onEnd);
            });
            resizeHandle.addEventListener('touchstart', function(e) {
                if (e.touches.length === 1) {
                    startY = e.touches[0].clientY;
                    startH = panelHeight;
                    panelEl.classList.add('dc-resizing');
                    document.addEventListener('touchmove', onMove, { passive: false });
                    document.addEventListener('touchend', onEnd);
                }
            });
        }
    }

    // ========== Tab 切换 ==========
    function switchTab(tab) {
        activeTab = tab;
        panelEl.querySelectorAll('.dc-tab').forEach(function(t) {
            t.classList.toggle('dc-tab-active', t.getAttribute('data-tab') === tab);
        });
        panelEl.querySelectorAll('.dc-content').forEach(function(c) {
            c.classList.toggle('dc-content-active', c.id === 'dc-content-' + tab);
        });
        // 工具栏切换
        panelEl.querySelectorAll('.dc-toolbar').forEach(function(t) { t.classList.add('dc-toolbar-hidden'); });
        var toolbar = panelEl.querySelector('#dc-toolbar-' + tab);
        if (toolbar) toolbar.classList.remove('dc-toolbar-hidden');
        // 输入栏仅 console 显示
        var inputBar = panelEl.querySelector('#dc-input-bar');
        if (inputBar) inputBar.style.display = tab === 'console' ? '' : 'none';

        // 渲染对应面板
        if (tab === 'console') renderConsolePanel();
        else if (tab === 'network') renderNetworkPanel();
        else if (tab === 'storage') renderStoragePanel();
        else if (tab === 'performance') renderPerformancePanel();
        else if (tab === 'elements') renderElementsPanel();
    }

    // ========== Console 面板渲染 ==========
    function renderConsolePanel() {
        var container = panelEl.querySelector('#dc-content-console');
        if (!container) return;
        container.innerHTML = '';

        var filtered = logBuffer.filter(function(entry) {
            if (consoleFilter !== 'all') {
                if (consoleFilter === 'error' && entry.type !== 'error' && entry.type !== 'promise-error') return false;
                if (consoleFilter === 'warn' && entry.type !== 'warn') return false;
                if (consoleFilter === 'log' && entry.type !== 'log') return false;
                if (consoleFilter === 'info' && entry.type !== 'info') return false;
                if (consoleFilter === 'debug' && entry.type !== 'debug') return false;
            }
            if (searchQuery && entry.msg && entry.msg.toLowerCase().indexOf(searchQuery) === -1) return false;
            return true;
        });

        if (filtered.length === 0) {
            container.innerHTML = '<div class="dc-empty">No logs to display</div>';
            return;
        }

        var fragment = document.createDocumentFragment();
        filtered.forEach(function(entry) {
            fragment.appendChild(createLogElement(entry));
        });
        container.appendChild(fragment);
        container.scrollTop = container.scrollHeight;
    }

    function appendLogEntry(entry) {
        var container = panelEl ? panelEl.querySelector('#dc-content-console') : null;
        if (!container) return;
        // 检查过滤
        if (consoleFilter !== 'all') {
            if (consoleFilter === 'error' && entry.type !== 'error' && entry.type !== 'promise-error') return;
            if (consoleFilter === 'warn' && entry.type !== 'warn') return;
            if (consoleFilter === 'log' && entry.type !== 'log') return;
            if (consoleFilter === 'info' && entry.type !== 'info') return;
            if (consoleFilter === 'debug' && entry.type !== 'debug') return;
        }
        if (searchQuery && entry.msg && entry.msg.toLowerCase().indexOf(searchQuery) === -1) return;

        // 移除空提示
        var empty = container.querySelector('.dc-empty');
        if (empty) empty.remove();

        container.appendChild(createLogElement(entry));
        // 自动滚动到底部
        var isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 80;
        if (isNearBottom) {
            container.scrollTop = container.scrollHeight;
        }
    }

    function createLogElement(entry) {
        var el = document.createElement('div');
        el.className = 'dc-log dc-log-' + entry.type;

        var typeClass = 'dc-log-type-' + entry.type;
        var icon = '';
        if (entry.type === 'error' || entry.type === 'promise-error') icon = SVG.error;
        else if (entry.type === 'warn') icon = SVG.warning;
        else if (entry.type === 'info') icon = SVG.info;
        else if (entry.type === 'input') icon = '<span class="dc-prompt-icon">&gt;</span>';
        else if (entry.type === 'output') icon = '<span class="dc-prompt-icon">&lt;</span>';

        var timeStr = entry.time ? formatTime(entry.time) : '';
        var sourceStr = entry.source ? '<span class="dc-log-source">' + escapeHtml(entry.source) + '</span>' : '';
        var locationStr = '';
        if (entry.url) {
            var shortUrl = entry.url.split('/').pop() || entry.url;
            locationStr = '<span class="dc-log-location">' + escapeHtml(shortUrl) + (entry.line ? ':' + entry.line : '') + '</span>';
        }

        var msgHtml = '<span class="dc-log-msg">' + escapeHtml(entry.msg || '') + '</span>';

        var stackHtml = '';
        if (entry.stack) {
            stackHtml = '<div class="dc-log-stack dc-collapsed" onclick="this.classList.toggle(\'dc-collapsed\')">' +
                '<div class="dc-stack-toggle">' + SVG.expand + ' Stack trace</div>' +
                '<pre class="dc-stack-content">' + escapeHtml(entry.stack) + '</pre>' +
            '</div>';
        }

        el.innerHTML =
            '<div class="dc-log-row">' +
                '<span class="dc-log-icon ' + typeClass + '">' + icon + '</span>' +
                '<span class="dc-log-time">' + timeStr + '</span>' +
                sourceStr +
                msgHtml +
                locationStr +
            '</div>' +
            stackHtml;

        // 长按复制
        var longPressTimer;
        el.addEventListener('touchstart', function() {
            longPressTimer = setTimeout(function() {
                copyToClipboard(entry.msg + (entry.stack ? '\n' + entry.stack : ''));
                showToast('Copied to clipboard');
            }, 800);
        });
        el.addEventListener('touchend', function() { clearTimeout(longPressTimer); });
        el.addEventListener('touchmove', function() { clearTimeout(longPressTimer); });

        return el;
    }

    // ========== Network 面板渲染 ==========
    function renderNetworkPanel() {
        var container = panelEl.querySelector('#dc-content-network');
        if (!container) return;

        if (networkLogs.length === 0) {
            container.innerHTML = '<div class="dc-empty">No network requests recorded</div>';
            return;
        }

        var html = '<table class="dc-net-table"><thead><tr>' +
            '<th>Status</th><th>Method</th><th>URL</th><th>Duration</th><th>Size</th>' +
            '</tr></thead><tbody>';

        networkLogs.slice().reverse().forEach(function(entry) {
            var statusClass = 'dc-status-ok';
            if (!entry.status || entry.status >= 400) statusClass = 'dc-status-error';
            else if (entry.status >= 300) statusClass = 'dc-status-redirect';

            var shortUrl = entry.url || '';
            if (shortUrl.length > 60) {
                try {
                    var u = new URL(shortUrl, location.origin);
                    shortUrl = u.pathname + u.search;
                } catch(e) {}
            }
            shortUrl = truncate(shortUrl, 50);

            html += '<tr class="dc-net-row" data-id="' + (entry.id || '') + '">' +
                '<td class="' + statusClass + '">' + (entry.status || '--') + '</td>' +
                '<td><span class="dc-method dc-method-' + (entry.method || '').toLowerCase() + '">' + escapeHtml(entry.method || '') + '</span></td>' +
                '<td class="dc-net-url" title="' + escapeHtml(entry.url || '') + '">' + escapeHtml(shortUrl) + '</td>' +
                '<td>' + formatDuration(entry.duration) + '</td>' +
                '<td>' + formatBytes(entry.responseSize || 0) + '</td>' +
                '</tr>';

            if (entry.responsePreview) {
                html += '<tr class="dc-net-detail dc-collapsed"><td colspan="5"><pre class="dc-net-preview">' + escapeHtml(truncate(entry.responsePreview, 300)) + '</pre></td></tr>';
            }
        });

        html += '</tbody></table>';
        container.innerHTML = html;

        // 点击展开行
        container.querySelectorAll('.dc-net-row').forEach(function(row) {
            row.addEventListener('click', function() {
                var next = row.nextElementSibling;
                if (next && next.classList.contains('dc-net-detail')) {
                    next.classList.toggle('dc-collapsed');
                }
            });
        });
    }

    // ========== Storage 面板渲染 ==========
    function renderStoragePanel() {
        var container = panelEl.querySelector('#dc-content-storage');
        if (!container) return;

        var html = '<div class="dc-storage-section">' +
            '<div class="dc-section-header" onclick="this.parentElement.classList.toggle(\'dc-section-collapsed\')">' +
                SVG.expand + '<h3>localStorage (' + localStorage.length + ' items)</h3>' +
                '<button class="dc-btn dc-btn-sm" onclick="event.stopPropagation(); window.__devConsole.refreshStorage();">' + SVG.refresh + '</button>' +
            '</div>' +
            '<div class="dc-section-body">' +
            '<table class="dc-storage-table"><thead><tr><th>Key</th><th>Size</th><th>Value</th></tr></thead><tbody>';

        for (var i = 0; i < localStorage.length; i++) {
            var key = localStorage.key(i);
            var val = '';
            try { val = localStorage.getItem(key) || ''; } catch(e) { val = '[Error]'; }
            var size = new Blob([val]).size;
            html += '<tr>' +
                '<td class="dc-key">' + escapeHtml(truncate(key, 40)) + '</td>' +
                '<td class="dc-size">' + formatBytes(size) + '</td>' +
                '<td class="dc-val">' + escapeHtml(truncate(val, 100)) + '</td>' +
                '</tr>';
        }
        html += '</tbody></table></div></div>';

        // SessionStorage
        html += '<div class="dc-storage-section">' +
            '<div class="dc-section-header" onclick="this.parentElement.classList.toggle(\'dc-section-collapsed\')">' +
                SVG.expand + '<h3>sessionStorage (' + sessionStorage.length + ' items)</h3>' +
            '</div>' +
            '<div class="dc-section-body">' +
            '<table class="dc-storage-table"><thead><tr><th>Key</th><th>Size</th><th>Value</th></tr></thead><tbody>';

        for (var j = 0; j < sessionStorage.length; j++) {
            var skey = sessionStorage.key(j);
            var sval = '';
            try { sval = sessionStorage.getItem(skey) || ''; } catch(e) { sval = '[Error]'; }
            var ssize = new Blob([sval]).size;
            html += '<tr>' +
                '<td class="dc-key">' + escapeHtml(truncate(skey, 40)) + '</td>' +
                '<td class="dc-size">' + formatBytes(ssize) + '</td>' +
                '<td class="dc-val">' + escapeHtml(truncate(sval, 100)) + '</td>' +
                '</tr>';
        }
        html += '</tbody></table></div></div>';

        // 总存储空间估算
        if (navigator.storage && navigator.storage.estimate) {
            navigator.storage.estimate().then(function(est) {
                var infoEl = container.querySelector('.dc-storage-quota');
                if (infoEl) {
                    infoEl.textContent = 'Storage: ' + formatBytes(est.usage || 0) + ' / ' + formatBytes(est.quota || 0);
                }
            });
        }
        html += '<div class="dc-storage-quota">Calculating storage...</div>';

        container.innerHTML = html;
    }

    // ========== Performance 面板渲染 ==========
    function renderPerformancePanel() {
        var container = panelEl.querySelector('#dc-content-performance');
        if (!container) return;

        var snap = collectPerfSnapshot();

        var html = '<div class="dc-perf-grid">';

        // FPS 卡片
        var fpsColor = snap.fps >= 50 ? '#4caf50' : (snap.fps >= 30 ? '#ff9800' : '#f44336');
        html += '<div class="dc-perf-card">' +
            '<div class="dc-perf-card-header">' + SVG.performance + '<span>FPS</span></div>' +
            '<div class="dc-perf-value" style="color:' + fpsColor + '">' + snap.fps + '</div>' +
            '<div class="dc-perf-label">frames/sec</div>' +
            '</div>';

        // DOM 节点
        var domColor = snap.domNodes < 1500 ? '#4caf50' : (snap.domNodes < 3000 ? '#ff9800' : '#f44336');
        html += '<div class="dc-perf-card">' +
            '<div class="dc-perf-card-header">' + SVG.elements + '<span>DOM Nodes</span></div>' +
            '<div class="dc-perf-value" style="color:' + domColor + '">' + snap.domNodes + '</div>' +
            '<div class="dc-perf-label">elements</div>' +
            '</div>';

        // 内存
        if (snap.heapLimit > 0) {
            var memPercent = Math.round(snap.heapUsed / snap.heapLimit * 100);
            var memColor = memPercent < 60 ? '#4caf50' : (memPercent < 80 ? '#ff9800' : '#f44336');
            html += '<div class="dc-perf-card">' +
                '<div class="dc-perf-card-header">' + SVG.memory + '<span>JS Heap</span></div>' +
                '<div class="dc-perf-value" style="color:' + memColor + '">' + memPercent + '%</div>' +
                '<div class="dc-perf-label">' + formatBytes(snap.heapUsed) + ' / ' + formatBytes(snap.heapLimit) + '</div>' +
                '</div>';

            html += '<div class="dc-perf-card">' +
                '<div class="dc-perf-card-header">' + SVG.memory + '<span>Heap Total</span></div>' +
                '<div class="dc-perf-value">' + formatBytes(snap.heapTotal) + '</div>' +
                '<div class="dc-perf-label">allocated</div>' +
                '</div>';
        } else {
            html += '<div class="dc-perf-card">' +
                '<div class="dc-perf-card-header">' + SVG.memory + '<span>JS Heap</span></div>' +
                '<div class="dc-perf-value">N/A</div>' +
                '<div class="dc-perf-label">Not available in this environment</div>' +
                '</div>';
        }

        html += '</div>';

        // 历史趋势图
        html += '<div class="dc-perf-section"><h3>Performance Timeline</h3>';
        html += renderPerfChart();
        html += '</div>';

        // 页面加载时间
        if (performance.timing) {
            var t = performance.timing;
            html += '<div class="dc-perf-section"><h3>Page Load Timing</h3>' +
                '<div class="dc-timing-bar">' +
                '<div class="dc-timing-item"><span>DNS</span><span>' + (t.domainLookupEnd - t.domainLookupStart) + 'ms</span></div>' +
                '<div class="dc-timing-item"><span>TCP</span><span>' + (t.connectEnd - t.connectStart) + 'ms</span></div>' +
                '<div class="dc-timing-item"><span>Request</span><span>' + (t.responseStart - t.requestStart) + 'ms</span></div>' +
                '<div class="dc-timing-item"><span>Response</span><span>' + (t.responseEnd - t.responseStart) + 'ms</span></div>' +
                '<div class="dc-timing-item"><span>DOM Parse</span><span>' + (t.domInteractive - t.domLoading) + 'ms</span></div>' +
                '<div class="dc-timing-item"><span>DOM Ready</span><span>' + (t.domContentLoadedEventEnd - t.navigationStart) + 'ms</span></div>' +
                '<div class="dc-timing-item"><span>Load</span><span>' + (t.loadEventEnd - t.navigationStart) + 'ms</span></div>' +
                '</div></div>';
        }

        // Errors/Warnings 统计
        var errorCount = logBuffer.filter(function(l) { return l.type === 'error' || l.type === 'promise-error'; }).length;
        var warnCount = logBuffer.filter(function(l) { return l.type === 'warn'; }).length;
        html += '<div class="dc-perf-section"><h3>Session Stats</h3>' +
            '<div class="dc-stats-row">' +
            '<div class="dc-stat"><span class="dc-stat-val dc-color-error">' + errorCount + '</span><span class="dc-stat-label">Errors</span></div>' +
            '<div class="dc-stat"><span class="dc-stat-val dc-color-warn">' + warnCount + '</span><span class="dc-stat-label">Warnings</span></div>' +
            '<div class="dc-stat"><span class="dc-stat-val">' + logBuffer.length + '</span><span class="dc-stat-label">Total Logs</span></div>' +
            '<div class="dc-stat"><span class="dc-stat-val">' + networkLogs.length + '</span><span class="dc-stat-label">Requests</span></div>' +
            '</div></div>';

        html += '<div class="dc-perf-actions">' +
            '<button class="dc-btn dc-btn-primary" onclick="window.__devConsole.refreshPerf();">' + SVG.refresh + ' Refresh</button>' +
            '<button class="dc-btn" onclick="window.__devConsole.forceGC();">Force GC Hint</button>' +
            '</div>';

        container.innerHTML = html;
    }

    function renderPerfChart() {
        if (perfSnapshots.length < 2) return '<div class="dc-empty">Collecting data... (updates every 5s)</div>';

        var width = 300;
        var height = 100;
        var maxFps = 65;
        var maxDom = Math.max.apply(null, perfSnapshots.map(function(s) { return s.domNodes; })) * 1.2 || 5000;

        var fpsPoints = perfSnapshots.map(function(s, i) {
            var x = (i / (perfSnapshots.length - 1)) * width;
            var y = height - (Math.min(s.fps, maxFps) / maxFps) * height;
            return x + ',' + y;
        }).join(' ');

        var domPoints = perfSnapshots.map(function(s, i) {
            var x = (i / (perfSnapshots.length - 1)) * width;
            var y = height - (s.domNodes / maxDom) * height;
            return x + ',' + y;
        }).join(' ');

        return '<div class="dc-chart-container">' +
            '<svg viewBox="0 0 ' + width + ' ' + height + '" class="dc-chart">' +
            '<polyline points="' + fpsPoints + '" fill="none" stroke="#4caf50" stroke-width="1.5"/>' +
            '<polyline points="' + domPoints + '" fill="none" stroke="#2196f3" stroke-width="1.5"/>' +
            '</svg>' +
            '<div class="dc-chart-legend">' +
            '<span style="color:#4caf50">-- FPS</span>' +
            '<span style="color:#2196f3">-- DOM Nodes</span>' +
            '</div></div>';
    }

    // ========== Elements 面板渲染 ==========
    function renderElementsPanel() {
        var container = panelEl.querySelector('#dc-content-elements');
        if (!container) return;

        var html = '<div class="dc-elements-tree">';
        html += renderDomNode(document.documentElement, 0, 3);
        html += '</div>';
        container.innerHTML = html;

        // 展开/折叠
        container.querySelectorAll('.dc-dom-toggle').forEach(function(toggle) {
            toggle.addEventListener('click', function(e) {
                e.stopPropagation();
                var parent = toggle.closest('.dc-dom-node');
                if (parent) parent.classList.toggle('dc-dom-expanded');
            });
        });
    }

    function renderDomNode(node, depth, maxDepth) {
        if (!node || depth > maxDepth) return '';
        if (node.id === 'dc-panel' || node.id === 'dc-trigger') return ''; // 跳过自身

        var tag = node.tagName ? node.tagName.toLowerCase() : '';
        if (!tag) return '';

        var attrs = '';
        if (node.id) attrs += ' <span class="dc-attr-name">id</span>=<span class="dc-attr-val">"' + escapeHtml(node.id) + '"</span>';
        if (node.className && typeof node.className === 'string') {
            var cls = node.className.trim();
            if (cls) attrs += ' <span class="dc-attr-name">class</span>=<span class="dc-attr-val">"' + escapeHtml(truncate(cls, 40)) + '"</span>';
        }

        var childCount = node.children ? node.children.length : 0;
        var hasChildren = childCount > 0 && depth < maxDepth;

        var html = '<div class="dc-dom-node' + (hasChildren ? ' dc-dom-has-children' : '') + '" style="padding-left:' + (depth * 16) + 'px">';

        if (hasChildren) {
            html += '<span class="dc-dom-toggle">' + SVG.expand + '</span>';
        }

        html += '<span class="dc-dom-tag">&lt;' + tag + '</span>' + attrs + '<span class="dc-dom-tag">&gt;</span>';

        if (childCount > 0) {
            html += '<span class="dc-dom-count">' + childCount + ' children</span>';
        }

        html += '</div>';

        if (hasChildren) {
            html += '<div class="dc-dom-children">';
            for (var i = 0; i < node.children.length; i++) {
                html += renderDomNode(node.children[i], depth + 1, maxDepth);
            }
            html += '</div>';
        }

        return html;
    }

    // ========== 导出功能 ==========
    function exportLogs() {
        var exportData = {
            exportTime: new Date().toISOString(),
            userAgent: navigator.userAgent,
            platform: navigator.platform || '',
            screenSize: screen.width + 'x' + screen.height,
            windowSize: window.innerWidth + 'x' + window.innerHeight,
            devicePixelRatio: window.devicePixelRatio || 1,
            url: location.href,
            memoryInfo: null,
            sessionDuration: Date.now() - (window.__devConsoleStartTime || Date.now()),
            consoleLogs: logBuffer,
            networkLogs: networkLogs,
            perfSnapshots: perfSnapshots
        };
        if (performance.memory) {
            exportData.memoryInfo = {
                usedJSHeapSize: performance.memory.usedJSHeapSize,
                totalJSHeapSize: performance.memory.totalJSHeapSize,
                jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
            };
        }

        // 同时导出持久化的历史日志
        loadPersistedLogs(function(persisted) {
            exportData.persistedLogs = persisted;

            var json = JSON.stringify(exportData, null, 2);
            var blob = new Blob([json], { type: 'application/json' });
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = 'debug-' + new Date().toISOString().replace(/[:.]/g, '-') + '.json';
            document.body.appendChild(a);
            a.click();
            setTimeout(function() {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 100);

            showToast('Logs exported');
        });
    }

    // ========== 面板显示/隐藏 ==========
    function showPanel() {
        createPanel();
        panelEl.style.height = panelHeight + 'vh';
        // 小延迟确保 DOM 就绪
        requestAnimationFrame(function() {
            panelEl.classList.add('dc-panel-visible');
            isVisible = true;
            triggerBtnEl.classList.remove('dc-trigger-visible');
            switchTab(activeTab);
        });
    }

    function hidePanel() {
        if (panelEl) {
            panelEl.classList.remove('dc-panel-visible');
        }
        if (triggerBtnEl) {
            triggerBtnEl.classList.remove('dc-trigger-visible');
        }
        isVisible = false;
    }

    function togglePanel() {
        if (isVisible) {
            panelEl.classList.remove('dc-panel-visible');
            isVisible = false;
            triggerBtnEl.classList.add('dc-trigger-visible');
        } else {
            showPanel();
        }
    }

    // ========== Toast 提示 ==========
    function showToast(msg) {
        var toast = document.createElement('div');
        toast.className = 'dc-toast';
        toast.textContent = msg;
        document.body.appendChild(toast);
        requestAnimationFrame(function() { toast.classList.add('dc-toast-visible'); });
        setTimeout(function() {
            toast.classList.remove('dc-toast-visible');
            setTimeout(function() { toast.remove(); }, 300);
        }, 1500);
    }

    // ========== 复制到剪贴板 ==========
    function copyToClipboard(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).catch(function() {});
        } else {
            var ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.left = '-9999px';
            document.body.appendChild(ta);
            ta.select();
            try { document.execCommand('copy'); } catch(e) {}
            document.body.removeChild(ta);
        }
    }

    // ========== 激活方式 ==========
    // 方式1: 三指长按 1.5s
    var touchTimer = null;
    document.addEventListener('touchstart', function(e) {
        if (e.touches.length >= CONFIG.ACTIVATION_TOUCHES) {
            touchTimer = setTimeout(function() {
                togglePanel();
            }, CONFIG.ACTIVATION_HOLD_MS);
        }
    }, { passive: true });
    document.addEventListener('touchend', function() {
        if (touchTimer) { clearTimeout(touchTimer); touchTimer = null; }
    }, { passive: true });
    document.addEventListener('touchmove', function() {
        if (touchTimer) { clearTimeout(touchTimer); touchTimer = null; }
    }, { passive: true });

    // 方式2: 快速摇晃设备（默认禁用，需通过设置或 window.__devConsoleEnableShake=true 手动启用）
    // [FIX-控制台误触] 摇晃检测在日常使用中极易误触（走路、放下手机等），改为默认关闭
    var shakeThreshold = 45;
    var lastShake = 0;
    var shakeCount = 0;
    var lastX = 0, lastY = 0, lastZ = 0;
    window.addEventListener('devicemotion', function(e) {
        // [FIX-控制台误触] 仅当开发者明确启用摇晃激活时才生效
        if (!window.__devConsoleEnableShake) return;
        var acc = e.accelerationIncludingGravity;
        if (!acc) return;
        var dx = Math.abs(acc.x - lastX);
        var dy = Math.abs(acc.y - lastY);
        var dz = Math.abs(acc.z - lastZ);
        lastX = acc.x; lastY = acc.y; lastZ = acc.z;

        if (dx + dy + dz > shakeThreshold) {
            var now = Date.now();
            if (now - lastShake < 800) {
                shakeCount++;
                if (shakeCount >= 5) {
                    shakeCount = 0;
                    togglePanel();
                }
            } else {
                shakeCount = 1;
            }
            lastShake = now;
        }
    });

    // 方式3: 键盘快捷键 (Ctrl+Shift+D)
    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
            e.preventDefault();
            togglePanel();
        }
    });

    // ========== 样式定义 ==========
    function getStyles() {
        return '' +
        /* ===== 触发按钮 ===== */
        '#dc-trigger{' +
            'position:fixed;bottom:80px;right:12px;width:40px;height:40px;' +
            'background:#1a1a1a;border:1px solid #333;border-radius:10px;' +
            'display:none;align-items:center;justify-content:center;' +
            'z-index:2147483646;cursor:pointer;color:#aaa;' +
            'box-shadow:0 2px 8px rgba(0,0,0,0.4);' +
            'touch-action:manipulation;' +
        '}' +
        '#dc-trigger svg{width:20px;height:20px;}' +
        '#dc-trigger.dc-trigger-visible{display:flex;}' +
        '#dc-trigger:active{background:#2a2a2a;}' +

        /* ===== 面板主体 ===== */
        '#dc-panel{' +
            'position:fixed;bottom:0;left:0;right:0;' +
            'height:45vh;' +
            'background:#1a1a1a;color:#d4d4d4;' +
            'font-family:"SF Mono","Menlo","Consolas","Monaco",monospace;' +
            'font-size:11px;line-height:1.5;' +
            'z-index:2147483647;' +
            'display:flex;flex-direction:column;' +
            'transform:translateY(100%);' +
            'transition:transform 0.25s ease;' +
            'border-top:1px solid #333;' +
            'box-sizing:border-box;' +
        '}' +
        '#dc-panel *{box-sizing:border-box;}' +
        '#dc-panel.dc-panel-visible{transform:translateY(0);}' +
        '#dc-panel.dc-resizing{transition:none;user-select:none;}' +

        /* ===== 拖拽手柄 ===== */
        '.dc-resize-handle{' +
            'position:absolute;top:-6px;left:0;right:0;height:12px;' +
            'cursor:ns-resize;z-index:1;' +
        '}' +
        '.dc-resize-handle::after{' +
            'content:"";display:block;width:36px;height:3px;' +
            'background:#555;border-radius:2px;' +
            'margin:5px auto 0;' +
        '}' +

        /* ===== 顶部标签栏 ===== */
        '.dc-header{' +
            'display:flex;justify-content:space-between;align-items:center;' +
            'background:#252525;border-bottom:1px solid #333;' +
            'padding:0 4px;flex-shrink:0;min-height:36px;' +
        '}' +
        '.dc-tabs{display:flex;gap:0;overflow-x:auto;-webkit-overflow-scrolling:touch;}' +
        '.dc-tab{' +
            'display:flex;align-items:center;gap:4px;' +
            'padding:6px 10px;border:none;background:transparent;' +
            'color:#888;font-size:11px;font-family:inherit;' +
            'cursor:pointer;white-space:nowrap;' +
            'border-bottom:2px solid transparent;' +
            'transition:color 0.15s,border-color 0.15s;' +
        '}' +
        '.dc-tab svg{width:14px;height:14px;flex-shrink:0;}' +
        '.dc-tab:active{background:#2a2a2a;}' +
        '.dc-tab-active{color:#fff;border-bottom-color:#fff;}' +

        /* ===== 头部操作按钮 ===== */
        '.dc-header-actions{display:flex;gap:2px;flex-shrink:0;}' +
        '.dc-btn{' +
            'display:inline-flex;align-items:center;gap:4px;' +
            'padding:4px 8px;border:1px solid #444;border-radius:4px;' +
            'background:#2a2a2a;color:#ccc;font-size:11px;font-family:inherit;' +
            'cursor:pointer;white-space:nowrap;' +
        '}' +
        '.dc-btn:active{background:#3a3a3a;}' +
        '.dc-btn svg{width:14px;height:14px;}' +
        '.dc-btn-icon{' +
            'padding:4px;border:none;background:transparent;border-radius:4px;' +
        '}' +
        '.dc-btn-icon:active{background:#333;}' +
        '.dc-btn-active{color:#4caf50;}' +
        '.dc-btn-primary{background:#333;border-color:#555;}' +
        '.dc-btn-sm{padding:2px 4px;font-size:10px;}' +
        '.dc-btn-sm svg{width:12px;height:12px;}' +

        /* ===== 工具栏 ===== */
        '.dc-toolbar{' +
            'display:flex;align-items:center;gap:6px;' +
            'padding:4px 8px;background:#222;border-bottom:1px solid #333;' +
            'flex-shrink:0;overflow-x:auto;' +
        '}' +
        '.dc-toolbar-hidden{display:none;}' +
        '.dc-filter-group{display:flex;gap:2px;}' +
        '.dc-filter-btn{' +
            'display:inline-flex;align-items:center;gap:3px;' +
            'padding:2px 8px;border:1px solid #333;border-radius:3px;' +
            'background:transparent;color:#888;font-size:10px;font-family:inherit;' +
            'cursor:pointer;white-space:nowrap;' +
        '}' +
        '.dc-filter-btn svg{width:11px;height:11px;}' +
        '.dc-filter-btn:active{background:#2a2a2a;}' +
        '.dc-filter-active{background:#333;color:#fff;border-color:#555;}' +

        /* ===== 搜索框 ===== */
        '.dc-search-box{' +
            'display:flex;align-items:center;gap:4px;margin-left:auto;' +
            'background:#2a2a2a;border:1px solid #333;border-radius:4px;' +
            'padding:2px 6px;' +
        '}' +
        '.dc-search-box svg{width:12px;height:12px;color:#666;flex-shrink:0;}' +
        '.dc-search-input{' +
            'border:none;background:transparent;color:#d4d4d4;' +
            'font-size:11px;font-family:inherit;outline:none;' +
            'width:120px;' +
        '}' +

        /* ===== 内容区域 ===== */
        '.dc-body{flex:1;overflow:hidden;position:relative;}' +
        '.dc-content{' +
            'position:absolute;top:0;left:0;right:0;bottom:0;' +
            'overflow-y:auto;overflow-x:hidden;' +
            'display:none;padding:0;' +
            '-webkit-overflow-scrolling:touch;' +
        '}' +
        '.dc-content-active{display:block;}' +

        /* ===== 日志条目 ===== */
        '.dc-log{' +
            'padding:3px 8px;border-bottom:1px solid #2a2a2a;' +
            'word-break:break-all;' +
        '}' +
        '.dc-log:hover{background:#222;}' +
        '.dc-log-row{display:flex;align-items:flex-start;gap:6px;}' +
        '.dc-log-icon{flex-shrink:0;width:14px;height:14px;display:flex;align-items:center;}' +
        '.dc-log-icon svg{width:12px;height:12px;}' +
        '.dc-log-type-error svg,.dc-log-type-promise-error svg{color:#f44336;}' +
        '.dc-log-type-warn svg{color:#ff9800;}' +
        '.dc-log-type-info svg{color:#2196f3;}' +
        '.dc-log-time{color:#666;flex-shrink:0;font-size:10px;min-width:70px;}' +
        '.dc-log-source{' +
            'color:#888;font-size:10px;' +
            'background:#2a2a2a;padding:0 4px;border-radius:2px;' +
            'flex-shrink:0;' +
        '}' +
        '.dc-log-msg{flex:1;min-width:0;color:#d4d4d4;}' +
        '.dc-log-location{color:#666;font-size:10px;flex-shrink:0;margin-left:auto;}' +

        /* 日志类型颜色 */
        '.dc-log-error .dc-log-msg,.dc-log-promise-error .dc-log-msg{color:#f44336;}' +
        '.dc-log-error,.dc-log-promise-error{background:#2a1a1a;border-bottom-color:#331a1a;}' +
        '.dc-log-warn .dc-log-msg{color:#ff9800;}' +
        '.dc-log-warn{background:#2a2510;}' +
        '.dc-log-info .dc-log-msg{color:#80cbc4;}' +
        '.dc-log-debug .dc-log-msg{color:#888;}' +
        '.dc-log-input .dc-log-msg{color:#9c27b0;}' +
        '.dc-log-output .dc-log-msg{color:#4caf50;}' +
        '.dc-prompt-icon{font-weight:bold;font-size:13px;line-height:1;}' +

        /* Stack trace */
        '.dc-log-stack{margin-top:2px;margin-left:20px;}' +
        '.dc-stack-toggle{' +
            'display:flex;align-items:center;gap:4px;' +
            'color:#666;cursor:pointer;font-size:10px;' +
        '}' +
        '.dc-stack-toggle svg{width:10px;height:10px;}' +
        '.dc-stack-content{' +
            'color:#888;font-size:10px;white-space:pre-wrap;' +
            'padding:4px 0 4px 8px;margin:2px 0 0;' +
            'border-left:2px solid #333;' +
        '}' +
        '.dc-collapsed .dc-stack-content{display:none;}' +

        /* ===== 命令输入栏 ===== */
        '#dc-input-bar{' +
            'display:flex;align-items:center;gap:6px;' +
            'padding:4px 8px;background:#222;border-top:1px solid #333;' +
            'flex-shrink:0;' +
        '}' +
        '.dc-prompt{color:#9c27b0;font-weight:bold;font-size:13px;}' +
        '.dc-cmd-input{' +
            'flex:1;border:none;background:transparent;' +
            'color:#d4d4d4;font-family:inherit;font-size:11px;' +
            'outline:none;' +
        '}' +

        /* ===== Network 面板 ===== */
        '.dc-net-table{width:100%;border-collapse:collapse;font-size:11px;}' +
        '.dc-net-table th{' +
            'text-align:left;padding:4px 8px;background:#252525;' +
            'color:#888;font-weight:normal;border-bottom:1px solid #333;' +
            'position:sticky;top:0;z-index:1;' +
        '}' +
        '.dc-net-table td{padding:4px 8px;border-bottom:1px solid #2a2a2a;}' +
        '.dc-net-row{cursor:pointer;}' +
        '.dc-net-row:hover td{background:#222;}' +
        '.dc-net-url{max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}' +
        '.dc-status-ok{color:#4caf50;}' +
        '.dc-status-redirect{color:#ff9800;}' +
        '.dc-status-error{color:#f44336;}' +
        '.dc-method{' +
            'display:inline-block;padding:0 4px;border-radius:2px;' +
            'font-size:10px;font-weight:bold;' +
        '}' +
        '.dc-method-get{color:#4caf50;}' +
        '.dc-method-post{color:#2196f3;}' +
        '.dc-method-put{color:#ff9800;}' +
        '.dc-method-delete{color:#f44336;}' +
        '.dc-net-detail{background:#1e1e1e;}' +
        '.dc-net-preview{' +
            'margin:0;padding:4px 8px;color:#888;font-size:10px;' +
            'white-space:pre-wrap;word-break:break-all;max-height:150px;overflow-y:auto;' +
        '}' +
        '.dc-collapsed{display:none;}' +

        /* ===== Storage 面板 ===== */
        '.dc-storage-section{border-bottom:1px solid #333;}' +
        '.dc-section-header{' +
            'display:flex;align-items:center;gap:6px;' +
            'padding:6px 8px;cursor:pointer;background:#222;' +
        '}' +
        '.dc-section-header svg{width:12px;height:12px;color:#888;}' +
        '.dc-section-header h3{margin:0;font-size:12px;font-weight:normal;color:#ccc;flex:1;}' +
        '.dc-section-body{max-height:300px;overflow-y:auto;}' +
        '.dc-section-collapsed .dc-section-body{display:none;}' +
        '.dc-storage-table{width:100%;border-collapse:collapse;font-size:11px;}' +
        '.dc-storage-table th{' +
            'text-align:left;padding:3px 8px;background:#1e1e1e;' +
            'color:#888;font-weight:normal;border-bottom:1px solid #333;' +
        '}' +
        '.dc-storage-table td{padding:3px 8px;border-bottom:1px solid #2a2a2a;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}' +
        '.dc-key{color:#ce9178;}' +
        '.dc-val{color:#6a9955;font-size:10px;}' +
        '.dc-size{color:#666;font-size:10px;}' +
        '.dc-storage-quota{padding:8px;color:#666;font-size:10px;text-align:center;}' +

        /* ===== Performance 面板 ===== */
        '.dc-perf-grid{' +
            'display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));' +
            'gap:8px;padding:8px;' +
        '}' +
        '.dc-perf-card{' +
            'background:#222;border:1px solid #333;border-radius:6px;' +
            'padding:10px;text-align:center;' +
        '}' +
        '.dc-perf-card-header{' +
            'display:flex;align-items:center;justify-content:center;gap:4px;' +
            'color:#888;font-size:10px;margin-bottom:6px;' +
        '}' +
        '.dc-perf-card-header svg{width:12px;height:12px;}' +
        '.dc-perf-value{font-size:22px;font-weight:bold;color:#fff;}' +
        '.dc-perf-label{color:#666;font-size:10px;margin-top:2px;}' +
        '.dc-perf-section{padding:8px;border-top:1px solid #333;}' +
        '.dc-perf-section h3{margin:0 0 8px;font-size:12px;font-weight:normal;color:#aaa;}' +
        '.dc-timing-bar{display:flex;flex-direction:column;gap:4px;}' +
        '.dc-timing-item{' +
            'display:flex;justify-content:space-between;padding:2px 8px;' +
            'background:#222;border-radius:3px;font-size:11px;' +
        '}' +
        '.dc-timing-item span:first-child{color:#888;}' +
        '.dc-timing-item span:last-child{color:#d4d4d4;}' +
        '.dc-stats-row{display:flex;gap:12px;justify-content:center;}' +
        '.dc-stat{text-align:center;}' +
        '.dc-stat-val{display:block;font-size:20px;font-weight:bold;color:#fff;}' +
        '.dc-stat-label{display:block;font-size:10px;color:#666;}' +
        '.dc-color-error{color:#f44336 !important;}' +
        '.dc-color-warn{color:#ff9800 !important;}' +
        '.dc-perf-actions{padding:8px;display:flex;gap:8px;justify-content:center;}' +

        /* ===== Chart ===== */
        '.dc-chart-container{text-align:center;}' +
        '.dc-chart{width:100%;max-width:300px;height:80px;background:#1e1e1e;border-radius:4px;}' +
        '.dc-chart-legend{display:flex;gap:12px;justify-content:center;font-size:10px;margin-top:4px;}' +

        /* ===== Elements 面板 ===== */
        '.dc-elements-tree{padding:4px 0;font-size:11px;}' +
        '.dc-dom-node{' +
            'padding:2px 8px;cursor:default;display:flex;align-items:center;gap:2px;' +
        '}' +
        '.dc-dom-node:hover{background:#222;}' +
        '.dc-dom-toggle{cursor:pointer;flex-shrink:0;width:14px;height:14px;display:flex;align-items:center;}' +
        '.dc-dom-toggle svg{width:10px;height:10px;color:#888;}' +
        '.dc-dom-tag{color:#569cd6;}' +
        '.dc-attr-name{color:#9cdcfe;}' +
        '.dc-attr-val{color:#ce9178;}' +
        '.dc-dom-count{color:#666;font-size:10px;margin-left:8px;}' +
        '.dc-dom-children{display:none;}' +
        '.dc-dom-expanded > .dc-dom-children,.dc-dom-expanded + .dc-dom-children{display:block;}' +

        /* ===== 空状态 ===== */
        '.dc-empty{' +
            'display:flex;align-items:center;justify-content:center;' +
            'height:80px;color:#555;font-size:12px;' +
        '}' +

        /* ===== Toast ===== */
        '.dc-toast{' +
            'position:fixed;bottom:50%;left:50%;transform:translate(-50%,50%) scale(0.9);' +
            'background:#333;color:#fff;padding:8px 16px;border-radius:6px;' +
            'font-size:12px;z-index:2147483647;opacity:0;' +
            'transition:opacity 0.2s,transform 0.2s;pointer-events:none;' +
        '}' +
        '.dc-toast-visible{opacity:1;transform:translate(-50%,50%) scale(1);}' +

        /* ===== 滚动条 ===== */
        '#dc-panel ::-webkit-scrollbar{width:4px;height:4px;}' +
        '#dc-panel ::-webkit-scrollbar-track{background:transparent;}' +
        '#dc-panel ::-webkit-scrollbar-thumb{background:#444;border-radius:2px;}' +
        '#dc-panel ::-webkit-scrollbar-thumb:hover{background:#555;}' +

        /* ===== 暗色主题下确保可见 ===== */
        '#dc-panel input::placeholder{color:#555;}';
    }

    // ========== 初始化 ==========
    window.__devConsoleStartTime = Date.now();

    // 预打开 DB
    openDB(function() {
        _origConsole.log('[DevConsole] IndexedDB ready');
    });

    // 记录启动时间
    pushLog({
        type: 'info',
        source: 'system',
        msg: 'DevConsole initialized | UA: ' + navigator.userAgent
    });

    // 页面可见性变化监控（检测后台崩溃恢复）
    document.addEventListener('visibilitychange', function() {
        pushLog({
            type: 'info',
            source: 'lifecycle',
            msg: 'Page visibility: ' + document.visibilityState
        });
    });

    // 页面 beforeunload 监控
    window.addEventListener('beforeunload', function() {
        persistLog({
            type: 'info',
            source: 'lifecycle',
            time: Date.now(),
            msg: 'Page unloading (beforeunload fired)'
        });
    });

    // 低内存警告 (Chrome)
    if (window.performance && window.performance.addEventListener) {
        try {
            window.performance.addEventListener('resourcetimingbufferfull', function() {
                pushLog({
                    type: 'warn',
                    source: 'perf',
                    msg: 'Resource timing buffer full'
                });
            });
        } catch(e) {}
    }

    // ========== 对外 API ==========
    window.__devConsole = {
        show: showPanel,
        hide: hidePanel,
        toggle: togglePanel,
        exportLogs: exportLogs,
        clearLogs: function() {
            logBuffer.length = 0;
            networkLogs.length = 0;
            clearPersistedLogs();
        },
        getLogs: function() { return logBuffer.slice(); },
        getNetworkLogs: function() { return networkLogs.slice(); },
        getPerfSnapshots: function() { return perfSnapshots.slice(); },
        refreshStorage: function() { if (isVisible && activeTab === 'storage') renderStoragePanel(); },
        refreshPerf: function() { if (isVisible && activeTab === 'performance') renderPerformancePanel(); },
        forceGC: function() {
            if (window.gc) {
                window.gc();
                showToast('GC triggered');
            } else {
                showToast('GC not available (need --expose-gc flag)');
            }
        },
        // 查看上次崩溃日志
        showCrashLogs: function() {
            showPanel();
            loadPersistedLogs(function(logs) {
                if (logs.length === 0) {
                    showToast('No persisted logs found');
                    return;
                }
                // 将持久化日志显示到 console 面板
                logBuffer.length = 0;
                logs.forEach(function(l) { logBuffer.push(l); });
                switchTab('console');
                showToast('Showing ' + logs.length + ' persisted logs');
            });
        }
    };

    _origConsole.log('[DevConsole] Ready. Activate: 3-finger long press / Ctrl+Shift+D / window.__devConsole.show()');

})();
