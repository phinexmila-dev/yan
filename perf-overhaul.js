// ===== perf-overhaul.js =====
// 四大性能优化方案的统一实现，解决根本性卡顿问题
// 方案1: Save Worker (JSON.stringify 移到后台线程)
// 方案2: 批量渲染 (AI生成时合并 renderHistory/save 调用)
// 方案3: 虚拟滚动 (只渲染可见区域消息)
// 方案4: 分片保存 (按 chatId 单独序列化，避免全量 stringify)
// 
// 使用方式：在 index.html 中 app-part1.js 之前加载此文件
// <script src="perf-overhaul.js?v=20260510"></script>

(function() {
'use strict';

// ============================================================
// 方案1: Save Worker — 将 JSON.stringify 移到 Web Worker
// ============================================================

var _saveWorker = null;
var _workerCallbacks = {};
var _workerMsgId = 0;
var _workerReady = false;

// 初始化 Worker
function _initSaveWorker() {
    if (_saveWorker) return;
    try {
        // 使用 Blob URL 创建 Worker（兼容 file:// 和 capacitor:// 协议）
        // 如果外部 save-worker.js 可用则优先使用
        _saveWorker = new Worker('save-worker.js');
        _saveWorker.onmessage = function(e) {
            var msg = e.data;
            if (!msg || !msg.id) return;
            var cb = _workerCallbacks[msg.id];
            if (cb) {
                delete _workerCallbacks[msg.id];
                if (msg.type.indexOf('error') !== -1) {
                    cb.reject(new Error(msg.error || 'Worker error'));
                } else {
                    cb.resolve(msg);
                }
            }
        };
        _saveWorker.onerror = function(err) {
            console.warn('[PerfOverhaul] Worker 加载失败，回退到主线程:', err);
            _saveWorker = null;
            _workerReady = false;
        };
        _workerReady = true;
    } catch (e) {
        console.warn('[PerfOverhaul] Worker 不可用:', e);
        _saveWorker = null;
        _workerReady = false;
    }
}

// 异步 stringify（Worker 可用时在后台线程执行，否则回退到主线程）
window._asyncStringify = function(data) {
    return new Promise(function(resolve, reject) {
        if (!_workerReady || !_saveWorker) {
            // 回退：主线程执行，但用 setTimeout 让出一帧
            setTimeout(function() {
                try {
                    resolve(JSON.stringify(data));
                } catch (e) {
                    reject(e);
                }
            }, 0);
            return;
        }
        var id = ++_workerMsgId;
        _workerCallbacks[id] = { resolve: function(msg) { resolve(msg.json); }, reject: reject };
        try {
            _saveWorker.postMessage({ type: 'stringify', id: id, data: data });
        } catch (e) {
            // 结构化克隆失败（如含有函数/DOM引用），回退到主线程
            delete _workerCallbacks[id];
            try {
                resolve(JSON.stringify(data));
            } catch (e2) {
                reject(e2);
            }
        }
        // 超时保护：5秒后如果 Worker 没响应，回退到主线程
        setTimeout(function() {
            if (_workerCallbacks[id]) {
                delete _workerCallbacks[id];
                try {
                    resolve(JSON.stringify(data));
                } catch (e) {
                    reject(e);
                }
            }
        }, 5000);
    });
};

// 异步分片 stringify
window._asyncStringifyShards = function(chats, chatIds) {
    return new Promise(function(resolve, reject) {
        if (!_workerReady || !_saveWorker || !chatIds || chatIds.length === 0) {
            // 回退
            var results = {};
            try {
                for (var i = 0; i < chatIds.length; i++) {
                    var cid = chatIds[i];
                    if (chats[cid]) results[cid] = JSON.stringify(chats[cid]);
                }
                resolve(results);
            } catch (e) { reject(e); }
            return;
        }
        var id = ++_workerMsgId;
        _workerCallbacks[id] = { resolve: function(msg) { resolve(msg.results); }, reject: reject };
        // 只发送需要序列化的分片数据
        var shardsToSend = {};
        for (var i = 0; i < chatIds.length; i++) {
            if (chats[chatIds[i]]) shardsToSend[chatIds[i]] = chats[chatIds[i]];
        }
        try {
            _saveWorker.postMessage({ type: 'stringify_shard', id: id, chats: shardsToSend, chatIds: chatIds });
        } catch (e) {
            delete _workerCallbacks[id];
            var results = {};
            for (var j = 0; j < chatIds.length; j++) {
                var cid2 = chatIds[j];
                if (chats[cid2]) try { results[cid2] = JSON.stringify(chats[cid2]); } catch(e2) {}
            }
            resolve(results);
        }
        // 超时保护
        setTimeout(function() {
            if (_workerCallbacks[id]) {
                delete _workerCallbacks[id];
                var results = {};
                for (var k = 0; k < chatIds.length; k++) {
                    var cid3 = chatIds[k];
                    if (chats[cid3]) try { results[cid3] = JSON.stringify(chats[cid3]); } catch(e3) {}
                }
                resolve(results);
            }
        }, 8000);
    });
};

// DOMContentLoaded 后初始化 Worker
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', _initSaveWorker);
    } else {
        _initSaveWorker();
    }
}

// ============================================================
// 方案2: 批量渲染 — AI 生成时合并 renderHistory + save 调用
// ============================================================

var _batchRenderChats = new Set();
var _batchRenderScheduled = false;
var _batchSaveDirty = false;
var _batchSaveTimer = null;

// 批量渲染：替代直接调用 renderHistory + save
// 在 AI 生成循环中使用此函数，多条消息只触发一次渲染
window._batchRenderAndSave = function(chatId) {
    _batchRenderChats.add(chatId);
    _batchSaveDirty = true;

    if (!_batchRenderScheduled) {
        _batchRenderScheduled = true;
        // 使用 queueMicrotask 确保在当前同步代码执行完后立即处理
        // 比 rAF 更快响应，但仍然合并了同一轮的所有调用
        (window.queueMicrotask || function(fn) { Promise.resolve().then(fn); })(function() {
            _batchRenderScheduled = false;
            var chats = _batchRenderChats;
            _batchRenderChats = new Set();

            // 只渲染当前活跃的聊天
            if (typeof activeChatId !== 'undefined' && chats.has(activeChatId)) {
                if (typeof renderHistory === 'function') {
                    renderHistory();
                }
            }

            // 合并 save：用防抖确保多条消息只 save 一次
            if (_batchSaveDirty) {
                _batchSaveDirty = false;
                if (_batchSaveTimer) clearTimeout(_batchSaveTimer);
                _batchSaveTimer = setTimeout(function() {
                    _batchSaveTimer = null;
                    if (typeof save === 'function') save();
                }, 150); // 150ms 防抖，比默认的 300ms 更快但仍合并
            }
        });
    }
};

// 强制刷新批量渲染（用于 AI 生成结束后确保最终状态被渲染）
window._flushBatchRender = function() {
    if (_batchRenderScheduled) {
        _batchRenderScheduled = false;
        _batchRenderChats.clear();
    }
    if (_batchSaveTimer) {
        clearTimeout(_batchSaveTimer);
        _batchSaveTimer = null;
    }
    // 强制执行一次渲染和保存
    if (typeof renderHistory === 'function') renderHistory();
    if (typeof save === 'function') save();
};

// ============================================================
// 方案2b: 生成模式 — AI生成期间抑制 save/renderHistory，结束后统一刷新
// ============================================================

var _generationMode = false;
var _genModeSavePending = false;
var _genModeRenderPending = false;

window._enterGenerationMode = function() {
    _generationMode = true;
    _genModeSavePending = false;
    _genModeRenderPending = false;
};

window._exitGenerationMode = function() {
    _generationMode = false;
    // 刷新积压的操作
    if (_genModeRenderPending) {
        if (typeof renderHistory === 'function') renderHistory();
    }
    if (_genModeSavePending) {
        if (typeof save === 'function') save();
    }
    _genModeSavePending = false;
    _genModeRenderPending = false;
};

window._isGenerationMode = function() {
    return _generationMode;
};

// AI 生成专用的高效保存+渲染
// 替代: save(); if (activeChatId === chatId) renderHistory();
window._aiMsgSaveAndRender = function(chatId, isAutoMsg) {
    // auto_msg 使用 saveNow 立即持久化（后台时 setTimeout 会被节流）
    if (isAutoMsg && typeof window.saveNow === 'function') {
        window.saveNow();
        if (typeof activeChatId !== 'undefined' && activeChatId === chatId && typeof renderHistory === 'function') {
            renderHistory();
        }
        return;
    }
    // 正常情况使用批量合并
    window._batchRenderAndSave(chatId);
};

// ============================================================
// 方案3: 虚拟滚动 — 只渲染可见区域的消息
// ============================================================

var _virtualScrollInstances = {};

window._VirtualScroll = function(containerId, options) {
    var self = this;
    this.containerId = containerId;
    this.container = null;
    this.options = Object.assign({
        itemHeight: 72,          // 估算的平均消息高度
        overscan: 5,             // 上下额外渲染的条数
        renderItem: null,        // function(item, index) => HTMLElement | string
        onLoadMore: null,        // 滚动到顶部时加载更多
        threshold: 200           // 触发加载更多的距离阈值
    }, options || {});

    this.items = [];
    this.heights = {};           // 缓存每条消息的实际高度
    this.scrollTop = 0;
    this.viewportHeight = 0;
    this.totalHeight = 0;
    this.startIdx = 0;
    this.endIdx = 0;
    this.spacerTop = null;
    this.spacerBottom = null;
    this.contentEl = null;
    this._scrollHandler = null;
    this._resizeObserver = null;
    this._initialized = false;
};

window._VirtualScroll.prototype = {
    init: function() {
        this.container = document.getElementById(this.containerId);
        if (!this.container) return false;

        // 创建内部结构
        this.container.style.overflow = 'auto';
        this.container.style.position = 'relative';

        this.spacerTop = document.createElement('div');
        this.spacerTop.className = 'vs-spacer-top';
        this.spacerTop.style.cssText = 'width:100%;pointer-events:none;';

        this.contentEl = document.createElement('div');
        this.contentEl.className = 'vs-content';

        this.spacerBottom = document.createElement('div');
        this.spacerBottom.className = 'vs-spacer-bottom';
        this.spacerBottom.style.cssText = 'width:100%;pointer-events:none;';

        this.container.innerHTML = '';
        this.container.appendChild(this.spacerTop);
        this.container.appendChild(this.contentEl);
        this.container.appendChild(this.spacerBottom);

        this.viewportHeight = this.container.clientHeight;

        // 绑定滚动事件（passive 提升性能）
        var self = this;
        this._scrollHandler = this._onScroll.bind(this);
        this.container.addEventListener('scroll', this._scrollHandler, { passive: true });

        // 监听容器大小变化
        if (typeof ResizeObserver !== 'undefined') {
            this._resizeObserver = new ResizeObserver(function() {
                self.viewportHeight = self.container.clientHeight;
                self._render();
            });
            this._resizeObserver.observe(this.container);
        }

        this._initialized = true;
        return true;
    },

    setItems: function(items, scrollToBottom) {
        this.items = items || [];
        this._recalcTotalHeight();
        this._render();
        if (scrollToBottom) {
            this.container.scrollTop = this.totalHeight;
        }
    },

    appendItems: function(newItems) {
        var wasAtBottom = this.container.scrollTop + this.viewportHeight >= this.totalHeight - 50;
        this.items = this.items.concat(newItems);
        this._recalcTotalHeight();
        this._render();
        if (wasAtBottom) {
            this.container.scrollTop = this.totalHeight;
        }
    },

    _getItemHeight: function(idx) {
        return this.heights[idx] || this.options.itemHeight;
    },

    _recalcTotalHeight: function() {
        var total = 0;
        for (var i = 0; i < this.items.length; i++) {
            total += this._getItemHeight(i);
        }
        this.totalHeight = total;
    },

    _getVisibleRange: function() {
        var scrollTop = this.container.scrollTop;
        var viewportHeight = this.viewportHeight;
        var overscan = this.options.overscan;

        var accHeight = 0;
        var startIdx = 0;
        var endIdx = this.items.length - 1;

        // 找到第一个可见的 item
        for (var i = 0; i < this.items.length; i++) {
            var h = this._getItemHeight(i);
            if (accHeight + h > scrollTop) {
                startIdx = i;
                break;
            }
            accHeight += h;
        }

        // 找到最后一个可见的 item
        var visibleHeight = 0;
        for (var j = startIdx; j < this.items.length; j++) {
            visibleHeight += this._getItemHeight(j);
            if (visibleHeight > viewportHeight) {
                endIdx = j;
                break;
            }
        }

        // 加上 overscan
        startIdx = Math.max(0, startIdx - overscan);
        endIdx = Math.min(this.items.length - 1, endIdx + overscan);

        return { start: startIdx, end: endIdx };
    },

    _onScroll: function() {
        var self = this;
        if (this._scrollRAF) return;
        this._scrollRAF = requestAnimationFrame(function() {
            self._scrollRAF = 0;
            self._render();

            // 检查是否需要加载更多（滚动到顶部）
            if (self.options.onLoadMore && self.container.scrollTop < self.options.threshold) {
                self.options.onLoadMore();
            }
        });
    },

    _render: function() {
        if (!this._initialized || !this.container) return;
        if (this.items.length === 0) {
            this.spacerTop.style.height = '0px';
            this.spacerBottom.style.height = '0px';
            this.contentEl.innerHTML = '<div style="text-align:center;padding:60px 20px;color:#999;">暂无聊天记录</div>';
            return;
        }

        var range = this._getVisibleRange();
        
        // 如果范围没变，跳过渲染
        if (range.start === this.startIdx && range.end === this.endIdx && this.contentEl.children.length > 0) {
            return;
        }

        this.startIdx = range.start;
        this.endIdx = range.end;

        // 计算上方 spacer 高度
        var topHeight = 0;
        for (var i = 0; i < range.start; i++) {
            topHeight += this._getItemHeight(i);
        }

        // 计算下方 spacer 高度
        var bottomHeight = 0;
        for (var j = range.end + 1; j < this.items.length; j++) {
            bottomHeight += this._getItemHeight(j);
        }

        this.spacerTop.style.height = topHeight + 'px';
        this.spacerBottom.style.height = bottomHeight + 'px';

        // 渲染可见区域的 items
        var fragment = document.createDocumentFragment();
        var renderFn = this.options.renderItem;

        for (var k = range.start; k <= range.end && k < this.items.length; k++) {
            if (renderFn) {
                var el = renderFn(this.items[k], k);
                if (typeof el === 'string') {
                    var wrapper = document.createElement('div');
                    wrapper.innerHTML = el;
                    while (wrapper.firstChild) {
                        fragment.appendChild(wrapper.firstChild);
                    }
                } else if (el instanceof Node) {
                    fragment.appendChild(el);
                }
            }
        }

        this.contentEl.innerHTML = '';
        this.contentEl.appendChild(fragment);

        // 测量实际高度并缓存（用于下次更精确的计算）
        var children = this.contentEl.children;
        for (var m = 0; m < children.length; m++) {
            var realIdx = range.start + m;
            var realHeight = children[m].offsetHeight;
            if (realHeight > 0) {
                this.heights[realIdx] = realHeight;
            }
        }
    },

    scrollToBottom: function() {
        if (this.container) {
            this._recalcTotalHeight();
            this.container.scrollTop = this.totalHeight;
            var self = this;
            requestAnimationFrame(function() {
                self.container.scrollTop = self.totalHeight;
            });
        }
    },

    destroy: function() {
        if (this._scrollHandler && this.container) {
            this.container.removeEventListener('scroll', this._scrollHandler);
        }
        if (this._resizeObserver) {
            this._resizeObserver.disconnect();
        }
        this._initialized = false;
    }
};

// 全局虚拟滚动实例管理
window._getVirtualScroll = function(containerId, options) {
    if (!_virtualScrollInstances[containerId]) {
        _virtualScrollInstances[containerId] = new window._VirtualScroll(containerId, options);
    }
    return _virtualScrollInstances[containerId];
};

// ============================================================
// 方案4: 分片保存 — 只序列化变化的 chatId
// ============================================================

var _shardCache = {};        // chatId -> { json: string, hash: number, timestamp: number }
var _shardCacheKeys = [];    // [PERF-LRU] 按访问顺序记录chatId，用于LRU淘汰
var _SHARD_CACHE_MAX = 30;   // [PERF-LRU] 最多缓存30个聊天的JSON，防止内存无限增长
var _storeMetaCache = null;  // store 元数据（不含 chats）的缓存

// 快速哈希：用于检测数据是否变化（比 JSON.stringify 后比较快得多）
// [FIX-哈希碰撞v2] 增强版：采样更多消息特征，大幅降低碰撞概率
// 旧版只用长度+最后2条，编辑中间消息时不会触发更新
function _quickHash(arr) {
    if (!arr || !Array.isArray(arr)) return 0;
    var h = arr.length * 2654435761; // 使用黄金比例常数作为初始混合
    var len = arr.length;
    
    // 采样策略：首条 + 末3条 + 中间等距采样（最多8个采样点）
    var sampleIndices = [0];
    if (len > 1) sampleIndices.push(len - 1);
    if (len > 2) sampleIndices.push(len - 2);
    if (len > 3) sampleIndices.push(len - 3);
    // 中间等距采样
    if (len > 8) {
        var step = Math.floor(len / 4);
        sampleIndices.push(step, step * 2, step * 3);
    }
    
    for (var i = 0; i < sampleIndices.length; i++) {
        var idx = sampleIndices[i];
        if (idx >= len) continue;
        var msg = arr[idx];
        if (!msg) continue;
        h = (h * 31 + (msg.time || 0)) | 0;
        h = (h * 31 + (msg.content ? msg.content.length : 0)) | 0;
        // 加入消息ID或角色信息，进一步区分
        if (msg.id) h = (h * 31 + (typeof msg.id === 'string' ? msg.id.charCodeAt(0) || 0 : msg.id)) | 0;
        if (msg.role) h = (h * 31 + msg.role.charCodeAt(0)) | 0;
    }
    
    return h;
}

// 检查某个聊天分片是否需要重新序列化
window._isShardDirty = function(chatId, chatData) {
    if (!chatData) return false;
    var cached = _shardCache[chatId];
    if (!cached) return true;
    var newHash = _quickHash(chatData);
    return newHash !== cached.hash;
};

// 获取分片的 JSON（有缓存则直接返回，无缓存则序列化并缓存）
// [PERF-LRU] 加入LRU淘汰机制，防止长时间使用后内存无限增长
window._getShardJSON = function(chatId, chatData) {
    if (!chatData) return null;
    var newHash = _quickHash(chatData);
    var cached = _shardCache[chatId];
    if (cached && cached.hash === newHash) {
        // LRU: 移到队尾（最近访问）
        var idx = _shardCacheKeys.indexOf(chatId);
        if (idx > -1) _shardCacheKeys.splice(idx, 1);
        _shardCacheKeys.push(chatId);
        return cached.json;
    }
    // 需要重新序列化
    var json = JSON.stringify(chatData);
    _shardCache[chatId] = { json: json, hash: newHash, timestamp: Date.now() };
    // LRU: 加入队尾
    var idx2 = _shardCacheKeys.indexOf(chatId);
    if (idx2 > -1) _shardCacheKeys.splice(idx2, 1);
    _shardCacheKeys.push(chatId);
    // LRU淘汰：超过上限时删除最久未访问的
    while (_shardCacheKeys.length > _SHARD_CACHE_MAX) {
        var evictId = _shardCacheKeys.shift();
        delete _shardCache[evictId];
    }
    return json;
};

// 获取 store 元数据的 JSON（排除 chats，因为 chats 单独分片保存）
window._getStoreMetaJSON = function(store) {
    if (!store) return '{}';
    // 创建不含 chats 的浅拷贝
    var meta = {};
    for (var key in store) {
        if (store.hasOwnProperty(key) && key !== 'chats') {
            meta[key] = store[key];
        }
    }
    return JSON.stringify(meta);
};

// 清除分片缓存（联系人删除时调用）
window._clearShardCache = function(chatId) {
    if (chatId) {
        delete _shardCache[chatId];
    } else {
        _shardCache = {};
    }
};

// 获取所有脏分片的 ID 列表
window._getDirtyShardIds = function(store) {
    if (!store || !store.chats) return [];
    var dirty = [];
    for (var cid in store.chats) {
        if (store.chats.hasOwnProperty(cid)) {
            if (window._isShardDirty(cid, store.chats[cid])) {
                dirty.push(cid);
            }
        }
    }
    return dirty;
};

// ============================================================
// 整合：增强版 _doSaveNow 包装器
// ============================================================

// 标记是否正在使用 Worker 进行异步保存
var _asyncSaveInProgress = false;

// 增强版保存：优先使用 Worker 异步序列化，减少主线程阻塞
// 这个函数会被注入到 app-part1.js 的保存流程中
window._enhancedStringify = function(store) {
    // 如果 Worker 可用且不在紧急保存场景（如 beforeunload），使用异步
    if (_workerReady && _saveWorker && !document.hidden) {
        return window._asyncStringify(store);
    }
    // 否则同步执行（紧急场景不能异步）
    return Promise.resolve(JSON.stringify(store));
};

// ============================================================
// 方案3补充: renderHistory 虚拟滚动适配器
// ============================================================

// 当消息数量超过此阈值时，启用虚拟滚动
var VIRTUAL_SCROLL_THRESHOLD = 50;

// 虚拟滚动模式标记
window._useVirtualScroll = false;
window._virtualScrollActive = false;

// 检查是否应该启用虚拟滚动
window._shouldUseVirtualScroll = function(msgCount) {
    return msgCount > VIRTUAL_SCROLL_THRESHOLD;
};

// 虚拟滚动的 renderHistory 替代实现
// 当消息数量超过阈值时，由此函数接管渲染
window._virtualRenderHistory = function(msgs, chatId, appendMsgRowFn, options) {
    var container = document.getElementById('chat-history');
    if (!container || !msgs || msgs.length === 0) return false;

    // 消息数量不够多，不需要虚拟滚动
    if (msgs.length <= VIRTUAL_SCROLL_THRESHOLD) {
        window._virtualScrollActive = false;
        return false; // 返回 false 表示未接管，让原始 renderHistory 执行
    }

    window._virtualScrollActive = true;

    var vs = window._getVirtualScroll('chat-history', {
        itemHeight: 72,
        overscan: 8,
        renderItem: function(msg, idx) {
            if (appendMsgRowFn) {
                // 使用现有的 appendMsgRow 函数渲染单条消息
                var tempDiv = document.createElement('div');
                try {
                    appendMsgRowFn(msg, idx, false, tempDiv, options.currentChat);
                    return tempDiv.firstChild || tempDiv;
                } catch (e) {
                    return '<div class="msg-row" style="padding:8px;color:red;">渲染失败</div>';
                }
            }
            return '';
        },
        onLoadMore: options.onLoadMore || null
    });

    if (!vs._initialized) {
        vs.init();
    }

    vs.setItems(msgs, !options.keepScroll);
    return true; // 返回 true 表示已接管渲染
};

// ============================================================
// 性能监控：帧率检测 + 自动降级
// ============================================================

var _fpsHistory = [];
var _fpsCheckInterval = null;
var _lastFrameTime = 0;
var _frameCount = 0;
var _autoDowngraded = false;

// 启动 FPS 监控
window._startFPSMonitor = function() {
    if (_fpsCheckInterval) return;

    function countFrame() {
        _frameCount++;
        if (_lastFrameTime === 0) _lastFrameTime = performance.now();
        requestAnimationFrame(countFrame);
    }
    requestAnimationFrame(countFrame);

    _fpsCheckInterval = setInterval(function() {
        var now = performance.now();
        var elapsed = now - _lastFrameTime;
        if (elapsed > 0) {
            var fps = Math.round((_frameCount / elapsed) * 1000);
            _fpsHistory.push(fps);
            if (_fpsHistory.length > 10) _fpsHistory.shift();

            // 如果连续5秒 FPS < 20，自动启用低性能模式
            if (_fpsHistory.length >= 5 && !_autoDowngraded) {
                var avgFps = _fpsHistory.reduce(function(a, b) { return a + b; }, 0) / _fpsHistory.length;
                if (avgFps < 20) {
                    _autoDowngraded = true;
                    console.warn('[PerfOverhaul] FPS过低 (' + avgFps.toFixed(1) + ')，自动启用低性能模式');
                    if (typeof window._enableLowPerfMode === 'function') {
                        window._enableLowPerfMode();
                    }
                }
            }
        }
        _frameCount = 0;
        _lastFrameTime = now;
    }, 1000);
};

// ============================================================
// ============================================================
// 方案5: 全局定时器拦截 — iOS上页面不可见时暂停所有非关键定时器
// ============================================================

var _isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

// 只在iOS上启用全局定时器拦截（iOS发热的主要原因是定时器过多）
if (_isIOS && typeof window !== 'undefined') {
    var _origSetInterval = window.setInterval;
    var _origClearInterval = window.clearInterval;
    var _allIntervals = {}; // id -> { fn, delay, paused, origId }
    var _nextFakeId = 900000; // 避免和真实ID冲突
    var _timersPaused = false;
    
    // 白名单：这些关键词在调用栈中出现时不暂停
    var _criticalPatterns = ['proactiveCheck', 'saveNow', '_doSaveNow', 'emergency'];
    
    window.setInterval = function(fn, delay) {
        // [PERF-优化] 只在页面不可见时才强制提升间隔到5秒
        // 前台时保持原始间隔，避免影响UI动画和交互体验
        var adjustedDelay = delay;
        if (_isIOS && delay < 5000 && document.hidden) {
            adjustedDelay = Math.max(delay, 5000); // iOS后台最低5秒间隔
        }
        
        var realId = _origSetInterval.call(window, fn, adjustedDelay);
        var fakeId = _nextFakeId++;
        _allIntervals[fakeId] = {
            fn: fn,
            delay: adjustedDelay,
            originalDelay: delay,
            realId: realId,
            paused: false,
            critical: false
        };
        return fakeId;
    };
    
    window.clearInterval = function(id) {
        if (_allIntervals[id]) {
            _origClearInterval.call(window, _allIntervals[id].realId);
            delete _allIntervals[id];
        } else {
            // 可能是直接用原始setInterval创建的
            _origClearInterval.call(window, id);
        }
    };
    
    // 页面不可见时暂停所有定时器
    window._pauseAllTimers = function() {
        if (_timersPaused) return;
        _timersPaused = true;
        var pausedCount = 0;
        for (var id in _allIntervals) {
            var t = _allIntervals[id];
            if (!t.paused && !t.critical) {
                _origClearInterval.call(window, t.realId);
                t.paused = true;
                pausedCount++;
            }
        }
        console.log('[PerfOverhaul-iOS] 页面隐藏，暂停了 ' + pausedCount + ' 个定时器');
    };
    
    // 页面可见时恢复所有定时器
    window._resumeAllTimers = function() {
        if (!_timersPaused) return;
        _timersPaused = false;
        var resumedCount = 0;
        for (var id in _allIntervals) {
            var t = _allIntervals[id];
            if (t.paused) {
                t.realId = _origSetInterval.call(window, t.fn, t.delay);
                t.paused = false;
                resumedCount++;
            }
        }
        console.log('[PerfOverhaul-iOS] 页面可见，恢复了 ' + resumedCount + ' 个定时器');
    };
    
    // 获取当前活跃定时器数量（调试用）
    window._getTimerStats = function() {
        var active = 0, paused = 0, total = 0;
        for (var id in _allIntervals) {
            total++;
            if (_allIntervals[id].paused) paused++;
            else active++;
        }
        return { active: active, paused: paused, total: total, isIOS: true };
    };
    
    // 监听页面可见性
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            window._pauseAllTimers();
        } else {
            window._resumeAllTimers();
        }
    });
    
    console.log('[PerfOverhaul-iOS] 全局定时器拦截已启用：最低间隔5秒 + 页面隐藏时自动暂停');
    
    // [FIX-iOS发热-2026-05-12] 定时器拦截器内存泄漏修复
    // _allIntervals 对象在长时间使用后会无限增长（interval创建后未clearInterval的情况）
    // 每60秒清理一次已经不存在的定时器引用
    var _TIMER_CACHE_MAX = 100;
    _origSetInterval.call(window, function() {
        var keys = Object.keys(_allIntervals);
        if (keys.length > _TIMER_CACHE_MAX) {
            // 清理已暂停超过5分钟的定时器（可能是泄漏的）
            var now = Date.now();
            var cleaned = 0;
            for (var i = 0; i < keys.length && keys.length - cleaned > _TIMER_CACHE_MAX / 2; i++) {
                var t = _allIntervals[keys[i]];
                if (t && t.paused && t._pausedAt && (now - t._pausedAt > 300000)) {
                    delete _allIntervals[keys[i]];
                    cleaned++;
                }
            }
            if (cleaned > 0) {
                console.log('[PerfOverhaul-iOS] 清理了 ' + cleaned + ' 个泄漏的定时器引用');
            }
        }
    }, 60000);
    
    // 增强 _pauseAllTimers：记录暂停时间戳
    var _origPauseAll = window._pauseAllTimers;
    window._pauseAllTimers = function() {
        _origPauseAll();
        var now = Date.now();
        for (var id in _allIntervals) {
            if (_allIntervals[id].paused) {
                _allIntervals[id]._pausedAt = now;
            }
        }
    };
}

// ============================================================
// 方案6: [FIX-iOS发热-2026-05-12] iOS 快速滚动检测 + GPU 内存释放
// ============================================================

if (_isIOS && typeof document !== 'undefined') {
    
    // 6a. 快速滚动检测：滚动时添加 ios-fast-scroll class 禁用视觉特效
    (function() {
        var _scrollTimer = null;
        var _lastScrollY = 0;
        var _scrollSpeed = 0;
        var _FAST_SCROLL_THRESHOLD = 800; // px/s
        var _isScrolling = false;
        
        function onScrollStart() {
            if (!_isScrolling) {
                _isScrolling = true;
                // 不立即添加class，等确认是快速滚动
            }
        }
        
        function onScrollEnd() {
            _isScrolling = false;
            _scrollSpeed = 0;
            document.body.classList.remove('ios-fast-scroll');
        }
        
        // 使用 passive 事件监听，不阻塞滚动
        document.addEventListener('scroll', function() {
            var now = performance.now();
            var currentY = window.scrollY || document.documentElement.scrollTop;
            
            if (_scrollTimer) clearTimeout(_scrollTimer);
            _scrollTimer = setTimeout(onScrollEnd, 150);
            
            // 计算滚动速度
            if (_lastScrollY !== 0) {
                var delta = Math.abs(currentY - _lastScrollY);
                if (delta > _FAST_SCROLL_THRESHOLD / 10) {
                    // 快速滚动中
                    if (!document.body.classList.contains('ios-fast-scroll')) {
                        document.body.classList.add('ios-fast-scroll');
                    }
                }
            }
            _lastScrollY = currentY;
            onScrollStart();
        }, { passive: true, capture: true });
        
        // 也监听聊天历史等内部滚动容器
        document.addEventListener('DOMContentLoaded', function() {
            var scrollContainers = ['chat-history', 'offline-chat-history', 'moments-feed', 'contact-list'];
            scrollContainers.forEach(function(id) {
                var el = document.getElementById(id);
                if (el) {
                    el.addEventListener('scroll', function() {
                        if (_scrollTimer) clearTimeout(_scrollTimer);
                        _scrollTimer = setTimeout(onScrollEnd, 150);
                        
                        if (!document.body.classList.contains('ios-fast-scroll')) {
                            document.body.classList.add('ios-fast-scroll');
                        }
                    }, { passive: true });
                }
            });
        });
    })();
    
    // 6b. GPU 内存释放：页面切换时清理不可见 layer 的 GPU 合成层
    (function() {
        // 监听 layer 的 show/hide 变化
        var _layerObserver = null;
        
        function releaseLayerGPU(layer) {
            // 强制释放 GPU 合成层
            layer.style.willChange = 'auto';
            layer.style.transform = 'none';
            // 清除所有子元素的 will-change
            var children = layer.querySelectorAll('[style*="will-change"]');
            for (var i = 0; i < children.length; i++) {
                children[i].style.willChange = 'auto';
            }
        }
        
        function prepareLayerGPU(layer) {
            // 即将显示的 layer 准备 GPU 加速
            layer.style.willChange = 'transform';
        }
        
        document.addEventListener('DOMContentLoaded', function() {
            // 使用 MutationObserver 监听 layer 的 class 变化
            if (typeof MutationObserver !== 'undefined') {
                _layerObserver = new MutationObserver(function(mutations) {
                    mutations.forEach(function(m) {
                        if (m.type === 'attributes' && m.attributeName === 'class') {
                            var el = m.target;
                            if (el.classList.contains('layer')) {
                                if (el.classList.contains('show')) {
                                    prepareLayerGPU(el);
                                } else {
                                    // 延迟释放，等动画结束
                                    setTimeout(function() {
                                        if (!el.classList.contains('show')) {
                                            releaseLayerGPU(el);
                                        }
                                    }, 350);
                                }
                            }
                        }
                    });
                });
                
                // 观察所有 layer 元素
                var layers = document.querySelectorAll('.layer');
                layers.forEach(function(layer) {
                    _layerObserver.observe(layer, { attributes: true, attributeFilter: ['class'] });
                    // 初始状态：释放未显示的 layer
                    if (!layer.classList.contains('show')) {
                        releaseLayerGPU(layer);
                    }
                });
                
                console.log('[PerfOverhaul-iOS] GPU内存释放机制已启用，监控 ' + layers.length + ' 个layer');
            }
        });
    })();
    
    // 6c. iOS 低电量/发热检测：通过 Battery API 或帧率下降自动降级
    (function() {
        var _thermalDowngraded = false;
        var _frameTimestamps = [];
        var _thermalCheckRAF = null;
        
        function checkThermalState() {
            // 通过连续帧时间检测是否发热降频
            var now = performance.now();
            _frameTimestamps.push(now);
            
            // 保留最近30帧
            if (_frameTimestamps.length > 30) _frameTimestamps.shift();
            
            // 每30帧检测一次
            if (_frameTimestamps.length >= 30 && !_thermalDowngraded) {
                var totalTime = _frameTimestamps[29] - _frameTimestamps[0];
                var avgFrameTime = totalTime / 29;
                var estimatedFPS = 1000 / avgFrameTime;
                
                // 如果帧率持续低于 30fps，说明设备可能在发热降频
                if (estimatedFPS < 30) {
                    _thermalDowngraded = true;
                    console.warn('[PerfOverhaul-iOS] 检测到帧率过低(' + estimatedFPS.toFixed(1) + 'fps)，启用热保护模式');
                    document.body.classList.add('low-fps-mode');
                    document.body.classList.add('low-perf-mode');
                    
                    // 5分钟后尝试恢复
                    setTimeout(function() {
                        _thermalDowngraded = false;
                        _frameTimestamps = [];
                        // 不自动移除 class，让用户手动恢复或下次检测通过后恢复
                    }, 300000);
                    
                    return; // 停止检测
                }
            }
            
            _thermalCheckRAF = requestAnimationFrame(checkThermalState);
        }
        
        // 延迟10秒启动热检测（等页面稳定后）
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(function() {
                _thermalCheckRAF = requestAnimationFrame(checkThermalState);
            }, 10000);
        });
        
        // 页面不可见时停止检测
        document.addEventListener('visibilitychange', function() {
            if (document.hidden) {
                if (_thermalCheckRAF) {
                    cancelAnimationFrame(_thermalCheckRAF);
                    _thermalCheckRAF = null;
                }
            } else {
                if (!_thermalDowngraded && !_thermalCheckRAF) {
                    _frameTimestamps = [];
                    _thermalCheckRAF = requestAnimationFrame(checkThermalState);
                }
            }
        });
    })();
}

// ============================================================
// iOS 专用：禁用 perf-overhaul 自身的 FPS 监控（iOS上不需要）
// ============================================================

// 初始化
// ============================================================

if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function() {
        // [PERF-iOS发热修复] iOS上不启动FPS监控（它本身就是一个rAF循环+setInterval）
        if (!_isIOS) {
            setTimeout(function() {
                window._startFPSMonitor();
            }, 5000);
        }

        console.log('[PerfOverhaul] 性能优化模块已加载 (Worker=' + _workerReady + ', iOS=' + _isIOS + ')');
    });
}

})();
