// ===== 角色相册系统 (Photo Album System) =====
// 三层分级：联系人列表 → 相册列表 → 照片详情
// 支持共享/私人相册、上传备注、智能发图
(function() {
    'use strict';

    // ===== 分类常量 =====
    const PA_CATEGORIES = [
        { key: 'all', label: '全部', icon: 'fa-th' },
        { key: 'life', label: '生活', icon: 'fa-coffee' },
        { key: 'selfie', label: '自拍', icon: 'fa-camera' },
        { key: 'outfit', label: '穿搭', icon: 'fa-tshirt' },
        { key: 'sticker', label: '贴贴', icon: 'fa-heart' },
        { key: 'highlight', label: '高光', icon: 'fa-star' },
        { key: 'food', label: '美食', icon: 'fa-utensils' },
        { key: 'travel', label: '旅行', icon: 'fa-plane' },
        { key: 'custom', label: '自定义', icon: 'fa-tag' }
    ];

    // 智能发图：分类 → 聊天触发关键词
    const PA_CHAT_TRIGGERS = {
        life: ['日常','今天','干嘛','无聊','在干什么'],
        selfie: ['想你','撒娇','看看你','自拍','照片'],
        outfit: ['穿','衣服','约会','出门','好看'],
        food: ['吃','饿','美食','好吃','晚饭','午饭'],
        travel: ['旅行','出去玩','风景','去哪'],
        sticker: ['抱抱','亲亲','贴贴','摸摸'],
        highlight: ['开心','纪念','回忆','那天']
    };

    // ===== 状态 =====
    let paView = 'contacts'; // contacts | albums | photos
    let paContactId = null;
    let paAlbumId = null;
    let paCategoryFilter = 'all';
    let paPreviewIdx = -1;

    // ===== 数据初始化 =====
    function ensureData() {
        if (!store.photoAlbum) store.photoAlbum = {};
        if (!store.photoAlbum.contacts) store.photoAlbum.contacts = {};
    }

    function getContactAlbums(contactId) {
        ensureData();
        if (!store.photoAlbum.contacts[contactId]) {
            store.photoAlbum.contacts[contactId] = { albums: [] };
        }
        return store.photoAlbum.contacts[contactId].albums;
    }

    function getAlbum(contactId, albumId) {
        return getContactAlbums(contactId).find(a => a.id === albumId);
    }

    function getContactObj(contactId) {
        return (store.contacts || []).find(c => c.id === contactId);
    }

    function getContactAvatar(c) {
        return c?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent((c?.name||'?')[0])}&background=random`;
    }

    // ===== 打开相册系统 =====
    function openPhotoAlbum(contactId) {
        ensureData();
        if (contactId) {
            paContactId = contactId;
            paView = 'albums';
        } else {
            paView = 'contacts';
            paContactId = null;
        }
        paAlbumId = null;
        paCategoryFilter = 'all';
        paPreviewIdx = -1;
        render();
        document.getElementById('layer-photo-album').classList.add('show');
    }
    window.openPhotoAlbum = openPhotoAlbum;

    function closePhotoAlbum() {
        document.getElementById('layer-photo-album').classList.remove('show');
    }
    window.closePhotoAlbum = closePhotoAlbum;

    // ===== 导航 =====
    function goBack() {
        if (paView === 'photos') { paView = 'albums'; paAlbumId = null; paPreviewIdx = -1; }
        else if (paView === 'albums') { paView = 'contacts'; paContactId = null; }
        else { closePhotoAlbum(); return; }
        render();
    }
    window._paGoBack = goBack;

    // ===== 渲染主入口 =====
    function render() {
        const el = document.getElementById('pa-main-content');
        if (!el) return;
        ensureData();
        let navTitle = '我的相册';
        let navAction = '';
        let html = '';

        switch (paView) {
            case 'contacts':
                html = renderContacts();
                break;
            case 'albums':
                const c = getContactObj(paContactId);
                navTitle = (c?.remark || c?.name || '相册');
                navAction = `<span onclick="window._paCreateAlbum()"><i class="fas fa-plus"></i></span>`;
                html = renderAlbums();
                break;
            case 'photos':
                const album = getAlbum(paContactId, paAlbumId);
                navTitle = album?.name || '相册';
                html = renderPhotos();
                break;
        }

        document.getElementById('pa-nav-title').textContent = navTitle;
        document.getElementById('pa-nav-action').innerHTML = navAction;
        el.innerHTML = html;
    }

    // ===== 第1层：联系人列表 =====
    function renderContacts() {
        const contacts = (store.contacts || []).filter(c => !c.isGroup);
        if (contacts.length === 0) {
            return `<div class="pa-empty-hint"><i class="fas fa-images"></i>还没有联系人<br>添加联系人后即可创建相册</div>`;
        }

        // 统计每个联系人的相册数和照片数
        let cards = '';
        contacts.forEach(c => {
            const albums = getContactAlbums(c.id);
            const photoCount = albums.reduce((sum, a) => sum + (a.photos?.length || 0), 0);
            if (albums.length === 0 && photoCount === 0) {
                // 也显示没有相册的联系人，方便创建
            }
            cards += `<div class="pa-contact-card" onclick="window._paOpenContact('${c.id}')">
                <img class="pa-contact-avatar" src="${getContactAvatar(c)}" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent((c.name||'?')[0])}&background=random'">
                <div class="pa-contact-info">
                    <div class="pa-contact-name">${typeof escapeHtml==='function'?escapeHtml(c.remark||c.name):c.remark||c.name}</div>
                    <div class="pa-contact-stat">${albums.length}个相册 · ${photoCount}张照片</div>
                </div>
                <i class="fas fa-chevron-right pa-contact-arrow"></i>
            </div>`;
        });

        return `<div class="pa-contact-list">
            <div class="pa-section-title">选择联系人查看相册</div>
            ${cards}
        </div>`;
    }

    window._paOpenContact = function(contactId) {
        paContactId = contactId;
        paView = 'albums';
        paCategoryFilter = 'all';
        render();
    };

    // ===== 第2层：相册列表 =====
    function renderAlbums() {
        const c = getContactObj(paContactId);
        const albums = getContactAlbums(paContactId);
        const filtered = paCategoryFilter === 'all' ? albums : albums.filter(a => a.category === paCategoryFilter);

        let headerHtml = `<div class="pa-albums-header">
            <img class="pa-albums-avatar" src="${getContactAvatar(c)}" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent((c?.name||'?')[0])}&background=random'">
            <div>
                <div class="pa-albums-name">${typeof escapeHtml==='function'?escapeHtml(c?.remark||c?.name||''):c?.remark||c?.name||''}</div>
                <div class="pa-albums-count">${albums.length}个相册 · ${albums.reduce((s,a)=>s+(a.photos?.length||0),0)}张照片</div>
            </div>
        </div>`;

        // 分类标签栏
        let tagBar = '<div class="pa-tag-bar">';
        PA_CATEGORIES.forEach(cat => {
            if (cat.key === 'custom') return;
            tagBar += `<div class="pa-tag ${paCategoryFilter===cat.key?'active':''}" onclick="window._paFilterCat('${cat.key}')"><i class="fas ${cat.icon}"></i> ${cat.label}</div>`;
        });
        tagBar += '</div>';

        // 相册网格
        let grid = '<div class="pa-album-grid">';
        filtered.forEach(album => {
            const cover = album.photos?.length > 0 ? `<img src="${album.photos[0].src}" loading="lazy">` : `<div class="pa-cover-placeholder"><i class="fas fa-images"></i></div>`;
            const badge = album.type === 'shared' ? '<div class="pa-album-badge pa-badge-shared">共享</div>' : '<div class="pa-album-badge pa-badge-private">私人</div>';
            grid += `<div class="pa-album-card" onclick="window._paOpenAlbum('${album.id}')">
                <div class="pa-album-cover">${cover}${badge}</div>
                <div class="pa-album-info">
                    <div class="pa-album-name">${typeof escapeHtml==='function'?escapeHtml(album.name):album.name}</div>
                    <div class="pa-album-meta"><span>${album.photos?.length||0}张</span><span>${PA_CATEGORIES.find(c=>c.key===album.category)?.label||album.category||''}</span></div>
                </div>
            </div>`;
        });
        // 添加相册卡片
        grid += `<div class="pa-add-album-card" onclick="window._paCreateAlbum()">
            <div class="pa-add-album-inner"><i class="fas fa-plus-circle"></i><div>创建相册</div></div>
        </div>`;
        grid += '</div>';

        return headerHtml + tagBar + grid;
    }

    window._paFilterCat = function(cat) { paCategoryFilter = cat; render(); };

    window._paOpenAlbum = function(albumId) {
        paAlbumId = albumId;
        paView = 'photos';
        paPreviewIdx = -1;
        render();
    };

    // ===== 第3层：照片列表 =====
    function renderPhotos() {
        const album = getAlbum(paContactId, paAlbumId);
        if (!album) return '<div class="pa-empty-hint">相册不存在</div>';
        const photos = album.photos || [];

        let grid = '';
        if (photos.length === 0) {
            grid = '<div class="pa-empty-hint"><i class="fas fa-camera-retro"></i>还没有照片<br>点击下方按钮上传</div>';
        } else {
            grid = '<div class="pa-photo-grid">';
            photos.forEach((ph, idx) => {
                const ownerTag = ph.owner === 'user' ? '我' : (getContactObj(paContactId)?.remark || getContactObj(paContactId)?.name || 'TA');
                grid += `<div class="pa-photo-item" onclick="window._paPreview(${idx})">
                    <img src="${ph.src}" loading="lazy">
                    <div class="pa-photo-owner-tag">${ownerTag}</div>
                    ${ph.caption ? '<div class="pa-photo-caption-dot"></div>' : ''}
                </div>`;
            });
            grid += '</div>';
        }

        // 相册信息头
        const typeBadge = album.type === 'shared' ? '🤝 共享相册' : '🔒 私人相册';
        const catLabel = PA_CATEGORIES.find(c => c.key === album.category)?.label || '';
        let header = `<div style="padding:12px 16px;background:#fff;margin:12px;border-radius:12px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div><span style="font-size:15px;font-weight:600;">${typeof escapeHtml==='function'?escapeHtml(album.name):album.name}</span>
                <span style="font-size:12px;color:#999;margin-left:8px;">${catLabel}</span></div>
                <span style="font-size:12px;color:#576b95;">${typeBadge}</span>
            </div>
            <div style="font-size:12px;color:#999;margin-top:4px;">${photos.length}张照片</div>
            <div style="display:flex;gap:8px;margin-top:10px;">
                <span style="font-size:12px;color:#576b95;cursor:pointer;" onclick="window._paEditAlbum()"><i class="fas fa-edit"></i> 编辑</span>
                <span style="font-size:12px;color:#fa5151;cursor:pointer;" onclick="window._paDeleteAlbum()"><i class="fas fa-trash"></i> 删除相册</span>
            </div>
        </div>`;

        // 上传栏
        const c = getContactObj(paContactId);
        const cName = c?.remark || c?.name || 'TA';
        let uploadBar = `<div class="pa-upload-bar">
            <button class="pa-upload-btn pa-upload-btn-user" onclick="window._paUploadPhoto('user')"><i class="fas fa-upload"></i> 我的照片</button>
            ${album.type === 'shared' ? `<button class="pa-upload-btn pa-upload-btn-contact" onclick="window._paUploadPhoto('contact')"><i class="fas fa-upload"></i> ${typeof escapeHtml==='function'?escapeHtml(cName):cName}的照片</button>` : ''}
        </div>`;

        // 预览弹窗
        let preview = '';
        if (paPreviewIdx >= 0 && paPreviewIdx < photos.length) {
            const ph = photos[paPreviewIdx];
            const ownerName = ph.owner === 'user' ? (store.userName || '我') : cName;
            preview = `<div class="pa-preview-overlay" onclick="window._paClosePreview()">
                <div class="pa-preview-close" onclick="window._paClosePreview()"><i class="fas fa-times"></i></div>
                <img class="pa-preview-img" src="${ph.src}" onclick="event.stopPropagation()">
                ${ph.caption ? `<div class="pa-preview-caption">${typeof escapeHtml==='function'?escapeHtml(ph.caption):ph.caption}</div>` : ''}
                <div class="pa-preview-owner">上传者: ${ownerName} · ${ph.time ? new Date(ph.time).toLocaleDateString('zh-CN') : ''}</div>
                <div class="pa-preview-actions" onclick="event.stopPropagation()">
                    <div class="pa-preview-action" onclick="window._paEditCaption(${paPreviewIdx})"><i class="fas fa-pen"></i> 备注</div>
                    <div class="pa-preview-action" onclick="window._paToggleChat(${paPreviewIdx})"><i class="fas fa-comment-dots"></i> ${ph.usableInChat?'取消聊天可用':'设为聊天可用'}</div>
                    <div class="pa-preview-action" onclick="window._paDeletePhoto(${paPreviewIdx})"><i class="fas fa-trash"></i> 删除</div>
                </div>
            </div>`;
        }

        return header + grid + uploadBar + preview;
    }

    // ===== 预览 =====
    window._paPreview = function(idx) { paPreviewIdx = idx; render(); };
    window._paClosePreview = function() { paPreviewIdx = -1; render(); };

    // ===== 创建相册 =====
    window._paCreateAlbum = function() {
        if (!paContactId) return;
        const c = getContactObj(paContactId);
        const cName = c?.remark || c?.name || 'TA';

        let catOptions = '';
        PA_CATEGORIES.forEach(cat => {
            if (cat.key === 'all') return;
            catOptions += `<div class="pa-modal-tag" data-cat="${cat.key}" onclick="this.parentElement.querySelectorAll('.pa-modal-tag').forEach(t=>t.classList.remove('selected'));this.classList.add('selected')"><i class="fas ${cat.icon}"></i> ${cat.label}</div>`;
        });

        const modal = document.createElement('div');
        modal.className = 'pa-modal-overlay';
        modal.innerHTML = `<div class="pa-modal">
            <div class="pa-modal-title">创建新相册</div>
            <div class="pa-modal-field">
                <label class="pa-modal-label">相册名称</label>
                <input class="pa-modal-input" id="pa-new-name" placeholder="给相册起个名字" maxlength="20">
            </div>
            <div class="pa-modal-field">
                <label class="pa-modal-label">相册类型</label>
                <select class="pa-modal-select" id="pa-new-type">
                    <option value="shared">🤝 共享相册（你和${typeof escapeHtml==='function'?escapeHtml(cName):cName}都能传）</option>
                    <option value="private">🔒 私人相册（只有你能传）</option>
                </select>
            </div>
            <div class="pa-modal-field">
                <label class="pa-modal-label">分类标签</label>
                <div class="pa-modal-tags" id="pa-new-cat">${catOptions}</div>
            </div>
            <div class="pa-modal-btns">
                <button class="pa-modal-btn pa-modal-btn-cancel" onclick="this.closest('.pa-modal-overlay').remove()">取消</button>
                <button class="pa-modal-btn pa-modal-btn-ok" onclick="window._paDoCreateAlbum()">创建</button>
            </div>
        </div>`;
        document.getElementById('layer-photo-album').appendChild(modal);
    };

    window._paDoCreateAlbum = function() {
        const name = (document.getElementById('pa-new-name')?.value || '').trim();
        if (!name) { if(typeof toast==='function') toast('请输入相册名称'); return; }
        const type = document.getElementById('pa-new-type')?.value || 'shared';
        const catEl = document.querySelector('#pa-new-cat .pa-modal-tag.selected');
        const category = catEl?.dataset?.cat || 'life';

        const albums = getContactAlbums(paContactId);
        albums.push({
            id: 'album_' + Date.now(),
            name: name,
            type: type,
            category: category,
            photos: [],
            createdAt: Date.now()
        });
        if (typeof save === 'function') save();
        document.querySelector('.pa-modal-overlay')?.remove();
        render();
        if (typeof toast === 'function') toast('相册已创建');
    };

    // ===== 编辑相册 =====
    window._paEditAlbum = function() {
        const album = getAlbum(paContactId, paAlbumId);
        if (!album) return;
        if (typeof showPromptModal === 'function') {
            showPromptModal('修改相册名称:', album.name).then(function(v) {
                if (v !== null && v !== undefined) {
                    album.name = v.trim() || album.name;
                    if (typeof save === 'function') save();
                    render();
                }
            });
        }
    };

    // ===== 删除相册 =====
    window._paDeleteAlbum = function() {
        if (typeof showConfirm === 'function') {
            showConfirm('删除相册', '确定删除这个相册及所有照片吗？此操作不可恢复。', function() {
                const albums = getContactAlbums(paContactId);
                const idx = albums.findIndex(a => a.id === paAlbumId);
                if (idx >= 0) albums.splice(idx, 1);
                paAlbumId = null;
                paView = 'albums';
                if (typeof save === 'function') save();
                render();
                if (typeof toast === 'function') toast('相册已删除');
            });
        }
    };

    // ===== 上传照片 =====
    window._paUploadPhoto = function(owner) {
        const input = document.createElement('input');
        input.type = 'file'; input.accept = 'image/*'; input.multiple = true;
        input.onchange = function() {
            const files = Array.from(this.files);
            if (files.length === 0) return;
            let loaded = 0;
            files.forEach(file => {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const album = getAlbum(paContactId, paAlbumId);
                    if (!album) return;
                    if (!album.photos) album.photos = [];
                    // 先添加照片，再弹备注框
                    const photoObj = {
                        id: 'ph_' + Date.now() + '_' + Math.random().toString(36).slice(2,6),
                        src: e.target.result,
                        owner: owner,
                        caption: '',
                        time: Date.now(),
                        usableInChat: owner === 'contact' // 联系人的照片默认可在聊天中使用
                    };
                    album.photos.push(photoObj);
                    loaded++;
                    if (loaded === files.length) {
                        if (typeof save === 'function') save();
                        render();
                        if (typeof toast === 'function') toast(`已添加${files.length}张照片`);
                        // 弹出备注输入（仅最后一张）
                        setTimeout(() => window._paEditCaption(album.photos.length - 1), 300);
                    }
                };
                reader.readAsDataURL(file);
            });
        };
        input.click();
    };

    // ===== 编辑备注 =====
    window._paEditCaption = function(idx) {
        const album = getAlbum(paContactId, paAlbumId);
        if (!album || !album.photos[idx]) return;
        const ph = album.photos[idx];

        const modal = document.createElement('div');
        modal.className = 'pa-modal-overlay';
        modal.innerHTML = `<div class="pa-modal pa-caption-modal">
            <div class="pa-modal-title">照片备注</div>
            <textarea class="pa-caption-textarea" id="pa-caption-input" placeholder="写点什么...">${ph.caption || ''}</textarea>
            <div class="pa-chat-toggle">
                <input type="checkbox" id="pa-chat-check" ${ph.usableInChat ? 'checked' : ''}>
                <label for="pa-chat-check">允许在聊天中随机发送此照片</label>
            </div>
            <div class="pa-modal-btns">
                <button class="pa-modal-btn pa-modal-btn-cancel" onclick="this.closest('.pa-modal-overlay').remove()">取消</button>
                <button class="pa-modal-btn pa-modal-btn-ok" onclick="window._paSaveCaption(${idx})">保存</button>
            </div>
        </div>`;
        document.getElementById('layer-photo-album').appendChild(modal);
    };

    window._paSaveCaption = function(idx) {
        const album = getAlbum(paContactId, paAlbumId);
        if (!album || !album.photos[idx]) return;
        album.photos[idx].caption = (document.getElementById('pa-caption-input')?.value || '').trim();
        album.photos[idx].usableInChat = !!document.getElementById('pa-chat-check')?.checked;
        if (typeof save === 'function') save();
        document.querySelector('.pa-modal-overlay')?.remove();
        render();
        if (typeof toast === 'function') toast('已保存');
    };

    // ===== 切换聊天可用 =====
    window._paToggleChat = function(idx) {
        const album = getAlbum(paContactId, paAlbumId);
        if (!album || !album.photos[idx]) return;
        album.photos[idx].usableInChat = !album.photos[idx].usableInChat;
        if (typeof save === 'function') save();
        render();
        if (typeof toast === 'function') toast(album.photos[idx].usableInChat ? '已设为聊天可用' : '已取消聊天可用');
    };

    // ===== 删除照片 =====
    window._paDeletePhoto = function(idx) {
        if (typeof showConfirm === 'function') {
            showConfirm('删除照片', '确定删除这张照片吗？', function() {
                const album = getAlbum(paContactId, paAlbumId);
                if (!album) return;
                album.photos.splice(idx, 1);
                paPreviewIdx = -1;
                if (typeof save === 'function') save();
                render();
                if (typeof toast === 'function') toast('已删除');
            });
        }
    };

    // ===== 智能发图：根据聊天内容从相册中选取照片 =====
    // 供聊天系统调用：window.getAlbumPhotoForChat(contactId, messageText)
    // 返回 { src, caption } 或 null
    window.getAlbumPhotoForChat = function(contactId, messageText) {
        ensureData();
        const contactData = store.photoAlbum?.contacts?.[contactId];
        if (!contactData) return null;

        // 收集所有标记为"聊天可用"且owner为contact的照片
        let candidates = [];
        (contactData.albums || []).forEach(album => {
            (album.photos || []).forEach(ph => {
                if (ph.usableInChat && ph.owner === 'contact') {
                    candidates.push({ ...ph, albumCategory: album.category });
                }
            });
        });
        if (candidates.length === 0) return null;

        // 根据消息内容匹配分类
        const msg = (messageText || '').toLowerCase();
        let matched = [];
        for (const [cat, keywords] of Object.entries(PA_CHAT_TRIGGERS)) {
            if (keywords.some(kw => msg.includes(kw))) {
                const catPhotos = candidates.filter(p => p.albumCategory === cat);
                matched.push(...catPhotos);
            }
        }

        // 如果没有匹配到特定分类，随机从所有可用照片中选
        const pool = matched.length > 0 ? matched : candidates;
        // 随机概率触发（不是每次都发）
        if (Math.random() > 0.15) return null; // 15%概率触发
        const pick = pool[Math.floor(Math.random() * pool.length)];
        return pick ? { src: pick.src, caption: pick.caption || '' } : null;
    };

    // ===== 从联系人主页打开相册 =====
    window.openContactPhotoAlbum = function(contactId) {
        openPhotoAlbum(contactId);
    };

})();
