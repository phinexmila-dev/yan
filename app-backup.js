// ========== YAN 自动备份模块 (Local BackupManager v1) ==========
// 功能：
//   1. 本地多版本备份（IndexedDB 独立 store）
//   2. 应用启动时检查 + 运行时定时器双保险
//   3. 自动轮转清理（保留最近 N 份，防止占用过大空间）
//   4. 手动备份、列表、恢复、删除、导出为文件
//   5. 纯本地，不上传任何数据，保护隐私
// ============================================================

(function(global){
    'use strict';

    // ===== 配置常量 =====
    var BK_DB_NAME = 'YAN_Backup_DB';          // 独立于主数据库，避免互相影响
    var BK_STORE = 'backups';                  // 备份快照列表
    var BK_META_STORE = 'meta';                // 备份设置元数据
    var BK_DB_VERSION = 1;

    var LS_SETTINGS_KEY = 'yan_backup_settings';  // 设置缓存（快速读取，不依赖 IDB）
    var LS_LAST_TIME_KEY = 'yan_backup_last_time'; // 上次备份时间戳

    // 默认设置
    var DEFAULT_SETTINGS = {
        enabled: true,                 // [FIX-B1] 默认开启自动备份，避免用户不知道要手动开启导致列表为空
        intervalHours: 24,             // 备份间隔（小时），可选 6/12/24/72
        maxBackups: 5,                 // 最多保留的备份份数
        // [FIX-BACKUP-LOSS] 默认改为 false（完整备份）。
        // 旧版本默认 true 会把所有大于 500KB 的 base64 图片替换成占位符字符串，
        // 再叠加恢复时粗暴覆盖逻辑，导致用户图片数据/聊天记录恢复后全部丢失。
        // 现在用户即使开启自动备份，也默认保留全部数据；需要节省空间可手动打开开关。
        skipBase64: false,
        lastBackupTime: 0,             // 上次备份时间戳
        lastBackupResult: '',          // 上次备份结果：success / failed / skipped
        lastBackupError: ''            // [FIX-B3] 上次备份失败原因
    };

    // 运行时定时器
    var _runtimeTimer = null;
    var _initialized = false;

    // ===== 独立 IndexedDB =====
    var _bkDbPromise = null;
    function _openBkDb() {
        if (_bkDbPromise) return _bkDbPromise;
        _bkDbPromise = new Promise(function(resolve) {
            try {
                var req = indexedDB.open(BK_DB_NAME, BK_DB_VERSION);
                req.onupgradeneeded = function(e) {
                    var db = e.target.result;
                    if (!db.objectStoreNames.contains(BK_STORE)) {
                        // keyPath=id, id=时间戳字符串
                        db.createObjectStore(BK_STORE, { keyPath: 'id' });
                    }
                    if (!db.objectStoreNames.contains(BK_META_STORE)) {
                        db.createObjectStore(BK_META_STORE);
                    }
                };
                req.onsuccess = function(e) { resolve(e.target.result); };
                req.onerror = function(e) {
                    console.warn('[Backup] IndexedDB 打开失败:', e.target.error);
                    // [OPT-IDB重试] 失败时清除缓存，允许下次调用重新尝试打开
                    _bkDbPromise = null;
                    resolve(null);
                };
            } catch(e) {
                console.warn('[Backup] IndexedDB 不可用:', e);
                // [OPT-IDB重试] 异常时也清除缓存
                _bkDbPromise = null;
                resolve(null);
            }
        });
        return _bkDbPromise;
    }

    function _bkPut(record) {
        return _openBkDb().then(function(db) {
            if (!db) return Promise.reject(new Error('IndexedDB 不可用'));
            return new Promise(function(resolve, reject) {
                try {
                    var tx = db.transaction(BK_STORE, 'readwrite');
                    var store = tx.objectStore(BK_STORE);
                    var req = store.put(record);
                    req.onsuccess = function() { resolve(); };
                    req.onerror = function(e) { reject(e.target.error); };
                } catch(e) { reject(e); }
            });
        });
    }

    function _bkGet(id) {
        return _openBkDb().then(function(db) {
            if (!db) return null;
            return new Promise(function(resolve) {
                try {
                    var tx = db.transaction(BK_STORE, 'readonly');
                    var store = tx.objectStore(BK_STORE);
                    var req = store.get(id);
                    req.onsuccess = function() { resolve(req.result || null); };
                    req.onerror = function() { resolve(null); };
                } catch(e) { resolve(null); }
            });
        });
    }

    function _bkDelete(id) {
        return _openBkDb().then(function(db) {
            if (!db) return;
            return new Promise(function(resolve) {
                try {
                    var tx = db.transaction(BK_STORE, 'readwrite');
                    var store = tx.objectStore(BK_STORE);
                    var req = store.delete(id);
                    req.onsuccess = function() { resolve(); };
                    req.onerror = function() { resolve(); };
                } catch(e) { resolve(); }
            });
        });
    }

    // 获取所有备份（仅元数据，不含 data 大对象，避免一次性占用大量内存）
    function _bkListMeta() {
        return _openBkDb().then(function(db) {
            if (!db) return [];
            return new Promise(function(resolve) {
                try {
                    var tx = db.transaction(BK_STORE, 'readonly');
                    var store = tx.objectStore(BK_STORE);
                    var result = [];
                    var req = store.openCursor();
                    req.onsuccess = function(e) {
                        var cursor = e.target.result;
                        if (cursor) {
                            var v = cursor.value || {};
                            // 只取元数据字段
                            result.push({
                                id: v.id,
                                createdAt: v.createdAt,
                                type: v.type,
                                size: v.size || 0,
                                label: v.label || '',
                                skipBase64: !!v.skipBase64
                            });
                            cursor.continue();
                        } else {
                            // 按时间倒序（最新在前）
                            result.sort(function(a,b){ return (b.createdAt||0) - (a.createdAt||0); });
                            resolve(result);
                        }
                    };
                    req.onerror = function() { resolve([]); };
                } catch(e) { resolve([]); }
            });
        });
    }

    // ===== 设置读写（优先 localStorage 做快速读，IDB 兜底） =====
    function _loadSettings() {
        try {
            var raw = localStorage.getItem(LS_SETTINGS_KEY);
            if (raw) {
                var parsed = JSON.parse(raw);
                return Object.assign({}, DEFAULT_SETTINGS, parsed);
            }
        } catch(e) {}
        return Object.assign({}, DEFAULT_SETTINGS);
    }

    function _saveSettings(settings) {
        try {
            localStorage.setItem(LS_SETTINGS_KEY, JSON.stringify(settings));
        } catch(e) {
            console.warn('[Backup] 保存设置失败:', e);
        }
    }

    // ===== Toast 兼容 =====
    function _toast(msg, type) {
        if (typeof global.toast === 'function') {
            try { global.toast(msg, type); return; } catch(e) {}
        }
        console.log('[Backup]', msg);
    }

    // ===== 占位符常量（与恢复逻辑配合，用于识别"空洞"字段） =====
    var PLACEHOLDER_BASE64 = '[base64_excluded_for_backup]';
    var PLACEHOLDER_CIRCULAR = '[Circular]';
    // 判断某个字符串值是否是占位符（恢复时应当跳过，不能覆盖真实数据）
    function _isPlaceholder(v) {
        return v === PLACEHOLDER_BASE64 || v === PLACEHOLDER_CIRCULAR;
    }

    // ===== store 序列化（复用 exportData 的安全策略） =====
    // [FIX-BACKUP-LOSS] 手动备份默认完整保留所有数据；
    // 仅在显式 skipBase64=true 时才裁剪超大 base64 图片（用于自动备份节省空间）。
    function _serializeStore(opts) {
        opts = opts || {};
        // [FIX-BACKUP-LOSS] 默认 false，只有显式传入 true 才排除；
        // 历史默认值(true)导致用户的图片数据全部变占位符，配合恢复覆盖逻辑造成数据丢失。
        var skipBase64 = opts.skipBase64 === true;

        // [FIX-BACKUP-BRIDGE] store 是 app-part1.js 的局部变量，
        // 必须通过 __getAppStore() 获取最新引用，否则 window.store 为 undefined 导致备份永远为空。
        var store = (typeof global.__getAppStore === 'function') ? global.__getAppStore() : global.store;
        if (!store) return null;

        var seen = new WeakSet();
        try {
            var dataStr = JSON.stringify(store, function(key, value) {
                if (typeof value === 'object' && value !== null) {
                    if (seen.has(value)) return PLACEHOLDER_CIRCULAR;
                    seen.add(value);
                }
                if (skipBase64 && typeof value === 'string') {
                    // 单个 base64 > 500KB 被裁剪（聊天图片、壁纸等）
                    if (value.length > 500 * 1024 && value.startsWith('data:image')) {
                        return PLACEHOLDER_BASE64;
                    }
                }
                // [FIX-导出解析] 清理字符串中的非法控制字符 + \u2028\u2029（部分WebView JSON.parse敏感）
                if (typeof value === 'string') {
                    return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u2028\u2029]/g, '');
                }
                // 临时标记字段不应进入备份
                if (key === '_importedAt') return undefined;
                return value;
            });
            return dataStr;
        } catch(e) {
            console.error('[Backup] 序列化失败:', e);
            return null;
        }
    }

    // ===== 执行一次备份 =====
    // type: 'auto' | 'manual' | 'startup' | 'pre-restore'
    function performBackup(type) {
        type = type || 'manual';
        return new Promise(function(resolve, reject) {
            // 释放主线程，避免卡顿
            setTimeout(function(){
                try {
                    var settings = _loadSettings();
                    // [FIX-BACKUP-LOSS] 手动备份/恢复前安全备份 强制完整（不允许排除 base64）；
                    // 只有自动/启动备份才尊重用户 skipBase64 设置（可能为了省空间）。
                    var forceFull = (type === 'manual' || type === 'pre-restore');
                    var actualSkipBase64 = forceFull ? false : !!settings.skipBase64;

                    var dataStr = _serializeStore({ skipBase64: actualSkipBase64 });
                    if (!dataStr || dataStr.length < 50) {
                        return reject(new Error('数据为空或无效'));
                    }

                    var now = Date.now();
                    var id = 'bk_' + now + '_' + Math.random().toString(36).slice(2, 8);
                    var record = {
                        id: id,
                        createdAt: now,
                        type: type,
                        size: dataStr.length,
                        label: _makeLabel(type, now),
                        skipBase64: actualSkipBase64,
                        data: dataStr   // JSON 字符串
                    };

                    _bkPut(record).then(function(){
                        // 更新设置
                        settings.lastBackupTime = now;
                        settings.lastBackupResult = 'success';
                        _saveSettings(settings);
                        try { localStorage.setItem(LS_LAST_TIME_KEY, String(now)); } catch(e){}

                        // 轮转清理
                        _rotateBackups(settings.maxBackups).then(function(){
                            resolve(record);
                        });
                    }).catch(function(err){
                        settings.lastBackupResult = 'failed';
                        settings.lastBackupError = (err && err.message) || String(err);
                        _saveSettings(settings);
                        _toast('备份失败：' + settings.lastBackupError, 'error');
                        reject(err);
                    });
                } catch(e) {
                    reject(e);
                }
            }, 20);
        });
    }

    function _makeLabel(type, ts) {
        var d = new Date(ts);
        var pad = function(n){ return n < 10 ? '0' + n : String(n); };
        var stamp = d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate()) +
                    ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
        var typeMap = {
            auto: '自动备份',
            manual: '手动备份',
            startup: '启动备份',
            'pre-restore': '恢复前快照' // [FIX-BACKUP-LOSS]
        };
        return (typeMap[type] || '备份') + ' · ' + stamp;
    }

    // 轮转：按时间倒序，保留最新 max 份
    // [FIX-BACKUP-LOSS] "pre-restore" 类型（恢复前安全快照）单独保留最近 3 份，
    // 不占用普通备份的 max 配额，避免用户恢复后无法回滚。
    function _rotateBackups(max) {
        max = Math.max(1, max || 5);
        var MAX_PRE_RESTORE = 3;
        return _bkListMeta().then(function(list){
            var preRestore = list.filter(function(x){ return x.type === 'pre-restore'; });
            var normal = list.filter(function(x){ return x.type !== 'pre-restore'; });
            var chain = Promise.resolve();

            // 普通备份按时间倒序保留 max 份
            if (normal.length > max) {
                var toDelNormal = normal.slice(max);
                toDelNormal.forEach(function(item){
                    chain = chain.then(function(){ return _bkDelete(item.id); });
                });
            }
            // pre-restore 单独保留最近 N 份
            if (preRestore.length > MAX_PRE_RESTORE) {
                var toDelPre = preRestore.slice(MAX_PRE_RESTORE);
                toDelPre.forEach(function(item){
                    chain = chain.then(function(){ return _bkDelete(item.id); });
                });
            }
            return chain;
        });
    }

    // ===== 恢复某个备份 =====
    // [FIX-BACKUP-LOSS] 恢复前先自动做一次"pre-restore"完整快照作为回滚点，
    // 并在合并时跳过占位符字段，避免旧备份的"[base64_excluded_for_backup]"
    // 把当前真实图片数据覆盖丢失。
    function restoreBackup(id) {
        // [FIX-数据丢失终极修复] 恢复期间阻止 _doSaveNow 并发写入，防止竞态覆盖恢复数据
        if (global._loadIntegrity) global._loadIntegrity.isRestoring = true;
        
        return _bkGet(id).then(function(record){
            if (!record || !record.data) {
                if (global._loadIntegrity) global._loadIntegrity.isRestoring = false;
                throw new Error('备份不存在或已损坏');
            }
            var parsed;
            try {
                parsed = JSON.parse(record.data);
            } catch(e) {
                if (global._loadIntegrity) global._loadIntegrity.isRestoring = false;
                throw new Error('备份数据解析失败: ' + e.message);
            }

            // [FIX-BACKUP-LOSS] 恢复前先做一次 pre-restore 安全备份（强制完整，不排除图片）
            // 失败不阻断主流程（可能是 IDB 空间不足等），但尽力而为。
            var preBackupPromise = performBackup('pre-restore').catch(function(err){
                console.warn('[Backup] 恢复前安全备份失败（继续恢复）:', err);
                return null;
            });

            return preBackupPromise.then(function(){
                return _applyRestore(parsed);
            }).then(function(result){
                // [FIX-数据丢失终极修复] 恢复成功后刷新页面，确保内存store与IDB一致
                // 不刷新的话，_doSaveNow 可能用旧的内存store覆盖刚恢复的IDB数据
                _toast('恢复成功，正在刷新页面...', 'success');
                setTimeout(function(){
                    location.reload();
                }, 1500);
                return result;
            }).catch(function(err){
                if (global._loadIntegrity) global._loadIntegrity.isRestoring = false;
                throw err;
            });
        }).catch(function(err){
            if (global._loadIntegrity) global._loadIntegrity.isRestoring = false;
            throw err;
        });
    }

    // [FIX-BACKUP-LOSS] 深度合并：跳过占位符字符串，递归合并对象/数组，
    // 保留 current 中存在但 incoming 中是占位符的值。
    // 规则：
    //   - 如果 incoming 是占位符字符串 -> 保留 current（不覆盖！）
    //   - 如果 incoming 是 null/undefined 且 current 有值 -> 保留 current
    //   - 如果两者都是纯对象 -> 递归合并
    //   - 否则 -> 用 incoming 覆盖
    // 数组整体替换（不深度合并），因为短信/聊天记录等以整体列表语义存在，
    // 用增量合并容易产生重复/错乱。但若 incoming 是占位符仍保留 current。
    function _mergeSkipPlaceholder(current, incoming) {
        // incoming 直接是占位符 -> 放弃这次覆盖
        if (typeof incoming === 'string' && _isPlaceholder(incoming)) {
            return current;
        }
        if (incoming === undefined) return current;
        if (incoming === null) {
            // 允许显式置空，但如果 current 本来有值则保留，避免无意清空
            return current !== undefined ? current : null;
        }
        // 两者均为纯对象 -> 递归合并
        if (
            current && typeof current === 'object' && !Array.isArray(current) &&
            incoming && typeof incoming === 'object' && !Array.isArray(incoming)
        ) {
            var out = {};
            // 先拷贝 current 的所有 key（防止丢失 incoming 中没有的字段）
            for (var k1 in current) {
                if (Object.prototype.hasOwnProperty.call(current, k1)) out[k1] = current[k1];
            }
            // 再用 incoming 的 key 合并
            for (var k2 in incoming) {
                if (!Object.prototype.hasOwnProperty.call(incoming, k2)) continue;
                out[k2] = _mergeSkipPlaceholder(current ? current[k2] : undefined, incoming[k2]);
            }
            return out;
        }
        // 数组或基本类型 -> 直接覆盖（前面已经过滤了占位符）
        return incoming;
    }

    function _applyRestore(parsed) {
        return new Promise(function(resolve, reject){
            try {
                // [FIX-BACKUP-BRIDGE] 通过 __getAppStore() 获取 store 引用
                var store = (typeof global.__getAppStore === 'function') ? global.__getAppStore() : global.store;
                if (!store) return reject(new Error('store 未初始化'));

                // [FIX-恢复丢数据-v2] 简化恢复策略：直接覆盖，只跳过占位符字段
                // 不再做复杂的递归深度合并（旧方案容易导致数据结构混乱）
                // 策略：备份中的值直接覆盖store，但占位符值保留当前store的真实值
                var _skippedPlaceholders = 0;
                for (var key in parsed) {
                    if (!Object.prototype.hasOwnProperty.call(parsed, key)) continue;
                    if (key.charAt(0) === '_') continue; // 跳过元数据
                    try {
                        var incoming = parsed[key];
                        // 顶层占位符 -> 跳过，保留 store[key]
                        if (typeof incoming === 'string' && _isPlaceholder(incoming)) {
                            _skippedPlaceholders++;
                            continue;
                        }
                        // 对象类型：扫描并替换内部占位符字段（浅层扫描，不递归）
                        if (incoming && typeof incoming === 'object' && !Array.isArray(incoming)) {
                            var currentVal = store[key];
                            if (currentVal && typeof currentVal === 'object' && !Array.isArray(currentVal)) {
                                // 浅层合并：用incoming覆盖，但占位符字段保留current的值
                                var merged = Object.assign({}, incoming);
                                for (var ik in merged) {
                                    if (typeof merged[ik] === 'string' && _isPlaceholder(merged[ik])) {
                                        // 保留当前store中该字段的真实值
                                        if (currentVal[ik] !== undefined) {
                                            merged[ik] = currentVal[ik];
                                            _skippedPlaceholders++;
                                        }
                                    }
                                }
                                store[key] = merged;
                            } else {
                                store[key] = incoming;
                            }
                        } else {
                            // 数组或基本类型：直接覆盖
                            store[key] = incoming;
                        }
                    } catch(e) {
                        console.warn('[Backup] 恢复 key=' + key + ' 失败:', e);
                    }
                }
                
                var now = Date.now();
                store._saveTimestamp = now;
                store._importedAt = now;
                console.log('[Backup] 恢复合并完成, 跳过' + _skippedPlaceholders + '个占位符字段');

                // 写回 IndexedDB（v11: 使用batchSet原子写入，聊天分片存储）
                var idb = (typeof global.__getAppIdb === 'function') ? global.__getAppIdb() : global.idb;
                var chain = Promise.resolve();
                var _restoreImportTs = now; // 用于后续验证
                
                if (idb && typeof idb.batchSet === 'function') {
                    chain = chain.then(function(){
                        // 准备原子写入批次
                        var entries = [];
                        var mainStore = JSON.parse(JSON.stringify(store));
                        var origChats = mainStore.chats || {};
                        mainStore.chats = {};
                        mainStore._chatSharded = true;
                        mainStore._chatIds = Object.keys(origChats);
                        mainStore._saveVersion = (mainStore._saveVersion || 0) + 1;
                        mainStore._saveTime = Date.now();
                        
                        // WAL标记
                        entries.push({ key: 'AIChatOS_v8_WAL', value: { version: mainStore._saveVersion, time: Date.now(), status: 'writing' } });
                        // 主store
                        entries.push({ key: 'AIChatOS_v8', value: mainStore });
                        // 聊天分片
                        for (var cid in origChats) {
                            if (origChats.hasOwnProperty(cid) && Array.isArray(origChats[cid])) {
                                entries.push({ key: 'AIChatOS_v8_Chat_' + cid, value: origChats[cid] });
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
                        
                        return idb.batchSet(entries).then(function() {
                            // WAL完成标记
                            return idb.set('AIChatOS_v8_WAL', { version: mainStore._saveVersion, time: Date.now(), status: 'committed' });
                        });
                    }).catch(function(err){
                        console.warn('[Backup] 写 IDB 失败:', err);
                    });
                } else if (idb && typeof idb.set === 'function') {
                    // fallback: 旧接口
                    chain = chain.then(function(){
                        return idb.set('AIChatOS_v8', store);
                    }).catch(function(err){
                        console.warn('[Backup] 写 IDB 失败(fallback):', err);
                    });
                }

                // [FIX-恢复丢数据-v2] IDB写入后验证数据落盘
                chain = chain.then(function() {
                    if (!idb || typeof idb.get !== 'function') return;
                    return idb.get('AIChatOS_v8').then(function(readBack) {
                        if (readBack && readBack._importedAt === _restoreImportTs) {
                            console.log('[Backup] IDB写入验证成功');
                        } else {
                            console.warn('[Backup] IDB写入验证失败，数据可能未完全持久化');
                        }
                    }).catch(function(vErr) {
                        console.warn('[Backup] IDB验证异常:', vErr);
                    });
                });

                // 同步 LS 紧急备份（尽力而为，失败不报错）
                chain = chain.then(function(){
                    try {
                        // 在LS中标记导入时间戳，initStore可以用此验证
                        localStorage.setItem('AIChatOS_v8_ImportTs', String(_restoreImportTs));
                        
                        var lsCopy = JSON.parse(JSON.stringify(store, function(k, v){
                            if (typeof v === 'string' && v.length > 100000 && v.startsWith('data:image')) {
                                return '[base64_excluded]';
                            }
                            return v;
                        }));
                        localStorage.setItem('AIChatOS_v8_LS', JSON.stringify(lsCopy));
                    } catch(e) {
                        // LS 写失败不影响主流程
                    }
                });

                chain.then(function(){ resolve(true); }).catch(reject);
            } catch(e) {
                reject(e);
            }
        });
    }

    // ===== 删除备份 =====
    function deleteBackup(id) {
        return _bkDelete(id);
    }

    // ===== 列出所有备份（含元数据） =====
    function listBackups() {
        return _bkListMeta();
    }

    // ===== 导出某个备份为 JSON 文件 =====
    function exportBackupAsFile(id) {
        return _bkGet(id).then(function(record){
            if (!record || !record.data) {
                throw new Error('备份不存在');
            }
            try {
                var blob = new Blob([record.data], { type: 'application/json' });
                var url = URL.createObjectURL(blob);
                var a = document.createElement('a');
                var d = new Date(record.createdAt);
                var pad = function(n){ return n < 10 ? '0' + n : String(n); };
                var fname = 'YAN_Backup_' + d.getFullYear() + pad(d.getMonth()+1) + pad(d.getDate()) +
                           '_' + pad(d.getHours()) + pad(d.getMinutes()) + '.json';
                a.href = url;
                a.download = fname;
                a.style.display = 'none';
                document.body.appendChild(a);
                a.click();
                setTimeout(function(){
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                }, 60000);
                return fname;
            } catch(e) {
                throw new Error('导出文件失败: ' + e.message);
            }
        });
    }

    // ===== 定时策略 =====
    // 应用启动时检查 + 运行时定时器双保险
    function _checkAndBackupIfNeeded(reason) {
        var settings = _loadSettings();
        var last = settings.lastBackupTime || 0;

        // [FIX-B2] 从未备份过 → 不管 enabled，首次启动强制做一次备份
        if (!last && reason === 'startup') {
            console.log('[Backup] 首次启动，强制创建初始备份');
            return performBackup('startup')
                .then(function(record){
                    console.log('[Backup] ✓ 首次备份完成:', record.label, '大小:', (record.size/1024).toFixed(1)+'KB');
                    _toast('已自动创建首次备份', 'success');
                    return true;
                })
                .catch(function(err){
                    console.warn('[Backup] 首次备份失败:', err);
                    _toast('首次自动备份失败：' + (err.message || err), 'error');
                    return false;
                });
        }

        if (!settings.enabled) return Promise.resolve(false);

        var now = Date.now();
        var intervalMs = Math.max(1, settings.intervalHours) * 3600 * 1000;
        if (last && (now - last) < intervalMs) {
            return Promise.resolve(false); // 还没到时间
        }

        console.log('[Backup] 触发自动备份，原因:', reason);
        return performBackup(reason === 'startup' ? 'startup' : 'auto')
            .then(function(record){
                console.log('[Backup] ✓ 自动备份完成:', record.label, '大小:', (record.size/1024).toFixed(1)+'KB');
                _toast('自动备份完成', 'success');
                return true;
            })
            .catch(function(err){
                console.warn('[Backup] 自动备份失败:', err);
                _toast('自动备份失败：' + (err.message || err), 'error');
                return false;
            });
    }

    // ===== 每日导出提醒弹窗 =====
    var LS_REMINDER_KEY = 'yan_backup_reminder_dismiss';

    function _shouldShowReminder() {
        var settings = _loadSettings();
        if (!settings.enabled) return false; // 只有开了自动备份才提醒
        try {
            var raw = localStorage.getItem(LS_REMINDER_KEY);
            if (raw) {
                var dismissTs = parseInt(raw, 10);
                if (dismissTs && (Date.now() - dismissTs) < 24 * 3600 * 1000) {
                    return false; // 今天已经dismiss过
                }
            }
        } catch(e) {}
        return true;
    }

    function _dismissReminder(hours) {
        // hours: 0=立即导出后dismiss, 24=今天不提醒, 4=稍后提醒(4小时后)
        var dismissUntil = Date.now();
        if (hours > 0) {
            dismissUntil = Date.now() - (24 * 3600 * 1000) + (hours * 3600 * 1000);
            // 这样 _shouldShowReminder 里 (now - dismissTs) < 24h 就会在 hours 后过期
        }
        try { localStorage.setItem(LS_REMINDER_KEY, String(dismissUntil)); } catch(e) {}
    }

    function _showExportReminder() {
        if (!_shouldShowReminder()) return;
        // 延迟 30 秒显示，避免刚打开就弹窗
        setTimeout(function(){
            if (!_shouldShowReminder()) return; // 再检查一次（可能用户已手动导出）
            _createReminderPopup();
        }, 30000);
    }

    function _createReminderPopup() {
        // 如果已存在就不重复创建
        if (document.getElementById('bk-export-reminder')) return;

        var overlay = document.createElement('div');
        overlay.id = 'bk-export-reminder';
        overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.45);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;animation:bkReminderFadeIn 0.3s ease;';

        var card = document.createElement('div');
        card.style.cssText = 'background:#fff;border-radius:20px;padding:28px 24px 20px;max-width:340px;width:90%;box-shadow:0 8px 40px rgba(0,0,0,0.2);text-align:center;';

        card.innerHTML =
            '<div style="font-size:40px;margin-bottom:12px;">💾</div>' +
            '<div style="font-size:17px;font-weight:700;color:#111;margin-bottom:8px;">建议导出备份到本地</div>' +
            '<div style="font-size:13px;color:#888;line-height:1.6;margin-bottom:20px;">自动备份仅保存在浏览器中，清除数据或卸载会丢失。<br>建议定期下载备份文件到手机/电脑保管。</div>' +
            '<div style="display:flex;flex-direction:column;gap:10px;">' +
                '<button id="bk-remind-export" style="width:100%;padding:12px;border:none;border-radius:14px;background:linear-gradient(135deg,#5856d6,#7c6dd8);color:#fff;font-size:14px;font-weight:700;cursor:pointer;box-shadow:0 3px 12px rgba(88,86,214,0.3);">📥 立即导出备份文件</button>' +
                '<button id="bk-remind-later" style="width:100%;padding:11px;border:none;border-radius:14px;background:rgba(0,0,0,0.06);color:#555;font-size:13px;font-weight:600;cursor:pointer;">⏰ 稍后提醒</button>' +
                '<button id="bk-remind-dismiss" style="width:100%;padding:10px;border:none;border-radius:14px;background:transparent;color:#bbb;font-size:12px;cursor:pointer;">今天不再提醒</button>' +
            '</div>';

        overlay.appendChild(card);
        document.body.appendChild(overlay);

        // 添加淡入动画
        var style = document.createElement('style');
        style.textContent = '@keyframes bkReminderFadeIn{from{opacity:0}to{opacity:1}}';
        if (!document.getElementById('bk-reminder-style')) {
            style.id = 'bk-reminder-style';
            document.head.appendChild(style);
        }

        function _closePopup() {
            if (overlay.parentNode) {
                overlay.style.opacity = '0';
                overlay.style.transition = 'opacity 0.2s';
                setTimeout(function(){ try { overlay.parentNode.removeChild(overlay); } catch(e){} }, 250);
            }
        }

        // 点击遮罩关闭（等同"稍后提醒"）
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) {
                _dismissReminder(4);
                _closePopup();
            }
        });

        // 立即导出
        document.getElementById('bk-remind-export').addEventListener('click', function() {
            _dismissReminder(24); // 导出后今天不再提醒
            _closePopup();
            // 触发导出：优先用全局 exportData，否则用 BackupManager 的最新备份导出
            if (typeof global.exportData === 'function') {
                try { global.exportData(); } catch(e) { _toast('导出失败: ' + e.message, 'error'); }
            } else {
                // 回退：导出最新的自动备份文件
                _bkListMeta().then(function(list){
                    if (list.length > 0) {
                        exportBackupAsFile(list[0].id).then(function(fname){
                            _toast('已下载：' + fname, 'success');
                        }).catch(function(err){
                            _toast('导出失败：' + (err.message || err), 'error');
                        });
                    } else {
                        _toast('暂无备份可导出，请先手动备份', 'error');
                    }
                });
            }
        });

        // 稍后提醒（4小时后）
        document.getElementById('bk-remind-later').addEventListener('click', function() {
            _dismissReminder(4);
            _closePopup();
            _toast('将在 4 小时后再次提醒', 'info');
        });

        // 今天不再提醒
        document.getElementById('bk-remind-dismiss').addEventListener('click', function() {
            _dismissReminder(24);
            _closePopup();
        });
    }

    function _startRuntimeTimer() {
        if (_runtimeTimer) clearInterval(_runtimeTimer);
        // 每 30 分钟检查一次（间隔到了就会触发；即使用户设置了 6 小时间隔，30 分钟检查也不会多备份）
        _runtimeTimer = setInterval(function(){
            _checkAndBackupIfNeeded('auto');
        }, 30 * 60 * 1000);
    }

    function _stopRuntimeTimer() {
        if (_runtimeTimer) {
            clearInterval(_runtimeTimer);
            _runtimeTimer = null;
        }
    }

    // ===== 对外 API =====
    var BackupManager = {
        // 初始化（由 app-part1.js 的 initStore 完成后调用）
        init: function() {
            if (_initialized) return;
            _initialized = true;

            var settings = _loadSettings();
            console.log('[Backup] 初始化，enabled=' + settings.enabled + ', interval=' + settings.intervalHours + 'h, maxBackups=' + settings.maxBackups);

            // 启动时延迟 10 秒做一次"补备份"检查
            // （避免和 initStore 完成后的 "强制保存" 3s + 代理预热 5s 抢资源）
            setTimeout(function(){
                _checkAndBackupIfNeeded('startup');
            }, 10000);

            // 启动运行时定时器（默认开启，始终启动）
            if (settings.enabled) {
                _startRuntimeTimer();
            }

            // 监听页面可见性：从后台切回时补一次检查
            document.addEventListener('visibilitychange', function(){
                if (document.visibilityState === 'visible') {
                    var s = _loadSettings();
                    if (s.enabled) _checkAndBackupIfNeeded('auto');
                }
            });

            // [每日导出提醒] 启动后延迟显示提醒弹窗
            _showExportReminder();
        },

        // 获取设置
        getSettings: function() { return _loadSettings(); },

        // 更新设置（部分字段即可）
        updateSettings: function(patch) {
            var s = _loadSettings();
            var next = Object.assign({}, s, patch || {});
            // 合法性校验
            if (typeof next.intervalHours !== 'number' || next.intervalHours < 1) next.intervalHours = 24;
            if (typeof next.maxBackups !== 'number' || next.maxBackups < 1) next.maxBackups = 5;
            next.maxBackups = Math.min(20, next.maxBackups); // 上限防止爆盘
            _saveSettings(next);

            // 启停定时器
            if (next.enabled && !s.enabled) {
                _startRuntimeTimer();
                // 开启后立即做一次备份（如果从未备份过或距上次间隔已到）
                _checkAndBackupIfNeeded('manual');
            } else if (!next.enabled && s.enabled) {
                _stopRuntimeTimer();
            }
            return next;
        },

        // 操作接口
        backupNow: function(label) {
            return performBackup('manual').then(function(rec){
                if (label) {
                    rec.label = label;
                    return _bkPut(rec).then(function(){ return rec; });
                }
                return rec;
            });
        },
        list: listBackups,
        restore: restoreBackup,
        remove: deleteBackup,
        exportFile: exportBackupAsFile,

        // [OPT-恢复对比] 暴露获取完整备份记录的方法，供 UI 做恢复前数据对比
        _getBkRecord: function(id) { return _bkGet(id); },

        // 统计信息
        getStats: function() {
            return _bkListMeta().then(function(list){
                var total = 0;
                list.forEach(function(it){ total += (it.size || 0); });
                return {
                    count: list.length,
                    totalSize: total,
                    latest: list[0] || null
                };
            });
        }
    };

    // 暴露到全局
    global.BackupManager = BackupManager;

})(window);
