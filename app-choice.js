/* ============================================================
   "选择" 功能模块 — app-choice.js
   核心：个人预设体系 / 情景卡 / 邀请联系人 / 辩论推荐 / 命运转盘 / 决策反馈
   ============================================================ */

// ---- 数据初始化 ----
function _initChoiceData() {
    if (!store.choice) {
        store.choice = {
            categories: [],
            history: [],
            settings: {}
        };
    }
    if (!store.choice.categories || store.choice.categories.length === 0) {
        store.choice.categories = _getDefaultChoiceCategories();
    }
    if (!store.choice.history) store.choice.history = [];
}

function _getDefaultChoiceCategories() {
    return [
        {
            id: 'cat_food', name: '今天吃什么', icon: '🍜', iconClass: 'food',
            subCategories: [
                { id: 'sub_cook', name: '自己做饭', options: [
                    { id: 'opt_1', name: '番茄炒蛋', note: '经典家常菜，10分钟搞定', img: '', stars: 4, freq: 12 },
                    { id: 'opt_2', name: '可乐鸡翅', note: '甜咸口味，下饭神器', img: '', stars: 5, freq: 8 },
                    { id: 'opt_3', name: '蒜蓉西兰花', note: '健康低卡', img: '', stars: 3, freq: 5 },
                    { id: 'opt_4', name: '酸辣土豆丝', note: '开胃下饭', img: '', stars: 4, freq: 10 }
                ]},
                { id: 'sub_delivery', name: '点外卖', options: [
                    { id: 'opt_5', name: '牛腩煲', note: '浓郁汤底，冬天必备', img: '', stars: 4, freq: 6 },
                    { id: 'opt_6', name: '黄焖鸡米饭', note: '性价比之王', img: '', stars: 4, freq: 15 },
                    { id: 'opt_7', name: '麻辣香锅', note: '想吃辣就选它', img: '', stars: 5, freq: 9 },
                    { id: 'opt_8', name: '轻食沙拉', note: '减脂期首选', img: '', stars: 3, freq: 4 }
                ]},
                { id: 'sub_dineout', name: '出去吃', options: [
                    { id: 'opt_9', name: '广式早茶', note: '虾饺烧卖样样来', img: '', stars: 5, freq: 3 },
                    { id: 'opt_10', name: '日料', note: '寿司刺身一口入魂', img: '', stars: 5, freq: 4 },
                    { id: 'opt_11', name: '火锅', note: '社交聚餐首选', img: '', stars: 5, freq: 7 },
                    { id: 'opt_12', name: '西餐', note: '牛排意面红酒', img: '', stars: 4, freq: 2 }
                ]}
            ]
        },
        {
            id: 'cat_outfit', name: '今天穿什么', icon: '👔', iconClass: 'outfit',
            subCategories: [
                { id: 'sub_casual', name: '休闲', options: [
                    { id: 'opt_20', name: '卫衣+牛仔裤', note: '百搭不出错', img: '', stars: 4, freq: 20 },
                    { id: 'opt_21', name: 'T恤+短裤', note: '夏日清凉', img: '', stars: 3, freq: 12 }
                ]},
                { id: 'sub_formal', name: '正式', options: [
                    { id: 'opt_22', name: '衬衫+西裤', note: '商务场合', img: '', stars: 4, freq: 5 },
                    { id: 'opt_23', name: '连衣裙', note: '优雅知性', img: '', stars: 5, freq: 3 }
                ]},
                { id: 'sub_date', name: '约会', options: [
                    { id: 'opt_24', name: '针织衫+半裙', note: '温柔气质', img: '', stars: 5, freq: 2 },
                    { id: 'opt_25', name: '皮衣+黑裤', note: '酷飒风格', img: '', stars: 4, freq: 4 }
                ]}
            ]
        },
        {
            id: 'cat_jewelry', name: '戴什么首饰', icon: '💍', iconClass: 'jewelry',
            subCategories: [
                { id: 'sub_daily_j', name: '日常', options: [
                    { id: 'opt_30', name: '简约项链', note: '百搭款', img: '', stars: 4, freq: 15 },
                    { id: 'opt_31', name: '小耳钉', note: '精致不张扬', img: '', stars: 4, freq: 18 }
                ]},
                { id: 'sub_special_j', name: '特别场合', options: [
                    { id: 'opt_32', name: '珍珠耳环', note: '优雅大方', img: '', stars: 5, freq: 2 },
                    { id: 'opt_33', name: '手镯套装', note: '叠戴更时髦', img: '', stars: 4, freq: 3 }
                ]}
            ]
        },
        {
            id: 'cat_weekend', name: '周末去哪玩', icon: '🎯', iconClass: 'trip',
            subCategories: [
                { id: 'sub_outdoor', name: '户外', options: [
                    { id: 'opt_40', name: '公园野餐', note: '带上零食和毯子', img: '', stars: 5, freq: 4 },
                    { id: 'opt_41', name: '爬山徒步', note: '亲近自然', img: '', stars: 4, freq: 2 }
                ]},
                { id: 'sub_indoor', name: '室内', options: [
                    { id: 'opt_42', name: '看展览', note: '文艺充电', img: '', stars: 4, freq: 3 },
                    { id: 'opt_43', name: '桌游聚会', note: '朋友一起嗨', img: '', stars: 5, freq: 5 }
                ]}
            ]
        },
        {
            id: 'cat_movie', name: '看什么电影', icon: '🎬', iconClass: 'movie',
            subCategories: [
                { id: 'sub_genre', name: '类型', options: [
                    { id: 'opt_50', name: '喜剧片', note: '笑一笑十年少', img: '', stars: 4, freq: 8 },
                    { id: 'opt_51', name: '悬疑片', note: '烧脑刺激', img: '', stars: 5, freq: 6 },
                    { id: 'opt_52', name: '爱情片', note: '甜蜜暴击', img: '', stars: 4, freq: 5 },
                    { id: 'opt_53', name: '动画片', note: '找回童心', img: '', stars: 4, freq: 4 }
                ]}
            ]
        }
    ];
}

// ---- 微信WebView强制刷新辅助 ----
// 通过替换滚动容器来强制微信WebView重新渲染内容
function _choiceRefreshContainer(containerId, renderFn) {
    var container = document.getElementById(containerId);
    if (!container) { if (renderFn) renderFn(); return; }
    var parent = container.parentNode;
    // 克隆容器（不含子节点），替换原容器
    var newContainer = document.createElement(container.tagName);
    newContainer.id = container.id;
    newContainer.className = container.className;
    // 复制内联样式
    if (container.style.cssText) newContainer.style.cssText = container.style.cssText;
    parent.replaceChild(newContainer, container);
    // 执行渲染（往新容器写入内容）
    if (renderFn) renderFn();
}

// ---- 状态变量 ----
var _choiceActiveCatId = null;
var _choiceActiveSubIdx = 0;
var _choiceScenarioCard = {};
var _choiceInvitedContacts = [];
var _choiceRecommendations = [];
var _choiceWheelRejectCount = 0;
var _choiceWheelSpinning = false;
var _choiceCurrentSessionId = null;
var _choiceWheelAngle = 0;
var _choiceWheelAnimId = null;
var _choiceCatMenuOpen = false;

// ---- 主页面 ----
function openChoiceModule() {
    _initChoiceData();
    document.getElementById('layer-choice').classList.add('show');
    renderChoiceHome();
}

function renderChoiceHome() {
    _initChoiceData();
    var cats = store.choice.categories;
    var history = store.choice.history || [];
    var area = document.getElementById('choice-home-content');

    var catsHtml = cats.map(function(c) {
        var totalOptions = (c.subCategories || []).reduce(function(s, sc) { return s + (sc.options || []).length; }, 0);
        var iconCls = 'choice-cat-icon-' + (c.iconClass || 'default');
        return '<div class="choice-cat-card" data-cat-id="' + c.id + '" onclick="openChoiceCategory(\'' + c.id + '\')">' +
            '<div class="choice-cat-card-del" onclick="event.stopPropagation();deleteChoiceCategoryQuick(\'' + c.id + '\')" title="删除"><i class="fas fa-times"></i></div>' +
            '<div class="choice-cat-card-icon ' + iconCls + '">' + (c.icon || '📋') + '</div>' +
            '<div class="choice-cat-card-name">' + _escChoice(c.name) + '</div>' +
            '<div class="choice-cat-card-count">' + totalOptions + ' 个选项</div>' +
            '<i class="fas fa-chevron-right choice-cat-card-arrow"></i>' +
        '</div>';
    }).join('');

    catsHtml += '<div class="choice-cat-card add-card" onclick="openChoiceCatEdit()">' +
        '<div class="add-icon"><i class="fas fa-plus"></i></div>' +
        '<div class="add-text">新建类别</div>' +
    '</div>';

    var historyHtml = '';
    if (history.length > 0) {
        var recent = history.slice(-5).reverse();
        historyHtml = recent.map(function(h) {
            var cat = cats.find(function(c) { return c.id === h.categoryId; });
            var helpers = (h.invitedContacts || []).map(function(cid) {
                var ct = store.contacts.find(function(x) { return x.id === cid; });
                return ct ? '<img class="choice-history-avatar" src="' + (ct.avatar || _ph(22)) + '">' : '';
            }).join('');
            var d = new Date(h.createdAt);
            var timeStr = (d.getMonth()+1) + '/' + d.getDate() + ' ' + d.getHours() + ':' + String(d.getMinutes()).padStart(2,'0');
            return '<div class="choice-history-card">' +
                '<div class="choice-history-top">' +
                    '<span class="choice-history-tag">' + (cat ? cat.icon + ' ' + _escChoice(cat.name) : '已删除') + '</span>' +
                    '<span class="choice-history-time">' + timeStr + '</span>' +
                '</div>' +
                '<div class="choice-history-result">' + _escChoice(h.result || '未选择') + '</div>' +
                '<div class="choice-history-helpers">' +
                    helpers +
                    (h.invitedContacts && h.invitedContacts.length > 0 ? '<span class="choice-history-helper-text">' + h.invitedContacts.length + '人参与</span>' : '<span class="choice-history-helper-text">独自决定</span>') +
                '</div>' +
            '</div>';
        }).join('');
    }

    area.innerHTML =
        '<div class="choice-hero">' +
            '<div class="choice-hero-label">CHOICE ✦</div>' +
            '<div class="choice-hero-title">与其为难自己，<br>不如为难别人 ～</div>' +
            '<div class="choice-hero-sub">把纠结丢给朋友，让选择变成快乐的事</div>' +
            '<div class="choice-hero-icon"><i class="fas fa-dice"></i></div>' +
        '</div>' +
        '<div class="choice-section-title">我的选择库 ✨</div>' +
        '<div class="choice-categories">' + catsHtml + '</div>' +
        (history.length > 0 ? '<div class="choice-section-title">最近的选择 📝</div><div class="choice-history-section">' + historyHtml + '</div>' : '');
}

// ---- 类别详情页 ----
function openChoiceCategory(catId) {
    _initChoiceData();
    _choiceActiveCatId = catId;
    _choiceActiveSubIdx = 0;
    document.getElementById('layer-choice-category').classList.add('show');
    renderChoiceCategoryDetail();
}

function renderChoiceCategoryDetail() {
    var cat = store.choice.categories.find(function(c) { return c.id === _choiceActiveCatId; });
    if (!cat) return;
    var area = document.getElementById('choice-category-content');
    var subs = cat.subCategories || [];
    var activeSub = subs[_choiceActiveSubIdx] || subs[0];
    var options = activeSub ? (activeSub.options || []) : [];
    var iconCls = 'choice-cat-icon-' + (cat.iconClass || 'default');

    var subTabsHtml = subs.map(function(s, i) {
        return '<div class="choice-sub-tab ' + (i === _choiceActiveSubIdx ? 'active' : '') + '" onclick="_choiceActiveSubIdx=' + i + ';renderChoiceCategoryDetail()">' + _escChoice(s.name) + '</div>';
    }).join('');

    var optionsHtml = options.map(function(o) {
        var starsHtml = '';
        for (var si = 0; si < 5; si++) starsHtml += si < (o.stars || 0) ? '★' : '☆';
        return '<div class="choice-option-item" data-opt-id="' + o.id + '">' +
            '<div style="display:flex;align-items:center;gap:12px;flex:1;min-width:0;" onclick="openChoiceOptionEdit(\'' + _choiceActiveCatId + '\',\'' + activeSub.id + '\',\'' + o.id + '\')">' +
                (o.img ? '<img class="choice-option-img" src="' + o.img + '">' : '<div class="choice-option-img no-img">' + cat.icon + '</div>') +
                '<div class="choice-option-info">' +
                    '<div class="choice-option-name">' + _escChoice(o.name) + '</div>' +
                    '<div class="choice-option-note">' + _escChoice(o.note || '') + '</div>' +
                '</div>' +
                '<div class="choice-option-meta">' +
                    '<div class="choice-option-stars">' + starsHtml + '</div>' +
                    '<div class="choice-option-freq">选过' + (o.freq || 0) + '次</div>' +
                '</div>' +
            '</div>' +
            '<div class="choice-option-del" onclick="event.stopPropagation();deleteChoiceOptionQuick(\'' + _choiceActiveCatId + '\',\'' + activeSub.id + '\',\'' + o.id + '\')" title="删除"><i class="fas fa-trash-alt"></i></div>' +
        '</div>';
    }).join('');

    var totalOptions = subs.reduce(function(s, sc) { return s + (sc.options || []).length; }, 0);

    area.innerHTML =
        '<div class="choice-cat-header">' +
            '<div class="choice-cat-header-top">' +
                '<div class="choice-cat-header-icon ' + iconCls + '">' + cat.icon + '</div>' +
                '<div class="choice-cat-header-info">' +
                    '<h2>' + _escChoice(cat.name) + '</h2>' +
                    '<p>' + totalOptions + ' 个选项 · ' + subs.length + ' 个分类</p>' +
                '</div>' +
                '<div class="choice-cat-more-btn" onclick="event.stopPropagation();toggleChoiceCatMenu(\'' + cat.id + '\')">' +
                    '<i class="fas fa-ellipsis-h"></i>' +
                    '<div class="choice-cat-menu" id="choice-cat-menu-popup">' +
                        '<div class="choice-cat-menu-item" onclick="event.stopPropagation();closeChoiceCatMenu();openChoiceCatEdit(\'' + cat.id + '\')">编辑类别</div>' +
                        '<div class="choice-cat-menu-item" onclick="event.stopPropagation();closeChoiceCatMenu();addChoiceSubCategory(\'' + cat.id + '\')">添加分类</div>' +
                        '<div class="choice-cat-menu-item danger" onclick="event.stopPropagation();closeChoiceCatMenu();deleteChoiceCategory(\'' + cat.id + '\')">删除类别</div>' +
                    '</div>' +
                '</div>' +
            '</div>' +
            '<div class="choice-sub-tabs">' + subTabsHtml +
                '<div class="choice-sub-tab" onclick="addChoiceSubCategory(\'' + cat.id + '\')" style="color:#d0c8c0;"><i class="fas fa-plus" style="font-size:11px;"></i></div>' +
            '</div>' +
        '</div>' +
        '<div class="choice-options-list">' + (optionsHtml || '<div class="choice-empty"><i class="far fa-folder-open"></i><div class="choice-empty-text">还没有选项，快来添加吧 ～</div></div>') + '</div>' +
        '<div class="choice-add-option-btn" onclick="openChoiceOptionEdit(\'' + _choiceActiveCatId + '\',\'' + (activeSub ? activeSub.id : '') + '\',\'\')">' +
            '<i class="fas fa-plus"></i> 添加选项' +
        '</div>' +
        '<div class="choice-start-btn-wrap">' +
            '<button class="choice-start-btn" onclick="startChoiceSession(\'' + cat.id + '\')" ' + (totalOptions < 2 ? 'disabled style="opacity:0.4;"' : '') + '>' +
                '✨ 发起选择' +
            '</button>' +
        '</div>';

    document.getElementById('choice-category-title').innerText = cat.name;
}

// ---- 三点菜单 ----
function toggleChoiceCatMenu(catId) {
    var menu = document.getElementById('choice-cat-menu-popup');
    if (!menu) return;
    var isOpen = menu.classList.contains('show');
    if (isOpen) {
        closeChoiceCatMenu();
    } else {
        menu.classList.add('show');
        _choiceCatMenuOpen = true;
        // 点击其他地方关闭
        setTimeout(function() {
            document.addEventListener('click', _choiceCatMenuOutsideClick, { once: true });
        }, 10);
    }
}

function _choiceCatMenuOutsideClick() {
    closeChoiceCatMenu();
}

function closeChoiceCatMenu() {
    var menu = document.getElementById('choice-cat-menu-popup');
    if (menu) menu.classList.remove('show');
    _choiceCatMenuOpen = false;
}

// ---- 选项编辑弹窗 ----
function openChoiceOptionEdit(catId, subId, optId) {
    var overlay = document.getElementById('choice-edit-overlay');
    var cat = store.choice.categories.find(function(c) { return c.id === catId; });
    if (!cat) return;
    var sub = (cat.subCategories || []).find(function(s) { return s.id === subId; });
    var opt = sub ? (sub.options || []).find(function(o) { return o.id === optId; }) : null;
    var isNew = !opt;

    var starsHtml = '';
    for (var i = 1; i <= 5; i++) {
        starsHtml += '<span class="choice-edit-star ' + ((opt && opt.stars >= i) ? 'active' : '') + '" onclick="choiceSetStars(' + i + ')">★</span>';
    }

    var panel = document.getElementById('choice-edit-panel-content');
    panel.innerHTML =
        '<div class="choice-edit-handle"></div>' +
        '<div class="choice-edit-title">' + (isNew ? '添加选项 ✏️' : '编辑选项') + '</div>' +
        '<div class="choice-edit-field">' +
            '<div class="choice-edit-label">名称</div>' +
            '<input class="choice-edit-input" id="choice-opt-name" placeholder="输入选项名称" value="' + (opt ? _escChoice(opt.name) : '') + '">' +
        '</div>' +
        '<div class="choice-edit-field">' +
            '<div class="choice-edit-label">备注</div>' +
            '<input class="choice-edit-input" id="choice-opt-note" placeholder="简短描述（可选）" value="' + (opt ? _escChoice(opt.note || '') : '') + '">' +
        '</div>' +
        '<div class="choice-edit-field">' +
            '<div class="choice-edit-label">图片</div>' +
            '<div class="choice-edit-img-upload" onclick="choiceUploadOptImg()">' +
                (opt && opt.img ? '<img src="' + opt.img + '" id="choice-opt-img-preview">' : '<div class="upload-placeholder"><i class="fas fa-camera"></i></div>') +
            '</div>' +
            '<input type="file" id="choice-opt-img-input" accept="image/*,.png,.jpg,.jpeg,.gif,.bmp,.webp,.svg,.ico" style="display:none;" onchange="choiceHandleOptImg(this)">' +
        '</div>' +
        '<div class="choice-edit-field">' +
            '<div class="choice-edit-label">偏好星级</div>' +
            '<div class="choice-edit-stars" id="choice-opt-stars">' + starsHtml + '</div>' +
        '</div>' +
        '<input type="hidden" id="choice-opt-stars-val" value="' + (opt ? opt.stars || 0 : 0) + '">' +
        '<input type="hidden" id="choice-opt-img-val" value="' + (opt && opt.img ? opt.img : '') + '">' +
        '<button class="choice-edit-save-btn" onclick="saveChoiceOption(\'' + catId + '\',\'' + subId + '\',\'' + optId + '\')">' + (isNew ? '✓ 添加' : '✓ 保存') + '</button>' +
        (!isNew ? '<div style="text-align:center;margin-top:14px;"><span style="color:#ff8a80;font-size:13px;cursor:pointer;" onclick="deleteChoiceOption(\'' + catId + '\',\'' + subId + '\',\'' + optId + '\')">删除此选项</span></div>' : '');

    overlay.classList.add('show');
}

function closeChoiceEditOverlay() {
    document.getElementById('choice-edit-overlay').classList.remove('show');
}

function choiceSetStars(n) {
    document.getElementById('choice-opt-stars-val').value = n;
    var stars = document.querySelectorAll('#choice-opt-stars .choice-edit-star');
    stars.forEach(function(s, i) {
        if (i < n) s.classList.add('active');
        else s.classList.remove('active');
    });
}

function choiceUploadOptImg() {
    document.getElementById('choice-opt-img-input').click();
}

function choiceHandleOptImg(input) {
    if (!input.files || !input.files[0]) return;
    var reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById('choice-opt-img-val').value = e.target.result;
        var upload = input.closest('.choice-edit-field').querySelector('.choice-edit-img-upload');
        upload.innerHTML = '<img src="' + e.target.result + '" id="choice-opt-img-preview">';
    };
    reader.readAsDataURL(input.files[0]);
}

function saveChoiceOption(catId, subId, optId) {
    var name = document.getElementById('choice-opt-name').value.trim();
    if (!name) { showToast('请输入选项名称'); return; }
    var note = document.getElementById('choice-opt-note').value.trim();
    var stars = parseInt(document.getElementById('choice-opt-stars-val').value) || 0;
    var img = document.getElementById('choice-opt-img-val').value;

    var cat = store.choice.categories.find(function(c) { return c.id === catId; });
    if (!cat) return;
    var sub = (cat.subCategories || []).find(function(s) { return s.id === subId; });
    if (!sub) return;
    if (!sub.options) sub.options = [];

    if (optId) {
        var opt = sub.options.find(function(o) { return o.id === optId; });
        if (opt) {
            opt.name = name; opt.note = note; opt.stars = stars;
            if (img) opt.img = img;
        }
    } else {
        sub.options.push({
            id: 'opt_' + Date.now(),
            name: name, note: note, img: img, stars: stars, freq: 0
        });
    }
    save();
    closeChoiceEditOverlay();
    _choiceRefreshContainer('choice-category-content', function() {
        renderChoiceCategoryDetail();
        showToast(optId ? '已保存 ✓' : '已添加 ✓');
    });
}

function deleteChoiceOption(catId, subId, optId) {
    var cat = store.choice.categories.find(function(c) { return c.id === catId; });
    if (!cat) return;
    var sub = (cat.subCategories || []).find(function(s) { return s.id === subId; });
    if (!sub) return;
    sub.options = (sub.options || []).filter(function(o) { return o.id !== optId; });
    save();
    closeChoiceEditOverlay();
    // 直接从DOM移除对应选项
    var optEl = document.querySelector('.choice-option-item[data-opt-id="' + optId + '"]');
    if (optEl && optEl.parentNode) {
        optEl.parentNode.removeChild(optEl);
    }
    showToast('已删除');
    try { renderChoiceCategoryDetail(); } catch(e) {}
}

// 快速删除选项（带确认）
function deleteChoiceOptionQuick(catId, subId, optId) {
    var cat = store.choice.categories.find(function(c) { return c.id === catId; });
    var sub = cat ? (cat.subCategories || []).find(function(s) { return s.id === subId; }) : null;
    var opt = sub ? (sub.options || []).find(function(o) { return o.id === optId; }) : null;
    var optName = opt ? opt.name : '此选项';
    showConfirm('删除选项', '确定删除"' + optName + '"吗？', function() {
        var cat2 = store.choice.categories.find(function(c) { return c.id === catId; });
        if (!cat2) return;
        var sub2 = (cat2.subCategories || []).find(function(s) { return s.id === subId; });
        if (!sub2) return;
        sub2.options = (sub2.options || []).filter(function(o) { return o.id !== optId; });
        save();
        // 直接从DOM移除对应选项（不依赖innerHTML重渲染）
        var optEl = document.querySelector('.choice-option-item[data-opt-id="' + optId + '"]');
        if (optEl && optEl.parentNode) {
            optEl.parentNode.removeChild(optEl);
        }
        showToast('已删除 ✓');
        // 后台也做一次完整渲染（作为兜底）
        try { renderChoiceCategoryDetail(); } catch(e) {}
    });
}

// 快速删除类别（带确认，从首页用）
function deleteChoiceCategoryQuick(catId) {
    var cat = store.choice.categories.find(function(c) { return c.id === catId; });
    var catName = cat ? cat.name : '此类别';
    showConfirm('删除类别', '确定删除类别"' + catName + '"及其所有选项吗？', function() {
        store.choice.categories = store.choice.categories.filter(function(c) { return c.id !== catId; });
        save();
        // 直接从DOM移除对应卡片（不依赖innerHTML重渲染）
        var cardEl = document.querySelector('.choice-cat-card[data-cat-id="' + catId + '"]');
        if (cardEl && cardEl.parentNode) {
            cardEl.parentNode.removeChild(cardEl);
        }
        showToast('已删除 ✓');
        // 后台也做一次完整渲染（作为兜底）
        try { renderChoiceHome(); } catch(e) {}
    });
}

// ---- 类别管理 ----
function openChoiceCatEdit(catId) {
    var overlay = document.getElementById('choice-cat-edit-overlay');
    var cat = catId ? store.choice.categories.find(function(c) { return c.id === catId; }) : null;
    var isNew = !cat;

    var defaultIcons = ['🍜','👔','💍','🎯','🎬','🎮','📚','🎵','🏠','🎁','✈️','💄','🐱','🌸','⚽'];

    var iconsHtml = defaultIcons.map(function(ic) {
        return '<div class="choice-tag ' + (cat && cat.icon === ic ? 'selected' : '') + '" onclick="choicePickCatIcon(this,\'' + ic + '\')" style="font-size:20px;padding:8px 12px;">' + ic + '</div>';
    }).join('');

    var panel = document.getElementById('choice-cat-edit-panel-content');
    panel.innerHTML =
        '<div class="choice-edit-handle"></div>' +
        '<div class="choice-edit-title">' + (isNew ? '新建类别 ✨' : '编辑类别') + '</div>' +
        '<div class="choice-edit-field">' +
            '<div class="choice-edit-label">类别名称</div>' +
            '<input class="choice-edit-input" id="choice-cat-name" placeholder="例如：今天吃什么" value="' + (cat ? _escChoice(cat.name) : '') + '">' +
        '</div>' +
        '<div class="choice-edit-field">' +
            '<div class="choice-edit-label">选个图标</div>' +
            '<div class="choice-tag-group" id="choice-cat-icon-picker">' + iconsHtml + '</div>' +
            '<input type="hidden" id="choice-cat-icon-val" value="' + (cat ? cat.icon : '📋') + '">' +
        '</div>' +
        '<button class="choice-edit-save-btn" onclick="saveChoiceCategory(\'' + (catId || '') + '\')">' + (isNew ? '✓ 创建' : '✓ 保存') + '</button>' +
        (!isNew ? '<div style="text-align:center;margin-top:14px;"><span style="color:#ff8a80;font-size:13px;cursor:pointer;" onclick="deleteChoiceCategory(\'' + catId + '\')">删除此类别</span></div>' : '');

    overlay.classList.add('show');
}

function closeChoiceCatEditOverlay() {
    document.getElementById('choice-cat-edit-overlay').classList.remove('show');
}

function choicePickCatIcon(el, icon) {
    var picks = document.querySelectorAll('#choice-cat-icon-picker .choice-tag');
    picks.forEach(function(t) { t.classList.remove('selected'); });
    el.classList.add('selected');
    document.getElementById('choice-cat-icon-val').value = icon;
}

function saveChoiceCategory(catId) {
    var name = document.getElementById('choice-cat-name').value.trim();
    if (!name) { showToast('请输入类别名称'); return; }
    var icon = document.getElementById('choice-cat-icon-val').value || '📋';

    _initChoiceData();
    if (catId) {
        var cat = store.choice.categories.find(function(c) { return c.id === catId; });
        if (cat) { cat.name = name; cat.icon = icon; }
    } else {
        store.choice.categories.push({
            id: 'cat_' + Date.now(),
            name: name, icon: icon, iconClass: 'default',
            subCategories: [{ id: 'sub_' + Date.now(), name: '默认', options: [] }]
        });
    }
    save();
    closeChoiceCatEditOverlay();
    _choiceRefreshContainer('choice-home-content', function() {
        renderChoiceHome();
        if (_choiceActiveCatId) {
            _choiceRefreshContainer('choice-category-content', function() {
                try { renderChoiceCategoryDetail(); } catch(e) {}
            });
        }
        showToast(catId ? '已保存 ✓' : '已创建 ✓');
    });
}

function deleteChoiceCategory(catId) {
    store.choice.categories = store.choice.categories.filter(function(c) { return c.id !== catId; });
    save();
    closeChoiceCatEditOverlay();
    closeChoiceCatMenu();
    closeLayer('layer-choice-category');
    // 直接从DOM移除对应卡片
    var cardEl = document.querySelector('.choice-cat-card[data-cat-id="' + catId + '"]');
    if (cardEl && cardEl.parentNode) {
        cardEl.parentNode.removeChild(cardEl);
    }
    showToast('已删除');
    try { renderChoiceHome(); } catch(e) {}
}

function addChoiceSubCategory(catId) {
    _showChoicePrompt('添加分类', '输入新分类名称：', '', function(name) {
        if (!name || !name.trim()) return;
        var cat = store.choice.categories.find(function(c) { return c.id === catId; });
        if (!cat) return;
        if (!cat.subCategories) cat.subCategories = [];
        cat.subCategories.push({
            id: 'sub_' + Date.now(),
            name: name.trim(),
            options: []
        });
        save();
        _choiceActiveSubIdx = cat.subCategories.length - 1;
        renderChoiceCategoryDetail();
        showToast('分类已添加 ✓');
    });
}

// ---- 发起选择 → 情景卡 ----
function startChoiceSession(catId) {
    _choiceActiveCatId = catId;
    _choiceScenarioCard = {
        status: '',
        availableTime: '',
        mood: '',
        budget: 100,
        people: 1,
        special: '',
        freeText: ''
    };
    _choiceInvitedContacts = [];
    _choiceRecommendations = [];
    _choiceWheelRejectCount = 0;
    _choiceCurrentSessionId = 'session_' + Date.now();

    document.getElementById('layer-choice-scenario').classList.add('show');
    renderChoiceScenario();
}

function renderChoiceScenario() {
    var area = document.getElementById('choice-scenario-content');

    var statusOptions = ['刚下课', '刚下班', '周末休息', '约会前', '出差中', '在家躺平', '加班中'];
    var timeOptions = ['只有半小时', '有一两个小时', '有一整个下午', '不赶时间', '越快越好'];
    var moodOptions = ['很累想被治愈', '心情很好想犒劳自己', '焦虑需要comfort food', '无聊想找乐子', '开心想分享', '平平淡淡'];

    var statusHtml = statusOptions.map(function(s) {
        return '<div class="choice-tag ' + (_choiceScenarioCard.status === s ? 'selected' : '') + '" onclick="choiceSetScenario(\'status\',\'' + s + '\',this)">' + s + '</div>';
    }).join('') + '<div class="choice-tag custom-tag" onclick="choiceCustomScenario(\'status\')"><i class="fas fa-plus" style="font-size:10px;"></i> 自定义</div>';

    var timeHtml = timeOptions.map(function(s) {
        return '<div class="choice-tag ' + (_choiceScenarioCard.availableTime === s ? 'selected' : '') + '" onclick="choiceSetScenario(\'availableTime\',\'' + s + '\',this)">' + s + '</div>';
    }).join('');

    var moodHtml = moodOptions.map(function(s) {
        return '<div class="choice-tag ' + (_choiceScenarioCard.mood === s ? 'selected' : '') + '" onclick="choiceSetScenario(\'mood\',\'' + s + '\',this)">' + s + '</div>';
    }).join('');

    area.innerHTML =
        '<div class="choice-scenario-section">' +
            '<div class="choice-scenario-section-title"><i class="fas fa-user-clock"></i> 当前状态</div>' +
            '<div class="choice-tag-group">' + statusHtml + '</div>' +
        '</div>' +

        '<div class="choice-scenario-section">' +
            '<div class="choice-scenario-section-title"><i class="fas fa-hourglass-half"></i> 可用时间</div>' +
            '<div class="choice-tag-group">' + timeHtml + '</div>' +
        '</div>' +

        '<div class="choice-scenario-section">' +
            '<div class="choice-scenario-section-title"><i class="fas fa-heart"></i> 当前情绪</div>' +
            '<div class="choice-tag-group">' + moodHtml + '</div>' +
        '</div>' +

        '<div class="choice-scenario-section">' +
            '<div class="choice-scenario-section-title"><i class="fas fa-coins"></i> 预算范围</div>' +
            '<input type="range" class="choice-budget-slider" min="0" max="500" step="10" value="' + _choiceScenarioCard.budget + '" oninput="choiceSetBudget(this.value)">' +
            '<div class="choice-budget-display" id="choice-budget-val">¥' + _choiceScenarioCard.budget + '</div>' +
            '<div class="choice-budget-labels"><span>不花钱</span><span>¥500+</span></div>' +
        '</div>' +

        '<div class="choice-scenario-section">' +
            '<div class="choice-scenario-section-title"><i class="fas fa-users"></i> 同行人数</div>' +
            '<div class="choice-people-counter">' +
                '<div class="choice-people-btn" onclick="choiceAdjustPeople(-1)">−</div>' +
                '<div class="choice-people-num" id="choice-people-val">' + _choiceScenarioCard.people + '</div>' +
                '<div class="choice-people-btn" onclick="choiceAdjustPeople(1)">+</div>' +
                '<span style="font-size:12px;color:#b5ada5;margin-left:8px;">人</span>' +
            '</div>' +
        '</div>' +

        '<div class="choice-scenario-section">' +
            '<div class="choice-scenario-section-title"><i class="fas fa-exclamation-circle"></i> 特殊需求</div>' +
            '<textarea class="choice-scenario-textarea" id="choice-special-input" placeholder="例如：忌口辣的、对海鲜过敏、着装需要正式…" oninput="_choiceScenarioCard.special=this.value">' + (_choiceScenarioCard.special || '') + '</textarea>' +
        '</div>' +

        '<div class="choice-scenario-section">' +
            '<div class="choice-scenario-section-title"><i class="fas fa-pen"></i> 补充说明</div>' +
            '<textarea class="choice-scenario-textarea" id="choice-freetext-input" placeholder="任何想补充的信息～" oninput="_choiceScenarioCard.freeText=this.value">' + (_choiceScenarioCard.freeText || '') + '</textarea>' +
        '</div>' +

        '<div class="choice-next-btn-wrap">' +
            '<button class="choice-next-btn" onclick="goToChoiceInvite()">' +
                '下一步：邀请朋友帮你选 →' +
            '</button>' +
        '</div>';
}

function choiceSetScenario(field, value, el) {
    _choiceScenarioCard[field] = value;
    var parent = el.parentElement;
    var tags = parent.querySelectorAll('.choice-tag');
    tags.forEach(function(t) { t.classList.remove('selected'); });
    el.classList.add('selected');
}

function choiceCustomScenario(field) {
    _showChoicePrompt('自定义', '请输入自定义内容：', '', function(val) {
        if (!val || !val.trim()) return;
        _choiceScenarioCard[field] = val.trim();
        renderChoiceScenario();
    });
}

function choiceSetBudget(val) {
    _choiceScenarioCard.budget = parseInt(val);
    var el = document.getElementById('choice-budget-val');
    if (el) el.innerText = val >= 500 ? '¥500+' : '¥' + val;
}

function choiceAdjustPeople(delta) {
    _choiceScenarioCard.people = Math.max(1, Math.min(20, _choiceScenarioCard.people + delta));
    var el = document.getElementById('choice-people-val');
    if (el) el.innerText = _choiceScenarioCard.people;
}

// ---- 邀请联系人 ----
function goToChoiceInvite() {
    document.getElementById('layer-choice-invite').classList.add('show');
    renderChoiceInvite();
}

function renderChoiceInvite() {
    var area = document.getElementById('choice-invite-content');
    var contacts = store.contacts || [];

    var listHtml = contacts.map(function(c) {
        var selected = _choiceInvitedContacts.indexOf(c.id) >= 0;
        var persona = c.persona ? c.persona.substring(0, 30) + (c.persona.length > 30 ? '…' : '') : '暂无人设';
        return '<div class="choice-contact-item ' + (selected ? 'selected' : '') + '" onclick="choiceToggleContact(\'' + c.id + '\')">' +
            '<img class="choice-contact-avatar" src="' + (c.avatar || _ph(44)) + '">' +
            '<div class="choice-contact-info">' +
                '<div class="choice-contact-name">' + _escChoice(c.name) + '</div>' +
                '<div class="choice-contact-persona">' + _escChoice(persona) + '</div>' +
            '</div>' +
            '<div class="choice-contact-check"><i class="fas fa-check"></i></div>' +
        '</div>';
    }).join('');

    area.innerHTML =
        '<div class="choice-invite-header">' +
            '<h3>邀请谁来帮你选？🤗</h3>' +
            '<p>他们会看到你的情景卡，给出带有个人风格的推荐～</p>' +
        '</div>' +
        '<div class="choice-contact-list">' +
            (listHtml || '<div class="choice-empty"><i class="fas fa-user-friends"></i><div class="choice-empty-text">还没有联系人</div></div>') +
        '</div>' +
        '<div class="choice-next-btn-wrap">' +
            '<button class="choice-next-btn" onclick="goToChoiceDebate()" ' + (_choiceInvitedContacts.length === 0 ? 'style="opacity:0.5;"' : '') + '>' +
                (_choiceInvitedContacts.length > 0 ? '邀请 ' + _choiceInvitedContacts.length + ' 人参与 →' : '请先选择联系人') +
            '</button>' +
        '</div>' +
        '<div class="choice-skip-invite" onclick="choiceSkipInvite()">跳过，自己做决定 →</div>';
}

function choiceToggleContact(contactId) {
    var idx = _choiceInvitedContacts.indexOf(contactId);
    if (idx >= 0) {
        _choiceInvitedContacts.splice(idx, 1);
    } else {
        _choiceInvitedContacts.push(contactId);
    }
    renderChoiceInvite();
}

function choiceSkipInvite() {
    _choiceInvitedContacts = [];
    goToChoiceDebate();
}

// ---- 辩论/推荐界面 ----
function goToChoiceDebate() {
    document.getElementById('layer-choice-debate').classList.add('show');
    _choiceRecommendations = [];
    renderChoiceDebate();

    if (_choiceInvitedContacts.length > 0) {
        simulateChoiceRecommendations();
    }
}

function renderChoiceDebate() {
    var area = document.getElementById('choice-debate-content');
    var cat = store.choice.categories.find(function(c) { return c.id === _choiceActiveCatId; });
    if (!cat) return;

    var scenarioTags = [];
    if (_choiceScenarioCard.status) scenarioTags.push(_choiceScenarioCard.status);
    if (_choiceScenarioCard.availableTime) scenarioTags.push(_choiceScenarioCard.availableTime);
    if (_choiceScenarioCard.mood) scenarioTags.push(_choiceScenarioCard.mood);
    if (_choiceScenarioCard.budget) scenarioTags.push('¥' + _choiceScenarioCard.budget);
    if (_choiceScenarioCard.people > 1) scenarioTags.push(_choiceScenarioCard.people + '人同行');

    var scenarioHtml = scenarioTags.length > 0 ?
        '<div class="choice-debate-scenario-card">' +
            '<div class="choice-debate-scenario-title">📋 选择情景卡</div>' +
            '<div class="choice-debate-scenario-tags">' +
                scenarioTags.map(function(t) { return '<span class="choice-debate-scenario-tag">' + t + '</span>'; }).join('') +
            '</div>' +
        '</div>' : '';

    var recoHtml = '';
    if (_choiceRecommendations.length === 0 && _choiceInvitedContacts.length > 0) {
        recoHtml = '<div class="choice-waiting">' +
            '<div class="choice-waiting-dots"><span></span><span></span><span></span></div>' +
            '<div class="choice-waiting-text">等待朋友们给出推荐… ☕</div>' +
        '</div>';
    } else if (_choiceRecommendations.length > 0) {
        recoHtml = '<div class="choice-reco-list">';
        _choiceRecommendations.forEach(function(r) {
            var ct = store.contacts.find(function(x) { return x.id === r.contactId; });
            recoHtml += '<div class="choice-reco-bubble">' +
                '<div class="choice-reco-header">' +
                    '<img class="choice-reco-avatar" src="' + (ct ? ct.avatar || _ph(36) : _ph(36)) + '">' +
                    '<span class="choice-reco-name">' + (ct ? _escChoice(ct.name) : '匿名') + '</span>' +
                    (r.isRival ? '<span class="choice-reco-badge rival">情敌模式 🔥</span>' : '') +
                '</div>' +
                '<div class="choice-reco-pick">' +
                    '<div class="choice-reco-pick-icon">' + cat.icon + '</div>' +
                    '<div class="choice-reco-pick-name">' + _escChoice(r.pickName) + '</div>' +
                '</div>' +
                '<div class="choice-reco-reason">' + _escChoice(r.reason) + '</div>' +
            '</div>';
        });
        recoHtml += '</div>';

        var rivalPairs = detectChoiceRivals();
        if (rivalPairs.length > 0) {
            rivalPairs.forEach(function(pair) {
                var c1 = store.contacts.find(function(x) { return x.id === pair[0]; });
                var c2 = store.contacts.find(function(x) { return x.id === pair[1]; });
                var r1 = _choiceRecommendations.find(function(r) { return r.contactId === pair[0]; });
                var r2 = _choiceRecommendations.find(function(r) { return r.contactId === pair[1]; });
                if (c1 && c2 && r1 && r2) {
                    recoHtml += renderRivalClash(c1, c2, r1, r2);
                }
            });
        }
    }

    var directPickHtml = '';
    if (_choiceInvitedContacts.length === 0) {
        var allOptions = getAllChoiceOptions(cat);
        directPickHtml =
            '<div class="choice-section-title" style="padding-top:16px;">全部候选 🎯</div>' +
            '<div class="choice-options-list">' +
                allOptions.map(function(o) {
                    return '<div class="choice-option-item" onclick="choiceDirectPick(\'' + _escChoice(o.name).replace(/'/g, "\\'") + '\')">' +
                        '<div class="choice-option-img no-img">' + cat.icon + '</div>' +
                        '<div class="choice-option-info">' +
                            '<div class="choice-option-name">' + _escChoice(o.name) + '</div>' +
                            '<div class="choice-option-note">' + _escChoice(o.note || '') + '</div>' +
                        '</div>' +
                    '</div>';
                }).join('') +
            '</div>';
    }

    var actionsHtml = '';
    if (_choiceRecommendations.length > 0 || _choiceInvitedContacts.length === 0) {
        actionsHtml =
            '<div class="choice-debate-actions">' +
                '<button class="choice-debate-btn secondary" onclick="openChoiceWheel()">' +
                    '🎡 命运转盘' +
                '</button>' +
                '<button class="choice-debate-btn primary" onclick="choiceManualPick()">' +
                    '✓ 我来选' +
                '</button>' +
            '</div>';
    }

    area.innerHTML = scenarioHtml + recoHtml + directPickHtml + actionsHtml;
}

function getAllChoiceOptions(cat) {
    var all = [];
    (cat.subCategories || []).forEach(function(sub) {
        (sub.options || []).forEach(function(o) { all.push(o); });
    });
    return all;
}

// ---- 联系人推荐（调用API根据人设生成） ----
function simulateChoiceRecommendations() {
    var cat = store.choice.categories.find(function(c) { return c.id === _choiceActiveCatId; });
    if (!cat) return;
    var allOptions = getAllChoiceOptions(cat);
    if (allOptions.length === 0) return;

    var optionNames = allOptions.map(function(o) { return o.name + (o.note ? '（' + o.note + '）' : ''); }).join('、');

    // 构建情景描述
    var scenarioDesc = '';
    if (_choiceScenarioCard.status) scenarioDesc += '当前状态：' + _choiceScenarioCard.status + '；';
    if (_choiceScenarioCard.availableTime) scenarioDesc += '可用时间：' + _choiceScenarioCard.availableTime + '；';
    if (_choiceScenarioCard.mood) scenarioDesc += '心情：' + _choiceScenarioCard.mood + '；';
    if (_choiceScenarioCard.budget) scenarioDesc += '预算：¥' + _choiceScenarioCard.budget + '；';
    if (_choiceScenarioCard.people > 1) scenarioDesc += _choiceScenarioCard.people + '人同行；';
    if (_choiceScenarioCard.special) scenarioDesc += '特殊需求：' + _choiceScenarioCard.special + '；';
    if (_choiceScenarioCard.freeText) scenarioDesc += '补充：' + _choiceScenarioCard.freeText + '；';

    var delay = 1500;
    _choiceInvitedContacts.forEach(function(cid) {
        setTimeout(function() {
            var ct = store.contacts.find(function(x) { return x.id === cid; });
            if (!ct) return;

            var userName = '用户';
            try { if (typeof getUserPersonaName === 'function') userName = getUserPersonaName(ct, store.user.name || '用户'); } catch(e) {}

            var sysPrompt = '【身份声明】你是「' + ct.name + '」。\n' +
                '【你的人设】' + (ct.persona || '一个朋友') + '\n' +
                '【场景】你的朋友' + userName + '在纠结「' + cat.name + '」，邀请你帮TA做选择。\n' +
                '【情景信息】' + (scenarioDesc || '无特殊情景') + '\n' +
                '【候选选项】' + optionNames + '\n' +
                '【任务】请用你的角色身份和说话风格，从候选选项中选择一个推荐给' + userName + '，并给出简短理由（1-2句话，口语化，带情感）。\n' +
                '【输出格式】严格按照以下格式输出，不要多余内容：\n[PICK:选项名称]\n[REASON:推荐理由]';

            // 尝试调用API
            _choiceCallAPI(sysPrompt, function(reply) {
                var pickName = '';
                var reason = '';
                var pickMatch = reply.match(/\[PICK[：:](.*?)\]/);
                var reasonMatch = reply.match(/\[REASON[：:](.*?)\]/);

                if (pickMatch) pickName = pickMatch[1].trim();
                if (reasonMatch) reason = reasonMatch[1].trim();

                // 如果格式解析失败，尝试从选项中匹配
                if (!pickName) {
                    for (var oi = 0; oi < allOptions.length; oi++) {
                        if (reply.indexOf(allOptions[oi].name) >= 0) {
                            pickName = allOptions[oi].name;
                            break;
                        }
                    }
                }
                if (!pickName) pickName = allOptions[Math.floor(Math.random() * allOptions.length)].name;
                if (!reason) reason = reply.replace(/\[.*?\]/g, '').trim().substring(0, 100) || '我觉得这个不错！';

                var matchOpt = allOptions.find(function(o) { return o.name === pickName; });
                var isRival = _choiceInvitedContacts.length >= 2 && Math.random() < 0.3;

                _choiceRecommendations.push({
                    contactId: cid,
                    pickName: pickName,
                    pickId: matchOpt ? matchOpt.id : '',
                    reason: reason,
                    isRival: isRival
                });
                renderChoiceDebate();
            }, function() {
                // API失败时用fallback
                _choiceRecommendationFallback(cid, cat, allOptions);
            });
        }, delay);
        delay += 1200 + Math.random() * 1000;
    });
}

// API调用封装（兼容API未配置的情况）
function _choiceCallAPI(sysPrompt, onSuccess, onFail) {
    _currentApiScene = 'game';
    if (typeof API === 'undefined' || !API || !API.chatCompletion || !store.system || !store.system.url || !store.system.key) {
        if (onFail) onFail();
        return;
    }
    API.chatCompletion([
        { role: 'system', content: sysPrompt },
        { role: 'user', content: '请给出你的推荐。' }
    ], 0.9, true).then(function(data) {
        if (data && data.choices && data.choices[0] && data.choices[0].message) {
            onSuccess(data.choices[0].message.content || '');
        } else {
            if (onFail) onFail();
        }
    }).catch(function(e) {
        console.warn('[Choice] API调用失败，使用离线推荐:', e.message);
        if (onFail) onFail();
    });
}

// 离线fallback推荐
function _choiceRecommendationFallback(cid, cat, allOptions) {
    var fallbackReasons = [
        '以我对你的了解，你一定会喜欢这个的～ 💕',
        '不用犹豫了！这个就是为你量身定做的',
        '如果我是你，我一定选这个！信我 ✨',
        '相信直觉，就是它了！我给你打包票',
        '考虑到你说的情况，这个真的非常合适 👍',
        '我研究了半天，这个是最优解！'
    ];
    var pick = allOptions[Math.floor(Math.random() * allOptions.length)];
    var reason = fallbackReasons[Math.floor(Math.random() * fallbackReasons.length)];
    var isRival = _choiceInvitedContacts.length >= 2 && Math.random() < 0.3;

    _choiceRecommendations.push({
        contactId: cid,
        pickName: pick.name,
        pickId: pick.id,
        reason: reason,
        isRival: isRival
    });
    renderChoiceDebate();
}

// ---- 情敌检测与冲突渲染 ----
function detectChoiceRivals() {
    var pairs = [];
    for (var i = 0; i < _choiceRecommendations.length; i++) {
        for (var j = i + 1; j < _choiceRecommendations.length; j++) {
            var r1 = _choiceRecommendations[i];
            var r2 = _choiceRecommendations[j];
            if (r1.pickId !== r2.pickId && (r1.isRival || r2.isRival)) {
                pairs.push([r1.contactId, r2.contactId]);
            }
        }
    }
    return pairs;
}

function renderRivalClash(c1, c2, r1, r2) {
    var clashDialogues = [
        { left: '你推荐的"' + r2.pickName + '"？认真的吗？😒', right: '怎么了？比你的"' + r1.pickName + '"强多了好吧！' },
        { left: '哼，你根本不了解TA的品味', right: '说得好像你很了解似的～ 🙄' },
        { left: '这次TA一定会选我推荐的！', right: '做梦吧你，等着看结果～ 😏' }
    ];
    var clash = clashDialogues[Math.floor(Math.random() * clashDialogues.length)];

    return '<div class="choice-rival-clash">' +
        '<div class="choice-rival-clash-title"><i class="fas fa-fire"></i> ' + _escChoice(c1.name) + ' VS ' + _escChoice(c2.name) + ' · 争风吃醋中 💢</div>' +
        '<div class="choice-rival-msg">' +
            '<img class="rival-avatar" src="' + (c1.avatar || _ph(28)) + '">' +
            '<div class="rival-text">' + _escChoice(clash.left) + '</div>' +
        '</div>' +
        '<div class="choice-rival-msg right">' +
            '<img class="rival-avatar" src="' + (c2.avatar || _ph(28)) + '">' +
            '<div class="rival-text">' + _escChoice(clash.right) + '</div>' +
        '</div>' +
    '</div>';
}

// ---- 手动选择 ----
function choiceManualPick() {
    var cat = store.choice.categories.find(function(c) { return c.id === _choiceActiveCatId; });
    if (!cat) return;
    var allOptions = getAllChoiceOptions(cat);
    var names = allOptions.map(function(o) { return o.name; });
    var recoNames = _choiceRecommendations.map(function(r) { return r.pickName; });
    var combined = [];
    var seen = {};
    recoNames.concat(names).forEach(function(n) {
        if (!seen[n]) { combined.push(n); seen[n] = true; }
    });

    var pickHtml = combined.map(function(n) {
        var safeName = _escChoice(n).replace(/'/g, "\\'");
        return '<div style="padding:14px 16px;border-bottom:1px solid #f0ece8;cursor:pointer;font-size:15px;color:#2c2c34;" onclick="choiceFinalize(\'' + safeName + '\')">' + _escChoice(n) + '</div>';
    }).join('');

    var area = document.getElementById('choice-debate-content');
    area.innerHTML =
        '<div style="background:#fff;margin:16px;border-radius:16px;overflow:hidden;border:1px solid rgba(0,0,0,0.04);box-shadow:0 1px 4px rgba(0,0,0,0.03);">' +
            '<div style="padding:16px;font-size:16px;font-weight:600;border-bottom:1px solid #f0ece8;color:#2c2c34;">选择你的最终决定 ✨</div>' +
            pickHtml +
        '</div>' +
        '<div style="text-align:center;padding:12px;">' +
            '<span style="font-size:13px;color:#b5ada5;cursor:pointer;" onclick="renderChoiceDebate()">← 返回查看推荐</span>' +
        '</div>';
}

function choiceDirectPick(name) {
    choiceFinalize(name);
}

// ---- 命运大转盘 ----
function openChoiceWheel() {
    var cat = store.choice.categories.find(function(c) { return c.id === _choiceActiveCatId; });
    if (!cat) return;

    var allOptions = getAllChoiceOptions(cat);
    var recoNames = _choiceRecommendations.map(function(r) { return r.pickName; });
    var allNames = allOptions.map(function(o) { return o.name; });
    var candidates = [];
    var seen = {};
    recoNames.concat(allNames).forEach(function(n) {
        if (!seen[n]) { candidates.push(n); seen[n] = true; }
    });

    if (candidates.length < 2) {
        showToast('至少需要2个候选选项');
        return;
    }

    var overlay = document.getElementById('choice-wheel-overlay');
    overlay.classList.add('show');
    _choiceWheelRejectCount = 0;

    document.getElementById('choice-wheel-result').classList.remove('show');
    document.getElementById('choice-wheel-hint-toast').classList.remove('show');

    drawChoiceWheel(candidates);
}

function closeChoiceWheel() {
    document.getElementById('choice-wheel-overlay').classList.remove('show');
    if (_choiceWheelAnimId) {
        cancelAnimationFrame(_choiceWheelAnimId);
        _choiceWheelAnimId = null;
    }
}

function drawChoiceWheel(candidates) {
    var canvas = document.getElementById('choice-wheel-canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var dpr = window.devicePixelRatio || 1;
    canvas.width = 280 * dpr;
    canvas.height = 280 * dpr;
    ctx.scale(dpr, dpr);

    var cx = 140, cy = 140, r = 130;
    var n = candidates.length;
    var angleStep = (2 * Math.PI) / n;

    canvas._candidates = candidates;

    // 温暖配色
    var colors = ['#2c2c34', '#f5f0eb', '#3c3c44', '#e8e4df', '#555050', '#d5d0ca', '#6a6058', '#c5bdb5'];

    ctx.clearRect(0, 0, 280, 280);

    var rotation = _choiceWheelAngle || 0;

    for (var i = 0; i < n; i++) {
        var startAngle = i * angleStep + rotation - Math.PI / 2;
        var endAngle = (i + 1) * angleStep + rotation - Math.PI / 2;

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, r, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = colors[i % colors.length];
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + r * Math.cos(startAngle), cy + r * Math.sin(startAngle));
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 1;
        ctx.stroke();

        var midAngle = startAngle + angleStep / 2;
        var textR = r * 0.65;
        var tx = cx + textR * Math.cos(midAngle);
        var ty = cy + textR * Math.sin(midAngle);

        ctx.save();
        ctx.translate(tx, ty);
        ctx.rotate(midAngle + Math.PI / 2);
        ctx.fillStyle = (i % 2 === 0) ? '#fff' : '#3c3c44';
        ctx.font = '600 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        var text = candidates[i];
        if (text.length > 6) text = text.substring(0, 5) + '…';
        ctx.fillText(text, 0, 0);
        ctx.restore();
    }

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 2;
    ctx.stroke();
}

function spinChoiceWheel() {
    if (_choiceWheelSpinning) return;
    _choiceWheelSpinning = true;

    var canvas = document.getElementById('choice-wheel-canvas');
    if (!canvas || !canvas._candidates) return;
    var candidates = canvas._candidates;
    var n = candidates.length;

    document.getElementById('choice-wheel-result').classList.remove('show');

    var targetIdx = Math.floor(Math.random() * n);
    var angleStep = (2 * Math.PI) / n;
    var targetAngle = -(targetIdx * angleStep + angleStep / 2);
    var totalRotation = 6 * Math.PI + targetAngle;

    var duration = 4000;
    var startTime = Date.now();
    var startAngle = _choiceWheelAngle || 0;

    if (navigator.vibrate) navigator.vibrate(50);

    function animate() {
        var elapsed = Date.now() - startTime;
        var progress = Math.min(elapsed / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 4);
        _choiceWheelAngle = startAngle + totalRotation * eased;

        drawChoiceWheel(candidates);

        if (progress < 1) {
            _choiceWheelAnimId = requestAnimationFrame(animate);
        } else {
            _choiceWheelSpinning = false;
            if (navigator.vibrate) navigator.vibrate([100, 50, 100]);

            var resultEl = document.getElementById('choice-wheel-result');
            document.getElementById('choice-wheel-result-name').innerText = candidates[targetIdx];
            resultEl.classList.add('show');
            resultEl._resultName = candidates[targetIdx];
        }
    }
    _choiceWheelAnimId = requestAnimationFrame(animate);
}

function choiceWheelAccept() {
    var resultEl = document.getElementById('choice-wheel-result');
    var name = resultEl._resultName;
    closeChoiceWheel();
    choiceFinalize(name);
}

function choiceWheelReject() {
    _choiceWheelRejectCount++;
    document.getElementById('choice-wheel-result').classList.remove('show');

    if (_choiceWheelRejectCount >= 3) {
        var toast = document.getElementById('choice-wheel-hint-toast');
        toast.classList.add('show');
        setTimeout(function() {
            toast.classList.remove('show');
        }, 5000);
    } else {
        showToast('那就再转一次吧～ 🎲');
    }
}

function choiceWheelHintDismiss() {
    document.getElementById('choice-wheel-hint-toast').classList.remove('show');
}

// ---- 最终决策与反馈 ----
function choiceFinalize(choiceName) {
    var cat = store.choice.categories.find(function(c) { return c.id === _choiceActiveCatId; });
    if (!cat) return;

    var allSubs = cat.subCategories || [];
    allSubs.forEach(function(sub) {
        (sub.options || []).forEach(function(o) {
            if (o.name === choiceName) {
                o.freq = (o.freq || 0) + 1;
            }
        });
    });

    var record = {
        id: _choiceCurrentSessionId || 'session_' + Date.now(),
        categoryId: _choiceActiveCatId,
        scenarioCard: JSON.parse(JSON.stringify(_choiceScenarioCard)),
        invitedContacts: _choiceInvitedContacts.slice(),
        recommendations: _choiceRecommendations.slice(),
        result: choiceName,
        feedbacks: [],
        createdAt: Date.now()
    };

    if (!store.choice.history) store.choice.history = [];
    store.choice.history.push(record);
    save();

    closeChoiceWheel();

    document.getElementById('layer-choice-result').classList.add('show');
    renderChoiceResult(record);
}

function renderChoiceResult(record) {
    var area = document.getElementById('choice-result-content');
    var cat = store.choice.categories.find(function(c) { return c.id === record.categoryId; });

    var feedbacks = generateChoiceFeedbacks(record);
    record.feedbacks = feedbacks;

    var feedbacksHtml = feedbacks.map(function(f) {
        var ct = store.contacts.find(function(x) { return x.id === f.contactId; });
        if (!ct) return '';
        var isWinner = f.won;
        return '<div class="choice-feedback-bubble">' +
            '<div class="choice-feedback-header">' +
                '<img class="choice-feedback-avatar" src="' + (ct.avatar || _ph(34)) + '">' +
                '<span class="choice-feedback-name">' + _escChoice(ct.name) + '</span>' +
                '<span class="choice-feedback-status ' + (isWinner ? 'winner' : 'loser') + '">' + (isWinner ? '✓ 被采纳' : '未选中') + '</span>' +
            '</div>' +
            '<div class="choice-feedback-msg">' + _escChoice(f.message) + '</div>' +
            '<div class="choice-feedback-emoji">' + f.emoji + '</div>' +
        '</div>';
    }).join('');

    var confettiPieces = '';
    for (var ci = 0; ci < 20; ci++) {
        var left = Math.random() * 100;
        var delay = Math.random() * 2;
        var size = 4 + Math.random() * 6;
        var confColors = ['#ff8a80', '#d4a96a', '#6fb3e0', '#a78bdb', '#2c2c34'];
        var color = confColors[Math.floor(Math.random() * confColors.length)];
        confettiPieces += '<div style="position:absolute;left:' + left + '%;top:-10px;width:' + size + 'px;height:' + size + 'px;background:' + color + ';border-radius:1px;animation:choiceConfettiFall ' + (2+Math.random()*2) + 's ' + delay + 's ease-in forwards;opacity:0.7;"></div>';
    }

    area.innerHTML =
        '<style>@keyframes choiceConfettiFall { 0% { transform: translateY(0) rotate(0deg); opacity: 0.7; } 100% { transform: translateY(200px) rotate(720deg); opacity: 0; } }</style>' +
        '<div class="choice-result-hero">' +
            '<div class="choice-result-confetti">' + confettiPieces + '</div>' +
            '<div class="choice-result-label">YOUR CHOICE ✦</div>' +
            '<div class="choice-result-name">' + _escChoice(record.result) + '</div>' +
            '<div class="choice-result-category">' + (cat ? cat.icon + ' ' + _escChoice(cat.name) : '') + '</div>' +
        '</div>' +
        '<div class="choice-feedback-list">' + feedbacksHtml + '</div>' +
        '<div style="padding:16px;">' +
            '<button class="choice-start-btn" onclick="closeAllChoiceLayers()" style="background:#2c2c34;">' +
                '完成 ✓' +
            '</button>' +
        '</div>';

    scheduleChoiceFollowUps(record);
}

function generateChoiceFeedbacks(record) {
    var feedbacks = [];
    var winnerPhrases = [
        '我就知道你会选这个，眼光真好 ✨',
        '果然是我最了解你！选得好！',
        '哈哈太开心了，这就是最佳选择！🎉',
        '英雄所见略同！祝你开心～ 💕',
        '完美的选择，不愧是我推荐的 💫'
    ];
    var loserPhrases = {
        disappointed: ['有一点点失落...不过下次再帮你选吧 🥺', '唔...没关系啦，开心就好', '虽然有点遗憾，但尊重你的选择'],
        jealous: ['哼，你居然没选我推荐的！不跟你好了（才怪）😤', '不行！你一定会后悔的！等着瞧！', '切，TA推荐的有什么好的啦'],
        chill: ['哈哈无所谓啦～下次记得选我的 😎', '好吧好吧，你开心就好', '没事没事，反正我推荐的也不差'],
        stubborn: ['哼你会后悔的 😏', '我不服！下次让我来做主！', '你的损失，我推荐的明明更好']
    };
    var loserEmojis = ['😢', '😤', '🙄', '💔', '😏', '🥺'];
    var winnerEmojis = ['🎉', '🥳', '✨', '💪', '😎'];

    // 先生成离线默认反馈，之后异步替换为API结果
    record.invitedContacts.forEach(function(cid) {
        var reco = record.recommendations.find(function(r) { return r.contactId === cid; });
        var won = reco && reco.pickName === record.result;

        if (won) {
            feedbacks.push({
                contactId: cid,
                won: true,
                message: winnerPhrases[Math.floor(Math.random() * winnerPhrases.length)],
                emoji: winnerEmojis[Math.floor(Math.random() * winnerEmojis.length)]
            });
        } else {
            var types = Object.keys(loserPhrases);
            var type = types[Math.floor(Math.random() * types.length)];
            var phrases = loserPhrases[type];
            feedbacks.push({
                contactId: cid,
                won: false,
                message: phrases[Math.floor(Math.random() * phrases.length)],
                emoji: loserEmojis[Math.floor(Math.random() * loserEmojis.length)]
            });
        }

        // 异步调用API生成更贴合人设的反馈
        var ct = store.contacts.find(function(x) { return x.id === cid; });
        if (ct && ct.persona) {
            var feedbackIdx = feedbacks.length - 1;
            var userName = '用户';
            try { if (typeof getUserPersonaName === 'function') userName = getUserPersonaName(ct, store.user.name || '用户'); } catch(e) {}

            var scenario = won ?
                userName + '在选择「' + (record.result || '') + '」时采纳了你推荐的选项。你很开心。' :
                userName + '在选择时没有采纳你推荐的「' + (reco ? reco.pickName : '') + '」，而是选了「' + (record.result || '') + '」。你有点不服气。';

            var sysPrompt = '【身份声明】你是「' + ct.name + '」。\n' +
                '【你的人设】' + (ct.persona || '一个朋友') + '\n' +
                '【场景】' + scenario + '\n' +
                '【任务】用你的角色身份和说话风格，对这个结果发表一句简短感想（10-25字，口语化，有情感）。只输出感想文本，不要任何格式标记。';

            (function(idx, isWon) {
                _choiceCallAPI(sysPrompt, function(reply) {
                    var cleanReply = reply.replace(/\[.*?\]/g, '').trim();
                    if (cleanReply && cleanReply.length > 0 && cleanReply.length < 100) {
                        feedbacks[idx].message = cleanReply;
                        // 重新渲染结果页
                        try { renderChoiceResult(record); } catch(e) {}
                    }
                }, function() { /* 保持默认文本 */ });
            })(feedbackIdx, won);
        }
    });
    return feedbacks;
}

// ---- 后续私聊跟进消息（调用API根据人设生成） ----
function scheduleChoiceFollowUps(record) {
    var loserContacts = record.feedbacks.filter(function(f) { return !f.won; }).map(function(f) { return f.contactId; });
    if (loserContacts.length === 0) return;

    var fallbackMessages = [
        '你没选我推荐的那个，你到底觉得怎么样啊？🤔',
        '下次一定要听我的好不好～ 🥺',
        '话说你最后选的那个体验如何？有没有后悔？😏',
        '我心心念念推荐的你居然不选，伤心了...',
        '我研究了好久才给你推荐的诶！下次优先考虑我的建议嘛～',
        '哼，虽然你没选我的，但我还是会继续帮你选的啦 💕'
    ];

    loserContacts.forEach(function(cid) {
        var delay = (15 + Math.random() * 45) * 1000;
        setTimeout(function() {
            var ct = store.contacts.find(function(x) { return x.id === cid; });
            if (!ct) return;

            var reco = record.recommendations.find(function(r) { return r.contactId === cid; });
            var userName = '用户';
            try { if (typeof getUserPersonaName === 'function') userName = getUserPersonaName(ct, store.user.name || '用户'); } catch(e) {}

            var sysPrompt = '【身份声明】你是「' + ct.name + '」。\n' +
                '【你的人设】' + (ct.persona || '一个朋友') + '\n' +
                '【场景】你之前给' + userName + '推荐了「' + (reco ? reco.pickName : '某选项') + '」，但' + userName + '最终选了「' + record.result + '」没有采纳你的建议。现在你想在微信私聊中发一条消息表达你的不满/关心。\n' +
                '【任务】用你的角色身份和说话风格，给' + userName + '发一条简短的私聊消息（15-40字，口语化，有情感，可以是不满、关心、调侃等）。只输出消息文本，不要任何格式标记。用中文。';

            _choiceCallAPI(sysPrompt, function(reply) {
                var cleanReply = reply.replace(/\[.*?\]/g, '').trim();
                var msg = (cleanReply && cleanReply.length > 0 && cleanReply.length < 150) ? cleanReply : fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)];
                _pushChoiceFollowUpMsg(cid, msg);
            }, function() {
                var msg = fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)];
                _pushChoiceFollowUpMsg(cid, msg);
            });
        }, delay);
    });
}

// 推送选择后续消息
function _pushChoiceFollowUpMsg(cid, msg) {
    if (!store.chats[cid]) store.chats[cid] = [];
    store.chats[cid].push({
        role: 'char',
        content: msg,
        time: Date.now(),
        type: 'choice_followup'
    });
    save();

    if (typeof renderConversations === 'function') {
        try { renderConversations(); } catch (e) {}
    }
}

// ---- 关闭所有层 ----
function closeAllChoiceLayers() {
    ['layer-choice-result', 'layer-choice-debate', 'layer-choice-invite', 'layer-choice-scenario', 'layer-choice-category'].forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.classList.remove('show');
    });
    renderChoiceHome();
}

// ---- 自定义prompt弹窗（替代原生prompt，微信兼容） ----
function _showChoicePrompt(title, labelText, defaultVal, onConfirm) {
    var modal = document.getElementById('modal-confirm');
    document.getElementById('confirm-title').innerText = title;
    var textEl = document.getElementById('confirm-text');
    textEl.innerHTML = '<div style="text-align:left;margin-bottom:10px;font-size:14px;color:#666;">' + labelText + '</div>' +
        '<input type="text" id="choice-prompt-input" value="' + (defaultVal || '') + '" ' +
        'style="width:100%;padding:10px 12px;border:1.5px solid #e0dbd5;border-radius:10px;font-size:15px;outline:none;box-sizing:border-box;background:#faf8f6;" ' +
        'placeholder="请输入...">';

    modal.style.zIndex = '10001';
    modal.style.display = 'flex';

    var okBtn = document.getElementById('confirm-btn-ok');
    var cancelBtn = document.getElementById('confirm-btn-cancel');

    var newOkBtn = okBtn.cloneNode(true);
    okBtn.parentNode.replaceChild(newOkBtn, okBtn);
    var newCancelBtn = cancelBtn.cloneNode(true);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

    newOkBtn.innerText = '确定';
    newCancelBtn.innerText = '取消';
    newCancelBtn.style.background = '';
    newCancelBtn.style.color = '';

    newOkBtn.addEventListener('click', function() {
        var input = document.getElementById('choice-prompt-input');
        var val = input ? input.value : '';
        modal.style.display = 'none';
        try { if (onConfirm) onConfirm(val); } catch(e) { console.error('_showChoicePrompt onConfirm error:', e); }
    });

    newCancelBtn.addEventListener('click', function() {
        modal.style.display = 'none';
    });

    // 自动聚焦输入框
    setTimeout(function() {
        var input = document.getElementById('choice-prompt-input');
        if (input) input.focus();
    }, 100);
}

// ---- 工具函数 ----
function _escChoice(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.innerText = str;
    return div.innerHTML;
}
