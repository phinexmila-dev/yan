// ============================================================
// 关系网扩展模块 (Relation Network Extras)
// 三大新功能：
//   1. 根据用户人设一键AI生成"身边人"NPC → 写入关系网
//   2. 群聊从关系网添加NPC（手动/角色主动拉人两种方式）
//   3. 全局世界书支持按联系人精细挂载范围（全部/指定/排除）
// ============================================================

(function(global) {
    'use strict';

    // ====================================================
    // 工具函数
    // ====================================================

    function _toast(msg, type) {
        try {
            if (typeof toast === 'function') toast(msg, type);
            else if (typeof showToast === 'function') showToast(msg);
            else console.log('[toast]', msg);
        } catch (e) { /* noop */ }
    }

    function _save() {
        try { if (typeof save === 'function') save(); } catch (e) { /* noop */ }
    }

    function _ph(n) {
        try { if (typeof window._ph === 'function') return window._ph(n); } catch (e) {}
        return 'https://ui-avatars.com/api/?name=%3F&size=' + (n || 40);
    }

    // ====================================================
    // 数据迁移：旧 globalWbIds → 新 globalWbMounts
    // ====================================================
    // globalWbMounts 结构:
    //   { [wbId]: { mode: 'all'|'custom'|'exclude', contactIds: [id, id...] } }
    // all      = 全部联系人（默认）
    // custom   = 只挂载到 contactIds 列表中的联系人
    // exclude  = 排除 contactIds 列表中的联系人，其余全部挂载

    function migrateGlobalWbMounts() {
        if (typeof store === 'undefined' || !store) return;
        if (!store.globalWbMounts || typeof store.globalWbMounts !== 'object') {
            store.globalWbMounts = {};
        }
        // 迁移：将旧 globalWbIds 按默认 all 模式迁入 globalWbMounts
        if (Array.isArray(store.globalWbIds) && store.globalWbIds.length > 0) {
            store.globalWbIds.forEach(function(id) {
                var key = String(id);
                if (!store.globalWbMounts[key]) {
                    store.globalWbMounts[key] = { mode: 'all', contactIds: [] };
                }
            });
            // 保持 globalWbIds 同步（用于兼容其他旧读取逻辑）
        }
        // 反向同步：将 globalWbMounts 中存在的 id 同步回 globalWbIds
        // 这样所有旧代码仍然工作（但精细过滤由 isGlobalWbActiveFor 实现）
        var ids = Object.keys(store.globalWbMounts);
        store.globalWbIds = ids.map(function(s) { return s; });
    }

    // 判断某个全局世界书是否对指定联系人生效
    function isGlobalWbActiveFor(wbId, contactId) {
        if (typeof store === 'undefined' || !store) return false;
        migrateGlobalWbMounts();
        var key = String(wbId);
        var mount = store.globalWbMounts && store.globalWbMounts[key];
        if (!mount) {
            // 向后兼容：如果 globalWbIds 里有但 Mounts 里没有，按 all 处理
            if (Array.isArray(store.globalWbIds) && store.globalWbIds.some(function(id){return String(id)===key;})) {
                return true;
            }
            return false;
        }
        var mode = mount.mode || 'all';
        var list = Array.isArray(mount.contactIds) ? mount.contactIds : [];
        if (mode === 'all') return true;
        if (mode === 'custom') return list.indexOf(contactId) > -1;
        if (mode === 'exclude') return list.indexOf(contactId) === -1;
        return true;
    }

    // 获取某联系人实际生效的全局世界书ID数组
    function getActiveGlobalWbIds(contactId) {
        if (typeof store === 'undefined' || !store) return [];
        migrateGlobalWbMounts();
        var mounts = store.globalWbMounts || {};
        var result = [];
        Object.keys(mounts).forEach(function(wbId) {
            if (isGlobalWbActiveFor(wbId, contactId)) result.push(wbId);
        });
        return result;
    }

    // ====================================================
    // 功能1：根据用户人设AI生成身边人
    // ====================================================

    function _findContactsByPersona(personaId) {
        if (typeof store === 'undefined' || !store || !Array.isArray(store.contacts)) return [];
        return store.contacts.filter(function(c) {
            return c && !c.isGroup && c.settings && c.settings.userPersona === personaId;
        });
    }

    // 打开"AI生成身边人"主面板
    function openGenerateCirclePanel(personaId) {
        if (typeof store === 'undefined' || !store) return;
        var persona = (store.personas || []).find(function(p){return p.id === personaId;});
        if (!persona) { _toast('人设不存在', 'error'); return; }

        // 使用该人设的联系人列表
        var linkedContacts = _findContactsByPersona(personaId);

        var mask = document.createElement('div');
        mask.className = 'modal-mask rne-gen-mask';
        mask.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:10010;display:flex;align-items:center;justify-content:center;';
        mask.onclick = function(e) { if (e.target === mask) mask.remove(); };

        var box = document.createElement('div');
        box.className = 'rne-gen-box';
        box.style.cssText = 'width:92%;max-width:440px;max-height:85vh;overflow-y:auto;background:#fff;border-radius:14px;padding:0;box-shadow:0 2px 20px rgba(0,0,0,0.12);';

        var linkedHtml = '';
        if (linkedContacts.length > 0) {
            linkedHtml = '<div style="padding:10px 12px;background:#f8f8f8;border:1px solid #e5e5e5;border-radius:8px;font-size:12px;color:#444;line-height:1.5;margin-bottom:12px;">'
                + '<i class="fas fa-link" style="margin-right:4px;color:#86868b;"></i>已绑定该人设的联系人：'
                + linkedContacts.map(function(c){return '<b style="color:#1d1d1f;">'+(c.name||'未命名')+'</b>';}).join('、')
                + '</div>';
        } else {
            linkedHtml = '<div style="padding:10px 12px;background:#f8f8f8;border:1px solid #e5e5e5;border-radius:8px;font-size:12px;color:#86868b;line-height:1.5;margin-bottom:12px;">'
                + '<i class="fas fa-info-circle" style="margin-right:4px;"></i>该人设还未被任何联系人绑定。生成的身边人可稍后手动写入任意联系人的关系网。'
                + '</div>';
        }

        box.innerHTML = ''
            + '<div style="padding:16px 20px;border-bottom:1px solid #f0f0f0;display:flex;justify-content:space-between;align-items:center;">'
            +   '<div><h3 style="margin:0;font-size:17px;font-weight:600;color:#1d1d1f;">AI生成身边人</h3>'
            +   '<div style="font-size:12px;color:#86868b;margin-top:4px;">人设：' + (persona.name || '未命名') + '</div></div>'
            +   '<span onclick="this.closest(\'.modal-mask\').remove()" style="font-size:22px;cursor:pointer;color:#999;line-height:1;">&times;</span>'
            + '</div>'
            + '<div style="padding:16px 20px;">'
            +   linkedHtml
            +   '<div style="margin-bottom:12px;">'
            +     '<label style="font-size:13px;color:#86868b;display:block;margin-bottom:6px;">人设描述（AI据此推断身边人）</label>'
            +     '<textarea id="rne-gen-desc" style="width:100%;min-height:70px;border:1px solid #e5e5e5;border-radius:8px;padding:10px;font-size:13px;box-sizing:border-box;resize:vertical;background:#fafafa;color:#1d1d1f;" placeholder="如：高中生，内向爱看书...">' + (persona.desc || '') + '</textarea>'
            +   '</div>'
            +   '<div style="margin-bottom:12px;display:flex;gap:10px;">'
            +     '<div style="flex:1;"><label style="font-size:13px;color:#86868b;display:block;margin-bottom:6px;">生成数量</label>'
            +       '<input type="number" id="rne-gen-count" value="5" min="1" max="10" style="width:100%;border:1px solid #e5e5e5;border-radius:8px;padding:10px;font-size:13px;box-sizing:border-box;background:#fafafa;color:#1d1d1f;"></div>'
            +     '<div style="flex:2;"><label style="font-size:13px;color:#86868b;display:block;margin-bottom:6px;">关系范围</label>'
            +       '<select id="rne-gen-scope" style="width:100%;border:1px solid #e5e5e5;border-radius:8px;padding:10px;font-size:13px;box-sizing:border-box;background:#fff;color:#1d1d1f;">'
            +         '<option value="mixed">综合（家人/朋友/同学等）</option>'
            +         '<option value="school">校园向（同学/老师/社团）</option>'
            +         '<option value="work">职场向（同事/上司/客户）</option>'
            +         '<option value="family">家庭向（亲人/亲戚）</option>'
            +         '<option value="romance">情感向（暗恋/前任/情敌）</option>'
            +       '</select></div>'
            +   '</div>'
            +   '<div style="margin-bottom:12px;">'
            +     '<label style="font-size:13px;color:#86868b;display:block;margin-bottom:6px;">额外提示（可选）</label>'
            +     '<input type="text" id="rne-gen-hint" placeholder="例如：生成2个男性好友、1个女性闺蜜..." style="width:100%;border:1px solid #e5e5e5;border-radius:8px;padding:10px;font-size:13px;box-sizing:border-box;background:#fafafa;color:#1d1d1f;">'
            +   '</div>'
            +   '<div id="rne-gen-preview" style="margin-top:12px;"></div>'
            + '</div>'
            + '<div style="padding:14px 20px;border-top:1px solid #f0f0f0;display:flex;gap:10px;">'
            +   '<button id="rne-gen-btn" onclick="window._rneGenerate(\'' + personaId + '\')" style="flex:2;padding:11px;background:#1d1d1f;color:#fff;border:none;border-radius:8px;font-size:14px;cursor:pointer;font-weight:500;"><i class="fas fa-magic" style="margin-right:4px;"></i>AI 生成</button>'
            +   '<button id="rne-gen-commit" style="flex:2;padding:11px;background:#1d1d1f;color:#fff;border:none;border-radius:8px;font-size:14px;cursor:pointer;display:none;font-weight:500;" onclick="try{window._rneCommitGenerated(\'' + personaId.replace(/'/g, "\\'") + '\')}catch(e){console.error(e);toast&&toast(\'操作失败\',\'error\')}"><i class="fas fa-check" style="margin-right:4px;"></i>写入关系网</button>'
            +   '<button onclick="this.closest(\'.modal-mask\').remove()" style="flex:1;padding:11px;background:#fff;color:#1d1d1f;border:1px solid #e5e5e5;border-radius:8px;font-size:14px;cursor:pointer;">取消</button>'
            + '</div>';

        mask.appendChild(box);
        (document.getElementById('device') || document.body).appendChild(mask);
    }

    // 存储当前待写入的生成结果
    var _rnePendingNpcs = [];

    // 调用AI生成
    function generateCircleNpcs(personaId) {
        var persona = (store.personas || []).find(function(p){return p.id === personaId;});
        if (!persona) { _toast('人设不存在', 'error'); return; }

        var desc = (document.getElementById('rne-gen-desc') || {}).value || persona.desc || '';
        var count = parseInt((document.getElementById('rne-gen-count') || {}).value || '5', 10);
        if (isNaN(count) || count < 1) count = 5;
        if (count > 10) count = 10;
        var scope = (document.getElementById('rne-gen-scope') || {}).value || 'mixed';
        var hint = (document.getElementById('rne-gen-hint') || {}).value || '';
        var btn = document.getElementById('rne-gen-btn');

        var scopeMap = {
            mixed: '综合类型（家人/同学/朋友/同事等自由组合）',
            school: '校园场景（同学/老师/学长学姐/社团成员等）',
            work: '职场场景（同事/上司/下属/客户等）',
            family: '家庭场景（父母/兄弟姐妹/亲戚等）',
            romance: '情感关系（暗恋对象/前任/情敌/追求者等）'
        };

        var sysPrompt = '你是角色社交圈设计师。根据用户的人设，为TA合理地生成' + count + '个"身边人"NPC。'
            + '要求：\n'
            + '1. 每个NPC与主人公有合理的关系（' + (scopeMap[scope] || scopeMap.mixed) + '）\n'
            + '2. NPC之间可以互相认识，形成小社交网\n'
            + '3. 性格多样化，不要全是好人或全是坏人\n'
            + '4. 名字要符合人设的文化背景\n'
            + '5. 严格输出合法JSON数组，不要markdown，不要多余文字';

        var userPrompt = '主人公人设：\n'
            + '- 姓名：' + (persona.name || '未命名') + '\n'
            + '- 描述：' + (desc || '无') + '\n'
            + (persona.note ? '- 备注：' + persona.note + '\n' : '')
            + (hint ? '- 额外要求：' + hint + '\n' : '')
            + '\n请生成' + count + '个身边人，JSON格式：\n'
            + '[{"name":"姓名","gender":"男/女","age":"年龄(如18岁)","identity":"身份职业","contactRelation":"与主人公的关系(如同桌/暗恋对象/姐姐)","personality":"性格特点(10字内)","appearance":"外貌(15字内)","oneliner":"一句话概括(15字内)"}]';

        if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 生成中...'; }

        if (typeof API === 'undefined' || !API || !API.chatCompletion) {
            _toast('API未配置', 'error');
            if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-magic"></i> AI 生成'; }
            return;
        }

        API.chatCompletion([
            { role: 'system', content: sysPrompt },
            { role: 'user', content: userPrompt }
        ], { temperature: 0.95, silent: true, scene: 'relation-network' }).then(function(data) {
            var text = (data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '';
            text = text.trim();
            // 去除markdown包裹
            text = text.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
            // 提取JSON数组
            var arrMatch = text.match(/\[[\s\S]*\]/);
            if (!arrMatch) throw new Error('AI返回格式异常');
            var arr = JSON.parse(arrMatch[0]);
            if (!Array.isArray(arr) || arr.length === 0) throw new Error('AI返回空数组');

            _rnePendingNpcs = arr.map(function(n, i) {
                return {
                    tmpId: 'tmp_' + Date.now() + '_' + i,
                    name: String(n.name || '未命名').substring(0, 20),
                    gender: String(n.gender || '').substring(0, 4),
                    age: String(n.age || '').substring(0, 10),
                    identity: String(n.identity || '').substring(0, 30),
                    contactRelation: String(n.contactRelation || n.relation || '').substring(0, 20),
                    personality: String(n.personality || '').substring(0, 30),
                    appearance: String(n.appearance || '').substring(0, 30),
                    oneliner: String(n.oneliner || '').substring(0, 40),
                    selected: true
                };
            });
            _renderNpcPreview();
            if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-magic"></i> 重新生成'; }
            var commitBtn = document.getElementById('rne-gen-commit');
            if (commitBtn) commitBtn.style.display = '';
        }).catch(function(err) {
            console.warn('[RNE生成] 失败:', err);
            _toast('AI生成失败，请重试', 'error');
            if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-magic"></i> AI 生成'; }
        });
    }

    function _renderNpcPreview() {
        var container = document.getElementById('rne-gen-preview');
        if (!container) return;
        if (_rnePendingNpcs.length === 0) { container.innerHTML = ''; return; }

        var html = '<div style="font-size:13px;color:#1d1d1f;margin-bottom:8px;font-weight:600;">生成结果（可编辑/勾选/删除）</div>';
        html += '<div style="max-height:300px;overflow-y:auto;border:1px solid #e5e5e5;border-radius:8px;">';
        _rnePendingNpcs.forEach(function(npc, idx) {
            html += '<div style="padding:10px 12px;border-bottom:1px solid #f0f0f0;background:' + (npc.selected ? '#fff' : '#f8f8f8') + ';">';
            html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">';
            html += '<input type="checkbox" ' + (npc.selected ? 'checked' : '') + ' onchange="window._rneToggleNpc(' + idx + ')" style="width:16px;height:16px;accent-color:#1d1d1f;">';
            html += '<input type="text" value="' + (npc.name || '').replace(/"/g, '&quot;') + '" onchange="window._rneEditNpc(' + idx + ',\'name\',this.value)" style="flex:1;border:none;border-bottom:1px dashed #ddd;padding:2px 4px;font-size:13px;font-weight:600;color:#1d1d1f;">';
            html += '<span style="font-size:11px;color:#86868b;">' + (npc.gender || '') + '·' + (npc.age || '') + '</span>';
            html += '<i class="fas fa-times" onclick="window._rneDeleteNpc(' + idx + ')" style="cursor:pointer;color:#86868b;font-size:12px;padding:4px;"></i>';
            html += '</div>';
            html += '<div style="display:flex;gap:6px;font-size:12px;color:#444;">';
            html += '<input type="text" value="' + (npc.contactRelation || '').replace(/"/g, '&quot;') + '" onchange="window._rneEditNpc(' + idx + ',\'contactRelation\',this.value)" placeholder="关系" style="flex:1;border:none;border-bottom:1px dashed #ddd;padding:2px 4px;color:#444;">';
            html += '<input type="text" value="' + (npc.identity || '').replace(/"/g, '&quot;') + '" onchange="window._rneEditNpc(' + idx + ',\'identity\',this.value)" placeholder="身份" style="flex:1;border:none;border-bottom:1px dashed #ddd;padding:2px 4px;color:#444;">';
            html += '</div>';
            if (npc.oneliner) html += '<div style="font-size:11px;color:#86868b;margin-top:3px;padding-left:24px;">' + npc.oneliner + '</div>';
            html += '</div>';
        });
        html += '</div>';
        html += '<div style="font-size:11px;color:#86868b;margin-top:8px;">已勾选 <b style="color:#1d1d1f;">' + _rnePendingNpcs.filter(function(n){return n.selected;}).length + '</b> / ' + _rnePendingNpcs.length + ' 个</div>';
        container.innerHTML = html;
    }

    // 提交生成的NPC到关系网
    function commitGeneratedNpcs(personaId) {
        try {
            var selected = _rnePendingNpcs.filter(function(n){return n.selected;});
            if (selected.length === 0) { _toast('请至少勾选一个NPC', 'error'); return; }

            var linkedContacts = _findContactsByPersona(personaId);
            if (linkedContacts.length === 0) {
                // 没有绑定的联系人，弹出选择
                _openSelectTargetContacts(personaId, selected);
                return;
            }

            // 有绑定的联系人，弹出确认
            _openSelectTargetContacts(personaId, selected, linkedContacts);
        } catch(e) {
            console.error('[RNE] commitGeneratedNpcs 失败:', e);
            _toast('操作失败: ' + (e.message || '未知错误'), 'error');
        }
    }

    function _openSelectTargetContacts(personaId, npcs, preselectContacts) {
        var contacts = (store.contacts || []).filter(function(c){return c && !c.isGroup;});
        // [FIX-无联系人v2] 没有联系人时不阻塞生成流程，NPC已存在_rnePendingNpcs中
        if (contacts.length === 0) { _toast('NPC已生成！创建联系人后可在关系网手动添加', 'success'); return; }

        var pre = preselectContacts || [];
        var preIds = {};
        pre.forEach(function(c){ preIds[c.id] = true; });

        var mask = document.createElement('div');
        mask.className = 'modal-mask rne-target-mask';
        mask.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:10020;display:flex;align-items:center;justify-content:center;';
        mask.onclick = function(e){ if (e.target === mask) mask.remove(); };

        var box = document.createElement('div');
        box.style.cssText = 'width:90%;max-width:400px;max-height:80vh;overflow-y:auto;background:#fff;border-radius:14px;box-shadow:0 2px 20px rgba(0,0,0,0.12);';

        var listHtml = contacts.map(function(c) {
            var checked = preIds[c.id] ? 'checked' : '';
            return '<label style="display:flex;align-items:center;padding:10px 14px;border-bottom:1px solid #f0f0f0;cursor:pointer;">'
                + '<input type="checkbox" value="' + c.id + '" ' + checked + ' class="rne-target-cb" style="width:16px;height:16px;margin-right:10px;accent-color:#1d1d1f;">'
                + '<img src="' + (c.avatar || _ph(40)) + '" style="width:32px;height:32px;border-radius:6px;object-fit:cover;margin-right:10px;border:1px solid #e5e5e5;">'
                + '<span style="flex:1;font-size:14px;color:#1d1d1f;">' + (c.name || '未命名') + '</span>'
                + (preIds[c.id] ? '<span style="font-size:11px;color:#86868b;">已绑定</span>' : '')
                + '</label>';
        }).join('');

        box.innerHTML = ''
            + '<div style="padding:16px 20px;border-bottom:1px solid #f0f0f0;display:flex;justify-content:space-between;align-items:center;">'
            +   '<div><h3 style="margin:0;font-size:16px;font-weight:600;color:#1d1d1f;">选择要写入的联系人</h3><div style="font-size:12px;color:#86868b;margin-top:4px;">这些NPC将作为角色的关系网中的"身边人"</div></div>'
            +   '<span onclick="this.closest(\'.modal-mask\').remove()" style="font-size:22px;cursor:pointer;color:#999;line-height:1;">&times;</span>'
            + '</div>'
            + '<div style="max-height:50vh;overflow-y:auto;">' + listHtml + '</div>'
            + '<div style="padding:14px 20px;border-top:1px solid #f0f0f0;display:flex;gap:10px;">'
            +   '<button id="rne-target-confirm" style="flex:1;padding:11px;background:#1d1d1f;color:#fff;border:none;border-radius:8px;font-size:14px;cursor:pointer;font-weight:500;">确认写入</button>'
            +   '<button onclick="this.closest(\'.modal-mask\').remove()" style="flex:1;padding:11px;background:#fff;color:#1d1d1f;border:1px solid #e5e5e5;border-radius:8px;font-size:14px;cursor:pointer;">取消</button>'
            + '</div>';

        mask.appendChild(box);
        (document.getElementById('device') || document.body).appendChild(mask);

        document.getElementById('rne-target-confirm').onclick = function() {
            var cbs = mask.querySelectorAll('.rne-target-cb:checked');
            var ids = Array.prototype.map.call(cbs, function(cb){return cb.value;});
            if (ids.length === 0) { _toast('请至少选择一个联系人', 'error'); return; }
            _writeNpcsToRelationNetworks(ids, npcs);
            mask.remove();
            // 关闭生成面板
            var genMask = document.querySelector('.rne-gen-mask');
            if (genMask) genMask.remove();
            _rnePendingNpcs = [];
            _toast('已写入 ' + ids.length + ' 个联系人的关系网，共 ' + npcs.length + ' 个身边人');
        };
    }

    function _writeNpcsToRelationNetworks(contactIds, npcs) {
        try {
            if (!store.relationNetworks) store.relationNetworks = {};
            contactIds.forEach(function(cid) {
                if (!store.relationNetworks[cid]) store.relationNetworks[cid] = { characters: [], relations: [] };
                var rn = store.relationNetworks[cid];
                if (!Array.isArray(rn.characters)) rn.characters = [];
                if (!Array.isArray(rn.relations)) rn.relations = [];

                npcs.forEach(function(npc, i) {
                    var newId = 'rn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5) + '_' + i;
                    rn.characters.push({
                        id: newId,
                        name: npc.name,
                        avatar: '',
                        role: 'npc',
                        gender: npc.gender || '',
                        age: npc.age || '',
                        identity: npc.identity || '',
                        contactRelation: npc.contactRelation || '',
                        oneliner: npc.oneliner || '',
                        personality: npc.personality || '',
                        appearance: npc.appearance || '',
                        hobbies: '',
                        mbti: '',
                        zodiac: '',
                        experience: '',
                        familyBg: '',
                        notes: '由AI根据人设自动生成',
                        linkedContactId: '',
                        linkedContactRole: '',
                        x: 0, y: 0,
                        fromPersona: true
                    });
                    // [FIX-NPC关系对象] 自动与 __user__ 建立关系
                    // NPC是根据"用户人设"生成的身边人，contactRelation描述的是"与用户的关系"
                    // 之前错误地连接到 __contact__（联系人），导致"用户的妈妈"变成"联系人的妈妈"
                    if (npc.contactRelation) {
                        rn.relations.push({
                            from: newId,
                            to: '__user__',
                        label: npc.contactRelation
                    });
                }
            });
        });
        // [FIX-写入关系网] 写入后必须调用save()持久化，并加入异常保护
        _save();
        } catch(e) {
            console.error('[RNE] 写入关系网失败:', e);
            _toast('写入关系网时出错，请重试', 'error');
        }
    }

    // 面板交互用的全局函数
    global._rneGenerate = generateCircleNpcs;
    global._rneCommitGenerated = commitGeneratedNpcs;
    global._rneToggleNpc = function(idx) {
        if (_rnePendingNpcs[idx]) {
            _rnePendingNpcs[idx].selected = !_rnePendingNpcs[idx].selected;
            _renderNpcPreview();
        }
    };
    global._rneEditNpc = function(idx, field, val) {
        if (_rnePendingNpcs[idx]) _rnePendingNpcs[idx][field] = val;
    };
    global._rneDeleteNpc = function(idx) {
        _rnePendingNpcs.splice(idx, 1);
        _renderNpcPreview();
    };
    global.openGenerateCirclePanel = openGenerateCirclePanel;

    // ====================================================
    // 功能2：群聊从关系网添加NPC
    // ====================================================

    // 把一个关系网NPC转为联系人（如果还没有关联的联系人）
    function _materializeNpcAsContact(npc, sourceContactId) {
        // 已经关联了联系人：直接返回该联系人ID
        if (npc.linkedContactId) {
            var linked = (store.contacts || []).find(function(c){return c.id === npc.linkedContactId;});
            if (linked) return linked.id;
        }
        // 创建新联系人
        var newId = 'c_rn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
        var personaDesc = '';
        if (npc.identity) personaDesc += npc.identity;
        if (npc.personality) personaDesc += (personaDesc ? '，' : '') + '性格：' + npc.personality;
        if (npc.appearance) personaDesc += (personaDesc ? '；' : '') + '外貌：' + npc.appearance;
        if (npc.oneliner && !personaDesc) personaDesc = npc.oneliner;
        if (npc.experience) personaDesc += (personaDesc ? '。' : '') + npc.experience;
        if (npc.familyBg) personaDesc += (personaDesc ? '。' : '') + '家庭：' + npc.familyBg;

        var newContact = {
            id: newId,
            name: npc.name || '未命名',
            avatar: npc.avatar || '',
            remark: '',
            signature: npc.oneliner || '',
            status: '在线',
            persona: personaDesc || (npc.oneliner || '来自关系网的角色'),
            wxid: 'wxid_' + newId,
            isGroup: false,
            isFromRelationNetwork: true,
            fromRelationOf: sourceContactId || '',
            settings: {
                autoMsg: false,
                autoMsgInterval: 30,
                wb: '',
                userPersona: '',
                bg: '',
                stickerGallery: ''
            }
        };
        // 继承原联系人的 userPersona 设定
        if (sourceContactId) {
            var src = (store.contacts || []).find(function(c){return c.id === sourceContactId;});
            if (src && src.settings && src.settings.userPersona) {
                newContact.settings.userPersona = src.settings.userPersona;
            }
        }
        if (!Array.isArray(store.contacts)) store.contacts = [];
        store.contacts.push(newContact);
        // 回写 NPC 的 linkedContactId
        npc.linkedContactId = newId;
        return newId;
    }

    // 获取指定角色关系网中的可拉入的NPC（不含已在群里的）
    function getRelationNpcsForGroup(groupId, sourceContactId) {
        var group = (store.contacts || []).find(function(c){return c.id === groupId;});
        if (!group) return [];
        var existing = Array.isArray(group.members) ? group.members.slice() : [];
        var rn = (store.relationNetworks && store.relationNetworks[sourceContactId]) || null;
        if (!rn || !Array.isArray(rn.characters)) return [];

        var result = [];
        rn.characters.forEach(function(ch) {
            if (!ch || ch.role === 'user' || ch.role === 'contact') return;
            // 如果已关联联系人且该联系人已在群里，跳过
            if (ch.linkedContactId && existing.indexOf(ch.linkedContactId) > -1) return;
            result.push(ch);
        });
        return result;
    }

    // 确定"源角色"（群聊从哪个角色的关系网拉人）
    function _inferSourceContactForGroup(group) {
        if (!group) return null;
        // 优先使用群设置中指定的来源
        if (group.settings && group.settings.npcInviteSourceContact) {
            var spec = (store.contacts || []).find(function(c){return c.id === group.settings.npcInviteSourceContact;});
            if (spec) return spec.id;
        }
        // 回退：使用群的第一个非用户成员（通常是群主角色）
        if (Array.isArray(group.members) && group.members.length > 0) {
            // 找到第一个有关系网的成员
            for (var i = 0; i < group.members.length; i++) {
                var mid = group.members[i];
                if (store.relationNetworks && store.relationNetworks[mid]) return mid;
            }
            return group.members[0];
        }
        return null;
    }

    // 打开"从关系网拉人"弹窗
    function openInviteFromRelationNetwork(groupId) {
        var group = (store.contacts || []).find(function(c){return c.id === groupId;});
        if (!group) return;

        // 可选的"源角色"列表：群内所有成员都可作为源
        var memberOptions = '';
        var members = Array.isArray(group.members) ? group.members : [];
        members.forEach(function(mid) {
            var m = (store.contacts || []).find(function(c){return c.id === mid;});
            if (!m) return;
            var hasRn = store.relationNetworks && store.relationNetworks[mid] && Array.isArray(store.relationNetworks[mid].characters) && store.relationNetworks[mid].characters.some(function(ch){return ch && ch.role !== 'user' && ch.role !== 'contact';});
            memberOptions += '<option value="' + mid + '" ' + (hasRn ? '' : 'disabled') + '>' + (m.name || '未命名') + (hasRn ? '' : '（无关系网）') + '</option>';
        });

        if (!memberOptions) {
            _toast('群内没有成员可作为关系网源', 'error');
            return;
        }

        var sourceId = _inferSourceContactForGroup(group) || members[0];

        var mask = document.createElement('div');
        mask.className = 'modal-mask rne-invite-mask';
        mask.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:10030;display:flex;align-items:center;justify-content:center;';
        mask.onclick = function(e){ if (e.target === mask) mask.remove(); };

        var box = document.createElement('div');
        box.style.cssText = 'width:92%;max-width:420px;max-height:82vh;overflow-y:auto;background:#fff;border-radius:12px;';
        box.innerHTML = ''
            + '<div style="padding:14px 18px;border-bottom:1px solid #eee;display:flex;justify-content:space-between;align-items:center;">'
            +   '<h3 style="margin:0;font-size:15px;">📌 从关系网添加</h3>'
            +   '<span onclick="this.closest(\'.modal-mask\').remove()" style="font-size:22px;cursor:pointer;color:#999;">&times;</span>'
            + '</div>'
            + '<div style="padding:10px 14px;background:#fafafa;">'
            +   '<label style="font-size:13px;color:#555;margin-right:6px;">源角色：</label>'
            +   '<select id="rne-invite-source" style="padding:6px 8px;border:1px solid #ddd;border-radius:6px;font-size:13px;background:#fff;">'
            +     memberOptions
            +   '</select>'
            + '</div>'
            + '<div id="rne-invite-list" style="max-height:50vh;overflow-y:auto;padding:6px 0;"></div>'
            + '<div style="padding:12px;border-top:1px solid #eee;display:flex;gap:8px;">'
            +   '<button id="rne-invite-confirm" style="flex:1;padding:10px;background:#07c160;color:#fff;border:none;border-radius:8px;font-size:14px;cursor:pointer;">确认邀请</button>'
            +   '<button onclick="this.closest(\'.modal-mask\').remove()" style="flex:1;padding:10px;background:#f5f5f5;color:#666;border:1px solid #ddd;border-radius:8px;font-size:14px;cursor:pointer;">取消</button>'
            + '</div>';
        mask.appendChild(box);
        (document.getElementById('device') || document.body).appendChild(mask);

        var srcSel = document.getElementById('rne-invite-source');
        if (srcSel) srcSel.value = sourceId;

        function renderList() {
            var sid = srcSel ? srcSel.value : sourceId;
            var npcs = getRelationNpcsForGroup(groupId, sid);
            var listEl = document.getElementById('rne-invite-list');
            if (!listEl) return;
            if (npcs.length === 0) {
                listEl.innerHTML = '<div style="padding:30px;text-align:center;color:#999;font-size:13px;">该角色的关系网中暂无可邀请的NPC</div>';
                return;
            }
            listEl.innerHTML = npcs.map(function(ch) {
                var av = ch.avatar || _ph(40);
                var tag = ch.linkedContactId ? '<span style="font-size:11px;color:#2a72bd;background:#e3f2fd;padding:2px 6px;border-radius:10px;margin-left:6px;">已关联联系人</span>' : '';
                return '<label style="display:flex;align-items:center;padding:10px 14px;border-bottom:1px solid #f5f5f5;cursor:pointer;">'
                    + '<input type="checkbox" value="' + ch.id + '" class="rne-invite-cb" style="width:16px;height:16px;margin-right:10px;accent-color:#07c160;">'
                    + '<img src="' + av + '" style="width:36px;height:36px;border-radius:50%;object-fit:cover;margin-right:10px;">'
                    + '<div style="flex:1;">'
                    +   '<div style="font-size:14px;font-weight:bold;">' + (ch.name || '未命名') + tag + '</div>'
                    +   '<div style="font-size:11px;color:#999;margin-top:2px;">' + [ch.contactRelation, ch.identity, ch.oneliner].filter(Boolean).join(' · ') + '</div>'
                    + '</div>'
                    + '</label>';
            }).join('');
        }
        if (srcSel) srcSel.onchange = renderList;
        renderList();

        document.getElementById('rne-invite-confirm').onclick = function() {
            var sid = srcSel ? srcSel.value : sourceId;
            var cbs = mask.querySelectorAll('.rne-invite-cb:checked');
            if (cbs.length === 0) { _toast('请至少选择一位NPC', 'error'); return; }
            var rn = store.relationNetworks[sid];
            var added = [];
            Array.prototype.forEach.call(cbs, function(cb) {
                var ch = rn.characters.find(function(c){return c.id === cb.value;});
                if (!ch) return;
                var contactId = _materializeNpcAsContact(ch, sid);
                if (!contactId) return;
                if (!Array.isArray(group.members)) group.members = [];
                if (group.members.indexOf(contactId) === -1) {
                    group.members.push(contactId);
                    var mc = (store.contacts || []).find(function(c){return c.id === contactId;});
                    added.push(mc ? mc.name : ch.name);
                }
            });
            if (added.length > 0) {
                if (!group.groupNicknames) group.groupNicknames = {};
                if (!group.groupTitles) group.groupTitles = {};
                if (!group.mutedMembers) group.mutedMembers = {};
                if (!store.chats[groupId]) store.chats[groupId] = [];
                store.chats[groupId].push({
                    sender: 'system',
                    type: 'poke',
                    content: added.join('、') + ' 被邀请加入了群聊',
                    time: Date.now()
                });
                _save();
                _toast('已邀请 ' + added.join('、') + ' 加入群聊');
                mask.remove();
                if (typeof openChatSettings === 'function') { try { openChatSettings(); } catch(e){} }
                if (typeof renderHistory === 'function') { try { renderHistory(); } catch(e){} }
            } else {
                _toast('这些NPC已在群里', 'info');
            }
        };
    }

    global.openInviteFromRelationNetwork = openInviteFromRelationNetwork;

    // ====================================================
    // 功能2-方式2：群聊AI回复后概率拉人
    // ====================================================

    // 判断并执行：在AI回复完一轮群聊后，可能触发拉人
    function maybeAutoInviteNpc(groupId) {
        try {
            var group = (store.contacts || []).find(function(c){return c.id === groupId;});
            if (!group || !group.isGroup) return;
            var s = group.settings || {};
            if (!s.allowNpcInvite) return;

            var chance = (typeof s.npcInviteChance === 'number') ? s.npcInviteChance : 0.15;
            if (chance <= 0) return;
            if (Math.random() > chance) return;

            var max = (typeof s.npcInviteMax === 'number') ? s.npcInviteMax : 3;
            var alreadyCount = Array.isArray(group.npcAutoInvitedIds) ? group.npcAutoInvitedIds.length : 0;
            if (alreadyCount >= max) return;

            var sourceId = _inferSourceContactForGroup(group);
            if (!sourceId) return;

            var candidates = getRelationNpcsForGroup(groupId, sourceId);
            if (candidates.length === 0) return;

            // 随机挑一个
            var pick = candidates[Math.floor(Math.random() * candidates.length)];
            var rn = store.relationNetworks[sourceId];
            var contactId = _materializeNpcAsContact(pick, sourceId);
            if (!contactId) return;

            if (!Array.isArray(group.members)) group.members = [];
            if (group.members.indexOf(contactId) > -1) return;
            group.members.push(contactId);
            if (!Array.isArray(group.npcAutoInvitedIds)) group.npcAutoInvitedIds = [];
            group.npcAutoInvitedIds.push(contactId);

            var srcContact = (store.contacts || []).find(function(c){return c.id === sourceId;});
            var inviterName = srcContact ? (srcContact.name || '角色') : '角色';
            var pickContact = (store.contacts || []).find(function(c){return c.id === contactId;});
            var npcName = pickContact ? pickContact.name : pick.name;
            var relText = pick.contactRelation ? '（' + pick.contactRelation + '）' : '';

            if (!store.chats[groupId]) store.chats[groupId] = [];
            store.chats[groupId].push({
                sender: 'system',
                type: 'poke',
                content: inviterName + ' 邀请 ' + npcName + relText + ' 加入了群聊',
                time: Date.now()
            });
            _save();
            if (typeof renderHistory === 'function' && typeof activeChatId !== 'undefined' && activeChatId === groupId) {
                try { renderHistory(); } catch (e) {}
            }
            console.log('[关系网拉人] ' + inviterName + ' 邀请 ' + npcName + ' 加入群聊 ' + group.name);
        } catch (err) {
            console.warn('[关系网拉人] 出错:', err);
        }
    }

    global.maybeAutoInviteNpc = maybeAutoInviteNpc;

    // ====================================================
    // 功能3：全局世界书挂载 helper 暴露
    // ====================================================

    global.isGlobalWbActiveFor = isGlobalWbActiveFor;
    global.getActiveGlobalWbIds = getActiveGlobalWbIds;
    global.migrateGlobalWbMounts = migrateGlobalWbMounts;

    // ====================================================
    // 功能4：关系网NPC评论朋友圈联动
    // NPC会以一定概率评论联系人/用户的朋友圈
    // ====================================================

    /**
     * 触发关系网NPC评论朋友圈
     * @param {number} momentId - 朋友圈ID
     * @param {string} momentText - 朋友圈文字内容
     * @param {string|null} authorContactId - 发布者的联系人ID（用户发的传null）
     * @param {string} authorName - 发布者名字
     */
    async function triggerNpcMomentComments(momentId, momentText, authorContactId, authorName) {
        try {
            if (!store || !store.relationNetworks) return;
            // [NPC朋友圈] 收集所有与发布者相关的NPC
            // 策略：遍历所有联系人的关系网，找到NPC角色
            const allNpcs = [];
            const seenNpcNames = new Set(); // 防止同名NPC重复评论

            Object.keys(store.relationNetworks).forEach(contactId => {
                const rn = store.relationNetworks[contactId];
                if (!rn || !rn.characters) return;
                const contact = store.contacts ? store.contacts.find(c => c.id === contactId) : null;
                if (!contact) return;

                rn.characters.forEach(ch => {
                    if (ch.role === 'user' || ch.role === 'contact') return; // 跳过主角
                    if (!ch.name || seenNpcNames.has(ch.name)) return;
                    // 检查NPC与发布者的关系：
                    // - 如果是用户发的朋友圈，NPC需要与user角色有关系
                    // - 如果是联系人发的朋友圈，NPC需要在该联系人的关系网中
                    const isRelevant = authorContactId
                        ? contactId === authorContactId // 联系人发的：只看该联系人自己的关系网
                        : true; // 用户发的：所有联系人的关系网里的NPC都可能看到
                    if (!isRelevant) return;

                    // 检查NPC是否与发布者有直接/间接关系
                    let hasRelation = false;
                    if (rn.relations) {
                        hasRelation = rn.relations.some(r =>
                            r.from === ch.id || r.to === ch.id
                        );
                    }
                    // 没有明确关系也可以评论，但概率更低
                    allNpcs.push({
                        ...ch,
                        ownerContactId: contactId,
                        ownerContactName: contact.name,
                        hasDirectRelation: hasRelation
                    });
                    seenNpcNames.add(ch.name);
                });
            });

            if (allNpcs.length === 0) return;

            // 为每个NPC决定是否评论（有关系30%概率，无关系10%概率）
            const commentingNpcs = allNpcs.filter(npc => {
                const prob = npc.hasDirectRelation ? 0.3 : 0.1;
                return Math.random() < prob;
            });

            // 最多3个NPC评论，避免刷屏
            const selected = commentingNpcs.slice(0, 3);
            if (selected.length === 0) return;

            // 依次生成NPC评论
            for (let i = 0; i < selected.length; i++) {
                const npc = selected[i];
                const delay = 3000 + i * 2000 + Math.random() * 3000;

                setTimeout(async () => {
                    try {
                        const m = store.moments.find(x => x.id === momentId);
                        if (!m) return;

                        // 构建NPC评论的prompt
                        let npcDesc = npc.name;
                        if (npc.identity) npcDesc += `（${npc.identity}）`;
                        if (npc.personality) npcDesc += `，性格：${npc.personality}`;
                        if (npc.contactRelation) npcDesc += `，与${npc.ownerContactName}的关系：${npc.contactRelation}`;

                        const existingComments = (m.comments || []).map(c => `${c.name}: ${c.text}`).join('\n');
                        const existingContext = existingComments ? `\n已有评论：\n${existingComments}` : '';

                        const sysPrompt = `你是「${npc.name}」，${npcDesc}。
你正在浏览朋友圈，看到了${authorName}发的一条动态。
${authorName}发布的内容："${(momentText || '[图片]').substring(0, 200)}"${existingContext}

【任务】以「${npc.name}」的身份写一条简短的朋友圈评论。
【要求】
1. 评论要符合你的性格和身份
2. 简短自然，5-30字，像真实的朋友圈评论
3. 可以评论内容、表达羡慕/赞同/调侃等
4. 如果已有其他人的评论，可以和他们的评论互动
5. 只输出评论文本本身，不要任何格式标记
6. 用中文`;

                        const data = await API.chatCompletion([
                            { role: 'system', content: sysPrompt },
                            { role: 'user', content: '写一条朋友圈评论' }
                        ], { temperature: 0.85, maxTokens: 100 });

                        if (data && data.choices && data.choices[0]) {
                            let commentText = (data.choices[0].message.content || '').trim();
                            // 清理格式标记
                            commentText = commentText.replace(/\[MOMENT_COMMENT:\s*/g, '').replace(/\]$/g, '').trim();
                            commentText = commentText.replace(/^["「『]|["」』]$/g, '').trim();
                            if (commentText && commentText.length > 0 && commentText.length < 200) {
                                const freshM = store.moments.find(x => x.id === momentId);
                                if (freshM) {
                                    if (!freshM.comments) freshM.comments = [];
                                    freshM.comments.push({
                                        name: npc.name,
                                        text: commentText,
                                        avatar: npc.avatar || null,
                                        isNpc: true // 标记为NPC评论
                                    });
                                    _save();
                                    // 如果朋友圈页面正在显示，刷新
                                    try {
                                        if (document.getElementById('tab-moments')?.classList.contains('active')) {
                                            if (typeof renderMoments === 'function') renderMoments();
                                        }
                                    } catch (_e) {}
                                }
                            }
                        }
                    } catch (err) {
                        console.warn('[NPC朋友圈评论] 生成失败:', npc.name, err.message);
                    }
                }, delay);
            }
        } catch (e) {
            console.warn('[NPC朋友圈评论] triggerNpcMomentComments error:', e);
        }
    }

    global.triggerNpcMomentComments = triggerNpcMomentComments;

    // 初始化时执行一次迁移
    function _init() {
        try {
            if (typeof store !== 'undefined' && store) migrateGlobalWbMounts();
        } catch (e) { /* noop */ }
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', _init);
    } else {
        // store 可能尚未初始化，延迟执行
        setTimeout(_init, 500);
    }

})(typeof window !== 'undefined' ? window : this);
