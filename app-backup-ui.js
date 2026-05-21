// ========== YAN 自动备份 UI 模块 ==========
// 渲染备份设置页面、备份列表、恢复/删除/导出交互
// 依赖 window.BackupManager（app-backup.js）
// ==========================================

(function(global){
    'use strict';

    function _esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
            return ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c];
        });
    }

    function _fmtSize(bytes) {
        if (!bytes) return '0 B';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024*1024) return (bytes/1024).toFixed(1) + ' KB';
        return (bytes/1024/1024).toFixed(2) + ' MB';
    }

    function _fmtTime(ts) {
        if (!ts) return '—';
        var d = new Date(ts);
        var pad = function(n){ return n < 10 ? '0' + n : String(n); };
        return d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate()) +
               ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
    }

    function _fmtRelativeTime(ts) {
        if (!ts) return '从未备份';
        var diff = Date.now() - ts;
        if (diff < 60000) return '刚刚';
        if (diff < 3600000) return Math.floor(diff/60000) + ' 分钟前';
        if (diff < 86400000) return Math.floor(diff/3600000) + ' 小时前';
        return Math.floor(diff/86400000) + ' 天前';
    }

    function _toast(msg, type) {
        if (typeof global.toast === 'function') {
            try { global.toast(msg, type); return; } catch(e) {}
        }
    }

    function _confirm(title, text, onOk) {
        if (typeof global.showConfirm === 'function') {
            try { global.showConfirm(title, text, onOk); return; } catch(e) {}
        }
        if (confirm(title + '\n' + text)) onOk && onOk();
    }

    // ===== 渲染备份设置页 =====
    function renderBackupSettings() {
        var BM = global.BackupManager;
        if (!BM) return;

        var s = BM.getSettings();
        var container = document.getElementById('settings-page-backup-content');
        if (!container) return;

        var intervalOptions = [
            { v: 6,  t: '每 6 小时' },
            { v: 12, t: '每 12 小时' },
            { v: 24, t: '每天' },
            { v: 72, t: '每 3 天' },
            { v: 168, t: '每周' }
        ];
        var maxOptions = [3, 5, 10, 15, 20];

        var html = '';

        // 状态卡片
        html += '<div class="beauty-section-card">';
        html +=   '<div class="beauty-section-header"><span><i class="fas fa-shield-alt" style="margin-right:6px;color:#34c759;"></i>备份状态</span></div>';
        html +=   '<div style="padding:14px 16px;">';
        html +=     '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">';
        html +=       '<span style="font-size:14px;color:#333;">自动备份</span>';
        html +=       '<label class="fb-toggle-switch">';
        html +=         '<input type="checkbox" id="bk-enabled-toggle" ' + (s.enabled?'checked':'') + ' onchange="BackupUI.toggleEnabled(this.checked)">';
        html +=         '<span class="fb-toggle-bg"></span>';
        html +=       '</label>';
        html +=     '</div>';
        html +=     '<div style="font-size:12px;color:#999;line-height:1.6;margin-top:6px;">';
        html +=       '上次备份：<b style="color:#333;">' + _fmtRelativeTime(s.lastBackupTime) + '</b>';
        if (s.lastBackupTime) html += '  <span style="color:#bbb;">(' + _fmtTime(s.lastBackupTime) + ')</span>';
        html +=     '</div>';
        // [FIX-B3] 显示上次备份失败原因，帮助用户排障
        if (s.lastBackupResult === 'failed' && s.lastBackupError) {
            html += '<div style="font-size:12px;color:#fa5151;line-height:1.6;margin-top:4px;">⚠️ 上次备份失败：' + _esc(s.lastBackupError) + ' <span onclick="BackupUI.backupNow()" style="color:#5856d6;cursor:pointer;text-decoration:underline;">重试</span></div>';
        }
        html +=     '<div id="bk-stats-line" style="font-size:12px;color:#999;line-height:1.6;margin-top:4px;">已有备份：加载中...</div>';
        html +=   '</div>';
        html += '</div>';

        // 备份频率
        html += '<div class="beauty-section-card">';
        html +=   '<div class="beauty-section-header"><span><i class="fas fa-clock" style="margin-right:6px;color:#5856d6;"></i>备份频率</span></div>';
        html +=   '<div style="padding:14px 16px;">';
        html +=     '<div style="display:flex;flex-wrap:wrap;gap:8px;">';
        intervalOptions.forEach(function(opt){
            var active = s.intervalHours === opt.v;
            html += '<button onclick="BackupUI.setInterval(' + opt.v + ')" class="bk-chip" data-v="' + opt.v + '" style="padding:8px 14px;border-radius:18px;border:1.5px solid ' + (active?'#5856d6':'rgba(0,0,0,0.1)') + ';background:' + (active?'#5856d6':'transparent') + ';color:' + (active?'#fff':'#555') + ';font-size:13px;font-weight:600;cursor:pointer;">' + opt.t + '</button>';
        });
        html +=     '</div>';
        html +=     '<div style="font-size:12px;color:#999;margin-top:10px;line-height:1.5;">距离上次备份超过设定间隔后，会在应用启动或切回前台时自动备份。</div>';
        html +=   '</div>';
        html += '</div>';

        // 保留数量
        html += '<div class="beauty-section-card">';
        html +=   '<div class="beauty-section-header"><span><i class="fas fa-layer-group" style="margin-right:6px;color:#ff9500;"></i>保留份数</span></div>';
        html +=   '<div style="padding:14px 16px;">';
        html +=     '<div style="display:flex;flex-wrap:wrap;gap:8px;">';
        maxOptions.forEach(function(n){
            var active = s.maxBackups === n;
            html += '<button onclick="BackupUI.setMaxBackups(' + n + ')" class="bk-chip-max" data-v="' + n + '" style="padding:8px 14px;border-radius:18px;border:1.5px solid ' + (active?'#ff9500':'rgba(0,0,0,0.1)') + ';background:' + (active?'#ff9500':'transparent') + ';color:' + (active?'#fff':'#555') + ';font-size:13px;font-weight:600;cursor:pointer;">' + n + ' 份</button>';
        });
        html +=     '</div>';
        html +=     '<div style="font-size:12px;color:#999;margin-top:10px;line-height:1.5;">超出保留数量时，最旧的备份会被自动删除以释放空间。</div>';
        html +=   '</div>';
        html += '</div>';

        // 隐私选项
        // [FIX-BACKUP-LOSS] 修改文案：明确告知开启后恢复会丢图片
        html += '<div class="beauty-section-card">';
        html +=   '<div class="beauty-section-header"><span><i class="fas fa-cog" style="margin-right:6px;color:#8e8e93;"></i>高级选项（自动备份）</span></div>';
        html +=   '<div style="padding:14px 16px;">';
        html +=     '<div style="display:flex;align-items:center;justify-content:space-between;">';
        html +=       '<div style="flex:1;padding-right:10px;">';
        html +=         '<div style="font-size:14px;color:#333;">自动备份排除大图片</div>';
        html +=         '<div style="font-size:12px;color:#fa5151;margin-top:4px;line-height:1.5;font-weight:600;">⚠️ 开启后自动备份将不包含超过 500KB 的图片（头像/壁纸/聊天图）。</div>';
        html +=         '<div style="font-size:12px;color:#999;margin-top:4px;line-height:1.5;">手动备份和"立即备份"始终完整保存所有数据，不受此开关影响。</div>';
        html +=       '</div>';
        html +=       '<label class="fb-toggle-switch">';
        html +=         '<input type="checkbox" id="bk-skip-base64" ' + (s.skipBase64?'checked':'') + ' onchange="BackupUI.toggleSkipBase64(this.checked)">';
        html +=         '<span class="fb-toggle-bg"></span>';
        html +=       '</label>';
        html +=     '</div>';
        html +=   '</div>';
        html += '</div>';

        // 操作
        html += '<div class="beauty-section-card">';
        html +=   '<div class="beauty-section-header"><span><i class="fas fa-tools" style="margin-right:6px;color:#34c759;"></i>操作</span></div>';
        html +=   '<div style="padding:14px 16px;">';
        html +=     '<button class="beauty-action-btn" onclick="BackupUI.backupNow()" style="margin-bottom:10px;background:#34c759;box-shadow:0 2px 8px rgba(52,199,89,0.25);"><i class="fas fa-save"></i> 立即备份</button>';
        html +=     '<button class="beauty-action-btn" onclick="BackupUI.showList()" style="background:#5856d6;box-shadow:0 2px 8px rgba(88,86,214,0.25);"><i class="fas fa-history"></i> 查看备份列表</button>';
        html +=   '</div>';
        html += '</div>';

        // 隐私提示
        html += '<div class="beauty-section-card" style="border-left:3px solid #34c759;">';
        html +=   '<div style="padding:14px 16px;font-size:12px;color:#666;line-height:1.7;">';
        html +=     '<div style="font-weight:700;color:#333;margin-bottom:6px;"><i class="fas fa-lock" style="color:#34c759;margin-right:4px;"></i>隐私说明</div>';
        html +=     '本功能为<b>纯本地备份</b>，所有数据仅保存在您的设备中（浏览器 IndexedDB），不会上传任何服务器。卸载应用或清除浏览器数据会导致备份丢失，建议定期通过"下载文件"功能导出备份文件到本地存储保管。';
        html +=   '</div>';
        html += '</div>';

        container.innerHTML = html;

        // 异步加载统计
        BM.getStats().then(function(stats){
            var line = document.getElementById('bk-stats-line');
            if (line) {
                if (stats.count === 0) {
                    line.innerHTML = '已有备份：<b style="color:#333;">0 份</b>';
                } else {
                    line.innerHTML = '已有备份：<b style="color:#333;">' + stats.count + ' 份</b>，共 <b style="color:#333;">' + _fmtSize(stats.totalSize) + '</b>';
                }
            }
        });
    }

    // ===== 渲染备份列表弹窗 =====
    function showBackupList() {
        var BM = global.BackupManager;
        if (!BM) return;

        var modal = document.getElementById('modal-backup-list');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'modal-backup-list';
            modal.style.cssText = 'display:none;position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.6);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);align-items:flex-end;justify-content:center;';
            modal.onclick = function(e){ if (e.target === modal) modal.style.display = 'none'; };
            modal.innerHTML =
                '<div style="background:rgba(255,255,255,0.96);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-radius:24px 24px 0 0;width:100%;max-width:540px;padding:0 0 env(safe-area-inset-bottom,20px) 0;max-height:90vh;display:flex;flex-direction:column;box-shadow:0 -4px 40px rgba(0,0,0,0.18);">' +
                  '<div style="display:flex;justify-content:center;padding:10px 0 0;"><div style="width:36px;height:4px;border-radius:2px;background:rgba(0,0,0,0.15);"></div></div>' +
                  '<div style="padding:14px 22px 10px;display:flex;align-items:center;justify-content:space-between;">' +
                    '<span style="font-size:18px;font-weight:700;color:#111;letter-spacing:-0.3px;">📦 备份列表</span>' +
                    '<button onclick="document.getElementById(\'modal-backup-list\').style.display=\'none\'" style="width:30px;height:30px;border:none;background:rgba(0,0,0,0.08);border-radius:50%;font-size:16px;color:#555;cursor:pointer;display:flex;align-items:center;justify-content:center;line-height:1;">×</button>' +
                  '</div>' +
                  '<div style="padding:0 22px 6px;"><span style="font-size:12px;color:#888;">点击任意备份可恢复、导出文件或删除。最新的在最上面。</span></div>' +
                  '<div id="bk-list-body" style="overflow-y:auto;padding:6px 16px 10px;flex:1;-webkit-overflow-scrolling:touch;"></div>' +
                '</div>';
            document.body.appendChild(modal);
        }

        modal.style.display = 'flex';
        var body = document.getElementById('bk-list-body');
        body.innerHTML = '<div style="padding:40px 20px;text-align:center;color:#999;font-size:13px;">加载中...</div>';

        BM.list().then(function(list){
            if (!list || list.length === 0) {
                body.innerHTML = '<div style="padding:40px 20px;text-align:center;color:#999;font-size:13px;">暂无备份。开启自动备份或点击"立即备份"来创建第一份备份。</div>';
                return;
            }
            var html = '';
            list.forEach(function(it){
                // [FIX-BACKUP-LOSS] 新增 pre-restore 类型展示（恢复前快照）
                var typeIcon, typeName;
                if (it.type === 'manual') { typeIcon = '✋'; typeName = '手动'; }
                else if (it.type === 'startup') { typeIcon = '🚀'; typeName = '启动'; }
                else if (it.type === 'pre-restore') { typeIcon = '🛡️'; typeName = '恢复前快照'; }
                else { typeIcon = '🕒'; typeName = '自动'; }
                // 高亮警示：排除大图的备份恢复后会丢图
                var sizeTag = it.skipBase64
                    ? ' · <span style="color:#fa5151;">已排除大图⚠️</span>'
                    : ' · <span style="color:#34c759;">完整</span>';
                html += '<div style="margin:8px 0;padding:14px;background:#fff;border:1px solid rgba(0,0,0,0.06);border-radius:14px;box-shadow:0 1px 4px rgba(0,0,0,0.03);">';
                html +=   '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">';
                html +=     '<div style="flex:1;min-width:0;">';
                html +=       '<div style="font-size:14px;font-weight:700;color:#222;">' + typeIcon + ' ' + _esc(typeName) + (it.type === 'pre-restore' ? '' : '备份') + '</div>';
                html +=       '<div style="font-size:12px;color:#888;margin-top:3px;">' + _esc(_fmtTime(it.createdAt)) + ' · ' + _esc(_fmtSize(it.size)) + sizeTag + '</div>';
                html +=     '</div>';
                html +=   '</div>';
                html +=   '<div style="display:flex;gap:6px;flex-wrap:wrap;">';
                html +=     '<button onclick="BackupUI.restore(\'' + _esc(it.id) + '\')" style="flex:1;min-width:80px;padding:8px 10px;border:none;border-radius:10px;background:#34c759;color:#fff;font-size:12px;font-weight:600;cursor:pointer;"><i class="fas fa-undo"></i> 恢复</button>';
                html +=     '<button onclick="BackupUI.exportFile(\'' + _esc(it.id) + '\')" style="flex:1;min-width:80px;padding:8px 10px;border:none;border-radius:10px;background:#5856d6;color:#fff;font-size:12px;font-weight:600;cursor:pointer;"><i class="fas fa-download"></i> 下载</button>';
                html +=     '<button onclick="BackupUI.remove(\'' + _esc(it.id) + '\')" style="flex:1;min-width:80px;padding:8px 10px;border:none;border-radius:10px;background:transparent;border:1.5px solid #fa5151 !important;color:#fa5151;font-size:12px;font-weight:600;cursor:pointer;"><i class="fas fa-trash-alt"></i> 删除</button>';
                html +=   '</div>';
                html += '</div>';
            });
            body.innerHTML = html;
        });
    }

    // ===== 交互 API =====
    var BackupUI = {
        render: renderBackupSettings,
        showList: showBackupList,

        toggleEnabled: function(on) {
            var BM = global.BackupManager; if (!BM) return;
            BM.updateSettings({ enabled: !!on });
            _toast(on ? '已开启自动备份' : '已关闭自动备份', 'success');
            renderBackupSettings();
        },
        setInterval: function(h) {
            var BM = global.BackupManager; if (!BM) return;
            BM.updateSettings({ intervalHours: h });
            _toast('备份间隔已更新', 'success');
            renderBackupSettings();
        },
        setMaxBackups: function(n) {
            var BM = global.BackupManager; if (!BM) return;
            BM.updateSettings({ maxBackups: n });
            _toast('保留份数已更新', 'success');
            renderBackupSettings();
        },
        toggleSkipBase64: function(on) {
            var BM = global.BackupManager; if (!BM) return;
            BM.updateSettings({ skipBase64: !!on });
        },

        backupNow: function() {
            var BM = global.BackupManager; if (!BM) return;
            _toast('正在创建备份...', 'info');
            BM.backupNow().then(function(rec){
                _toast('备份成功：' + _fmtSize(rec.size), 'success');
                renderBackupSettings();
            }).catch(function(err){
                _toast('备份失败：' + (err.message || err), 'error');
            });
        },

        restore: function(id) {
            // [OPT-恢复对比] 恢复前先加载备份数据，展示当前 vs 备份的关键统计对比
            var BM = global.BackupManager; if (!BM) return;
            _toast('正在加载备份信息...', 'info');
            // 通过内部方法获取备份记录做对比
            BM._getBkRecord ? BM._getBkRecord(id).then(_showRestoreCompare) : _showRestoreConfirmDirect();

            function _showRestoreCompare(record) {
                if (!record || !record.data) return _showRestoreConfirmDirect();
                try {
                    var parsed = JSON.parse(record.data);
                    var store = (typeof global.__getAppStore === 'function') ? global.__getAppStore() : global.store;
                    var curContacts = (store && store.contacts) ? store.contacts.length : 0;
                    var bkContacts = (parsed.contacts) ? parsed.contacts.length : 0;
                    var curChats = store && store.chats ? Object.keys(store.chats).length : 0;
                    var bkChats = parsed.chats ? Object.keys(parsed.chats).length : 0;
                    var compareInfo = '\n\n📊 数据对比：\n' +
                        '联系人：当前 ' + curContacts + ' 个 → 备份 ' + bkContacts + ' 个\n' +
                        '聊天会话：当前 ' + curChats + ' 个 → 备份 ' + bkChats + ' 个';
                    _doConfirm(compareInfo);
                } catch(e) {
                    _showRestoreConfirmDirect();
                }
            }
            function _showRestoreConfirmDirect() { _doConfirm(''); }
            function _doConfirm(extra) {
                _confirm(
                    '⚠️ 恢复备份',
                    '恢复会用该备份替换当前数据。\n\n🛡️ 系统会自动为当前数据创建"恢复前快照"（保留最近 3 份），如恢复不满意可在列表中还原回去。\n\n📌 恢复时会自动跳过备份中的占位符（如"已排除大图"），保留当前真实图片数据不被覆盖。' + extra + '\n\n确定恢复吗？',
                    function(){
                        _toast('正在创建恢复前快照并恢复...', 'info');
                        BM.restore(id).then(function(){
                            _toast('恢复成功，即将刷新应用', 'success');
                            setTimeout(function(){ location.reload(); }, 1500);
                        }).catch(function(err){
                            _toast('恢复失败：' + (err.message || err), 'error');
                        });
                    }
                );
            }
        },

        remove: function(id) {
            _confirm(
                '删除备份',
                '确定删除这份备份吗？此操作不可恢复。',
                function(){
                    var BM = global.BackupManager; if (!BM) return;
                    BM.remove(id).then(function(){
                        _toast('已删除', 'success');
                        showBackupList();
                        renderBackupSettings();
                    }).catch(function(err){
                        _toast('删除失败：' + (err.message || err), 'error');
                    });
                }
            );
        },

        exportFile: function(id) {
            var BM = global.BackupManager; if (!BM) return;
            BM.exportFile(id).then(function(fname){
                _toast('已下载：' + fname, 'success');
            }).catch(function(err){
                _toast('下载失败：' + (err.message || err), 'error');
            });
        }
    };

    global.BackupUI = BackupUI;

})(window);
