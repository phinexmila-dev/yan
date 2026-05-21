        // ===== 全局世界书选择 =====
        // [升级] 支持每本全局世界书选择挂载范围（全部/指定/排除联系人）
        // 数据结构：store.globalWbMounts = { [wbId]: { mode: 'all'|'custom'|'exclude', contactIds: [] } }
        function _ensureGlobalWbData() {
            if (!store.globalWbIds) store.globalWbIds = [];
            if (!store.globalWbMounts) store.globalWbMounts = {};
            // 迁移：旧的 globalWbIds 中有但 Mounts 中没有的，按 all 模式写入
            store.globalWbIds.forEach(id => {
                const k = String(id);
                if (!store.globalWbMounts[k]) {
                    store.globalWbMounts[k] = { mode: 'all', contactIds: [] };
                }
            });
            // 同步：Mounts 中有的ID都要在 globalWbIds 里
            Object.keys(store.globalWbMounts).forEach(k => {
                if (!store.globalWbIds.some(id => String(id) === k)) store.globalWbIds.push(k);
            });
        }
        
        function _modeLabel(mode) {
            return mode === 'custom' ? '指定联系人' : mode === 'exclude' ? '排除联系人' : '全部联系人';
        }
        
        function renderGWBGlobalTab() {
            const container = document.getElementById('gwb-tab-content');
            if (!container) return;
            const allWbs = store.worldbooks || [];
            _ensureGlobalWbData();
            
            if (allWbs.length === 0) {
                container.innerHTML = '<div style="text-align:center;padding:40px 20px;">' +
                    '<div style="font-size:14px;color:#999;margin-bottom:14px;">还没有世界书</div>' +
                    '<button onclick="if(typeof switchGWBTab===\'function\') switchGWBTab(\'edit\');" style="padding:8px 20px;background:#333;color:#fff;border:none;border-radius:6px;font-size:13px;cursor:pointer;">去创建世界书</button>' +
                '</div>';
                return;
            }
            
            const categories = store.categories || [];
            const grouped = {};
            const uncategorized = [];
            allWbs.forEach(wb => {
                if (wb.cate && categories.includes(wb.cate)) {
                    if (!grouped[wb.cate]) grouped[wb.cate] = [];
                    grouped[wb.cate].push(wb);
                } else {
                    uncategorized.push(wb);
                }
            });
            
            // 全选按钮
            const allSelected = allWbs.every(wb => store.globalWbIds.some(id => String(id) === String(wb.id)));
            let html = `<div style="margin-bottom:12px;font-size:13px;color:#888;line-height:1.6;">
                设为全局的世界书会自动应用到联系人，支持精细控制挂载范围：<br>
                <b>全部联系人</b>（默认）· <b>仅指定联系人</b> · <b>排除指定联系人</b>
            </div>`;
            html += `<div onclick="toggleGlobalWbAll()" style="padding:10px;border:1px solid ${allSelected ? '#333' : '#ddd'};border-radius:6px;cursor:pointer;background:${allSelected ? '#f5f5f5' : '#fafafa'};display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;font-weight:bold;">
                <span style="color:#333;">全选所有世界书（默认全部挂载）</span>
                ${allSelected ? '<i class="fas fa-check-square" style="color:#333;font-size:16px;"></i>' : '<i class="far fa-square" style="color:#ccc;font-size:16px;"></i>'}
            </div>`;
            
            function _renderWbItem(wb, indent) {
                const isSelected = store.globalWbIds.some(id => String(id) === String(wb.id));
                const mount = store.globalWbMounts[String(wb.id)] || { mode: 'all', contactIds: [] };
                const padLeft = indent ? 24 : 10;
                let line = `<div style="padding:10px 10px 10px ${padLeft}px;border:1px solid ${isSelected ? '#333' : '#eee'};border-radius:6px;background:${isSelected ? '#f5f5f5' : '#fff'};margin-bottom:4px;">`;
                line += `<div onclick="toggleGlobalWb('${wb.id}')" style="display:flex;justify-content:space-between;align-items:center;cursor:pointer;">
                    <span style="color:#444;">${wb.name}</span>
                    ${isSelected ? '<i class="fas fa-check-square" style="color:#333;"></i>' : '<i class="far fa-square" style="color:#ddd;"></i>'}
                </div>`;
                if (isSelected) {
                    const scopeInfo = mount.mode === 'all' ? '全部联系人' :
                        (_modeLabel(mount.mode) + '：' + ((mount.contactIds || []).length) + '位');
                    line += `<div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px;padding-top:6px;border-top:1px dashed #e0e0e0;font-size:12px;">
                        <span style="color:#667eea;"><i class="fas fa-user-friends"></i> 挂载范围：${scopeInfo}</span>
                        <button onclick="event.stopPropagation(); openGwbScopeEditor('${wb.id}')" style="padding:4px 10px;border:1px solid #667eea;background:#fff;color:#667eea;border-radius:12px;font-size:11px;cursor:pointer;">编辑范围</button>
                    </div>`;
                }
                line += '</div>';
                return line;
            }
            
            // 分类
            categories.forEach(cateName => {
                const wbs = grouped[cateName];
                if (!wbs || wbs.length === 0) return;
                const cateAllSelected = wbs.every(wb => store.globalWbIds.some(id => String(id) === String(wb.id)));
                html += `<div style="margin-top:8px;">
                    <div onclick="toggleGlobalWbCategory('${cateName}')" style="padding:8px 10px;border:1px solid ${cateAllSelected ? '#333' : '#ddd'};border-radius:6px;cursor:pointer;background:${cateAllSelected ? '#f0f0f0' : '#f7f7f7'};display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                        <span style="font-weight:bold;color:#555;">${cateName} (${wbs.length})</span>
                        ${cateAllSelected ? '<i class="fas fa-check-square" style="color:#333;"></i>' : '<span style="font-size:12px;color:#999;">全选分类</span>'}
                    </div>`;
                wbs.forEach(wb => { html += _renderWbItem(wb, true); });
                html += '</div>';
            });
            
            // 未分类
            if (uncategorized.length > 0) {
                if (categories.length > 0) {
                    html += '<div style="margin-top:8px;padding:4px 0;font-size:12px;color:#999;border-top:1px solid #eee;">未分类</div>';
                }
                uncategorized.forEach(wb => { html += _renderWbItem(wb, false); });
            }
            
            // [FIX-世界书数量] 防御性过滤：只计算实际存在的世界书
            const _validGlobalCount = store.globalWbIds.filter(id => allWbs.some(wb => String(wb.id) === String(id))).length;
            html += `<div style="margin-top:16px;padding-top:12px;border-top:1px solid #eee;">
                <div style="font-size:12px;color:#999;">当前全局应用: ${_validGlobalCount} 本世界书</div>
            </div>`;
            
            container.innerHTML = html;
        }
        
        function toggleGlobalWb(wbId) {
            _ensureGlobalWbData();
            const key = String(wbId);
            const idx = store.globalWbIds.findIndex(id => String(id) === key);
            if (idx > -1) {
                store.globalWbIds.splice(idx, 1);
                delete store.globalWbMounts[key];
            } else {
                store.globalWbIds.push(wbId);
                if (!store.globalWbMounts[key]) store.globalWbMounts[key] = { mode: 'all', contactIds: [] };
            }
            save();
            renderGWBGlobalTab();
        }
        
        // 打开某本全局世界书的挂载范围编辑器
        window.openGwbScopeEditor = function(wbId) {
            _ensureGlobalWbData();
            const wb = (store.worldbooks || []).find(w => String(w.id) === String(wbId));
            if (!wb) return;
            const key = String(wbId);
            const mount = store.globalWbMounts[key] || { mode: 'all', contactIds: [] };
            const allContacts = (store.contacts || []);
            
            const mask = document.createElement('div');
            mask.className = 'modal-mask';
            mask.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:10050;display:flex;align-items:center;justify-content:center;';
            mask.onclick = (e) => { if (e.target === mask) mask.remove(); };
            
            const box = document.createElement('div');
            box.style.cssText = 'width:92%;max-width:420px;max-height:82vh;overflow:hidden;display:flex;flex-direction:column;background:#fff;border-radius:12px;';
            
            const contactsHtml = allContacts.map(c => {
                const checked = (mount.contactIds || []).indexOf(c.id) > -1 ? 'checked' : '';
                const badge = c.isGroup ? '<span style="font-size:11px;color:#999;margin-left:4px;">(群)</span>' : '';
                return `<label style="display:flex;align-items:center;padding:8px 12px;border-bottom:1px solid #f5f5f5;cursor:pointer;">
                    <input type="checkbox" value="${c.id}" ${checked} class="gwb-scope-cb" style="width:15px;height:15px;margin-right:8px;accent-color:#667eea;">
                    <img src="${c.avatar || _ph(36)}" style="width:28px;height:28px;border-radius:6px;object-fit:cover;margin-right:8px;">
                    <span style="flex:1;font-size:13px;">${c.name || '未命名'}${badge}</span>
                </label>`;
            }).join('');
            
            box.innerHTML = `
                <div style="padding:14px 18px;border-bottom:1px solid #eee;display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
                    <div>
                        <h3 style="margin:0;font-size:15px;">挂载范围：${wb.name}</h3>
                        <div style="font-size:12px;color:#999;margin-top:3px;">设置此全局世界书对哪些联系人生效</div>
                    </div>
                    <span onclick="this.closest('.modal-mask').remove()" style="font-size:22px;cursor:pointer;color:#999;">&times;</span>
                </div>
                <div style="padding:12px 16px;flex-shrink:0;">
                    <div style="display:flex;gap:6px;margin-bottom:10px;">
                        <button class="gwb-mode-btn" data-mode="all" style="flex:1;padding:8px;border:2px solid ${mount.mode==='all'?'#667eea':'#ddd'};border-radius:6px;background:${mount.mode==='all'?'#eef1ff':'#fff'};color:${mount.mode==='all'?'#667eea':'#666'};font-size:12px;cursor:pointer;font-weight:${mount.mode==='all'?'bold':'normal'};">全部联系人</button>
                        <button class="gwb-mode-btn" data-mode="custom" style="flex:1;padding:8px;border:2px solid ${mount.mode==='custom'?'#667eea':'#ddd'};border-radius:6px;background:${mount.mode==='custom'?'#eef1ff':'#fff'};color:${mount.mode==='custom'?'#667eea':'#666'};font-size:12px;cursor:pointer;font-weight:${mount.mode==='custom'?'bold':'normal'};">仅指定</button>
                        <button class="gwb-mode-btn" data-mode="exclude" style="flex:1;padding:8px;border:2px solid ${mount.mode==='exclude'?'#667eea':'#ddd'};border-radius:6px;background:${mount.mode==='exclude'?'#eef1ff':'#fff'};color:${mount.mode==='exclude'?'#667eea':'#666'};font-size:12px;cursor:pointer;font-weight:${mount.mode==='exclude'?'bold':'normal'};">排除</button>
                    </div>
                    <div id="gwb-scope-hint" style="padding:6px 10px;background:#f8f9ff;border-radius:6px;font-size:12px;color:#667eea;line-height:1.5;">
                        ${mount.mode==='all'?'✅ 将对所有联系人生效（默认）':mount.mode==='custom'?'👇 仅勾选下方列表中的联系人会生效':'👇 下方勾选的联系人将被排除，其余都生效'}
                    </div>
                </div>
                <div id="gwb-scope-list" style="flex:1;overflow-y:auto;border-top:1px solid #eee;${mount.mode==='all'?'display:none;':''}">${contactsHtml}</div>
                <div style="padding:12px;border-top:1px solid #eee;display:flex;gap:8px;flex-shrink:0;">
                    <button id="gwb-scope-save" style="flex:1;padding:10px;background:#667eea;color:#fff;border:none;border-radius:8px;font-size:14px;cursor:pointer;font-weight:bold;">保存</button>
                    <button onclick="this.closest('.modal-mask').remove()" style="flex:1;padding:10px;background:#f5f5f5;color:#666;border:1px solid #ddd;border-radius:8px;font-size:14px;cursor:pointer;">取消</button>
                </div>`;
            mask.appendChild(box);
            (document.getElementById('device') || document.body).appendChild(mask);
            
            let currentMode = mount.mode || 'all';
            const listEl = box.querySelector('#gwb-scope-list');
            const hintEl = box.querySelector('#gwb-scope-hint');
            box.querySelectorAll('.gwb-mode-btn').forEach(btn => {
                btn.onclick = function() {
                    currentMode = this.dataset.mode;
                    box.querySelectorAll('.gwb-mode-btn').forEach(b => {
                        const m = b.dataset.mode;
                        const on = (m === currentMode);
                        b.style.border = '2px solid ' + (on?'#667eea':'#ddd');
                        b.style.background = on?'#eef1ff':'#fff';
                        b.style.color = on?'#667eea':'#666';
                        b.style.fontWeight = on?'bold':'normal';
                    });
                    if (listEl) listEl.style.display = currentMode === 'all' ? 'none' : '';
                    if (hintEl) hintEl.textContent = currentMode==='all'?'✅ 将对所有联系人生效（默认）':currentMode==='custom'?'👇 仅勾选下方列表中的联系人会生效':'👇 下方勾选的联系人将被排除，其余都生效';
                };
            });
            
            box.querySelector('#gwb-scope-save').onclick = function() {
                const cbs = box.querySelectorAll('.gwb-scope-cb:checked');
                const ids = Array.prototype.map.call(cbs, cb => cb.value);
                store.globalWbMounts[key] = { mode: currentMode, contactIds: currentMode === 'all' ? [] : ids };
                save();
                mask.remove();
                renderGWBGlobalTab();
                if (typeof toast === 'function') toast('挂载范围已保存');
            };
        };
        
        function toggleGlobalWbCategory(cateName) {
            _ensureGlobalWbData();
            const allWbs = store.worldbooks || [];
            const cateWbs = allWbs.filter(wb => wb.cate === cateName);
            const allSelected = cateWbs.every(wb => store.globalWbIds.some(id => String(id) === String(wb.id)));
            if (allSelected) {
                cateWbs.forEach(wb => {
                    const k = String(wb.id);
                    const idx = store.globalWbIds.findIndex(id => String(id) === k);
                    if (idx > -1) store.globalWbIds.splice(idx, 1);
                    delete store.globalWbMounts[k];
                });
            } else {
                cateWbs.forEach(wb => {
                    const k = String(wb.id);
                    if (!store.globalWbIds.some(id => String(id) === k)) store.globalWbIds.push(wb.id);
                    if (!store.globalWbMounts[k]) store.globalWbMounts[k] = { mode: 'all', contactIds: [] };
                });
            }
            save();
            renderGWBGlobalTab();
        }
        
        function toggleGlobalWbAll() {
            _ensureGlobalWbData();
            const allWbs = store.worldbooks || [];
            const allSelected = allWbs.every(wb => store.globalWbIds.some(id => String(id) === String(wb.id)));
            if (allSelected) {
                store.globalWbIds = [];
                store.globalWbMounts = {};
            } else {
                store.globalWbIds = allWbs.map(wb => wb.id);
                allWbs.forEach(wb => {
                    const k = String(wb.id);
                    if (!store.globalWbMounts[k]) store.globalWbMounts[k] = { mode: 'all', contactIds: [] };
                });
            }
            save();
            renderGWBGlobalTab();
        }
        
        // ===== 批量挂载世界书到联系人 =====
        var batchMountSelectedWbs = [];
        var batchMountSelectedContacts = [];
        var batchMountStep = 1; // 1: 选世界书, 2: 选联系人
        
        function renderGWBBatchTab() {
            const container = document.getElementById('gwb-tab-content');
            if (!container) return;
            
            if (batchMountStep === 1) {
                renderBatchSelectWB(container);
            } else {
                renderBatchSelectContacts(container);
            }
        }
        
        function renderBatchSelectWB(container) {
            const allWbs = store.worldbooks || [];
            if (allWbs.length === 0) {
                container.innerHTML = '<div style="text-align:center;padding:40px 20px;">' +
                    '<div style="font-size:14px;color:#999;margin-bottom:14px;">还没有世界书</div>' +
                    '<button onclick="if(typeof switchGWBTab===\'function\') switchGWBTab(\'edit\');" style="padding:8px 20px;background:#333;color:#fff;border:none;border-radius:6px;font-size:13px;cursor:pointer;">去创建世界书</button>' +
                '</div>';
                return;
            }
            
            const categories = store.categories || [];
            const grouped = {};
            const uncategorized = [];
            allWbs.forEach(wb => {
                if (wb.cate && categories.includes(wb.cate)) {
                    if (!grouped[wb.cate]) grouped[wb.cate] = [];
                    grouped[wb.cate].push(wb);
                } else {
                    uncategorized.push(wb);
                }
            });
            
            let html = `<div style="margin-bottom:12px;font-size:13px;color:#888;">
                第1步：选择要挂载的世界书，然后点击"下一步"选择联系人
            </div>`;
            
            // 全选
            const allSelected = allWbs.every(wb => batchMountSelectedWbs.some(id => String(id) === String(wb.id)));
            html += `<div onclick="toggleBatchWbAll()" style="padding:10px;border:1px solid ${allSelected ? '#333' : '#ddd'};border-radius:6px;cursor:pointer;background:${allSelected ? '#f0f0f0' : '#fafafa'};display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;font-weight:bold;">
                <span style="color:#333;">全选所有世界书</span>
                ${allSelected ? '<i class="fas fa-check-square" style="color:#333;font-size:16px;"></i>' : '<i class="far fa-square" style="color:#ccc;font-size:16px;"></i>'}
            </div>`;
            
            // 分类
            categories.forEach(cateName => {
                const wbs = grouped[cateName];
                if (!wbs || wbs.length === 0) return;
                const cateAllSelected = wbs.every(wb => batchMountSelectedWbs.some(id => String(id) === String(wb.id)));
                html += `<div style="margin-top:6px;">
                    <div onclick="toggleBatchWbCategory('${cateName}')" style="padding:8px 10px;border:1px solid ${cateAllSelected ? '#333' : '#ddd'};border-radius:6px;cursor:pointer;background:${cateAllSelected ? '#f0f0f0' : '#f7f7f7'};display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                        <span style="font-weight:bold;color:#555;">${cateName}</span>
                        ${cateAllSelected ? '<i class="fas fa-check-square" style="color:#333;"></i>' : ''}
                    </div>`;
                wbs.forEach(wb => {
                    const isSel = batchMountSelectedWbs.some(id => String(id) === String(wb.id));
                    html += `<div onclick="toggleBatchWb('${wb.id}')" style="padding:10px 10px 10px 24px;border:1px solid ${isSel ? '#333' : '#eee'};border-radius:6px;cursor:pointer;background:${isSel ? '#f5f5f5' : '#fff'};display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                        <span style="color:#444;">${wb.name}</span>
                        ${isSel ? '<i class="fas fa-check-square" style="color:#333;"></i>' : '<i class="far fa-square" style="color:#ddd;"></i>'}
                    </div>`;
                });
                html += '</div>';
            });
            
            if (uncategorized.length > 0) {
                if (categories.length > 0) html += '<div style="margin-top:6px;padding:4px 0;font-size:12px;color:#999;border-top:1px solid #eee;">未分类</div>';
                uncategorized.forEach(wb => {
                    const isSel = batchMountSelectedWbs.some(id => String(id) === String(wb.id));
                    html += `<div onclick="toggleBatchWb('${wb.id}')" style="padding:10px;border:1px solid ${isSel ? '#333' : '#eee'};border-radius:6px;cursor:pointer;background:${isSel ? '#f5f5f5' : '#fff'};display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                        <span style="color:#444;">${wb.name}</span>
                        ${isSel ? '<i class="fas fa-check-square" style="color:#333;"></i>' : '<i class="far fa-square" style="color:#ddd;"></i>'}
                    </div>`;
                });
            }
            
            html += `<div style="margin-top:16px;display:flex;gap:10px;">
                <button onclick="batchMountStep=1;batchMountSelectedWbs=[];renderGWBBatchTab()" style="flex:1;padding:12px;border:1px solid #ccc;border-radius:8px;background:#f5f5f5;font-size:14px;cursor:pointer;color:#666;">重置</button>
                <button onclick="if(batchMountSelectedWbs.length===0){toast('请至少选择一本世界书');return;}batchMountStep=2;batchMountSelectedContacts=[];renderGWBBatchTab()" style="flex:2;padding:12px;border:none;border-radius:8px;background:#333;color:#fff;font-size:14px;font-weight:bold;cursor:pointer;">下一步 - 选联系人 (${batchMountSelectedWbs.length}本)</button>
            </div>`;
            
            container.innerHTML = html;
        }
        
        function renderBatchSelectContacts(container) {
            const contacts = (store.contacts || []).filter(c => !c.isGroup);
            const groups = (store.contacts || []).filter(c => c.isGroup);
            const allContacts = store.contacts || [];
            
            let html = `<div style="margin-bottom:12px;font-size:13px;color:#888;">
                第2步：选择要挂载的联系人，然后点击"确认挂载"
            </div>`;
            
            // 全选
            const allSelected = allContacts.every(c => batchMountSelectedContacts.includes(c.id));
            html += `<div onclick="toggleBatchContactAll()" style="padding:10px;border:1px solid ${allSelected ? '#333' : '#ddd'};border-radius:6px;cursor:pointer;background:${allSelected ? '#f0f0f0' : '#fafafa'};display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;font-weight:bold;">
                <span style="color:#333;">全选所有联系人 (${allContacts.length})</span>
                ${allSelected ? '<i class="fas fa-check-square" style="color:#333;font-size:16px;"></i>' : '<i class="far fa-square" style="color:#ccc;font-size:16px;"></i>'}
            </div>`;
            
            // 私聊联系人
            if (contacts.length > 0) {
                html += '<div style="font-size:13px;color:#666;margin:8px 0 6px;font-weight:bold;">私聊联系人</div>';
                contacts.forEach(c => {
                    const isSel = batchMountSelectedContacts.includes(c.id);
                    const displayName = c.remark || c.name;
                    const avatarHtml = c.avatar ? `<img src="${c.avatar}" style="width:32px;height:32px;border-radius:50%;object-fit:cover;margin-right:10px;">` : `<div style="width:32px;height:32px;border-radius:50%;background:#e0e0e0;display:flex;align-items:center;justify-content:center;margin-right:10px;font-size:14px;color:#999;">${displayName[0]}</div>`;
                    html += `<div onclick="toggleBatchContact('${c.id}')" style="padding:8px 10px;border:1px solid ${isSel ? '#333' : '#eee'};border-radius:6px;cursor:pointer;background:${isSel ? '#f5f5f5' : '#fff'};display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
                        <div style="display:flex;align-items:center;">${avatarHtml}<span style="color:#444;">${displayName}</span></div>
                        ${isSel ? '<i class="fas fa-check-square" style="color:#333;"></i>' : '<i class="far fa-square" style="color:#ddd;"></i>'}
                    </div>`;
                });
            }
            
            // 群聊
            if (groups.length > 0) {
                html += '<div style="font-size:13px;color:#666;margin:12px 0 6px;font-weight:bold;">群聊</div>';
                groups.forEach(c => {
                    const isSel = batchMountSelectedContacts.includes(c.id);
                    const displayName = c.remark || c.name;
                    html += `<div onclick="toggleBatchContact('${c.id}')" style="padding:8px 10px;border:1px solid ${isSel ? '#333' : '#eee'};border-radius:6px;cursor:pointer;background:${isSel ? '#f5f5f5' : '#fff'};display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
                        <div style="display:flex;align-items:center;"><div style="width:32px;height:32px;border-radius:50%;background:#e0e0e0;display:flex;align-items:center;justify-content:center;margin-right:10px;font-size:12px;color:#999;">群</div><span style="color:#444;">${displayName}</span></div>
                        ${isSel ? '<i class="fas fa-check-square" style="color:#333;"></i>' : '<i class="far fa-square" style="color:#ddd;"></i>'}
                    </div>`;
                });
            }
            
            html += `<div style="margin-top:16px;display:flex;gap:10px;">
                <button onclick="batchMountStep=1;renderGWBBatchTab()" style="flex:1;padding:12px;border:1px solid #ccc;border-radius:8px;background:#f5f5f5;font-size:14px;cursor:pointer;color:#666;">上一步</button>
                <button onclick="executeBatchMount()" style="flex:2;padding:12px;border:none;border-radius:8px;background:#333;color:#fff;font-size:14px;font-weight:bold;cursor:pointer;">确认挂载 (${batchMountSelectedContacts.length}人)</button>
            </div>`;
            
            container.innerHTML = html;
        }
        
        function toggleBatchWb(wbId) {
            const idx = batchMountSelectedWbs.findIndex(id => String(id) === String(wbId));
            if (idx > -1) batchMountSelectedWbs.splice(idx, 1);
            else batchMountSelectedWbs.push(wbId);
            renderGWBBatchTab();
        }
        
        function toggleBatchWbAll() {
            const allWbs = store.worldbooks || [];
            const allSelected = allWbs.every(wb => batchMountSelectedWbs.some(id => String(id) === String(wb.id)));
            batchMountSelectedWbs = allSelected ? [] : allWbs.map(wb => wb.id);
            renderGWBBatchTab();
        }
        
        function toggleBatchWbCategory(cateName) {
            const allWbs = store.worldbooks || [];
            const cateWbs = allWbs.filter(wb => wb.cate === cateName);
            const allSelected = cateWbs.every(wb => batchMountSelectedWbs.some(id => String(id) === String(wb.id)));
            if (allSelected) {
                cateWbs.forEach(wb => {
                    const idx = batchMountSelectedWbs.findIndex(id => String(id) === String(wb.id));
                    if (idx > -1) batchMountSelectedWbs.splice(idx, 1);
                });
            } else {
                cateWbs.forEach(wb => {
                    if (!batchMountSelectedWbs.some(id => String(id) === String(wb.id))) batchMountSelectedWbs.push(wb.id);
                });
            }
            renderGWBBatchTab();
        }
        
        function toggleBatchContact(contactId) {
            const idx = batchMountSelectedContacts.indexOf(contactId);
            if (idx > -1) batchMountSelectedContacts.splice(idx, 1);
            else batchMountSelectedContacts.push(contactId);
            renderGWBBatchTab();
        }
        
        function toggleBatchContactAll() {
            const allContacts = store.contacts || [];
            const allSelected = allContacts.every(c => batchMountSelectedContacts.includes(c.id));
            batchMountSelectedContacts = allSelected ? [] : allContacts.map(c => c.id);
            renderGWBBatchTab();
        }
        
        function executeBatchMount() {
            if (batchMountSelectedContacts.length === 0) {
                toast('请至少选择一个联系人');
                return;
            }
            if (batchMountSelectedWbs.length === 0) {
                toast('请至少选择一本世界书');
                return;
            }
            
            let mountedCount = 0;
            batchMountSelectedContacts.forEach(contactId => {
                const c = store.contacts.find(x => x.id === contactId);
                if (c) {
                    if (!c.settings) c.settings = {};
                    if (!c.settings.mountedWbIds) c.settings.mountedWbIds = [];
                    // 合并挂载（去重）
                    batchMountSelectedWbs.forEach(wbId => {
                        if (!c.settings.mountedWbIds.some(id => String(id) === String(wbId))) {
                            c.settings.mountedWbIds.push(wbId);
                        }
                    });
                    mountedCount++;
                }
            });
            
            save();
            toast(`已为 ${mountedCount} 个联系人挂载 ${batchMountSelectedWbs.length} 本世界书`, 'success');
            
            // 重置状态
            batchMountStep = 1;
            batchMountSelectedWbs = [];
            batchMountSelectedContacts = [];
            
            // 关闭弹窗
            const overlay = document.getElementById('global-wb-settings-overlay');
            if (overlay) overlay.remove();
        }

        // --- COUPLE ---
        // --- COUPLE SPACE SYSTEM (Multi-space) ---
        function migrateCoupleData() {
            if (!store.coupleSpaces || !Array.isArray(store.coupleSpaces)) store.coupleSpaces = [];
            if (store.couple && store.couple.partnerId && store.coupleSpaces.length === 0) {
                store.coupleSpaces.push({
                    id: 'cs_' + Date.now(),
                    partnerId: store.couple.partnerId,
                    start: store.couple.start || '',
                    wishes: store.couple.wishes || [],
                    anniversaries: store.couple.anniversaries || [],
                    cycleDate: store.couple.cycleDate || '',
                    cycleLen: store.couple.cycleLen || 28,
                    periodLen: store.couple.periodLen || 5,
                    periodHistory: store.couple.periodHistory || [],
                    periodDiary: store.couple.periodDiary || [],
                    reminderEnabled: store.couple.reminderEnabled || false,
                    reminderDaysBefore: store.couple.reminderDaysBefore || 3,
                    careContacts: store.couple.careContacts || [],
                    lastReminderDate: store.couple.lastReminderDate || '',
                    bgImage: '',
                    textColor: '#ffffff',
                    photoWall: [], diaries: [],
                    socialAccount: { name: '', handle: '', avatar: '', bio: '', banner: '', posts: [] }
                });
                save();
            }
            // 为旧空间补充新字段
            if (store.coupleSpaces && store.coupleSpaces.length > 0) {
                store.coupleSpaces.forEach(sp => {
                    if (!sp.photoWall) sp.photoWall = [];
                    if (!sp.diaries) sp.diaries = [];
                    if (!sp.socialAccount) sp.socialAccount = { name: '', handle: '', avatar: '', bio: '', banner: '', posts: [] };
                });
            }
        }

        function getCurrentCoupleSpace() {
            if (!currentCoupleSpaceId || !store.coupleSpaces) return null;
            return store.coupleSpaces.find(s => s.id === currentCoupleSpaceId);
        }

        function openCoupleSelector() {
            coupleViewMode = 'selector';
            renderCouple();
        }
        
        function gotoCoupleDetail(spaceId) {
            currentCoupleSpaceId = spaceId;
            // 切换情侣空间时重置秘密和状态数据，防止不同联系人之间串数据
            secretState.cards = [];
            secretState.generating = false;
            secretState.cardLocks = {};
            secretState.blindboxResult = null;
            secretState.interrogateHistory = [];
            secretState.trueFalseCards = [];
            secretState.trueFalseRevealed = false;
            secretState.immerseStory = null;
            statusState.data = null;
            statusState.generating = false;
            statusState.selectedBubble = null;
            statusState.baseVitals = null;
            statusState.currentVitals = null;
            // 重置触摸互动状态
            if (window.touchInteractState) {
                touchInteractState._loadedSpaceId = null;
            }
            coupleViewMode = 'detail';
            renderCouple();
        }

        function renderCouple() {
            migrateCoupleData();
            const area = document.getElementById('couple-content-area');
            if(!area) return;
            area.innerHTML = '';

            if (coupleViewMode === 'list') {
                renderCoupleList(area);
            } else if (coupleViewMode === 'selector') {
                renderCoupleSelector(area);
            } else if (coupleViewMode === 'detail') {
                renderCoupleDetail(area);
            } else if (coupleViewMode.startsWith('sub_')) {
                renderCoupleSubPage(area, coupleViewMode.replace('sub_', ''));
            }
        }

        function renderCoupleList(area) {
            let html = `
                <div class="nav-bar">
                    <div class="nav-icon" onclick="exitApp()"><i class="fas fa-chevron-left"></i></div>
                    <div class="nav-title">情侣空间</div>
                    <div class="nav-icon" onclick="openCoupleSelector()"><i class="fas fa-plus"></i></div>
                </div>
                <div class="couple-list-page">
            `;
            if (store.coupleSpaces && store.coupleSpaces.length > 0) {
                store.coupleSpaces.forEach(space => {
                    const p = store.contacts.find(x => x.id === space.partnerId);
                    const days = space.start ? Math.max(0, Math.floor((new Date() - new Date(space.start)) / (1000*60*60*24))) : 0;
                    html += `
                        <div class="couple-list-card" onclick="gotoCoupleDetail('${space.id}')">
                            <div class="couple-list-avatars">
                                <img src="${getUserPersonaAvatar(p)}">
                                <img src="${(p && p.avatar) ? p.avatar : _ph(50)}">
                            </div>
                            <div class="couple-list-info">
                                <div class="couple-list-name">${getUserPersonaName(p, '我')} & ${p ? p.name : 'TA'}</div>
                                <div class="couple-list-days"><i class="fas fa-heart" style="margin-right:4px;"></i>在一起 ${days} 天</div>
                            </div>
                            <i class="fas fa-chevron-right" style="color:#ccc; margin-left:8px;"></i>
                        </div>
                    `;
                });
            } else {
                html += `<div style="text-align:center; color:#999; margin-top:100px;"><i class="far fa-heart" style="font-size:48px; color:#ddd; margin-bottom:15px; display:block;"></i>暂无情侣空间<br>点击右上角 + 建立</div>`;
            }
            html += `</div>`;
            area.innerHTML = html;
        }

        function renderCoupleSelector(area) {
            try {
            const privateContacts = (store.contacts || []).filter(c => !c.isGroup);
            // 检查哪些联系人已有情侣空间
            const existingSpaces = store.coupleSpaces || [];
            const chats = store.chats || {};
            // [FIX-iOS加载失败] 预生成fallback头像base64，避免在iOS WebView中内联SVG data URI解析异常
            const _fallbackAvatar = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC4AAAAuCAYAAABXuSs3AAAAOklEQVRoge3OMQEAIAzAMMC/5+GAlx6Jgh7dM7ONuwdcNe4ecNW4e8BV4+4BV427B1w17h5w1bh7wAdYjAQuBiMBogAAAABJRU5ErkJggg==';
            // [FIX-iOS安全] 逐个生成联系人HTML，避免map中异常导致整体崩溃
            let contactListHtml = '';
            for (let ci = 0; ci < privateContacts.length; ci++) {
                try {
                    const c = privateContacts[ci];
                    if (!c || !c.id) continue;
                    const hasSpace = existingSpaces.find(s => s.partnerId === c.id);
                    const chatArr = chats[c.id];
                    const hasPendingInvite = !hasSpace && Array.isArray(chatArr) && chatArr.some(m => m && m.type === 'couple-invite' && m.status === 'pending');
                    // [FIX-iOS] 安全获取头像：_ph可能未定义，avatar可能为非字符串
                    const avatarSrc = (typeof c.avatar === 'string' && c.avatar) ? c.avatar : (typeof _ph === 'function' ? _ph(46) : _fallbackAvatar);
                    // [FIX-iOS] 转义联系人ID中的特殊字符，防止破坏onclick
                    const safeId = (c.id || '').replace(/'/g, "\\'");
                    const safeName = (c.name || '未命名').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                    let clickAction = '';
                    if (hasSpace) {
                        clickAction = '';
                    } else if (hasPendingInvite) {
                        clickAction = "toast('已发送过邀请，请到聊天中生成回应')";
                    } else {
                        clickAction = "sendCoupleInvite('" + safeId + "')";
                    }
                    let statusHtml = '';
                    if (hasSpace) statusHtml = '<div style="font-size:11px;color:#ff6b6b;">已绑定</div>';
                    else if (hasPendingInvite) statusHtml = '<div style="font-size:11px;color:#e8a0b4;">邀请待回应</div>';
                    let trailHtml = '';
                    if (hasSpace) {
                        trailHtml = '<div onclick="event.stopPropagation();sendUnbindRequest(\'' + safeId + '\')" style="width:28px;height:28px;border-radius:50%;background:rgba(255,59,48,0.1);display:flex;align-items:center;justify-content:center;margin-right:4px;cursor:pointer;" title="解除绑定"><i class="fas fa-times" style="color:#ff3b30;font-size:13px;"></i></div>';
                    } else {
                        trailHtml = '<i class="fas fa-heart" style="color:#e5e5e5;"></i>';
                    }
                    contactListHtml += '<div class="couple-list-card" onclick="' + clickAction + '" style="position:relative;min-height:60px;' + (hasSpace ? 'opacity:0.7;' : '') + '">'
                        + '<img src="' + avatarSrc + '" style="width:46px; height:46px; border-radius:50%; object-fit:cover; flex-shrink:0;" onerror="this.onerror=null;this.src=\'' + _fallbackAvatar + '\'">'
                        + '<div class="couple-list-info">'
                        + '<div class="couple-list-name">' + safeName + '</div>'
                        + statusHtml
                        + '</div>'
                        + trailHtml
                        + '</div>';
                } catch(_itemErr) {
                    console.warn('[renderCoupleSelector] 跳过联系人渲染:', _itemErr);
                }
            }
            let html = '<div class="nav-bar">'
                + '<div class="nav-icon" onclick="coupleViewMode=\'list\';renderCouple()"><i class="fas fa-chevron-left"></i></div>'
                + '<div class="nav-title">选择另一半</div>'
                + '<div class="nav-icon"></div>'
                + '</div>'
                + '<div class="couple-list-page">'
                + '<div style="color:#86868b; margin-bottom:12px; font-size:13px; padding-left:5px;">选择联系人建立情侣空间</div>'
                + contactListHtml
                + '</div>';
            area.innerHTML = html;
            } catch(e) {
                console.error('[renderCoupleSelector] 渲染失败:', e, e.stack);
                area.innerHTML = '<div class="nav-bar"><div class="nav-icon" onclick="coupleViewMode=\'list\';renderCouple()"><i class="fas fa-chevron-left"></i></div><div class="nav-title">选择另一半</div><div class="nav-icon"></div></div><div style="text-align:center;color:#999;padding:60px 20px;">加载失败('+((e&&e.message)||'未知错误').replace(/</g,'&lt;').substring(0,50)+')，请返回重试</div>';
            }
        }

        function unbindCoupleByPartner(contactId) {
            // 改为发送解绑请求到聊天（走邀请流程）
            sendUnbindRequest(contactId);
        }

        function renderCoupleDetail(area) {
            const space = getCurrentCoupleSpace();
            if (!space) { coupleViewMode = 'list'; renderCouple(); return; }
            const partner = store.contacts.find(x => x.id === space.partnerId);
            const days = space.start ? Math.max(0, Math.floor((new Date() - new Date(space.start)) / (1000*60*60*24))) : 0;
            const textColor = space.textColor || '#ffffff';
            const userName = getUserPersonaName(partner, '我');
            const partnerName = partner ? partner.name : 'TA';
            const bgStyle = space.bgImage
                ? `background-image: url(${space.bgImage});`
                : `background: linear-gradient(135deg, #ffeef1 0%, #f8b4c8 50%, #c9a7eb 100%);`;
            const modules = [
                { id: 'couple_life', icon: 'fas fa-th-large', title: '生活中心', desc: '日历·账本·经期·纪念日·课表', bg: 'none' },
                { id: 'wishes', icon: 'far fa-star', title: '心愿单', desc: (space.wishes||[]).length + '个心愿', bg: 'none' },
                // { id: 'secret', icon: 'fas fa-lock', title: 'TA的秘密', desc: '记录小秘密', bg: 'none' }, // 隐藏入口，功能保留
                { id: 'status', icon: 'far fa-smile', title: 'TA的状态', desc: '此刻的心情', bg: 'none' },
                { id: 'dating', icon: 'fas fa-map-pin', title: '约会', desc: '计划下一次约会', bg: 'none' },
                { id: 'spacetime', icon: 'fas fa-hourglass-half', title: '时空系统', desc: '穿越时空', bg: 'none' },
                { id: 'couple_account', icon: 'fas fa-at', title: '情侣账号', desc: '照片墙·日记·社交号', bg: 'none' },
            ];
            let html = `
                <div class="couple-detail-container">
                    <div class="couple-detail-bg" style="${bgStyle}"></div>
                    <div class="couple-detail-nav">
                        <div class="nav-icon" onclick="coupleViewMode='list';renderCouple()"><i class="fas fa-chevron-left"></i></div>
                        <div></div>
                        <div class="nav-icon" onclick="openCoupleSettings()"><i class="fas fa-cog"></i></div>
                    </div>
                    <div class="couple-detail-hero">
                        <div class="couple-hero-avatars">
                            <img class="couple-hero-avatar" src="${getUserPersonaAvatar(partner)}">
                            <div class="couple-hero-heart"><i class="fas fa-heart"></i></div>
                            <img class="couple-hero-avatar" src="${partner ? (partner.avatar || _ph(80)) : _ph(80)}">
                        </div>
                        <div class="couple-hero-days" style="color:${textColor};">在一起 ${days} 天</div>
                        <div class="couple-hero-names" style="color:${textColor};">${userName} & ${partnerName}</div>
                    </div>
                    <div class="couple-modules-scroll">
                        ${modules.map(m => `
                            <div class="couple-module-card" onclick="openCoupleModule('${m.id}')">
                                <div class="couple-module-icon" style="background:${m.bg};"><i class="${m.icon}"></i></div>
                                <div class="couple-module-text">
                                    <div class="couple-module-title">${m.title}</div>
                                    <div class="couple-module-desc">${m.desc}</div>
                                </div>
                                <i class="fas fa-chevron-right couple-module-arrow"></i>
                            </div>
                        `).join('')}
                    </div>
                    <div class="couple-settings-overlay" id="couple-settings-overlay" onclick="closeCoupleSettings()">
                        <div class="couple-settings-sheet" onclick="event.stopPropagation()">
                            <h3>情侣空间设置</h3>
                            <div class="group-box" style="margin:0 0 15px;">
                                <div class="form-cell"><span class="form-label">设置开始日期</span><input type="date" id="couple-space-date" value="${space.start ? space.start.split('T')[0] : ''}" class="form-val" style="border:none;" onchange="saveCoupleSpaceDate(this.value)"></div>
                                <div class="form-cell" onclick="uploadCoupleSpaceBg()"><span class="form-label">更换背景图片</span><i class="fas fa-image" style="color:#999;"></i></div>
                                <div class="form-cell"><span class="form-label">文字颜色</span><input type="color" id="couple-text-color-input" value="${textColor}" onchange="saveCoupleTextColor(this.value)"></div>
                            </div>
                            <div style="margin-top:15px;"><button class="full-btn red" onclick="deleteCoupleSpace()" style="width:100%; margin:0;">解除情侣空间</button></div>
                            <div style="text-align:center; margin-top:15px; color:#999; cursor:pointer;" onclick="closeCoupleSettings()">关闭</div>
                        </div>
                    </div>
                </div>
            `;
            area.innerHTML = html;
        }

        function openCoupleModule(moduleId) {
            coupleViewMode = 'sub_' + moduleId;
            renderCouple();
        }

        function renderCoupleSubPage(area, moduleId) {
            const space = getCurrentCoupleSpace();
            if (!space) { coupleViewMode = 'list'; renderCouple(); return; }
            let title = '', content = '';
            switch(moduleId) {
                case 'couple_life': if(typeof renderCoupleLifeModule==='function'){renderCoupleLifeModule(area,space);}else{toast('生活中心模块未加载');} return;
                case 'couple_calendar': if(typeof renderCoupleCalendarModule==='function'){renderCoupleCalendarModule(area,space);}else{toast('模块未加载');} return;
                case 'couple_ledger': if(typeof renderCoupleLedgerModule==='function'){renderCoupleLedgerModule(area,space);}else{toast('模块未加载');} return;
                case 'schedule': renderScheduleModule(area, space); return;
                case 'period': title = '经期助手'; content = renderPeriodModule(space); break;
                case 'anniversary': title = '纪念日'; content = renderAnniversaryModule(space); break;
                case 'wishes': title = '心愿单'; content = renderWishModule(space); break;
                case 'secret': renderSecretModule(area, space); return;
                case 'status': renderStatusModule(area, space); return;
                case 'touch': renderTouchModule(area, space); return;
                case 'dating': renderDatingModule(area, space); return;
                case 'spacetime': renderSpacetimeModule(area, space); return;
                case 'couple_account': if(typeof renderCoupleAccountModule==='function'){renderCoupleAccountModule(area,space);}else{toast('模块未加载');} return;
                default: title = '未知'; content = ''; break;
            }
            area.innerHTML = `
                <div class="nav-bar">
                    <div class="nav-icon" onclick="coupleViewMode='detail';renderCouple()"><i class="fas fa-chevron-left"></i></div>
                    <div class="nav-title">${title}</div>
                    <div class="nav-icon"></div>
                </div>
                <div class="scroll-y" style="background:#f5f5f7; padding:16px;">${content}</div>
            `;
        }

        function renderPeriodModule(space) {
            if (!space.periodHistory) space.periodHistory = [];
            if (!space.periodDiary) space.periodDiary = [];
            // [FIX-经期天数v4] 只在 undefined/null 时设默认值，不覆盖用户手动设置的值（如0虽不合理但不应被覆盖）
            if (space.periodLen === undefined || space.periodLen === null) space.periodLen = 5;
            var phaseInfo = (typeof getPeriodPhase === 'function') ? getPeriodPhase(space) : { phase:'unknown', day:0, daysUntilNext:0, inPeriod:false };
            var phaseLabel = (typeof getPhaseLabel === 'function') ? getPhaseLabel(phaseInfo.phase) : '待记录';
            var phaseColor = (typeof getPhaseColor === 'function') ? getPhaseColor(phaseInfo.phase) : '#ccc';
            var phaseEmoji = (typeof getPhaseEmoji === 'function') ? getPhaseEmoji(phaseInfo.phase) : '📝';
            var phaseTip = (typeof getPhaseTip === 'function') ? getPhaseTip(phaseInfo.phase) : '';
            var hasData = !!space.cycleDate;
            var todayDiary = (typeof getTodayDiary === 'function') ? getTodayDiary(space) : null;

            // 倒计时显示
            var countdownHtml = '';
            if (hasData && phaseInfo.phase !== 'unknown') {
                if (phaseInfo.inPeriod) {
                    countdownHtml = '<div style="font-size:36px;font-weight:800;color:' + phaseColor + ';">第 ' + phaseInfo.dayInPeriod + ' 天</div><div style="font-size:13px;color:#86868b;margin-top:4px;">经期中 · 记得好好休息</div>';
                } else {
                    countdownHtml = '<div style="font-size:36px;font-weight:800;color:#1d1d1f;">' + phaseInfo.daysUntilNext + '</div><div style="font-size:13px;color:#86868b;margin-top:4px;">天后 · 预计下次经期</div>';
                }
            } else {
                countdownHtml = '<div style="font-size:36px;font-weight:800;color:#ccc;">—</div><div style="font-size:13px;color:#86868b;margin-top:4px;">记录经期日期，开始追踪</div>';
            }

            // 周期阶段环形进度
            var progressPercent = hasData ? Math.round((phaseInfo.cycleDay || 0) / (phaseInfo.cycleLen || 28) * 100) : 0;
            var circumference = 2 * Math.PI * 40;
            var strokeDashoffset = circumference - (progressPercent / 100) * circumference;

            // 快捷按钮状态
            var isInPeriod = phaseInfo.inPeriod;
            var lastRecord = space.periodHistory.length > 0 ? space.periodHistory[space.periodHistory.length - 1] : null;
            var hasOngoing = lastRecord && !lastRecord.end;

            // 历史记录HTML
            var historyHtml = '';
            if (space.periodHistory.length > 0) {
                var recentHistory = space.periodHistory.slice().reverse().slice(0, 5);
                for (var i = 0; i < recentHistory.length; i++) {
                    var h = recentHistory[i];
                    var hIdx = space.periodHistory.length - 1 - i;
                    var duration = h.end ? ((new Date(h.end) - new Date(h.start)) / 86400000 + 1) + '天' : '进行中';
                    historyHtml += '<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid #f0f0f5;">' +
                        '<div style="display:flex;align-items:center;gap:10px;">' +
                        '<div style="width:8px;height:8px;border-radius:50%;background:' + (h.end ? '#e5e5e5' : '#ff6b8a') + ';"></div>' +
                        '<div><div style="font-size:14px;font-weight:500;color:#1d1d1f;">' + h.start + (h.end ? ' ~ ' + h.end : '') + '</div>' +
                        '<div style="font-size:12px;color:#86868b;margin-top:2px;">' + duration + (h.notes ? ' · ' + h.notes : '') + '</div></div>' +
                        '</div>' +
                        '<div style="display:flex;gap:8px;">' +
                        '<div onclick="deletePeriodHistory(' + hIdx + ')" style="width:28px;height:28px;border-radius:50%;background:#f5f5f7;display:flex;align-items:center;justify-content:center;cursor:pointer;"><i class="fas fa-trash" style="font-size:11px;color:#999;"></i></div>' +
                        '</div></div>';
                }
            }

            // 今日日记显示
            var diaryStatusHtml = '';
            if (todayDiary) {
                var moodMap = {great:'😊', good:'🙂', tired:'😴', down:'😔', irritable:'😤'};
                var comfortMap = {good:'舒适', mild:'轻微不适', moderate:'明显不适', severe:'很不舒服'};
                diaryStatusHtml = '<div style="display:flex;gap:8px;flex-wrap:wrap;">';
                if (todayDiary.mood) diaryStatusHtml += '<span style="padding:4px 10px;background:#f5f5f7;border-radius:12px;font-size:12px;">' + (moodMap[todayDiary.mood]||'') + '</span>';
                if (todayDiary.comfort) diaryStatusHtml += '<span style="padding:4px 10px;background:#f5f5f7;border-radius:12px;font-size:12px;">' + (comfortMap[todayDiary.comfort]||todayDiary.comfort) + '</span>';
                if (todayDiary.flow && todayDiary.flow !== 'none') diaryStatusHtml += '<span style="padding:4px 10px;background:#f5f5f7;border-radius:12px;font-size:12px;">流量:' + todayDiary.flow + '</span>';
                diaryStatusHtml += '</div>';
            }

            return '<div style="display:flex;flex-direction:column;gap:12px;">' +

                // ===== 卡片1：倒计时 + 周期环 =====
                '<div style="background:#fff;border-radius:16px;padding:24px;box-shadow:0 1px 4px rgba(0,0,0,0.06);">' +
                '<div style="display:flex;align-items:center;justify-content:space-between;">' +
                '<div style="flex:1;">' + countdownHtml + '</div>' +
                '<div style="position:relative;width:96px;height:96px;">' +
                '<svg width="96" height="96" viewBox="0 0 96 96" style="transform:rotate(-90deg);">' +
                '<circle cx="48" cy="48" r="40" fill="none" stroke="#f0f0f5" stroke-width="6"/>' +
                '<circle cx="48" cy="48" r="40" fill="none" stroke="' + phaseColor + '" stroke-width="6" stroke-linecap="round" stroke-dasharray="' + circumference + '" stroke-dashoffset="' + strokeDashoffset + '"/>' +
                '</svg>' +
                '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;">' +
                '<div style="font-size:20px;">' + phaseEmoji + '</div>' +
                '<div style="font-size:10px;color:#86868b;margin-top:2px;">' + phaseLabel + '</div>' +
                '</div></div></div>' +
                // 阶段小贴士
                (phaseTip ? '<div style="margin-top:14px;padding:10px 14px;background:' + phaseColor + '14;border-radius:10px;font-size:12px;color:#555;">' + phaseEmoji + ' ' + phaseTip + '</div>' : '') +
                '</div>' +

                // ===== 卡片2：快捷操作 =====
                '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">' +
                '<div onclick="' + (hasOngoing ? 'periodEndNow()' : 'periodStartNow()') + '" style="background:#fff;border-radius:14px;padding:16px;text-align:center;cursor:pointer;box-shadow:0 1px 4px rgba(0,0,0,0.06);border:1.5px solid ' + (hasOngoing ? '#4ecdc4' : '#ff6b8a') + '22;">' +
                '<div style="font-size:24px;margin-bottom:6px;">' + (hasOngoing ? '🌸' : '🩸') + '</div>' +
                '<div style="font-size:13px;font-weight:600;color:' + (hasOngoing ? '#4ecdc4' : '#ff6b8a') + ';">' + (hasOngoing ? '经期结束了' : '经期来了') + '</div>' +
                '</div>' +
                '<div onclick="openPeriodDiaryModal()" style="background:#fff;border-radius:14px;padding:16px;text-align:center;cursor:pointer;box-shadow:0 1px 4px rgba(0,0,0,0.06);border:1.5px solid #a78bfa22;">' +
                '<div style="font-size:24px;margin-bottom:6px;">📝</div>' +
                '<div style="font-size:13px;font-weight:600;color:#a78bfa;">身体日记</div>' +
                (todayDiary ? '<div style="font-size:11px;color:#86868b;margin-top:4px;">今日已记录</div>' : '') +
                '</div>' +
                '</div>' +

                // ===== 卡片3：今日日记状态 (如果有) =====
                (todayDiary ? '<div style="background:#fff;border-radius:14px;padding:16px;box-shadow:0 1px 4px rgba(0,0,0,0.06);">' +
                '<div style="font-size:13px;font-weight:600;color:#1d1d1f;margin-bottom:10px;">今日状态</div>' +
                diaryStatusHtml +
                (todayDiary.note ? '<div style="margin-top:8px;font-size:12px;color:#86868b;font-style:italic;">"' + todayDiary.note + '"</div>' : '') +
                '</div>' : '') +

                // ===== 卡片3.5：身体日记历史 =====
                (function() {
                    var diaries = (space.periodDiary || []).slice().sort(function(a,b){ return new Date(b.date) - new Date(a.date); });
                    if (diaries.length === 0) return '';
                    var moodMap = {great:'😊 很好',good:'🙂 还行',tired:'😴 疲惫',down:'😔 低落',irritable:'😤 烦躁'};
                    var comfortMap = {good:'舒适',mild:'轻微不适',moderate:'明显不适',severe:'很不舒服'};
                    var flowMap = {none:'无',light:'少量',normal:'正常',heavy:'较多'};
                    var dH = '';
                    var showCount = Math.min(diaries.length, 7);
                    for (var di = 0; di < showCount; di++) {
                        var d = diaries[di];
                        var tags = [];
                        if (d.mood && moodMap[d.mood]) tags.push(moodMap[d.mood]);
                        if (d.comfort && comfortMap[d.comfort]) tags.push(comfortMap[d.comfort]);
                        if (d.flow && flowMap[d.flow]) tags.push('流量:' + flowMap[d.flow]);
                        dH += '<div style="padding:10px 0;border-bottom:1px solid #f5f5f7;display:flex;align-items:center;justify-content:space-between;">' +
                            '<div style="flex:1;min-width:0;">' +
                            '<div style="font-size:12px;color:#86868b;">' + (d.date || '') + '</div>' +
                            '<div style="font-size:12px;color:#333;margin-top:3px;">' + tags.join(' · ') + '</div>' +
                            (d.note ? '<div style="font-size:11px;color:#aaa;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + d.note + '</div>' : '') +
                            '</div>' +
                            '<div style="display:flex;gap:6px;margin-left:8px;">' +
                            '<div onclick="editPeriodDiary(\'' + d.date + '\')" style="width:28px;height:28px;border-radius:50%;background:#a78bfa18;display:flex;align-items:center;justify-content:center;cursor:pointer;"><span style="font-size:12px;">✏️</span></div>' +
                            '<div onclick="if(confirm(\'确定删除这条日记？\'))deletePeriodDiary(\'' + d.date + '\')" style="width:28px;height:28px;border-radius:50%;background:#ff6b8a18;display:flex;align-items:center;justify-content:center;cursor:pointer;"><span style="font-size:12px;">🗑️</span></div>' +
                            '</div></div>';
                    }
                    return '<div style="background:#fff;border-radius:16px;box-shadow:0 1px 4px rgba(0,0,0,0.06);overflow:hidden;">' +
                        '<div style="padding:14px 16px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #f0f0f5;">' +
                        '<div style="font-size:13px;font-weight:600;color:#1d1d1f;">身体日记记录</div>' +
                        '<div style="font-size:12px;color:#86868b;">共 ' + diaries.length + ' 条</div>' +
                        '</div>' +
                        '<div style="padding:0 16px;">' + dH + '</div></div>';
                })() +

                // ===== 卡片4：周期设置 =====
                '<div style="background:#fff;border-radius:16px;box-shadow:0 1px 4px rgba(0,0,0,0.06);overflow:hidden;">' +
                '<div style="padding:14px 16px;font-size:13px;font-weight:600;color:#1d1d1f;border-bottom:1px solid #f0f0f5;">周期设置</div>' +
                '<div class="form-cell"><span class="form-label">最近经期日期</span><input type="date" class="form-val" style="border:none; background:transparent; color:#333;" value="' + (space.cycleDate || '') + '" onchange="updateSpaceCycle(this.value)"></div>' +
                '<div class="form-cell"><span class="form-label">周期长度</span><input type="number" class="form-val" value="' + (space.cycleLen || 28) + '" style="border:none; width:50px; background:transparent; color:#333; text-align:center;" min="15" max="60" onchange="updateSpaceCycleLen(this.value)"> 天</div>' +
                '<div class="form-cell"><span class="form-label">经期天数</span><input type="number" class="form-val" value="' + (space.periodLen || 5) + '" style="border:none; width:50px; background:transparent; color:#333; text-align:center;" min="1" max="10" onchange="updateSpacePeriodLen(this.value)"> 天</div>' +
                '</div>' +

                // ===== 卡片5：关怀提醒设置 =====
                '<div style="background:#fff;border-radius:16px;box-shadow:0 1px 4px rgba(0,0,0,0.06);overflow:hidden;">' +
                '<div style="padding:14px 16px;font-size:13px;font-weight:600;color:#1d1d1f;border-bottom:1px solid #f0f0f5;">关怀提醒</div>' +
                '<div class="form-cell"><span class="form-label">经期关怀提醒</span><div class="switch"><input type="checkbox" id="space-cycle-remind" ' + (space.reminderEnabled?'checked':'') + ' onchange="saveSpaceCycleSettings()"><span class="slider"></span></div></div>' +
                '<div id="space-cycle-more" style="display:' + (space.reminderEnabled?'block':'none') + ';">' +
                '<div class="form-cell"><span class="form-label">提前提醒天数</span><input type="number" id="space-remind-days" class="form-val" value="' + (space.reminderDaysBefore||3) + '" style="border:none; width:50px; background:transparent; color:#333; text-align:center;" onchange="saveSpaceCycleSettings()"> 天</div>' +
                '<div class="form-cell" onclick="openSpaceCycleContactSelector()"><span class="form-label">关怀大使</span><span class="form-val">' + (space.careContacts||[]).length + '人</span><i class="fas fa-chevron-right" style="color:#ccc; margin-left:8px;"></i></div>' +
                '</div></div>' +

                // ===== 卡片6：历史记录 =====
                '<div style="background:#fff;border-radius:16px;box-shadow:0 1px 4px rgba(0,0,0,0.06);overflow:hidden;">' +
                '<div style="padding:14px 16px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #f0f0f5;">' +
                '<div style="font-size:13px;font-weight:600;color:#1d1d1f;">历史记录</div>' +
                '<div style="font-size:12px;color:#86868b;">共 ' + space.periodHistory.length + ' 次</div>' +
                '</div>' +
                '<div style="padding:0 16px;">' +
                (historyHtml || '<div style="text-align:center;color:#ccc;padding:24px 0;font-size:13px;">暂无记录<br>点击"经期来了"开始记录</div>') +
                '</div></div>' +

                // ===== 卡片7：周期趋势 (如果有>=2条记录) =====
                (space.periodHistory.length >= 2 ? (function() {
                    var sorted = space.periodHistory.slice().sort(function(a,b){ return new Date(a.start) - new Date(b.start); });
                    var gaps = [];
                    for (var k = 1; k < sorted.length; k++) {
                        var gap = Math.floor((new Date(sorted[k].start) - new Date(sorted[k-1].start)) / 86400000);
                        if (gap > 10 && gap < 60) gaps.push({cycle:k, len:gap, from:sorted[k-1].start});
                    }
                    if (gaps.length === 0) return '';
                    var avgLen = Math.round(gaps.reduce(function(a,b){return a+b.len;},0) / gaps.length);
                    var maxLen = Math.max.apply(null, gaps.map(function(g){return g.len;}));
                    var minLen = Math.min.apply(null, gaps.map(function(g){return g.len;}));
                    var barsHtml = '';
                    for (var j = 0; j < gaps.length; j++) {
                        var pct = Math.round(gaps[j].len / 60 * 100);
                        barsHtml += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">' +
                            '<div style="font-size:11px;color:#86868b;width:24px;text-align:right;">#' + (j+1) + '</div>' +
                            '<div style="flex:1;height:18px;background:#f5f5f7;border-radius:9px;overflow:hidden;">' +
                            '<div style="height:100%;width:' + pct + '%;background:' + (gaps[j].len === maxLen ? '#ff6b8a' : gaps[j].len === minLen ? '#4ecdc4' : '#a78bfa') + ';border-radius:9px;transition:width 0.3s;"></div></div>' +
                            '<div style="font-size:12px;color:#333;width:32px;">' + gaps[j].len + '天</div></div>';
                    }
                    return '<div style="background:#fff;border-radius:16px;box-shadow:0 1px 4px rgba(0,0,0,0.06);overflow:hidden;">' +
                        '<div style="padding:14px 16px;font-size:13px;font-weight:600;color:#1d1d1f;border-bottom:1px solid #f0f0f5;">周期趋势</div>' +
                        '<div style="padding:14px 16px;">' +
                        '<div style="display:flex;justify-content:space-around;margin-bottom:14px;">' +
                        '<div style="text-align:center;"><div style="font-size:20px;font-weight:700;color:#1d1d1f;">' + avgLen + '</div><div style="font-size:11px;color:#86868b;">平均周期</div></div>' +
                        '<div style="text-align:center;"><div style="font-size:20px;font-weight:700;color:#4ecdc4;">' + minLen + '</div><div style="font-size:11px;color:#86868b;">最短</div></div>' +
                        '<div style="text-align:center;"><div style="font-size:20px;font-weight:700;color:#ff6b8a;">' + maxLen + '</div><div style="font-size:11px;color:#86868b;">最长</div></div>' +
                        '</div>' + barsHtml + '</div></div>';
                })() : '') +

                '</div>';
        }

        function renderAnniversaryModule(space) {
            const annis = space.anniversaries || [];
            return `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                    <div style="font-size:15px; font-weight:600; color:#333;">所有纪念日</div>
                    <button onclick="openAnniversaryModal()" style="padding:8px 16px; border:none; background:var(--primary); color:#fff; border-radius:8px; font-size:13px;"><i class="fas fa-plus"></i> 添加</button>
                </div>
                ${annis.length === 0 ? '<div style="text-align:center; color:#999; padding:40px;">暂无纪念日<br>点击上方添加</div>' : ''}
                ${annis.map((a, idx) => {
                    const diff = Math.floor((new Date() - new Date(a.date)) / (1000*60*60*24));
                    return '<div class="beauty-section-card" style="margin-bottom:12px; cursor:pointer;" onclick="openEditAnniversary(' + idx + ')"><div style="padding:16px; display:flex; align-items:center; justify-content:space-between;"><div><div style="font-size:16px; font-weight:600; color:#1d1d1f; margin-bottom:4px;">' + a.name + '</div><div style="font-size:13px; color:#86868b;">' + a.date + ' · ' + (a.repeat==='year'?'每年':'不重复') + '</div></div><div style="display:flex; align-items:center; gap:12px;"><div style="text-align:right;"><div style="font-size:22px; font-weight:700; color:#ff758c;">' + Math.abs(diff) + '</div><div style="font-size:11px; color:#86868b;">' + (diff >= 0 ? '天前' : '天后') + '</div></div><i class="fas fa-chevron-right" style="color:#ccc; font-size:14px;"></i></div></div></div>';
                }).join('')}
            `;
        }

        // SVG图标（心愿单专用）
        const WISH_SVG = {
            plus: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
            user: '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
            edit: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
            trash: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>',
            reply: '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 00-4-4H4"/></svg>',
            wand: '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 4V2"/><path d="M15 16v-2"/><path d="M8 9h2"/><path d="M20 9h2"/><path d="M17.8 11.8L19 13"/><path d="M15 9h0"/><path d="M17.8 6.2L19 5"/><path d="M11 6.2L9.7 5"/><path d="M11 11.8L9.7 13"/><line x1="12" y1="22" x2="2" y2="12"/></svg>',
            robot: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><line x1="12" y1="7" x2="12" y2="11"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/></svg>',
            star: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
            send: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>'
        };

        function renderWishModule(space) {
            const wishes = space.wishes || [];
            const partner = store.contacts.find(x => x.id === space.partnerId);
            const partnerName = partner ? partner.name : 'TA';
            return `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
                    <div style="font-size:16px; font-weight:700; color:#111; letter-spacing:0.5px;">心愿清单</div>
                    <button onclick="openCustomInput('wish')" style="padding:7px 16px; border:1.5px solid #222; background:#222; color:#fff; border-radius:8px; font-size:13px; cursor:pointer; display:flex; align-items:center; gap:5px;">${WISH_SVG.plus} 许愿</button>
                </div>
                ${wishes.length === 0 ? '<div style="text-align:center; color:#aaa; padding:50px 20px; font-size:13px;">' + WISH_SVG.star + '<div style="margin-top:10px;">许个愿吧~<br>会帮你规划</div></div>' : ''}
                ${wishes.map((w, i) => {
                    const isContactWish = w.author && w.author !== 'me';
                    const authorLabel = isContactWish ? partnerName : '我';
                    return '<div style="margin-bottom:14px; border:1px solid #e0e0e0; border-radius:12px; background:#fff; overflow:hidden;">' +
                        '<div style="padding:16px 16px 12px;">' +
                            '<div style="display:flex; justify-content:space-between; align-items:flex-start;">' +
                                '<div style="flex:1;">' +
                                    '<div style="display:flex; align-items:center; gap:5px; font-size:11px; color:#999; margin-bottom:6px;">' + WISH_SVG.user + ' ' + authorLabel + ' 的心愿</div>' +
                                    '<div style="font-size:15px; color:#111; font-weight:500; line-height:1.5;">' + w.text + '</div>' +
                                '</div>' +
                                '<div style="display:flex; gap:8px; flex-shrink:0; margin-left:10px;">' +
                                    '<span style="color:#666; cursor:pointer; padding:4px; display:flex;" onclick="editWish(' + i + ')" title="编辑">' + WISH_SVG.edit + '</span>' +
                                    '<span style="color:#999; cursor:pointer; padding:4px; display:flex;" onclick="deleteWish(' + i + ')" title="删除">' + WISH_SVG.trash + '</span>' +
                                '</div>' +
                            '</div>' +
                        '</div>' +
                        '<div style="border-top:1px solid #f0f0f0; padding:12px 16px; background:#fafafa;">' +
                            (w.reply ? '<div style="display:flex; gap:8px; align-items:flex-start; margin-bottom:10px;"><span style="color:#888; flex-shrink:0; margin-top:1px;">' + WISH_SVG.robot + '</span><div style="font-size:13px; color:#555; line-height:1.6;">' + w.reply + '</div></div>' : '<div style="font-size:12px; color:#bbb; margin-bottom:10px;">等待回复...</div>') +
                            '<div style="display:flex; gap:8px;">' +
                                '<button onclick="openWishReplyInput(' + i + ')" style="padding:5px 14px; border:1.5px solid #ddd; background:#fff; color:#333; border-radius:8px; font-size:12px; cursor:pointer; display:flex; align-items:center; gap:4px;">' + WISH_SVG.reply + ' 回复</button>' +
                                '<button onclick="regenerateWishReply(' + i + ')" style="padding:5px 14px; border:1.5px solid #222; background:#222; color:#fff; border-radius:8px; font-size:12px; cursor:pointer; display:flex; align-items:center; gap:4px;">' + WISH_SVG.wand + ' AI回复</button>' +
                            '</div>' +
                            '<div id="wish-reply-input-' + i + '" style="display:none; margin-top:10px;">' +
                                '<div style="display:flex; gap:6px;"><input id="wish-reply-val-' + i + '" placeholder="输入回复..." style="flex:1; padding:8px 12px; border:1.5px solid #ddd; border-radius:8px; font-size:13px; outline:none; background:#fff;"><button onclick="submitWishReply(' + i + ')" style="padding:8px 16px; border:none; background:#222; color:#fff; border-radius:8px; font-size:13px; cursor:pointer; display:flex; align-items:center; gap:4px;">' + WISH_SVG.send + ' 发送</button></div>' +
                            '</div>' +
                        '</div>' +
                    '</div>';
                }).join('')}
            `;
        }

        function deleteWish(idx) {
            const space = getCurrentCoupleSpace();
            if (!space || !space.wishes) return;
            showConfirm('删除心愿', '确定删除这条心愿吗？', () => {
                space.wishes.splice(idx, 1);
                save();
                renderCouple();
                toast('心愿已删除');
            });
        }

        function editWish(idx) {
            const space = getCurrentCoupleSpace();
            if (!space || !space.wishes || !space.wishes[idx]) return;
            const w = space.wishes[idx];
            showPromptModal('编辑心愿:', w.text).then(function(newText) {
                if (newText !== null && newText.trim()) {
                    w.text = newText.trim();
                    save();
                    renderCouple();
                    toast('心愿已更新');
                }
            });
        }

        function openWishReplyInput(idx) {
            const el = document.getElementById('wish-reply-input-' + idx);
            if (el) {
                el.style.display = el.style.display === 'none' ? 'block' : 'none';
                if (el.style.display === 'block') {
                    const input = document.getElementById('wish-reply-val-' + idx);
                    if (input) input.focus();
                }
            }
        }

        function submitWishReply(idx) {
            const space = getCurrentCoupleSpace();
            if (!space || !space.wishes || !space.wishes[idx]) return;
            const input = document.getElementById('wish-reply-val-' + idx);
            if (!input || !input.value.trim()) return toast('请输入回复内容');
            space.wishes[idx].reply = input.value.trim();
            save();
            renderCouple();
            toast('回复成功');
        }

        function regenerateWishReply(idx) {
            const space = getCurrentCoupleSpace();
            if (!space || !space.wishes || !space.wishes[idx]) return;
            const w = space.wishes[idx];
            if (w.author && w.author !== 'me') {
                aiGenerate('partner_wish_reply::' + w.text + '::' + space.partnerId);
            } else {
                aiGenerate('wish_reply::' + w.text);
            }
            toast('正在生成AI回复...');
        }

        // ===== [NEW] 世界书/人设 文件导入（支持 .txt 和 .docx） =====
        // 通用导入函数：读取 .txt/.docx 文件内容，填充到指定 textarea
        function _importFileToTextarea(textareaId, options) {
            options = options || {};
            var fi = document.createElement('input');
            fi.type = 'file';
            fi.accept = '.txt,.docx,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            fi.onchange = function(e) {
                var file = e.target.files[0];
                if (!file) return;
                var fileName = file.name.toLowerCase();
                var ta = document.getElementById(textareaId);
                if (!ta) { showToast('目标文本框未找到', 'error'); return; }

                if (fileName.endsWith('.txt')) {
                    // TXT: 直接读取文本
                    var reader = new FileReader();
                    reader.onload = function(ev) {
                        var text = ev.target.result || '';
                        if (options.append && ta.value.trim()) {
                            ta.value = ta.value + '\n\n' + text;
                        } else {
                            ta.value = text;
                        }
                        showToast('✅ 已导入 ' + file.name + ' (' + text.length + '字)');
                        if (options.onImport) options.onImport(text);
                    };
                    reader.onerror = function() { showToast('读取文件失败', 'error'); };
                    reader.readAsText(file, 'UTF-8');
                } else if (fileName.endsWith('.docx')) {
                    // DOCX: 使用 mammoth.js 解析
                    if (typeof mammoth === 'undefined') {
                        // 动态加载 mammoth.js
                        showToast('正在加载DOCX解析库...');
                        var script = document.createElement('script');
                        script.src = 'https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.min.js';
                        script.onload = function() { _parseDocx(file, ta, options); };
                        script.onerror = function() {
                            showToast('DOCX解析库加载失败，请检查网络连接', 'error');
                        };
                        document.head.appendChild(script);
                    } else {
                        _parseDocx(file, ta, options);
                    }
                } else {
                    showToast('不支持的文件格式，请选择 .txt 或 .docx 文件', 'error');
                }
            };
            fi.click();
        }

        function _parseDocx(file, ta, options) {
            options = options || {};
            var reader = new FileReader();
            reader.onload = function(ev) {
                mammoth.extractRawText({ arrayBuffer: ev.target.result })
                    .then(function(result) {
                        var text = (result.value || '').trim();
                        if (!text) { showToast('DOCX文件内容为空', 'warning'); return; }
                        if (options.append && ta.value.trim()) {
                            ta.value = ta.value + '\n\n' + text;
                        } else {
                            ta.value = text;
                        }
                        showToast('✅ 已导入 ' + file.name + ' (' + text.length + '字)');
                        if (options.onImport) options.onImport(text);
                    })
                    .catch(function(err) {
                        console.error('DOCX解析失败:', err);
                        showToast('DOCX解析失败: ' + (err.message || '未知错误'), 'error');
                    });
            };
            reader.onerror = function() { showToast('读取文件失败', 'error'); };
            reader.readAsArrayBuffer(file);
        }

        // 世界书内容导入
        window.importFileToWorldBook = function() {
            _importFileToTextarea('new-wb-content');
        };

        // 联系人人设导入
        window.importFileToPersona = function() {
            _importFileToTextarea('new-contact-persona');
        };

        // 多重人设描述导入
        window.importFileToPersonaDesc = function() {
            _importFileToTextarea('new-p-desc');
        };

