// ============================================================
// 群聊心声导出模块
// 入口：openGroupHeartExport(groupId)
//   1) 群聊心声弹窗底部"导出"按钮
//   2) 群聊设置页"💗 导出群聊心声"
// 支持：线上/线下 + 时间/成员排序 + txt/md/html 三种格式
// ============================================================
(function(){
    'use strict';

    // ---------- 安全获取 store ----------
    // [FIX-store桥接] app-part1.js 的 store 是闭包变量，通过 __getAppStore() 暴露
    function _getStore() {
        if (typeof window.__getAppStore === 'function') {
            var s = window.__getAppStore();
            if (s && typeof s === 'object') return s;
        }
        return (typeof window.store === 'object' && window.store) ? window.store : null;
    }

    // ---------- 工具函数 ----------
    function _toast(msg, type) {
        if (typeof window.toast === 'function') return window.toast(msg, type);
        try { console.log('[toast]', msg); } catch(_){}
    }

    function _pad2(n){ return n < 10 ? '0'+n : ''+n; }
    function _fmtTime(ts) {
        if (!ts) return '';
        const d = new Date(ts);
        if (isNaN(d.getTime())) return '';
        return d.getFullYear()+'-'+_pad2(d.getMonth()+1)+'-'+_pad2(d.getDate())+' '+_pad2(d.getHours())+':'+_pad2(d.getMinutes());
    }
    function _fmtDateOnly(ts) {
        if (!ts) return '';
        const d = new Date(ts);
        if (isNaN(d.getTime())) return '';
        return d.getFullYear()+'-'+_pad2(d.getMonth()+1)+'-'+_pad2(d.getDate());
    }
    function _esc(s){
        return String(s == null ? '' : s)
            .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    // ---------- 心声解析（位置|穿着|状态|心声） ----------
    function _parseHeart(memberObj, msg, source) {
        const rawHeart = (msg && typeof msg.heart === 'string') ? msg.heart
                       : (memberObj && typeof memberObj.heart === 'string') ? memberObj.heart
                       : '';
        if (!rawHeart) return null;
        // 容错：使用 normalizeHeartData（若存在）
        let parts = [];
        try {
            if (typeof window.normalizeHeartData === 'function') {
                parts = window.normalizeHeartData(rawHeart) || [];
            } else {
                parts = rawHeart.split('|');
            }
        } catch(_) {
            parts = rawHeart.split('|');
        }
        // 容错只有一段的老格式：全部落到 thought
        let loc = '', outfit = '', status = '', thought = '';
        if (parts.length >= 4) {
            loc = (parts[0]||'').trim();
            outfit = (parts[1]||'').trim();
            status = (parts[2]||'').trim();
            thought = (parts.slice(3).join('|')||'').replace(/\|+$/g,'').trim();
        } else if (parts.length === 1) {
            thought = (parts[0]||'').replace(/\|+$/g,'').trim();
        } else {
            // 2~3 段：按顺序从末尾取 thought
            thought = (parts[parts.length-1]||'').replace(/\|+$/g,'').trim();
            if (parts.length >= 2) loc = (parts[0]||'').trim();
            if (parts.length >= 3) outfit = (parts[1]||'').trim();
        }
        if (!thought) return null;

        const memberName = (memberObj && (memberObj.remark || memberObj.name)) || (msg && msg.senderName) || '未知成员';
        const memberId = (memberObj && memberObj.id) || (msg && msg.sender) || '';
        return {
            memberId: memberId,
            memberName: memberName,
            memberAvatar: (memberObj && memberObj.avatar) || '',
            loc: loc, outfit: outfit, status: status, thought: thought,
            time: (msg && msg.time) || 0,
            source: source || 'online'
        };
    }

    // ---------- 采集：线上 ----------
    // 兼容两种结构：
    //   1) m.heart（直接挂消息上）+ m.sender 指向成员
    //   2) m.members[i].heart（较新的多人结构）
    function _collectOnlineGroupHearts(groupId) {
        const out = [];
        const store = _getStore();
        if (!store || !store.chats || !store.chats[groupId]) return out;
        const msgs = store.chats[groupId];
        const group = store.contacts.find(function(c){ return c.id === groupId; });
        const memberIds = (group && group.members) || [];

        msgs.forEach(function(m){
            if (!m) return;
            // 跳过系统 / 用户自身
            if (m.sender === 'user' || m.sender === 'me' || m.sender === 'system') return;
            // 结构 2：m.members[i].heart
            if (Array.isArray(m.members) && m.members.length > 0) {
                m.members.forEach(function(mem){
                    if (!mem) return;
                    if (mem.sender === 'user' || mem.sender === 'me') return;
                    if (!mem.heart) return;
                    // 查找成员联系人
                    const memberContact = store.contacts.find(function(c){
                        return c.id === mem.sender || c.id === mem.id || c.name === mem.name;
                    }) || { id: mem.sender || mem.id, name: mem.name, avatar: mem.avatar };
                    const item = _parseHeart(memberContact, { heart: mem.heart, time: m.time, sender: memberContact.id }, 'online');
                    if (item) out.push(item);
                });
            }
            // 结构 1：m.heart + m.sender
            if (m.heart && m.sender) {
                const memberContact = store.contacts.find(function(c){ return c.id === m.sender; })
                    || { id: m.sender, name: m.sender, avatar: '' };
                const item = _parseHeart(memberContact, m, 'online');
                if (item) out.push(item);
            }
        });
        return out;
    }

    // ---------- 采集：线下 ----------
    function _collectOfflineGroupHearts(groupId) {
        const out = [];
        const store = _getStore();
        if (!store) return out;
        const group = store.contacts.find(function(c){ return c.id === groupId; });

        // 来源A：store.offlineChats[groupId]
        const offlineMsgs = (store.offlineChats && store.offlineChats[groupId]) || [];
        // 来源B：store.chats[groupId] 中 type 为 go_offline_text / offline_text 的消息
        const chatOfflineMsgs = (store.chats && store.chats[groupId])
            ? store.chats[groupId].filter(function(m){ return m && (m.type === 'go_offline_text' || m.type === 'offline_text'); })
            : [];

        function _handle(m) {
            if (!m) return;
            if (m.sender === 'user' || m.sender === 'me' || m.sender === 'system') return;
            // 多人结构
            if (Array.isArray(m.members) && m.members.length > 0) {
                m.members.forEach(function(mem){
                    if (!mem || !mem.heart) return;
                    if (mem.sender === 'user' || mem.sender === 'me') return;
                    const memberContact = store.contacts.find(function(c){
                        return c.id === mem.sender || c.id === mem.id || c.name === mem.name;
                    }) || { id: mem.sender || mem.id, name: mem.name, avatar: mem.avatar };
                    const item = _parseHeart(memberContact, { heart: mem.heart, time: m.time, sender: memberContact.id }, 'offline');
                    if (item) out.push(item);
                });
            }
            // 单人结构
            if (m.heart) {
                let memberContact = null;
                if (m.sender && m.sender !== 'ai') {
                    memberContact = store.contacts.find(function(c){ return c.id === m.sender; });
                }
                // go_offline_text 消息常用 goSenderName 字段标识说话人
                if (!memberContact && m.goSenderName) {
                    memberContact = store.contacts.find(function(c){
                        return (c.name === m.goSenderName || c.remark === m.goSenderName);
                    });
                }
                if (!memberContact) {
                    memberContact = { id: m.sender || '', name: m.goSenderName || m.senderName || '未知成员', avatar: '' };
                }
                const item = _parseHeart(memberContact, m, 'offline');
                if (item) out.push(item);
            }
        }
        offlineMsgs.forEach(_handle);
        chatOfflineMsgs.forEach(_handle);
        return out;
    }

    // ---------- 采集对话上下文（导出附带） ----------
    function _collectContext(groupId, scope) {
        const store = _getStore();
        if (!store) return [];
        let msgs = [];
        if (scope === 'online') {
            msgs = (store.chats && store.chats[groupId]) ? store.chats[groupId].slice() : [];
        } else if (scope === 'offline') {
            const a = (store.offlineChats && store.offlineChats[groupId]) || [];
            const b = (store.chats && store.chats[groupId]) ? store.chats[groupId].filter(function(m){ return m.type === 'go_offline_text' || m.type === 'offline_text'; }) : [];
            msgs = a.concat(b).sort(function(x,y){ return (x.time||0) - (y.time||0); });
        } else { // both
            const a = (store.chats && store.chats[groupId]) ? store.chats[groupId].slice() : [];
            const b = (store.offlineChats && store.offlineChats[groupId]) || [];
            msgs = a.concat(b).sort(function(x,y){ return (x.time||0) - (y.time||0); });
        }
        // 只保留最近 50 条对话作为上下文
        const MAX_CTX = 50;
        if (msgs.length > MAX_CTX) msgs = msgs.slice(-MAX_CTX);
        return msgs.map(function(m){
            let name = '系统';
            if (m.sender === 'me' || m.sender === 'user') {
                name = (store.user && store.user.name) || '我';
            } else if (m.sender === 'system') {
                name = '系统';
            } else {
                const c = store.contacts.find(function(x){ return x.id === m.sender; });
                if (c) name = c.remark || c.name;
                else name = m.senderName || m.goSenderName || (m.sender || '未知');
            }
            const content = (typeof m.content === 'string') ? m.content : (m.content ? JSON.stringify(m.content) : '');
            return { time: m.time || 0, name: name, content: content, type: m.type || '' };
        });
    }

    // ---------- 排序/分组 ----------
    function _sortHearts(hearts, sortBy) {
        const arr = hearts.slice();
        if (sortBy === 'member') {
            arr.sort(function(a,b){
                const na = a.memberName || '', nb = b.memberName || '';
                if (na < nb) return -1;
                if (na > nb) return 1;
                return (a.time||0) - (b.time||0);
            });
        } else {
            arr.sort(function(a,b){ return (a.time||0) - (b.time||0); });
        }
        return arr;
    }

    // ---------- 下载（兼容 WebView / Capacitor / 移动端） ----------
    function _downloadText(text, filename, fmt) {
        let mime = 'text/plain;charset=utf-8';
        if (fmt === 'html') mime = 'text/html;charset=utf-8';
        else if (fmt === 'md') mime = 'text/markdown;charset=utf-8';
        const bom = '\uFEFF';
        const content = bom + text;

        // 方案1: Capacitor Filesystem (APK 环境)
        if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Filesystem) {
            try {
                var _Fs = window.Capacitor.Plugins.Filesystem;
                _Fs.writeFile({
                    path: 'Download/' + filename,
                    data: btoa(unescape(encodeURIComponent(content))),
                    directory: 'EXTERNAL_STORAGE',
                    recursive: true
                }).then(function(res) {
                    _toast('已保存到 Download/' + filename, 'success');
                }).catch(function(e) {
                    console.error('[导出] Capacitor写入失败，尝试Share', e);
                    _shareOrFallback(content, filename, mime);
                });
                return;
            } catch(e) { /* fallback */ }
        }

        // 方案2: Web Share API (移动浏览器)
        if (navigator.share) {
            try {
                var file = new File([content], filename, { type: mime });
                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    navigator.share({ files: [file], title: filename }).catch(function(){});
                    return;
                }
            } catch(e) { /* fallback */ }
        }

        // 方案3: 传统 Blob 下载 (桌面浏览器 / 兜底)
        _blobDownload(content, filename, mime);
    }

    function _blobDownload(content, filename, mime) {
        try {
            var blob = new Blob([content], { type: mime });
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            setTimeout(function(){
                try { document.body.removeChild(a); } catch(_){}
                URL.revokeObjectURL(url);
            }, 200);
        } catch(e) {
            console.error('[导出] Blob下载失败', e);
            _toast('导出失败：' + (e.message || '浏览器不支持下载'), 'error');
        }
    }

    function _shareOrFallback(content, filename, mime) {
        if (navigator.share) {
            try {
                var file = new File([content], filename, { type: mime });
                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    navigator.share({ files: [file], title: filename }).catch(function(){
                        _blobDownload(content, filename, mime);
                    });
                    return;
                }
            } catch(e) { /* fallback */ }
        }
        _blobDownload(content, filename, mime);
    }

    // ---------- 生成 txt ----------
    function _buildTxt(group, hearts, ctx, opts) {
        const lines = [];
        lines.push('【群聊心声导出】');
        lines.push('群聊：' + (group.remark || group.name || group.id));
        lines.push('导出时间：' + _fmtTime(Date.now()));
        lines.push('范围：' + (opts.scope === 'online' ? '线上' : opts.scope === 'offline' ? '线下' : '线上+线下'));
        lines.push('排序：' + (opts.sortBy === 'member' ? '按成员' : '按时间'));
        lines.push('心声总数：' + hearts.length);
        lines.push('');
        lines.push('========== 心声列表 ==========');
        lines.push('');
        if (opts.sortBy === 'member') {
            // 按成员分组
            const grp = {};
            hearts.forEach(function(h){
                if (!grp[h.memberName]) grp[h.memberName] = [];
                grp[h.memberName].push(h);
            });
            Object.keys(grp).forEach(function(name){
                lines.push('—— ' + name + ' ——');
                grp[name].forEach(function(h){
                    lines.push('[' + _fmtTime(h.time) + '] [' + (h.source === 'offline' ? '线下' : '线上') + ']');
                    if (h.loc) lines.push('  位置：' + h.loc);
                    if (h.outfit) lines.push('  穿着：' + h.outfit);
                    if (h.status) lines.push('  状态：' + h.status);
                    lines.push('  心声：' + h.thought);
                    lines.push('');
                });
            });
        } else {
            hearts.forEach(function(h){
                lines.push('[' + _fmtTime(h.time) + '] ' + h.memberName + ' [' + (h.source === 'offline' ? '线下' : '线上') + ']');
                if (h.loc) lines.push('  位置：' + h.loc);
                if (h.outfit) lines.push('  穿着：' + h.outfit);
                if (h.status) lines.push('  状态：' + h.status);
                lines.push('  心声：' + h.thought);
                lines.push('');
            });
        }
        if (opts.includeContext && ctx && ctx.length > 0) {
            lines.push('');
            lines.push('========== 对话上下文（最近 ' + ctx.length + ' 条） ==========');
            lines.push('');
            ctx.forEach(function(m){
                lines.push('[' + _fmtTime(m.time) + '] ' + m.name + '：' + (m.content || ''));
            });
        }
        return lines.join('\n');
    }

    // ---------- 生成 md ----------
    function _buildMd(group, hearts, ctx, opts) {
        const lines = [];
        lines.push('# 群聊心声导出');
        lines.push('');
        lines.push('- **群聊**：' + (group.remark || group.name || group.id));
        lines.push('- **导出时间**：' + _fmtTime(Date.now()));
        lines.push('- **范围**：' + (opts.scope === 'online' ? '线上' : opts.scope === 'offline' ? '线下' : '线上+线下'));
        lines.push('- **排序**：' + (opts.sortBy === 'member' ? '按成员' : '按时间'));
        lines.push('- **心声总数**：' + hearts.length);
        lines.push('');
        lines.push('---');
        lines.push('');
        lines.push('## 💗 心声列表');
        lines.push('');
        if (opts.sortBy === 'member') {
            const grp = {};
            hearts.forEach(function(h){
                if (!grp[h.memberName]) grp[h.memberName] = [];
                grp[h.memberName].push(h);
            });
            Object.keys(grp).forEach(function(name){
                lines.push('### ' + name);
                lines.push('');
                grp[name].forEach(function(h){
                    lines.push('**[' + _fmtTime(h.time) + ']** _' + (h.source === 'offline' ? '线下' : '线上') + '_');
                    lines.push('');
                    if (h.loc || h.outfit || h.status) {
                        const meta = [];
                        if (h.loc) meta.push('位置：`' + h.loc + '`');
                        if (h.outfit) meta.push('穿着：`' + h.outfit + '`');
                        if (h.status) meta.push('状态：`' + h.status + '`');
                        lines.push('- ' + meta.join(' | '));
                        lines.push('');
                    }
                    lines.push('> ' + (h.thought || '').replace(/\n/g,'\n> '));
                    lines.push('');
                });
            });
        } else {
            hearts.forEach(function(h){
                lines.push('### ' + h.memberName + ' · ' + _fmtTime(h.time));
                lines.push('');
                lines.push('_' + (h.source === 'offline' ? '线下' : '线上') + '_');
                lines.push('');
                if (h.loc || h.outfit || h.status) {
                    const meta = [];
                    if (h.loc) meta.push('位置：`' + h.loc + '`');
                    if (h.outfit) meta.push('穿着：`' + h.outfit + '`');
                    if (h.status) meta.push('状态：`' + h.status + '`');
                    lines.push('- ' + meta.join(' | '));
                    lines.push('');
                }
                lines.push('> ' + (h.thought || '').replace(/\n/g,'\n> '));
                lines.push('');
            });
        }
        if (opts.includeContext && ctx && ctx.length > 0) {
            lines.push('---');
            lines.push('');
            lines.push('## 📜 对话上下文（最近 ' + ctx.length + ' 条）');
            lines.push('');
            ctx.forEach(function(m){
                lines.push('- **[' + _fmtTime(m.time) + '] ' + m.name + '**：' + (m.content || ''));
            });
            lines.push('');
        }
        return lines.join('\n');
    }

    // ---------- 生成 html ----------
    function _buildHtml(group, hearts, ctx, opts) {
        const title = '群聊心声导出 - ' + (group.remark || group.name || group.id);
        const style = [
            'body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;background:#f5f6f8;color:#222;padding:20px;margin:0;line-height:1.6;}',
            '.wrap{max-width:860px;margin:0 auto;background:#fff;border-radius:12px;padding:24px;box-shadow:0 2px 12px rgba(0,0,0,0.06);}',
            'h1{font-size:22px;margin:0 0 8px;color:#333;}',
            '.meta{font-size:13px;color:#666;margin-bottom:18px;padding:10px 14px;background:#fafafa;border-radius:8px;border-left:3px solid #07c160;}',
            '.meta span{margin-right:14px;}',
            'h2{font-size:17px;margin:24px 0 10px;padding-bottom:6px;border-bottom:1px solid #eee;color:#333;}',
            'h3{font-size:15px;margin:16px 0 6px;color:#444;}',
            '.card{background:#fafbfd;border:1px solid #edf0f3;border-radius:10px;padding:12px 14px;margin-bottom:10px;}',
            '.card .head{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;}',
            '.card .name{font-weight:600;color:#07c160;}',
            '.card .time{font-size:12px;color:#999;}',
            '.badge{display:inline-block;font-size:11px;padding:1px 8px;border-radius:999px;background:#eef6ff;color:#4a90d9;margin-left:6px;}',
            '.badge.off{background:#fff3e8;color:#c66a1e;}',
            '.tags{font-size:12px;color:#777;margin:4px 0 8px;}',
            '.tags .tg{display:inline-block;background:#eee;border-radius:4px;padding:1px 6px;margin-right:6px;}',
            '.thought{font-size:14px;color:#333;padding:8px 10px;background:#fff;border-left:3px solid #07c160;border-radius:4px;white-space:pre-wrap;}',
            '.ctx-item{font-size:13px;color:#555;padding:4px 0;border-bottom:1px dashed #eee;}',
            '.ctx-item .n{font-weight:600;color:#333;}',
            '.ctx-item .t{font-size:11px;color:#aaa;margin-right:6px;}',
            '.empty{color:#999;font-size:13px;text-align:center;padding:20px;}'
        ].join('');

        function _renderCard(h) {
            const badge = h.source === 'offline' ? '<span class="badge off">线下</span>' : '<span class="badge">线上</span>';
            let tags = '';
            if (h.loc || h.outfit || h.status) {
                tags = '<div class="tags">';
                if (h.loc) tags += '<span class="tg">📍 '+_esc(h.loc)+'</span>';
                if (h.outfit) tags += '<span class="tg">👕 '+_esc(h.outfit)+'</span>';
                if (h.status) tags += '<span class="tg">● '+_esc(h.status)+'</span>';
                tags += '</div>';
            }
            return '<div class="card"><div class="head"><div class="name">'+_esc(h.memberName)+badge+'</div><div class="time">'+_esc(_fmtTime(h.time))+'</div></div>'
                + tags
                + '<div class="thought">'+_esc(h.thought)+'</div></div>';
        }

        let body = '';
        body += '<h1>💗 '+_esc(title)+'</h1>';
        body += '<div class="meta">'
            + '<span>📅 '+_esc(_fmtTime(Date.now()))+'</span>'
            + '<span>范围：'+(opts.scope === 'online' ? '线上' : opts.scope === 'offline' ? '线下' : '线上+线下')+'</span>'
            + '<span>排序：'+(opts.sortBy === 'member' ? '按成员' : '按时间')+'</span>'
            + '<span>共 '+hearts.length+' 条心声</span>'
            + '</div>';

        body += '<h2>💗 心声列表</h2>';
        if (hearts.length === 0) {
            body += '<div class="empty">暂无心声</div>';
        } else if (opts.sortBy === 'member') {
            const grp = {};
            hearts.forEach(function(h){
                if (!grp[h.memberName]) grp[h.memberName] = [];
                grp[h.memberName].push(h);
            });
            Object.keys(grp).forEach(function(name){
                body += '<h3>'+_esc(name)+' · '+grp[name].length+' 条</h3>';
                grp[name].forEach(function(h){ body += _renderCard(h); });
            });
        } else {
            hearts.forEach(function(h){ body += _renderCard(h); });
        }

        if (opts.includeContext && ctx && ctx.length > 0) {
            body += '<h2>📜 对话上下文（最近 '+ctx.length+' 条）</h2>';
            body += '<div>';
            ctx.forEach(function(m){
                body += '<div class="ctx-item"><span class="t">'+_esc(_fmtTime(m.time))+'</span><span class="n">'+_esc(m.name)+'</span>：'+_esc(m.content||'')+'</div>';
            });
            body += '</div>';
        }

        return '<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+_esc(title)+'</title><style>'+style+'</style></head><body><div class="wrap">'+body+'</div></body></html>';
    }

    // ---------- 入口：弹出选项 modal ----------
    function openGroupHeartExport(groupId) {
        const store = _getStore();
        if (!store) return _toast('store 未初始化', 'error');
        const group = store.contacts.find(function(c){ return c.id === groupId; });
        if (!group) return _toast('群聊不存在', 'error');
        if (!group.isGroup) return _toast('仅群聊可导出心声', 'error');

        // 避免重复创建
        let modal = document.getElementById('modal-group-heart-export');
        if (modal) modal.remove();

        modal = document.createElement('div');
        modal.id = 'modal-group-heart-export';
        modal.className = 'modal-mask';
        modal.style.display = 'flex';
        modal.innerHTML = ''
            + '<div class="modal-box" style="max-width:340px;">'
            +   '<h3 style="margin:0 0 10px;">💗 导出群聊心声</h3>'
            +   '<div style="font-size:12px; color:#888; margin-bottom:14px;">群聊：'+_esc(group.remark || group.name)+'</div>'

            +   '<div style="font-size:13px; font-weight:600; margin-bottom:6px;">范围</div>'
            +   '<select id="ghe-scope" style="width:100%; padding:8px 10px; border:1px solid #ddd; border-radius:6px; margin-bottom:12px; font-size:13px;">'
            +     '<option value="both" selected>线上 + 线下</option>'
            +     '<option value="online">仅线上</option>'
            +     '<option value="offline">仅线下</option>'
            +   '</select>'

            +   '<div style="font-size:13px; font-weight:600; margin-bottom:6px;">排序</div>'
            +   '<select id="ghe-sort" style="width:100%; padding:8px 10px; border:1px solid #ddd; border-radius:6px; margin-bottom:12px; font-size:13px;">'
            +     '<option value="time" selected>按时间</option>'
            +     '<option value="member">按成员</option>'
            +   '</select>'

            +   '<div style="font-size:13px; font-weight:600; margin-bottom:6px;">格式</div>'
            +   '<select id="ghe-fmt" style="width:100%; padding:8px 10px; border:1px solid #ddd; border-radius:6px; margin-bottom:12px; font-size:13px;">'
            +     '<option value="txt" selected>TXT 纯文本</option>'
            +     '<option value="md">Markdown</option>'
            +     '<option value="html">HTML 网页</option>'
            +   '</select>'

            +   '<label style="display:flex; align-items:center; gap:6px; font-size:13px; color:#555; margin-bottom:16px; cursor:pointer;">'
            +     '<input type="checkbox" id="ghe-ctx" checked> 附带最近对话上下文'
            +   '</label>'

            +   '<div style="display:flex; justify-content:flex-end; gap:8px;">'
            +     '<button onclick="document.getElementById(\'modal-group-heart-export\').remove()" style="padding:8px 16px; border:none; background:#eee; border-radius:6px; font-size:13px;">取消</button>'
            +     '<button onclick="doGroupHeartExport(\''+groupId+'\')" style="padding:8px 16px; border:none; background:var(--primary); color:#fff; border-radius:6px; font-size:13px;">导出</button>'
            +   '</div>'
            + '</div>';
        document.body.appendChild(modal);
    }
    window.openGroupHeartExport = openGroupHeartExport;

    // ---------- 执行导出 ----------
    function doGroupHeartExport(groupId) {
        const store = _getStore();
        if (!store) return _toast('store 未初始化', 'error');
        const group = store.contacts.find(function(c){ return c.id === groupId; });
        if (!group) return _toast('群聊不存在', 'error');
        if (!group.isGroup) return _toast('仅群聊可导出心声', 'error');

        const scopeEl = document.getElementById('ghe-scope');
        const sortEl = document.getElementById('ghe-sort');
        const fmtEl = document.getElementById('ghe-fmt');
        const ctxEl = document.getElementById('ghe-ctx');
        const scope = scopeEl ? scopeEl.value : 'both';
        const sortBy = sortEl ? sortEl.value : 'time';
        const fmt = fmtEl ? fmtEl.value : 'txt';
        const includeContext = ctxEl ? !!ctxEl.checked : true;

        let hearts = [];
        if (scope === 'online') hearts = _collectOnlineGroupHearts(groupId);
        else if (scope === 'offline') hearts = _collectOfflineGroupHearts(groupId);
        else hearts = _collectOnlineGroupHearts(groupId).concat(_collectOfflineGroupHearts(groupId));

        if (!hearts || hearts.length === 0) {
            return _toast('暂无心声数据可导出', 'error');
        }

        hearts = _sortHearts(hearts, sortBy);
        const ctx = includeContext ? _collectContext(groupId, scope) : [];

        const opts = { scope: scope, sortBy: sortBy, fmt: fmt, includeContext: includeContext };
        let text = '';
        if (fmt === 'md') text = _buildMd(group, hearts, ctx, opts);
        else if (fmt === 'html') text = _buildHtml(group, hearts, ctx, opts);
        else text = _buildTxt(group, hearts, ctx, opts);

        const safeName = (group.remark || group.name || 'group').replace(/[\\/:*?"<>|\s]/g, '_');
        const ext = fmt === 'md' ? 'md' : (fmt === 'html' ? 'html' : 'txt');
        const filename = '群聊心声_' + safeName + '_' + _fmtDateOnly(Date.now()) + '.' + ext;

        try {
            _downloadText(text, filename, fmt);
            _toast('导出成功：' + hearts.length + ' 条心声', 'success');
        } catch(e) {
            console.error('[群聊心声导出] 失败', e);
            _toast('导出失败：' + (e && e.message || e), 'error');
            return;
        }
        // 关闭选项 modal
        const modal = document.getElementById('modal-group-heart-export');
        if (modal) modal.remove();
    }
    window.doGroupHeartExport = doGroupHeartExport;

    // ---------- 群聊聊天记录导出为 TXT（仅群聊，私聊不提供） ----------
    function exportGroupChatTxt(groupId) {
        var store = _getStore();
        if (!store) return _toast('store未初始化', 'error');
        var group = store.contacts.find(function(c){ return c.id === groupId; });
        if (!group || !group.isGroup) return _toast('仅群聊可导出聊天记录', 'error');

        var msgs = (store.chats[groupId] || []).slice();
        // 合并线下消息
        var offMsgs = (store.offlineChats && store.offlineChats[groupId]) || [];
        if (offMsgs.length > 0) msgs = msgs.concat(offMsgs);
        msgs.sort(function(a,b){ return (a.time||0) - (b.time||0); });

        if (msgs.length === 0) return _toast('暂无聊天记录可导出', 'error');

        var lines = [];
        lines.push('【群聊记录导出】');
        lines.push('群聊：' + (group.remark || group.name || group.id));
        lines.push('导出时间：' + _fmtTime(Date.now()));
        lines.push('消息总数：' + msgs.length);
        lines.push('');
        lines.push('========================================');
        lines.push('');

        msgs.forEach(function(m) {
            if (!m) return;
            var time = _fmtTime(m.time);
            var name = '系统';
            if (m.sender === 'me' || m.sender === 'user') {
                name = (store.user && store.user.name) || '我';
            } else if (m.sender !== 'system') {
                var c = store.contacts.find(function(x){ return x.id === m.sender; });
                name = (c && (c.remark || c.name)) || m.senderName || m.goSenderName || m.sender || '未知';
            }
            var content = typeof m.content === 'string' ? m.content : (m.content ? JSON.stringify(m.content) : '');
            var tag = '';
            if (m.type === 'go_offline_text' || m.type === 'offline_text') tag = '[线下] ';
            else if (m.type === 'image') content = '[图片]';
            else if (m.type === 'voice') content = '[语音]';
            else if (m.type === 'video') content = '[视频]';
            else if (m.type === 'sticker') content = '[表情]';
            else if (m.type === 'poke') tag = '[系统] ';
            else if (m.type === 'redpacket') content = '[红包] ' + (content || '');
            // 清理心声/状态标签，保留纯文本
            content = content.replace(/\[HEART[:\：][\s\S]*?\]/gi, '').replace(/\[STATUS[:\：][^\]]*\]/gi, '').replace(/\[HEARTBEAT[:\：][^\]]*\]/gi, '').replace(/\[GROUP_STATUS[:\：][^\]]*\]/gi, '').trim();
            if (!content && !tag) return; // 跳过空消息
            lines.push('[' + time + '] ' + tag + name + '：' + content);
        });

        var safeName = (group.remark || group.name || 'group').replace(/[\\/:*?"<>|\s]/g, '_');
        var filename = '群聊记录_' + safeName + '_' + _fmtDateOnly(Date.now()) + '.txt';

        try {
            _downloadText(lines.join('\n'), filename, 'txt');
            _toast('导出成功：' + msgs.length + ' 条消息', 'success');
        } catch(e) {
            console.error('[群聊记录导出] 失败', e);
            _toast('导出失败：' + (e && e.message || e), 'error');
        }
    }
    window.exportGroupChatTxt = exportGroupChatTxt;

    // ---------- 群聊线下记录导出（JSON + TXT） ----------
    function openGroupOfflineExport(groupId) {
        var store = _getStore();
        if (!store) return _toast('数据未加载', 'error');
        var group = store.contacts.find(function(c){ return c.id === groupId; });
        if (!group || !group.isGroup) return _toast('仅群聊可导出线下记录', 'error');

        var offlineMsgs = (store.chats[groupId] || []).filter(function(m) {
            return m.type === 'go_offline_text' || m.type === 'go_offline_action';
        });
        if (offlineMsgs.length === 0) return _toast('该群聊暂无线下记录', 'error');

        var groupName = _esc(group.remark || group.name || groupId);
        var html = '<div class="modal-mask" onclick="this.remove()">'
            + '<div class="modal-box" style="max-width:320px;" onclick="event.stopPropagation()">'
            +   '<h3 style="margin:0 0 10px;">🌍 导出群聊线下记录</h3>'
            +   '<div style="font-size:12px; color:#888; margin-bottom:14px;">群聊：' + groupName + '（共 ' + offlineMsgs.length + ' 条线下消息）</div>'
            +   '<div style="display:flex; flex-direction:column; gap:10px;">'
            +     '<button onclick="exportGroupOfflineJSON(\'' + groupId + '\'); this.closest(\'.modal-mask\').remove();" style="padding:12px; border:none; border-radius:12px; background:#576b95; color:#fff; font-size:14px; cursor:pointer;">📋 导出为 JSON</button>'
            +     '<button onclick="exportGroupOfflineTXT(\'' + groupId + '\'); this.closest(\'.modal-mask\').remove();" style="padding:12px; border:none; border-radius:12px; background:#07c160; color:#fff; font-size:14px; cursor:pointer;">📝 导出为 TXT</button>'
            +   '</div>'
            +   '<button onclick="this.closest(\'.modal-mask\').remove();" style="margin-top:12px; padding:8px; border:1px solid #ddd; border-radius:10px; background:#fff; color:#666; font-size:13px; cursor:pointer; width:100%;">取消</button>'
            + '</div></div>';
        document.body.insertAdjacentHTML('beforeend', html);
    }
    window.openGroupOfflineExport = openGroupOfflineExport;

    function _getOfflineMsgs(groupId) {
        var store = _getStore();
        if (!store) return { group: null, msgs: [] };
        var group = store.contacts.find(function(c){ return c.id === groupId; });
        if (!group || !group.isGroup) return { group: null, msgs: [] };
        var msgs = (store.chats[groupId] || []).filter(function(m) {
            return m.type === 'go_offline_text' || m.type === 'go_offline_action';
        });
        return { group: group, msgs: msgs, store: store };
    }

    function _resolveOfflineSender(m, group, store) {
        if (m.sender === 'me') return store.user.name || '我';
        if (m.senderName) return m.senderName;
        var c = store.contacts.find(function(ct){ return ct.id === m.sender; });
        return c ? (c.remark || c.name) : m.sender;
    }

    function exportGroupOfflineJSON(groupId) {
        var data = _getOfflineMsgs(groupId);
        if (!data.group) return _toast('群聊不存在', 'error');
        if (data.msgs.length === 0) return _toast('暂无线下记录', 'error');

        var exportData = {
            exportType: 'group_offline_records',
            exportTime: new Date().toISOString(),
            groupName: data.group.remark || data.group.name || groupId,
            groupId: groupId,
            totalMessages: data.msgs.length,
            messages: data.msgs.map(function(m) {
                var obj = {
                    sender: _resolveOfflineSender(m, data.group, data.store),
                    senderId: m.sender,
                    content: m.content || '',
                    type: m.type,
                    time: m.time,
                    timeFormatted: new Date(m.time).toLocaleString('zh-CN'),
                    turnNumber: m.turnNumber || 0
                };
                if (m.goQuote) {
                    obj.quote = {
                        senderName: m.goQuote.senderName,
                        text: m.goQuote.text
                    };
                }
                return obj;
            })
        };

        var safeName = (data.group.remark || data.group.name || 'group').replace(/[\\/:*?"<>|]/g, '_');
        var filename = '群聊线下记录_' + safeName + '_' + _fmtDateOnly(Date.now()) + '.json';
        try {
            _downloadText(JSON.stringify(exportData, null, 2), filename, 'json');
            _toast('JSON导出成功：' + data.msgs.length + ' 条线下消息', 'success');
        } catch(e) {
            _toast('导出失败：' + (e && e.message || e), 'error');
        }
    }
    window.exportGroupOfflineJSON = exportGroupOfflineJSON;

    function exportGroupOfflineTXT(groupId) {
        var data = _getOfflineMsgs(groupId);
        if (!data.group) return _toast('群聊不存在', 'error');
        if (data.msgs.length === 0) return _toast('暂无线下记录', 'error');

        var groupName = data.group.remark || data.group.name || groupId;
        var lines = [];
        lines.push('【群聊线下记录导出】');
        lines.push('群聊：' + groupName);
        lines.push('导出时间：' + new Date().toLocaleString('zh-CN'));
        lines.push('消息总数：' + data.msgs.length + ' 条');
        lines.push('');
        lines.push('========================================');
        lines.push('');

        // 按轮次分组
        var turnMap = {};
        var turnOrder = [];
        data.msgs.forEach(function(m) {
            var turn = m.turnNumber || 0;
            if (!turnMap[turn]) { turnMap[turn] = []; turnOrder.push(turn); }
            turnMap[turn].push(m);
        });

        turnOrder.forEach(function(turn) {
            lines.push('--- 第 ' + turn + ' 轮 ---');
            lines.push('');
            turnMap[turn].forEach(function(m) {
                var sender = _resolveOfflineSender(m, data.group, data.store);
                var time = new Date(m.time).toLocaleString('zh-CN');
                var quoteStr = '';
                if (m.goQuote) {
                    quoteStr = '  [引用 ' + (m.goQuote.senderName || '') + ': ' + (m.goQuote.text || '').substring(0, 50) + ']\n';
                }
                lines.push('[' + time + '] ' + sender + ':');
                if (quoteStr) lines.push(quoteStr);
                lines.push((m.content || '').trim());
                lines.push('');
            });
            lines.push('');
        });

        var safeName = (data.group.remark || data.group.name || 'group').replace(/[\\/:*?"<>|]/g, '_');
        var filename = '群聊线下记录_' + safeName + '_' + _fmtDateOnly(Date.now()) + '.txt';
        try {
            _downloadText(lines.join('\n'), filename, 'txt');
            _toast('TXT导出成功：' + data.msgs.length + ' 条线下消息', 'success');
        } catch(e) {
            _toast('导出失败：' + (e && e.message || e), 'error');
        }
    }
    window.exportGroupOfflineTXT = exportGroupOfflineTXT;

    // 调试用：暴露内部函数
    window._ghExport = {
        collectOnline: _collectOnlineGroupHearts,
        collectOffline: _collectOfflineGroupHearts,
        parseHeart: _parseHeart,
        buildTxt: _buildTxt,
        buildMd: _buildMd,
        buildHtml: _buildHtml,
        downloadText: _downloadText
    };
})();
