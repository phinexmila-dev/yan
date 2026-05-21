// ====== 情侣账本模块 (app-couple-ledger.js) ======
// 记账 + 月度统计 + 谁花得多 + 预算管理
(function(){
    'use strict';

    // ====== SVG图标 ======
    const CL_SVG = {
        back: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>',
        plus: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
        chevronLeft: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>',
        chevronRight: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>',
        list: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>',
        pie: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.21 15.89A10 10 0 118 2.83"/><path d="M22 12A10 10 0 0012 2v10z"/></svg>',
        wallet: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12V7H5a2 2 0 010-4h14v4"/><path d="M3 5v14a2 2 0 002 2h16v-5"/><path d="M18 12a2 2 0 100 4 2 2 0 000-4z"/></svg>',
        receipt: '<svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="#ddd" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 2v20l3-2 3 2 3-2 3 2 3-2 3 2V2l-3 2-3-2-3 2-3-2-3 2-3-2z"/><line x1="8" y1="8" x2="16" y2="8"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="16" x2="12" y2="16"/></svg>',
        trash: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>',
        balance: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="3" x2="12" y2="21"/><polyline points="1 14 12 3 23 14"/></svg>',
        warn: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
        // 分类SVG图标
        food: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 010 8h-1"/><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>',
        transport: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 16H9m10 0h3v-3.15a1 1 0 00-.84-.99L16 11l-2.7-3.6a1 1 0 00-.8-.4H5.24a2 2 0 00-1.8 1.1l-.8 1.63A6 6 0 002 12.42V16h2"/><circle cx="6.5" cy="16.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/></svg>',
        shopping: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>',
        entertainment: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/><line x1="17" y1="17" x2="22" y2="17"/></svg>',
        gift: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/></svg>',
        daily: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
        other: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>'
    };

    // ====== 分类配置 ======
    const CL_CATS = {
        food:          { icon:CL_SVG.food,          name:'吃饭',   color:'#ff6b8a' },
        transport:     { icon:CL_SVG.transport,      name:'交通',   color:'#5b8def' },
        shopping:      { icon:CL_SVG.shopping,       name:'购物',   color:'#f7971e' },
        entertainment: { icon:CL_SVG.entertainment,  name:'娱乐',   color:'#a855f7' },
        gift:          { icon:CL_SVG.gift,           name:'礼物',   color:'#ec4899' },
        daily:         { icon:CL_SVG.daily,          name:'日常',   color:'#14b8a6' },
        other:         { icon:CL_SVG.other,          name:'其他',   color:'#6b7280' }
    };

    const CL_PAYERS = { user:'我付的', partner:'TA付的', shared:'AA' };

    // ====== 状态 ======
    let clTab = 'list';       // list | stats | budget
    let clAddOpen = false;
    let clEditId = null;
    let clMonthOffset = 0;    // 0=本月, -1=上月...
    let clFilterCat = 'all';

    // ====== 工具 ======
    function _sp() { return typeof getCurrentCoupleSpace === 'function' ? getCurrentCoupleSpace() : null; }
    function _pt(s) { return s ? (store.contacts || []).find(function(x){ return x.id === s.partnerId; }) : null; }
    function _pn(s) { var p = _pt(s); return p ? p.name : 'TA'; }
    function _esc(s) { return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

    function _initLedger(space) {
        if (!space.coupleLedger) space.coupleLedger = { records:[], budget:{ monthly:0, enabled:false } };
        if (!space.coupleLedger.records) space.coupleLedger.records = [];
        if (!space.coupleLedger.budget) space.coupleLedger.budget = { monthly:0, enabled:false };
    }

    function _getViewMonth() {
        var now = new Date();
        var m = now.getMonth() + clMonthOffset;
        var y = now.getFullYear();
        while (m < 0) { m += 12; y--; }
        while (m > 11) { m -= 12; y++; }
        return { year:y, month:m };
    }

    function _getMonthRecords(space) {
        var vm = _getViewMonth();
        return (space.coupleLedger.records || []).filter(function(r) {
            if (!r.date) return false;
            var p = r.date.split('-').map(Number);
            return p[0] === vm.year && p[1] === vm.month + 1;
        });
    }

    // ====== 主渲染入口 ======
    window.renderCoupleLedgerModule = function(area, space) {
        if (!space) { coupleViewMode = 'detail'; renderCouple(); return; }
        _initLedger(space);
        var partnerName = _pn(space);
        var vm = _getViewMonth();
        var monthLabel = vm.year + '年' + (vm.month + 1) + '月';
        var records = _getMonthRecords(space);

        var bodyHTML = '';
        switch (clTab) {
            case 'list': bodyHTML = _buildList(space, records, partnerName); break;
            case 'stats': bodyHTML = _buildStats(space, records, partnerName); break;
            case 'budget': bodyHTML = _buildBudget(space, records); break;
        }

        area.innerHTML = '<div class="cl-container">'
            + '<div class="cl-nav">'
            + '<div class="cl-nav-back" onclick="coupleViewMode=\'detail\';renderCouple()">' + CL_SVG.back + '</div>'
            + '<div class="cl-nav-title">情侣账本</div>'
            + '<div class="cl-nav-actions"><div class="cl-nav-btn" onclick="window._clOpenAdd()">' + CL_SVG.plus + '</div></div>'
            + '</div>'
            // 月份切换
            + '<div class="cl-month-bar">'
            + '<div class="cl-month-arrow" onclick="window._clPrevMonth()">' + CL_SVG.chevronLeft + '</div>'
            + '<div class="cl-month-title">' + monthLabel + '</div>'
            + '<div class="cl-month-arrow" onclick="window._clNextMonth()">' + CL_SVG.chevronRight + '</div>'
            + '</div>'
            // Tab栏
            + '<div class="cl-tabs">'
            + '<div class="cl-tab ' + (clTab==='list'?'active':'') + '" onclick="window._clSetTab(\'list\')">' + CL_SVG.list + ' 明细</div>'
            + '<div class="cl-tab ' + (clTab==='stats'?'active':'') + '" onclick="window._clSetTab(\'stats\')">' + CL_SVG.pie + ' 统计</div>'
            + '<div class="cl-tab ' + (clTab==='budget'?'active':'') + '" onclick="window._clSetTab(\'budget\')">' + CL_SVG.wallet + ' 预算</div>'
            + '</div>'
            + '<div class="cl-body">' + bodyHTML + '</div>'
            + '</div>';

        // [FIX-弹窗滚动] 将记一笔弹窗挂载到 document.body，避免嵌套在 overflow:hidden 容器内导致触摸滚动失效
        var _existingOverlay = document.querySelector('.cl-add-overlay');
        if (_existingOverlay) _existingOverlay.remove();
        if (clAddOpen) {
            var _overlayDiv = document.createElement('div');
            _overlayDiv.innerHTML = _buildAddForm(space, partnerName);
            if (_overlayDiv.firstChild) document.body.appendChild(_overlayDiv.firstChild);
        }
    };

    // ====== 明细列表 ======
    function _buildList(space, records, partnerName) {
        if (records.length === 0) {
            return '<div class="cl-empty">' + CL_SVG.receipt + '<div>本月暂无记录</div><div class="cl-empty-hint">点击右上角 + 记一笔</div></div>';
        }
        // 按日期分组
        var groups = {};
        records.forEach(function(r) { if (!groups[r.date]) groups[r.date] = []; groups[r.date].push(r); });
        var sortedDates = Object.keys(groups).sort().reverse();

        var totalExpense = 0, totalIncome = 0;
        records.forEach(function(r) {
            if (r.type === 'expense') totalExpense += r.amount;
            else totalIncome += r.amount;
        });

        var html = '<div class="cl-summary">'
            + '<div class="cl-summary-item"><div class="cl-summary-label">支出</div><div class="cl-summary-val cl-expense">¥' + totalExpense.toFixed(2) + '</div></div>'
            + '<div class="cl-summary-item"><div class="cl-summary-label">收入</div><div class="cl-summary-val cl-income">¥' + totalIncome.toFixed(2) + '</div></div>'
            + '<div class="cl-summary-item"><div class="cl-summary-label">结余</div><div class="cl-summary-val">¥' + (totalIncome - totalExpense).toFixed(2) + '</div></div>'
            + '</div>';

        sortedDates.forEach(function(date) {
            var dayRecords = groups[date];
            var dp = date.split('-');
            var dayTotal = 0;
            dayRecords.forEach(function(r){ if(r.type==='expense') dayTotal += r.amount; });
            html += '<div class="cl-day-header"><span>' + parseInt(dp[1]) + '月' + parseInt(dp[2]) + '日</span><span class="cl-day-total">-¥' + dayTotal.toFixed(2) + '</span></div>';
            dayRecords.forEach(function(r) {
                var cat = CL_CATS[r.category] || CL_CATS.other;
                var payerLabel = r.payer === 'user' ? '我' : (r.payer === 'partner' ? _esc(partnerName) : 'AA');
                html += '<div class="cl-record" onclick="window._clEditRecord(\'' + r.id + '\')">'
                    + '<div class="cl-rec-icon" style="background:' + cat.color + '22;color:' + cat.color + '">' + cat.icon + '</div>'
                    + '<div class="cl-rec-info">'
                    + '<div class="cl-rec-title">' + _esc(r.note || cat.name) + '</div>'
                    + '<div class="cl-rec-meta">' + cat.name + ' · ' + payerLabel + '</div>'
                    + '</div>'
                    + '<div class="cl-rec-amount ' + (r.type==='expense'?'cl-expense':'cl-income') + '">' + (r.type==='expense'?'-':'+') + '¥' + r.amount.toFixed(2) + '</div>'
                    + '</div>';
            });
        });
        return html;
    }

    // ====== 统计视图 ======
    function _buildStats(space, records, partnerName) {
        var expenses = records.filter(function(r){ return r.type === 'expense'; });
        if (expenses.length === 0) {
            return '<div class="cl-empty"><svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="#ddd" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21.21 15.89A10 10 0 118 2.83"/><path d="M22 12A10 10 0 0012 2v10z"/></svg><div>本月暂无支出数据</div></div>';
        }

        // 分类汇总
        var catTotals = {};
        var total = 0;
        expenses.forEach(function(r) {
            if (!catTotals[r.category]) catTotals[r.category] = 0;
            catTotals[r.category] += r.amount;
            total += r.amount;
        });

        var sorted = Object.entries(catTotals).sort(function(a,b){ return b[1]-a[1]; });
        var barsHTML = sorted.map(function(entry) {
            var cat = CL_CATS[entry[0]] || CL_CATS.other;
            var pct = total > 0 ? Math.round(entry[1] / total * 100) : 0;
            return '<div class="cl-stat-row">'
                + '<div class="cl-stat-cat">' + cat.icon + ' ' + cat.name + '</div>'
                + '<div class="cl-stat-bar-wrap"><div class="cl-stat-bar" style="width:' + pct + '%;background:' + cat.color + '"></div></div>'
                + '<div class="cl-stat-val">¥' + entry[1].toFixed(0) + ' <span class="cl-stat-pct">' + pct + '%</span></div>'
                + '</div>';
        }).join('');

        // 谁花得多
        var userTotal = 0, partnerTotal = 0;
        expenses.forEach(function(r) {
            if (r.payer === 'user') userTotal += r.amount;
            else if (r.payer === 'partner') partnerTotal += r.amount;
            else { userTotal += r.amount / 2; partnerTotal += r.amount / 2; }
        });
        var diff = Math.abs(userTotal - partnerTotal);
        var whoMore = userTotal > partnerTotal ? '我' : (partnerTotal > userTotal ? _esc(partnerName) : '');
        var compareHTML = '<div class="cl-compare">'
            + '<div class="cl-compare-item"><div class="cl-compare-name">我</div><div class="cl-compare-bar-wrap"><div class="cl-compare-bar" style="width:' + (total>0?Math.round(userTotal/total*100):50) + '%;background:#5b8def;"></div></div><div class="cl-compare-val">¥' + userTotal.toFixed(0) + '</div></div>'
            + '<div class="cl-compare-item"><div class="cl-compare-name">' + _esc(partnerName) + '</div><div class="cl-compare-bar-wrap"><div class="cl-compare-bar" style="width:' + (total>0?Math.round(partnerTotal/total*100):50) + '%;background:#ec4899;"></div></div><div class="cl-compare-val">¥' + partnerTotal.toFixed(0) + '</div></div>'
            + (whoMore ? '<div class="cl-compare-diff">' + whoMore + '多花了 ¥' + diff.toFixed(0) + '</div>' : '<div class="cl-compare-diff">花费持平</div>')
            + '</div>';

        return '<div class="cl-stats-section"><div class="cl-section-title">' + CL_SVG.pie + ' 支出分类</div>' + barsHTML + '</div>'
            + '<div class="cl-stats-section"><div class="cl-section-title">' + CL_SVG.balance + ' 谁花得多</div>' + compareHTML + '</div>';
    }

    // ====== 预算视图 ======
    function _buildBudget(space, records) {
        var budget = space.coupleLedger.budget;
        var expenses = records.filter(function(r){ return r.type === 'expense'; });
        var totalExpense = 0;
        expenses.forEach(function(r){ totalExpense += r.amount; });

        var pct = budget.monthly > 0 ? Math.min(100, Math.round(totalExpense / budget.monthly * 100)) : 0;
        var remaining = budget.monthly > 0 ? Math.max(0, budget.monthly - totalExpense) : 0;
        var overBudget = budget.monthly > 0 && totalExpense > budget.monthly;

        return '<div class="cl-budget-section">'
            + '<div class="cl-section-title">' + CL_SVG.wallet + ' 月度预算</div>'
            + '<div class="cl-budget-toggle">'
            + '<label>启用预算</label>'
            + '<label class="cl-switch"><input type="checkbox" id="cl-budget-enabled" ' + (budget.enabled?'checked':'') + ' onchange="window._clToggleBudget()"><span></span></label>'
            + '</div>'
            + '<div class="cl-budget-input-row">'
            + '<label>月预算额度</label>'
            + '<div class="cl-budget-input-wrap">¥ <input id="cl-budget-amount" type="number" min="0" step="100" value="' + (budget.monthly||0) + '" onchange="window._clSaveBudget()"></div>'
            + '</div>'
            + (budget.enabled && budget.monthly > 0 ? (
                '<div class="cl-budget-ring-area">'
                + '<div class="cl-budget-ring">'
                + '<svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="52" fill="none" stroke="#f0f0f0" stroke-width="10"/>'
                + '<circle cx="60" cy="60" r="52" fill="none" stroke="' + (overBudget?'#ff4d4f':'#5b8def') + '" stroke-width="10" stroke-dasharray="' + (326.7*pct/100) + ' 326.7" stroke-linecap="round" transform="rotate(-90 60 60)"/></svg>'
                + '<div class="cl-budget-ring-text"><div class="cl-budget-pct">' + pct + '%</div><div class="cl-budget-used">已用</div></div>'
                + '</div>'
                + '<div class="cl-budget-info">'
                + '<div>已花 <span class="' + (overBudget?'cl-expense':'') + '">¥' + totalExpense.toFixed(0) + '</span> / ¥' + budget.monthly + '</div>'
                + '<div>剩余 <span style="color:#07c160;">¥' + remaining.toFixed(0) + '</span></div>'
                + (overBudget ? '<div class="cl-budget-warn">' + CL_SVG.warn + ' 已超支 ¥' + (totalExpense - budget.monthly).toFixed(0) + '</div>' : '')
                + '</div></div>'
            ) : '<div class="cl-budget-hint">设置月预算后可查看消费进度</div>')
            + '</div>';
    }

    // ====== 添加/编辑表单 ======
    function _buildAddForm(space, partnerName) {
        var editing = null;
        if (clEditId) {
            editing = (space.coupleLedger.records || []).find(function(r){ return r.id === clEditId; });
        }
        var defaults = editing || { type:'expense', category:'food', amount:0, note:'', payer:'user', date:new Date().toISOString().split('T')[0] };

        var catBtns = Object.entries(CL_CATS).map(function(entry) {
            var k = entry[0], v = entry[1];
            return '<div class="cl-cat-btn ' + (defaults.category===k?'active':'') + '" style="--cat-color:' + v.color + '" onclick="document.getElementById(\'cl-add-cat\').value=\'' + k + '\';document.querySelectorAll(\'.cl-cat-btn\').forEach(function(e){e.classList.remove(\'active\')});this.classList.add(\'active\')">'
                + v.icon + '<span>' + v.name + '</span></div>';
        }).join('');

        return '<div class="cl-add-overlay" onclick="window._clCloseAdd()">'
            + '<div class="cl-add-sheet" onclick="event.stopPropagation()">'
            + '<div class="cl-add-title">' + (editing ? '编辑记录' : '记一笔') + '</div>'
            // 收支切换
            + '<div class="cl-type-toggle">'
            + '<div class="cl-type-btn ' + (defaults.type==='expense'?'active cl-expense-bg':'') + '" onclick="document.getElementById(\'cl-add-type\').value=\'expense\';this.classList.add(\'active\',\'cl-expense-bg\');this.nextElementSibling.classList.remove(\'active\',\'cl-income-bg\')">支出</div>'
            + '<div class="cl-type-btn ' + (defaults.type==='income'?'active cl-income-bg':'') + '" onclick="document.getElementById(\'cl-add-type\').value=\'income\';this.classList.add(\'active\',\'cl-income-bg\');this.previousElementSibling.classList.remove(\'active\',\'cl-expense-bg\')">收入</div>'
            + '</div>'
            + '<input type="hidden" id="cl-add-type" value="' + defaults.type + '">'
            + '<input type="hidden" id="cl-add-cat" value="' + defaults.category + '">'
            // 金额
            + '<div class="cl-amount-input"><span>¥</span><input id="cl-add-amount" type="number" min="0" step="0.01" value="' + (defaults.amount||'') + '" placeholder="0.00" autofocus></div>'
            // 分类
            + '<div class="cl-cat-grid">' + catBtns + '</div>'
            // 谁付的
            + '<div class="cl-payer-row">'
            + '<label>谁付的</label>'
            + '<div class="cl-payer-btns">'
            + '<div class="cl-payer-btn ' + (defaults.payer==='user'?'active':'') + '" onclick="document.getElementById(\'cl-add-payer\').value=\'user\';document.querySelectorAll(\'.cl-payer-btn\').forEach(function(e){e.classList.remove(\'active\')});this.classList.add(\'active\')">我</div>'
            + '<div class="cl-payer-btn ' + (defaults.payer==='partner'?'active':'') + '" onclick="document.getElementById(\'cl-add-payer\').value=\'partner\';document.querySelectorAll(\'.cl-payer-btn\').forEach(function(e){e.classList.remove(\'active\')});this.classList.add(\'active\')">' + _esc(partnerName) + '</div>'
            + '<div class="cl-payer-btn ' + (defaults.payer==='shared'?'active':'') + '" onclick="document.getElementById(\'cl-add-payer\').value=\'shared\';document.querySelectorAll(\'.cl-payer-btn\').forEach(function(e){e.classList.remove(\'active\')});this.classList.add(\'active\')">AA</div>'
            + '</div>'
            + '<input type="hidden" id="cl-add-payer" value="' + defaults.payer + '">'
            + '</div>'
            // 备注 & 日期
            + '<input id="cl-add-note" type="text" placeholder="备注（选填）" maxlength="30" value="' + _esc(defaults.note||'') + '">'
            + '<input id="cl-add-date" type="date" value="' + (defaults.date||'') + '">'
            // 按钮
            + '<div class="cl-add-actions">'
            + (editing ? '<button class="cl-btn cl-btn-del" onclick="window._clDeleteRecord()">' + CL_SVG.trash + '</button>' : '')
            + '<button class="cl-btn cl-btn-cancel" onclick="window._clCloseAdd()">取消</button>'
            + '<button class="cl-btn cl-btn-save" onclick="window._clSaveRecord()">保存</button>'
            + '</div>'
            + '</div></div>';
    }

    // ====== 交互函数 ======
    window._clSetTab = function(t) { clTab = t; renderCouple(); };
    window._clPrevMonth = function() { clMonthOffset--; renderCouple(); };
    window._clNextMonth = function() { clMonthOffset++; renderCouple(); };
    window._clOpenAdd = function() { clAddOpen = true; clEditId = null; renderCouple(); };
    window._clCloseAdd = function() {
        clAddOpen = false; clEditId = null;
        // [FIX-弹窗滚动] 关闭时移除挂载在body上的弹窗
        var _overlay = document.querySelector('.cl-add-overlay');
        if (_overlay) _overlay.remove();
        renderCouple();
    };

    window._clEditRecord = function(id) { clEditId = id; clAddOpen = true; renderCouple(); };

    window._clSaveRecord = function() {
        var space = _sp();
        if (!space) return;
        _initLedger(space);
        var g = function(id) { var el = document.getElementById(id); return el ? el.value : ''; };
        var amount = parseFloat(g('cl-add-amount')) || 0;
        if (amount <= 0) { if (typeof toast === 'function') toast('请填写金额'); return; }
        var type = g('cl-add-type') || 'expense';
        var category = g('cl-add-cat') || 'other';
        var payer = g('cl-add-payer') || 'user';
        var note = (g('cl-add-note')||'').trim();
        var date = g('cl-add-date') || new Date().toISOString().split('T')[0];

        if (clEditId) {
            var rec = space.coupleLedger.records.find(function(r){ return r.id === clEditId; });
            if (rec) {
                rec.type = type; rec.category = category; rec.amount = amount;
                rec.payer = payer; rec.note = note; rec.date = date;
            }
        } else {
            space.coupleLedger.records.push({
                id: 'clr_' + Date.now() + '_' + Math.random().toString(36).slice(2,5),
                type: type, category: category, amount: amount,
                payer: payer, note: note, date: date, createdAt: Date.now()
            });
        }
        if (typeof save === 'function') save();
        clAddOpen = false; clEditId = null;
        if (typeof toast === 'function') toast(clEditId ? '已更新' : '已记录');
        renderCouple();
    };

    window._clDeleteRecord = function() {
        var space = _sp();
        if (!space || !clEditId) return;
        space.coupleLedger.records = space.coupleLedger.records.filter(function(r){ return r.id !== clEditId; });
        if (typeof save === 'function') save();
        clAddOpen = false; clEditId = null;
        if (typeof toast === 'function') toast('已删除');
        renderCouple();
    };

    window._clToggleBudget = function() {
        var space = _sp();
        if (!space) return;
        _initLedger(space);
        var el = document.getElementById('cl-budget-enabled');
        space.coupleLedger.budget.enabled = el ? el.checked : false;
        if (typeof save === 'function') save();
        renderCouple();
    };

    window._clSaveBudget = function() {
        var space = _sp();
        if (!space) return;
        _initLedger(space);
        var el = document.getElementById('cl-budget-amount');
        space.coupleLedger.budget.monthly = el ? (parseFloat(el.value) || 0) : 0;
        if (typeof save === 'function') save();
    };

})();
