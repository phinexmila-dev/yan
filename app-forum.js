        // ==========================================
        // --- FORUM MODULE (论坛) ---
        // ==========================================
        let activeForumPostId = null;
        let forumFeedTab = 0; // 0=推荐, 1=关注, 2=发现
        let activeRepostPostId = null;
        let forumSearchQuery = ''; // 当前搜索关键词
        let forumSearchResults = []; // 搜索结果
        let forumSearching = false; // 是否正在搜索
        let forumTrendingData = null; // 热搜数据缓存
        let forumTrendingLoading = false; // 热搜加载中

        // ===== 论坛统一面板 开关函数 =====
        function _toggleUnifiedPanel(maskId) {
            const mask = document.getElementById(maskId);
            if (mask.classList.contains('show')) {
                _closeUnifiedPanel(maskId);
            } else {
                mask.classList.add('show');
            }
        }
        function _closeUnifiedPanel(maskId) {
            const mask = document.getElementById(maskId);
            const panel = mask.querySelector('.unified-panel');
            panel.classList.add('closing');
            setTimeout(() => { mask.classList.remove('show'); panel.classList.remove('closing'); }, 200);
        }
        function toggleForumHomePanel() { _toggleUnifiedPanel('forum-home-panel-mask'); }
        function closeForumHomePanel() { _closeUnifiedPanel('forum-home-panel-mask'); }
        function toggleForumMePanel() { _toggleUnifiedPanel('forum-me-panel-mask'); }
        function closeForumMePanel() { _closeUnifiedPanel('forum-me-panel-mask'); }

        // ========== FORUM API LAYER ==========
        const ForumAPI = {
            // ---- Multi-Account (小号) ----
            getAccounts() {
                if (!store.forumAccounts) store.forumAccounts = [];
                return store.forumAccounts;
            },
            getCurrentAccountId() { return store.currentForumAccountId || null; },
            getCurrentAccount() {
                const id = this.getCurrentAccountId();
                if (!id) return null;
                return this.getAccounts().find(a => a.id === id) || null;
            },
            switchAccount(id) {
                if (id === null) {
                    store.currentForumAccountId = null;
                } else {
                    const acc = this.getAccounts().find(a => a.id === id);
                    if (!acc) return false;
                    store.currentForumAccountId = id;
                }
                save();
                return true;
            },
            addAccount(acc) {
                if (!store.forumAccounts) store.forumAccounts = [];
                store.forumAccounts.push(acc);
                save();
            },
            updateAccount(id, data) {
                const acc = this.getAccounts().find(a => a.id === id);
                if (acc) { Object.assign(acc, data); save(); }
            },
            deleteAccount(id) {
                store.forumAccounts = this.getAccounts().filter(a => a.id !== id);
                if (store.currentForumAccountId === id) store.currentForumAccountId = null;
                // Remove posts by this account
                store.forumPosts = (store.forumPosts || []).filter(p => p.accountId !== id);
                save();
            },
            // Posts
            getPosts() { return store.forumPosts || []; },
            getPost(id) { return this.getPosts().find(p => p.id === id); },
            getMyPosts() {
                const accId = this.getCurrentAccountId();
                return this.getPosts().filter(p => {
                    if (accId) return p.accountId === accId;
                    return p.isMe && !p.accountId;
                }).sort((a, b) => b.time - a.time);
            },
            getAllMyPosts() { return this.getPosts().filter(p => p.isMe).sort((a, b) => b.time - a.time); },
            getStarredPosts() { return this.getPosts().filter(p => (p.stars || []).includes(this._meId())).sort((a, b) => b.time - a.time); },
            addPost(post) {
                if (!store.forumPosts) store.forumPosts = [];
                const accId = this.getCurrentAccountId();
                if (accId) post.accountId = accId;
                store.forumPosts.push(post);
                save();
            },
            deletePost(id) {
                const idx = this.getPosts().findIndex(p => p.id === id);
                if (idx > -1) { store.forumPosts.splice(idx, 1); save(); return true; }
                return false;
            },
            // Profile (account-aware)
            getProfile() {
                const acc = this.getCurrentAccount();
                if (acc) return acc.profile || (acc.profile = {});
                if (!store.forumProfile) store.forumProfile = {};
                return store.forumProfile;
            },
            saveProfile(data) { Object.assign(this.getProfile(), data); save(); },
            // 获取关联联系人绑定的用户人设
            getLinkedUserPersona() {
                const settings = this.getSettings();
                const linkedIds = settings.linkedContacts || [];
                if (linkedIds.length === 0) return null;
                // 取第一个关联联系人的用户人设
                for (const cid of linkedIds) {
                    const contact = (store.contacts || []).find(c => c.id === cid);
                    if (contact && contact.settings && contact.settings.userPersona) {
                        const persona = (store.personas || []).find(p => p.id === contact.settings.userPersona);
                        if (persona) return persona;
                    }
                }
                return null;
            },
            getDisplayName() {
                const acc = this.getCurrentAccount();
                if (acc) return acc.name || store.user?.name || '用户';
                // 优先从关联联系人的用户人设获取名字
                const linkedPersona = this.getLinkedUserPersona();
                if (linkedPersona && linkedPersona.name) return linkedPersona.name;
                return this.getProfile().name || store.user?.name || '用户';
            },
            getDisplayAvatar() {
                const acc = this.getCurrentAccount();
                if (acc) return acc.avatar || _ph(36);
                // 优先从关联联系人的用户人设获取头像
                const linkedPersona = this.getLinkedUserPersona();
                if (linkedPersona && linkedPersona.avatar) return linkedPersona.avatar;
                return this.getProfile().avatar || store.user?.avatar || _ph(36);
            },
            // 获取用户人设描述（用于AI prompt）
            getUserPersonaDesc() {
                const linkedPersona = this.getLinkedUserPersona();
                if (linkedPersona && linkedPersona.desc) return linkedPersona.desc;
                return '';
            },
            isAltAccount() { return !!this.getCurrentAccountId(); },
            // Following (per-account)
            _getFollowingKey() {
                const accId = this.getCurrentAccountId();
                return accId ? 'forumFollowing_' + accId : 'forumFollowing';
            },
            _meId() {
                const accId = this.getCurrentAccountId();
                return accId ? 'me_' + accId : 'me';
            },
            getFollowing() {
                const key = this._getFollowingKey();
                return store[key] || [];
            },
            isFollowing(name) { return this.getFollowing().includes(name); },
            toggleFollow(name) {
                const key = this._getFollowingKey();
                if (!store[key]) store[key] = [];
                const idx = store[key].indexOf(name);
                if (idx > -1) { store[key].splice(idx, 1); save(); return false; }
                store[key].push(name); save(); return true;
            },
            // Notifications
            getNotifs(type) {
                const all = store.forumNotifs || [];
                const currentAccountId = this.getCurrentAccountId();
                const filtered = all.filter(n => {
                    if (currentAccountId) return n.accountId === currentAccountId;
                    return !n.accountId;
                });
                return type ? filtered.filter(n => n.type === type) : filtered;
            },
            getUnreadCount() {
                const currentAccountId = this.getCurrentAccountId();
                return (store.forumNotifs || []).filter(n => {
                    if (currentAccountId) return n.accountId === currentAccountId && !n.read;
                    return !n.accountId && !n.read;
                }).length;
            },
            addNotif(notif) {
                if (!store.forumNotifs) store.forumNotifs = [];
                store.forumNotifs.unshift(notif);
                save();
            },
            // DMs
            getDMs() { return store.forumDMs || {}; },
            getDM(id) { return (store.forumDMs || {})[id]; },
            ensureDM(key, name, avatar) {
                if (!store.forumDMs) store.forumDMs = {};
                if (!store.forumDMs[key]) {
                    const accountId = this.getCurrentAccountId();
                    store.forumDMs[key] = { name, avatar, msgs: [], accountId: accountId || null };
                }
                return store.forumDMs[key];
            },
            getDMUnreadCount() {
                const currentAccountId = this.getCurrentAccountId();
                return Object.values(store.forumDMs || {}).filter(dm => {
                    if (currentAccountId) return dm.accountId === currentAccountId;
                    return !dm.accountId;
                }).reduce((sum, dm) =>
                    sum + (dm.msgs || []).filter(m => !m.read && !m.isMe).length, 0);
            },
            // Settings
            getSettings() {
                if (!store.forumSettings) store.forumSettings = { linkedContacts: [], linkedWorldbooks: [] };
                return store.forumSettings;
            },
            saveSettings(linkedContacts, linkedWorldbooks) {
                const s = this.getSettings();
                s.linkedContacts = linkedContacts;
                s.linkedWorldbooks = linkedWorldbooks;
                save();
            },
            // DM helper
            addDM(name, avatar, text) {
                const accountId = this.getCurrentAccountId();
                const key = accountId ? 'dm_' + name + '_' + accountId : 'dm_' + name;
                const dm = this.ensureDM(key, name, avatar);
                dm.msgs.push({ text, time: Date.now(), isMe: false, read: false });
                save();
            },
            // My comments across all posts
            getMyComments() {
                const myName = this.getDisplayName();
                const allComments = [];
                this.getPosts().forEach(p => {
                    (p.comments || []).forEach(c => {
                        if (c.name === myName) {
                            allComments.push({ ...c, postTitle: p.title, postId: p.id });
                        }
                    });
                });
                return allComments.sort((a, b) => b.time - a.time);
            },
            // Toggle like on a post
            toggleLike(postId) {
                const post = this.getPost(postId);
                if (!post) return;
                if (!post.likes) post.likes = [];
                const meId = this._meId();
                const idx = post.likes.indexOf(meId);
                if (idx > -1) post.likes.splice(idx, 1);
                else post.likes.push(meId);
                save();
            },
            // Toggle star/bookmark on a post
            toggleStar(postId) {
                const post = this.getPost(postId);
                if (!post) return false;
                if (!post.stars) post.stars = [];
                const meId = this._meId();
                const idx = post.stars.indexOf(meId);
                if (idx > -1) {
                    post.stars.splice(idx, 1);
                    save();
                    return false;
                } else {
                    post.stars.push(meId);
                    save();
                    return true;
                }
            },
            // Add a comment to a post
            addComment(postId, comment) {
                const post = this.getPost(postId);
                if (!post) return;
                if (!post.comments) post.comments = [];
                // 自动给评论加唯一id
                if (!comment.id) comment.id = 'c_' + Date.now() + '_' + Math.random().toString(36).slice(2,6);
                post.comments.push(comment);
                save();
            },
            // Delete own comment from a post
            deleteComment(postId, commentId) {
                const post = this.getPost(postId);
                if (!post || !post.comments) return false;
                const idx = post.comments.findIndex(c => c.id === commentId);
                if (idx === -1) return false;
                // 只能删除自己的评论（优先用accountId判断，兼容name判断）
                const myName = this.getDisplayName();
                const myAccountId = this.getCurrentAccountId();
                const comment = post.comments[idx];
                const isOwner = (myAccountId && comment.accountId === myAccountId) ||
                                (!myAccountId && comment.isMe) ||
                                comment.name === myName;
                if (!isOwner) return false;
                post.comments.splice(idx, 1);
                save();
                return true;
            },
            // Update a post's title/content
            updatePost(postId, data) {
                const post = this.getPost(postId);
                if (!post) return;
                if (data.title !== undefined) post.title = data.title;
                if (data.content !== undefined) post.content = data.content;
                save();
            },
            // Increment repost count
            addReposts(postId, count) {
                const post = this.getPost(postId);
                if (!post) return;
                if (!post.reposts) post.reposts = 0;
                post.reposts += count;
                save();
            },
            // Clear all forum data
            clearAll() {
                store.forumPosts = [];
                store.forumProfile = {};
                store.forumFollowing = [];
                store.forumNotifs = [];
                store.forumDMs = {};
                store.forumSettings = { linkedContacts: [], linkedWorldbooks: [] };
                save();
            },
            // Share/forward a post to contacts via chat
            shareToContacts(postId, contactIds) {
                const post = this.getPost(postId);
                if (!post || contactIds.length === 0) return 0;
                let sent = 0;
                contactIds.forEach(cid => {
                    const contact = (store.contacts || []).find(c => c.id === cid);
                    if (contact) {
                        if (!store.chats) store.chats = {};
                        if (!store.chats[contact.id]) store.chats[contact.id] = [];
                        store.chats[contact.id].push({
                            sender: 'me',
                            type: 'shared_post',
                            content: JSON.stringify({
                                postId: postId,
                                title: post.title,
                                text: (post.content || '').substring(0, 120),
                                author: post.author,
                                avatar: post.avatar
                            }),
                            time: Date.now()
                        });
                        sent++;
                    }
                });
                if (sent > 0) save();
                return sent;
            },
        };

        function renderForumPostCards(posts) {
            const _meId = ForumAPI._meId();
            return posts.map(p => {
                const isLiked = (p.likes || []).includes(_meId);
                const isStarred = (p.stars || []).includes(_meId);
                const likeCount = (p.likes || []).length;
                const commentCount = (p.comments || []).length;
                const timeStr = formatForumTime(p.time);
                // Section badge (only shown in "全部" view)
                let sectionBadge = '';
                if (!store.currentForumSectionId && p.sectionId) {
                    const sec = (store.forumSections || []).find(s => s.id === p.sectionId);
                    if (sec) {
                        sectionBadge = `<span onclick="event.stopPropagation(); switchForumSection('${sec.id}')" style="display:inline-block;padding:2px 8px;border-radius:10px;background:#f0f0f0;color:#666;font-size:11px;margin-bottom:5px;cursor:pointer;"><i class="fas fa-th-large" style="font-size:10px;margin-right:3px;"></i>${escapeHtml(sec.name)}</span>`;
                    }
                }
                return `
                    <div class="forum-post-card" onclick="openForumPost('${p.id}')">
                        <div class="forum-post-header">
                            <img src="${p.avatar || _ph(36)}" onclick="event.stopPropagation(); openForumUserProfile('${escapeHtml(p.author || '匿名')}', '${p.avatar || ''}')">
                            <div>
                                <div class="forum-post-author" onclick="event.stopPropagation(); openForumUserProfile('${escapeHtml(p.author || '匿名')}', '${p.avatar || ''}')">${escapeHtml(p.author || '匿名')}</div>
                                <div class="forum-post-time">${timeStr}</div>
                            </div>
                        </div>
                        ${sectionBadge}
                        <div class="forum-post-title">${escapeHtml(p.title)}</div>
                        <div class="forum-post-preview">${escapeHtml(p.content)}</div>
                        <div class="forum-post-footer">
                            <span class="${isLiked ? 'liked' : ''}" onclick="event.stopPropagation(); toggleForumLike('${p.id}')">
                                <i class="${isLiked ? 'fas' : 'far'} fa-heart"></i> ${likeCount || ''}
                            </span>
                            <span><i class="far fa-comment"></i> ${commentCount || ''}</span>
                            <span onclick="event.stopPropagation(); forumRepost('${p.id}')">
                                <i class="fas fa-retweet"></i> ${p.reposts || ''}
                            </span>
                            <span class="${isStarred ? 'starred' : ''}" onclick="event.stopPropagation(); toggleForumStar('${p.id}')">
                                <i class="${isStarred ? 'fas' : 'far'} fa-bookmark"></i>
                            </span>
                        </div>
                    </div>
                `;
            }).join('');
        }

        // ========== FORUM SECTION HELPERS ==========
        function getCurrentSection() {
            const sid = store.currentForumSectionId;
            if (!sid) return null;
            return (store.forumSections || []).find(s => s.id === sid) || null;
        }

        function getSectionEffectiveSettings(section) {
            // Merge section settings over global forumSettings
            const global = store.forumSettings || {};
            if (!section) return global;
            return {
                linkedContacts: (section.linkedContacts && section.linkedContacts.length > 0) ? section.linkedContacts : (global.linkedContacts || []),
                linkedWorldbooks: (section.linkedWorldbooks && section.linkedWorldbooks.length > 0) ? section.linkedWorldbooks : (global.linkedWorldbooks || []),
                customWorldview: section.worldview || global.customWorldview || '',
                customRules: section.rules || global.customRules || '',
                minChars: section.minChars || 0,
                maxChars: section.maxChars || 0,
            };
        }

        function renderForumSectionBar() {
            const bar = document.getElementById('forum-section-bar');
            if (!bar) return;
            const sections = store.forumSections || [];
            const currentId = store.currentForumSectionId;

            let html = `<div class="forum-section-tab ${!currentId ? 'active' : ''}" id="forum-section-tab-all" onclick="switchForumSection(null)" style="display:inline-flex;align-items:center;padding:6px 14px;margin:4px 3px;border-radius:20px;font-size:13px;cursor:pointer;white-space:nowrap;flex-shrink:0;background:${!currentId ? 'var(--primary)' : '#f0f0f0'};color:${!currentId ? '#fff' : '#555'};font-weight:${!currentId ? '500' : '400'};">全部</div>`;
            sections.forEach(s => {
                const isActive = currentId === s.id;
                html += `<div class="forum-section-tab ${isActive ? 'active' : ''}" onclick="switchForumSection('${s.id}')" style="display:inline-flex;align-items:center;padding:6px 14px;margin:4px 3px;border-radius:20px;font-size:13px;cursor:pointer;white-space:nowrap;flex-shrink:0;background:${isActive ? 'var(--primary)' : '#f0f0f0'};color:${isActive ? '#fff' : '#555'};font-weight:${isActive ? '500' : '400'};">${escapeHtml(s.name)}</div>`;
            });
            bar.innerHTML = html;
        }

        function switchForumSection(sectionId) {
            store.currentForumSectionId = sectionId || null;
            // Update nav title
            const titleEl = document.getElementById('forum-home-title');
            if (titleEl) {
                if (!sectionId) {
                    titleEl.textContent = '广场';
                } else {
                    const sec = (store.forumSections || []).find(s => s.id === sectionId);
                    titleEl.textContent = sec ? sec.name : '广场';
                }
            }
            renderForumSectionBar();
            renderForum();
        }

        function renderForum() {
            const container = document.getElementById('forum-home-feed');
            if (!container) return;
            let posts = ForumAPI.getPosts();

            // Deduplicate by post id
            const seenIds = new Set();
            posts = posts.filter(p => {
                if (seenIds.has(p.id)) return false;
                seenIds.add(p.id);
                return true;
            });

            // Section filter
            const currentSectionId = store.currentForumSectionId;
            if (currentSectionId) {
                posts = posts.filter(p => p.sectionId === currentSectionId);
            }

            // Feed tab filtering
            const following = ForumAPI.getFollowing();
            if (forumFeedTab === 1) {
                posts = posts.filter(p => p.isMe || following.includes(p.author));
            } else if (forumFeedTab === 2) {
                // 发现 tab: 显示搜索框 + 热搜 + 推荐关注
                renderDiscoverTab(container);
                return;
            }
            // forumFeedTab === 0: 推荐 = show all

            if (posts.length === 0) {
                const emptyMsg = forumFeedTab === 1 ? '还没有关注任何人，去发现页关注吧' : '暂无帖子，点击刷新获取动态';
                container.innerHTML = `<div class="forum-empty" style="text-align:center; padding:60px 20px; color:#bbb;">
                    <i class="fas fa-compass" style="font-size:48px; margin-bottom:12px;"></i>
                    <div>${emptyMsg}</div>
                </div>`;
                return;
            }

            const sorted = [...posts].sort((a, b) => b.time - a.time);
            container.innerHTML = renderForumPostCards(sorted);
        }

        // ========== 发现页渲染 ==========
        function renderDiscoverTab(container) {
            let html = '';
            // 搜索框
            html += `<div class="forum-search-box">
                <div class="forum-search-input-wrap">
                    <i class="fas fa-search"></i>
                    <input type="text" id="forum-search-input" placeholder="搜索帖子、话题、用户..."
                        value="${escapeHtml(forumSearchQuery)}"
                        onkeydown="if(event.key==='Enter') forumDoSearch()"
                        oninput="forumSearchQuery=this.value">
                    ${forumSearchQuery ? '<i class="fas fa-times forum-search-clear" onclick="forumClearSearch()"></i>' : ''}
                </div>
                <button class="forum-search-btn" onclick="forumDoSearch()">搜索</button>
            </div>`;

            // 如果正在搜索或有搜索结果，显示搜索结果
            if (forumSearching) {
                html += `<div class="forum-search-loading">
                    <i class="fas fa-spinner fa-spin"></i> 正在搜索...
                </div>`;
                container.innerHTML = html;
                return;
            }

            if (forumSearchQuery && forumSearchResults.length > 0) {
                html += `<div class="forum-search-result-header">
                    <span>搜索结果 "${escapeHtml(forumSearchQuery)}" (${forumSearchResults.length}条)</span>
                    <span class="forum-search-back" onclick="forumClearSearch()"><i class="fas fa-arrow-left"></i> 返回发现</span>
                </div>`;
                html += renderForumPostCards(forumSearchResults);
                container.innerHTML = html;
                return;
            }

            if (forumSearchQuery && forumSearchResults.length === 0 && !forumSearching) {
                // 搜索过但没结果
                if (forumSearchQuery.trim()) {
                    html += `<div class="forum-search-result-header">
                        <span>搜索结果 "${escapeHtml(forumSearchQuery)}"</span>
                        <span class="forum-search-back" onclick="forumClearSearch()"><i class="fas fa-arrow-left"></i> 返回发现</span>
                    </div>
                    <div class="forum-empty" style="text-align:center; padding:40px 20px; color:#bbb;">
                        <i class="fas fa-search" style="font-size:36px; margin-bottom:10px;"></i>
                        <div>未找到相关内容</div>
                    </div>`;
                    container.innerHTML = html;
                    return;
                }
            }

            // 热搜榜
            html += renderTrendingSection();

            // 推荐关注
            html += renderRecommendFollow();

            // 发现页帖子（NPC帖子）
            let discoverPosts = ForumAPI.getPosts().filter(p => !p.isMe && !p.isContact && !p.isContactAccount);
            // Deduplicate by post id
            const seenIds = new Set();
            discoverPosts = discoverPosts.filter(p => {
                if (seenIds.has(p.id)) return false;
                seenIds.add(p.id);
                return true;
            });
            if (discoverPosts.length > 0) {
                const sorted = [...discoverPosts].sort((a, b) => b.time - a.time).slice(0, 20);
                html += `<div class="forum-discover-section-title"><i class="fas fa-fire-alt"></i> 热门帖子</div>`;
                html += renderForumPostCards(sorted);
            }

            container.innerHTML = html;
        }

        // ========== 热搜榜渲染 ==========
        function renderTrendingSection() {
            const TRENDING_CATEGORIES = [
                { icon: 'fa-fire', color: '#ff4d6a', label: '热搜' },
                { icon: 'fa-bolt', color: '#f5a623', label: '热议' },
                { icon: 'fa-chart-line', color: '#4fc3f7', label: '飙升' },
                { icon: 'fa-star', color: '#ab47bc', label: '推荐' },
                { icon: 'fa-film', color: '#26a69a', label: '娱乐' },
                { icon: 'fa-gamepad', color: '#5c6bc0', label: '游戏' }
            ];

            if (!forumTrendingData) {
                return `<div class="forum-trending-section">
                    <div class="forum-trending-header">
                        <span><i class="fas fa-fire" style="color:#ff4d6a;"></i> 热搜榜</span>
                        <span class="forum-trending-refresh" onclick="forumLoadTrending()"><i class="fas fa-sync-alt"></i> 换一换</span>
                    </div>
                    <div class="forum-trending-placeholder" onclick="forumLoadTrending()">
                        <i class="fas fa-fire-alt" style="font-size:28px; color:#ddd; margin-bottom:8px;"></i>
                        <div>点击加载热搜</div>
                    </div>
                </div>`;
            }

            let html = `<div class="forum-trending-section">
                <div class="forum-trending-header">
                    <span><i class="fas fa-fire" style="color:#ff4d6a;"></i> 热搜榜</span>
                    <span class="forum-trending-refresh" onclick="forumLoadTrending()"><i class="fas fa-sync-alt"></i> 换一换</span>
                </div>
                <div class="forum-trending-list">`;

            forumTrendingData.forEach((item, idx) => {
                const cat = TRENDING_CATEGORIES[idx % TRENDING_CATEGORIES.length];
                const rankClass = idx < 3 ? 'forum-trending-top' : '';
                const hotNum = item.hot || (Math.floor(Math.random() * 900 + 100) + '万');
                html += `<div class="forum-trending-item" onclick="forumSearchFromTrending('${escapeHtml(item.title)}')">
                    <span class="forum-trending-rank ${rankClass}">${idx + 1}</span>
                    <div class="forum-trending-info">
                        <div class="forum-trending-title">${escapeHtml(item.title)}</div>
                        <div class="forum-trending-meta">
                            <span class="forum-trending-tag" style="color:${cat.color};"><i class="fas ${cat.icon}"></i> ${cat.label}</span>
                            <span class="forum-trending-hot">${hotNum}热度</span>
                        </div>
                    </div>
                </div>`;
            });

            html += `</div></div>`;
            return html;
        }

        // ========== 推荐关注渲染 ==========
        function renderRecommendFollow() {
            const allPosts = ForumAPI.getPosts();
            const following = ForumAPI.getFollowing();
            // 找出未关注的NPC作者
            const authorMap = {};
            allPosts.forEach(p => {
                if (!p.isMe && !p.isContact && !following.includes(p.author) && !authorMap[p.author]) {
                    authorMap[p.author] = { name: p.author, avatar: p.avatar, postCount: 0, likeCount: 0 };
                }
                if (authorMap[p.author]) {
                    authorMap[p.author].postCount++;
                    authorMap[p.author].likeCount += (p.likes || []).length;
                }
            });
            const authors = Object.values(authorMap).sort((a, b) => b.likeCount - a.likeCount).slice(0, 8);
            if (authors.length === 0) return '';

            let html = `<div class="forum-recommend-section">
                <div class="forum-recommend-header"><i class="fas fa-user-plus" style="color:var(--primary);"></i> 推荐关注</div>
                <div class="forum-recommend-scroll">`;
            authors.forEach(a => {
                html += `<div class="forum-recommend-card" onclick="toggleForumFollow('${escapeHtml(a.name)}')">
                    <img src="${a.avatar || _ph(48)}">
                    <div class="forum-recommend-name">${escapeHtml(a.name)}</div>
                    <div class="forum-recommend-stat">${a.likeCount}赞 · ${a.postCount}帖</div>
                    <button class="forum-recommend-btn"><i class="fas fa-plus"></i> 关注</button>
                </div>`;
            });
            html += `</div></div>`;
            return html;
        }

        // ========== 搜索功能 ==========
        async function forumDoSearch() {
            _currentApiScene = 'forum';
            const query = (document.getElementById('forum-search-input')?.value || '').trim();
            if (!query) return toast('请输入搜索内容');
            forumSearchQuery = query;
            forumSearching = true;
            forumSearchResults = [];
            renderForum();

            try {
                // 先本地搜索
                const allPosts = ForumAPI.getPosts();
                const localResults = allPosts.filter(p =>
                    (p.title && p.title.includes(query)) || (p.content && p.content.includes(query)) || (p.author && p.author.includes(query))
                );

                // 调用API生成更多相关帖子
                const batchPrompt = `你是社交论坛搜索引擎。用户搜索了"${query}"。请生成6条与搜索词相关的论坛帖子。帖子要自然真实，像真人发的。包含不同角度和观点。JSON输出：[{"title":"标题不超15字","content":"正文30-80字"}]`;
                const data = await API.chatCompletion([
                    { role: 'system', content: batchPrompt },
                    { role: 'user', content: `搜索：${query}` }
                ]);
                const replyText = data.choices[0].message.content.trim();
                const jsonMatch = replyText.match(/\[[\s\S]*\]/);
                let apiPosts = [];
                if (jsonMatch) {
                    const parsed = JSON.parse(jsonMatch[0]);
                    if (Array.isArray(parsed)) {
                        apiPosts = parsed.map((pd, i) => {
                            const npc = randomNPC();
                            const _title = (pd.title || '').substring(0, 30);
                            const _content = (pd.content || '').substring(0, 200);
                            const engagement = generateRealisticEngagement(_title, _content);
                            return {
                                id: 'fp_search_' + Date.now() + '_' + i,
                                title: _title,
                                content: _content,
                                author: npc.name,
                                avatar: npc.avatar,
                                time: Date.now() - Math.floor(Math.random() * 86400000),
                                likes: engagement.likes,
                                stars: [],
                                comments: engagement.comments,
                                reposts: engagement.reposts,
                                isMe: false,
                                isSearchResult: true
                            };
                        });
                        // 把搜索生成的帖子也加入论坛
                        apiPosts.forEach(p => ForumAPI.addPost(p));
                    }
                }

                forumSearchResults = [...localResults, ...apiPosts];
                // 按互动量排序
                forumSearchResults.sort((a, b) => ((b.likes||[]).length + (b.comments||[]).length) - ((a.likes||[]).length + (a.comments||[]).length));
            } catch (e) {
                console.warn('搜索API失败:', e);
                toast('网络异常，仅显示本地结果');
                // 回退到本地搜索
                forumSearchResults = ForumAPI.getPosts().filter(p =>
                    (p.title && p.title.includes(query)) || (p.content && p.content.includes(query))
                );
            }

            forumSearching = false;
            renderForum();
        }

        function forumClearSearch() {
            forumSearchQuery = '';
            forumSearchResults = [];
            forumSearching = false;
            renderForum();
        }

        function forumSearchFromTrending(keyword) {
            forumSearchQuery = keyword;
            const input = document.getElementById('forum-search-input');
            if (input) input.value = keyword;
            forumDoSearch();
        }

        // ========== 热搜加载 ==========
        async function forumLoadTrending() {
            if (forumTrendingLoading) return;
            forumTrendingLoading = true;
            toast('正在加载热搜...');

            try {
                const categories = ['社会热点', '娱乐八卦', '游戏电竞', '美食探店', '科技数码', '情感生活', '动漫二次元', '时尚穿搭'];
                const prompt = `你是社交媒体热搜榜生成器。请生成10条当前热搜话题，涵盖以下类别：${categories.join('、')}。
要求：话题要有趣、贴近年轻人生活、像真实热搜。每条附带热度数值。
JSON输出：[{"title":"热搜标题不超12字","hot":"xxx万"}]，共10条`;

                const data = await API.chatCompletion([
                    { role: 'system', content: prompt },
                    { role: 'user', content: '生成热搜榜' }
                ]);
                const replyText = data.choices[0].message.content.trim();
                const jsonMatch = replyText.match(/\[[\s\S]*\]/);
                if (jsonMatch) {
                    const parsed = JSON.parse(jsonMatch[0]);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        forumTrendingData = parsed.slice(0, 10);
                    }
                }
            } catch (e) {
                console.warn('热搜加载失败:', e);
                // 使用备用热搜数据
                forumTrendingData = [
                    { title: '年度最佳游戏揭晓', hot: '892万' },
                    { title: '某顶流官宣恋情', hot: '756万' },
                    { title: '打工人摸鱼神器', hot: '634万' },
                    { title: '这道菜火遍全网', hot: '521万' },
                    { title: '新番神作预定', hot: '487万' },
                    { title: '大学生整顿职场', hot: '423万' },
                    { title: '平价穿搭天花板', hot: '398万' },
                    { title: '深夜emo文学', hot: '356万' },
                    { title: '猫咪迷惑行为大赏', hot: '312万' },
                    { title: '手机摄影技巧分享', hot: '289万' }
                ];
            }

            forumTrendingLoading = false;
            renderForum();
        }

        // ========== 生成真实互动数据（混合低互动和高互动/爆款帖子） ==========
        function generateRealisticEngagement(title, content) {
            const roll = Math.random();
            let likeNames = [];
            let commentList = [];
            let reposts = 0;
            // 用于避免同一帖子下出现重复评论
            const usedComments = new Set();
            function getUniqueComment() {
                let tries = 0, text;
                do {
                    text = (title || content) ? generateContextualComment(title, content) : randomPick(FORUM_NPC_COMMENTS);
                    tries++;
                } while (usedComments.has(text) && tries < 8);
                usedComments.add(text);
                return text;
            }

            // 生成评论的辅助函数（支持楼层互动）
            function addCommentsWithInteraction(count) {
                for (let i = 0; i < count; i++) {
                    const npc = randomNPC();
                    const comment = { name: npc.name, avatar: npc.avatar, text: getUniqueComment(), time: Date.now() - Math.floor(Math.random() * 7200000) };
                    // 30%概率回复已有评论（模拟楼层互动）
                    if (commentList.length > 0 && Math.random() < 0.3) {
                        const targetComment = commentList[Math.floor(Math.random() * commentList.length)];
                        comment.replyTo = targetComment.name;
                    }
                    commentList.push(comment);
                }
            }

            if (roll < 0.15) {
                // 15% 概率：爆款帖子 (100-500赞, 20-80评论, 50-200转发)
                const likeCount = Math.floor(Math.random() * 400 + 100);
                for (let i = 0; i < likeCount; i++) likeNames.push('user_' + i);
                const commentCount = Math.floor(Math.random() * 60 + 20);
                addCommentsWithInteraction(commentCount);
                reposts = Math.floor(Math.random() * 150 + 50);
            } else if (roll < 0.40) {
                // 25% 概率：热门帖子 (30-100赞, 8-25评论, 10-50转发)
                const likeCount = Math.floor(Math.random() * 70 + 30);
                for (let i = 0; i < likeCount; i++) likeNames.push('user_' + i);
                const commentCount = Math.floor(Math.random() * 17 + 8);
                addCommentsWithInteraction(commentCount);
                reposts = Math.floor(Math.random() * 40 + 10);
            } else if (roll < 0.70) {
                // 30% 概率：中等互动 (5-30赞, 2-8评论, 1-10转发)
                const likeCount = Math.floor(Math.random() * 25 + 5);
                for (let i = 0; i < likeCount; i++) likeNames.push('user_' + i);
                const commentCount = Math.floor(Math.random() * 6 + 2);
                addCommentsWithInteraction(commentCount);
                reposts = Math.floor(Math.random() * 9 + 1);
            } else {
                // 30% 概率：低互动 (0-5赞, 0-2评论, 0-2转发)
                const likeCount = Math.floor(Math.random() * 5);
                for (let i = 0; i < likeCount; i++) likeNames.push('user_' + i);
                const commentCount = Math.floor(Math.random() * 2);
                addCommentsWithInteraction(commentCount);
                reposts = Math.floor(Math.random() * 2);
            }

            return { likes: likeNames, comments: commentList, reposts };
        }

        function escapeHtml(text) {
            if (!text) return '';
            return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        }

        function formatForumTime(ts) {
            const now = Date.now();
            const diff = now - ts;
            if (diff < 60000) return '刚刚';
            if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
            if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
            const d = new Date(ts);
            return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
        }

        function openNewPostModal() {
            document.getElementById('new-post-title').value = '';
            document.getElementById('new-post-content').value = '';
            // Populate section selector
            const sel = document.getElementById('new-post-section');
            if (sel) {
                const sections = store.forumSections || [];
                const currentSid = store.currentForumSectionId || '';
                sel.innerHTML = '<option value="">全部（不指定板块）</option>' +
                    sections.map(s => `<option value="${s.id}" ${currentSid === s.id ? 'selected' : ''}>${escapeHtml(s.name)}</option>`).join('');
            }
            document.getElementById('modal-new-post').style.display = 'flex';
        }

        function submitNewPost() {
            const title = document.getElementById('new-post-title').value.trim();
            const content = document.getElementById('new-post-content').value.trim();
            if (!title) return toast('请输入标题');
            if (!content) return toast('请输入内容');
            const selEl = document.getElementById('new-post-section');
            const sectionId = selEl ? (selEl.value || null) : null;

            // Check section char limits
            if (sectionId) {
                const sec = (store.forumSections || []).find(s => s.id === sectionId);
                if (sec) {
                    if (sec.minChars && content.length < sec.minChars) return toast(`该板块要求正文至少 ${sec.minChars} 字`);
                    if (sec.maxChars && content.length > sec.maxChars) return toast(`该板块要求正文不超过 ${sec.maxChars} 字`);
                }
            }

            const postId = 'fp_' + Date.now();
            ForumAPI.addPost({
                id: postId,
                title,
                content,
                author: ForumAPI.getDisplayName(),
                avatar: ForumAPI.getDisplayAvatar(),
                time: Date.now(),
                likes: [],
                stars: [],
                comments: [],
                isMe: true,
                sectionId: sectionId || null
            });
            document.getElementById('modal-new-post').style.display = 'none';
            renderForum();
            toast('发布成功');

            // Trigger async NPC interactions on the new post - generate multiple comments + DMs based on post content
            setTimeout(async () => {
                try {
                    const post = ForumAPI.getPost(postId);
                    if (!post || !window.randomNPC) return;
                    if (!post.comments) post.comments = [];
                    if (!post.likes) post.likes = [];

                    // 生成3-6条AI评论，每条都与帖子内容紧密相关
                    const commentCount = 3 + Math.floor(Math.random() * 4);
                    const npcs = [];
                    const _usedNpcNames = new Set([ForumAPI.getDisplayName()]);
                    for (let i = 0; i < commentCount; i++) {
                        let _npc; let _r = 0;
                        do { _npc = window.randomNPC(); _r++; } while (_usedNpcNames.has(_npc.name) && _r < 5);
                        _usedNpcNames.add(_npc.name);
                        npcs.push(_npc);
                    }
                    const _postTime = post.time || Date.now();

                    try {
                        const npcNames = npcs.map(n => n.name).join('、');
                        const cData = await API.chatCompletion([
                            { role: 'system', content: `你是论坛评论生成器。${commentCount}个用户（${npcNames}）对一条帖子评论。
⚠️核心：每条评论必须针对帖子的具体内容——引用帖子中提到的具体事物、观点或细节来回应，禁止"写得好""不错"等万能评论。
要求：1.先仔细读帖子内容，每条评论回应帖子中的某个具体点 2.长度有变化(5-60字) 3.部分评论互相回复(replyTo填已有评论者名字) 4.风格多样
JSON：[{"name":"用户名","text":"评论","replyTo":null}]` },
                            { role: 'user', content: `【帖子标题】${post.title}\n【帖子正文】${post.content}\n\n请针对以上帖子的具体内容生成评论：` }
                        ]);
                        const replyText = (cData.choices[0].message.content || '').trim();
                        const jsonMatch = replyText.match(/\[[\s\S]*\]/);
                        if (jsonMatch) {
                            const comments = JSON.parse(jsonMatch[0]);
                            const _addedNames = [];
                            comments.forEach((c, ci) => {
                                const npc = npcs[ci] || window.randomNPC();
                                const commentObj = { name: npc.name, avatar: npc.avatar, text: (c.text || '').substring(0, 100), time: _postTime + (ci + 1) * 60000 };
                                // replyTo校验：必须是前面已出现的评论者名字
                                if (c.replyTo && c.replyTo !== 'null' && c.replyTo !== null) {
                                    if (_addedNames.includes(c.replyTo)) commentObj.replyTo = c.replyTo;
                                }
                                _addedNames.push(npc.name);
                                post.comments.push(commentObj);
                                if (!post.likes.includes(npc.name)) post.likes.push(npc.name);
                            });
                            // 通知合并：评论和点赞各合并为一条
                            if (window.addForumNotif && comments.length > 0) {
                                const _names = npcs.slice(0, comments.length).map(n => n.name);
                                const _firstNpc = npcs[0];
                                window.addForumNotif('comment', _names.length > 1 ? _names.slice(0,2).join('、') + (_names.length > 2 ? ` 等${_names.length}人` : '') : _names[0], _firstNpc.avatar, postId, comments[0].text || '评论了你的帖子');
                                window.addForumNotif('like', _names.length > 1 ? _names.slice(0,2).join('、') + (_names.length > 2 ? ` 等${_names.length}人` : '') : _names[0], _firstNpc.avatar, postId, '赞了你的帖子');
                            }
                        }
                    } catch (e) {
                        toast('评论服务繁忙，已用本地生成');
                        // 回退到本地评论（确保与帖子内容相关）
                        for (let i = 0; i < commentCount; i++) {
                            const npc = npcs[i];
                            const commentText = window.generateContextualComment ? window.generateContextualComment(post.title, post.content) : window.randomPick(window.FORUM_NPC_COMMENTS);
                            post.comments.push({ name: npc.name, avatar: npc.avatar, text: commentText, time: _postTime + (i + 1) * 60000 });
                            if (!post.likes.includes(npc.name)) post.likes.push(npc.name);
                        }
                        if (window.addForumNotif && npcs.length > 0) {
                            const _names = npcs.map(n => n.name);
                            window.addForumNotif('comment', _names.slice(0,2).join('、') + (_names.length > 2 ? ` 等${_names.length}人` : ''), npcs[0].avatar, postId, '评论了你的帖子');
                            window.addForumNotif('like', _names.slice(0,2).join('、') + (_names.length > 2 ? ` 等${_names.length}人` : ''), npcs[0].avatar, postId, '赞了你的帖子');
                        }
                    }

                    // 额外点赞（2-5个NPC）
                    const extraLikes = 2 + Math.floor(Math.random() * 4);
                    for (let i = 0; i < extraLikes; i++) {
                        const likeNpc = window.randomNPC();
                        if (!post.likes.includes(likeNpc.name)) {
                            post.likes.push(likeNpc.name);
                            if (window.addForumNotif) window.addForumNotif('like', likeNpc.name, likeNpc.avatar, postId, '赞了你的帖子');
                        }
                    }

                    // 生成1-2条基于帖子内容的私信（NPC根据帖子内容来私信用户）
                    if (Math.random() > 0.3) {
                        const dmNpc = window.randomNPC();
                        let dmText;
                        try {
                            const dmData = await API.chatCompletion([
                                { role: 'system', content: `你是论坛用户${dmNpc.name}，你看到了一个帖子很感兴趣，想给作者发一条私信。
要求：私信内容要与帖子内容相关，表达你的看法或想进一步交流的意愿。简短自然（15-30字），像真人发消息。不要加前缀。` },
                                { role: 'user', content: `帖子标题：${post.title}\n帖子内容：${post.content}` }
                            ]);
                            dmText = (dmData.choices[0].message.content || '').trim().substring(0, 50);
                        } catch (e) {
                            dmText = '看了你的帖子，写得真好！想和你聊聊这个话题～';
                        }
                        if (window.addForumDM) window.addForumDM(dmNpc.name, dmNpc.avatar, dmText);
                    }

                    // 收藏通知
                    if (Math.random() > 0.5) {
                        const starNpc = window.randomNPC();
                        if (!post.stars) post.stars = [];
                        if (!post.stars.includes(starNpc.name)) {
                            post.stars.push(starNpc.name);
                            if (window.addForumNotif) window.addForumNotif('star', starNpc.name, starNpc.avatar, postId, '收藏了你的帖子');
                        }
                    }

                    // 关注通知
                    if (Math.random() > 0.6) {
                        const followNpc = window.randomNPC();
                        if (window.addForumNotif) window.addForumNotif('follow', followNpc.name, followNpc.avatar, null, '关注了你');
                    }

                    if (window.updateForumMsgDot) window.updateForumMsgDot();
                    save();
                    renderForum();
                    if (activeForumPostId === postId) renderForumDetail(postId);
                } catch (e) { console.warn('NPC interaction failed:', e); }
            }, 2000 + Math.random() * 3000);
        }

        function toggleForumLike(postId) {
            ForumAPI.toggleLike(postId);
            renderForum();
            if (activeForumPostId === postId) renderForumDetail(postId);
        }

        function openForumPost(postId) {
            activeForumPostId = postId;
            document.getElementById('layer-forum-detail').classList.add('show');
            renderForumDetail(postId);
        }

        function renderForumDetail(postId) {
            const post = ForumAPI.getPost(postId);
            if (!post) return;

            const body = document.getElementById('forum-detail-body');
            const _meId = ForumAPI._meId();
            const isLiked = (post.likes || []).includes(_meId);
            const isStarred = (post.stars || []).includes(_meId);
            const likeCount = (post.likes || []).length;
            const commentCount = (post.comments || []).length;
            const repostCount = post.reposts || 0;
            const comments = post.comments || [];
            const isFollowed = ForumAPI.isFollowing(post.author);
            const showFollow = !post.isMe;

            let html = `
                <div class="forum-detail-post">
                    <div class="forum-detail-author-bar">
                        <img src="${post.avatar || 'https://i.pravatar.cc/150?img=0'}" class="forum-detail-author-avatar" onclick="openForumUserProfile('${escapeHtml(post.author)}', '${post.avatar || ''}')" style="cursor:pointer;">
                        <div class="forum-detail-author-info">
                            <div class="forum-detail-author-name" onclick="openForumUserProfile('${escapeHtml(post.author)}', '${post.avatar || ''}')" style="cursor:pointer;">${escapeHtml(post.author)}</div>
                            <div class="forum-detail-author-time">${formatForumTime(post.time)}</div>
                        </div>
                        ${showFollow ? `<button class="forum-follow-btn ${isFollowed ? 'followed' : ''}" onclick="toggleForumFollow('${escapeHtml(post.author)}')">
                            ${isFollowed ? '<i class="fas fa-check"></i> 已关注' : '<i class="fas fa-plus"></i> 关注'}
                        </button>` : ''}
                    </div>
                    <div class="forum-detail-title">${escapeHtml(post.title)}</div>
                    <div class="forum-detail-content">${escapeHtml(post.content)}</div>
                </div>
                <div class="forum-detail-stats-bar">
                    <span class="forum-detail-stat ${isLiked ? 'liked' : ''}" onclick="toggleForumLike('${post.id}')">
                        <i class="${isLiked ? 'fas' : 'far'} fa-heart"></i> ${likeCount || ''}
                    </span>
                    <span class="forum-detail-stat" onclick="document.getElementById('forum-comment-input').focus()">
                        <i class="far fa-comment"></i> ${commentCount || ''}
                    </span>
                    <span class="forum-detail-stat" onclick="forumRepost('${post.id}')">
                        <i class="fas fa-retweet"></i> ${repostCount || ''}
                    </span>
                    <span class="forum-detail-stat ${isStarred ? 'starred' : ''}" onclick="toggleForumStar('${post.id}')">
                        <i class="${isStarred ? 'fas' : 'far'} fa-bookmark"></i>
                    </span>
                    <span class="forum-detail-stat" onclick="forumSharePost('${post.id}')">
                        <i class="fas fa-share-alt"></i>
                    </span>
                </div>
                <div class="forum-comments-section">
                    <div class="forum-comments-title">评论 (${commentCount})</div>
                    ${commentCount === 0 ? '<div style="color:#bbb; font-size:14px; text-align:center; padding:20px;">暂无评论，快来抢沙发</div>' : ''}
                    ${comments.map((c, ci) => `
                        <div class="forum-comment-item">
                            <img src="${c.avatar || 'https://i.pravatar.cc/150?img=0'}">
                            <div class="forum-comment-body">
                                <div class="forum-comment-name">${escapeHtml(c.name)}</div>
                                <div class="forum-comment-text">${c.replyTo ? `<span style="color:#576b95;">回复 @${escapeHtml(c.replyTo)}</span> ` : ''}${escapeHtml(c.text)}</div>
                                <div class="forum-comment-time" style="display:flex; align-items:center; gap:12px;">
                                    ${formatForumTime(c.time)}
                                    <span onclick="setForumReplyTo('${escapeHtml(c.name)}', '${c.avatar || ''}')" style="cursor:pointer; color:#576b95; font-size:12px;"><i class="far fa-comment-dots"></i> 回复</span>
                                    ${c.name === ForumAPI.getDisplayName() ? `<span onclick="event.stopPropagation(); forumDeleteComment('${post.id}', '${c.id || ''}')" style="cursor:pointer; color:#ff4757; font-size:12px;"><i class="far fa-trash-alt"></i> 删除</span>` : ''}
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
            body.innerHTML = html;
        }

        // ========== FORUM: DELETE COMMENT ==========
        function forumDeleteComment(postId, commentId) {
            if (!commentId) {
                // 兼容没有id的旧评论，用确认框+按index删
                toast('该评论无法删除（旧数据）');
                return;
            }
            if (!confirm('确定删除这条评论？')) return;
            if (ForumAPI.deleteComment(postId, commentId)) {
                toast('评论已删除');
                renderForumDetail(postId);
                renderForum();
            } else {
                toast('删除失败，只能删除自己的评论');
            }
        }
        window.forumDeleteComment = forumDeleteComment;

        // ========== FORUM: GENERATE COMMENTS (AI生成评论) ==========
        async function forumGenerateComments() {
            const postId = activeForumPostId;
            const post = ForumAPI.getPost(postId);
            if (!post) return toast('帖子不存在');

            const btn = document.getElementById('forum-gen-comment-btn');
            const origHtml = btn ? btn.innerHTML : '';
            if (btn) btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 生成中';
            if (btn) btn.style.pointerEvents = 'none';

            try {
                _currentApiScene = 'forum';
                const commentCount = 3 + Math.floor(Math.random() * 4); // 3-6条
                const npcs = [];
                for (let i = 0; i < commentCount; i++) npcs.push(window.randomNPC());

                const existingNames = (post.comments || []).map(c => c.name);
                const existingContext = (post.comments || []).length > 0
                    ? '\n已有评论：' + (post.comments || []).slice(-3).map(c => `${c.name}: ${c.text}`).join('\n')
                    : '';

                const data = await API.chatCompletion([
                    { role: 'system', content: `生成${commentCount}条论坛评论JSON数组。每条包含text字段（评论内容，10-50字）和可选replyTo字段（回复某人的名字）。
要求：评论必须针对帖子具体内容，风格多样化（有夸奖、有讨论、有吐槽、有补充、有提问、有阴阳怪气、有共情），像真实网友评论，不要千篇一律。
可选回复对象：${existingNames.concat(npcs.map(n=>n.name)).join(',')}
格式：[{"text":"评论内容","replyTo":null}]` },
                    { role: 'user', content: `【帖子标题】${post.title}\n【帖子正文】${post.content}${existingContext}\n\n请针对帖子具体内容生成评论：` }
                ]);

                const replyText = (data.choices[0].message.content || '').trim();
                const jsonMatch = replyText.match(/\[[\s\S]*\]/);
                if (jsonMatch) {
                    const comments = JSON.parse(jsonMatch[0]);
                    if (!post.comments) post.comments = [];
                    if (!post.likes) post.likes = [];
                    const _addedNames = existingNames.slice();
                    comments.forEach((c, ci) => {
                        const npc = npcs[ci] || window.randomNPC();
                        const commentObj = {
                            id: 'c_' + Date.now() + '_' + ci + '_' + Math.random().toString(36).slice(2, 6),
                            name: npc.name, avatar: npc.avatar,
                            text: (c.text || '').substring(0, 100),
                            time: Date.now() + (ci + 1) * 60000
                        };
                        if (c.replyTo && c.replyTo !== 'null' && c.replyTo !== null && _addedNames.includes(c.replyTo)) {
                            commentObj.replyTo = c.replyTo;
                        }
                        _addedNames.push(npc.name);
                        post.comments.push(commentObj);
                        if (!post.likes.includes(npc.name)) post.likes.push(npc.name);
                    });
                    // 通知
                    if (window.addForumNotif && comments.length > 0) {
                        const _names = npcs.slice(0, comments.length).map(n => n.name);
                        const _firstNpc = npcs[0];
                        window.addForumNotif('comment', _names.length > 1 ? _names.slice(0,2).join('、') + (_names.length > 2 ? ` 等${_names.length}人` : '') : _names[0], _firstNpc.avatar, postId, comments[0].text || '评论了你的帖子');
                    }
                    save();
                    renderForumDetail(postId);
                    renderForum();
                    toast('已生成 ' + comments.length + ' 条评论 ✅');
                } else {
                    toast('AI返回格式异常，请重试');
                }
            } catch (e) {
                console.error('生成评论失败:', e);
                // 回退到本地生成
                try {
                    if (!post.comments) post.comments = [];
                    if (!post.likes) post.likes = [];
                    const fallbackCount = 2 + Math.floor(Math.random() * 3);
                    for (let i = 0; i < fallbackCount; i++) {
                        const npc = window.randomNPC();
                        const text = window.generateContextualComment ? window.generateContextualComment(post.title, post.content) : '说得有道理';
                        post.comments.push({
                            id: 'c_' + Date.now() + '_fb_' + i,
                            name: npc.name, avatar: npc.avatar, text,
                            time: Date.now() + (i + 1) * 60000
                        });
                        if (!post.likes.includes(npc.name)) post.likes.push(npc.name);
                    }
                    save();
                    renderForumDetail(postId);
                    renderForum();
                    toast('AI服务繁忙，已用本地生成 ' + fallbackCount + ' 条评论');
                } catch(e2) {
                    toast('生成评论失败: ' + e.message);
                }
            }
            if (btn) { btn.innerHTML = origHtml; btn.style.pointerEvents = ''; }
        }
        window.forumGenerateComments = forumGenerateComments;

        // ========== FORUM: FOLLOW ==========
        function toggleForumFollow(authorName) {
            const followed = ForumAPI.toggleFollow(authorName);
            if (followed) {
                toast('关注成功');
                // 不再为"我关注了别人"创建通知，只有NPC关注我才创建通知
            } else {
                toast('已取消关注');
            }
            if (activeForumPostId) renderForumDetail(activeForumPostId);
            renderForumMyTab();
        }

        // ========== FORUM: REPOST (转发选择联系人) ==========
        function forumRepost(postId) {
            activeRepostPostId = postId;
            const contacts = (store.contacts || []).filter(c => c && c.id && c.name);
            const list = document.getElementById('forum-repost-list');
            if (!list) return;
            if (contacts.length === 0) {
                list.innerHTML = '<div style="text-align:center; padding:20px; color:#bbb;">暂无联系人</div>';
            } else {
                list.innerHTML = contacts.map(c => `
                    <label style="display:flex; align-items:center; padding:10px; background:#f9f9f9; border-radius:10px; margin-bottom:6px; cursor:pointer;">
                        <input type="checkbox" class="forum-repost-contact" value="${c.id}" style="width:18px; height:18px; margin-right:10px; accent-color:var(--primary);">
                        <img src="${c.avatar || _ph(36)}" style="width:36px; height:36px; border-radius:50%; margin-right:10px; object-fit:cover;">
                        <span style="font-size:14px;">${escapeHtml(c.name)}</span>
                    </label>
                `).join('');
            }
            document.getElementById('modal-forum-repost').style.display = 'flex';
        }

        function submitForumRepost() {
            const checked = document.querySelectorAll('.forum-repost-contact:checked');
            if (checked.length === 0) return toast('请选择转发对象');
            const contactIds = Array.from(checked).map(cb => cb.value);
            ForumAPI.addReposts(activeRepostPostId, checked.length);
            ForumAPI.shareToContacts(activeRepostPostId, contactIds);
            document.getElementById('modal-forum-repost').style.display = 'none';
            toast(`已转发给${checked.length}位好友`);
            if (activeForumPostId === activeRepostPostId) renderForumDetail(activeRepostPostId);
            renderForum();
        }

        // ========== FORUM: SHARE (contact selection popup) ==========
        let activeSharePostId = null;
        function forumSharePost(postId) {
            activeSharePostId = postId;
            const contacts = (store.contacts || []).filter(c => c && c.id && c.name);
            const list = document.getElementById('forum-share-list');
            if (!list) return;
            if (contacts.length === 0) {
                list.innerHTML = '<div style="text-align:center; padding:20px; color:#bbb;">暂无联系人</div>';
            } else {
                list.innerHTML = contacts.map(c => `
                    <label style="display:flex; align-items:center; padding:10px; background:#f9f9f9; border-radius:10px; margin-bottom:6px; cursor:pointer;">
                        <input type="checkbox" class="forum-share-contact" value="${c.id}" style="width:18px; height:18px; margin-right:10px; accent-color:var(--primary);">
                        <img src="${c.avatar || _ph(36)}" style="width:36px; height:36px; border-radius:50%; margin-right:10px; object-fit:cover;">
                        <span style="font-size:14px;">${escapeHtml(c.name)}</span>
                    </label>
                `).join('');
            }
            document.getElementById('modal-forum-share').style.display = 'flex';
        }

        function submitForumShare() {
            const checked = document.querySelectorAll('.forum-share-contact:checked');
            if (checked.length === 0) return toast('请选择分享对象');
            const contactIds = Array.from(checked).map(cb => cb.value);
            const sent = ForumAPI.shareToContacts(activeSharePostId, contactIds);
            document.getElementById('modal-forum-share').style.display = 'none';
            if (sent > 0) toast(`已分享给${sent}位好友`);
        }

        // Forum reply-to state
        let forumReplyToUser = null; // { name, avatar }

        function setForumReplyTo(name, avatar) {
            forumReplyToUser = { name, avatar };
            const input = document.getElementById('forum-comment-input');
            if (input) {
                input.placeholder = `回复 @${name}...`;
                input.focus();
            }
        }

        function clearForumReplyTo() {
            forumReplyToUser = null;
            const input = document.getElementById('forum-comment-input');
            if (input) input.placeholder = '写评论...';
        }

        function submitForumComment() {
            const input = document.getElementById('forum-comment-input');
            const text = input.value.trim();
            if (!text || !activeForumPostId) return;
            const commentPostId = activeForumPostId;
            const replyTo = forumReplyToUser ? forumReplyToUser.name : null;
            const replyToAvatar = forumReplyToUser ? forumReplyToUser.avatar : null;

            ForumAPI.addComment(commentPostId, {
                name: ForumAPI.getDisplayName(),
                avatar: ForumAPI.getDisplayAvatar(),
                accountId: ForumAPI.getCurrentAccountId() || null,
                isMe: true,
                text,
                replyTo,
                time: Date.now()
            });
            input.value = '';
            clearForumReplyTo();
            renderForumDetail(commentPostId);
            renderForum();
            toast('评论成功');

            // Trigger reply from the replied-to person (if replying to an NPC)
            if (replyTo && replyTo !== ForumAPI.getDisplayName()) {
                setTimeout(async () => {
                    try {
                        const post = ForumAPI.getPost(commentPostId);
                        if (!post) return;
                        let replyText;
                        // Check if the replied-to user is a linked contact
                        const _replyContact = (store.contacts || []).find(c => c.name === replyTo);
                        const _isLinkedReply = _replyContact && (ForumAPI.getSettings().linkedContacts || []).includes(_replyContact.id);
                        try {
                            let sysPrompt;
                            if (_isLinkedReply) {
                                // Use full persona for linked contact replies
                                const _ctx = typeof buildMailContext === 'function' ? buildMailContext(_replyContact) : {};
                                sysPrompt = `你是${_replyContact.name}。你的人设：${_replyContact.persona || '一个有个性的人'}
${_ctx.worldBook ? '世界观背景：' + _ctx.worldBook : ''}
${_ctx.memoryContext ? '你的全局记忆数据(你必须记住并主动运用。注意：标注为"虚构"或"小剧场"的内容不是真实事件，不能当作真实经历)：' + _ctx.memoryContext : ''}
${_ctx.chatContext ? '最近聊天记录（参考说话风格）：\n' + _ctx.chatContext : ''}

有人在论坛上回复了你的评论。请以你的性格和说话风格写一条自然的回复。
要求：
1. 完全符合你的人设性格，像真人在论坛上随手回复一样
2. 长度10-40字，简短自然，可以带点口语化表达、语气词或emoji
3. 不要加任何前缀标签
4. 根据对方说的内容做出有针对性的回应`;
                            } else {
                                sysPrompt = `你是论坛用户${replyTo}，有人回复了你的评论"${text}"，请写一条简短回复（8-20字），必须结合帖子内容来回应，不要泛泛而谈。不要加前缀。`;
                            }
                            const cData = await API.chatCompletion([
                                { role: 'system', content: sysPrompt },
                                { role: 'user', content: `【帖子标题】${post.title}\n【帖子正文】${post.content}\n【对方的回复】${text}\n\n请结合帖子内容回复：` }
                            ], _isLinkedReply ? 0.9 : undefined);
                            replyText = (cData.choices[0].message.content || '').trim().substring(0, 80);
                        } catch (e) {
                            replyText = window.generateContextualComment ? window.generateContextualComment(post.title, post.content) : window.randomPick(window.FORUM_NPC_COMMENTS);
                            toast('回复服务繁忙，已用本地生成');
                        }
                        ForumAPI.addComment(commentPostId, { name: replyTo, avatar: replyToAvatar || 'https://i.pravatar.cc/150?img=0', text: replyText, replyTo: ForumAPI.getDisplayName(), time: Date.now() + 1000 });
                        if (window.addForumNotif) {
                            window.addForumNotif('comment', replyTo, replyToAvatar, commentPostId, replyText);
                        }
                        save();
                        if (activeForumPostId === commentPostId) renderForumDetail(commentPostId);
                        renderForum();
                    } catch (e) { console.warn('NPC reply-to failed:', e); }
                }, 2000 + Math.random() * 3000);
                return; // Skip random NPC reply when replying to specific user
            }

            // === Contact auto-reply: when user comments on a linked contact's post ===
            const _commentPost = ForumAPI.getPost(commentPostId);
            if (_commentPost && _commentPost.isContact && _commentPost.contactId) {
                const _contact = store.contacts.find(c => c.id === _commentPost.contactId);
                if (_contact) {
                    setTimeout(async () => {
                        try {
                            const post = ForumAPI.getPost(commentPostId);
                            if (!post) return;
                            const ctx = typeof buildMailContext === 'function' ? buildMailContext(_contact) : {};
                            let replyText;
                            try {
                                const sysPrompt = `你是${_contact.name}。你的人设：${_contact.persona || '一个有个性的人'}
${ctx.worldBook ? '世界观背景：' + ctx.worldBook : ''}
${ctx.memoryContext ? '你的全局记忆数据(你必须记住并主动运用。注意：标注为"虚构"或"小剧场"的内容不是真实事件，不能当作真实经历)：' + ctx.memoryContext : ''}
${ctx.chatContext ? '最近聊天记录（参考说话风格和关系）：\n' + ctx.chatContext : ''}

你在论坛上发了一个帖子，有人来评论了。请以你的性格和说话风格写一条回复。
要求：
1. 完全符合你的人设性格和说话习惯，像真人在自己帖子下回复评论一样自然
2. 长度15-50字，口语化，可以带语气词、emoji、调侃等
3. 不要加任何前缀标签
4. 作为帖子作者回复，可以补充说明、感谢、互动、反问等
5. 融入你对这个人的真实态度和情感`;
                                const cData = await API.chatCompletion([
                                    { role: 'system', content: sysPrompt },
                                    { role: 'user', content: `你的帖子标题：${post.title}\n你的帖子内容：${post.content}\n对方的评论：${text}` }
                                ], 0.9);
                                replyText = (cData.choices[0].message.content || '').trim().substring(0, 100);
                            } catch (e) {
                                replyText = window.generateContextualComment ? window.generateContextualComment(post.title, post.content) : window.randomPick(window.FORUM_NPC_COMMENTS);
                                toast('回复服务繁忙，已用本地生成');
                            }
                            ForumAPI.addComment(commentPostId, {
                                name: _contact.name,
                                avatar: _contact.avatar || 'https://i.pravatar.cc/150?img=0',
                                text: replyText,
                                replyTo: ForumAPI.getDisplayName(),
                                time: Date.now() + 1000
                            });
                            if (window.addForumNotif) {
                                window.addForumNotif('comment', _contact.name, _contact.avatar, commentPostId, replyText);
                            }
                            save();
                            if (activeForumPostId === commentPostId) renderForumDetail(commentPostId);
                            renderForum();
                        } catch (e) { console.warn('Contact auto-reply failed:', e); }
                    }, 2000 + Math.random() * 4000);
                    return; // Skip random NPC reply for contact posts
                }
            }

            // Trigger NPC reply to user's comment via API
            setTimeout(async () => {
                try {
                    const post = ForumAPI.getPost(commentPostId);
                    if (!post || post.isMe || !window.randomNPC) return;
                    // 50% chance of NPC reply
                    if (Math.random() > 0.5) return;
                    const npc = window.randomNPC();
                    let replyText;
                    try {
                        const cData = await API.chatCompletion([
                            { role: 'system', content: `你是论坛用户${npc.name}，有人在帖子下评论了"${text}"，请写一条简短回复（8-20字），必须结合帖子内容来回应，不要泛泛而谈。不要加前缀。` },
                            { role: 'user', content: `【帖子标题】${post.title}\n【帖子正文】${post.content}\n【对方评论】${text}\n\n请结合帖子内容回复：` }
                        ]);
                        replyText = (cData.choices[0].message.content || '').trim().substring(0, 50);
                    } catch (e) {
                        replyText = window.generateContextualComment ? window.generateContextualComment(post.title, post.content) : window.randomPick(window.FORUM_NPC_COMMENTS);
                        toast('回复服务繁忙，已用本地生成');
                    }
                    ForumAPI.addComment(commentPostId, { name: npc.name, avatar: npc.avatar, text: replyText, time: Date.now() });
                    if (window.addForumNotif) {
                        window.addForumNotif('comment', npc.name, npc.avatar, commentPostId, replyText);
                    }
                    save();
                    if (activeForumPostId === commentPostId) renderForumDetail(commentPostId);
                    renderForum();
                } catch (e) { console.warn('NPC comment reply failed:', e); }
            }, 3000 + Math.random() * 4000);
        }

        function editCurrentPost() {
            const post = ForumAPI.getPost(activeForumPostId);
            if (!post) return;
            document.getElementById('forum-detail-menu').style.display = 'none';

            showPromptModal('编辑标题:', post.title).then(function(newTitle) {
                if (newTitle === null) return;
                showPromptModal('编辑内容:', post.content, {multiline: true}).then(function(newContent) {
                    if (newContent === null) return;
                    ForumAPI.updatePost(activeForumPostId, {
                        title: newTitle.trim() || post.title,
                        content: newContent.trim() || post.content
                    });
                    renderForumDetail(activeForumPostId);
                    renderForum();
                    toast('编辑成功');
                });
            });
        }

        function deleteCurrentPost() {
            document.getElementById('forum-detail-menu').style.display = 'none';
            showConfirm('删除帖子', '确定要删除这篇帖子吗？', () => {
                if (ForumAPI.deletePost(activeForumPostId)) {
                    closeLayer('layer-forum-detail');
                    renderForum();
                    toast('已删除');
                }
            });
        }

        // ========== FORUM: NPC DATA ==========
                const FORUM_NPC_NAMES = [
                    // 可爱/萌系
                    '奶茶续命中','吃货少女酱','奶盖三分糖','甜甜圈战士','芋泥波波珠',
                    '奶fufu的','椰椰拿铁','草莓味的风','蜜桃汽水','棉花糖云朵',
                    '小熊饼干','布丁摇摇乐','焦糖玛奇朵','冰淇淋化了','樱桃小丸子本子',
                    // 摸鱼/打工人
                    '今天也在摸鱼','咸鱼本鱼','摆烂大师','不想上班bot','打工人の日常',
                    '干饭不积极','退堂鼓表演艺术家','脆皮大学生','带薪拉屎选手','工位养生达人',
                    '周五倒计时','午休哲学家','PPT美化师','会议室钉子户','Excel崩溃现场',
                    // 二次元/宅
                    '二次元永远滴神','追星的小尾巴','深夜食堂老板','宅家快乐水','快乐肥宅水',
                    '手办破产中','漫展常驻嘉宾','纸片人老婆','氪金战士','同人产出机',
                    '声控晚期','弹幕护体','追番日历','cos道具组','画师修炼中',
                    // 文艺/治愈
                    '月亮邮递员','像风一样自由','星河漫步者','晚安地球','氛围感少女',
                    '想去看海','人间烟火气','日落收集者','雨天听歌人','书页间的猫',
                    '咖啡馆常客','胶片记忆','手写信笺','窗台上的多肉','晚风与橘子',
                    // 搞笑/沙雕
                    '熬夜冠军🏆','社恐晚期患者','人间清醒','暴走的小辣椒','思路清奇',
                    '小镇做题家','减肥从明天开始','今天吃什么呢','代码写不动了','猫奴日记',
                    '被窝封印术','地铁低头族','外卖评论家','朋友圈潜水员','已读不回大师',
                    // 运动/健康
                    '佛系养生girl','跑步机上的仓鼠','瑜伽垫积灰了','蛋白粉冲冲冲','引体向上0.5个',
                    '夜跑爱好者','游泳健将wannabe','跳绳三分钟选手','健身环吃灰中','早起打卡人',
                    // 音乐/艺术
                    '吉他弹唱中','耳机不离身','歌单分享bot','调色盘打翻了','钢琴练习曲',
                    '黑胶唱片控','livehouse常客','节拍器人生','画板上的猫爪印','陶艺新手村',
                    // 旅行/探索
                    '背包客日记','city walk达人','机票比价师','青旅故事集','地图收藏家',
                    '日出追逐者','小巷探险家','火车窗外','露营装备党','徒步GPS',
                    // 美食/烹饪
                    '深夜食堂','厨房爆炸现场','烘焙翻车日记','火锅永远的神','螺蛳粉真香',
                    '早餐打卡机','下午茶时间到','夜市扫荡队','泡面加蛋党','外卖满减算术家'
                ];
                // 动态生成头像：使用多种dicebear风格 + 随机seed，确保每次都不同
                const FORUM_AVATAR_STYLES = [
                    'lorelei', 'adventurer', 'adventurer-neutral', 'avataaars', 'avataaars-neutral',
                    'big-ears', 'big-ears-neutral', 'big-smile', 'bottts', 'bottts-neutral',
                    'croodles', 'croodles-neutral', 'fun-emoji', 'icons', 'identicon',
                    'initials', 'micah', 'miniavs', 'notionists', 'notionists-neutral',
                    'open-peeps', 'personas', 'pixel-art', 'pixel-art-neutral', 'thumbs'
                ];
                const FORUM_NPC_AVATARS = [
                    // 保留一些固定头像作为基础池
                    'https://api.dicebear.com/7.x/lorelei/svg?seed=Mia','https://api.dicebear.com/7.x/lorelei/svg?seed=Luna',
                    'https://api.dicebear.com/7.x/adventurer/svg?seed=Mimi','https://api.dicebear.com/7.x/adventurer/svg?seed=Kiki',
                    'https://api.dicebear.com/7.x/thumbs/svg?seed=Star','https://api.dicebear.com/7.x/thumbs/svg?seed=Moon',
                    'https://api.dicebear.com/7.x/big-smile/svg?seed=Happy','https://api.dicebear.com/7.x/big-smile/svg?seed=Joy',
                    'https://api.dicebear.com/7.x/micah/svg?seed=Alex','https://api.dicebear.com/7.x/micah/svg?seed=Sam'
                ];
                // 动态生成随机头像URL（每次调用都不同）
                function generateRandomAvatar() {
                    const style = FORUM_AVATAR_STYLES[Math.floor(Math.random() * FORUM_AVATAR_STYLES.length)];
                    const seed = Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
                    return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}`;
                }
                // 话题分类：八卦/娱乐、美食、动漫、游戏、穿搭、彩妆、日常、旅行、宠物、数码
                const FORUM_NPC_TITLES = [
                    // 八卦/娱乐
                    '天哪这对cp终于官宣了！！','你们看昨晚的颁奖典礼了吗','这个综艺笑到我肚子疼',
                    '有没有人追最新那部悬疑剧','内娱终于有能打的了',
                    // 美食
                    '探店｜这家日料绝了🍣','自制奶茶教程，吊打外面的','深夜放毒！刚做的芝士焗饭',
                    '排了两小时队就为这碗面','救命这个空气炸锅食谱太香了',
                    // 动漫
                    '新番推荐！这季度神作预定','二刷钢炼又哭了一遍','这个手办等了半年终于到了',
                    'coser太还原了吧绝了','漫展返图来啦！快来看看',
                    // 游戏
                    '原神新版本有人抽到了吗','通关黑神话花了我三天三夜','这个独立游戏也太上头了',
                    '求组队打副本！差一个奶','steam夏促剁手清单分享',
                    // 穿搭
                    '今日ootd｜秋冬叠穿思路','这件大衣真的太显瘦了','平价穿搭也能穿出高级感',
                    '小个子女生穿搭分享','这双鞋也太好搭了吧',
                    // 彩妆/护肤
                    '这支口红颜色绝美！必入','油皮亲妈底妆分享','平价眼影盘测评来了',
                    '换季护肤踩坑实录','素颜霜推荐，懒人福音',
                    // 日常/情感
                    '今天被一只流浪猫治愈了','深夜emo一下下','搬家后的独居日记',
                    '打工人の周一求生指南','终于攒够钱买了心心念念的东西',
                    // 旅行
                    '云南旅行vlog来啦','周末city walk路线分享','这个小众海岛太绝了',
                    // 宠物
                    '我家猫今天又拆家了','新领养的小狗第一天','仓鼠吃瓜子的样子太可爱了',
                    // 数码/科技
                    '新手机到了开箱测评','这个app也太好用了吧','机械键盘入坑指南'
                ];
                const FORUM_NPC_CONTENTS = [
                    // 八卦/娱乐
                    '等了三年终于官宣了！！从路人到真情实感磕cp，这一刻我真的哭了😭 祝福祝福！评论区一起尖叫！',
                    '昨晚的颁奖典礼大家看了吗？最佳男主实至名归，但最佳女主我觉得另一位更合适。你们怎么看？',
                    '这个综艺太好笑了哈哈哈，嘉宾之间的化学反应绝了，尤其是第三期那个游戏环节，我反复看了五遍',
                    '最近追的悬疑剧每集都在反转，编剧脑子是怎么长的？昨晚那集结尾直接给我看傻了，有一起追的吗',
                    '说真的这部新剧质感拉满了，服化道和演技都在线，终于不用尬吹了，是真的好看！',
                    // 美食
                    '今天探到一家超隐蔽的日料店，三文鱼刺身入口即化，寿司米饭粒粒分明。人均80，性价比逆天🍣',
                    '自己在家做奶茶真的超简单！红茶包+牛奶+黑糖，成本不到3块，味道吊打某雪某茶，配方放评论区',
                    '深夜放毒预警⚠️ 刚做的芝士焗饭，芝士拉丝的那一刻太治愈了。其实做法超简单，剩饭就能搞定',
                    '为了这碗面排了两小时队，本来想吐槽的，但是吃到第一口就闭嘴了。汤底浓郁，面条劲道，值了！',
                    '空气炸锅yyds！今天试了蒜香鸡翅，外酥里嫩，零厨艺也能做。200度15分钟搞定，食谱见图',
                    // 动漫
                    '这季度新番质量也太高了吧！目前追了三部，每部都是神作预定。最推荐第二部，作画经费燃烧！',
                    '二刷钢之炼金术师，到最后几集还是绷不住哭了。这部作品不管看几遍都能被感动到，永远的神作',
                    '等了半年的手办终于到货了！开箱的时候手都在抖，涂装细节太精致了，摆在桌上每天看都开心',
                    '今天在漫展看到一个coser，还原度至少99%，妆造和气质都绝了。征得同意拍了几张，大家感受一下',
                    '漫展返图来啦！这次cos了我最喜欢的角色，虽然赶工到凌晨三点，但现场反馈超好，值了！',
                    // 游戏
                    '新版本50抽出了限定！！非酋终于转运了😭 不过新地图的解谜也太难了，有没有攻略分享一下',
                    '黑神话通关了！三天三夜肝完，最后一个boss死了不下20次。画面和打击感真的是国产之光',
                    '安利一个独立游戏，画风超治愈，玩法很新颖，通关大概6小时。适合周末窝在家里慢慢玩',
                    '有没有人一起打副本！我们队差一个奶，在线蹲一个治疗。要求不高，能站住就行哈哈',
                    'steam夏促来了！整理了一份剁手清单，都是亲测好玩的，总价不到200。评论区分享你们的清单',
                    // 穿搭
                    '今日穿搭分享～秋冬叠穿真的太有层次感了，内搭高领毛衣+衬衫+大衣，简单但很有质感',
                    '这件大衣真的绝了！穿上直接显瘦10斤，而且面料手感超好。链接放评论区，姐妹们冲！',
                    '谁说平价穿搭不能有高级感？今天全身搭配加起来不到300，但拍出来效果一点不输大牌',
                    '小个子穿搭心得：高腰线+短上衣+阔腿裤，视觉上至少显高5cm。矮个子姐妹看过来！',
                    '入了一双百搭小白鞋，休闲通勤都能穿，而且超级舒服走一天都不累。真的是一鞋多穿',
                    // 彩妆/护肤
                    '这支口红颜色太绝了！薄涂日常厚涂气场全开，黄皮友好，不挑人。色号放评论区～',
                    '油皮姐妹看过来！这款底妆控油力max，早上化完到晚上都不怎么脱妆，终于找到亲妈底妆了',
                    '平价眼影盘测评！这盘配色太美了，粉质细腻不飞粉，日常妆和约会妆都能搞定，才79块',
                    '换季皮肤又开始作妖了😩 试了三款面霜都过敏，最后发现最简单的凡士林反而最管用',
                    '懒人素颜霜推荐！涂完皮肤自然提亮，不假白不搓泥，出门前一分钟搞定，社恐福音',
                    // 日常/情感
                    '下班路上遇到一只流浪猫，蹲在路边看着我喵了一声。蹲下来摸了摸它，突然觉得今天的疲惫都消散了',
                    '深夜了还睡不着，脑子里想了很多事情。有时候觉得成年人的世界真的不容易，但还是要继续加油啊',
                    '独居第一周，从手忙脚乱到慢慢适应。今天第一次自己做了一顿像样的晚餐，有点小骄傲',
                    '周一早上闹钟响了三次才起来，地铁上差点睡过站。打工人的每个周一都是渡劫',
                    '攒了三个月终于买了心心念念的相机！开箱的时候手都在抖，以后要好好记录生活',
                    // 旅行
                    '刚从云南回来！大理→丽江→香格里拉，7天6晚人均3500。洱海骑行那天风景美到窒息，强烈推荐',
                    '周末city walk路线分享：老城区→独立书店→河边咖啡馆→日落观景台。全程步行2小时，超治愈',
                    '发现一个小众海岛，人少景美水清，关键是机票才500往返！趁还没被网红发现赶紧去',
                    // 宠物
                    '我家猫今天把我新买的耳机线咬断了...看着它无辜的眼神我又生不起气来。养猫就是这样吧',
                    '新领养的小狗第一天到家，到处闻到处跑，晚上居然主动跳上床睡在我脚边。心都化了🥺',
                    '仓鼠吃瓜子的样子也太可爱了吧！两只小爪子捧着嗑，腮帮子鼓鼓的，我能看一整天',
                    // 数码/科技
                    '新手机到了！拍照效果提升太大了，夜景模式简直逆天。对比图放评论区，大家感受一下',
                    '安利一个超好用的app，记账+待办+习惯打卡全搞定，界面还很好看。用了一个月效率提升巨大',
                    '入坑机械键盘第一把，红轴手感太舒服了，打字像在弹钢琴。就是钱包有点遭不住'
                ];
                const FORUM_NPC_COMMENTS = [
                    '说得太对了！深有同感','哈哈哈笑死我了','同感同感，我也是这样想的',
                    '太羡慕了，什么时候我也能这样','加油！你一定可以的💪',
                    '太厉害了吧，佩服佩服','我也想要，求链接！','好棒啊，继续保持',
                    '确实如此，说到心坎里了','赞同！这个观点很有道理',
                    '这也太好了吧，收藏了','真不错，感谢分享','学到了，马上去试试',
                    '感谢分享，很有帮助','mark一下，回头慢慢看',
                    '太真实了哈哈哈','我也是这样的，握手🤝','好有道理，受教了',
                    '厉害厉害，大佬带带我','支持支持，期待后续更新',
                    '写得真好，很有共鸣','请问具体是哪家店呀？','看完心情都变好了',
                    '这个推荐太及时了','同款经历+1','照片拍得好美啊',
                    '啊啊啊我也想要！','蹲一个链接','笑不活了🤣',
                    '姐妹品味绝了','这也太绝了吧','已加购物车',
                    '求教程求教程！','我先码住了','awsl太可爱了',
                    '有被治愈到','这不冲一个？','我的DNA动了',
                    '谢谢楼主！已收藏','坐等更新','好家伙，格局打开了'
                ];

                // ========== 基于内容的评论分类模板 ==========
                const FORUM_COMMENT_TEMPLATES = {
                    food: [
                        '看饿了…今晚就去试试','这家我吃过！确实不错','求地址求地址！！',
                        '深夜放毒是吧😭','流口水了已经','这摆盘也太好看了吧',
                        '人均多少啊','外卖能点到吗','减肥计划又泡汤了',
                        '我上次去踩雷了…可能点的不对','看起来好好吃啊救命',
                        '收藏了周末去冲','这个酱料是什么牌子的','吃货狂喜',
                        '啊啊啊我也要去！！','本地人表示确实好吃','排队要多久啊'
                    ],
                    tech: [
                        '这个配置性价比可以','等等党永远不亏','已经下单了感谢推荐',
                        '用了一周来反馈，确实好用','这价格真的可以冲','有没有平替推荐',
                        '安卓还是苹果好这个问题永远吵不完哈哈','续航怎么样',
                        '拍照对比图呢','散热怎么样打游戏卡不卡','等双十一再说吧',
                        '这app我也在用 真的改变生活','内存够用吗','已种草'
                    ],
                    emotion: [
                        '抱抱楼主，会好起来的','感同身受了','看哭了…',
                        '你不是一个人，我也经历过','深夜emo选手报到','太真实了吧',
                        '写到我心里去了','希望你能开心起来','生活就是这样起起落落的',
                        '我也是 最近压力好大','文字好有感染力','看完沉默了好久',
                        '加油 明天会更好的','有被戳到','评论区都是同款心情'
                    ],
                    funny: [
                        '哈哈哈哈哈哈笑死','不行了这个太搞笑了','笑到邻居来敲门',
                        '救命 在地铁上差点笑出声','这什么沙雕哈哈哈哈','我要笑死在评论区了',
                        '转发给我朋友看 她也笑疯了','每看一次笑一次','太离谱了吧哈哈哈',
                        '笑出腹肌了','这个梗我能笑一年','建议全网推广',
                        '我室友问我为什么对着手机傻笑','快进到我笑死','段子手本人吧'
                    ],
                    beauty: [
                        '这个色号叫什么！！','求同款链接','好好看啊姐妹',
                        '适合黄皮吗','干皮能用吗','这个牌子我一直在用 真的好',
                        '种草了种草了','钱包在哭泣','又要剁手了',
                        '穿搭好有品味','这件在哪买的','显白吗',
                        '我买了 确实好用！','平替有推荐吗','已加购物车等发工资'
                    ],
                    pet: [
                        '啊啊啊好可爱！！','rua！想rua！','这小眼神绝了',
                        '我家猫/狗也这样哈哈','太萌了受不了','想偷走',
                        '看完想养一只了','毛孩子就是最好的治愈','这是什么品种呀',
                        '日常被萌到暴击','可爱到犯规了','我的心化了',
                        '又在骗我养猫/狗','这个表情包我截了','萌化了🥺'
                    ],
                    travel: [
                        '好美啊！这是哪里','收藏了下次去','风景绝了',
                        '请问住的哪家酒店','人多吗','几月份去最合适',
                        '拍照技术也太好了','已经在做攻略了','好想去啊',
                        '门票多少钱','自驾还是跟团','这个机位绝了',
                        '去过 确实值得一去','交通方便吗','种草了种草了'
                    ],
                    study: [
                        '收藏=学会（不是','马住了回头看','感谢大佬分享',
                        '这个方法我试过 真的有用','笔记做得好认真','学习了学习了',
                        '请问有完整版吗','太干货了','码住码住',
                        '考试前看到这个 救命了','分享给同学了','这个总结太到位了',
                        '大佬能出个系列吗','终于搞懂了','建议收藏吃灰（bushi'
                    ],
                    work: [
                        '打工人看哭了','太真实了 我也是这样','职场生存指南',
                        '已经在更新简历了','同事看了会沉默','领导看了会流泪',
                        '这不就是我吗','社畜共鸣了','下班了还要被戳到',
                        '明天就去和老板谈','互联网嘴替','说出了我不敢说的话',
                        '截图保存 明天给同事看','职场人必看','扎心了老铁'
                    ],
                    game: [
                        '这操作太秀了','大佬带带我','什么段位啊',
                        '手残党表示做不到','这游戏我也在玩！','氪了多少',
                        '肝帝本帝','这个版本太强了','求组队',
                        '我玩了三年了还是菜','攻略收藏了','这bug笑死我了',
                        '下载了下载了','画面好好看','等打折再入'
                    ],
                    general: [
                        '顶','前排','沙发','板凳','路过留个爪',
                        '不明觉厉','细说','有点意思','就离谱',
                        '懂的都懂','确实','真的假的','6','绝了',
                        '我悟了','好好好','啊这','可以可以',
                        '不错不错','有道理','学到了','涨知识了'
                    ]
                };

                // 关键词到分类的映射
                const COMMENT_KEYWORD_MAP = {
                    food: ['吃','美食','餐','饭','菜','火锅','奶茶','咖啡','蛋糕','面包','烧烤','外卖','厨房','做饭','食谱','好吃','饿','零食','甜品','料理','寿司','拉面','烘焙','下厨'],
                    tech: ['手机','电脑','app','数码','科技','软件','系统','更新','配置','苹果','安卓','平板','耳机','键盘','显卡','芯片','AI','编程','代码','开发'],
                    emotion: ['难过','伤心','分手','失恋','孤独','焦虑','压力','崩溃','emo','失眠','迷茫','累了','心情','感悟','人生','回忆','思念','遗憾','释怀','治愈'],
                    funny: ['搞笑','沙雕','哈哈','笑','段子','离谱','抽象','整活','迷惑','神评','乐子','鬼畜','梗','吐槽','脑洞'],
                    beauty: ['口红','化妆','护肤','穿搭','衣服','包包','鞋','发型','美甲','面膜','精华','防晒','底妆','眼影','香水','显瘦','时尚','潮流','搭配'],
                    pet: ['猫','狗','宠物','毛孩子','铲屎','喵','汪','萌宠','仓鼠','兔子','鹦鹉','养','可爱','小动物'],
                    travel: ['旅游','旅行','景点','酒店','民宿','攻略','打卡','风景','海边','山','古镇','出行','自驾','机票','签证','度假'],
                    study: ['学习','考试','考研','高考','笔记','复习','背书','知识','课程','教程','干货','论文','作业','大学','专业','技巧'],
                    work: ['工作','上班','加班','职场','同事','老板','工资','面试','简历','辞职','摸鱼','打工','社畜','内卷','躺平','996'],
                    game: ['游戏','steam','手游','端游','副本','段位','氪金','抽卡','角色','攻略','联机','开服','赛季','皮肤','装备']
                };

                // 评论风格随机变体
                const COMMENT_STYLE_MODIFIERS = [
                    text => text, // 原样
                    text => text, // 原样（增加概率）
                    text => text + ['！','！！','～','~','。','...','!!!'][Math.floor(Math.random()*7)],
                    text => text + ' ' + ['😂','🤣','😭','❤️','👍','🔥','💯','✨','🥺','😍','🤔','👀','💀','😅','🫠'][Math.floor(Math.random()*15)],
                    text => text.replace(/[！!]$/, '') + ['hhh','哈哈哈','2333','xswl','笑死'][Math.floor(Math.random()*5)],
                    text => (Math.random()>0.5 ? '哈哈 ' : '啊 ') + text,
                    text => text + (Math.random()>0.5 ? ' 真的' : ' 确实'),
                ];

                // 从文本中提取实体词（2-4字中文名词/短语）
                function extractEntities(text) {
                    if (!text) return [];
                    // 提取2-6字的中文词组（排除常见虚词和停用词）
                    const stopWords = new Set(['的','了','在','是','我','你','他','她','它','们','这','那','有','和','与','或','但','也','都','就','不','很','太','吗','呢','吧','啊','哦','嗯','会','能','要','可以','什么','怎么','为什么','因为','所以','如果','虽然','但是','而且','还是','已经','正在','一个','一些','这个','那个','自己','大家','今天','昨天','明天','现在','时候','地方','东西','事情','问题','觉得','知道','看到','感觉','开始','应该','可能','真的','其实','然后','之后','以后']);
                    const matches = text.match(/[\u4e00-\u9fa5]{2,6}/g) || [];
                    return matches.filter(w => !stopWords.has(w) && w.length >= 2).slice(0, 8);
                }

                // 根据帖子内容生成上下文相关的评论（带实体词注入）
                function generateContextualComment(title, content) {
                    const fullText = ((title || '') + ' ' + (content || '')).toLowerCase();
                    const entities = extractEntities((title || '') + ' ' + (content || ''));
                    // 匹配分类
                    let matchedCategories = [];
                    for (const [cat, keywords] of Object.entries(COMMENT_KEYWORD_MAP)) {
                        const matchCount = keywords.filter(kw => fullText.includes(kw)).length;
                        if (matchCount > 0) {
                            matchedCategories.push({ cat, score: matchCount });
                        }
                    }
                    matchedCategories.sort((a, b) => b.score - a.score);

                    let pool;
                    if (matchedCategories.length > 0) {
                        const r = Math.random();
                        if (r < 0.7) {
                            pool = FORUM_COMMENT_TEMPLATES[matchedCategories[0].cat];
                        } else if (r < 0.9 && matchedCategories.length > 1) {
                            pool = FORUM_COMMENT_TEMPLATES[matchedCategories[1].cat];
                        } else {
                            pool = FORUM_COMMENT_TEMPLATES.general;
                        }
                    } else {
                        pool = [...FORUM_COMMENT_TEMPLATES.general, ...FORUM_NPC_COMMENTS];
                    }

                    let comment = pool[Math.floor(Math.random() * pool.length)];
                    
                    // ★ 实体词注入：让评论引用帖子中的具体事物
                    if (entities.length > 0) {
                        const entity = entities[Math.floor(Math.random() * Math.min(entities.length, 4))];
                        const entityTemplates = [
                            `说到${entity}，${comment}`,
                            `${entity}${comment}`,
                            `${comment}，${entity}真的绝了`,
                            `关于${entity}，${comment}`,
                            `${entity}这个我也有话说，${comment}`,
                            `${comment} 话说${entity}确实`,
                            `${entity}！${comment}`,
                            `看到${entity}就进来了，${comment}`,
                        ];
                        // 50%概率注入实体词，50%保持原样（避免每条都带实体显得机械）
                        if (Math.random() < 0.5) {
                            comment = entityTemplates[Math.floor(Math.random() * entityTemplates.length)];
                        }
                    }
                    
                    // 应用随机风格变体
                    const modifier = COMMENT_STYLE_MODIFIERS[Math.floor(Math.random() * COMMENT_STYLE_MODIFIERS.length)];
                    comment = modifier(comment);
                    return comment;
                }
        
                function randomPick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
                // NPC Registry: random name + dynamic avatar (高随机性)
                function randomNPC() {
                    const name = FORUM_NPC_NAMES[Math.floor(Math.random() * FORUM_NPC_NAMES.length)];
                    // 70%概率动态生成全新头像，30%从固定池选取
                    const avatar = Math.random() < 0.7 ? generateRandomAvatar() : FORUM_NPC_AVATARS[Math.floor(Math.random() * FORUM_NPC_AVATARS.length)];
                    return { name, avatar };
                }
                function getNPCAvatar(name) {
                    // Generate a consistent avatar from name hash
                    let hash = 0;
                    for (let i = 0; i < name.length; i++) hash = ((hash << 5) - hash) + name.charCodeAt(i);
                    const style = FORUM_AVATAR_STYLES[Math.abs(hash) % FORUM_AVATAR_STYLES.length];
                    return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(name)}`;
                }

                function forumFeedSwitchTab(idx, el) {
                    forumFeedTab = idx;
                    document.querySelectorAll('.forum-feed-tab').forEach((t, i) => t.classList.toggle('active', i === idx));
                    renderForum();
                }
        
                // ========== FORUM: TAB SWITCHING ==========
                function forumSwitchTab(idx, el) {
                    const tabs = ['forum-tab-home', 'forum-tab-msg', 'forum-tab-me'];
                    tabs.forEach((id, i) => {
                        const t = document.getElementById(id);
                        if (t) t.classList.toggle('active', i === idx);
                    });
                    document.querySelectorAll('.forum-bottom-item').forEach((item, i) => item.classList.toggle('active', i === idx));
                    if (idx === 1) renderForumMsgTab();
                    if (idx === 2) renderForumMyTab();
                }
        
                // ========== FORUM: STAR (SAVE) ==========
                function toggleForumStar(postId) {
                    const post = ForumAPI.getPost(postId);
                    if (!post) return;
                    const starred = ForumAPI.toggleStar(postId);
                    if (starred && post.isMe) {
                        const npc = randomNPC();
                        addForumNotif('star', npc.name, npc.avatar, postId, '收藏了你的帖子');
                    }
                    renderForum();
                    if (activeForumPostId === postId) renderForumDetail(postId);
                }
        
                // ========== FORUM: REFRESH FEED (NPC POSTS + CONTACT POSTS) ==========
                async function forumRefreshFeed() {
                    _currentApiScene = 'forum';
                    if (typeof showPersistentLoading === 'function') showPersistentLoading('正在刷新帖子...');
                    const count = 10; // 固定生成10条帖子

                    // 使用当前板块的有效设置
                    const currentSection = getCurrentSection();
                    const effectiveSettings = getSectionEffectiveSettings(currentSection);
                    const targetSectionId = currentSection ? currentSection.id : null;
                    const sectionName = currentSection ? currentSection.name : '';
                    const sectionWorldview = effectiveSettings.customWorldview || '';
                    const sectionRules = effectiveSettings.customRules || '';

                    // 获取世界书上下文
                    let wbContext = '';
                    const linkedWbIds = effectiveSettings.linkedWorldbooks || [];
                    if (linkedWbIds.length > 0) {
                        const wbs = (store.worldbooks || []).filter(wb => linkedWbIds.includes(wb.id));
                        if (wbs.length > 0) wbContext = wbs.map(wb => `[${wb.name}]: ${wb.content}`).join('\n');
                    }

                    // 使用API批量生成帖子，失败直接报错
                    try {
                        const topicPool2 = [
                            '八卦娱乐','美食探店','动漫二次元','游戏','穿搭时尚','彩妆护肤','日常吐槽','旅行','宠物','数码科技',
                            '追星','健身运动','读书','摄影','音乐','职场','搞笑段子','情感树洞','校园生活','租房日记',
                            '理财投资','手工DIY','家居装修','汽车','母婴育儿','学习打卡','深夜食堂','周末计划','吐槽大会','好物分享',
                            '影视推荐','综艺安利','独居生活','社交恐惧','减肥日记','咖啡文化','露营野餐','二手闲置','职场吐槽','恋爱日常'
                        ];
                        // Fisher-Yates洗牌确保话题不重复
                        const shuffledTopics = [...topicPool2].sort(() => Math.random() - 0.5);
                        const selectedTopics = shuffledTopics.slice(0, count);
                        const wbHint = wbContext ? `\n世界观背景设定（帖子内容需融入此设定）：\n${wbContext}\n` : '';
                        // 收集用户联系人名字，明确禁止NPC提及
                        const _contactNames = (store.contacts || []).map(c => c.name).filter(Boolean);
                        const _contactNameHint = _contactNames.length > 0 ? `\n【绝对禁止】帖子内容中不得提及以下任何名字：${_contactNames.join('、')}。这些是用户的私人联系人，论坛NPC不可能认识他们。帖子必须是完全随机的互联网内容。` : '';
                        const sectionHint = sectionName ? `\n【当前板块】${sectionName}${sectionWorldview ? '\n【世界观】' + sectionWorldview : ''}${sectionRules ? '\n【板块规则】' + sectionRules : ''}\n帖子内容必须符合该板块的主题和世界观设定。` : '';
                        // 帖子热度等级决定评论条数（模拟真实论坛生态）
                        const heatLevels = selectedTopics.map(() => {
                            const r = Math.random();
                            if (r < 0.10) return { min: 6, max: 8, label: '爆款' };
                            if (r < 0.30) return { min: 3, max: 5, label: '热门' };
                            if (r < 0.65) return { min: 1, max: 3, label: '中等' };
                            if (r < 0.85) return { min: 0, max: 1, label: '普通' };
                            return { min: 0, max: 0, label: '冷门' };
                        });
                        const commentHints = heatLevels.map((h, i) => `帖子${i+1}(${h.label})：${h.min}-${h.max}条评论`).join('；');
                        const batchPrompt = `你是社交论坛内容生成器。一次性生成${count}条风格各异的帖子，每条帖子自带评论。${wbHint}${sectionHint}话题分别是：${selectedTopics.join('、')}。
要求：
1.每条帖子生成独特中文网名（风格多样：可爱萌系/搞笑沙雕/文艺清新/二次元/日常吐槽等，可带emoji，3-10字）
2.每条帖子风格、语气、长度有明显差异，模拟真实社交平台多样性
3.帖子内容必须是随机互联网话题，不能涉及任何特定角色或人物名字
4.⚠️每条帖子的comments中，每条评论必须针对该帖子的具体内容（引用帖子中的事物/观点/细节），严禁"写得好""不错"等万能评论
5.评论者网名必须与帖子作者不同，同帖评论者网名不重复
6.评论长度有变化(5-60字)，风格多样，30%的评论可互相回复(replyTo填已有评论者网名)
7.各帖评论条数：${commentHints}（冷门帖comments为空数组[]）
${_contactNameHint}
JSON输出：[{"name":"作者网名","title":"标题不超15字","content":"正文30-100字","comments":[{"name":"评论者网名","text":"评论内容","replyTo":null}]}] 共${count}条`;
                        const data2 = await API.chatCompletion([{role:'system',content:batchPrompt},{role:'user',content:'请生成帖子（含评论）'}]);
                        const replyText = data2.choices[0].message.content.trim();
                        const jsonMatch = replyText.match(/\[[\s\S]*\]/);
                        if (!jsonMatch) throw new Error('API返回格式错误');
                        const postsData = JSON.parse(jsonMatch[0]);
                        if (!Array.isArray(postsData) || postsData.length === 0) throw new Error('API返回数据为空');
                        // Remove old NPC posts before adding new ones to prevent duplicates
                        // When in a section, only remove NPC posts from that section
                        if (targetSectionId) {
                            store.forumPosts = (store.forumPosts || []).filter(p => p.isMe || p.isContact || p.isContactAccount || p.sectionId !== targetSectionId);
                        } else {
                            // 清理时保留最近的NPC帖子（数据清理：上限200条）
                            const npcPosts = (store.forumPosts || []).filter(p => !p.isMe && !p.isContact && !p.isContactAccount);
                            if (npcPosts.length > 200) {
                                const oldIds = new Set(npcPosts.sort((a,b) => a.time - b.time).slice(0, npcPosts.length - 200).map(p => p.id));
                                store.forumPosts = (store.forumPosts || []).filter(p => p.isMe || p.isContact || p.isContactAccount || !oldIds.has(p.id));
                            }
                            store.forumPosts = (store.forumPosts || []).filter(p => p.isMe || p.isContact || p.isContactAccount);
                        }
                        const createdPosts = [];
                        for (let i = 0; i < Math.min(postsData.length, count); i++) {
                            const pd = postsData[i];
                            // 优先使用AI生成的网名，fallback到随机NPC
                            const aiName = (pd.name || '').substring(0, 20);
                            const npc = aiName ? { name: aiName, avatar: generateRandomAvatar() } : randomNPC();
                            const title = (pd.title||'').substring(0,30); const content = (pd.content||'').substring(0,200);
                            if (!title||!content) continue;
                            const engagement = generateRealisticEngagement(title, content);
                            const postBaseTime = Date.now() - Math.floor(Math.random() * 3600000);
                            // 解析AI同生的评论，校验replyTo有效性，确保时间单调递增
                            const aiComments = Array.isArray(pd.comments) ? pd.comments : [];
                            const usedCommentNames = new Set();
                            const parsedComments = [];
                            aiComments.forEach((c, ci) => {
                                if (!c || typeof c !== 'object') return;
                                // 展平嵌套数组
                                const items = Array.isArray(c) ? c : [c];
                                items.forEach(item => {
                                    let cName = (item.name || '').substring(0, 20);
                                    // NPC名字同帖去重：重复则换随机NPC
                                    if (!cName || cName === npc.name || usedCommentNames.has(cName)) {
                                        let retries = 0;
                                        do { cName = randomNPC().name; retries++; } while ((cName === npc.name || usedCommentNames.has(cName)) && retries < 5);
                                    }
                                    usedCommentNames.add(cName);
                                    const commenter = { name: cName, avatar: generateRandomAvatar() };
                                    const commentObj = {
                                        id: 'c_' + Date.now() + '_' + ci + '_' + Math.random().toString(36).slice(2,6),
                                        name: commenter.name, avatar: commenter.avatar,
                                        text: (item.text || '').substring(0, 100),
                                        time: postBaseTime + (ci + 1) * 60000 // 时间单调递增，晚于帖子
                                    };
                                    // replyTo校验：必须是前面已出现的评论者名字
                                    if (item.replyTo && item.replyTo !== 'null' && item.replyTo !== null) {
                                        const validTarget = parsedComments.some(pc => pc.name === item.replyTo);
                                        if (validTarget) commentObj.replyTo = item.replyTo;
                                    }
                                    parsedComments.push(commentObj);
                                });
                            });
                            // AI没生成评论时就不塞本地兜底，留空comments
                            const postObj = {id:'fp_'+Date.now()+'_'+i+'_'+Math.random().toString(36).slice(2,6),title,content,author:npc.name,avatar:npc.avatar,time:postBaseTime,likes:engagement.likes,stars:[],comments:parsedComments,reposts:engagement.reposts,isMe:false,sectionId:targetSectionId||null};
                            ForumAPI.addPost(postObj); createdPosts.push(postObj);
                        }
                    } catch (e) {
                        if (typeof hidePersistentLoading === 'function') hidePersistentLoading();
                        toast('论坛帖子生成失败: '+e.message);
                        console.error('Forum refresh API error:',e);
                        renderForum();
                        return;
                    }
                    await generateForumContactPosts();
                    await generateNPCInteractionsAsync();
                    save();
                    if (typeof hidePersistentLoading === 'function') hidePersistentLoading();
                    renderForum();
                    toast('已刷新');
                }

                // ========== FORUM: GENERATE CONTACT POSTS ==========
                async function generateForumContactPosts() {
                    _currentApiScene = 'forum';
                    const settings = ForumAPI.getSettings();
                    const linkedIds = settings.linkedContacts || [];
                    if (linkedIds.length === 0) return;

                    // Get worldbook context
                    let wbContext = '';
                    const linkedWbIds = settings.linkedWorldbooks || [];
                    if (linkedWbIds.length > 0) {
                        const wbs = (store.worldbooks || []).filter(wb => linkedWbIds.includes(wb.id));
                        if (wbs.length > 0) wbContext = wbs.map(wb => `[${wb.name}]: ${wb.content}`).join('\n');
                    }

                    // Pick 1-2 random linked contacts to post
                    const shuffled = [...linkedIds].sort(() => Math.random() - 0.5);
                    const toPost = shuffled.slice(0, Math.min(2, shuffled.length));

                    for (const cid of toPost) {
                        const contact = store.contacts.find(c => c.id === cid);
                        if (!contact) continue;

                        // Try AI generation
                        try {
                            // 获取自定义世界观和规则
                            const customWorldview = settings.customWorldview || '';
                            const customRules = settings.customRules || '';
                            // 获取用户人设信息
                            const _userPersonaDesc = ForumAPI.getUserPersonaDesc();
                            const _userDisplayName = ForumAPI.getDisplayName();
                            
                            // [FIX-OOC] 增加聊天记录参考 + 强化人设约束 + 读取联系人自身世界书
                            let _contactWbContext = '';
                            if (contact.settings && contact.settings.mountedWbIds && store.worldbooks) {
                                const _cwbs = store.worldbooks.filter(wb => (contact.settings.mountedWbIds || []).includes(wb.id));
                                if (_cwbs.length > 0) _contactWbContext = _cwbs.map(wb => `[${wb.name}]: ${wb.content}`).join('\n');
                            }
                            const _chatHistory = (store.chats && store.chats[cid]) ? store.chats[cid].slice(-15) : [];
                            let _chatCtx = '';
                            if (_chatHistory.length > 0) {
                                _chatCtx = _chatHistory.map(m => `${m.sender === 'me' ? _userDisplayName : contact.name}: ${(m.content || '').substring(0, 80)}`).join('\n');
                            }
                            const sysPrompt = `【角色身份-最高优先级】你是${contact.name}。${contact.gender ? `性别：${contact.gender}。` : ''}
你的人设（必须严格遵守，绝对不能OOC）：${contact.persona || '普通人'}
⚠️ 你的一切言行、语气、用词都必须完全符合以上人设。绝对禁止脱离角色。

${_userPersonaDesc ? `【用户信息】用户名：${_userDisplayName}，用户人设：${_userPersonaDesc}\n` : ''}
${customWorldview ? `【论坛世界观】\n${customWorldview}\n` : ''}
${wbContext ? `【世界书设定】\n${wbContext}\n` : ''}
${_contactWbContext ? `【角色专属世界书】\n${_contactWbContext}\n` : ''}
${customRules ? `【论坛规则】\n${customRules}\n` : ''}
${_chatCtx ? `【你和${_userDisplayName}的近期聊天记录（参考说话风格和语气）】：\n${_chatCtx}\n` : ''}
请以${contact.name}的身份和口吻，写一条论坛帖子。帖子内容要符合你的人设${customWorldview || wbContext || _contactWbContext ? '、世界观设定' : ''}${customRules ? '和论坛规则' : ''}。
格式要求（严格遵守）：
第一行是标题（不超过15字）
第二行开始是正文内容（30-80字）
不要加任何标签、前缀或格式符号。`;

                            const data = await API.chatCompletion([
                                { role: 'system', content: sysPrompt },
                                { role: 'user', content: '请发一条帖子' }
                            ]);
                            const reply = data.choices[0].message.content.trim();
                            const lines = reply.split('\n').filter(l => l.trim());
                            const title = lines[0] || `${contact.name}的动态`;
                            const content = lines.slice(1).join('\n') || reply;

                            const contactPostId = 'fp_c_' + Date.now() + '_' + cid + '_' + Math.random().toString(36).slice(2,6);
                            const contactPostTime = Date.now() - Math.floor(Math.random() * 1800000);
                            ForumAPI.addPost({
                                id: contactPostId,
                                title: title.substring(0, 30),
                                content: content.substring(0, 200),
                                author: contact.name,
                                avatar: contact.avatar || _ph(36),
                                time: contactPostTime,
                                likes: [],
                                stars: [],
                                comments: [],
                                isMe: false,
                                isContact: true,
                                contactId: cid
                            });

                            // ★ 联系人帖子也触发NPC评论（2-5条）+ 点赞
                            try {
                                const _contactPost = ForumAPI.getPost(contactPostId);
                                if (_contactPost) {
                                    const npcCommentCount = 2 + Math.floor(Math.random() * 4);
                                    const _npcs = [];
                                    const _usedNames = new Set([contact.name]);
                                    for (let ni = 0; ni < npcCommentCount; ni++) {
                                        let _npc;
                                        let _retries = 0;
                                        do { _npc = randomNPC(); _retries++; } while (_usedNames.has(_npc.name) && _retries < 5);
                                        _usedNames.add(_npc.name);
                                        _npcs.push(_npc);
                                    }
                                    try {
                                        const _npcNames = _npcs.map(n => n.name).join('、');
                                        // [FIX-论坛评论相关性] 强化prompt：要求引用帖子原文关键词
                                        const _cData = await API.chatCompletion([
                                            { role: 'system', content: `你是论坛评论生成器。${npcCommentCount}个用户（${_npcNames}）对一条帖子评论。

⚠️⚠️【最重要的规则】每条评论必须包含帖子中出现的至少1个具体名词/关键词（如人名、地名、事物名、数字等），证明评论者确实读了帖子。
❌ 禁止的万能评论："写得好""不错""赞同""哈哈""说得对" — 这些评论完全不提帖子内容，是无效评论。
✅ 好的评论示例：如果帖子提到"奶茶"，评论应该说"这家奶茶我也喝过，芋泥的最好喝"

要求：
1. 每条评论必须回应帖子中的某个具体事物/观点/细节
2. 评论中必须出现帖子里的关键词（直接引用或转述）
3. 长度有变化(10-60字)
4. 部分评论互相回复(replyTo填已有评论者名字)
5. 风格多样：吐槽/共鸣/提问/补充/反驳
JSON：[{"name":"用户名","text":"评论","replyTo":null}]` },
                                            { role: 'user', content: `【帖子标题】${title}\n【帖子正文】${content}\n\n请针对以上帖子的具体内容生成${npcCommentCount}条评论，每条必须引用帖子中的具体内容：` }
                                        ]);
                                        const _cReply = (_cData.choices[0].message.content || '').trim();
                                        const _cMatch = _cReply.match(/\[[\s\S]*\]/);
                                        if (_cMatch) {
                                            const _comments = JSON.parse(_cMatch[0]);
                                            _comments.forEach((c, ci) => {
                                                const _npc = _npcs[ci] || randomNPC();
                                                const _cObj = { name: _npc.name, avatar: _npc.avatar, text: (c.text || '').substring(0, 100), time: contactPostTime + (ci + 1) * 60000 };
                                                // replyTo校验
                                                if (c.replyTo && c.replyTo !== 'null' && c.replyTo !== null) {
                                                    const _valid = _contactPost.comments.some(pc => pc.name === c.replyTo);
                                                    if (_valid) _cObj.replyTo = c.replyTo;
                                                }
                                                _contactPost.comments.push(_cObj);
                                                if (!_contactPost.likes.includes(_npc.name)) _contactPost.likes.push(_npc.name);
                                            });
                                        }
                                    } catch (_commentErr) {
                                        // [FIX-联系人帖子评论] API失败时生成本地兜底评论，确保帖子不会空评论
                                        console.warn('[Forum] NPC评论生成失败，使用本地兜底:', _commentErr);
                                        const _fallbackTemplates = [
                                            '这个说的是{kw}吧？我也有类似的经历',
                                            '{kw}确实挺有意思的，之前也听说过',
                                            '关于{kw}我有不同看法，不过也能理解',
                                            '哈哈{kw}这个我太有共鸣了',
                                            '说到{kw}，让我想起了之前的事'
                                        ];
                                        // 从标题和内容中提取关键词
                                        const _kwPool = (title + ' ' + content).replace(/[，。！？、\s]+/g, ' ').split(' ').filter(w => w.length >= 2 && w.length <= 8);
                                        const _kw = _kwPool.length > 0 ? _kwPool[Math.floor(Math.random() * _kwPool.length)] : '这个';
                                        _npcs.slice(0, 2).forEach((npc, ci) => {
                                            const tpl = _fallbackTemplates[ci % _fallbackTemplates.length];
                                            _contactPost.comments.push({
                                                name: npc.name, avatar: npc.avatar,
                                                text: tpl.replace('{kw}', _kw),
                                                time: contactPostTime + (ci + 1) * 60000
                                            });
                                            if (!_contactPost.likes.includes(npc.name)) _contactPost.likes.push(npc.name);
                                        });
                                    }
                                    // 额外点赞（2-4个NPC）
                                    const _extraLikes = 2 + Math.floor(Math.random() * 3);
                                    for (let li = 0; li < _extraLikes; li++) {
                                        const _likeNpc = randomNPC();
                                        if (!_contactPost.likes.includes(_likeNpc.name)) _contactPost.likes.push(_likeNpc.name);
                                    }
                                }
                            } catch (_npcErr) { console.warn('联系人帖子NPC互动失败:', _npcErr); }

                        } catch (e) {
                            console.error('联系人帖子生成失败:', e);
                            toast(contact.name + '的帖子生成失败: ' + e.message);
                        }
                    }
                    save();
                    renderForum();
                }
        
                function generateNPCInteractions() {
                    const myPosts = ForumAPI.getMyPosts();
                    if (myPosts.length === 0) return;
                    const likeRounds = 1 + Math.floor(Math.random() * 3);
                    for (let i = 0; i < likeRounds; i++) {
                        if (Math.random() > 0.3) {
                            const post = randomPick(myPosts);
                            const npc = randomNPC();
                            if (!post.likes) post.likes = [];
                            if (!post.likes.includes(npc.name)) {
                                post.likes.push(npc.name);
                                addForumNotif('like', npc.name, npc.avatar, post.id, '赞了你的帖子');
                            }
                        }
                    }
                    const commentRounds = 1 + Math.floor(Math.random() * 2);
                    for (let i = 0; i < commentRounds; i++) {
                        if (Math.random() > 0.4) {
                            const post = randomPick(myPosts);
                            const npc = randomNPC();
                            const text = generateContextualComment(post.title, post.content);
                            if (!post.comments) post.comments = [];
                            post.comments.push({ name: npc.name, avatar: npc.avatar, text, time: Date.now() });
                            addForumNotif('comment', npc.name, npc.avatar, post.id, text);
                        }
                    }
                    if (Math.random() > 0.5) {
                        const post = randomPick(myPosts);
                        const npc = randomNPC();
                        if (!post.stars) post.stars = [];
                        if (!post.stars.includes(npc.name)) {
                            post.stars.push(npc.name);
                            addForumNotif('star', npc.name, npc.avatar, post.id, '收藏了你的帖子');
                        }
                    }
                    if (Math.random() > 0.5) {
                        const npc = randomNPC();
                        addForumNotif('follow', npc.name, npc.avatar, null, '关注了你');
                    }
                    if (Math.random() > 0.5) {
                        const npc = randomNPC();
                        const msgs = ['你好呀~','看了你的帖子，写得真好！','可以交个朋友吗？','你的帖子太有意思了','想请教你一个问题','最近在忙什么呀？'];
                        addForumDM(npc.name, npc.avatar, randomPick(msgs));
                    }
                    updateForumMsgDot();
                }

                // Async version: NPC comments and DMs generated via API
                async function generateNPCInteractionsAsync() {
                    const myPosts = ForumAPI.getMyPosts();
                    if (myPosts.length === 0) return;
                    // Random likes (1-3)
                    const likeRounds = 1 + Math.floor(Math.random() * 3);
                    for (let i = 0; i < likeRounds; i++) {
                        if (Math.random() > 0.3) {
                            const post = randomPick(myPosts);
                            const npc = randomNPC();
                            if (!post.likes) post.likes = [];
                            if (!post.likes.includes(npc.name)) {
                                post.likes.push(npc.name);
                                addForumNotif('like', npc.name, npc.avatar, post.id, '赞了你的帖子');
                            }
                        }
                    }
                    // Random comments via API (1-3) with NPC-to-NPC interactions
                    const commentRounds = 1 + Math.floor(Math.random() * 3);
                    let _apiFailedOnce = false;
                    for (let i = 0; i < commentRounds; i++) {
                        if (Math.random() > 0.3) {
                            const post = randomPick(myPosts);
                            const npc = randomNPC();
                            // NPC名字去重：不能与帖子作者或已有评论者重名
                            const _existingNames = new Set([post.author, ...(post.comments||[]).map(c => c.name), ForumAPI.getDisplayName()]);
                            let _actualNpc = npc; let _r = 0;
                            while (_existingNames.has(_actualNpc.name) && _r < 5) { _actualNpc = randomNPC(); _r++; }
                            const existingComments = (post.comments || []).slice(-5);
                            const existingContext = existingComments.length > 0 ? `\n已有评论：\n${existingComments.map(c => `${c.name}: ${c.text}`).join('\n')}` : '';
                            const _commentLen2 = Math.random();
                            const _lenHint2 = _commentLen2 < 0.3 ? '很短的（5-10字）' : _commentLen2 < 0.7 ? '中等长度的（15-30字）' : '较长的（30-60字，分享经历或看法）';
                            // 决定是回复帖子还是回复其他评论者
                            const shouldReplyToComment = existingComments.length > 0 && Math.random() > 0.5;
                            let text, replyTo = null;
                            try {
                                let sysContent;
                                if (shouldReplyToComment) {
                                    const targetComment = existingComments[Math.floor(Math.random() * existingComments.length)];
                                    replyTo = targetComment.name;
                                    sysContent = `你是论坛用户${_actualNpc.name}，回复"${targetComment.name}"的评论"${targetComment.text}"。写一条${_lenHint2}回复，必须结合帖子内容来回应，不要泛泛而谈。不要加前缀。`;
                                } else {
                                    sysContent = `你是论坛用户${_actualNpc.name}，对以下帖子写一条${_lenHint2}评论。⚠️必须针对帖子中提到的具体内容来评论，禁止"写得好""不错"等万能评论。不要加前缀。`;
                                }
                                const cData = await API.chatCompletion([
                                    { role: 'system', content: sysContent },
                                    { role: 'user', content: `【帖子标题】${post.title}\n【帖子正文】${post.content}${existingContext}\n\n请针对帖子具体内容评论：` }
                                ]);
                                text = (cData.choices[0].message.content || '').trim().substring(0, 100);
                            } catch (e) {
                                text = generateContextualComment(post.title, post.content);
                                _apiFailedOnce = true;
                            }
                            if (!post.comments) post.comments = [];
                            // 时间：严格晚于最新评论和帖子时间
                            const _latestTime = Math.max(post.time || 0, ...(post.comments.map(c => c.time || 0)));
                            const commentObj = { name: _actualNpc.name, avatar: _actualNpc.avatar, text, time: _latestTime + 60000 + Math.floor(Math.random() * 30000) };
                            // replyTo校验：必须是该帖子已有的评论者
                            if (replyTo && (post.comments || []).some(c => c.name === replyTo)) {
                                commentObj.replyTo = replyTo;
                            }
                            post.comments.push(commentObj);
                            addForumNotif('comment', _actualNpc.name, _actualNpc.avatar, post.id, text);
                        }
                    }
                    if (_apiFailedOnce) toast('部分NPC评论用本地生成');
                    // Random stars
                    if (Math.random() > 0.5) {
                        const post = randomPick(myPosts);
                        const npc = randomNPC();
                        if (!post.stars) post.stars = [];
                        if (!post.stars.includes(npc.name)) {
                            post.stars.push(npc.name);
                            addForumNotif('star', npc.name, npc.avatar, post.id, '收藏了你的帖子');
                        }
                    }
                    // Random follow
                    if (Math.random() > 0.5) {
                        const npc = randomNPC();
                        addForumNotif('follow', npc.name, npc.avatar, null, '关注了你');
                    }
                    // Random DM via API
                    if (Math.random() > 0.5) {
                        const npc = randomNPC();
                        let dmText;
                        try {
                            const dData = await API.chatCompletion([
                                { role: 'system', content: `你是论坛用户${npc.name}，请写一条简短的私信（10-20字），友好自然，像真人发消息。不要加前缀。` },
                                { role: 'user', content: '请发一条私信' }
                            ]);
                            dmText = dData.choices[0].message.content.trim().substring(0, 40);
                        } catch (e) {
                            const msgs = ['你好呀~','看了你的帖子，写得真好！','可以交个朋友吗？','你的帖子太有意思了','想请教你一个问题','最近在忙什么呀？'];
                            dmText = randomPick(msgs);
                        }
                        addForumDM(npc.name, npc.avatar, dmText);
                    }
                    updateForumMsgDot();
                }
        
                // ========== FORUM: NOTIFICATIONS ==========
                function addForumNotif(type, name, avatar, postId, text) {
                    const accountId = ForumAPI.getCurrentAccountId();
                    ForumAPI.addNotif({
                        id: 'fn_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
                        type, name, avatar, postId, text,
                        time: Date.now(),
                        read: false,
                        accountId: accountId || null
                    });
                }
        
                function updateForumMsgDot() {
                    const unread = ForumAPI.getUnreadCount();
                    const dmUnread = ForumAPI.getDMUnreadCount();
                    const dot = document.getElementById('forum-msg-dot');
                    if (dot) dot.style.display = (unread + dmUnread) > 0 ? '' : 'none';
                    // Update badges
                    ['like','comment','star','follow'].forEach(type => {
                        const badge = document.getElementById('forum-badge-' + type);
                        if (badge) {
                            const c = ForumAPI.getNotifs(type).filter(n => !n.read).length;
                            badge.textContent = c > 0 ? c : '';
                            badge.style.display = c > 0 ? '' : 'none';
                        }
                    });
                }
        
                function forumShowNotifType(type) {
                    activeForumNotifType = type;
                    const typeNames = { like: '赞', comment: '评论', star: '收藏', follow: '关注' };
                    document.getElementById('forum-notif-title').textContent = typeNames[type] || '通知';
                    const list = document.getElementById('forum-notif-detail-list');
                    const notifs = ForumAPI.getNotifs(type);
                    // Mark as read
                    notifs.forEach(n => n.read = true);
                    save();
                    updateForumMsgDot();
                    if (notifs.length === 0) {
                        list.innerHTML = '<div style="text-align:center; padding:40px; color:#bbb;">暂无通知</div>';
                    } else {
                        list.innerHTML = notifs.map(n => `
                            <div class="forum-notif-card" ${n.postId ? `onclick="openForumPost('${n.postId}')"` : ''}>
                                <img src="${n.avatar}" style="width:40px; height:40px; border-radius:50%; margin-right:10px;">
                                <div style="flex:1;">
                                    <div style="font-weight:600; font-size:14px;">${escapeHtml(n.name)}</div>
                                    <div style="font-size:13px; color:#666; margin-top:2px;">${escapeHtml(n.text)}</div>
                                    <div style="font-size:12px; color:#aaa; margin-top:4px;">${formatForumTime(n.time)}</div>
                                </div>
                            </div>
                        `).join('');
                    }
                    document.getElementById('layer-forum-notif').classList.add('show');
                }
        
                // ========== FORUM: MSG TAB ==========
                function renderForumMsgTab() {
                    updateForumMsgDot();
                    // Render DM list
                    const dmList = document.getElementById('forum-dm-list');
                    if (!dmList) return;
                    // [FIX] 合并同名同账号的重复私信（修复 dm_contact_ 和 dm_ 两种key导致的重复）
                    _mergeForumDuplicateDMs();
                    const dms = ForumAPI.getDMs();
                    const currentAccountId = ForumAPI.getCurrentAccountId();
                    // 按当前账号过滤私信：只显示属于当前账号（或无账号标记）的私信
                    const keys = Object.keys(dms).filter(k => {
                        const dm = dms[k];
                        if (currentAccountId) return dm.accountId === currentAccountId;
                        return !dm.accountId; // 主号只看没有accountId标记的
                    }).sort((a, b) => {
                        const lastA = dms[a].msgs?.length ? dms[a].msgs[dms[a].msgs.length - 1].time : 0;
                        const lastB = dms[b].msgs?.length ? dms[b].msgs[dms[b].msgs.length - 1].time : 0;
                        return lastB - lastA;
                    });
                    if (keys.length === 0) {
                        dmList.innerHTML = '<div style="text-align:center; padding:20px; color:#bbb; font-size:14px;">暂无私信</div>';
                    } else {
                        dmList.innerHTML = keys.map(k => {
                            const dm = dms[k];
                            const last = dm.msgs?.length ? dm.msgs[dm.msgs.length - 1] : null;
                            return `
                                <div class="forum-dm-item" onclick="openForumDM('${k}')">
                                    <div class="forum-dm-item-avatar-wrap">
                                        <img src="${dm.avatar || _ph(40)}">
                                        ${(dm.msgs || []).some(msg => !msg.isMe && !msg.read) ? '<div class="forum-dm-item-unread-dot"></div>' : ''}
                                    </div>
                                    <div class="forum-dm-item-info">
                                        <div class="forum-dm-item-top">
                                            <div class="forum-dm-item-name">${escapeHtml(dm.name)}</div>
                                            <div class="forum-dm-item-time">${last ? formatForumTime(last.time) : ''}</div>
                                        </div>
                                        <div class="forum-dm-item-last">${last ? escapeHtml(last.text) : ''}</div>
                                    </div>
                                </div>
                            `;
                        }).join('');
                    }
                }

                // ========== FORUM: REFRESH DMs (刷新私信 - 模拟真实网络环境) ==========
                async function forumRefreshDMs() {
                    const btn = document.getElementById('forum-dm-refresh-btn');
                    if (btn) btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 刷新中...';
                    if (btn) btn.style.pointerEvents = 'none';

                    try {
                        _currentApiScene = 'forum';
                        const myPosts = ForumAPI.getMyPosts();
                        const allPosts = ForumAPI.getPosts();
                        const myDisplayName = ForumAPI.getDisplayName();
                        const myComments = allPosts.flatMap(p => (p.comments || []).filter(c => c.name === myDisplayName));
                        const hasActivity = myPosts.length > 0 || myComments.length > 0;

                        const dmCount = 1 + Math.floor(Math.random() * 3); // 1-3条新私信

                        for (let i = 0; i < dmCount; i++) {
                            const npc = window.randomNPC();
                            let dmText;

                            if (!hasActivity) {
                                // 没发过帖子和评论 → 广告推销、骚扰、垃圾消息
                                try {
                                    const data = await API.chatCompletion([
                                        { role: 'system', content: `你是一个论坛上的随机用户"${npc.name}"，给一个从没发过帖子的新用户发私信。
要求：模拟真实网络环境中新用户会收到的私信类型。请从以下类型中随机选一种：
1. 广告推销（卖课、兼职、代购、游戏代练、刷单等）
2. 微商推销（护肤品、减肥产品等）
3. 诈骗引流（加微信有福利、免费领取等）
4. 无聊搭讪（你好在吗、交个朋友吧等）
5. 机器人群发（恭喜您中奖、系统通知等）
6. 让人不舒服的骚扰（不要太过分，但要体现网络环境的混乱）
写一条15-40字的私信，直接写内容，不要加前缀，要像真人/机器人发的消息。` },
                                        { role: 'user', content: '请发一条私信' }
                                    ]);
                                    dmText = (data.choices[0].message.content || '').trim().substring(0, 60);
                                } catch(e) {
                                    const spamMsgs = [
                                        '在吗？日入500+的兼职了解一下，加我V：xxxx888',
                                        '恭喜您被选中参与幸运抽奖！点击链接领取奖品→',
                                        '亲，我们这边有最新款护肤品，要不要看看～',
                                        '你好在吗？看你头像觉得你人很好，可以认识一下吗',
                                        '【系统通知】您的账号存在安全风险，请点击验证',
                                        '免费送游戏皮肤！加群就送！群号：12345',
                                        '代写论文、代做作业，价格优惠，保证质量！',
                                        '宝子，我们群里每天分享优惠券，省钱必备！进群加v',
                                        '约吗？同城交友，加我私聊～'
                                    ];
                                    dmText = randomPick(spamMsgs);
                                }
                            } else {
                                // 有帖子和评论 → 多样化私信（广告、共情、夸奖、辱骂、讨论等）
                                const recentPost = myPosts.length > 0 ? myPosts[0] : null;
                                const recentComment = myComments.length > 0 ? myComments[myComments.length - 1] : null;
                                const contextInfo = recentPost
                                    ? `用户最近发的帖子标题：${recentPost.title}，内容：${(recentPost.content || '').substring(0, 100)}`
                                    : (recentComment ? `用户最近评论了："${recentComment.text}"` : '用户有一些论坛活动记录');

                                try {
                                    const dmType = Math.random();
                                    let typeHint;
                                    if (dmType < 0.12) typeHint = '广告推销（微商、兼职、代购等无关推销，完全无视帖子内容）';
                                    else if (dmType < 0.27) typeHint = '共情/表示理解（看了用户帖子后产生共鸣，分享自己类似经历）';
                                    else if (dmType < 0.45) typeHint = '夸奖/表扬（真诚或敷衍地赞美用户的帖子或观点）';
                                    else if (dmType < 0.57) typeHint = '辱骂/攻击（对用户帖子或观点表示强烈不满，用冲的语气，像真实喷子）';
                                    else if (dmType < 0.68) typeHint = '提问/请教（对用户帖子中的某个观点感兴趣，想深入了解）';
                                    else if (dmType < 0.78) typeHint = '反驳/争论（礼貌或不礼貌地对用户观点提出异议）';
                                    else if (dmType < 0.87) typeHint = '搭讪/交友（想和用户做朋友、约线下见面等）';
                                    else if (dmType < 0.94) typeHint = '阴阳怪气/讽刺（用看似夸奖实则嘲讽的方式评价用户，让人气但不好发作）';
                                    else typeHint = '无脑复读/表情包党（就回复一些"哈哈哈哈"、"6"、"绝了"之类无意义内容）';

                                    const data = await API.chatCompletion([
                                        { role: 'system', content: `你是论坛用户"${npc.name}"，给另一个用户发一条私信。
私信类型：${typeHint}
${contextInfo}
要求：写一条15-50字的私信，必须像真人发消息一样自然。不要加前缀、不要加引号。内容要结合用户的帖子/评论内容来写，让人觉得是真的看了帖子后才发的（除非是广告推销类，那就完全无视帖子内容）。` },
                                        { role: 'user', content: '请发一条私信' }
                                    ]);
                                    dmText = (data.choices[0].message.content || '').trim().replace(/^["'"'"]+|["'"'"]+$/g, '').substring(0, 60);
                                } catch(e) {
                                    const variedMsgs = [
                                        '你帖子写得不错诶，我也有类似的经历',
                                        '看了你帖子想说几句，你说的完全不对好吧',
                                        '哈喽～看你经常发帖，感觉你人挺好的',
                                        '就你这水平也好意思发帖？建议多读点书',
                                        '你好，看了你的帖子很有感触，想跟你聊聊',
                                        '在吗在吗？有个兼职推荐给你，日入300+',
                                        '说实话你那帖子我看了三遍，太真实了',
                                        '笑死，你说的也叫观点？回去重学吧',
                                        '加个好友呗，感觉咱俩能聊到一块去',
                                        '666 你这帖子绝了'
                                    ];
                                    dmText = randomPick(variedMsgs);
                                }
                            }

                            if (dmText) addForumDM(npc.name, npc.avatar, dmText);
                        }

                        save();
                        renderForumMsgTab();
                        updateForumMsgDot();
                        toast('收到 ' + dmCount + ' 条新私信');
                    } catch(e) {
                        console.error('刷新私信失败:', e);
                        toast('刷新私信失败: ' + e.message);
                    }

                    if (btn) { btn.innerHTML = '<i class="fas fa-sync-alt"></i> 刷新私信'; btn.style.pointerEvents = ''; }
                }
                window.forumRefreshDMs = forumRefreshDMs;
        
                // [FIX] 合并重复的DM会话（同名+同账号但不同key的情况）
                function _mergeForumDuplicateDMs() {
                    if (!store.forumDMs) return;
                    const dms = store.forumDMs;
                    const seen = {}; // key: "name|accountId" -> primary dmKey
                    const toDelete = [];
                    for (const k in dms) {
                        const dm = dms[k];
                        const sig = (dm.name || '') + '|' + (dm.accountId || '');
                        if (seen[sig]) {
                            // 合并消息到主会话
                            const primary = dms[seen[sig]];
                            const existingTimes = new Set((primary.msgs || []).map(m => m.time + '|' + m.text));
                            (dm.msgs || []).forEach(m => {
                                const mSig = m.time + '|' + m.text;
                                if (!existingTimes.has(mSig)) {
                                    primary.msgs.push(m);
                                }
                            });
                            // 按时间排序
                            primary.msgs.sort((a, b) => a.time - b.time);
                            // 使用较新的头像
                            if (dm.avatar && dm.avatar !== _ph(36)) {
                                primary.avatar = dm.avatar;
                            }
                            toDelete.push(k);
                        } else {
                            seen[sig] = k;
                        }
                    }
                    if (toDelete.length > 0) {
                        toDelete.forEach(k => delete store.forumDMs[k]);
                        save();
                    }
                }

                // ========== FORUM: DM ==========
                function addForumDM(name, avatar, text) {
                    ForumAPI.addDM(name, avatar, text);
                }
        
                function openForumDM(dmId) {
                    activeForumDMId = dmId;
                    const dm = ForumAPI.getDM(dmId);
                    if (!dm) return;
                    document.getElementById('forum-dm-chat-name').textContent = dm.name;
                    // Mark all as read
                    (dm.msgs || []).forEach(m => { if (!m.isMe) m.read = true; });
                    save();
                    updateForumMsgDot();
                    renderForumMsgTab();
                    renderForumDMChat();
                    document.getElementById('layer-forum-dm').classList.add('show');
                }
        
                function renderForumDMChat(animateLast) {
                    const dm = ForumAPI.getDM(activeForumDMId);
                    if (!dm) return;
                    const body = document.getElementById('forum-dm-chat-body');
                    const msgs = dm.msgs || [];
                    body.innerHTML = msgs.map((m, idx) => {
                        const time = m.time ? new Date(m.time) : null;
                        const timeStr = time ? `${time.getHours().toString().padStart(2,'0')}:${time.getMinutes().toString().padStart(2,'0')}` : '';
                        const isLast = idx === msgs.length - 1;
                        const animClass = (animateLast && isLast) ? ' forum-dm-bubble-anim' : '';
                        return `
                        <div style="display:flex; flex-direction:column; align-items:${m.isMe ? 'flex-end' : 'flex-start'}; margin-bottom:14px;">
                            ${timeStr ? `<div style="font-size:11px; color:#b0b0b0; margin-bottom:6px;">${timeStr}</div>` : ''}
                            <div class="${animClass}" style="display:flex; ${m.isMe ? 'flex-direction:row-reverse;' : ''} align-items:flex-start; max-width:82%;">
                                <img src="${m.isMe ? (m.senderAvatar || ForumAPI.getDisplayAvatar()) : (dm.avatar || _ph(36))}" style="width:32px; height:32px; min-width:32px; min-height:32px; max-width:32px; max-height:32px; border-radius:50%; object-fit:cover; ${m.isMe ? 'margin-left:8px;' : 'margin-right:8px;'} flex-shrink:0;">
                                <div style="padding:10px 14px; border-radius:${m.isMe ? '16px 4px 16px 16px' : '4px 16px 16px 16px'}; ${m.isMe ? 'background:var(--primary); color:#fff;' : 'background:#fff; color:#333;'} font-size:14px; line-height:1.6; box-shadow:0 1px 3px rgba(0,0,0,0.06); word-break:break-word;">
                                    ${escapeHtml(m.text)}
                                </div>
                            </div>
                        </div>`;
                    }).join('');
                    body.scrollTop = body.scrollHeight;
                }

                // Show/hide forum DM typing indicator
                function showForumDMTyping(show, avatar) {
                    const el = document.getElementById('forum-dm-typing');
                    const avatarEl = document.getElementById('forum-dm-typing-avatar');
                    if (!el) return;
                    if (avatar && avatarEl) avatarEl.src = avatar;
                    if (show) {
                        el.classList.add('show');
                        // Scroll chat body to bottom
                        const body = document.getElementById('forum-dm-chat-body');
                        if (body) body.scrollTop = body.scrollHeight;
                    } else {
                        el.classList.remove('show');
                    }
                }
        
                function forumSendDM() {
                    const input = document.getElementById('forum-dm-input');
                    const text = input.value.trim();
                    if (!text || !activeForumDMId) return;
                    const dm = ForumAPI.getDM(activeForumDMId);
                    if (!dm) return;
                    dm.msgs.push({ text, time: Date.now(), isMe: true, read: true, senderAvatar: ForumAPI.getDisplayAvatar() });
                    input.value = '';
                    save();
                    renderForumDMChat(true);
                    // Show typing indicator
                    const dmAvatar = dm.avatar || _ph(28);
                    showForumDMTyping(true, dmAvatar);
                    // NPC auto-reply after 1s
                    setTimeout(() => {
                        showForumDMTyping(false);
                        const replies = ['好的~','哈哈','嗯嗯','收到！','有道理','我也觉得','太棒了','下次聊~','好呀好呀','了解了'];
                        dm.msgs.push({ text: randomPick(replies), time: Date.now(), isMe: false, read: true });
                        save();
                        renderForumDMChat(true);
                    }, 800 + Math.random() * 1200);
                }
        
                // ========== FORUM: DETAIL (enhanced) ==========
                function forumDetailLike() {
                    if (!activeForumPostId) return;
                    toggleForumLike(activeForumPostId);
                    renderForumDetail(activeForumPostId);
                }
        
                function forumDetailStar() {
                    if (!activeForumPostId) return;
                    toggleForumStar(activeForumPostId);
                    renderForumDetail(activeForumPostId);
                }
        
                // Override renderForumDetail to update bottom bar icons too
                const _origRenderForumDetail = renderForumDetail;
                function renderForumDetailEnhanced(postId) {
                    _origRenderForumDetail(postId);
                    const post = ForumAPI.getPost(postId);
                    if (!post) return;
                    const likeIcon = document.getElementById('forum-detail-like-icon');
                    const likeCount = document.getElementById('forum-detail-like-count');
                    const starIcon = document.getElementById('forum-detail-star-icon');
                    if (likeIcon) {
                        const isLiked = (post.likes || []).includes(ForumAPI._meId());
                        likeIcon.className = isLiked ? 'fas fa-heart' : 'far fa-heart';
                        likeIcon.style.color = isLiked ? '#e74c3c' : '';
                    }
                    if (likeCount) likeCount.textContent = (post.likes || []).length || '';
                    if (starIcon) {
                        const isStarred = (post.stars || []).includes(ForumAPI._meId());
                        starIcon.className = isStarred ? 'fas fa-star' : 'far fa-star';
                        starIcon.style.color = isStarred ? '#f5a623' : '';
                    }
                }
                // Replace the original
                renderForumDetail = renderForumDetailEnhanced;
        
                // ========== FORUM: PROFILE ==========
                function initForumProfile() {
                    const p = ForumAPI.getProfile();
                    const avatarEl = document.getElementById('forum-my-avatar');
                    const nameEl = document.getElementById('forum-my-name');
                    const bioEl = document.getElementById('forum-my-bio');
                    const bgEl = document.getElementById('forum-profile-bg');
                    if (avatarEl) avatarEl.src = ForumAPI.getDisplayAvatar();
                    if (nameEl) nameEl.textContent = ForumAPI.getDisplayName();
                    if (bioEl) bioEl.textContent = p.bio || '点击编辑个人简介';
                    if (bgEl && p.bgImage) {
                        bgEl.style.background = `url(${p.bgImage}) center/cover`;
                    }
                    // Show alt account indicator
                    if (ForumAPI.isAltAccount()) {
                        const acc = ForumAPI.getCurrentAccount();
                        if (acc && acc.isContactAccount) {
                            if (nameEl) nameEl.innerHTML = ForumAPI.getDisplayName() + ' <span style="font-size:11px; color:#4caf50; background:rgba(76,175,80,0.1); padding:1px 6px; border-radius:8px; margin-left:4px;">联系人</span>';
                        } else {
                            if (nameEl) nameEl.innerHTML = ForumAPI.getDisplayName() + ' <span style="font-size:11px; color:var(--primary); background:rgba(102,126,234,0.1); padding:1px 6px; border-radius:8px; margin-left:4px;">小号</span>';
                        }
                    }
                }
        
                function forumEditProfile() {
                    const p = ForumAPI.getProfile();
                    document.getElementById('forum-edit-avatar').src = p.avatar || store.user.avatar || _ph(80);
                    document.getElementById('forum-edit-name').value = p.name || store.user.name || '';
                    document.getElementById('forum-edit-bio').value = p.bio || '';
                    document.getElementById('forum-edit-gender').value = p.gender || '';
                    document.getElementById('forum-edit-location').value = p.location || '';
                    const sigEl = document.getElementById('forum-edit-signature');
                    if (sigEl) sigEl.value = p.signature || '';
                    document.getElementById('modal-forum-profile').style.display = 'flex';
                }
        
                function forumSaveProfile() {
                    const newName = document.getElementById('forum-edit-name').value.trim() || '论坛用户';
                    const sigEl = document.getElementById('forum-edit-signature');
                    const profileData = {
                        name: newName,
                        bio: document.getElementById('forum-edit-bio').value.trim(),
                        gender: document.getElementById('forum-edit-gender').value.trim(),
                        location: document.getElementById('forum-edit-location').value.trim(),
                        signature: sigEl ? sigEl.value.trim() : ''
                    };
                    const oldName = ForumAPI.getDisplayName();
                    ForumAPI.saveProfile(profileData);
                    // If editing alt account, sync name/avatar to account object and update posts
                    const accId = ForumAPI.getCurrentAccountId();
                    if (accId) {
                        ForumAPI.updateAccount(accId, { name: newName, bio: profileData.bio, gender: profileData.gender });
                        if (oldName !== newName) {
                            (store.forumPosts || []).forEach(p => {
                                if (p.accountId === accId) p.author = newName;
                            });
                            save();
                        }
                        renderAccountSwitcher();
                    }
                    initForumProfile();
                    document.getElementById('modal-forum-profile').style.display = 'none';
                    toast('资料已保存');
                }
        
                function forumUploadAvatar() {
                    const input = _createFileInput(e => {
                        const file = e.target.files[0];
                        if (input.parentNode) input.parentNode.removeChild(input);
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = ev => {
                            ForumAPI.saveProfile({ avatar: ev.target.result });
                            document.getElementById('forum-my-avatar').src = ev.target.result;
                            document.getElementById('forum-edit-avatar').src = ev.target.result;
                            toast('头像已更新');
                        };
                        reader.readAsDataURL(file);
                    });
                    setTimeout(() => input.click(), 50);
                }

                function forumUploadBg() {
                    const input = _createFileInput(e => {
                        const file = e.target.files[0];
                        if (input.parentNode) input.parentNode.removeChild(input);
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = ev => {
                            ForumAPI.saveProfile({ bgImage: ev.target.result });
                            const bg = document.getElementById('forum-profile-bg');
                            if (bg) {
                                bg.style.background = `url(${ev.target.result}) center/cover`;
                            }
                            toast('背景已更新');
                        };
                        reader.readAsDataURL(file);
                    });
                    setTimeout(() => input.click(), 50);
                }
        
                // ========== FORUM: ACCOUNT MANAGEMENT ==========
                function renderAccountSwitcher() {
                    const bar = document.getElementById('forum-account-switcher');
                    if (!bar) return;
                    const accounts = ForumAPI.getAccounts();
                    if (accounts.length === 0) {
                        bar.style.display = 'none';
                        return;
                    }
                    bar.style.display = 'block';
                    const currentId = ForumAPI.getCurrentAccountId();
                    let html = `<div style="display:inline-flex; gap:8px; align-items:center;">`;
                    // Main account chip
                    html += `<div onclick="switchForumAccount(null)" style="display:inline-flex; align-items:center; gap:4px; padding:4px 12px; border-radius:20px; font-size:13px; cursor:pointer; ${!currentId ? 'background:var(--primary); color:#fff;' : 'background:#f0f0f0; color:#666;'}">
                        <i class="fas fa-user"></i> 主号
                    </div>`;
                    // Alt account chips
                    accounts.forEach(acc => {
                        const isActive = currentId === acc.id;
                        html += `<div onclick="switchForumAccount('${acc.id}')" style="display:inline-flex; align-items:center; gap:4px; padding:4px 12px; border-radius:20px; font-size:13px; cursor:pointer; ${isActive ? 'background:var(--primary); color:#fff;' : 'background:#f0f0f0; color:#666;'}">
                            <img src="${acc.avatar || _ph(20)}" style="width:18px; height:18px; border-radius:50%; object-fit:cover;">
                            ${escapeHtml(acc.name)}
                        </div>`;
                    });
                    html += `</div>`;
                    bar.innerHTML = html;
                }

                window.switchForumAccount = function(id) {
                    ForumAPI.switchAccount(id);
                    renderAccountSwitcher();
                    initForumProfile();
                    renderForumMyTab();
                    renderForumMsgTab();
                    toast(id ? `已切换到小号: ${ForumAPI.getDisplayName()}` : '已切换到主号');
                };

                window.openForumAccountManager = function() {
                    const accounts = ForumAPI.getAccounts();
                    const list = document.getElementById('forum-accounts-list');
                    if (accounts.length === 0) {
                        list.innerHTML = `<div style="text-align:center; padding:30px; color:#bbb;">
                            <i class="fas fa-user-secret" style="font-size:40px; margin-bottom:10px;"></i>
                            <div>还没有小号</div>
                            <div style="font-size:12px; margin-top:6px;">创建小号可以在论坛中使用不同身份发帖</div>
                        </div>`;
                    } else {
                        const currentId = ForumAPI.getCurrentAccountId();
                        list.innerHTML = accounts.map(acc => {
                            const isActive = currentId === acc.id;
                            const postCount = (store.forumPosts || []).filter(p => p.accountId === acc.id).length;
                            return `<div style="display:flex; align-items:center; padding:12px; background:${isActive ? '#f0f7ff' : '#f9f9f9'}; border-radius:12px; margin-bottom:8px; ${isActive ? 'border:1px solid var(--primary);' : 'border:1px solid transparent;'}">
                                <img src="${acc.avatar || _ph(44)}" style="width:44px; height:44px; border-radius:50%; object-fit:cover; margin-right:12px;">
                                <div style="flex:1; overflow:hidden;">
                                    <div style="font-size:14px; font-weight:500;">${escapeHtml(acc.name)} ${isActive ? '<span style="color:var(--primary); font-size:12px;">● 使用中</span>' : ''}</div>
                                    <div style="font-size:12px; color:#999; margin-top:2px;">${acc.bio || '无签名'} · ${postCount}篇帖子</div>
                                </div>
                                <div style="display:flex; gap:6px;">
                                    <button onclick="editForumAccount('${acc.id}')" style="padding:6px 10px; background:#f0f0f0; border:none; border-radius:8px; font-size:12px; cursor:pointer;"><i class="fas fa-edit"></i></button>
                                    <button onclick="deleteForumAccount('${acc.id}')" style="padding:6px 10px; background:#fee; border:none; border-radius:8px; font-size:12px; cursor:pointer; color:#e74c3c;"><i class="fas fa-trash"></i></button>
                                </div>
                            </div>`;
                        }).join('');
                    }
                    document.getElementById('modal-forum-accounts').style.display = 'flex';
                };

                window.openCreateForumAccount = function() {
                    document.getElementById('forum-account-edit-id').value = '';
                    document.getElementById('forum-account-edit-name').value = '';
                    document.getElementById('forum-account-edit-bio').value = '';
                    document.getElementById('forum-account-edit-gender').value = '';
                    document.getElementById('forum-account-edit-avatar').src = _ph(64);
                    document.getElementById('forum-account-edit-title').textContent = '创建小号';
                    document.getElementById('modal-forum-account-edit').style.display = 'flex';
                };

                window.editForumAccount = function(id) {
                    const acc = ForumAPI.getAccounts().find(a => a.id === id);
                    if (!acc) return;
                    document.getElementById('forum-account-edit-id').value = id;
                    document.getElementById('forum-account-edit-name').value = acc.name || '';
                    document.getElementById('forum-account-edit-bio').value = acc.bio || '';
                    document.getElementById('forum-account-edit-gender').value = acc.gender || '';
                    document.getElementById('forum-account-edit-avatar').src = acc.avatar || _ph(64);
                    document.getElementById('forum-account-edit-title').textContent = '编辑小号';
                    document.getElementById('modal-forum-account-edit').style.display = 'flex';
                };

                window.saveForumAccount = function() {
                    const id = document.getElementById('forum-account-edit-id').value;
                    const name = document.getElementById('forum-account-edit-name').value.trim();
                    if (!name) return toast('请输入昵称');
                    const bio = document.getElementById('forum-account-edit-bio').value.trim();
                    const gender = document.getElementById('forum-account-edit-gender').value;
                    const avatarSrc = document.getElementById('forum-account-edit-avatar').src;
                    const avatar = avatarSrc.includes('placeholder') ? '' : avatarSrc;

                    if (id) {
                        // Edit existing
                        ForumAPI.updateAccount(id, { name, bio, gender, avatar });
                        // Update author name on existing posts
                        (store.forumPosts || []).forEach(p => {
                            if (p.accountId === id) {
                                p.author = name;
                                if (avatar) p.avatar = avatar;
                            }
                        });
                        save();
                        toast('小号已更新');
                    } else {
                        // Create new
                        const newId = 'alt_' + Date.now();
                        ForumAPI.addAccount({
                            id: newId,
                            name,
                            bio,
                            gender,
                            avatar,
                            profile: { name, bio, gender, avatar },
                            createdAt: Date.now(),
                            npcDiscovery: {} // Track which NPCs have discovered this is an alt
                        });
                        toast('小号创建成功');
                    }
                    document.getElementById('modal-forum-account-edit').style.display = 'none';
                    openForumAccountManager(); // Refresh list
                    renderAccountSwitcher();
                };

                window.deleteForumAccount = function(id) {
                    const acc = ForumAPI.getAccounts().find(a => a.id === id);
                    if (!acc) return;
                    if (!confirm(`确定删除小号「${acc.name}」？该小号的所有帖子也会被删除。`)) return;
                    ForumAPI.deleteAccount(id);
                    toast('小号已删除');
                    openForumAccountManager();
                    renderAccountSwitcher();
                    initForumProfile();
                    renderForumMyTab();
                };

                window.forumAccountUploadAvatar = function() {
                    const input = _createFileInput(e => {
                        const file = e.target.files[0];
                        if (input.parentNode) input.parentNode.removeChild(input);
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = ev => {
                            document.getElementById('forum-account-edit-avatar').src = ev.target.result;
                        };
                        reader.readAsDataURL(file);
                    });
                    setTimeout(() => input.click(), 50);
                };

                // ========== FORUM: MY TAB ==========
                function renderForumMyTab() {
                    renderAccountSwitcher();
                    initForumProfile();
                    // Update stats
                    const myPosts = ForumAPI.getMyPosts();
                    // Count unique followers from notifications
                    const followerNames = new Set(ForumAPI.getNotifs('follow').map(n => n.name));
                    const followingCount = ForumAPI.getFollowing().length;
                    document.getElementById('forum-stat-posts').textContent = myPosts.length;
                    document.getElementById('forum-stat-followers').textContent = followerNames.size;
                    document.getElementById('forum-stat-following').textContent = followingCount;
                    // Default: show my posts
                    forumMeTab(0, document.querySelector('.forum-me-tab.active'));
                }
        
                function forumMeTab(idx, el) {
                    document.querySelectorAll('.forum-me-tab').forEach((t, i) => t.classList.toggle('active', i === idx));
                    const container = document.getElementById('forum-me-content');
                    if (!container) return;
                    if (idx === 0) {
                        // My posts
                        const myPosts = ForumAPI.getMyPosts().sort((a, b) => b.time - a.time);
                        if (myPosts.length === 0) {
                            container.innerHTML = '<div style="text-align:center; padding:30px; color:#bbb;">还没有发布帖子</div>';
                        } else {
                            container.innerHTML = myPosts.map(p => `
                                <div class="forum-post-card" onclick="openForumPost('${p.id}')" style="margin-bottom:8px;">
                                    <div class="forum-post-title">${escapeHtml(p.title)}</div>
                                    <div class="forum-post-preview">${escapeHtml(p.content)}</div>
                                    <div class="forum-post-footer">
                                        <span><i class="far fa-heart"></i> ${(p.likes || []).length}</span>
                                        <span><i class="far fa-comment"></i> ${(p.comments || []).length}</span>
                                        <span style="color:#aaa; font-size:12px;">${formatForumTime(p.time)}</span>
                                    </div>
                                </div>
                            `).join('');
                        }
                    } else if (idx === 1) {
                        // My comments
                        const allComments = ForumAPI.getMyComments();
                        allComments.sort((a, b) => b.time - a.time);
                        if (allComments.length === 0) {
                            container.innerHTML = '<div style="text-align:center; padding:30px; color:#bbb;">还没有评论</div>';
                        } else {
                            container.innerHTML = allComments.map(c => `
                                <div class="forum-post-card" onclick="openForumPost('${c.postId}')" style="margin-bottom:8px;">
                                    <div style="font-size:12px; color:#aaa; margin-bottom:4px;">评论于「${escapeHtml(c.postTitle)}」</div>
                                    <div style="font-size:14px;">${escapeHtml(c.text)}</div>
                                    <div style="font-size:12px; color:#aaa; margin-top:4px;">${formatForumTime(c.time)}</div>
                                </div>
                            `).join('');
                        }
                    } else if (idx === 2) {
                        // Starred posts
                        const starred = ForumAPI.getStarredPosts();
                        if (starred.length === 0) {
                            container.innerHTML = '<div style="text-align:center; padding:30px; color:#bbb;">还没有收藏</div>';
                        } else {
                            container.innerHTML = starred.map(p => `
                                <div class="forum-post-card" onclick="openForumPost('${p.id}')" style="margin-bottom:8px;">
                                    <div class="forum-post-header">
                                        <img src="${p.avatar || _ph(36)}">
                                        <div>
                                            <div class="forum-post-author">${escapeHtml(p.author || '匿名')}</div>
                                            <div class="forum-post-time">${formatForumTime(p.time)}</div>
                                        </div>
                                    </div>
                                    <div class="forum-post-title">${escapeHtml(p.title)}</div>
                                    <div class="forum-post-preview">${escapeHtml(p.content)}</div>
                                </div>
                            `).join('');
                        }
                    }
                }

                // ========== FORUM: SETTINGS (支持板块独立设置 / 全局设置) ==========
                function openForumSettings() {
                    // Determine if we're editing a specific section or global
                    const currentSection = getCurrentSection();
                    const settings = currentSection || ForumAPI.getSettings();
                    const linkedContacts = currentSection ? (currentSection.linkedContacts || []) : (settings.linkedContacts || []);
                    const linkedWorldbooks = currentSection ? (currentSection.linkedWorldbooks || []) : (settings.linkedWorldbooks || []);
                    const customWorldview = currentSection ? (currentSection.worldview || '') : (settings.customWorldview || '');
                    const customRules = currentSection ? (currentSection.rules || '') : (settings.customRules || '');

                    // Update modal title to indicate context
                    const modalTitle = document.querySelector('#modal-forum-settings h3');
                    if (modalTitle) {
                        modalTitle.textContent = currentSection ? `板块设置：${currentSection.name}` : '全局论坛设置';
                    }

                    // Render contacts list
                    const contactsDiv = document.getElementById('forum-settings-contacts');
                    const contacts = store.contacts || [];
                    if (contacts.length === 0) {
                        contactsDiv.innerHTML = '<div style="text-align:center;padding:16px 10px;">' +
                            '<div style="font-size:13px;color:#999;margin-bottom:10px;">还没有联系人</div>' +
                            '<button onclick="if(typeof exitApp===\'function\') exitApp(); if(typeof openApp===\'function\') openApp(\'wechat\');" style="padding:6px 16px;background:#333;color:#fff;border:none;border-radius:6px;font-size:12px;cursor:pointer;">去微信创建</button>' +
                        '</div>';
                    } else {
                        contactsDiv.innerHTML = contacts.map(c => {
                            const checked = linkedContacts.includes(c.id) ? 'checked' : '';
                            return `<label style="display:flex; align-items:center; padding:10px; background:#f9f9f9; border-radius:10px; margin-bottom:6px; cursor:pointer;">
                                <input type="checkbox" class="forum-link-contact" value="${c.id}" ${checked} style="width:18px; height:18px; margin-right:10px; accent-color:var(--primary);">
                                <img src="${c.avatar || _ph(36)}" style="width:36px; height:36px; border-radius:50%; margin-right:10px; object-fit:cover;">
                                <div style="flex:1; overflow:hidden;">
                                    <div style="font-size:14px; font-weight:500;">${c.name}</div>
                                    <div style="font-size:12px; color:#999; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${c.persona ? c.persona.substring(0, 30) + '...' : '无人设'}</div>
                                </div>
                            </label>`;
                        }).join('');
                    }

                    // Render worldbooks list
                    const wbDiv = document.getElementById('forum-settings-worldbooks');
                    const worldbooks = store.worldbooks || [];
                    if (worldbooks.length === 0) {
                        wbDiv.innerHTML = '<div style="text-align:center;padding:16px 10px;">' +
                            '<div style="font-size:13px;color:#999;margin-bottom:10px;">还没有世界书</div>' +
                            '<button onclick="if(typeof exitApp===\'function\') exitApp(); if(typeof openApp===\'function\') openApp(\'worldbook\');" style="padding:6px 16px;background:#333;color:#fff;border:none;border-radius:6px;font-size:12px;cursor:pointer;">去创建世界书</button>' +
                        '</div>';
                    } else {
                        wbDiv.innerHTML = worldbooks.map(wb => {
                            const checked = linkedWorldbooks.includes(wb.id) ? 'checked' : '';
                            return `<label style="display:flex; align-items:center; padding:10px; background:#f9f9f9; border-radius:10px; margin-bottom:6px; cursor:pointer;">
                                <input type="checkbox" class="forum-link-wb" value="${wb.id}" ${checked} style="width:18px; height:18px; margin-right:10px; accent-color:#f59e0b;">
                                <div style="flex:1; overflow:hidden;">
                                    <div style="font-size:14px; font-weight:500;"><i class="fas fa-book" style="margin-right:6px; color:#f59e0b;"></i>${wb.name}</div>
                                    <div style="font-size:12px; color:#999; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${wb.content ? wb.content.substring(0, 40) + '...' : '无内容'}</div>
                                </div>
                            </label>`;
                        }).join('');
                    }

                    // Load custom worldview and rules
                    const worldviewInput = document.getElementById('forum-custom-worldview');
                    const rulesInput = document.getElementById('forum-custom-rules');
                    if (worldviewInput) worldviewInput.value = customWorldview;
                    if (rulesInput) rulesInput.value = customRules;

                    document.getElementById('modal-forum-settings').style.display = 'flex';
                }

                function closeForumSettingsPanel() {
                    const mask = document.getElementById('modal-forum-settings');
                    const panel = mask.querySelector('.unified-panel');
                    if (panel) panel.classList.add('closing');
                    setTimeout(() => { mask.style.display = 'none'; if (panel) panel.classList.remove('closing'); }, 200);
                }

                function saveForumSettings() {
                    const contactCheckboxes = document.querySelectorAll('.forum-link-contact:checked');
                    const wbCheckboxes = document.querySelectorAll('.forum-link-wb:checked');
                    const worldviewInput = document.getElementById('forum-custom-worldview');
                    const rulesInput = document.getElementById('forum-custom-rules');

                    const linkedContacts = Array.from(contactCheckboxes).map(cb => cb.value);
                    const linkedWorldbooks = Array.from(wbCheckboxes).map(cb => cb.value);
                    const customWorldview = worldviewInput ? worldviewInput.value.trim() : '';
                    const customRules = rulesInput ? rulesInput.value.trim() : '';

                    const currentSection = getCurrentSection();
                    if (currentSection) {
                        // Save to current section
                        currentSection.linkedContacts = linkedContacts;
                        currentSection.linkedWorldbooks = linkedWorldbooks;
                        currentSection.worldview = customWorldview;
                        currentSection.rules = customRules;
                        save();
                        closeForumSettingsPanel();
                        toast(`「${currentSection.name}」板块设置已保存`);
                    } else {
                        // Save to global forumSettings
                        const settings = ForumAPI.getSettings();
                        settings.linkedContacts = linkedContacts;
                        settings.linkedWorldbooks = linkedWorldbooks;
                        settings.customWorldview = customWorldview;
                        settings.customRules = customRules;
                        if (!store.forumSettings) store.forumSettings = {};
                        store.forumSettings = settings;
                        save();
                        closeForumSettingsPanel();
                        toast('全局论坛设置已保存');
                    }
                }

                async function batchGenerateForumContent() {
                    _currentApiScene = 'forum';
                    // Auto-save current checkbox state before generating
                    const contactCheckboxes = document.querySelectorAll('.forum-link-contact:checked');
                    const wbCheckboxes = document.querySelectorAll('.forum-link-wb:checked');
                    if (contactCheckboxes.length > 0 || wbCheckboxes.length > 0) {
                        ForumAPI.saveSettings(
                            Array.from(contactCheckboxes).map(cb => cb.value),
                            Array.from(wbCheckboxes).map(cb => cb.value)
                        );
                    }

                    // Use effective settings (section overrides global)
                    const currentSection = getCurrentSection();
                    const effectiveSettings = getSectionEffectiveSettings(currentSection);
                    const linkedIds = effectiveSettings.linkedContacts || [];
                    if (linkedIds.length === 0) return toast('请先关联联系人');

                    const genPosts = document.getElementById('forum-gen-posts')?.checked;
                    const genComments = document.getElementById('forum-gen-comments')?.checked;
                    const genDMs = document.getElementById('forum-gen-dms')?.checked;
                    if (!genPosts && !genComments && !genDMs) return toast('请至少选择一种生成类型');

                    const statusEl = document.getElementById('forum-gen-status');
                    const contacts = linkedIds.map(id => (store.contacts || []).find(c => c.id === id)).filter(Boolean);
                    if (contacts.length === 0) return toast('未找到关联联系人');

                    // Worldbook context from effective settings
                    let wbContext = '';
                    const linkedWbIds = effectiveSettings.linkedWorldbooks || [];
                    if (linkedWbIds.length > 0) {
                        const wbs = (store.worldbooks || []).filter(wb => linkedWbIds.includes(wb.id));
                        if (wbs.length > 0) wbContext = wbs.map(wb => `[${wb.name}]: ${wb.content}`).join('\n');
                    }
                    const mainName = ForumAPI.getDisplayName();
                    const _userPersonaDesc = ForumAPI.getUserPersonaDesc();
                    const targetSectionId = currentSection ? currentSection.id : null;

                    for (let i = 0; i < contacts.length; i++) {
                        const contact = contacts[i];
                        statusEl.textContent = `正在为 ${contact.name} 生成内容... (${i + 1}/${contacts.length})`;

                        try {
                            if (genPosts) {
                                await generateContactPosts(contact, wbContext, mainName, effectiveSettings, targetSectionId);
                            }
                            if (genComments) {
                                await generateContactComments(contact, wbContext);
                            }
                            if (genDMs) {
                                await generateContactDMs(contact, wbContext, mainName);
                            }
                        } catch (e) {
                            console.error('生成失败:', contact.name, e);
                        }
                    }
                    save();
                    renderForum();
                    statusEl.textContent = `已为 ${contacts.length} 位联系人生成内容`;
                    toast('论坛内容生成完成');
                }

                async function generateContactPosts(contact, wbContext, mainName, effectiveSettings, targetSectionId) {
                    const chatHistory = (store.chats && store.chats[contact.id]) ? store.chats[contact.id].slice(-20) : [];
                    let chatContext = '';
                    if (chatHistory.length > 0) {
                        chatContext = chatHistory.map(m => `${m.sender === 'me' ? mainName : contact.name}: ${(m.content || '').substring(0, 80)}`).join('\n');
                    }

                    // 使用有效设置（板块优先于全局）
                    if (!effectiveSettings) {
                        effectiveSettings = getSectionEffectiveSettings(getCurrentSection());
                    }
                    const customWorldview = effectiveSettings.customWorldview || '';
                    const customRules = effectiveSettings.customRules || '';
                    const minChars = effectiveSettings.minChars || 30;
                    const maxChars = effectiveSettings.maxChars || 100;
                    const lenHint = `${minChars}-${maxChars}字`;

                    const sectionName = targetSectionId ? ((store.forumSections || []).find(s => s.id === targetSectionId) || {}).name || '' : '';
                    
                    const sysPrompt = `你是${contact.name}。${contact.gender ? `性别：${contact.gender}。` : ''}你的人设：${contact.persona || '普通人'}。
${_userPersonaDesc ? `【用户信息】用户名：${mainName}，用户人设：${_userPersonaDesc}\n` : ''}
${sectionName ? `【所在板块】${sectionName}\n` : ''}
${customWorldview ? `【论坛世界观】\n${customWorldview}\n` : ''}
${wbContext ? `【世界书设定】\n${wbContext}\n` : ''}
${customRules ? `【论坛规则】\n${customRules}\n` : ''}
${chatContext ? `你和${mainName}的近期聊天记录（作为参考）：\n${chatContext}\n` : ''}
你正在使用一个论坛。请以${contact.name}的身份和口吻，写3条论坛帖子。帖子内容要符合你的人设${customWorldview || wbContext ? '、世界观设定' : ''}${customRules ? '和论坛规则' : ''}。
格式要求（严格遵守）：
每条帖子用 --- 分隔
每条帖子第一行是标题（不超过15字）
第二行开始是正文内容（${lenHint}）
不要加任何标签、前缀或格式符号。`;

                    const data = await API.chatCompletion([
                        { role: 'system', content: sysPrompt },
                        { role: 'user', content: '请发3条帖子' }
                    ]);
                    const reply = data.choices[0].message.content.trim();
                    const postBlocks = reply.split('---').map(b => b.trim()).filter(b => b);
                    const accId = 'contact_' + contact.id;

                    postBlocks.forEach((block, idx) => {
                        const lines = block.split('\n').filter(l => l.trim());
                        const title = lines[0] || `${contact.name}的动态`;
                        const content = lines.slice(1).join('\n') || block;
                        const contentLimit = effectiveSettings.maxChars || 300;
                        // Random likes from NPC names
                        const likeCount = Math.floor(Math.random() * 5);
                        const likes = [];
                        for (let li = 0; li < likeCount; li++) {
                            const likeNpc = randomNPC();
                            if (!likes.includes(likeNpc.name)) likes.push(likeNpc.name);
                        }

                        if (!store.forumPosts) store.forumPosts = [];
                        store.forumPosts.push({
                            id: 'fp_bg_' + Date.now() + '_' + idx + '_' + Math.random().toString(36).substr(2, 4),
                            title: title.substring(0, 30),
                            content: content.substring(0, contentLimit > 0 ? contentLimit : 300),
                            author: contact.name,
                            avatar: contact.avatar || _ph(36),
                            time: Date.now() - Math.floor(Math.random() * 7200000) - idx * 900000,
                            likes: likes,
                            stars: [],
                            comments: [],
                            isMe: false,
                            isContactAccount: true,
                            contactId: contact.id,
                            accountId: accId,
                            sectionId: targetSectionId || null
                        });
                    });
                }

                // 性格系统定义
                const forumPersonalities = [
                    {
                        id: 'enthusiastic',
                        name: '热情活泼',
                        traits: '说话带很多感叹号和emoji，喜欢夸张表达，经常用"哈哈哈"、"太棒了"等词，对什么都很感兴趣',
                        commentStyle: '热情洋溢，积极互动，喜欢鼓励别人'
                    },
                    {
                        id: 'rational',
                        name: '理性分析',
                        traits: '喜欢客观分析，用数据和逻辑说话，措辞严谨，很少用感叹号，喜欢分点论述',
                        commentStyle: '冷静客观，逻辑清晰，喜欢深入分析问题的本质'
                    },
                    {
                        id: 'health',
                        name: '养生达人',
                        traits: '关注健康养生，经常从健康角度看问题，喜欢分享养生知识，提醒别人注意身体',
                        commentStyle: '从健康养生角度切入，分享相关知识和经验'
                    },
                    {
                        id: 'sarcastic',
                        name: '毒舌吐槽',
                        traits: '喜欢吐槽和调侃，说话带点讽刺，但不恶意，有时会阴阳怪气，喜欢抓住细节吐槽',
                        commentStyle: '幽默吐槽，略带讽刺，但点到为止'
                    },
                    {
                        id: 'philosophical',
                        name: '哲学思考',
                        traits: '喜欢从哲学角度思考问题，说话有深度，经常引申到人生意义、社会现象等宏大话题',
                        commentStyle: '深度思考，引申到更广阔的话题，有哲理性'
                    },
                    {
                        id: 'gossip',
                        name: '八卦好奇',
                        traits: '对细节很感兴趣，喜欢追问，关注人际关系和背后的故事，说话带"诶"、"哇"等语气词',
                        commentStyle: '好奇追问，关注细节和背后的故事'
                    },
                    {
                        id: 'professional',
                        name: '专业人士',
                        traits: '在某个领域很专业，喜欢从专业角度分析，会纠正错误，分享专业知识',
                        commentStyle: '专业严谨，提供专业见解和知识'
                    },
                    {
                        id: 'emotional',
                        name: '感性共鸣',
                        traits: '容易被感动，善于共情，说话温柔，喜欢分享自己的感受和经历',
                        commentStyle: '情感丰富，善于共鸣，分享个人感受'
                    },
                    {
                        id: 'skeptical',
                        name: '质疑派',
                        traits: '喜欢质疑和反驳，提出不同观点，说话带"但是"、"不过"，喜欢唱反调',
                        commentStyle: '提出质疑，表达不同观点，理性反驳'
                    },
                    {
                        id: 'humorous',
                        name: '幽默搞笑',
                        traits: '喜欢开玩笑，说话风趣，经常用梗和段子，让气氛轻松',
                        commentStyle: '幽默风趣，用段子和梗活跃气氛'
                    }
                ];

                // 为联系人分配性格（持久化）
                function getContactPersonality(contactId) {
                    if (!store.forumPersonalities) store.forumPersonalities = {};
                    if (!store.forumPersonalities[contactId]) {
                        // 随机分配一个性格
                        const personality = forumPersonalities[Math.floor(Math.random() * forumPersonalities.length)];
                        store.forumPersonalities[contactId] = personality.id;
                        save();
                    }
                    return forumPersonalities.find(p => p.id === store.forumPersonalities[contactId]) || forumPersonalities[0];
                }

                async function generateContactComments(contact, wbContext) {
                    const existingPosts = (store.forumPosts || []).filter(p => p.author !== contact.name).slice(-10);
                    if (existingPosts.length === 0) return;

                    // 获取自定义世界观和规则
                    const settings = ForumAPI.getSettings();
                    const customWorldview = settings.customWorldview || '';
                    const customRules = settings.customRules || '';

                    // 获取该联系人的性格
                    const personality = getContactPersonality(contact.id);

                    // 选择2-3个帖子进行深度评论
                    const selectedPosts = existingPosts.sort(() => Math.random() - 0.5).slice(0, Math.floor(Math.random() * 2) + 2);
                    
                    for (const post of selectedPosts) {
                        // 获取该帖子已有的评论，用于生成互动
                        const existingComments = (post.comments || []).slice(-5);
                        const commentsContext = existingComments.length > 0
                            ? `\n【该帖子已有评论】：\n` + existingComments.map((c, i) => `${i+1}. ${c.name}: ${c.text}`).join('\n')
                            : '';

                        // [FIX-OOC] 人设优先于随机性格：基础人设是最高优先级，性格仅作为补充参考
                        const sysPrompt = `【角色身份-最高优先级】你是${contact.name}。${contact.gender ? `性别：${contact.gender}。` : ''}
你的人设（必须严格遵守，绝对不能OOC）：${contact.persona || '普通人'}
⚠️ 你的一切言行必须完全符合以上人设，这是最高优先级。

【论坛评论风格参考】你在论坛上倾向于「${personality.name}」的评论风格：
- 风格参考：${personality.traits}
- 评论倾向：${personality.commentStyle}
注意：以上评论风格仅作为参考，当它与你的基础人设冲突时，以基础人设为准。

${customWorldview ? `【论坛世界观】\n${customWorldview}\n` : ''}
${wbContext ? `【世界书设定】\n${wbContext}\n` : ''}
${customRules ? `【论坛规则】\n${customRules}\n` : ''}

【要评论的帖子】
标题：${post.title}
内容：${post.content}
作者：${post.author}
${commentsContext}

【评论要求-严格执行】：
1. 内容深度：
   - 评论字数必须在80-200字之间（不是简单附和）
   - 可以是对帖子内容的细节扩展、深入分析
   - 可以提出自己的观点和看法
   - 可以联想到相关的经历或知识
   - 可以猜测其他可能性（if线）
   - 可以提出疑问或补充信息

2. 性格体现：
   - 必须完全符合你的「${personality.name}」性格
   - 说话方式、用词、语气都要体现性格特点
   - 不要写成通用的、没有性格的评论

3. 话题相关性：
   - 评论必须紧扣帖子主题
   - 不要跑题或说无关的内容
   - 如果要引申，也要自然过渡

4. 避免水评论：
   - 严禁只说"说得好"、"赞同"、"哈哈哈"等无意义附和
   - 严禁只用感叹词和emoji
   - 必须有实质性内容

5. 互动性${existingComments.length > 0 ? '（重要）' : ''}：
   ${existingComments.length > 0 ? `- 你可以回应已有评论中的观点（表示赞同、补充、或提出不同看法）
   - 如果要回应某人，在评论开头用"@用户名"标注
   - 可以和其他评论者展开讨论` : '- 这是第一条评论，专注于评论帖子本身即可'}

【输出格式】：
直接输出评论内容，不要任何标签或格式符号。`;

                        try {
                            const data = await API.chatCompletion([
                                { role: 'system', content: sysPrompt },
                                { role: 'user', content: '请发表你的评论' }
                            ], 0.85); // 提高温度增加创意性

                            const commentText = data.choices[0].message.content.trim();
                            
                            // 过滤掉太短的评论（可能是AI没理解要求）
                            if (commentText.length >= 30) {
                                if (!post.comments) post.comments = [];
                                post.comments.push({
                                    name: contact.name,
                                    avatar: contact.avatar || _ph(36),
                                    text: commentText,
                                    time: Date.now() - Math.floor(Math.random() * 1800000),
                                    personality: personality.id // 保存性格ID，方便后续互动
                                });
                            }

                            // 随机延迟，避免API限流
                            await new Promise(r => setTimeout(r, 1000 + Math.random() * 2000));
                        } catch (e) {
                            console.error('生成评论失败:', contact.name, e);
                        }
                    }

                    // 生成评论间的互动（30%概率）
                    if (Math.random() < 0.3) {
                        await generateCommentInteractions(contact, personality);
                    }
                }

                // 生成评论区互动（回复、讨论、争论）
                async function generateCommentInteractions(contact, personality) {
                    // 找到有多条评论的帖子
                    const postsWithComments = (store.forumPosts || []).filter(p =>
                        (p.comments || []).length >= 2 &&
                        p.comments.some(c => c.name === contact.name)
                    );
                    
                    if (postsWithComments.length === 0) return;

                    const post = postsWithComments[Math.floor(Math.random() * postsWithComments.length)];
                    const myComment = post.comments.find(c => c.name === contact.name);
                    const otherComments = post.comments.filter(c => c.name !== contact.name && c.time < myComment.time);
                    
                    if (otherComments.length === 0) return;

                    // 随机选择一条其他人的评论进行回应
                    const targetComment = otherComments[Math.floor(Math.random() * otherComments.length)];

                    const interactionTypes = [
                        { type: 'agree', prompt: '你看到这条评论后表示赞同，并补充你的观点' },
                        { type: 'disagree', prompt: '你看到这条评论后有不同看法，礼貌地提出你的观点' },
                        { type: 'question', prompt: '你看到这条评论后很好奇，想追问更多细节' },
                        { type: 'discuss', prompt: '你看到这条评论后想和对方深入探讨这个话题' }
                    ];

                    const interaction = interactionTypes[Math.floor(Math.random() * interactionTypes.length)];

                    const sysPrompt = `【角色身份】你是${contact.name}，性格是「${personality.name}」（${personality.traits}）

【场景】在帖子"${post.title}"下，${targetComment.name}评论说：
"${targetComment.text}"

【任务】${interaction.prompt}

【要求】：
1. 在评论开头用"@${targetComment.name}"标注你在回应谁
2. 字数60-150字
3. 完全符合你的「${personality.name}」性格
4. 内容要有实质性，不要只是简单附和
5. 根据互动类型（${interaction.type}）调整语气：
   - agree: 表示赞同但要补充新观点
   - disagree: 礼貌反驳，说明理由
   - question: 好奇追问，挖掘细节
   - discuss: 深入探讨，引申话题

【输出格式】：直接输出回复内容`;

                    try {
                        const data = await API.chatCompletion([
                            { role: 'system', content: sysPrompt },
                            { role: 'user', content: '请回复' }
                        ], 0.9);

                        const replyText = data.choices[0].message.content.trim();
                        
                        if (replyText.length >= 20) {
                            post.comments.push({
                                name: contact.name,
                                avatar: contact.avatar || _ph(36),
                                text: replyText,
                                replyTo: targetComment.name,
                                time: Date.now() - Math.floor(Math.random() * 900000),
                                personality: personality.id
                            });
                        }
                    } catch (e) {
                        console.error('生成互动失败:', contact.name, e);
                    }
                }

                async function generateContactDMs(contact, wbContext, mainName) {
                    // 获取自定义世界观和规则
                    const settings = ForumAPI.getSettings();
                    const customWorldview = settings.customWorldview || '';
                    const customRules = settings.customRules || '';
                    const _dmUserPersonaDesc = ForumAPI.getUserPersonaDesc();
                    
                    const dmPrompt = `你是${contact.name}。${contact.gender ? `性别：${contact.gender}。` : ''}你的人设：${contact.persona || '普通人'}。
${_dmUserPersonaDesc ? `【用户信息】用户名：${mainName}，用户人设：${_dmUserPersonaDesc}\n` : ''}
${customWorldview ? `【论坛世界观】\n${customWorldview}\n` : ''}
${wbContext ? `【世界书设定】\n${wbContext}\n` : ''}
${customRules ? `【论坛规则】\n${customRules}\n` : ''}
请模拟${contact.name}主动给用户${mainName}发的私信，共3-4条消息。内容要符合你们的关系和人设，像是日常闲聊${customWorldview || wbContext ? '，遵循世界观设定' : ''}。
格式要求：每行一条消息，直接写消息内容，不要加前缀。`;

                    const data = await API.chatCompletion([
                        { role: 'system', content: dmPrompt },
                        { role: 'user', content: '请发私信' }
                    ]);
                    const reply = data.choices[0].message.content.trim();
                    const dmLines = reply.split('\n').filter(l => l.trim());
                    const currentAccountId = ForumAPI.getCurrentAccountId();
                    // [FIX] 使用与 addDM/openDMFromProfile 一致的 key 格式，避免同一联系人产生多条私信
                    const dmKey = currentAccountId ? 'dm_' + contact.name + '_' + currentAccountId : 'dm_' + contact.name;

                    if (!store.forumDMs) store.forumDMs = {};
                    // 兼容旧数据：如果旧 key 存在则迁移到新 key
                    const oldKey = currentAccountId ? 'dm_contact_' + contact.id + '_' + currentAccountId : 'dm_contact_' + contact.id;
                    if (store.forumDMs[oldKey] && !store.forumDMs[dmKey]) {
                        store.forumDMs[dmKey] = store.forumDMs[oldKey];
                        delete store.forumDMs[oldKey];
                    }
                    if (!store.forumDMs[dmKey]) {
                        store.forumDMs[dmKey] = { name: contact.name, avatar: contact.avatar || _ph(36), msgs: [], accountId: currentAccountId || null };
                    } else {
                        // 更新头像为最新
                        store.forumDMs[dmKey].avatar = contact.avatar || store.forumDMs[dmKey].avatar;
                    }
                    // Also create mirror DM for the contact's account (so they can see received messages)
                    const contactAccId = 'contact_' + contact.id;
                    const mirrorDmKey = 'dm_mirror_' + (currentAccountId || 'main') + '_' + contactAccId;
                    const mainDisplayName = ForumAPI.getDisplayName();
                    const mainDisplayAvatar = ForumAPI.getDisplayAvatar();
                    if (!store.forumDMs[mirrorDmKey]) {
                        store.forumDMs[mirrorDmKey] = { name: mainDisplayName, avatar: mainDisplayAvatar || _ph(36), msgs: [], accountId: contactAccId };
                    }

                    dmLines.forEach((line, i) => {
                        const msgText = line.replace(/^[^:：]*[:：]\s*/, '').trim();
                        if (msgText) {
                            const msgTime = Date.now() - (dmLines.length - i) * 120000;
                            // Main account sees: contact sent me a message
                            store.forumDMs[dmKey].msgs.push({
                                text: msgText,
                                time: msgTime,
                                isMe: false,
                                read: false
                            });
                            // Contact account sees: I sent a message to main user
                            store.forumDMs[mirrorDmKey].msgs.push({
                                text: msgText,
                                time: msgTime,
                                isMe: true,
                                read: true
                            });
                        }
                    });
                }

                function clearForumData() {
                    showConfirm('清除论坛数据', '确定要清除所有论坛数据吗？此操作不可撤销。', () => {
                        ForumAPI.clearAll();
                        renderForum();
                        toast('论坛数据已清除');
                    });
                }
                // ========== FORUM: USER PROFILE PAGE ==========
                let activeProfileUser = null; // { name, avatar, isMe }

                function openForumUserProfile(authorName, avatar) {
                    const myName = ForumAPI.getDisplayName();
                    const isMe = (authorName === myName);
                    activeProfileUser = { name: authorName, avatar: avatar || '', isMe };
                    renderForumUserProfile();
                    document.getElementById('layer-forum-user-profile').classList.add('show');
                }

                function renderForumUserProfile() {
                    const container = document.getElementById('forum-user-profile-content');
                    if (!container || !activeProfileUser) return;
                    const { name, avatar, isMe } = activeProfileUser;

                    // Gather user's posts
                    const allPosts = ForumAPI.getPosts();
                    const userPosts = allPosts.filter(p => p.author === name).sort((a, b) => b.time - a.time);
                    const postCount = userPosts.length;

                    // Follower/following counts
                    const isFollowed = ForumAPI.isFollowing(name);
                    let followingCount, followerCount;
                    if (isMe) {
                        followingCount = ForumAPI.getFollowing().length;
                        followerCount = new Set(ForumAPI.getNotifs('follow').map(n => n.name)).size;
                    } else {
                        // Stable NPC counts: seed from name hash
                        if (!store.forumNpcStats) store.forumNpcStats = {};
                        if (!store.forumNpcStats[name]) {
                            let hash = 0;
                            for (let i = 0; i < name.length; i++) hash = ((hash << 5) - hash) + name.charCodeAt(i);
                            store.forumNpcStats[name] = {
                                following: Math.abs(hash % 80) + 5,
                                followers: Math.abs((hash * 31) % 300) + 10
                            };
                            save();
                        }
                        followingCount = store.forumNpcStats[name].following;
                        followerCount = store.forumNpcStats[name].followers;
                        // If user follows this NPC, increment their follower count
                        if (isFollowed && !store.forumNpcStats[name]._userFollowed) {
                            store.forumNpcStats[name].followers++;
                            store.forumNpcStats[name]._userFollowed = true;
                            followerCount = store.forumNpcStats[name].followers;
                            save();
                        } else if (!isFollowed && store.forumNpcStats[name]._userFollowed) {
                            store.forumNpcStats[name].followers--;
                            store.forumNpcStats[name]._userFollowed = false;
                            followerCount = store.forumNpcStats[name].followers;
                            save();
                        }
                    }

                    // Bio
                    let bio = '';
                    if (isMe) {
                        const p = ForumAPI.getProfile();
                        bio = p.bio || '这个人很懒，什么都没写~';
                    } else {
                        // Generate a random bio for NPC
                        const bios = [
                            '热爱生活，分享日常 ✨', '记录美好瞬间 📸', '吃货一枚 🍜',
                            '音乐/电影/旅行 🎵', '佛系冲浪 🏄', '随便看看~',
                            '每天都要开心呀 🌈', '代码改变世界 💻', '猫奴 🐱',
                            '在这里交朋友 👋', '生活不止眼前的苟且', '永远年轻，永远热泪盈眶'
                        ];
                        bio = randomPick(bios);
                    }

                    const displayAvatar = avatar || (isMe ? ForumAPI.getDisplayAvatar() : _ph(88));

                    let html = '';
                    // Banner
                    html += `<div class="forum-profile-banner"></div>`;

                    // Profile info section
                    html += `<div class="forum-profile-info">`;
                    html += `<div class="forum-profile-avatar-wrap">`;
                    html += `<img src="${displayAvatar}" alt="${escapeHtml(name)}">`;
                    html += `<div class="forum-profile-actions">`;
                    if (isMe) {
                        html += `<button onclick="forumEditProfile()">编辑资料</button>`;
                    } else {
                        html += `<button class="${isFollowed ? 'following' : 'primary'}" onclick="toggleProfileFollow('${escapeHtml(name)}')">${isFollowed ? '已关注' : '关注'}</button>`;
                        html += `<button onclick="openDMFromProfile('${escapeHtml(name)}', '${displayAvatar}')"><i class="far fa-envelope"></i> 私信</button>`;
                    }
                    html += `</div></div>`;

                    // Name & bio
                    html += `<div class="forum-profile-name">${escapeHtml(name)}</div>`;
                    html += `<div class="forum-profile-id">@${escapeHtml(name.toLowerCase().replace(/\s+/g, '_'))}</div>`;
                    html += `<div class="forum-profile-bio">${escapeHtml(bio)}</div>`;

                    // Stats
                    html += `<div class="forum-profile-stats">`;
                    html += `<div class="stat"><div class="stat-num">${postCount}</div><div class="stat-label">帖子</div></div>`;
                    html += `<div class="stat"><div class="stat-num">${followerCount}</div><div class="stat-label">粉丝</div></div>`;
                    html += `<div class="stat"><div class="stat-num">${followingCount}</div><div class="stat-label">关注</div></div>`;
                    html += `</div>`;
                    html += `</div>`;

                    // Tabs
                    html += `<div class="forum-profile-tabs">`;
                    html += `<div class="tab active" onclick="switchProfileTab(this, 'posts')"><i class="fas fa-th"></i> 帖子</div>`;
                    html += `<div class="tab" onclick="switchProfileTab(this, 'likes')"><i class="far fa-heart"></i> 喜欢</div>`;
                    html += `</div>`;

                    // Posts grid
                    html += `<div class="forum-profile-posts" id="forum-profile-posts-area">`;
                    if (userPosts.length === 0) {
                        html += `<div style="text-align:center; padding:40px 20px; color:#bbb;">
                            <i class="far fa-file-alt" style="font-size:36px; margin-bottom:8px;"></i>
                            <div>暂无帖子</div>
                        </div>`;
                    } else {
                        html += `<div class="forum-profile-post-grid">`;
                        userPosts.forEach(p => {
                            const preview = (p.title || p.content || '').substring(0, 40);
                            html += `<div class="grid-item" style="position:relative;">
                                <div onclick="closeLayer('layer-forum-user-profile'); openForumPost('${p.id}')" style="padding:12px;">${escapeHtml(preview)}</div>
                                ${isMe ? `<div class="grid-item-actions" style="position:absolute; top:4px; right:4px; display:flex; gap:4px;">
                                    <span onclick="event.stopPropagation(); editPostFromProfile('${p.id}')" style="cursor:pointer; font-size:12px; color:#576b95; padding:2px 6px; background:rgba(255,255,255,0.9); border-radius:4px;"><i class="fas fa-edit"></i></span>
                                    <span onclick="event.stopPropagation(); deletePostFromProfile('${p.id}')" style="cursor:pointer; font-size:12px; color:#e74c3c; padding:2px 6px; background:rgba(255,255,255,0.9); border-radius:4px;"><i class="fas fa-trash"></i></span>
                                </div>` : ''}
                            </div>`;
                        });
                        html += `</div>`;
                    }
                    html += `</div>`;

                    container.innerHTML = html;
                }

                function switchProfileTab(el, tab) {
                    document.querySelectorAll('.forum-profile-tabs .tab').forEach(t => t.classList.remove('active'));
                    el.classList.add('active');
                    const area = document.getElementById('forum-profile-posts-area');
                    if (!area || !activeProfileUser) return;

                    const allPosts = ForumAPI.getPosts();
                    let posts;
                    if (tab === 'likes') {
                        posts = allPosts.filter(p => (p.likes || []).includes(ForumAPI._meId()) && p.author === activeProfileUser.name).sort((a, b) => b.time - a.time);
                        if (!activeProfileUser.isMe) {
                            // For NPC, show their posts that have likes
                            posts = allPosts.filter(p => p.author === activeProfileUser.name && (p.likes || []).length > 0).sort((a, b) => b.time - a.time);
                        }
                    } else {
                        posts = allPosts.filter(p => p.author === activeProfileUser.name).sort((a, b) => b.time - a.time);
                    }

                    if (posts.length === 0) {
                        area.innerHTML = `<div style="text-align:center; padding:40px 20px; color:#bbb;">
                            <i class="far fa-file-alt" style="font-size:36px; margin-bottom:8px;"></i>
                            <div>暂无内容</div>
                        </div>`;
                    } else {
                        const isMe = activeProfileUser.isMe;
                        let html = `<div class="forum-profile-post-grid">`;
                        posts.forEach(p => {
                            const preview = (p.title || p.content || '').substring(0, 40);
                            html += `<div class="grid-item" style="position:relative;">
                                <div onclick="closeLayer('layer-forum-user-profile'); openForumPost('${p.id}')" style="padding:12px;">${escapeHtml(preview)}</div>
                                ${isMe ? `<div class="grid-item-actions" style="position:absolute; top:4px; right:4px; display:flex; gap:4px;">
                                    <span onclick="event.stopPropagation(); editPostFromProfile('${p.id}')" style="cursor:pointer; font-size:12px; color:#576b95; padding:2px 6px; background:rgba(255,255,255,0.9); border-radius:4px;"><i class="fas fa-edit"></i></span>
                                    <span onclick="event.stopPropagation(); deletePostFromProfile('${p.id}')" style="cursor:pointer; font-size:12px; color:#e74c3c; padding:2px 6px; background:rgba(255,255,255,0.9); border-radius:4px;"><i class="fas fa-trash"></i></span>
                                </div>` : ''}
                            </div>`;
                        });
                        html += `</div>`;
                        area.innerHTML = html;
                    }
                }

                function editPostFromProfile(postId) {
                    const post = ForumAPI.getPost(postId);
                    if (!post) return;
                    showPromptModal('编辑标题:', post.title).then(function(newTitle) {
                        if (newTitle === null) return;
                        showPromptModal('编辑内容:', post.content, {multiline: true}).then(function(newContent) {
                            if (newContent === null) return;
                            ForumAPI.updatePost(postId, {
                                title: newTitle.trim() || post.title,
                                content: newContent.trim() || post.content
                            });
                            renderForumUserProfile();
                            renderForum();
                            toast('编辑成功');
                        });
                    });
                }

                function deletePostFromProfile(postId) {
                    showConfirm('删除帖子', '确定要删除这篇帖子吗？', () => {
                        if (ForumAPI.deletePost(postId)) {
                            renderForumUserProfile();
                            renderForum();
                            toast('已删除');
                        }
                    });
                }

                function toggleProfileFollow(authorName) {
                    const followed = ForumAPI.toggleFollow(authorName);
                    if (followed) {
                        // 不再为"我关注了别人"创建通知，只有NPC关注我才创建通知
                        toast(`已关注 ${authorName}`);
                    } else {
                        toast(`已取消关注 ${authorName}`);
                    }
                    renderForumUserProfile();
                    renderForum();
                }

                // ========== FORUM: DM FROM PROFILE ==========
                function openDMFromProfile(name, avatar) {
                    // Ensure DM conversation exists, scoped to current account
                    const dms = ForumAPI.getDMs();
                    const currentAccountId = ForumAPI.getCurrentAccountId();
                    let dmId = null;
                    for (const k in dms) {
                        const dm = dms[k];
                        if (dm.name === name) {
                            // 匹配同一账号的私信
                            if (currentAccountId && dm.accountId === currentAccountId) { dmId = k; break; }
                            if (!currentAccountId && !dm.accountId) { dmId = k; break; }
                        }
                    }
                    if (!dmId) {
                        // Create new DM conversation with account binding
                        dmId = currentAccountId ? 'dm_' + name + '_' + currentAccountId : 'dm_' + Date.now();
                        if (!store.forumDMs) store.forumDMs = {};
                        store.forumDMs[dmId] = { name, avatar, msgs: [], accountId: currentAccountId || null };
                        save();
                    }
                    closeLayer('layer-forum-user-profile');
                    openForumDM(dmId);
                }

                // ========== FORUM: AI-POWERED DM REPLIES ==========
                // Helper: find or create mirror DM for the other party's account
                function _getOrCreateMirrorDM(contact, currentAccountId) {
                    if (!contact) return null;
                    const contactAccId = 'contact_' + contact.id;
                    // Check if the other party has a forum account
                    const otherAcc = ForumAPI.getAccounts().find(a => a.id === contactAccId);
                    if (!otherAcc) return null;
                    if (!store.forumDMs) store.forumDMs = {};
                    const mirrorKey = 'dm_mirror_' + (currentAccountId || 'main') + '_' + contactAccId;
                    if (!store.forumDMs[mirrorKey]) {
                        const senderName = ForumAPI.getDisplayName();
                        const senderAvatar = ForumAPI.getDisplayAvatar();
                        store.forumDMs[mirrorKey] = { name: senderName, avatar: senderAvatar || _ph(36), msgs: [], accountId: contactAccId };
                    }
                    return store.forumDMs[mirrorKey];
                }

                // Helper: find mirror DM when current user IS a contact account sending to someone
                function _getOrCreateMirrorDMReverse(recipientName, currentAccountId) {
                    if (!currentAccountId) return null;
                    // Find recipient's account (could be main or another contact)
                    const recipientContact = (store.contacts || []).find(c => c.name === recipientName);
                    const recipientAccId = recipientContact ? 'contact_' + recipientContact.id : null;
                    if (!store.forumDMs) store.forumDMs = {};
                    // Mirror key: from current contact account to recipient
                    const mirrorKey = 'dm_mirror_' + currentAccountId + '_' + (recipientAccId || 'main');
                    if (!store.forumDMs[mirrorKey]) {
                        const currentAcc = ForumAPI.getAccounts().find(a => a.id === currentAccountId);
                        const senderName = currentAcc ? currentAcc.name : '未知';
                        const senderAvatar = currentAcc ? currentAcc.avatar : _ph(36);
                        store.forumDMs[mirrorKey] = { name: senderName, avatar: senderAvatar, msgs: [], accountId: recipientAccId || null };
                    }
                    return store.forumDMs[mirrorKey];
                }

                // 论坛私信分条工具：将AI回复按换行/句号拆分为多条短消息
                function _splitDMReply(reply) {
                    if (!reply || !reply.trim()) return ['嗯嗯~'];
                    const raw = reply.trim().split(/\n+/).filter(p => p.trim());
                    // 如果AI没分行，尝试按句号等标点拆分
                    // [FIX-气泡消失] 移除lookbehind正则，改用捕获组+合并
                    if (raw.length === 1 && raw[0].length > 20) {
                        const _sentSplit = raw[0].split(/([。！？\?!])/g).filter(s => s.trim());
                        const sentences = [];
                        for (let si = 0; si < _sentSplit.length; si++) {
                            if (/^[。！？\?!]$/.test(_sentSplit[si]) && sentences.length > 0) {
                                sentences[sentences.length - 1] += _sentSplit[si];
                            } else {
                                sentences.push(_sentSplit[si]);
                            }
                        }
                        if (sentences.length > 1) return sentences.map(s => s.trim()).filter(Boolean);
                    }
                    // 进一步拆分超长单条（阈值提升到50字，避免逗号结尾碎片化）
                    const result = [];
                    for (const part of raw) {
                        if (part.length > 50) {
                            // [FIX-气泡消失] 移除lookbehind正则，改用捕获组+合并
                            const _subSplit2 = part.split(/([，,；;、])/g).filter(s => s.trim());
                            const sub = [];
                            for (let si = 0; si < _subSplit2.length; si++) {
                                if (/^[，,；;、]$/.test(_subSplit2[si]) && sub.length > 0) {
                                    sub[sub.length - 1] += _subSplit2[si];
                                } else {
                                    sub.push(_subSplit2[si]);
                                }
                            }
                            if (sub.length > 1) {
                                // 合并过短片段，避免逗号结尾
                                let buf = '';
                                for (const sp of sub) {
                                    if (buf.length + sp.length <= 50) {
                                        buf += sp;
                                    } else {
                                        if (buf) {
                                            let trimmed = buf.trim();
                                            if (/[，,、；;]$/.test(trimmed)) trimmed = trimmed.slice(0, -1).trim();
                                            if (trimmed) result.push(trimmed);
                                        }
                                        buf = sp;
                                    }
                                }
                                if (buf.trim()) {
                                    let trimmed = buf.trim();
                                    if (/[，,、；;]$/.test(trimmed)) trimmed = trimmed.slice(0, -1).trim();
                                    if (trimmed) result.push(trimmed);
                                }
                            }
                            else { result.push(part.trim()); }
                        } else {
                            result.push(part.trim());
                        }
                    }
                    return result.length > 0 ? result : ['嗯嗯~'];
                }

                async function forumSendDMAI() {
                    _currentApiScene = 'forum';
                    const input = document.getElementById('forum-dm-input');
                    const text = input.value.trim();
                    if (!text || !activeForumDMId) return;
                    const dm = ForumAPI.getDM(activeForumDMId);
                    if (!dm) return;
                    const sendTime = Date.now();
                    dm.msgs.push({ text, time: sendTime, isMe: true, read: true, senderAvatar: ForumAPI.getDisplayAvatar() });
                    input.value = '';
                    save();
                    renderForumDMChat(true); // animate sent bubble

                    // Find matching contact for AI persona
                    const npcName = dm.name;
                    const contact = store.contacts ? store.contacts.find(c => c.name === npcName) : null;
                    const currentAccountId = ForumAPI.getCurrentAccountId();

                    // Mirror sent message to recipient's account
                    let mirrorDM = null;
                    if (contact) {
                        mirrorDM = _getOrCreateMirrorDM(contact, currentAccountId);
                    } else if (currentAccountId) {
                        mirrorDM = _getOrCreateMirrorDMReverse(npcName, currentAccountId);
                    }
                    if (mirrorDM) {
                        mirrorDM.msgs.push({ text, time: sendTime, isMe: false, read: false });
                    }

                    // Show typing indicator
                    const dmAvatar = dm.avatar || _ph(28);
                    showForumDMTyping(true, dmAvatar);

                    if (contact) {
                        // AI-powered reply using contact persona
                        try {
                            const ctx = getAiContext(contact);
                            // Build recent DM history for context
                            const recentMsgs = (dm.msgs || []).slice(-6).map(m => ({
                                role: m.isMe ? 'user' : 'assistant',
                                content: m.text
                            }));
                            // Use the current account's display name (not real identity) for alt accounts
                            const senderName = ForumAPI.getDisplayName();
                            const isAlt = ForumAPI.isAltAccount();
                            const identityNote = isAlt
                                ? `\n注意：对方在论坛上的名字是"${senderName}"，你并不知道对方的真实身份，把对方当作普通网友对待。`
                                : '';
                            const systemPrompt = `${ctx}\n\n你正在论坛私信中和用户聊天。保持角色人设，用简短自然的口语回复。不要太正式。${identityNote}\n⚠️ 重要格式要求：这是私信聊天，你必须像真人发消息一样一条一条发。每条消息用\\n换行分隔，每条不超过15个字。禁止把所有话放在一条消息里！\n示例（正确）：哈哈好巧\\n你也在逛论坛啊\\n最近怎么样\n示例（错误）：哈哈好巧，你也在逛论坛啊，最近怎么样？`;
                            const messages = [
                                { role: 'system', content: systemPrompt },
                                ...recentMsgs
                            ];
                            const data = await API.chatCompletion(messages);
                            const reply = data?.choices?.[0]?.message?.content || '嗯嗯~';
                            // 分条发送：按换行符拆分，每条作为独立气泡
                            const replyParts = _splitDMReply(reply);
                            showForumDMTyping(false);
                            for (let ri = 0; ri < replyParts.length; ri++) {
                                const partTime = Date.now();
                                dm.msgs.push({ text: replyParts[ri], time: partTime, isMe: false, read: true });
                                if (mirrorDM) {
                                    mirrorDM.msgs.push({ text: replyParts[ri], time: partTime, isMe: true, read: true });
                                }
                                save();
                                renderForumDMChat(true);
                                if (ri < replyParts.length - 1) {
                                    await new Promise(r => setTimeout(r, 400 + Math.random() * 600));
                                }
                            }
                        } catch (e) {
                            console.error('Forum DM AI reply error:', e);
                            const fallback = '嗯嗯，好的~';
                            const fallbackTime = Date.now();
                            dm.msgs.push({ text: fallback, time: fallbackTime, isMe: false, read: true });
                            if (mirrorDM) {
                                mirrorDM.msgs.push({ text: fallback, time: fallbackTime, isMe: true, read: true });
                            }
                        }
                        save();
                        renderForumDMChat(true); // animate reply bubble
                    } else {
                        // NPC without contact: generate persona via AI, then reply
                        try {
                            // Generate a random NPC persona for unknown users
                            const npcPersonaPrompt = `你是一个论坛用户，名字叫"${npcName}"。请根据这个名字，想象一个合理的人设（性格、说话风格、兴趣爱好），然后以这个人设回复以下私信。用简短自然的口语回复（1-3句话），不要太正式，像真人聊天一样。不要输出人设描述，只输出回复内容。\n⚠️ 格式要求：每条消息用\\n换行分隔，每条不超过15个字。`;
                            const npcMessages = [
                                { role: 'system', content: npcPersonaPrompt },
                                { role: 'user', content: text }
                            ];
                            const npcData = await API.chatCompletion(npcMessages);
                            const npcReply = npcData?.choices?.[0]?.message?.content;
                            if (npcReply && npcReply.trim()) {
                                showForumDMTyping(false);
                                const npcParts = _splitDMReply(npcReply);
                                for (let ni = 0; ni < npcParts.length; ni++) {
                                    const partTime = Date.now();
                                    dm.msgs.push({ text: npcParts[ni], time: partTime, isMe: false, read: true });
                                    if (mirrorDM) {
                                        mirrorDM.msgs.push({ text: npcParts[ni], time: partTime, isMe: true, read: true });
                                    }
                                    save();
                                    renderForumDMChat(true);
                                    if (ni < npcParts.length - 1) {
                                        await new Promise(r => setTimeout(r, 400 + Math.random() * 600));
                                    }
                                }
                                return;
                            }
                        } catch (e) {
                            console.error('NPC AI reply error:', e);
                        }
                        // API失败就失败，不用随机预设回复
                        showForumDMTyping(false);
                        return;
                    }
                }

                // ========== FORUM: CONTACT LOGIN ==========
                let contactLoggedIn = store.forumContactLoggedIn || null; // { contactId, name, avatar }

                function openContactLoginModal() {
                    const settings = ForumAPI.getSettings();
                    const linkedIds = settings.linkedContacts || [];
                    const list = document.getElementById('forum-contact-login-list');
                    const statusEl = document.getElementById('forum-contact-login-status');
                    statusEl.style.display = 'none';

                    if (linkedIds.length === 0) {
                        list.innerHTML = `<div style="text-align:center; padding:30px; color:#bbb;">
                            <i class="fas fa-link" style="font-size:36px; margin-bottom:10px;"></i>
                            <div>暂无关联联系人</div>
                            <div style="font-size:12px; margin-top:6px;">请先在论坛设置中关联联系人</div>
                        </div>`;
                    } else {
                        let html = '';
                        // Show logout option if currently logged in as contact
                        if (contactLoggedIn) {
                            html += `<div style="padding:10px 14px; margin-bottom:10px; background:#fff3e0; border-radius:10px; display:flex; align-items:center; justify-content:space-between;">
                                <div style="display:flex; align-items:center; gap:8px;">
                                    <img src="${contactLoggedIn.avatar || _ph(32)}" style="width:32px; height:32px; border-radius:50%; object-fit:cover;">
                                    <div>
                                        <div style="font-size:13px; font-weight:600;">当前: ${escapeHtml(contactLoggedIn.name)}</div>
                                        <div style="font-size:11px; color:#e67e22;">已登录</div>
                                    </div>
                                </div>
                                <button onclick="logoutContactAccount()" style="padding:6px 14px; background:#e74c3c; color:#fff; border:none; border-radius:8px; font-size:13px; cursor:pointer;">退出</button>
                            </div>`;
                        }
                        linkedIds.forEach(cid => {
                            const contact = (store.contacts || []).find(c => c.id === cid);
                            if (!contact) return;
                            const isLoggedIn = contactLoggedIn && contactLoggedIn.contactId === cid;
                            html += `<div style="display:flex; align-items:center; padding:12px; background:${isLoggedIn ? '#e8f5e9' : '#f9f9f9'}; border-radius:12px; margin-bottom:8px; ${isLoggedIn ? 'border:1px solid #4caf50;' : 'border:1px solid transparent;'}">
                                <img src="${contact.avatar || _ph(44)}" style="width:44px; height:44px; border-radius:50%; object-fit:cover; margin-right:12px;">
                                <div style="flex:1; overflow:hidden;">
                                    <div style="font-size:14px; font-weight:500;">${escapeHtml(contact.name)} ${isLoggedIn ? '<span style="color:#4caf50; font-size:12px;">● 已登录</span>' : ''}</div>
                                    <div style="font-size:12px; color:#999; margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(contact.persona || '无人设')}</div>
                                </div>
                                ${isLoggedIn ? '' : `<button onclick="loginAsContact('${cid}')" style="padding:8px 16px; background:var(--primary); color:#fff; border:none; border-radius:10px; font-size:13px; cursor:pointer; white-space:nowrap;">登录</button>`}
                            </div>`;
                        });
                        list.innerHTML = html;
                    }
                    document.getElementById('modal-forum-contact-login').style.display = 'flex';
                }

                async function loginAsContact(contactId) {
                    const contact = (store.contacts || []).find(c => c.id === contactId);
                    if (!contact) { toast('联系人不存在'); return; }

                    const statusEl = document.getElementById('forum-contact-login-status');
                    statusEl.style.display = 'block';

                    // Check if account already exists (signature/data already generated)
                    let existingAcc = ForumAPI.getAccounts().find(a => a.contactId === contactId);
                    const isFirstLogin = !existingAcc;

                    if (isFirstLogin) {
                        // First login: generate forum data (signature, posts, DMs) via API
                        statusEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 正在为 ' + escapeHtml(contact.name) + ' 生成论坛数据...';
                        try {
                            await generateContactForumData(contact);
                        } catch (e) {
                            console.error('联系人登录失败:', e);
                            statusEl.innerHTML = '<i class="fas fa-exclamation-circle" style="color:#e74c3c;"></i> 生成失败: ' + e.message;
                            toast('登录失败: ' + e.message);
                            return;
                        }
                    } else {
                        statusEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 正在切换到 ' + escapeHtml(contact.name) + ' ...';
                    }

                    try {
                        // Save login state
                        contactLoggedIn = { contactId: contact.id, name: contact.name, avatar: contact.avatar || '' };
                        store.forumContactLoggedIn = contactLoggedIn;

                        // Create a virtual account for the contact if not exists (first login)
                        if (isFirstLogin) {
                            existingAcc = ForumAPI.getAccounts().find(a => a.contactId === contactId);
                            if (!existingAcc) {
                                const accId = 'contact_' + contactId;
                                const generatedBio = contact._forumBio || '';
                                ForumAPI.addAccount({
                                    id: accId,
                                    name: contact.name,
                                    avatar: contact.avatar || _ph(36),
                                    bio: generatedBio || (contact.persona ? contact.persona.substring(0, 50) : ''),
                                    contactId: contactId,
                                    isContactAccount: true,
                                    profile: {
                                        name: contact.name,
                                        avatar: contact.avatar || _ph(80),
                                        bio: generatedBio || (contact.persona ? contact.persona.substring(0, 100) : '')
                                    }
                                });
                                existingAcc = ForumAPI.getAccounts().find(a => a.contactId === contactId);
                            }
                        }
                        // For subsequent logins, keep existing signature/bio unchanged

                        // Switch to this contact's account
                        if (existingAcc) {
                            ForumAPI.switchAccount(existingAcc.id);
                            renderAccountSwitcher();
                            if (typeof initForumProfile === 'function') initForumProfile();
                            if (typeof renderForumMyTab === 'function') renderForumMyTab();
                            if (typeof renderForumMsgTab === 'function') renderForumMsgTab();
                        }

                        save();
                        statusEl.innerHTML = '<i class="fas fa-check" style="color:#4caf50;"></i> ' + escapeHtml(contact.name) + (isFirstLogin ? ' 的论坛数据已生成' : ' 已切换');
                        toast(contact.name + ' 已登录论坛');

                        // Refresh modal list
                        setTimeout(() => {
                            openContactLoginModal();
                        }, 1000);

                    } catch (e) {
                        console.error('联系人登录失败:', e);
                        statusEl.innerHTML = '<i class="fas fa-exclamation-circle" style="color:#e74c3c;"></i> 登录失败: ' + e.message;
                        toast('登录失败: ' + e.message);
                    }
                }

                async function generateContactForumData(contact) {
                    _currentApiScene = 'forum';
                    const settings = ForumAPI.getSettings();
                    // Get worldbook context
                    let wbContext = '';
                    const linkedWbIds = settings.linkedWorldbooks || [];
                    if (linkedWbIds.length > 0) {
                        const wbs = (store.worldbooks || []).filter(wb => linkedWbIds.includes(wb.id));
                        if (wbs.length > 0) wbContext = wbs.map(wb => `[${wb.name}]: ${wb.content}`).join('\n');
                    }

                    // Get user's main account info for context (优先使用关联联系人的用户人设)
                    const mainName = ForumAPI.getDisplayName();
                    const _userPersonaDesc = ForumAPI.getUserPersonaDesc();

                    // Get chat history with this contact for context
                    const chatHistory = (store.chats && store.chats[contact.id]) ? store.chats[contact.id].slice(-20) : [];
                    let chatContext = '';
                    if (chatHistory.length > 0) {
                        chatContext = chatHistory.map(m => `${m.sender === 'me' ? mainName : contact.name}: ${(m.content || m.text || '').substring(0, 80)}`).join('\n');
                    }

                    const accId = 'contact_' + contact.id;

                    // Generate bio/signature + homepage posts together
                    const sysPrompt = `你是${contact.name}。${contact.gender ? `性别：${contact.gender}。` : ''}你的人设：${contact.persona || '普通人'}。
${_userPersonaDesc ? `【用户信息】用户名：${mainName}，用户人设：${_userPersonaDesc}\n` : ''}
${wbContext ? `世界观设定：\n${wbContext}\n` : ''}
${chatContext ? `你和${mainName}的近期聊天记录（作为参考）：\n${chatContext}\n` : ''}
你正在使用一个论坛。请以${contact.name}的身份和口吻完成以下任务：

任务1：写一句符合你人设和性格的个性签名（10-30字，要有个人特色，不要太正式）。
任务2：写3条论坛帖子，内容要符合你的人设${wbContext ? '和世界观设定' : ''}。

格式要求（严格遵守）：
第一行写个性签名（不加任何前缀）
然后空一行
接下来每条帖子用 --- 分隔
每条帖子第一行是标题（不超过15字）
第二行开始是正文内容（30-100字）
不要加任何标签、前缀或格式符号。`;

                    const data = await API.chatCompletion([
                        { role: 'system', content: sysPrompt },
                        { role: 'user', content: '请发3条帖子' }
                    ]);
                    const reply = data.choices[0].message.content.trim();
                    
                    // Parse bio (first line before ---) and posts
                    const parts = reply.split('---').map(b => b.trim()).filter(b => b);
                    let contactBio = '';
                    let postBlocks = parts;
                    if (parts.length > 0) {
                        // First part before any --- is the bio section
                        const firstLines = parts[0].split('\n').filter(l => l.trim());
                        if (firstLines.length === 1 && firstLines[0].length <= 50) {
                            // First part is just the bio line
                            contactBio = firstLines[0].trim();
                            postBlocks = parts.slice(1);
                        } else if (firstLines.length > 1) {
                            // Bio is first line, rest might be first post
                            contactBio = firstLines[0].trim();
                            // Reconstruct first post block without bio line
                            const remainingLines = firstLines.slice(1).join('\n');
                            postBlocks = [remainingLines, ...parts.slice(1)];
                        }
                    }
                    
                    // Update or create account with proper bio
                    let existingAcc = ForumAPI.getAccounts().find(a => a.contactId === contact.id);
                    if (existingAcc) {
                        existingAcc.bio = contactBio || existingAcc.bio;
                        if (existingAcc.profile) existingAcc.profile.bio = contactBio || existingAcc.profile.bio;
                        else existingAcc.profile = { bio: contactBio, name: contact.name, avatar: contact.avatar || '' };
                    }
                    // Store bio for loginAsContact to use
                    contact._forumBio = contactBio;

                    // Remove old posts from this contact account
                    store.forumPosts = (store.forumPosts || []).filter(p => p.accountId !== accId);

                    postBlocks.forEach((block, idx) => {
                        const lines = block.split('\n').filter(l => l.trim());
                        const title = lines[0] || `${contact.name}的动态`;
                        const content = lines.slice(1).join('\n') || block;
                        store.forumPosts.push({
                            id: 'fp_cl_' + Date.now() + '_' + idx,
                            title: title.substring(0, 30),
                            content: content.substring(0, 300),
                            author: contact.name,
                            avatar: contact.avatar || _ph(36),
                            time: Date.now() - Math.floor(Math.random() * 3600000) - idx * 600000,
                            likes: [],
                            stars: [],
                            comments: [],
                            isMe: true,
                            isContactAccount: true,
                            contactId: contact.id,
                            accountId: accId
                        });
                    });

                    // Generate a DM conversation between contact and a random NPC
                    const dmPrompt = `你是${contact.name}。${contact.gender ? `性别：${contact.gender}。` : ''}你的人设：${contact.persona || '普通人'}。
${wbContext ? `世界观设定：\n${wbContext}\n` : ''}
请模拟${contact.name}和一个论坛网友的私信对话，共4-6条消息。
格式要求：
每行一条消息，格式为 "发送者: 消息内容"
发送者只能是"${contact.name}"或"网友"
内容要自然、符合人设。`;

                    try {
                        const dmData = await API.chatCompletion([
                            { role: 'system', content: dmPrompt },
                            { role: 'user', content: '请生成私信对话' }
                        ]);
                        const dmReply = dmData.choices[0].message.content.trim();
                        const dmLines = dmReply.split('\n').filter(l => l.trim());
                        const npcName = '论坛网友';
                        const npcAvatar = _ph(36);
                        const dmKey = 'dm_contact_' + contact.id + '_npc';

                        if (!store.forumDMs) store.forumDMs = {};
                        const contactAccId = 'contact_' + contact.id;
                        store.forumDMs[dmKey] = { name: npcName, avatar: npcAvatar, msgs: [], accountId: contactAccId };

                        dmLines.forEach((line, i) => {
                            const isContact = line.includes(contact.name + ':') || line.includes(contact.name + '：');
                            const msgText = line.replace(/^[^:：]+[:：]\s*/, '').trim();
                            if (msgText) {
                                store.forumDMs[dmKey].msgs.push({
                                    text: msgText,
                                    time: Date.now() - (dmLines.length - i) * 60000,
                                    isMe: isContact,
                                    read: true
                                });
                            }
                        });
                    } catch (e) {
                        console.error('联系人DM生成失败:', e);
                    }

                    save();
                    renderForum();
                }

                function logoutContactAccount() {
                    if (!contactLoggedIn) return;
                    const contactId = contactLoggedIn.contactId;
                    contactLoggedIn = null;
                    store.forumContactLoggedIn = null;

                    // Switch back to main account
                    ForumAPI.switchAccount(null);

                    // Reset forum UI state to avoid stale data
                    forumFeedTab = 0;
                    forumSearchQuery = '';
                    forumSearchResults = [];
                    forumSearching = false;
                    activeForumPostId = null;

                    // Re-render all forum sections with main account data
                    renderAccountSwitcher();
                    if (typeof initForumProfile === 'function') initForumProfile();
                    if (typeof renderForumMyTab === 'function') renderForumMyTab();
                    if (typeof renderForumMsgTab === 'function') renderForumMsgTab();
                    if (typeof renderForum === 'function') renderForum();
                    updateForumMsgDot();

                    save();
                    toast('已退出联系人账号');
                    document.getElementById('modal-forum-contact-login').style.display = 'none';
                }

                // ========== FORUM SECTION MANAGER ==========
                function openForumSectionManager() {
                    renderForumSectionManagerList();
                    document.getElementById('modal-forum-section-manager').style.display = 'flex';
                }

                function renderForumSectionManagerList() {
                    const list = document.getElementById('forum-section-list');
                    if (!list) return;
                    const sections = store.forumSections || [];
                    if (sections.length === 0) {
                        list.innerHTML = '<div style="text-align:center; padding:20px; color:#bbb; font-size:13px;"><i class="fas fa-th-large" style="font-size:28px; display:block; margin-bottom:8px; opacity:0.3;"></i>暂无板块，点击下方添加</div>';
                        return;
                    }
                    list.innerHTML = sections.map(s => `
                        <div style="display:flex; align-items:center; background:#fff; border:1px solid #eee; border-radius:10px; padding:12px 14px; margin-bottom:8px; gap:10px;">
                            <div style="flex:1; overflow:hidden;">
                                <div style="font-size:14px; font-weight:600; color:#333;">${escapeHtml(s.name)}</div>
                                <div style="font-size:12px; color:#999; margin-top:2px; display:flex; gap:8px; flex-wrap:wrap;">
                                    ${s.worldview ? `<span><i class="fas fa-globe" style="color:#10b981;"></i> ${s.worldview.substring(0, 20)}…</span>` : '<span style="color:#ccc;">无世界观</span>'}
                                    ${s.minChars || s.maxChars ? `<span><i class="fas fa-text-width" style="color:#8b5cf6;"></i> ${s.minChars||0}-${s.maxChars||'∞'}字</span>` : ''}
                                </div>
                                <div style="font-size:11px; color:#bbb; margin-top:2px;">${(store.forumPosts||[]).filter(p=>p.sectionId===s.id).length} 篇帖子</div>
                            </div>
                            <div style="display:flex; gap:8px; flex-shrink:0;">
                                <button onclick="openEditSectionModal('${s.id}')" style="padding:5px 10px; border:1px solid #ddd; background:#fff; color:#555; border-radius:6px; font-size:12px; cursor:pointer;"><i class="fas fa-edit"></i></button>
                                <button onclick="deleteSectionConfirm('${s.id}')" style="padding:5px 10px; border:1px solid #fca5a5; background:#fff; color:#ef4444; border-radius:6px; font-size:12px; cursor:pointer;"><i class="fas fa-trash"></i></button>
                            </div>
                        </div>
                    `).join('');
                }

                function openAddSectionModal() {
                    document.getElementById('forum-section-edit-id').value = '';
                    document.getElementById('forum-section-edit-name').value = '';
                    document.getElementById('forum-section-edit-worldview').value = '';
                    document.getElementById('forum-section-edit-rules').value = '';
                    document.getElementById('forum-section-edit-minchars').value = '';
                    document.getElementById('forum-section-edit-maxchars').value = '';
                    const titleEl = document.getElementById('forum-section-edit-title');
                    if (titleEl) titleEl.innerHTML = '<i class="fas fa-plus" style="margin-right:8px; color:var(--primary);"></i>新建板块';
                    _renderSectionEditContacts(null);
                    _renderSectionEditWorldbooks(null);
                    document.getElementById('modal-forum-section-edit').style.display = 'flex';
                }

                function openEditSectionModal(sectionId) {
                    const sec = (store.forumSections || []).find(s => s.id === sectionId);
                    if (!sec) return;
                    document.getElementById('forum-section-edit-id').value = sec.id;
                    document.getElementById('forum-section-edit-name').value = sec.name || '';
                    document.getElementById('forum-section-edit-worldview').value = sec.worldview || '';
                    document.getElementById('forum-section-edit-rules').value = sec.rules || '';
                    document.getElementById('forum-section-edit-minchars').value = sec.minChars || '';
                    document.getElementById('forum-section-edit-maxchars').value = sec.maxChars || '';
                    const titleEl = document.getElementById('forum-section-edit-title');
                    if (titleEl) titleEl.innerHTML = `<i class="fas fa-edit" style="margin-right:8px; color:var(--primary);"></i>编辑板块：${escapeHtml(sec.name)}`;
                    _renderSectionEditContacts(sec);
                    _renderSectionEditWorldbooks(sec);
                    document.getElementById('modal-forum-section-edit').style.display = 'flex';
                }

                function _renderSectionEditContacts(sec) {
                    const div = document.getElementById('forum-section-edit-contacts');
                    if (!div) return;
                    const contacts = store.contacts || [];
                    const linked = sec ? (sec.linkedContacts || []) : [];
                    if (contacts.length === 0) {
                        div.innerHTML = '<div style="text-align:center;padding:12px 8px;">' +
                            '<div style="font-size:12px;color:#bbb;margin-bottom:8px;">还没有联系人</div>' +
                            '<button onclick="if(typeof exitApp===\'function\') exitApp(); if(typeof openApp===\'function\') openApp(\'wechat\');" style="padding:4px 14px;background:#333;color:#fff;border:none;border-radius:6px;font-size:11px;cursor:pointer;">去微信创建</button>' +
                        '</div>';
                        return;
                    }
                    div.innerHTML = contacts.map(c => `
                        <label style="display:flex; align-items:center; padding:7px 8px; border-radius:8px; cursor:pointer; margin-bottom:4px; background:#fff;">
                            <input type="checkbox" class="sec-edit-contact" value="${c.id}" ${linked.includes(c.id) ? 'checked' : ''} style="width:16px; height:16px; margin-right:8px; accent-color:var(--primary);">
                            <img src="${c.avatar || _ph(28)}" style="width:28px; height:28px; border-radius:50%; margin-right:8px; object-fit:cover;">
                            <span style="font-size:13px;">${escapeHtml(c.name)}</span>
                        </label>
                    `).join('');
                }

                function _renderSectionEditWorldbooks(sec) {
                    const div = document.getElementById('forum-section-edit-worldbooks');
                    if (!div) return;
                    const wbs = store.worldbooks || [];
                    const linked = sec ? (sec.linkedWorldbooks || []) : [];
                    if (wbs.length === 0) {
                        div.innerHTML = '<div style="text-align:center;padding:12px 8px;">' +
                            '<div style="font-size:12px;color:#bbb;margin-bottom:8px;">还没有世界书</div>' +
                            '<button onclick="if(typeof exitApp===\'function\') exitApp(); if(typeof openApp===\'function\') openApp(\'worldbook\');" style="padding:4px 14px;background:#333;color:#fff;border:none;border-radius:6px;font-size:11px;cursor:pointer;">去创建</button>' +
                        '</div>';
                        return;
                    }
                    div.innerHTML = wbs.map(wb => `
                        <label style="display:flex; align-items:center; padding:7px 8px; border-radius:8px; cursor:pointer; margin-bottom:4px; background:#fff;">
                            <input type="checkbox" class="sec-edit-wb" value="${wb.id}" ${linked.includes(wb.id) ? 'checked' : ''} style="width:16px; height:16px; margin-right:8px; accent-color:#f59e0b;">
                            <i class="fas fa-book" style="margin-right:8px; color:#f59e0b; font-size:14px;"></i>
                            <span style="font-size:13px;">${escapeHtml(wb.name)}</span>
                        </label>
                    `).join('');
                }

                function saveSectionEdit() {
                    const idVal = document.getElementById('forum-section-edit-id').value.trim();
                    const name = document.getElementById('forum-section-edit-name').value.trim();
                    if (!name) return toast('请输入板块名称');
                    const worldview = document.getElementById('forum-section-edit-worldview').value.trim();
                    const rules = document.getElementById('forum-section-edit-rules').value.trim();
                    const minChars = parseInt(document.getElementById('forum-section-edit-minchars').value) || 0;
                    const maxChars = parseInt(document.getElementById('forum-section-edit-maxchars').value) || 0;
                    if (maxChars > 0 && minChars > maxChars) return toast('最少字数不能大于最多字数');
                    const linkedContacts = Array.from(document.querySelectorAll('.sec-edit-contact:checked')).map(cb => cb.value);
                    const linkedWorldbooks = Array.from(document.querySelectorAll('.sec-edit-wb:checked')).map(cb => cb.value);

                    if (!store.forumSections) store.forumSections = [];
                    if (idVal) {
                        // Edit existing
                        const sec = store.forumSections.find(s => s.id === idVal);
                        if (sec) {
                            sec.name = name;
                            sec.worldview = worldview;
                            sec.rules = rules;
                            sec.minChars = minChars;
                            sec.maxChars = maxChars;
                            sec.linkedContacts = linkedContacts;
                            sec.linkedWorldbooks = linkedWorldbooks;
                        }
                        save();
                        toast(`板块「${name}」已更新`);
                    } else {
                        // New section
                        const newSec = {
                            id: 'sec_' + Date.now(),
                            name, worldview, rules,
                            minChars, maxChars,
                            linkedContacts, linkedWorldbooks
                        };
                        store.forumSections.push(newSec);
                        save();
                        toast(`板块「${name}」已创建`);
                    }
                    document.getElementById('modal-forum-section-edit').style.display = 'none';
                    renderForumSectionManagerList();
                    renderForumSectionBar();
                }

                function closeSectionEditModal() {
                    document.getElementById('modal-forum-section-edit').style.display = 'none';
                }

                function deleteSectionConfirm(sectionId) {
                    const sec = (store.forumSections || []).find(s => s.id === sectionId);
                    if (!sec) return;
                    if (!confirm(`确定删除板块「${sec.name}」？\n该板块的帖子不会删除，但会变为"未分类"。`)) return;
                    store.forumSections = store.forumSections.filter(s => s.id !== sectionId);
                    // Remove sectionId from posts in that section (keep posts, just unassign)
                    (store.forumPosts || []).forEach(p => { if (p.sectionId === sectionId) p.sectionId = null; });
                    // If currently viewing that section, switch to all
                    if (store.currentForumSectionId === sectionId) {
                        store.currentForumSectionId = null;
                        const titleEl = document.getElementById('forum-home-title');
                        if (titleEl) titleEl.textContent = '广场';
                    }
                    save();
                    renderForumSectionManagerList();
                    renderForumSectionBar();
                    renderForum();
                    toast(`板块「${sec.name}」已删除`);
                }

                // Initialize section bar on forum open
                renderForumSectionBar();

                // Expose nested forum functions to global scope for onclick handlers
                window.clearForumData = clearForumData;
                window.openForumSettings = openForumSettings;
                window.closeForumSettingsPanel = closeForumSettingsPanel;
                window.openForumSectionManager = openForumSectionManager;
                window.openAddSectionModal = openAddSectionModal;
                window.openEditSectionModal = openEditSectionModal;
                window.saveSectionEdit = saveSectionEdit;
                window.closeSectionEditModal = closeSectionEditModal;
                window.deleteSectionConfirm = deleteSectionConfirm;
                window.switchForumSection = switchForumSection;
                window.renderForumSectionBar = renderForumSectionBar;
                window.randomNPC = randomNPC;
                window.randomPick = randomPick;
                window.addForumNotif = addForumNotif;
                window.FORUM_NPC_COMMENTS = FORUM_NPC_COMMENTS;
                window.generateContextualComment = generateContextualComment;
                if (typeof renderForumMyTab === 'function') window.renderForumMyTab = renderForumMyTab;
                window.forumRefreshFeed = forumRefreshFeed;
                window.forumDoSearch = forumDoSearch;
                window.forumClearSearch = forumClearSearch;
                window.forumSearchFromTrending = forumSearchFromTrending;
                window.forumLoadTrending = forumLoadTrending;
                window.generateRealisticEngagement = generateRealisticEngagement;
                window.openForumUserProfile = openForumUserProfile;
                window.toggleProfileFollow = toggleProfileFollow;
                window.switchProfileTab = switchProfileTab;
                window.openDMFromProfile = openDMFromProfile;
                window.forumSendDMAI = forumSendDMAI;
                window.openForumDM = openForumDM;
                window.renderForumDMChat = renderForumDMChat;
                window.renderForumDMList = renderForumMsgTab;
                window.forumSendDM = forumSendDM;
                async function forumGenerateSignature() {
                    const sigEl = document.getElementById('forum-edit-signature');
                    if (!sigEl) return;
                    if (!store.system?.key) return toast('请先配置API');
                    const p = ForumAPI.getProfile();
                    const acc = ForumAPI.getCurrentAccount();
                    let personaHint = '';
                    if (acc && acc.isContactAccount && acc.contactId) {
                        const contact = store.contacts.find(c => c.id === acc.contactId);
                        if (contact) personaHint = `你是${contact.name}，人设：${contact.persona || '普通人'}。`;
                    }
                    const nameHint = p.name || store.user?.name || '用户';
                    const bioHint = p.bio || '';
                    const prompt = `${personaHint || '你是论坛用户' + nameHint + '。'}${bioHint ? '简介：' + bioHint + '。' : ''}请生成一句个性签名（10-30字），要有个人特色，符合人设。`;
                    sigEl.value = '生成中...';
                    try {
                        const data = await API.chatCompletion([
                            { role: 'system', content: prompt },
                            { role: 'user', content: '请生成个性签名' }
                        ]);
                        const result = (data.choices[0].message.content || '').trim().replace(/^["'"""'']+|["'"""'']+$/g, '').substring(0, 60);
                        sigEl.value = result || '签名生成失败';
                    } catch (e) {
                        sigEl.value = '';
                        toast('签名生成失败: ' + e.message);
                    }
                }

                window.forumEditProfile = forumEditProfile;
                window.forumSaveProfile = forumSaveProfile;
                window.forumGenerateSignature = forumGenerateSignature;
                window.renderAccountSwitcher = renderAccountSwitcher;
                window.ForumAPI = ForumAPI;
                window.openContactLoginModal = openContactLoginModal;
                window.loginAsContact = loginAsContact;
                window.logoutContactAccount = logoutContactAccount;
                window.saveForumSettings = saveForumSettings;
                window.batchGenerateForumContent = batchGenerateForumContent;
                window.forumMeTab = forumMeTab;
                // [FIX] 补充暴露论坛嵌套闭包中被HTML onclick引用的函数
                window.forumFeedSwitchTab = forumFeedSwitchTab;
                window.forumSwitchTab = forumSwitchTab;
                window.forumDetailLike = forumDetailLike;
                window.forumDetailStar = forumDetailStar;
                window.forumShowNotifType = forumShowNotifType;
                window.forumUploadBg = forumUploadBg;
                window.forumUploadAvatar = forumUploadAvatar;
                window.submitForumRepost = submitForumRepost;
                window.submitForumShare = submitForumShare;
                window.submitForumComment = submitForumComment;
                window.editCurrentPost = editCurrentPost;
                window.deleteCurrentPost = deleteCurrentPost;
                window.openNewPostModal = openNewPostModal;
                window.submitNewPost = submitNewPost;
                window.forumSharePost = forumSharePost;
                window.toggleForumProfileMenu = function() {
                    // 论坛用户资料页更多菜单（暂未实现完整菜单，点击无反应的占位）
                    toast('功能开发中');
                };

