        // ===== 群角色系统 =====
        // 角色：groupOwner(群主,默认__user__), groupAdmins[](管理员数组)
        function _initGroupRoles(group) {
            if (!group.groupOwner) group.groupOwner = '__user__';
            if (!group.groupAdmins) group.groupAdmins = [];
        }
        function _isGroupOwner(group, memberId) {
            _initGroupRoles(group);
            return group.groupOwner === memberId;
        }
        function _isGroupAdmin(group, memberId) {
            _initGroupRoles(group);
            return (group.groupAdmins || []).includes(memberId);
        }
        function _getRoleTag(group, memberId) {
            if (_isGroupOwner(group, memberId)) return '<span style="display:inline-block;background:linear-gradient(135deg,#FFD700,#FFA500);color:#fff;font-size:10px;padding:1px 6px;border-radius:4px;margin-left:5px;font-weight:700;vertical-align:middle;">👑 群主</span>';
            if (_isGroupAdmin(group, memberId)) return '<span style="display:inline-block;background:linear-gradient(135deg,#52c41a,#389e0d);color:#fff;font-size:10px;padding:1px 6px;border-radius:4px;margin-left:5px;font-weight:700;vertical-align:middle;">🛡️ 管理</span>';
            return '';
        }
        // 聊天气泡用的简洁角色标签
        function _getBubbleRoleTag(group, memberId) {
            if (_isGroupOwner(group, memberId)) return '<span style="display:inline-block;background:#FFD700;color:#fff;font-size:9px;padding:0 4px;border-radius:3px;margin-left:4px;font-weight:700;">群主</span>';
            if (_isGroupAdmin(group, memberId)) return '<span style="display:inline-block;background:#52c41a;color:#fff;font-size:9px;padding:0 4px;border-radius:3px;margin-left:4px;font-weight:700;">管理</span>';
            return '';
        }
        window._initGroupRoles = _initGroupRoles;
        window._isGroupOwner = _isGroupOwner;
        window._isGroupAdmin = _isGroupAdmin;
        window._getRoleTag = _getRoleTag;
        window._getBubbleRoleTag = _getBubbleRoleTag;

        // ===== 群主转让 =====
        function transferGroupOwner(groupId) {
            const group = store.contacts.find(c => c.id === groupId);
            if (!group || !group.isGroup) return;
            _initGroupRoles(group);
            if (group.groupOwner !== '__user__') return toast('只有群主才能转让群');
            const members = group.members || [];
            if (members.length === 0) return toast('群内没有其他成员');

            const modal = document.createElement('div');
            modal.className = 'modal-mask';
            modal.style.display = 'flex';
            modal.style.zIndex = '9999';
            modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

            let listHtml = members.map(mid => {
                const mem = store.contacts.find(c => c.id === mid);
                if (!mem) return '';
                const memAvatar = (group.groupAvatars && group.groupAvatars[mid]) || mem.avatar || _ph(40);
                const nick = (group.groupNicknames && group.groupNicknames[mid]) || mem.name;
                return `<div onclick="confirmTransferOwner('${groupId}','${mid}',this.closest('.modal-mask'))" style="display:flex;align-items:center;padding:12px;border-bottom:1px solid #f0f0f0;cursor:pointer;">
                    <img src="${memAvatar}" style="width:40px;height:40px;border-radius:8px;object-fit:cover;margin-right:10px;">
                    <span style="font-size:15px;">${nick}</span>
                    ${_getRoleTag(group, mid)}
                </div>`;
            }).join('');

            modal.innerHTML = `<div class="modal-box" style="max-height:80vh;overflow-y:auto;padding:0;">
                <div style="padding:15px 20px;border-bottom:1px solid #eee;text-align:center;">
                    <h3 style="margin:0;color:#FFD700;">👑 转让群主</h3>
                    <div style="font-size:12px;color:#999;margin-top:4px;">转让后你将变为普通成员</div>
                </div>
                <div style="max-height:50vh;overflow-y:auto;">${listHtml}</div>
                <div style="padding:12px;border-top:1px solid #eee;">
                    <button onclick="this.closest('.modal-mask').remove()" style="width:100%;padding:12px;background:#f5f5f5;border:none;border-radius:8px;font-size:14px;cursor:pointer;color:#666;">取消</button>
                </div>
            </div>`;
            document.getElementById('device').appendChild(modal);
        }
        function confirmTransferOwner(groupId, newOwnerId, modalEl) {
            const group = store.contacts.find(c => c.id === groupId);
            if (!group) return;
            const mem = store.contacts.find(c => c.id === newOwnerId);
            const newOwnerName = (group.groupNicknames && group.groupNicknames[newOwnerId]) || (mem ? mem.name : '未知');
            showConfirm('转让群主', `确定要将群主转让给「${newOwnerName}」吗？转让后你将变为普通成员。`, () => {
                _initGroupRoles(group);
                group.groupOwner = newOwnerId;
                // 新群主从管理员列表移除
                group.groupAdmins = (group.groupAdmins || []).filter(id => id !== newOwnerId);
                if (!store.chats[groupId]) store.chats[groupId] = [];
                store.chats[groupId].push({ sender: 'system', type: 'poke', content: `群主已转让给 ${newOwnerName}`, time: Date.now() });
                save();
                toast(`群主已转让给 ${newOwnerName}`);
                if (modalEl) modalEl.remove();
                openChatSettings();
                renderHistory();
            });
        }
        window.transferGroupOwner = transferGroupOwner;
        window.confirmTransferOwner = confirmTransferOwner;

        // ===== 设置/取消管理员 =====
        function setGroupAdmin(memberId, groupId) {
            const group = store.contacts.find(c => c.id === groupId);
            if (!group) return;
            _initGroupRoles(group);
            if (!group.groupAdmins.includes(memberId)) {
                group.groupAdmins.push(memberId);
                const mem = store.contacts.find(c => c.id === memberId);
                const name = (group.groupNicknames && group.groupNicknames[memberId]) || (mem ? mem.name : '未知');
                if (!store.chats[groupId]) store.chats[groupId] = [];
                store.chats[groupId].push({ sender: 'system', type: 'poke', content: `${name} 已被设为管理员 🛡️`, time: Date.now() });
                save();
                toast(`${name} 已被设为管理员`);
            }
        }
        function removeGroupAdmin(memberId, groupId) {
            const group = store.contacts.find(c => c.id === groupId);
            if (!group) return;
            _initGroupRoles(group);
            group.groupAdmins = group.groupAdmins.filter(id => id !== memberId);
            const mem = store.contacts.find(c => c.id === memberId);
            const name = (group.groupNicknames && group.groupNicknames[memberId]) || (mem ? mem.name : '未知');
            if (!store.chats[groupId]) store.chats[groupId] = [];
            store.chats[groupId].push({ sender: 'system', type: 'poke', content: `${name} 已被取消管理员`, time: Date.now() });
            save();
            toast(`${name} 已被取消管理员`);
        }
        window.setGroupAdmin = setGroupAdmin;
        window.removeGroupAdmin = removeGroupAdmin;

        // ===== @所有人 =====
        function atAllMembers(groupId) {
            const group = store.contacts.find(c => c.id === groupId);
            if (!group || !group.isGroup) return;
            _initGroupRoles(group);
            // 只有群主和管理员可以@所有人
            const isOwner = _isGroupOwner(group, '__user__');
            const isAdmin = _isGroupAdmin(group, '__user__');
            if (!isOwner && !isAdmin) return toast('只有群主和管理员才能@所有人');
            // 在输入框插入@所有人
            const input = document.getElementById('msg-input');
            if (input) {
                const atText = '@所有人 ';
                input.value = (input.value || '') + atText;
                input.focus();
            }
        }
        window.atAllMembers = atAllMembers;

        // ===== 群聊成员管理功能 =====
        function inviteToGroup(groupId) {
            const group = store.contacts.find(c => c.id === groupId);
            if (!group || !group.isGroup) return;
            const existingMembers = group.members || [];
            const availableContacts = store.contacts.filter(c => !c.isGroup && !existingMembers.includes(c.id));
            if (availableContacts.length === 0) return toast('没有可邀请的联系人');

            const modal = document.createElement('div');
            modal.className = 'modal-mask';
            modal.style.display = 'flex';
            modal.style.zIndex = '9999';
            modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

            let listHtml = availableContacts.map(c => `
                <label class="gc-invite-item" style="display:flex; align-items:center; padding:12px; border-bottom:1px solid #f0f0f0; cursor:pointer;">
                    <input type="checkbox" value="${c.id}" style="width:18px; height:18px; margin-right:12px; accent-color:#07c160;">
                    <img src="${c.avatar || _ph(40)}" style="width:40px; height:40px; border-radius:8px; object-fit:cover; margin-right:10px;">
                    <span style="font-size:15px;">${c.name}</span>
                </label>
            `).join('');

            modal.innerHTML = `<div class="modal-box" style="max-height:80vh; overflow-y:auto; padding:0;">
                <div style="padding:15px 20px; border-bottom:1px solid #eee; display:flex; justify-content:space-between; align-items:center;">
                    <h3 style="margin:0;">邀请新成员</h3>
                    <span onclick="this.closest('.modal-mask').remove()" style="font-size:20px; cursor:pointer; color:#999;">&times;</span>
                </div>
                <div style="max-height:50vh; overflow-y:auto;">${listHtml}</div>
                <div style="padding:10px 15px; border-top:1px dashed #eee; background:#fafafa;">
                    <button onclick="this.closest('.modal-mask').remove(); if(typeof openInviteFromRelationNetwork==='function'){openInviteFromRelationNetwork('${groupId}');}else{toast('关系网模块未加载','error');}" style="width:100%; padding:10px; background:linear-gradient(135deg,#667eea,#764ba2); color:#fff; border:none; border-radius:8px; font-size:13px; cursor:pointer;">
                        <i class="fas fa-project-diagram"></i> 📌 从关系网添加（NPC）
                    </button>
                </div>
                <div style="padding:15px; border-top:1px solid #eee;">
                    <button onclick="confirmInviteToGroup('${groupId}', this.closest('.modal-mask'))" style="width:100%; padding:12px; background:#07c160; color:#fff; border:none; border-radius:8px; font-size:15px; cursor:pointer;">确认邀请</button>
                </div>
            </div>`;
            document.getElementById('device').appendChild(modal);
        }

        function confirmInviteToGroup(groupId, modalEl) {
            const group = store.contacts.find(c => c.id === groupId);
            if (!group) return;
            const checkboxes = modalEl.querySelectorAll('input[type="checkbox"]:checked');
            const newIds = Array.from(checkboxes).map(cb => cb.value);
            if (newIds.length === 0) return toast('请至少选择一位联系人');

            if (!group.members) group.members = [];
            if (!group.groupNicknames) group.groupNicknames = {};
            if (!group.groupTitles) group.groupTitles = {};
            if (!group.mutedMembers) group.mutedMembers = {};

            const newNames = [];
            newIds.forEach(id => {
                if (!group.members.includes(id)) {
                    group.members.push(id);
                    const mem = store.contacts.find(c => c.id === id);
                    if (mem) newNames.push(mem.name);
                }
            });

            if (newNames.length > 0) {
                if (!store.chats[groupId]) store.chats[groupId] = [];
                store.chats[groupId].push({
                    sender: 'system', type: 'poke',
                    content: `${newNames.join('、')} 被邀请加入了群聊`,
                    time: Date.now()
                });
                save();
                toast(`已邀请 ${newNames.join('、')} 加入群聊`);
                
                // [FIX-线下人数同步] 如果当前处于线下模式，同步更新offlineGroupMembers
                if (typeof offlineContactId !== 'undefined' && offlineContactId === groupId && typeof offlineGroupMembers !== 'undefined') {
                    newIds.forEach(id => {
                        const m = store.contacts.find(c => c.id === id);
                        if (m && !offlineGroupMembers.some(om => om.id === id)) {
                            offlineGroupMembers.push({
                                id: id,
                                name: m.name,
                                avatar: m.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent((m.name||'?')[0])}`,
                                hr: 70 + Math.floor(Math.random() * 20)
                            });
                        }
                    });
                }
                
                openChatSettings();
                renderHistory();
            }
            modalEl.remove();
        }

        function kickFromGroup(groupId) {
            const group = store.contacts.find(c => c.id === groupId);
            if (!group || !group.isGroup) return;
            const members = group.members || [];
            if (members.length === 0) return toast('群内没有可移出的成员');

            const modal = document.createElement('div');
            modal.className = 'modal-mask';
            modal.style.display = 'flex';
            modal.style.zIndex = '9999';
            modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

            let listHtml = members.map(mid => {
                const mem = store.contacts.find(c => c.id === mid);
                if (!mem) return '';
                const nick = (group.groupNicknames && group.groupNicknames[mid]) || '';
                // [群专属头像] 踢出弹窗中优先显示群专属头像
                const memAvatar = (group.groupAvatars && group.groupAvatars[mid]) || mem.avatar || _ph(40);
                return `<label class="gc-invite-item" style="display:flex; align-items:center; padding:12px; border-bottom:1px solid #f0f0f0; cursor:pointer;">
                    <input type="checkbox" value="${mid}" style="width:18px; height:18px; margin-right:12px; accent-color:#fa5151;">
                    <img src="${memAvatar}" style="width:40px; height:40px; border-radius:8px; object-fit:cover; margin-right:10px;">
                    <span style="font-size:15px;">${nick || mem.name}</span>
                </label>`;
            }).join('');

            modal.innerHTML = `<div class="modal-box" style="max-height:80vh; overflow-y:auto; padding:0;">
                <div style="padding:15px 20px; border-bottom:1px solid #eee; display:flex; justify-content:space-between; align-items:center;">
                    <h3 style="margin:0; color:#fa5151;">移出成员</h3>
                    <span onclick="this.closest('.modal-mask').remove()" style="font-size:20px; cursor:pointer; color:#999;">&times;</span>
                </div>
                <div style="max-height:50vh; overflow-y:auto;">${listHtml}</div>
                <div style="padding:15px; border-top:1px solid #eee;">
                    <button onclick="confirmKickFromGroup('${groupId}', this.closest('.modal-mask'))" style="width:100%; padding:12px; background:#fa5151; color:#fff; border:none; border-radius:8px; font-size:15px; cursor:pointer;">确认移出</button>
                </div>
            </div>`;
            document.getElementById('device').appendChild(modal);
        }

        function confirmKickFromGroup(groupId, modalEl) {
            const group = store.contacts.find(c => c.id === groupId);
            if (!group) return;
            const checkboxes = modalEl.querySelectorAll('input[type="checkbox"]:checked');
            const kickIds = Array.from(checkboxes).map(cb => cb.value);
            if (kickIds.length === 0) return toast('请至少选择一位成员');

            const kickNames = [];
            kickIds.forEach(id => {
                const mem = store.contacts.find(c => c.id === id);
                if (mem) kickNames.push((group.groupNicknames && group.groupNicknames[id]) || mem.name);
                group.members = (group.members || []).filter(m => m !== id);
                if (group.groupNicknames) delete group.groupNicknames[id];
                if (group.groupTitles) delete group.groupTitles[id];
                if (group.groupAvatars) delete group.groupAvatars[id];
                if (group.mutedMembers) delete group.mutedMembers[id];
                // [群角色系统] 踢出时清理管理员身份
                if (group.groupAdmins) group.groupAdmins = group.groupAdmins.filter(aid => aid !== id);
            });

            if (kickNames.length > 0) {
                if (!store.chats[groupId]) store.chats[groupId] = [];
                store.chats[groupId].push({
                    sender: 'system', type: 'poke',
                    content: `${kickNames.join('、')} 被移出了群聊`,
                    time: Date.now()
                });
                save();
                toast(`已将 ${kickNames.join('、')} 移出群聊`);
                
                // [FIX-线下人数同步] 如果当前处于线下模式，同步移除offlineGroupMembers中的成员
                if (typeof offlineContactId !== 'undefined' && offlineContactId === groupId && typeof offlineGroupMembers !== 'undefined') {
                    offlineGroupMembers = offlineGroupMembers.filter(om => !kickIds.includes(om.id));
                }
                
                openChatSettings();
                renderHistory();
            }
            modalEl.remove();
        }

        function openGroupMemberAction(memberId, groupId) {
            const group = store.contacts.find(c => c.id === groupId);
            if (!group) return;
            _initGroupRoles(group);
            if (!group.groupNicknames) group.groupNicknames = {};
            if (!group.groupTitles) group.groupTitles = {};
            if (!group.mutedMembers) group.mutedMembers = {};
            if (!group.groupAvatars) group.groupAvatars = {};

            const isUser = memberId === '__user__';
            const isOwnerMember = _isGroupOwner(group, memberId);
            const isAdminMember = _isGroupAdmin(group, memberId);
            const userIsOwner = _isGroupOwner(group, '__user__');
            let memberName, defaultAvatar;
            if (isUser) {
                const _upId = group.settings?.userPersona || (store.personas.length > 0 ? store.personas[0].id : 'p1');
                const _up = store.personas.find(p => p.id === _upId);
                memberName = _up ? _up.name : (store.user.name || '我');
                defaultAvatar = _up?.avatar || store.user.avatar || _ph(50);
            } else {
                const mem = store.contacts.find(c => c.id === memberId);
                memberName = mem ? mem.name : '未知';
                defaultAvatar = mem?.avatar || _ph(50);
            }

            const currentNick = group.groupNicknames[memberId] || '';
            const currentTitle = group.groupTitles[memberId] || '';
            const isMuted = group.mutedMembers[memberId] || false;
            const currentGroupAvatar = group.groupAvatars[memberId] || '';
            const displayAvatar = currentGroupAvatar || defaultAvatar;

            // 角色管理按钮（仅群主可操作，且不能对自己操作）
            let roleManageHtml = '';
            if (!isUser && userIsOwner) {
                if (isAdminMember) {
                    roleManageHtml = `<div style="margin-bottom:12px;">
                        <button onclick="this.closest('.modal-mask').remove();removeGroupAdmin('${memberId}','${groupId}');openChatSettings();" style="width:100%;padding:10px;background:#fff5f5;border:1px solid #ffccc7;border-radius:8px;font-size:13px;color:#fa5151;cursor:pointer;"><i class="fas fa-user-shield" style="margin-right:4px;"></i>取消管理员</button>
                    </div>`;
                } else if (!isOwnerMember) {
                    roleManageHtml = `<div style="margin-bottom:12px;">
                        <button onclick="this.closest('.modal-mask').remove();setGroupAdmin('${memberId}','${groupId}');openChatSettings();" style="width:100%;padding:10px;background:linear-gradient(135deg,#52c41a,#389e0d);border:none;border-radius:8px;font-size:13px;color:#fff;cursor:pointer;"><i class="fas fa-user-shield" style="margin-right:4px;"></i>设为管理员</button>
                    </div>`;
                }
            }

            const modal = document.createElement('div');
            modal.className = 'modal-mask';
            modal.style.display = 'flex';
            modal.style.zIndex = '9999';
            modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

            modal.innerHTML = `<div class="modal-box" style="padding:0; max-width:340px;">
                <div style="padding:15px 20px; border-bottom:1px solid #eee; text-align:center;">
                    <h3 style="margin:0;">${currentNick || memberName} ${_getRoleTag(group, memberId)}</h3>
                </div>
                <div style="padding:15px 20px;">
                    <div style="margin-bottom:12px;">
                        <label style="font-size:13px; color:#666; display:block; margin-bottom:6px;">群专属头像 <span style="color:#07c160; font-size:11px;">${currentGroupAvatar ? '已自定义' : '使用默认'}</span></label>
                        <div style="display:flex; align-items:center; gap:12px;">
                            <img id="gm-action-avatar-preview" src="${displayAvatar}" style="width:56px; height:56px; border-radius:10px; object-fit:cover; border:2px solid ${currentGroupAvatar ? '#07c160' : '#e0e0e0'}; cursor:pointer;" onclick="document.getElementById('gm-action-avatar-input').click()" onerror="this.onerror=null;this.src='https://ui-avatars.com/api/?name=${encodeURIComponent((memberName||'?')[0])}&background=random&size=80';">
                            <div style="flex:1;">
                                <button onclick="document.getElementById('gm-action-avatar-input').click()" style="width:100%; padding:8px; background:#f5f5f5; border:1px solid #e0e0e0; border-radius:6px; font-size:13px; cursor:pointer; margin-bottom:6px;"><i class="fas fa-camera" style="margin-right:4px;"></i>上传群头像</button>
                                <button id="gm-action-avatar-reset" onclick="resetGroupMemberAvatar()" style="width:100%; padding:8px; background:#fff5f5; border:1px solid #ffccc7; border-radius:6px; font-size:12px; color:#fa5151; cursor:pointer; display:${currentGroupAvatar ? 'block' : 'none'};">恢复默认头像</button>
                            </div>
                            <input type="file" id="gm-action-avatar-input" accept="image/*" style="display:none;" onchange="previewGroupMemberAvatar(this)">
                        </div>
                        <input type="hidden" id="gm-action-avatar-data" value="${currentGroupAvatar}">
                        <div style="font-size:11px; color:#999; margin-top:4px;">${isUser ? '在这个群里显示的头像，不影响其他聊天' : '修改该成员在群里显示的头像'}</div>
                    </div>
                    <div style="margin-bottom:12px;">
                        <label style="font-size:13px; color:#666; display:block; margin-bottom:4px;">群昵称</label>
                        <input id="gm-action-nick" value="${currentNick}" placeholder="${memberName}" style="width:100%; padding:10px; border:1px solid #e0e0e0; border-radius:8px; font-size:14px; box-sizing:border-box;">
                        <div style="font-size:11px; color:#999; margin-top:3px;">${isUser ? '修改你在群里显示的名字' : '该联系人也可以自己修改群备注'}</div>
                    </div>
                    <div style="margin-bottom:12px;">
                        <label style="font-size:13px; color:#666; display:block; margin-bottom:4px;">群专属头衔 <span style="color:#9b59b6; font-size:12px;">紫色展示</span></label>
                        <input id="gm-action-title" value="${currentTitle}" placeholder="无头衔" style="width:100%; padding:10px; border:1px solid #e0e0e0; border-radius:8px; font-size:14px; box-sizing:border-box;">
                    </div>
                    ${!isUser ? `<div style="margin-bottom:12px; display:flex; align-items:center; justify-content:space-between;">
                        <span style="font-size:14px;">禁言</span>
                        <div class="switch" style="transform:scale(0.9);">
                            <input type="checkbox" id="gm-action-mute" ${isMuted ? 'checked' : ''}>
                            <span class="slider"></span>
                        </div>
                    </div>` : ''}
                    ${roleManageHtml}
                </div>
                <div style="display:flex; border-top:1px solid #eee;">
                    <button onclick="this.closest('.modal-mask').remove()" style="flex:1; padding:14px; border:none; background:#fff; font-size:15px; color:#999; cursor:pointer; border-radius:0 0 0 12px;">取消</button>
                    <button onclick="saveGroupMemberAction('${memberId}', '${groupId}', this.closest('.modal-mask'))" style="flex:1; padding:14px; border:none; background:#fff; font-size:15px; color:#07c160; font-weight:bold; cursor:pointer; border-left:1px solid #eee; border-radius:0 0 12px 0;">确定</button>
                </div>
            </div>`;
            document.getElementById('device').appendChild(modal);
        }

        // 群专属头像预览
        function previewGroupMemberAvatar(input) {
            const file = input.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function(e) {
                const preview = document.getElementById('gm-action-avatar-preview');
                const dataInput = document.getElementById('gm-action-avatar-data');
                const resetBtn = document.getElementById('gm-action-avatar-reset');
                if (preview) { preview.src = e.target.result; preview.style.borderColor = '#07c160'; }
                if (dataInput) dataInput.value = e.target.result;
                if (resetBtn) resetBtn.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
        window.previewGroupMemberAvatar = previewGroupMemberAvatar;

        // 恢复默认群头像
        function resetGroupMemberAvatar() {
            const preview = document.getElementById('gm-action-avatar-preview');
            const dataInput = document.getElementById('gm-action-avatar-data');
            const resetBtn = document.getElementById('gm-action-avatar-reset');
            if (dataInput) dataInput.value = '';
            if (resetBtn) resetBtn.style.display = 'none';
            if (preview) { preview.style.borderColor = '#e0e0e0'; }
            // 预览图恢复为默认头像（通过触发onerror或直接设置）
            if (preview) preview.src = preview.src; // 保持当前预览，边框变灰即可
            toast('已恢复默认头像，点击确定保存');
        }
        window.resetGroupMemberAvatar = resetGroupMemberAvatar;

        function saveGroupMemberAction(memberId, groupId, modalEl) {
            const group = store.contacts.find(c => c.id === groupId);
            if (!group) return;
            if (!group.groupNicknames) group.groupNicknames = {};
            if (!group.groupTitles) group.groupTitles = {};
            if (!group.mutedMembers) group.mutedMembers = {};
            if (!group.groupAvatars) group.groupAvatars = {};

            const isUser = memberId === '__user__';
            let memberName;
            if (isUser) {
                const _upId = group.settings?.userPersona || (store.personas.length > 0 ? store.personas[0].id : 'p1');
                const _up = store.personas.find(p => p.id === _upId);
                memberName = _up ? _up.name : (store.user.name || '我');
            } else {
                const mem = store.contacts.find(c => c.id === memberId);
                memberName = mem ? mem.name : '未知';
            }

            const nickEl = document.getElementById('gm-action-nick');
            const titleEl = document.getElementById('gm-action-title');
            const muteEl = document.getElementById('gm-action-mute');
            const avatarDataEl = document.getElementById('gm-action-avatar-data');

            const oldNick = group.groupNicknames[memberId] || '';
            const oldTitle = group.groupTitles[memberId] || '';
            const oldMuted = group.mutedMembers[memberId] || false;
            const oldAvatar = group.groupAvatars[memberId] || '';

            const newNick = nickEl ? nickEl.value.trim() : oldNick;
            const newTitle = titleEl ? titleEl.value.trim() : oldTitle;
            const newMuted = muteEl ? muteEl.checked : oldMuted;
            const newAvatar = avatarDataEl ? avatarDataEl.value : oldAvatar;

            group.groupNicknames[memberId] = newNick;
            group.groupTitles[memberId] = newTitle;
            if (!isUser) group.mutedMembers[memberId] = newMuted;
            // 保存群专属头像（空字符串表示使用默认）
            if (newAvatar) {
                group.groupAvatars[memberId] = newAvatar;
            } else {
                delete group.groupAvatars[memberId];
            }

            const displayName = newNick || memberName;
            if (!store.chats[groupId]) store.chats[groupId] = [];

            if (oldNick !== newNick && newNick) {
                store.chats[groupId].push({ sender: 'system', type: 'poke', content: `${memberName} 修改了群昵称为「${newNick}」`, time: Date.now() });
            }
            if (oldTitle !== newTitle && newTitle) {
                store.chats[groupId].push({ sender: 'system', type: 'poke', content: `${displayName} 获得了群头衔「${newTitle}」`, time: Date.now() });
            } else if (oldTitle && !newTitle) {
                store.chats[groupId].push({ sender: 'system', type: 'poke', content: `${displayName} 的群头衔已被移除`, time: Date.now() });
            }
            if (!isUser && oldMuted !== newMuted) {
                store.chats[groupId].push({ sender: 'system', type: 'poke', content: newMuted ? `${displayName} 已被禁言` : `${displayName} 已被解除禁言`, time: Date.now() });
            }
            // 群专属头像变更提示
            if (oldAvatar !== newAvatar) {
                if (newAvatar && !oldAvatar) {
                    store.chats[groupId].push({ sender: 'system', type: 'poke', content: `${displayName} 设置了群专属头像`, time: Date.now() });
                } else if (!newAvatar && oldAvatar) {
                    store.chats[groupId].push({ sender: 'system', type: 'poke', content: `${displayName} 恢复了默认头像`, time: Date.now() });
                } else if (newAvatar && oldAvatar) {
                    store.chats[groupId].push({ sender: 'system', type: 'poke', content: `${displayName} 更换了群专属头像`, time: Date.now() });
                }
            }

            save();
            toast('已保存');
            modalEl.remove();
            openChatSettings();
            renderHistory();
        }

        function deleteContactFromSettings() {
            const contact = store.contacts.find(x => x.id === activeChatId);
            if (!contact) return;
            showConfirm(
                `删除联系人`,
                `确定要删除联系人 "${contact.name}" 吗？此操作将清除该联系人的聊天记录、日记、动态等所有数据，且不可恢复。`,
                () => thoroughDeleteContact(activeChatId, true)
            );
        }

        function thoroughDeleteContact(contactId, fromSettings = false) {
            const contact = store.contacts.find(x => x.id === contactId);
            if (!contact) return;

            const name = contact.name;

            // [FIX-APK删除卡死] 强制清除所有交互状态，防止删除后界面卡住
            isLongPress = false;
            _blockLongPress = false;
            clearTimeout(longPressTimer);
            longPressTimer = null;

            // 1. Delete Contact
            store.contacts = store.contacts.filter(x => x.id !== contactId);
            
            // 2. Delete Chat History
            delete store.chats[contactId];
            
            // 3. Delete Diaries
            delete store.diaries[contactId];
            
            // 4. Delete Moments (by name)
            if (name) {
                store.moments = store.moments.filter(m => m.name !== name);
            }
            
            // 5. Unbind from Couple space if they are the partner
            if (store.couple.partnerId === contactId) {
                store.couple = { partnerId: null, start: '', wishes: [], anniversaries: [], cycleDate: '', cycleLen: 28, periodLen: 5, periodHistory: [], periodDiary: [], reminderEnabled: false, reminderDaysBefore: 3, careContacts: [], lastReminderDate: '' };
            }

            // [FIX-删除数据残留] 5.5. Delete all coupleSpaces associated with this contact
            if (store.coupleSpaces && store.coupleSpaces.length > 0) {
                store.coupleSpaces = store.coupleSpaces.filter(sp => sp.partnerId !== contactId);
            }

            // [NEW] 6. Delete Offline Chat
            if (store.offlineChats) {
                delete store.offlineChats[contactId];
            }

            // [NEW] 6.5 Delete Ticket Wallet data
            if (store.ticketWallet) {
                delete store.ticketWallet[contactId];
            }

            // [NEW] 7. Remove from any groups (and clean group chat history referencing deleted contact)
            store.contacts.forEach(c => {
                if (c.isGroup && c.members && c.members.includes(contactId)) {
                    c.members = c.members.filter(mId => mId !== contactId);
                    // Clean up group nicknames, titles, muted status, avatars for deleted member
                    if (c.groupNicknames) delete c.groupNicknames[contactId];
                    if (c.groupTitles) delete c.groupTitles[contactId];
                    if (c.groupAvatars) delete c.groupAvatars[contactId];
                    if (c.mutedMembers) delete c.mutedMembers[contactId];
                }
            });

            // [FIX-删除数据残留] 8. Delete all mailbox entries related to this contact
            if (store.mailbox && store.mailbox.length > 0) {
                store.mailbox = store.mailbox.filter(m => m.from !== contactId && m.to !== contactId);
            }

            // [FIX-删除数据残留] 9. Delete memory summaries for this contact
            if (store.memorySummaries && store.memorySummaries[contactId]) {
                delete store.memorySummaries[contactId];
            }

            // [FIX-删除数据残留] 9.5. Delete spacetime memories in couple spaces
            if (store.coupleSpaces) {
                store.coupleSpaces.forEach(space => {
                    if (space && space.partnerId === contactId && space.spacetimeMemories) {
                        space.spacetimeMemories = [];
                    }
                });
            }

            // [FIX-删除数据残留] 10. Delete mail daily count for this contact
            if (store.mailDailyCount && store.mailDailyCount[contactId]) {
                delete store.mailDailyCount[contactId];
            }

            // [FIX-删除数据残留] 11. Delete spirits associated with this contact
            if (store.spirits && store.spirits.length > 0) {
                store.spirits = store.spirits.filter(s => s.partnerId !== contactId);
            }

            // [FIX-删除数据残留] 11.5. Delete friends second-hand market data for this contact
            if (store.friendsSecondHand && store.friendsSecondHand.length > 0) {
                store.friendsSecondHand = store.friendsSecondHand.filter(item => item.sellerId !== contactId);
            }
            if (store.friendsSHConversations && store.friendsSHConversations[contactId]) {
                delete store.friendsSHConversations[contactId];
            }
            if (store.friendsSHOrders && store.friendsSHOrders.length > 0) {
                store.friendsSHOrders = store.friendsSHOrders.filter(o => o.sellerId !== contactId);
            }

            // [FIX-删除数据残留] 12. Remove from supervise system supervisors
            if (store.supervise && store.supervise.supervisors) {
                store.supervise.supervisors = store.supervise.supervisors.filter(s => s.contactId !== contactId);
            }

            // [FIX-删除数据残留] 13. Delete redpackets related to this contact's chat
            if (store.redpackets) {
                Object.keys(store.redpackets).forEach(rpId => {
                    const rp = store.redpackets[rpId];
                    if (rp && rp.chatId === contactId) {
                        delete store.redpackets[rpId];
                    }
                });
            }

            // [FIX-删除数据残留] 14. Clean phoneData if it was generated for this contact
            // [FIX-字段完整v7] 重置时包含所有字段，防止后续访问 photos/calllog 等新字段时报错
            if (store.phoneData && store.phoneData.targetContactId === contactId) {
                store.phoneData = { contacts: [], memo: [], usage: [], search: [], chats: {}, shopping: [], interests: [], assets: null, sms: [], photos: [], calllog: [], location: [], deleted: [], manager: null };
            }
            // [FIX-phoneDataMap清理v8] 使用已捕获的name变量（联系人已在第1步从store.contacts中删除，find无法找到）
            if (name && store.phoneDataMap && store.phoneDataMap[name]) {
                delete store.phoneDataMap[name];
            }

            // [FIX-删除数据残留] 14.5 清理关系网数据（包含该联系人的所有NPC角色）
            if (store.relationNetworks && store.relationNetworks[contactId]) {
                delete store.relationNetworks[contactId];
            }

            // [FIX-删除数据残留] 15. Remove from contactGroups (分组)
            if (store.contactGroups && store.contactGroups.length > 0) {
                store.contactGroups.forEach(g => {
                    if (g.contacts && g.contacts.includes(contactId)) {
                        g.contacts = g.contacts.filter(cid => cid !== contactId);
                    }
                });
            }

            // [FIX-删除数据残留-SMS] 16. 清理短信系统中所有与该联系人相关的数据
            // 之前遗漏：conversations / altMemory / crossAppEvents / _lastProactivePerContact
            // / scheduledMessages / draft / archivedMessages 导致短信里还能看到被删联系人
            if (store.smsApp) {
                const _smsConvIdsToRemove = [];
                if (store.smsApp.conversations) {
                    Object.keys(store.smsApp.conversations).forEach(aid => {
                        const list = store.smsApp.conversations[aid] || [];
                        store.smsApp.conversations[aid] = list.filter(conv => {
                            const hit = conv.contactId === contactId
                                     || conv._altContactId === contactId
                                     || conv.id === contactId;
                            if (hit) _smsConvIdsToRemove.push(conv.id);
                            return !hit;
                        });
                    });
                }
                _smsConvIdsToRemove.forEach(cid => {
                    if (store.smsApp.draft) delete store.smsApp.draft[cid];
                    if (store.smsApp.archivedMessages) delete store.smsApp.archivedMessages[cid];
                });
                if (store.smsApp.altMemory) delete store.smsApp.altMemory[contactId];
                if (store.smsApp._lastProactivePerContact) delete store.smsApp._lastProactivePerContact[contactId];
                if (Array.isArray(store.smsApp.crossAppEvents)) {
                    store.smsApp.crossAppEvents = store.smsApp.crossAppEvents.filter(e => e.contactId !== contactId);
                }
                if (Array.isArray(store.smsApp.scheduledMessages)) {
                    store.smsApp.scheduledMessages = store.smsApp.scheduledMessages.filter(m => m.contactId !== contactId && m.targetContactId !== contactId);
                }
            }

            // [FIX-APK删除卡死] 如果删除的是当前正在查看的联系人，重置activeChatId
            if (activeChatId === contactId) {
                activeChatId = null;
                // 停止可能正在进行的AI生成
                if (typeof isGenerating !== 'undefined') isGenerating = false;
                if (window._autoMsgGenerating) window._autoMsgGenerating = false;
                try { removeLoadingBubble(); } catch(e) {}
            }

            // [FIX-APK删除卡死] 如果线下模式也关联了这个联系人，也重置
            if (offlineContactId === contactId) {
                offlineContactId = null;
                isOfflineInChat = false;
            }

            save();
            renderContacts();
            renderMoments(); // Refresh moments as some might be deleted
            toast(`已彻底删除联系人: ${name}`);

            // [FIX-APK删除卡死] 无论从哪里删除，只要聊天界面正在显示被删联系人，都要关闭
            const chatLayer = document.getElementById('layer-chat');
            const chatSettingsLayer = document.getElementById('layer-chat-settings');
            if (chatSettingsLayer && chatSettingsLayer.classList.contains('show')) {
                closeLayer('layer-chat-settings');
            }
            if (chatLayer && chatLayer.classList.contains('show') && (!activeChatId || activeChatId === contactId)) {
                closeLayer('layer-chat');
            }
            // 确保contact-menu也关闭
            const contactMenu = document.getElementById('contact-menu');
            if (contactMenu) contactMenu.style.display = 'none';
        }

        // [FIX-键盘遮挡] 打开语音测试弹窗（屏幕居中）
        function openTTSTestModal() {
            const modal = document.getElementById('modal-tts-test');
            if (modal) modal.style.display = 'flex';
        }

        async function testMiniMaxTTS() {
            const btn = document.getElementById('mm-test-btn');
            const statusEl = document.getElementById('mm-test-status');
            const text = document.getElementById('mm-test-text').value.trim();
            const voiceId = document.getElementById('mm-test-voice').value.trim();

            if (!text) { showToast('请输入测试文本', 'error'); return; }

            // 临时保存当前设置到 store（不持久化），以便 API 能读取
            if (!store.system.minimax) store.system.minimax = {};
            store.system.minimax.version = document.getElementById('mm-version').value;
            store.system.minimax.groupId = document.getElementById('mm-group-id').value;
            store.system.minimax.apiKey = document.getElementById('mm-api-key').value;
            store.system.minimax.model = document.getElementById('mm-model').value;

            if (!store.system.minimax.apiKey) {
                showToast('请先填写 API Key', 'error');
                return;
            }

            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 合成中...';
            statusEl.style.display = 'block';
            statusEl.style.color = '#999';
            statusEl.textContent = '正在请求语音合成...';

            try {
                const result = await API.textToSpeech(text, voiceId || 'male-qn-qingse', 'zh');

                if (result === '__BROWSER_TTS_DONE__') {
                    statusEl.style.color = '#f90';
                    statusEl.textContent = '✅ 使用浏览器内置语音播放成功（MiniMax API 不可用，已回退）';
                    btn.disabled = false;
                    btn.innerHTML = '<i class="fas fa-volume-up"></i> 测试播放';
                    return;
                }

                const url = URL.createObjectURL(result);
                const audio = document.getElementById('tts-audio');
                audio.src = url;
                audio.onended = () => {
                    statusEl.style.color = '#4caf50';
                    statusEl.textContent = '✅ 播放完毕，语音合成正常！';
                };
                await audio.play();
                statusEl.style.color = '#4caf50';
                statusEl.textContent = '🔊 正在播放...';
            } catch (e) {
                console.error('TTS Test Error:', e);
                statusEl.style.color = '#f44336';
                statusEl.textContent = '❌ 失败: ' + (e.message || '未知错误');
            } finally {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-volume-up"></i> 测试播放';
            }
        }

        // [FIX] API Key 显示/隐藏切换 — 使用 -webkit-text-security 而非 type=password
        // 避免 Edge/移动端将输入框识别为密码框，弹出安全键盘导致无法复制粘贴
        function toggleApiKeyVisibility(inputId, eyeId) {
            const input = document.getElementById(inputId);
            const eye = document.getElementById(eyeId);
            if (!input || !eye) return;
            // 当前是隐藏状态（disc 或空，因为 CSS 里初始设置了 disc）
            const currentSecurity = input.style.webkitTextSecurity || 'disc';
            const isHidden = currentSecurity !== 'none';
            if (isHidden) {
                // 切换到显示明文
                input.style.webkitTextSecurity = 'none';
                input.style.textSecurity = 'none';
                eye.classList.remove('fa-eye-slash');
                eye.classList.add('fa-eye');
            } else {
                // 切换到隐藏（圆点）
                input.style.webkitTextSecurity = 'disc';
                input.style.textSecurity = 'disc';
                eye.classList.remove('fa-eye');
                eye.classList.add('fa-eye-slash');
            }
        }

        // [FIX-粘贴按钮] 通用粘贴函数：从剪贴板读取文本并填入指定输入框
        // 解决华为/荣耀等手机浏览器长按无法弹出复制粘贴菜单的问题
        function pasteToInput(inputId) {
            const input = document.getElementById(inputId);
            if (!input) return;
            // 优先使用 Clipboard API
            if (navigator.clipboard && navigator.clipboard.readText) {
                navigator.clipboard.readText().then(function(text) {
                    if (text) {
                        input.value = text.trim();
                        input.focus();
                        toast('✅ 已粘贴');
                    } else {
                        toast('剪贴板为空', 'error');
                    }
                }).catch(function(err) {
                    console.warn('[Paste] Clipboard API failed:', err);
                    // 回退方案：尝试 execCommand
                    _pasteExecCommandFallback(input);
                });
            } else {
                _pasteExecCommandFallback(input);
            }
        }
        function _pasteExecCommandFallback(input) {
            input.focus();
            var ok = document.execCommand('paste');
            if (!ok) {
                toast('请手动长按输入框粘贴，或先复制内容再点此按钮', 'error');
            }
        }

        // [FIX-API密钥框-v8] 彻底修复：不再使用 stopPropagation()
        // 根本原因：多重 stopPropagation() + -webkit-text-security:disc + 全局 isLongPress 状态机
        // = 长按时 touchend 被系统弹窗吞掉 → isLongPress 状态泄漏 → 界面卡死
        // 修复方案：完全依赖全局 capture 阶段的 _blockLongPress 机制（第5541行），
        // 不再在输入框上调用任何 stopPropagation()，只做样式设置和 blur 清理
        (function initApiKeyInputProtection() {
            const bindProtection = () => {
                const apiKeyInputIds = [
                    'sys-key', 'sys-url', 'mm-api-key', 'mm-group-id', 'preset-key', 'preset-url',
                    'stt-openai-key', 'stt-google-key', 'stt-tencent-key',
                    'stt-xfyun-key', 'stt-xfyun-secret', 'stt-azure-key', 'stt-custom-key',
                    'imggen-openai-key', 'imggen-stability-key', 'imggen-gemini-key',
                    'imggen-qwen-key', 'imggen-siliconflow-key', 'imggen-novelai-key', 'imggen-custom-key',
                    'sys-cors-proxy', 'sec-api-key', 'sec-api-url', 'sec-api-model'
                ];
                apiKeyInputIds.forEach(id => {
                    const input = document.getElementById(id);
                    if (!input) return;
                    if (input._apiKeyProtected) return;
                    input._apiKeyProtected = true;

                    // 确保输入框类型为 text（非 password），避免触发浏览器密码管理器
                    if (input.type === 'password') {
                        input.type = 'text';
                        input.style.webkitTextSecurity = 'disc';
                        input.style.textSecurity = 'disc';
                    }

                    // 允许用户选择文本、复制粘贴
                    input.style.setProperty('-webkit-user-select', 'text', 'important');
                    input.style.setProperty('user-select', 'text', 'important');
                    input.style.setProperty('touch-action', 'auto', 'important');
                    input.style.setProperty('-webkit-touch-callout', 'default', 'important');

                    // 移除所有内联事件处理器（HTML中残留的）
                    input.removeAttribute('ontouchstart');
                    input.removeAttribute('ontouchend');
                    input.removeAttribute('ontouchmove');
                    input.removeAttribute('oncontextmenu');
                    input.ontouchstart = null;
                    input.ontouchend = null;
                    input.ontouchmove = null;
                    input.oncontextmenu = null;

                    // [关键修复] blur 事件：当焦点因系统弹窗/密码管理器/自动填充丢失时
                    // 立即清理所有长按状态，防止 touchend 被吞掉导致状态泄漏
                    input.addEventListener('blur', function() {
                        isLongPress = false;
                        clearTimeout(longPressTimer);
                        longPressTimer = null;
                        _blockLongPress = false;
                    });

                    // [关键修复] focus 事件：获取焦点时设置阻断标记
                    input.addEventListener('focus', function() {
                        _blockLongPress = true;
                        window._lastInputTouchTime = Date.now();
                    });

                    // [FIX-v10] touchstart/touchend 也阻止冒泡，防止长按时事件穿透到底层layer
                    // 在设置页面内的输入框上的触摸事件不应该影响外部的联系人列表等
                    input.addEventListener('touchstart', function(e) {
                        e.stopPropagation();
                        isLongPress = false;
                        _blockLongPress = true;
                        clearTimeout(longPressTimer);
                        longPressTimer = null;
                        window._lastInputTouchTime = Date.now();
                    }, { passive: true });
                    input.addEventListener('touchend', function(e) {
                        e.stopPropagation();
                        isLongPress = false;
                        _blockLongPress = false;
                        clearTimeout(longPressTimer);
                        longPressTimer = null;
                    }, { passive: true });

                    // click 也阻止冒泡（防止 click 冒泡到父元素导致页面跳转）
                    input.addEventListener('click', function(e) {
                        e.stopPropagation();
                    });

                    // [FIX-粘贴按钮] 为每个API输入框注入粘贴按钮
                    // 解决华为/荣耀等安卓手机浏览器长按无法弹出复制粘贴菜单的问题
                    if (!input.parentElement.querySelector('.api-paste-btn')) {
                        var pasteBtn = document.createElement('span');
                        pasteBtn.className = 'api-paste-btn';
                        pasteBtn.innerHTML = '<i class="fas fa-paste"></i>';
                        pasteBtn.title = '从剪贴板粘贴';
                        pasteBtn.style.cssText = 'position:absolute; left:8px; top:50%; transform:translateY(-50%); color:#999; cursor:pointer; font-size:14px; padding:8px; z-index:5; -webkit-tap-highlight-color:transparent; line-height:1;';
                        pasteBtn.onclick = function(e) {
                            e.stopPropagation();
                            e.preventDefault();
                            pasteToInput(id);
                        };
                        // 确保父容器是 position:relative
                        var parent = input.parentElement;
                        if (getComputedStyle(parent).position === 'static') {
                            parent.style.position = 'relative';
                        }
                        parent.insertBefore(pasteBtn, input);
                        // 给输入框左侧留出粘贴按钮的空间
                        input.style.paddingLeft = '36px';
                    }
                });
            };
            if (document.readyState === 'complete' || document.readyState === 'interactive') {
                setTimeout(bindProtection, 100);
            } else {
                document.addEventListener('DOMContentLoaded', () => setTimeout(bindProtection, 100));
            }
        })();

        // [FIX-v11-设置层触摸隔离] 重构版：不再在touchmove上使用stopPropagation
        // 之前的版本在touchstart/touchend/touchmove上全部stopPropagation，
        // 导致某些设备上浏览器原生滚动引擎无法接收到事件，使滚动卡顿/无法滑动
        // 新方案：仅通过标志位阻断长按逻辑，不干扰事件冒泡和原生滚动
        (function initSettingsLayerTouchIsolation() {
            const bind = () => {
                const settingsLayer = document.getElementById('layer-settings');
                if (!settingsLayer || settingsLayer._touchIsolated) return;
                settingsLayer._touchIsolated = true;

                // [FIX-v11] 不再在layer级别stopPropagation
                // 改为：仅设置标志位阻断长按，让触摸事件正常冒泡以保证原生滚动
                settingsLayer.addEventListener('touchstart', function(e) {
                    // 清理所有长按状态
                    isLongPress = false;
                    _blockLongPress = true;
                    clearTimeout(longPressTimer);
                    longPressTimer = null;
                    window._lastInputTouchTime = Date.now();
                    // [FIX-v11] 不再stopPropagation — 让浏览器原生滚动正常工作
                    // 全局capture阶段handler已经通过_blockLongPress阻断长按逻辑
                }, { capture: false, passive: true });

                settingsLayer.addEventListener('touchend', function(e) {
                    isLongPress = false;
                    clearTimeout(longPressTimer);
                    longPressTimer = null;
                    // 延迟清除 _blockLongPress，确保后续的 click 事件也被正确处理
                    setTimeout(function() { _blockLongPress = false; }, 50);
                    // [FIX-v11] 不再stopPropagation
                }, { capture: false, passive: true });

                // [FIX-v11] 完全移除touchmove的stopPropagation
                // 这是导致滚动卡顿的核心原因：阻止touchmove冒泡会破坏部分浏览器的原生滚动机制
                // 桌面滑动防护改为在桌面滑动逻辑中检查settingsLayer.classList.contains('show')
                settingsLayer.addEventListener('touchmove', function() {
                    // 仅维持标志位，不阻止事件传播
                    _blockLongPress = true;
                    clearTimeout(longPressTimer);
                    longPressTimer = null;
                }, { capture: false, passive: true });

                // contextmenu 事件中清理状态（长按触发右键菜单时）
                settingsLayer.addEventListener('contextmenu', function() {
                    isLongPress = false;
                    clearTimeout(longPressTimer);
                    longPressTimer = null;
                    _blockLongPress = false;
                }, { capture: true });

                // [关键] visibilitychange：当用户切换到其他 app 或系统弹窗遮挡时清理状态
                document.addEventListener('visibilitychange', function() {
                    if (document.hidden && settingsLayer.classList.contains('show')) {
                        isLongPress = false;
                        clearTimeout(longPressTimer);
                        longPressTimer = null;
                        _blockLongPress = false;
                    }
                });

                // [FIX-v11] 同样为美化页面(layer-beauty)添加触摸隔离
                const beautyLayer = document.getElementById('layer-beauty');
                if (beautyLayer && !beautyLayer._touchIsolated) {
                    beautyLayer._touchIsolated = true;
                    beautyLayer.addEventListener('touchstart', function(e) {
                        isLongPress = false;
                        _blockLongPress = true;
                        clearTimeout(longPressTimer);
                        longPressTimer = null;
                        window._lastInputTouchTime = Date.now();
                        // [FIX-v11] 不再stopPropagation
                    }, { capture: false, passive: true });
                    beautyLayer.addEventListener('touchend', function(e) {
                        isLongPress = false;
                        clearTimeout(longPressTimer);
                        longPressTimer = null;
                        setTimeout(function() { _blockLongPress = false; }, 50);
                        // [FIX-v11] 不再stopPropagation
                    }, { capture: false, passive: true });
                    beautyLayer.addEventListener('touchmove', function() {
                        // [FIX-v11] 仅维持标志位，不阻止事件传播
                        _blockLongPress = true;
                        clearTimeout(longPressTimer);
                        longPressTimer = null;
                    }, { capture: false, passive: true });
                }
            };
            if (document.readyState === 'complete' || document.readyState === 'interactive') {
                setTimeout(bind, 150);
            } else {
                document.addEventListener('DOMContentLoaded', () => setTimeout(bind, 150));
            }
        })();

        function saveSysSettings() {
             // [FIX] 收起移动端键盘
             if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
             let url = document.getElementById('sys-url').value;
             if(url.endsWith('/')) url = url.slice(0,-1);
             store.system.url = url;
             store.system.key = document.getElementById('sys-key').value;
             store.system.model = document.getElementById('sys-model').value;
             store.system.temp = parseFloat(document.getElementById('sys-temp').value) || 0.7;
             
             // Save MiniMax settings
             if(!store.system.minimax) store.system.minimax = {};
             store.system.minimax.version = document.getElementById('mm-version').value;
             store.system.minimax.groupId = document.getElementById('mm-group-id').value;
             store.system.minimax.apiKey = document.getElementById('mm-api-key').value;
             store.system.minimax.model = document.getElementById('mm-model').value;
             
             // Save CORS Proxy
             store.system.corsProxy = (document.getElementById('sys-cors-proxy').value || '').trim();
             
             // Save Secondary API settings
             if(!store.system.secondaryApi) store.system.secondaryApi = { url: '', key: '', model: '', temp: 0.7, scenes: [] };
             let secUrl = (document.getElementById('sec-api-url').value || '').trim();
             if(secUrl.endsWith('/')) secUrl = secUrl.slice(0,-1);
             store.system.secondaryApi.url = secUrl;
             store.system.secondaryApi.key = (document.getElementById('sec-api-key').value || '').trim();
             store.system.secondaryApi.model = (document.getElementById('sec-api-model').value || '').trim();
             // Collect checked scenes
             const secScenes = [];
             document.querySelectorAll('.sec-api-scene-cb').forEach(function(cb) {
                 if(cb.checked && cb.dataset.scene) secScenes.push(cb.dataset.scene);
             });
             store.system.secondaryApi.scenes = secScenes;
             
             save(); toast("系统配置已保存");
        }

        // [新增] API连接测试
        async function testApiConnection() {
            const btn = document.getElementById('btn-test-api');
            if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 测试中...'; }
            // 先保存当前输入的配置
            let url = document.getElementById('sys-url').value;
            if(url.endsWith('/')) url = url.slice(0,-1);
            store.system.url = url;
            store.system.key = document.getElementById('sys-key').value;
            store.system.model = document.getElementById('sys-model').value;
            try {
                const result = await API.testConnection();
                if (result.ok) {
                    toast('连接成功 | 延迟 ' + result.latency + 'ms | 模型 ' + (result.model || '未知') + ' | 消耗 ' + (result.tokens || 0) + ' tokens', 'success');
                } else {
                    toast('连接失败: ' + result.error, 'error');
                }
            } catch(e) {
                toast('测试异常: ' + (e.message || '未知错误'), 'error');
            }
            if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-plug"></i> 测试连接'; }
        }

        async function fetchSecApiModels() {
             const url = document.getElementById('sec-api-url').value;
             const key = document.getElementById('sec-api-key').value;
             if(!url || !key) { showToast("请先填写副API的Endpoint和Key", "error"); return; }
             showToast("正在拉取副API模型...", "info");
             try {
                 const normalizedUrl = API._normalizeBaseUrl(url);
                 const fullUrl = (normalizedUrl.endsWith('/') ? normalizedUrl.slice(0,-1) : normalizedUrl) + '/models';
                 const response = await fetch(fullUrl, { headers: { 'Authorization': 'Bearer ' + key.trim() } });
                 if(!response.ok) throw new Error('HTTP ' + response.status);
                 const data = await response.json();
                 const models = (data.data || data).map(function(m){ return m.id || m; }).sort();
                 if(models.length === 0) { showToast("未找到可用模型", "warning"); return; }
                 // 弹出模型选择
                 const modelInput = document.getElementById('sec-api-model');
                 const html = '<div style="max-height:300px;overflow-y:auto;">' + models.map(function(m){
                     return '<div style="padding:10px 12px;border-bottom:1px solid #f0f0f0;cursor:pointer;font-size:14px;" onclick="document.getElementById(\'sec-api-model\').value=\'' + m.replace(/'/g, "\\'") + '\';document.getElementById(\'modal-sec-models\').style.display=\'none\';">' + m + '</div>';
                 }).join('') + '</div>';
                 // 创建临时弹窗
                 let modal = document.getElementById('modal-sec-models');
                 if(!modal) {
                     modal = document.createElement('div');
                     modal.id = 'modal-sec-models';
                     modal.className = 'modal-mask';
                     modal.innerHTML = '<div class="modal-box"><h3>选择副API模型</h3><div id="sec-models-list"></div><button onclick="this.parentElement.parentElement.style.display=\'none\'" style="margin-top:10px;padding:10px 20px;border:none;background:#eee;border-radius:6px;width:100%;">关闭</button></div>';
                     document.body.appendChild(modal);
                 }
                 document.getElementById('sec-models-list').innerHTML = html;
                 modal.style.display = 'flex';
                 showToast("找到 " + models.length + " 个模型", "success");
             } catch(e) {
                 showToast("拉取副API模型失败: " + e.message, "error");
             }
        }

        async function fetchModels() {
             const url = document.getElementById('sys-url').value;
             const key = document.getElementById('sys-key').value;
             showToast("正在拉取模型...", "info");
             try {
                 const data = await API.fetchModels(url, key);
                 const models = Array.isArray(data) ? data : (data.data || []);
                 
                 const sel = document.getElementById('sys-model');
                 sel.innerHTML = '';
                 models.forEach(m => {
                     const opt = document.createElement('option');
                     const id = m.id || m;
                     opt.value = id; opt.innerText = id;
                     sel.appendChild(opt);
                 });
                 
                 store.system.url = url;
                 store.system.key = key;
                 // [FIX-模型被静默切换] 如果用户当前模型不在拉取的列表中，保留用户的模型并添加到select
                 // 之前的逻辑会静默替换为列表第一个模型（如minimax），导致用户聊天时报错
                 if(models.length > 0 && !models.find(m => (m.id || m) === store.system.model)) {
                     // 将用户当前模型作为额外选项添加到select中，不自动切换
                     const curOpt = document.createElement('option');
                     curOpt.value = store.system.model;
                     curOpt.innerText = store.system.model + ' (当前使用)';
                     sel.insertBefore(curOpt, sel.firstChild);
                     showToast("当前模型 " + store.system.model + " 不在列表中，已保留。如需切换请手动选择后保存。", "info");
                 }
                 sel.value = store.system.model;
                 // 不自动save()，避免静默覆盖用户的模型。用户需手动点保存按钮确认。
                 showToast("模型列表已更新（共" + models.length + "个），请手动选择后保存", "success");
             } catch(e) {
                 console.error(e);
                 // Error toast already shown by API.fetchModels
             }
        }

        async function fetchModelsForPreset() {
             const url = document.getElementById('preset-url').value;
             const key = document.getElementById('preset-key').value;
             showToast("正在拉取...", "info");
             try {
                 const data = await API.fetchModels(url, key);
                 const models = Array.isArray(data) ? data : (data.data || []);
                 
                 if(models.length > 0) {
                     const input = document.getElementById('preset-model');
                     const modelNames = models.map(m => m.id || m);
                     input.value = modelNames[0]; // Default to first
                     
                     const p = document.getElementById('modal-picker');
                     const l = document.getElementById('picker-list');
                     document.getElementById('picker-title').innerText = "选择模型";
                     l.innerHTML = modelNames.map(m => `<div class="list-item" onclick="document.getElementById('preset-model').value='${m}'; document.getElementById('modal-picker').style.display='none'">${m}</div>`).join('');
                     p.style.display='flex';
                     
                     showToast("拉取成功，请选择", "success");
                 } else {
                     showToast("未找到可用模型", "error");
                 }
             } catch(e) {
                 console.error(e);
                 // Error already handled
             }
        }

        // --- API PRESETS ---
        let _editingApiPresetIdx = -1; // -1 = 新增模式，>=0 = 编辑模式

        function renderAPIPresets() {
            const list = document.getElementById('api-preset-list');
            if(!store.apiPresets) store.apiPresets = [];
            
            list.innerHTML = store.apiPresets.length === 0 ? '<div style="text-align:center;padding:20px;"><div style="font-size:13px;color:#999;margin-bottom:10px;">还没有API预设</div><button onclick="if(typeof openSettingsPage===\'function\') openSettingsPage(\'api\');" style="padding:6px 16px;background:#333;color:#fff;border:none;border-radius:6px;font-size:12px;cursor:pointer;">去API设置添加</button></div>' : '';
            
            store.apiPresets.forEach((p,i) => {
                list.innerHTML += `<div class="form-cell">
                        <span class="form-label">${p.name}</span>
                        <button onclick="editAPIPreset(${i})" style="padding:5px 10px; border:none; background:#555; color:#fff; border-radius:4px; margin-right:5px;">编辑</button><button onclick="loadAPIPreset(${i})" style="padding:5px 10px; border:none; background:#333; color:#fff; border-radius:4px; margin-right:5px;">加载</button><button onclick="deleteAPIPreset(${i})" style="padding:5px 10px; border:none; background:#888; color:#fff; border-radius:4px;">删除</button>
                    </div>
                `;
            });
        }

        function openAPIPresetModal() {
            _editingApiPresetIdx = -1; // 重置为新增模式
            document.getElementById('modal-api-preset').style.display = 'flex';
            document.getElementById('preset-name').value = '';
            document.getElementById('preset-url').value = '';
            document.getElementById('preset-key').value = '';
            document.getElementById('preset-model').value = '';
        }

        function editAPIPreset(idx) {
            const p = store.apiPresets[idx];
            if (!p) return;
            _editingApiPresetIdx = idx;
            document.getElementById('modal-api-preset').style.display = 'flex';
            document.getElementById('preset-name').value = p.name || '';
            document.getElementById('preset-url').value = p.url || '';
            document.getElementById('preset-key').value = p.key || '';
            document.getElementById('preset-model').value = p.model || '';
        }

        function saveAPIPreset() {
            // [FIX] 收起移动端键盘
            if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
            const name = document.getElementById('preset-name').value;
            const url = document.getElementById('preset-url').value;
            const key = document.getElementById('preset-key').value;
            const model = document.getElementById('preset-model').value;
            
            if(!name || !url || !key || !model) return toast("请填写完整信息");
            
            if(!store.apiPresets) store.apiPresets = [];

            if (_editingApiPresetIdx >= 0 && _editingApiPresetIdx < store.apiPresets.length) {
                // 编辑模式：更新已有预设
                const existing = store.apiPresets[_editingApiPresetIdx];
                existing.name = name;
                existing.url = url;
                existing.key = key;
                existing.model = model;
                toast("预设已更新");
            } else {
                // 新增模式
                store.apiPresets.push({id: 'preset_' + Date.now() + '_' + Math.random().toString(36).substr(2,4), name, url, key, model});
                toast("预设已保存");
            }

            _editingApiPresetIdx = -1;
            save(); renderAPIPresets();document.getElementById('modal-api-preset').style.display = 'none';
        }

        function loadAPIPreset(idx) {
            const p = store.apiPresets[idx];
            document.getElementById('sys-url').value = p.url;
            document.getElementById('sys-key').value = p.key;
            
            // [FIX-预设持久化] 同步更新 store.system，确保刷新后不会丢失
            store.system.url = p.url;
            store.system.key = p.key;
            store.system.model = p.model;

            const sel = document.getElementById('sys-model');
            let found = false;
            for(let i=0; i<sel.options.length; i++) {
                if(sel.options[i].value === p.model) { found = true; break; }
            }
            if(!found) {
                const opt = document.createElement('option');
                opt.value = p.model; opt.innerText = p.model;
                sel.appendChild(opt);
            }
            sel.value = p.model;
            
            // [FIX-预设持久化] 保存到持久化存储，防止刷新后丢失
            save();
            toast("预设已加载: " + p.name);
        }

        function deleteAPIPreset(idx) {
            if(confirm("确定删除此预设?")) {
                store.apiPresets.splice(idx, 1);
                save(); renderAPIPresets();
            }
        }

        // --- MOMENTS ---
        function renderMoments() {
            const feed = document.getElementById('moments-feed');
            if (!feed) return;
            // 显示/隐藏批量删除按钮
            const _batchDelBtn = document.getElementById('moments-batch-del-btn');
            if (_batchDelBtn) _batchDelBtn.style.display = store.moments.length > 0 ? '' : 'none';
            
            // [FIX-朋友圈背景白屏] 确保 momentBg 有效，清理无效的空值/blob URL
            let bgUrl = store.user.momentBg;
            if (!bgUrl || bgUrl === 'undefined' || bgUrl === 'null' || bgUrl.trim() === '') {
                bgUrl = '';
                store.user.momentBg = '';
            }
            // 预加载背景图以避免闪白
            if (bgUrl) { const _preload = new Image(); _preload.src = bgUrl; }
            const bg = store.user.momentBg || _phRect(800,600,"333","666");
            
            // [FIX-朋友圈白条] 每次渲染时强制清除nav-bar的inline样式，防止缓存/导入数据残留
            const momentsNav = document.getElementById('moments-nav-bar') || document.querySelector('#tab-moments .nav-bar');
            if (momentsNav) {
                momentsNav.removeAttribute('style');
            }
            
            // [FIX-问题2] 使用 requestAnimationFrame 批量更新DOM，避免闪烁
            requestAnimationFrame(() => {
                // [FIX-朋友圈背景白屏] 使用 <img> + onerror 兜底，避免 CSS background-url 刷新时闪白
                let html = `
                    <div style="position:relative;">
                        <div style="height:300px; position:relative; cursor:pointer; overflow:hidden; background-color:#333;" onclick="uploadImg('moment-bg')">
                            <img src="${bg}" style="position:absolute; top:0; left:0; width:100%; height:100%; object-fit:cover; display:block;" onerror="this.onerror=null;this.src=_phRect(800,600,'333','666');" loading="eager">
                        </div>
                        <div style="position:absolute; bottom:-25px; right:20px; display:flex; align-items:flex-end; z-index:2;">
                            <div style="color:#fff; font-weight:bold; margin-bottom:30px; margin-right:10px; text-shadow:0 1px 2px #000;">${store.user.name}</div>
                            <img src="${store.user.avatar||_ph(100)}" style="width:70px; height:70px; border-radius:8px; border:2px solid #fff; background:#fff;">
                        </div>
                    </div>
                    <div style="height:25px; background:#fff;"></div>
                `;
                
                // 批量删除按钮已在index.html中静态定义，通过renderMoments开头的显示/隐藏控制
                
                store.moments.forEach((m, idx) => {
                const liked = m.likes && m.likes.includes(ForumAPI._meId());
                const likeColor = liked ? '#fa5151' : '#576b95';
                const comments = m.comments || [];
                
                // Build group visibility badge
                let groupBadge = '';
                if (m.visibleGroupIds && m.visibleGroupIds.length > 0 && store.contactGroups) {
                    const groupNames = m.visibleGroupIds.map(gid => {
                        const g = store.contactGroups.find(x => x.id === gid);
                        return g ? g.name : '';
                    }).filter(Boolean);
                    if (groupNames.length > 0) {
                        groupBadge = `<div style="display:inline-flex;align-items:center;gap:4px;background:#f0f0ff;color:#667eea;font-size:11px;padding:2px 8px;border-radius:10px;margin-top:4px;"><i class="fas fa-lock" style="font-size:10px;"></i> ${groupNames.join(', ')} 可见</div>`;
                    }
                }
                
                html += `
                    <div style="padding:15px; border-bottom:1px solid #eee; background:#fff;">
                        <div style="display:flex; gap:10px;">
                            <img src="${m.avatar}" class="avatar" style="width:40px; height:40px;">
                            <div style="flex:1;">
                                <div style="color:#576b95; font-weight:bold; font-size:15px;">${m.name}</div>
                                ${groupBadge}
                                <div style="margin:5px 0; font-size:15px;">${m.content}</div>
                                ${m.imgs && m.imgs.length > 0 ? `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:5px;">${m.imgs.map(imgUrl => `<img src="${imgUrl}" style="width:calc(33% - 3px);max-width:120px;aspect-ratio:1;object-fit:cover;border-radius:4px;cursor:pointer;" onclick="showBigImg('${imgUrl}')">`).join('')}</div>` : (m.img ? `<img src="${m.img}" style="max-width:200px; max-height:200px; border-radius:4px; margin-top:5px; cursor:pointer;" onclick="showBigImg('${m.img}')">` : '')}
                                
                                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px; flex-wrap:nowrap;">
                                    <span style="font-size:12px; color:#999; white-space:nowrap; flex-shrink:0;">${new Date(m.time).toLocaleTimeString()}</span>
                                    <div style="display:flex; gap:12px; align-items:center; flex-shrink:0; flex-wrap:nowrap;">
                                        <i class="${liked?'fas':'far'} fa-heart" style="cursor:pointer; color:${likeColor}; font-size:15px;" onclick="toggleLike(${idx})" title="点赞"></i>
                                        <i class="far fa-comment" style="cursor:pointer; color:#576b95; font-size:15px;" onclick="addComment(${idx})" title="评论"></i>
                                        <i class="fas fa-magic" style="cursor:pointer; color:#f0ad4e; font-size:14px;" onclick="generateMomentComments(${idx})" title="生成评论"></i>
                                        <i class="fas fa-trash" style="color:#ddd; cursor:pointer; font-size:14px;" onclick="deleteMoment(${idx})" title="删除"></i>
                                    </div>
                                </div>
                                
                                ${(m.likes?.length > 0 || comments.length > 0) ? `
                                    <div style="background:#f7f7f7; padding:8px; margin-top:10px; border-radius:4px;">
                                        ${m.likes?.length > 0 ? `<div style="color:#576b95; font-size:13px; margin-bottom:5px;"><i class="far fa-heart"></i> ${m.likes.includes(ForumAPI._meId())?'我':''}${m.likes.length>1?', ...':''}</div>` : ''}
                                        ${comments.map((cm, ci) => `<div class="moment-comment-item" data-midx="${idx}" data-cidx="${ci}" data-cname="${(cm.name||'').replace(/"/g,'&quot;')}" style="font-size:13px; margin-bottom:2px; cursor:pointer;"><span style="color:#576b95; font-weight:500;">${cm.name}${cm.replyTo?` <span style="color:#333;">回复</span> <span style="color:#576b95;">${cm.replyTo}</span>`:''}: </span>${cm.text}</div>`).join('')}
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                    `;
                });
                
                feed.innerHTML = html;

                // 长按删除评论（触摸+桌面长按+右键）
            feed.querySelectorAll('.moment-comment-item').forEach(el => {
                let pressTimer = null;
                let isLongPress = false;
                const triggerDelete = () => {
                    isLongPress = true;
                    const midx = parseInt(el.dataset.midx);
                    const cidx = parseInt(el.dataset.cidx);
                    deleteMomentComment(midx, cidx);
                };
                const triggerReply = () => {
                    const midx = parseInt(el.dataset.midx);
                    const cname = el.dataset.cname;
                    if (cname && cname !== store.user.name) {
                        addComment(midx, cname);
                    } else {
                        addComment(midx);
                    }
                };
                // 移动端长按
                el.addEventListener('touchstart', (e) => {
                    isLongPress = false;
                    pressTimer = setTimeout(triggerDelete, 600);
                }, { passive: true });
                el.addEventListener('touchend', (e) => {
                    clearTimeout(pressTimer);
                    if (!isLongPress) triggerReply();
                });
                el.addEventListener('touchmove', () => { clearTimeout(pressTimer); isLongPress = true; });
                // 桌面端长按（鼠标）
                el.addEventListener('mousedown', (e) => {
                    if (e.button === 0) {
                        isLongPress = false;
                        pressTimer = setTimeout(triggerDelete, 600);
                    }
                });
                el.addEventListener('mouseup', (e) => {
                    clearTimeout(pressTimer);
                    if (e.button === 0 && !isLongPress) triggerReply();
                });
                el.addEventListener('mouseleave', () => { clearTimeout(pressTimer); });
                // 桌面端右键
                el.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    triggerDelete();
                });
                });

                // [FIX-v4] 朋友圈滚动：使用CSS class切换，已移除moments-status-mask遮罩
                const tabMoments = document.getElementById('tab-moments');
                if (tabMoments && feed) {
                    const updateMomentsScrollStyle = function() {
                        if (feed.scrollTop > 250) {
                            tabMoments.classList.add('moments-scrolled');
                        } else {
                            tabMoments.classList.remove('moments-scrolled');
                        }
                    };
                    feed.onscroll = throttle(updateMomentsScrollStyle, 100);
                    updateMomentsScrollStyle();
                }
            });
        }
        
        function showMomentActionSheet() {
            document.getElementById('modal-moment-action').style.display='flex';
        }
        
        function postMoment(t, i, imgs) {
             if (!t && !i && (!imgs || imgs.length === 0)) return toast("请输入内容");
             // Show group visibility selector before posting
             if (typeof showMomentGroupSelect === 'function') {
                 showMomentGroupSelect(t, i, imgs);
             } else {
                 // Fallback: post directly without group filter
                 doPostMomentWithGroups && doPostMomentWithGroups();
             }
        }
        
        function deleteMoment(idx) {
            showConfirm("删除朋友圈", "确定要删除这条朋友圈吗？", () => {
                store.moments.splice(idx, 1);
                save();
                renderMoments();
                toast("朋友圈已删除", "success");
            });
        }
        
        // 批量删除朋友圈
        let batchDeleteMode = false;
        let batchDeleteSelected = new Set();
        
        function batchDeleteMoments() {
            batchDeleteMode = true;
            batchDeleteSelected.clear();
            renderMomentsBatchMode();
        }
        
        function renderMomentsBatchMode() {
            const feed = document.getElementById('moments-feed');
            let html = `<div style="padding-top:88px;"></div>
            <div style="position:sticky; top:0; z-index:100; padding:10px 15px; background:#fff3cd; border-bottom:1px solid #eee; display:flex; justify-content:space-between; align-items:center;">
                <span style="font-size:13px; color:#856404;">批量删除模式 - 已选 <span id="batch-count">${batchDeleteSelected.size}</span> 条</span>
                <div style="display:flex; gap:8px;">
                    <button onclick="selectAllMoments()" style="padding:4px 10px; border:1px solid #576b95; background:#fff; color:#576b95; border-radius:4px; font-size:12px; cursor:pointer;">全选</button>
                    <button onclick="confirmBatchDelete()" style="padding:4px 10px; border:none; background:#fa5151; color:#fff; border-radius:4px; font-size:12px; cursor:pointer;">删除</button>
                    <button onclick="cancelBatchDelete()" style="padding:4px 10px; border:1px solid #999; background:#fff; color:#666; border-radius:4px; font-size:12px; cursor:pointer;">取消</button>
                </div>
            </div>`;
            
            store.moments.forEach((m, idx) => {
                const checked = batchDeleteSelected.has(idx) ? 'checked' : '';
                html += `<div style="padding:10px 15px; border-bottom:1px solid #eee; background:#fff; display:flex; align-items:flex-start; gap:10px; cursor:pointer;" onclick="toggleBatchSelect(${idx})">
                    <input type="checkbox" ${checked} style="margin-top:4px; pointer-events:none;" />
                    <img src="${m.avatar}" style="width:36px; height:36px; border-radius:4px;">
                    <div style="flex:1; min-width:0;">
                        <div style="color:#576b95; font-weight:bold; font-size:14px;">${m.name}</div>
                        <div style="font-size:13px; color:#333; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${(m.content||'').substring(0, 40)}</div>
                        <div style="font-size:11px; color:#999;">${new Date(m.time).toLocaleString()}</div>
                    </div>
                </div>`;
            });
            
            feed.innerHTML = html;
        }
        
        function toggleBatchSelect(idx) {
            if (batchDeleteSelected.has(idx)) batchDeleteSelected.delete(idx);
            else batchDeleteSelected.add(idx);
            const countEl = document.getElementById('batch-count');
            if (countEl) countEl.textContent = batchDeleteSelected.size;
            // 更新checkbox状态
            const feed = document.getElementById('moments-feed');
            const items = feed.querySelectorAll('input[type="checkbox"]');
            items.forEach((cb, i) => { cb.checked = batchDeleteSelected.has(i); });
        }
        
        function selectAllMoments() {
            if (batchDeleteSelected.size === store.moments.length) {
                batchDeleteSelected.clear();
            } else {
                store.moments.forEach((_, i) => batchDeleteSelected.add(i));
            }
            renderMomentsBatchMode();
        }
        
        function confirmBatchDelete() {
            if (batchDeleteSelected.size === 0) return toast('请先选择要删除的动态');
            showConfirm("批量删除", `确定删除选中的 ${batchDeleteSelected.size} 条动态吗？`, () => {
                const indices = Array.from(batchDeleteSelected).sort((a, b) => b - a);
                indices.forEach(i => store.moments.splice(i, 1));
                save();
                batchDeleteMode = false;
                batchDeleteSelected.clear();
                renderMoments();
                toast(`已删除 ${indices.length} 条动态`, 'success');
            });
        }
        
        function cancelBatchDelete() {
            batchDeleteMode = false;
            batchDeleteSelected.clear();
            renderMoments();
        }
        
        function toggleLike(idx) {
            const m = store.moments[idx];
            if(!m.likes) m.likes = [];
            
            if(m.likes.includes(ForumAPI._meId())) {
                m.likes = m.likes.filter(x=>x!==ForumAPI._meId());
            } else {
                m.likes.push(ForumAPI._meId());
            }
            save(); renderMoments();
        }
        
        function addComment(idx, replyTo) {
            openCustomInput('moment-comment', { idx: idx, replyTo: replyTo || '' });
        }

        function deleteMomentComment(momentIdx, commentIdx) {
            const m = store.moments[momentIdx];
            if (!m || !m.comments || !m.comments[commentIdx]) return;
            const cm = m.comments[commentIdx];
            showConfirm('删除评论', `确定删除 ${cm.name} 的评论吗？\n"${cm.text}"`, () => {
                m.comments.splice(commentIdx, 1);
                save();
                renderMoments();
                toast('评论已删除', 'success');
            });
        }

        // 生成朋友圈评论
        function generateMomentComments(momentIdx) {
            const m = store.moments[momentIdx];
            if (!m) return toast('动态不存在', 'error');
            
            const isUserMoment = (m.name === store.user.name || store.personas.some(p => p.name === m.name));
            
            let commenters = [];
            
    if (isUserMoment) {
                // 用户的朋友圈：使用canSeeMoment统一检查可见性
                let aiContacts = store.contacts.filter(c => !c.isGroup);
                if (typeof canSeeMoment === 'function') {
                    aiContacts = aiContacts.filter(c => canSeeMoment(c.id, m));
                }
                commenters = aiContacts;
            } else {
                // 联系人的朋友圈：相同分组的联系人评论（互评开关开启前提下）
                const authorContact = store.contacts.find(c => c.name === m.name);
                const authorId = authorContact ? authorContact.id : null;
                const aiInteractionSwitch = store.user.aiMomentInteraction;
                
                let aiContacts = store.contacts.filter(c => !c.isGroup && c.id !== authorId);
                
                // [FIX-分组可见性] 统一使用canSeeMoment + areInSameGroup双重检查
                if (typeof canSeeMoment === 'function') {
                    aiContacts = aiContacts.filter(c => canSeeMoment(c.id, m));
                }
                
                if (aiInteractionSwitch && authorId) {
                    // [FIX-互评逻辑] 始终使用分组过滤，无分组则不互评
                    if (typeof areInSameGroup === 'function') {
                        aiContacts = aiContacts.filter(c => areInSameGroup(authorId, c.id));
                    }
                    commenters = aiContacts;
                } else if (!aiInteractionSwitch) {
                    commenters = aiContacts;
                } else {
                    commenters = aiContacts;
                }
            }
            
            if (commenters.length === 0) return toast('没有可评论的联系人', 'info');
            
            // 过滤掉已经评论过的联系人
            const existingCommenters = new Set((m.comments || []).map(c => c.name));
            const newCommenters = commenters.filter(c => !existingCommenters.has(c.name));
            
            if (newCommenters.length === 0) return toast('所有联系人已评论过', 'info');
            
            // 立即显示打字指示器
            if (newCommenters.length > 0) {
                showMomentTypingIndicator(newCommenters[0].name);
            }
            
            const momentText = (m.content || '').substring(0, 50);
            
            if (isUserMoment) {
                // 用户朋友圈：联系人评论用户的朋友圈
                newCommenters.forEach((c, idx) => {
                    setTimeout(() => {
                        aiGenerate(`comment_user_moment::${c.id}::${m.id}::${momentText}`);
                    }, 500 + idx * 1500);
                });
            } else {
                // 联系人朋友圈：其他联系人评论
                const authorContact = store.contacts.find(c => c.name === m.name);
                const authorName = authorContact ? authorContact.name : m.name;
                newCommenters.forEach((c, idx) => {
                    setTimeout(() => {
                        aiGenerate(`comment_ai_moment::${c.id}::${m.id}::${momentText}::${authorName}`);
                    }, 500 + idx * 1500);
                });
            }
        }

        // --- ME ---
        window.openProfileEdit = function() {
             document.getElementById('p-edit-name').value = store.user.name;
             document.getElementById('p-edit-wxid').value = store.user.wxid;
             document.getElementById('modal-profile-edit').style.display='flex';
        };
        window.saveProfileEdit = function() {
             store.user.name = document.getElementById('p-edit-name').value;
             store.user.wxid = document.getElementById('p-edit-wxid').value;
             save(); document.getElementById('my-name').innerText=store.user.name;document.getElementById('my-wxid').innerText=store.user.wxid;
             document.getElementById('modal-profile-edit').style.display='none';
             // [FIX-名字覆盖] 不再将微信名字同步到主界面，主界面使用独立的desktopName
        };

        // --- PROFILE PRESETS ---
        let editingProfilePresetId = null;

        function openProfilePresetMgmt() {
            if (!store.profilePresets) store.profilePresets = [];
            renderProfilePresets();
            document.getElementById('modal-profile-preset').style.display = 'flex';
        }

        function renderProfilePresets() {
            const list = document.getElementById('profile-preset-list');
            const presets = store.profilePresets || [];
            if (presets.length === 0) {
                list.innerHTML = '<div style="text-align:center; padding:30px; color:#999;">暂无预设，点击下方按钮添加</div>';
                return;
            }
            list.innerHTML = presets.map(p => `
                <div style="display:flex; align-items:center; gap:12px; padding:12px; border-bottom:1px solid #f0f0f0; cursor:pointer;" onclick="applyProfilePreset('${p.id}')">
                    <img src="${p.avatar || _ph(46)}" style="width:46px; height:46px; border-radius:50%; object-fit:cover; flex-shrink:0; border:1px solid #eee;">
                    <div style="flex:1; min-width:0;">
                        <div style="font-size:15px; font-weight:500;">${p.name || '未命名'}</div>
                        ${p.wxid ? `<div style="font-size:12px; color:#999;">微信号: ${p.wxid}</div>` : ''}
                    </div>
                    <div style="display:flex; gap:8px; flex-shrink:0;">
                        <i class="fas fa-edit" style="color:#576b95; padding:6px; cursor:pointer;" onclick="event.stopPropagation(); editProfilePreset('${p.id}')"></i>
                        <i class="fas fa-trash" style="color:#fa5151; padding:6px; cursor:pointer;" onclick="event.stopPropagation(); deleteProfilePreset('${p.id}')"></i>
                    </div>
                </div>
            `).join('');
        }

        function addProfilePreset() {
            editingProfilePresetId = null;
            document.getElementById('profile-preset-edit-title').textContent = '添加预设';
            document.getElementById('profile-preset-edit-avatar').src = '';
            document.getElementById('profile-preset-edit-name').value = '';
            document.getElementById('profile-preset-edit-wxid').value = '';
            document.getElementById('modal-profile-preset-edit').style.display = 'flex';
        }

        function editProfilePreset(id) {
            const p = (store.profilePresets || []).find(x => x.id === id);
            if (!p) return;
            editingProfilePresetId = id;
            document.getElementById('profile-preset-edit-title').textContent = '修改预设';
            document.getElementById('profile-preset-edit-avatar').src = p.avatar || '';
            document.getElementById('profile-preset-edit-name').value = p.name || '';
            document.getElementById('profile-preset-edit-wxid').value = p.wxid || '';
            document.getElementById('modal-profile-preset-edit').style.display = 'flex';
        }

        function saveProfilePreset() {
            // [FIX] 收起移动端键盘
            if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
            const name = document.getElementById('profile-preset-edit-name').value.trim();
            if (!name) return toast('请输入预设名字');
            const avatar = document.getElementById('profile-preset-edit-avatar').src || '';
            const wxid = document.getElementById('profile-preset-edit-wxid').value.trim();
            if (!store.profilePresets) store.profilePresets = [];

            if (editingProfilePresetId) {
                const p = store.profilePresets.find(x => x.id === editingProfilePresetId);
                if (p) { p.name = name; p.avatar = avatar; p.wxid = wxid; }
            } else {
                store.profilePresets.push({ id: 'pp' + Date.now(), name, avatar, wxid });
            }
            save();
            document.getElementById('modal-profile-preset-edit').style.display = 'none';
            renderProfilePresets();
            toast('预设已保存', 'success');
        }

        function deleteProfilePreset(id) {
            showConfirm('删除预设', '确定删除这个预设吗？', () => {
                store.profilePresets = (store.profilePresets || []).filter(x => x.id !== id);
                save();
                renderProfilePresets();
                toast('预设已删除', 'success');
            });
        }

        function applyProfilePreset(id) {
            const p = (store.profilePresets || []).find(x => x.id === id);
            if (!p) return;
            showConfirm('应用预设', `确定将头像和名字切换为「${p.name}」吗？`, () => {
                store.user.name = p.name;
                if (p.avatar) store.user.avatar = p.avatar;
                if (p.wxid) store.user.wxid = p.wxid;
                save();
                // 更新UI
                document.getElementById('my-name').innerText = store.user.name;
                document.getElementById('my-wxid').innerText = store.user.wxid;
                if (store.user.avatar) document.getElementById('my-avatar').src = store.user.avatar;
                // [FIX-名字覆盖] 不再将微信预设同步到主界面，主界面使用独立的desktopName/desktopAvatar
                // [FIX-头像名字跟微信走] 移除将微信头像同步到desktop-user-avatar-img的代码
                document.getElementById('modal-profile-preset').style.display = 'none';
                toast('已切换为「' + p.name + '」', 'success');
            });
        }

