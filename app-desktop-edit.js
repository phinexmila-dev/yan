// ============================================================
// Desktop Edit Mode: Long-press to edit, each app/widget is
// independent with its own delete badge.
// Grid-based layout: apps can be dragged to any grid cell.
// Like a phone home screen.
// Both Page 1 and Page 2 use grid-based editing.
// ============================================================
(function() {
    'use strict';

    // --- State ---
    let _editMode = false;
    let _longPressTimer = null;
    const LONG_PRESS_DURATION = 400; // ms [FIX-编辑模式优化] 从600ms缩短到400ms，提升响应速度
    let _lpStartX = 0, _lpStartY = 0;

    // --- Snapshot (进入编辑模式时保存，还原时恢复) ---
    let _editSnapshot = null; // { positions: {key: {row,col,rowSpan,colSpan,page}}, hidden: [...], spanInfo: {...} }

    // --- Drag State ---
    let _dragTarget = null;
    let _dragClone = null;
    let _dragOffsetX = 0, _dragOffsetY = 0;
    let _dragStarted = false;
    let _dragMoveStartX = 0, _dragMoveStartY = 0;
    let _dragOriginalGridPos = null; // { row, col, rowSpan, colSpan }
    let _dragCurrentGridPos = null; // 实时推挤：拖拽元素当前的逻辑位置
    let _dragPage = 1; // which page the drag is currently on
    let _dragOriginalPage = 1; // which page the drag started from
    let _crossPageTimer = null; // 跨页拖动计时器
    let _crossPageTriggered = false; // 防止重复触发
    let _lastHoverCell = null; // 上次悬停的格子，避免重复触发

    // --- Grid Config ---
    const GRID_COLS = 4;       // grid columns per page
    const GRID_ROWS_PAGE1 = 4; // total rows on page 1
    const GRID_COLS_PAGE2 = 4; // grid columns for page 2
    const GRID_ROWS_PAGE2 = 6; // total rows on page 2

    // --- Storage Keys ---
    const HIDDEN_KEY = 'YAN_desktop_hidden_v3'; // hidden items (individual app/widget keys)
    const POS_KEY = 'YAN_desktop_positions_v5'; // grid position data per page (v5 = unified grid)
    const SPAN_KEY = 'YAN_desktop_spans_v1'; // 保存被删除组件的原始 span 信息

    // ============================================================
    // Utility: Get all editable elements (individual apps + widgets)
    // ============================================================

    // Get all app-items on page 1
    function _getPage1AppItems() {
        return [...document.querySelectorAll('#desktop-grid .app-item')];
    }

    // Get page 1 widgets (custom-widget, time-date, info-card)
    function _getPage1Widgets() {
        const widgets = [];
        const timeDate = document.querySelector('.desktop-time-date-area[data-section="time-date"]');
        const infoCard = document.querySelector('.user-info-card[data-section="info-card"]');
        const customWidget = document.querySelector('#desktop-grid .custom-widget');
        if (timeDate) widgets.push(timeDate);
        if (infoCard) widgets.push(infoCard);
        if (customWidget) widgets.push(customWidget);
        return widgets;
    }

    // Get all items on page 2 (apps + widgets all in one grid)
    function _getPage2AllItems() {
        const grid = document.getElementById('desktop-page2-grid');
        if (!grid) return [];
        return [...grid.children].filter(el =>
            el.classList.contains('app-item') ||
            el.hasAttribute('data-p2-section') ||
            el.classList.contains('p2-photo-upload') ||
            el.classList.contains('p2-music-widget')
        );
    }

    // Get page 2 app items only
    function _getPage2AppItems() {
        const grid = document.getElementById('desktop-page2-grid');
        if (!grid) return [];
        return [...grid.querySelectorAll('.app-item')];
    }

    // Get page 2 widgets only
    function _getPage2Widgets() {
        const widgets = [];
        const photo = document.querySelector('#desktop-page2-grid .p2-photo-upload[data-p2-section="p2-photo"]');
        const album = document.querySelector('#desktop-page2-grid .p2-music-widget[data-p2-section="p2-album"]');
        if (photo) widgets.push(photo);
        if (album) widgets.push(album);
        return widgets;
    }

    // All individual editable elements across both pages
    function _getAllEditableElements() {
        const elements = [
            ..._getPage1AppItems(),
            ..._getPage1Widgets(),
            ..._getPage2AllItems()
        ];
        // Deduplicate
        const seen = new Set();
        return elements.filter(el => {
            if (seen.has(el)) return false;
            seen.add(el);
            return true;
        });
    }

    // ============================================================
    // Element key helpers (unique key for each element)
    // ============================================================
    function _getElementKey(el) {
        // App item - use openApp id
        if (el.classList.contains('app-item')) {
            const onclick = el.getAttribute('onclick') || '';
            const match = onclick.match(/openApp\(['"]([^'"]+)['"]\)/);
            if (match) return 'app-' + match[1];
            const nameEl = el.querySelector('.app-name');
            if (nameEl) return 'app-name-' + nameEl.textContent.trim();
        }
        // Sections/widgets
        if (el.hasAttribute('data-section')) return 'section-' + el.getAttribute('data-section');
        if (el.hasAttribute('data-p2-section')) return 'section-' + el.getAttribute('data-p2-section');
        // Custom widget
        if (el.classList.contains('custom-widget')) return 'custom-widget';
        return null;
    }

    // Get human-readable name for element
    function _getElementName(el) {
        if (el.classList.contains('app-item')) {
            const nameEl = el.querySelector('.app-name');
            if (nameEl) return nameEl.textContent.trim();
        }
        const nameMap = {
            'time-date': '时间日期',
            'info-card': '信息卡片',
            'p2-photo': '顶部图片',
            'p2-album': '音乐组件'
        };
        const sectionKey = el.getAttribute('data-section') || el.getAttribute('data-p2-section');
        if (sectionKey && nameMap[sectionKey]) return nameMap[sectionKey];
        if (el.classList.contains('custom-widget')) return '图片组件';
        return '组件';
    }

    // Icon mapping for recycle tray
    function _getElementIcon(el) {
        if (el.classList.contains('app-item')) {
            const iconEl = el.querySelector('.app-icon i');
            if (iconEl) return iconEl.className;
        }
        const iconMap = {
            'time-date': 'fas fa-clock',
            'info-card': 'fas fa-id-card',
            'p2-photo': 'fas fa-camera',
            'p2-album': 'fas fa-music'
        };
        const sectionKey = el.getAttribute('data-section') || el.getAttribute('data-p2-section');
        if (sectionKey && iconMap[sectionKey]) return iconMap[sectionKey];
        if (el.classList.contains('custom-widget')) return 'fas fa-images';
        return 'fas fa-puzzle-piece';
    }

    // ============================================================
    // Hidden elements management
    // ============================================================
    function _getHiddenElements() {
        try {
            return JSON.parse(localStorage.getItem(HIDDEN_KEY) || '[]');
        } catch(e) { return []; }
    }
    function _saveHiddenElements(arr) {
        localStorage.setItem(HIDDEN_KEY, JSON.stringify(arr));
    }
    function _hideElement(key) {
        const hidden = _getHiddenElements();
        if (!hidden.includes(key)) {
            hidden.push(key);
            _saveHiddenElements(hidden);
        }
    }
    function _unhideElement(key) {
        let hidden = _getHiddenElements();
        hidden = hidden.filter(k => k !== key);
        _saveHiddenElements(hidden);
    }
    function _isElementHidden(el) {
        if (el.getAttribute('data-hidden') === 'true') return true;
        if (el.style.display === 'none') return true;
        return false;
    }
    function _applyHiddenElements() {
        const hidden = _getHiddenElements();
        _getAllEditableElements().forEach(el => {
            const key = _getElementKey(el);
            if (key && hidden.includes(key)) {
                el.style.display = 'none';
                el.setAttribute('data-hidden', 'true');
            } else {
                // Only restore if it was hidden by us
                if (el.getAttribute('data-hidden') === 'true') {
                    el.style.display = '';
                    el.removeAttribute('data-hidden');
                }
            }
        });
    }

    // ============================================================
    // Span Info Management (保存被删除组件的原始尺寸)
    // ============================================================
    function _getSavedSpanInfo() {
        try {
            return JSON.parse(localStorage.getItem(SPAN_KEY) || '{}');
        } catch(e) { return {}; }
    }
    function _saveSpanInfo(key, rowSpan, colSpan) {
        const info = _getSavedSpanInfo();
        info[key] = { rowSpan: rowSpan, colSpan: colSpan };
        localStorage.setItem(SPAN_KEY, JSON.stringify(info));
    }
    function _removeSavedSpanInfo(key) {
        const info = _getSavedSpanInfo();
        delete info[key];
        localStorage.setItem(SPAN_KEY, JSON.stringify(info));
    }
    function _getSpanForKey(key) {
        const info = _getSavedSpanInfo();
        return info[key] || null;
    }

    // ============================================================
    // Snapshot System (进入编辑模式时保存完整快照)
    // ============================================================
    function _takeSnapshot() {
        const snapshot = { positions: {}, hidden: _getHiddenElements().slice(), spanInfo: _getSavedSpanInfo() };
        const allElements = _getAllEditableElements();
        allElements.forEach(function(el) {
            const key = _getElementKey(el);
            if (!key) return;
            const pos = _parseGridPos(el);
            const isPage2 = el.closest('#desktop-page-2') || el.closest('#desktop-page2-grid');
            snapshot.positions[key] = {
                row: pos.row,
                col: pos.col,
                rowSpan: pos.rowSpan,
                colSpan: pos.colSpan,
                page: isPage2 ? 2 : 1,
                hidden: _isElementHidden(el),
                display: el.style.display || ''
            };
        });
        return snapshot;
    }

    function _restoreFromSnapshot(snapshot) {
        if (!snapshot) return;

        // 1. 恢复隐藏状态
        _saveHiddenElements(snapshot.hidden || []);

        // 2. 恢复 span 信息
        if (snapshot.spanInfo) {
            localStorage.setItem(SPAN_KEY, JSON.stringify(snapshot.spanInfo));
        }

        // 3. 恢复所有元素的位置和显示状态（包括跨页移动的恢复）
        var grid1 = document.getElementById('desktop-grid');
        var grid2 = document.getElementById('desktop-page2-grid');
        var allElements = _getAllEditableElements();

        allElements.forEach(function(el) {
            var key = _getElementKey(el);
            if (!key || !snapshot.positions[key]) return;
            var saved = snapshot.positions[key];

            // 检查元素是否被跨页移动了，需要移回原页面
            var currentPage = (el.closest('#desktop-page-2') || el.closest('#desktop-page2-grid')) ? 2 : 1;
            if (saved.page && saved.page !== currentPage) {
                // 需要移回原页面
                var targetGrid = (saved.page === 2) ? grid2 : grid1;
                var currentGrid = (currentPage === 2) ? grid2 : grid1;
                if (targetGrid && currentGrid && el.parentNode === currentGrid) {
                    currentGrid.removeChild(el);
                    targetGrid.appendChild(el);
                }
            }

            // 恢复显示状态
            if (saved.hidden) {
                el.style.display = 'none';
                el.setAttribute('data-hidden', 'true');
            } else {
                el.style.display = saved.display || '';
                el.removeAttribute('data-hidden');
            }

            // 恢复 grid 位置
            if (saved.row > 0 && saved.col > 0) {
                _setGridPos(el, saved.row, saved.col, saved.rowSpan, saved.colSpan);
            } else {
                el.style.gridRow = '';
                el.style.gridColumn = '';
            }
        });

        // 4. 保存恢复后的布局
        _saveCurrentLayout();
    }

    // ============================================================
    // Grid Position Helpers (unified for both pages)
    // ============================================================

    // Parse grid-row/grid-column style to get start position and span
    function _parseGridPos(el) {
        const gridRow = el.style.gridRow || '';
        const gridCol = el.style.gridColumn || '';

        let row = 0, col = 0, rowSpan = 1, colSpan = 1;

        // Parse "N / span M" format
        const rowSpanMatch = gridRow.match(/(\d+)\s*\/\s*span\s*(\d+)/);
        const colSpanMatch = gridCol.match(/(\d+)\s*\/\s*span\s*(\d+)/);

        if (rowSpanMatch) {
            row = parseInt(rowSpanMatch[1]);
            rowSpan = parseInt(rowSpanMatch[2]);
        } else {
            row = parseInt(gridRow) || 0;
        }

        if (colSpanMatch) {
            col = parseInt(colSpanMatch[1]);
            colSpan = parseInt(colSpanMatch[2]);
        } else {
            col = parseInt(gridCol) || 0;
        }

        return { row, col, rowSpan, colSpan };
    }

    // Set grid position with optional span
    function _setGridPos(el, row, col, rowSpan, colSpan) {
        rowSpan = rowSpan || 1;
        colSpan = colSpan || 1;
        if (rowSpan > 1) {
            el.style.gridRow = row + ' / span ' + rowSpan;
        } else {
            el.style.gridRow = row + '';
        }
        if (colSpan > 1) {
            el.style.gridColumn = col + ' / span ' + colSpan;
        } else {
            el.style.gridColumn = col + '';
        }
    }

    // Get cells occupied by an element (considering span)
    function _getElementCells(el) {
        const pos = _parseGridPos(el);
        if (pos.row <= 0 || pos.col <= 0) return [];
        const cells = [];
        for (let r = pos.row; r < pos.row + pos.rowSpan; r++) {
            for (let c = pos.col; c < pos.col + pos.colSpan; c++) {
                cells.push({ row: r, col: c });
            }
        }
        return cells;
    }

    // Get all occupied cells on a page (by widgets and apps), excluding one element
    function _getOccupiedCells(page, excludeEl) {
        const items = (page === 2) ? _getPage2AllItems() : [..._getPage1AppItems(), ..._getPage1Widgets()];
        const cells = [];
        items.forEach(el => {
            if (el === excludeEl) return;
            if (_isElementHidden(el)) return;
            const elCells = _getElementCells(el);
            cells.push(...elCells);
        });
        return cells;
    }

    // Check if a cell is occupied
    function _isCellOccupied(row, col, page, excludeEl) {
        const occupied = _getOccupiedCells(page, excludeEl);
        return occupied.some(c => c.row === row && c.col === col);
    }

    // Find which element occupies a given cell
    function _findElementAtCell(row, col, page, excludeEl) {
        const items = (page === 2) ? _getPage2AllItems() : [..._getPage1AppItems(), ..._getPage1Widgets()];
        for (const el of items) {
            if (el === excludeEl) continue;
            if (_isElementHidden(el)) continue;
            const cells = _getElementCells(el);
            if (cells.some(c => c.row === row && c.col === col)) {
                return el;
            }
        }
        return null;
    }

    // Check if a region (with span) is available
    function _isRegionAvailable(row, col, rowSpan, colSpan, page, excludeEl) {
        const maxRows = (page === 2) ? GRID_ROWS_PAGE2 : GRID_ROWS_PAGE1;
        const maxCols = (page === 2) ? GRID_COLS_PAGE2 : GRID_COLS;
        if (row < 1 || col < 1) return false;
        if (row + rowSpan - 1 > maxRows || col + colSpan - 1 > maxCols) return false;
        for (let r = row; r < row + rowSpan; r++) {
            for (let c = col; c < col + colSpan; c++) {
                if (_isCellOccupied(r, c, page, excludeEl)) return false;
            }
        }
        return true;
    }

    // Get all available single cells
    function _getAvailableCells(excludeEl, page) {
        const maxRows = (page === 2) ? GRID_ROWS_PAGE2 : GRID_ROWS_PAGE1;
        const maxCols = (page === 2) ? GRID_COLS_PAGE2 : GRID_COLS;
        const cells = [];
        for (let r = 1; r <= maxRows; r++) {
            for (let c = 1; c <= maxCols; c++) {
                if (!_isCellOccupied(r, c, page, excludeEl)) {
                    cells.push({ row: r, col: c });
                }
            }
        }
        return cells;
    }

    // Legacy compatibility: _getAppGridPos / _setAppGridPos
    function _getAppGridPos(el) {
        const pos = _parseGridPos(el);
        return { row: pos.row, col: pos.col };
    }
    function _setAppGridPos(el, row, col) {
        const pos = _parseGridPos(el);
        _setGridPos(el, row, col, pos.rowSpan, pos.colSpan);
    }

    // ============================================================
    // Grid Placeholders (visual empty cells in edit mode)
    // ============================================================
    function _showGridPlaceholders(page) {
        _removeGridPlaceholders(page);
        const gridId = (page === 2) ? 'desktop-page2-grid' : 'desktop-grid';
        const grid = document.getElementById(gridId);
        if (!grid) return;

        const maxRows = (page === 2) ? GRID_ROWS_PAGE2 : GRID_ROWS_PAGE1;
        const maxCols = (page === 2) ? GRID_COLS_PAGE2 : GRID_COLS;

        // Set grid template
        // [FIX-第二页布局] 第二页前3行（photo/album组件）使用auto高度，后3行使用1fr
        // 避免用repeat(6, 1fr)把photo/album等组件压缩成极小尺寸（"变成一排点点"）
        if (page === 2) {
            grid.style.gridTemplateRows = 'auto auto auto repeat(3, 1fr)';
        } else {
            grid.style.gridTemplateRows = 'repeat(' + maxRows + ', 1fr)';
        }
        grid.style.gridTemplateColumns = 'repeat(' + maxCols + ', 1fr)';

        const availableCells = _getAvailableCells(null, page);
        availableCells.forEach(cell => {
            const placeholder = document.createElement('div');
            placeholder.className = 'grid-drop-placeholder';
            placeholder.setAttribute('data-grid-row', cell.row);
            placeholder.setAttribute('data-grid-col', cell.col);
            placeholder.setAttribute('data-grid-page', page + '');
            placeholder.style.gridRow = cell.row + '';
            placeholder.style.gridColumn = cell.col + '';
            placeholder.innerHTML = '<i class="fas fa-plus" style="opacity:0.3;font-size:14px;"></i>';
            grid.appendChild(placeholder);
        });
    }

    function _removeGridPlaceholders(page) {
        if (page === 1 || !page) {
            const grid = document.getElementById('desktop-grid');
            if (grid) grid.querySelectorAll('.grid-drop-placeholder').forEach(el => el.remove());
        }
        if (page === 2 || !page) {
            const grid = document.getElementById('desktop-page2-grid');
            if (grid) grid.querySelectorAll('.grid-drop-placeholder').forEach(el => el.remove());
        }
    }

    // Update placeholders (e.g., after a swap)
    function _updateGridPlaceholders() {
        if (!_editMode) return;
        _showGridPlaceholders(1);
        _showGridPlaceholders(2);
    }

    // ============================================================
    // Enter / Exit Edit Mode
    // ============================================================
    function enterEditMode() {
        if (_editMode) return;
        _editMode = true;

        // Vibrate feedback
        if (navigator.vibrate) navigator.vibrate(50);

        const device = document.getElementById('device');
        if (device) device.classList.add('desktop-edit-mode');

        // 保存快照（在任何修改之前）
        _editSnapshot = _takeSnapshot();

        const hidden = _getHiddenElements();

        // Ensure all page 1 apps have grid positions
        _ensureGridPositions(1);
        // Ensure all page 2 items have grid positions
        _ensureGridPositions(2);

        // Add wobble and delete badge to each individual element
        _getAllEditableElements().forEach(el => {
            const key = _getElementKey(el);
            // Skip hidden elements (user-hidden)
            if (el.getAttribute('data-hidden') === 'true') return;
            if (_isElementHidden(el)) return;
            
            el.classList.add('desktop-app-wobble');

            // Ensure position:relative for badge positioning
            const computedPos = window.getComputedStyle(el).position;
            if (computedPos === 'static') el.style.position = 'relative';

            if (key && !hidden.includes(key)) {
                _addDeleteBadge(el);
            }
        });

        // Show grid placeholders for empty cells on both pages
        _showGridPlaceholders(1);
        _showGridPlaceholders(2);

        // Show edit overlay with done button + recycle tray
        _showEditOverlay();

        // Update recycle tray
        _updateRecycleTray();
    }

    function exitEditMode() {
        if (!_editMode) return;
        _editMode = false;

        // 清除快照（编辑完成后不再需要）
        _editSnapshot = null;

        const device = document.getElementById('device');
        if (device) device.classList.remove('desktop-edit-mode');

        // Remove edit decorations from all elements
        document.querySelectorAll('.desktop-app-wobble').forEach(el => {
            el.classList.remove('desktop-app-wobble');
        });
        document.querySelectorAll('.desktop-delete-badge').forEach(el => el.remove());
        document.querySelectorAll('.desktop-editable').forEach(el => {
            el.classList.remove('desktop-editable');
        });

        // Remove grid placeholders
        _removeGridPlaceholders();

        // [FIX-视觉复原] 退出编辑模式时恢复正确的 grid 模板，而非清空
        // 清空会导致浏览器回退到 auto 布局，图标位置视觉上"复原"
        const grid1 = document.getElementById('desktop-grid');
        if (grid1) {
            grid1.style.gridTemplateRows = 'repeat(' + GRID_ROWS_PAGE1 + ', 1fr)';
            grid1.style.gridTemplateColumns = 'repeat(' + GRID_COLS + ', 1fr)';
        }
        const grid2 = document.getElementById('desktop-page2-grid');
        if (grid2) {
            grid2.style.gridTemplateRows = 'auto auto auto repeat(3, 1fr)';
            grid2.style.gridTemplateColumns = 'repeat(' + GRID_COLS_PAGE2 + ', 1fr)';
        }

        // Clean up position:relative styles
        _getAllEditableElements().forEach(el => {
            if (el.style.position === 'relative') {
                el.style.position = '';
            }
        });

        // Re-apply hidden
        _applyHiddenElements();

        // Remove overlay
        _hideEditOverlay();

        // Clean up any drag
        _cleanupDrag();

        // [FIX-第二页恢复] 退出编辑模式后确保第二页组件样式恢复正常
        // 恢复第二页 app-icon 的 color，防止编辑模式残留导致颜色丢失
        setTimeout(function() {
            var grid2 = document.getElementById('desktop-page2-grid');
            if (grid2) {
                grid2.querySelectorAll('.app-icon').forEach(function(iconEl) {
                    // 如果没有自定义图标（没有 backgroundImage url），恢复默认颜色
                    var bg = iconEl.style.backgroundImage || '';
                    if (!bg || bg === 'none' || bg.indexOf('url') === -1) {
                        iconEl.style.color = 'var(--text-desktop)';
                    }
                });
            }
        }, 100);
    }

    // ============================================================
    // Ensure all items have grid-row/grid-column set
    // ============================================================
    function _ensureGridPositions(page) {
        const maxRows = (page === 2) ? GRID_ROWS_PAGE2 : GRID_ROWS_PAGE1;
        const maxCols = (page === 2) ? GRID_COLS_PAGE2 : GRID_COLS;

        let items;
        if (page === 2) {
            items = _getPage2AllItems();
        } else {
            items = _getPage1AppItems();
        }

        const occupiedCells = new Set();

        // For page 1, mark widget cells (including time-date, info-card, custom-widget)
        if (page === 1) {
            _getPage1Widgets().forEach(function(w) {
                if (!_isElementHidden(w)) {
                    _getElementCells(w).forEach(function(c) {
                        occupiedCells.add(c.row + ',' + c.col);
                    });
                }
            });
        }

        // [FIX-位置偏移] 更保守的策略：
        // 1. 有位置的元素保持不动（即使有冲突也不重新分配，避免连锁偏移）
        // 2. 只给完全没有位置的元素分配新位置
        const itemsWithoutPos = [];
        items.forEach(item => {
            if (_isElementHidden(item)) return;
            const pos = _parseGridPos(item);
            const hasPosition = pos.row > 0 && pos.col > 0;

            if (hasPosition) {
                // 有位置就保留，记录占用的格子
                for (let r = pos.row; r < pos.row + pos.rowSpan; r++) {
                    for (let c = pos.col; c < pos.col + pos.colSpan; c++) {
                        occupiedCells.add(r + ',' + c);
                    }
                }
            } else {
                // 完全没有位置，需要分配
                itemsWithoutPos.push(item);
            }
        });

        // Second pass: assign positions to items without valid positions
        let nextRow = 1, nextCol = 1;
        itemsWithoutPos.forEach(item => {
            const pos = _parseGridPos(item);
            const rowSpan = pos.rowSpan || 1;
            const colSpan = pos.colSpan || 1;

            // Find a position where this item fits (considering its span)
            let placed = false;
            for (let r = nextRow; r <= maxRows && !placed; r++) {
                for (let c = (r === nextRow ? nextCol : 1); c <= maxCols && !placed; c++) {
                    // Check if the entire region is available
                    if (r + rowSpan - 1 > maxRows || c + colSpan - 1 > maxCols) continue;
                    let regionFree = true;
                    for (let rr = r; rr < r + rowSpan && regionFree; rr++) {
                        for (let cc = c; cc < c + colSpan && regionFree; cc++) {
                            if (occupiedCells.has(rr + ',' + cc)) {
                                regionFree = false;
                            }
                        }
                    }
                    if (regionFree) {
                        _setGridPos(item, r, c, rowSpan, colSpan);
                        for (let rr = r; rr < r + rowSpan; rr++) {
                            for (let cc = c; cc < c + colSpan; cc++) {
                                occupiedCells.add(rr + ',' + cc);
                            }
                        }
                        placed = true;
                        nextRow = r;
                        nextCol = c + 1;
                        if (nextCol > maxCols) {
                            nextCol = 1;
                            nextRow++;
                        }
                    }
                }
            }
            // If couldn't place, the grid is full - item will be hidden or overlapping
            // This shouldn't normally happen
        });
    }

    // ============================================================
    // Delete Badge (× button on each individual element)
    // ============================================================
    function _addDeleteBadge(el) {
        // Remove existing badges
        const existing = el.querySelector(':scope > .desktop-delete-badge');
        if (existing) existing.remove();

        const badge = document.createElement('div');
        badge.className = 'desktop-delete-badge';
        badge.innerHTML = '<i class="fas fa-minus"></i>';

        // Use touchstart for immediate response on mobile
        badge.addEventListener('touchstart', function(e) {
            e.stopPropagation();
            e.stopImmediatePropagation();
            e.preventDefault();
            _deleteElement(el);
        }, { passive: false, capture: true });

        badge.addEventListener('click', function(e) {
            e.stopPropagation();
            e.stopImmediatePropagation();
            e.preventDefault();
            _deleteElement(el);
            return false;
        }, { capture: true });

        badge.style.pointerEvents = 'auto';
        badge.style.touchAction = 'manipulation';

        el.appendChild(badge);
    }

    // Delete element directly (no confirmation dialog)
    function _deleteElement(el) {
        const key = _getElementKey(el);
        if (!key) return;

        // [FIX] 删除前保存 span 信息，以便还原时恢复完整尺寸
        const pos = _parseGridPos(el);
        if (pos.rowSpan > 1 || pos.colSpan > 1) {
            _saveSpanInfo(key, pos.rowSpan, pos.colSpan);
        }

        // Animate removal
        el.style.transition = 'all 0.3s ease';
        el.style.transform = 'scale(0.5)';
        el.style.opacity = '0';

        setTimeout(() => {
            // Hide the element
            _hideElement(key);
            el.style.display = 'none';
            el.setAttribute('data-hidden', 'true');
            el.style.transform = '';
            el.style.opacity = '';
            el.style.transition = '';
            el.classList.remove('desktop-app-wobble');

            // Clear grid position so the cell is truly freed
            el.style.gridRow = '';
            el.style.gridColumn = '';

            // Remove badge
            const badge = el.querySelector('.desktop-delete-badge');
            if (badge) badge.remove();

            // Update grid placeholders
            _updateGridPlaceholders();

            // Update the recycle tray
            _updateRecycleTray();

            // [体验-紧凑] 删除后自动紧凑同页的单格 app
            const isPage2 = el.closest('#desktop-page-2') || el.closest('#desktop-page2-grid');
            _compactGrid(isPage2 ? 2 : 1);

            // Save layout after deletion
            _saveCurrentLayout();

            // Toast
            const name = _getElementName(el);
            if (typeof toast === 'function') toast(name + ' 已移除');
        }, 280);
    }

    // ============================================================
    // [体验-紧凑] 自动紧凑重排：删除图标后，后面的单格 app 自动向前填补空位
    // 只对单格 app 生效，大组件（widget）保持原位
    // ============================================================
    function _compactGrid(page) {
        var gridId = (page === 2) ? 'desktop-page2-grid' : 'desktop-grid';
        var grid = document.getElementById(gridId);
        if (!grid) return;

        var maxRows = (page === 2) ? GRID_ROWS_PAGE2 : GRID_ROWS_PAGE1;
        var maxCols = (page === 2) ? GRID_COLS_PAGE2 : GRID_COLS;

        // 收集大组件占用的格子（不参与紧凑）
        var widgetCells = new Set();
        var widgetSelector = (page === 2)
            ? '.p2-photo-upload, .p2-music-widget'
            : '.custom-widget, .desktop-time-date-area, .user-info-card';
        grid.querySelectorAll(widgetSelector).forEach(function(w) {
            if (w.style.display === 'none' || w.getAttribute('data-hidden') === 'true') return;
            var wPos = _parseGridPos(w);
            if (wPos.row > 0 && wPos.col > 0) {
                for (var r = wPos.row; r < wPos.row + wPos.rowSpan; r++) {
                    for (var c = wPos.col; c < wPos.col + wPos.colSpan; c++) {
                        widgetCells.add(r + '-' + c);
                    }
                }
            }
        });

        // 收集所有可见的单格 app，按当前位置排序
        var apps = [];
        grid.querySelectorAll('.app-item').forEach(function(item) {
            if (item.style.display === 'none' || item.getAttribute('data-hidden') === 'true') return;
            var pos = _parseGridPos(item);
            if (pos.rowSpan > 1 || pos.colSpan > 1) return; // 跳过大组件
            apps.push({ el: item, row: pos.row || 999, col: pos.col || 999 });
        });

        // 按行列排序
        apps.sort(function(a, b) {
            if (a.row !== b.row) return a.row - b.row;
            return a.col - b.col;
        });

        // 找出所有可用的单格位置（排除 widget 占用的格子），按行列排序
        var availableSlots = [];
        // 对于第二页，app 从第4行开始（前3行是 widget）
        var startRow = (page === 2) ? 4 : 1;
        for (var r = startRow; r <= maxRows; r++) {
            for (var c = 1; c <= maxCols; c++) {
                if (!widgetCells.has(r + '-' + c)) {
                    availableSlots.push({ row: r, col: c });
                }
            }
        }

        // 将 app 按顺序填入可用位置
        for (var i = 0; i < apps.length && i < availableSlots.length; i++) {
            var slot = availableSlots[i];
            if (apps[i].row !== slot.row || apps[i].col !== slot.col) {
                // 添加 transition 动画
                apps[i].el.style.transition = 'all 0.25s cubic-bezier(0.2, 0, 0, 1)';
                _setGridPos(apps[i].el, slot.row, slot.col, 1, 1);
                // 清除 transition
                (function(el) {
                    setTimeout(function() { el.style.transition = ''; }, 300);
                })(apps[i].el);
            }
        }
    }

    // ============================================================
    // Recycle Tray (bottom area showing removed elements)
    // ============================================================
    function _createRecycleTray() {
        let tray = document.getElementById('desktop-recycle-tray');
        if (tray) return tray;

        tray = document.createElement('div');
        tray.id = 'desktop-recycle-tray';
        tray.innerHTML =
            '<div class="recycle-tray-header">' +
                '<i class="fas fa-trash-restore"></i>' +
                '<span>已移除的组件（点击恢复）</span>' +
            '</div>' +
            '<div class="recycle-tray-items" id="recycle-tray-items"></div>';

        return tray;
    }

    function _updateRecycleTray() {
        const hidden = _getHiddenElements();
        const tray = document.getElementById('desktop-recycle-tray');
        if (!tray) return;

        const itemsContainer = document.getElementById('recycle-tray-items');
        if (!itemsContainer) return;

        // Clear existing items
        itemsContainer.innerHTML = '';

        if (hidden.length === 0) {
            tray.classList.add('recycle-tray-empty');
            itemsContainer.innerHTML = '<div class="recycle-tray-empty-hint">没有被移除的组件</div>';
            return;
        }

        tray.classList.remove('recycle-tray-empty');

        // Find elements matching hidden keys
        const allElements = _getAllEditableElements();
        
        hidden.forEach(hiddenKey => {
            let targetEl = null;
            for (const el of allElements) {
                if (_getElementKey(el) === hiddenKey) {
                    targetEl = el;
                    break;
                }
            }

            const item = document.createElement('div');
            item.className = 'recycle-tray-item';
            item.setAttribute('data-recycle-key', hiddenKey);

            const iconClass = targetEl ? _getElementIcon(targetEl) : 'fas fa-puzzle-piece';
            const name = targetEl ? _getElementName(targetEl) : hiddenKey;

            item.innerHTML =
                '<div class="recycle-item-icon"><i class="' + iconClass + '"></i></div>' +
                '<div class="recycle-item-name">' + name + '</div>' +
                '<div class="recycle-item-add"><i class="fas fa-plus"></i></div>';

            const doRestore = function(e) {
                e.stopPropagation();
                e.preventDefault();
                _restoreElement(hiddenKey);
            };
            item.addEventListener('click', doRestore);
            item.addEventListener('touchend', function(e) {
                e.preventDefault();
                doRestore(e);
            });

            itemsContainer.appendChild(item);
        });
    }

    function _restoreElement(key) {
        _unhideElement(key);

        const allElements = _getAllEditableElements();
        let found = false;
        
        for (const el of allElements) {
            if (_getElementKey(el) === key) {
                found = true;
                el.style.display = '';
                el.removeAttribute('data-hidden');
                el.classList.add('desktop-app-wobble');

                // Determine which page this element belongs to
                const isPage2 = el.closest('#desktop-page-2') || el.closest('#desktop-page2-grid');
                const page = isPage2 ? 2 : 1;

                // [FIX] 从保存的 span 信息恢复原始尺寸，而不是从已清空的 gridRow/gridColumn 读取
                let pos = _parseGridPos(el);
                const savedSpan = _getSpanForKey(key);
                let rowSpan = pos.rowSpan;
                let colSpan = pos.colSpan;
                if (savedSpan) {
                    rowSpan = savedSpan.rowSpan || 1;
                    colSpan = savedSpan.colSpan || 1;
                }
                // 也检查快照中的信息
                if (rowSpan === 1 && colSpan === 1 && _editSnapshot && _editSnapshot.positions[key]) {
                    const snapPos = _editSnapshot.positions[key];
                    if (snapPos.rowSpan > 1 || snapPos.colSpan > 1) {
                        rowSpan = snapPos.rowSpan;
                        colSpan = snapPos.colSpan;
                    }
                }
                // 也检查默认布局
                if (rowSpan === 1 && colSpan === 1) {
                    var defLayout = (page === 2) ? DEFAULT_LAYOUT_PAGE2 : DEFAULT_LAYOUT_PAGE1;
                    if (defLayout[key] && (defLayout[key].rowSpan > 1 || defLayout[key].colSpan > 1)) {
                        rowSpan = defLayout[key].rowSpan;
                        colSpan = defLayout[key].colSpan;
                    }
                }

                // [FIX-组件乱跑] 安全检查：span 不能超出网格边界
                const maxRows = (page === 2) ? GRID_ROWS_PAGE2 : GRID_ROWS_PAGE1;
                const maxCols = (page === 2) ? GRID_COLS_PAGE2 : GRID_COLS;
                if (rowSpan > maxRows) rowSpan = maxRows;
                if (colSpan > maxCols) colSpan = maxCols;
                // info-card / time-date 这类全宽组件不应纵向跨行
                if (key && (key.indexOf('info-card') > -1 || key.indexOf('time-date') > -1)) {
                    rowSpan = 1;
                    if (colSpan < 4) colSpan = 4; // 确保全宽
                }

                if (pos.row === 0 || pos.col === 0 || !_isRegionAvailable(pos.row, pos.col, rowSpan, colSpan, page, el)) {
                    // Find an empty cell/region for it
                    const maxRows = (page === 2) ? GRID_ROWS_PAGE2 : GRID_ROWS_PAGE1;
                    const maxCols = (page === 2) ? GRID_COLS_PAGE2 : GRID_COLS;
                    let placed = false;
                    for (let r = 1; r <= maxRows && !placed; r++) {
                        for (let c = 1; c <= maxCols && !placed; c++) {
                            if (_isRegionAvailable(r, c, rowSpan, colSpan, page, el)) {
                                _setGridPos(el, r, c, rowSpan, colSpan);
                                placed = true;
                            }
                        }
                    }
                    if (!placed) {
                        // 空间不够，提示用户
                        if (typeof toast === 'function') toast('空间不足，无法放置 ' + _getElementName(el));
                        // 重新隐藏
                        _hideElement(key);
                        el.style.display = 'none';
                        el.setAttribute('data-hidden', 'true');
                        _updateRecycleTray();
                        return;
                    }
                } else {
                    // 原位置可用，用正确的 span 恢复
                    _setGridPos(el, pos.row, pos.col, rowSpan, colSpan);
                }

                // 清除已使用的 span 信息
                _removeSavedSpanInfo(key);

                // Animate in
                el.style.transform = 'scale(0.5)';
                el.style.opacity = '0';
                el.style.transition = 'all 0.3s ease';
                requestAnimationFrame(() => {
                    el.style.transform = 'scale(1)';
                    el.style.opacity = '1';
                    setTimeout(() => {
                        el.style.transform = '';
                        el.style.opacity = '';
                        el.style.transition = '';
                    }, 300);
                });

                // Ensure relative positioning
                const computedPos = window.getComputedStyle(el).position;
                if (computedPos === 'static') el.style.position = 'relative';

                // Add delete badge
                _addDeleteBadge(el);
                break;
            }
        }

        if (!found) {
            // 元素未在 DOM 中找到，撤销 unhide 操作
            _hideElement(key);
            return;
        }

        // Update grid placeholders
        _updateGridPlaceholders();

        // Update recycle tray
        _updateRecycleTray();

        // Save layout
        _saveCurrentLayout();

        // Toast
        if (typeof toast === 'function') toast(_getElementNameByKey(key) + ' 已恢复');
    }

    function _getElementNameByKey(key) {
        const allElements = _getAllEditableElements();
        for (const el of allElements) {
            if (_getElementKey(el) === key) {
                return _getElementName(el);
            }
        }
        return '组件';
    }

    // ============================================================
    // Edit Mode Overlay (Done button + Recycle Tray)
    // ============================================================
    function _showEditOverlay() {
        let overlay = document.getElementById('desktop-edit-overlay');
        if (overlay) {
            overlay.style.display = 'flex';
            if (!document.getElementById('desktop-recycle-tray')) {
                const tray = _createRecycleTray();
                overlay.appendChild(tray);
            }
            return;
        }

        overlay = document.createElement('div');
        overlay.id = 'desktop-edit-overlay';
        overlay.innerHTML =
            '<div class="desktop-edit-toolbar">' +
                '<button class="desktop-edit-reset-btn" id="desktop-edit-undo-btn"><i class="fas fa-undo"></i> 还原</button>' +
                '<button class="desktop-edit-reset-btn desktop-edit-factory-btn" id="desktop-edit-factory-btn"><i class="fas fa-history"></i> 默认</button>' +
                '<button class="desktop-edit-done-btn" id="desktop-edit-done-btn">完成</button>' +
            '</div>';

        const tray = _createRecycleTray();
        overlay.appendChild(tray);

        document.getElementById('device').appendChild(overlay);

        const doneBtn = document.getElementById('desktop-edit-done-btn');
        doneBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            exitEditMode();
        });
        doneBtn.addEventListener('touchend', function(e) {
            e.preventDefault();
            e.stopPropagation();
            exitEditMode();
        });

        // 还原按钮 - 恢复到编辑前状态（快照）
        const undoBtn = document.getElementById('desktop-edit-undo-btn');
        undoBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            _restoreToSnapshot();
        });
        undoBtn.addEventListener('touchend', function(e) {
            e.preventDefault();
            e.stopPropagation();
            _restoreToSnapshot();
        });

        // 恢复默认按钮 - 恢复到出厂布局
        const factoryBtn = document.getElementById('desktop-edit-factory-btn');
        factoryBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            _resetToDefaultLayout();
        });
        factoryBtn.addEventListener('touchend', function(e) {
            e.preventDefault();
            e.stopPropagation();
            _resetToDefaultLayout();
        });
    }

    function _hideEditOverlay() {
        const overlay = document.getElementById('desktop-edit-overlay');
        if (overlay) overlay.style.display = 'none';
    }

    // ============================================================
    // Reset to Default Layout (还原到最原始布局)
    // ============================================================

    // 默认布局定义（与 index.html 中的硬编码位置一致）
    var DEFAULT_LAYOUT_PAGE1 = {
        'app-wechat':        { row: 1, col: 1, rowSpan: 1, colSpan: 1 },
        'app-couple':        { row: 1, col: 2, rowSpan: 1, colSpan: 1 },
        'app-live':          { row: 2, col: 1, rowSpan: 1, colSpan: 1 },
        'app-fooddelivery':  { row: 2, col: 2, rowSpan: 1, colSpan: 1 },
        'custom-widget':     { row: 1, col: 3, rowSpan: 2, colSpan: 2 },
        // [FIX-组件乱跑] 为 time-date 和 info-card 添加默认布局，防止恢复时 span 错乱
        'section-time-date': { row: 3, col: 1, rowSpan: 1, colSpan: 4 },
        'section-info-card': { row: 4, col: 1, rowSpan: 1, colSpan: 4 }
    };
    var DEFAULT_LAYOUT_PAGE2 = {
        'section-p2-photo':  { row: 1, col: 1, rowSpan: 1, colSpan: 4 },
        'section-p2-album':  { row: 2, col: 1, rowSpan: 2, colSpan: 4 },
        'app-map':           { row: 4, col: 1, rowSpan: 1, colSpan: 1 },
        'app-shop':          { row: 4, col: 2, rowSpan: 1, colSpan: 1 },
        'app-live':          { row: 4, col: 3, rowSpan: 1, colSpan: 1 },
        'app-fooddelivery':  { row: 4, col: 4, rowSpan: 1, colSpan: 1 },
        'app-forum':         { row: 5, col: 1, rowSpan: 1, colSpan: 1 },
        'app-study':         { row: 5, col: 2, rowSpan: 1, colSpan: 1 },
        'app-spirit':        { row: 5, col: 3, rowSpan: 1, colSpan: 1 },
        'app-placeholder':   { row: 5, col: 4, rowSpan: 1, colSpan: 1 },
        'app-mailbox':       { row: 6, col: 1, rowSpan: 1, colSpan: 1 },
        'app-games':         { row: 6, col: 2, rowSpan: 1, colSpan: 1 },
        'app-fanfic':        { row: 6, col: 3, rowSpan: 1, colSpan: 1 },
        'app-paopao':        { row: 6, col: 4, rowSpan: 1, colSpan: 1 }
    };

    // 还原到编辑前的状态（使用快照）
    function _restoreToSnapshot() {
        if (!_editSnapshot) {
            if (typeof toast === 'function') toast('没有可还原的快照');
            return;
        }

        // 从快照恢复
        _restoreFromSnapshot(_editSnapshot);

        // 退出编辑模式
        exitEditMode();

        if (typeof toast === 'function') toast('已还原到编辑前状态');
    }

    // 恢复到出厂默认布局
    function _resetToDefaultLayout() {
        if (!confirm('确定要恢复到默认布局吗？\n所有位置调整和隐藏的组件都将恢复为出厂状态。')) return;

        // 清除所有保存的位置、隐藏和span数据
        localStorage.removeItem(HIDDEN_KEY);
        localStorage.removeItem(POS_KEY);
        localStorage.removeItem(SPAN_KEY);

        // 恢复所有隐藏元素
        _getAllEditableElements().forEach(function(el) {
            el.style.display = '';
            el.removeAttribute('data-hidden');
            el.style.gridRow = '';
            el.style.gridColumn = '';
        });

        // 恢复 Page 1 的默认位置
        var p1Items = [..._getPage1AppItems(), ..._getPage1Widgets()];
        p1Items.forEach(function(el) {
            var key = _getElementKey(el);
            if (key && DEFAULT_LAYOUT_PAGE1[key]) {
                var def = DEFAULT_LAYOUT_PAGE1[key];
                _setGridPos(el, def.row, def.col, def.rowSpan, def.colSpan);
            }
        });

        // 恢复 Page 2 的默认位置
        var p2Items = _getPage2AllItems();
        p2Items.forEach(function(el) {
            var key = _getElementKey(el);
            if (key && DEFAULT_LAYOUT_PAGE2[key]) {
                var def = DEFAULT_LAYOUT_PAGE2[key];
                _setGridPos(el, def.row, def.col, def.rowSpan, def.colSpan);
            }
        });

        _saveCurrentLayout();
        exitEditMode();

        if (typeof toast === 'function') toast('已恢复默认布局');
    }

    // ============================================================
    // Long Press Detection
    // ============================================================
    function _cancelLongPress() {
        if (_longPressTimer) {
            clearTimeout(_longPressTimer);
            _longPressTimer = null;
        }
        // [FIX-编辑模式优化] 取消时清除视觉反馈
        document.querySelectorAll('#desktop-page-1 .app-item, #desktop-page-1 .custom-widget, #desktop-page-2 .app-item').forEach(function(el) {
            if (el._lpFeedbackTimer) { clearTimeout(el._lpFeedbackTimer); el._lpFeedbackTimer = null; }
            if (el.style.transform === 'scale(0.95)') el.style.transform = '';
        });
    }

    function _onTouchStart(e) {
        const inDesktop = e.target.closest('#desktop-page-1') || e.target.closest('#desktop-page-2');
        if (!inDesktop) return;
        if (e.target.isContentEditable) return;

        if (e.target.closest('.desktop-delete-badge')) return;
        if (e.target.closest('#desktop-edit-overlay')) return;
        if (e.target.closest('#desktop-recycle-tray')) return;

        const touch = e.touches[0];
        _lpStartX = touch.clientX;
        _lpStartY = touch.clientY;

        if (_editMode) {
            const draggable = _findDraggableTarget(e.target);
            if (draggable) {
                _initDrag(draggable, touch.clientX, touch.clientY);
            }
            return;
        }

        // [FIX-编辑模式优化] 200ms时给视觉反馈(缩放)，LONG_PRESS_DURATION时进入编辑
        var _lpTarget = _findDraggableTarget(e.target);
        if (_lpTarget) {
            _lpTarget._lpFeedbackTimer = setTimeout(function() {
                if (_lpTarget) _lpTarget.style.transform = 'scale(0.95)';
            }, 200);
        }
        _longPressTimer = setTimeout(function() {
            _longPressTimer = null;
            // 清除视觉反馈
            if (_lpTarget) {
                clearTimeout(_lpTarget._lpFeedbackTimer);
                _lpTarget.style.transform = '';
            }
            enterEditMode();
        }, LONG_PRESS_DURATION);
    }

    function _onTouchMove(e) {
        if (_editMode && _dragTarget) {
            const touch = e.touches[0];
            _handleDragMove(touch.clientX, touch.clientY);
            if (_dragStarted) {
                e.preventDefault();
            }
            return;
        }

        if (_longPressTimer) {
            const touch = e.touches[0];
            const dx = touch.clientX - _lpStartX;
            const dy = touch.clientY - _lpStartY;
            if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
                _cancelLongPress();
            }
        }
    }

    function _onTouchEnd(e) {
        _cancelLongPress();
        if (_editMode && _dragTarget) {
            const touch = e.changedTouches[0];
            _handleDragEnd(touch.clientX, touch.clientY);
        }
    }

    function _onTouchCancel() {
        _cancelLongPress();
        if (_editMode && _dragTarget) {
            _cleanupDrag();
        }
    }

    // Mouse equivalents
    function _onMouseDown(e) {
        const inDesktop = e.target.closest('#desktop-page-1') || e.target.closest('#desktop-page-2');
        if (!inDesktop) return;
        if (e.target.isContentEditable) return;
        if (e.target.closest('.desktop-delete-badge')) return;
        if (e.target.closest('#desktop-edit-overlay')) return;
        if (e.target.closest('#desktop-recycle-tray')) return;

        _lpStartX = e.clientX;
        _lpStartY = e.clientY;

        if (_editMode) {
            const draggable = _findDraggableTarget(e.target);
            if (draggable) {
                _initDrag(draggable, e.clientX, e.clientY);
                e.preventDefault();
            }
            return;
        }

        _longPressTimer = setTimeout(function() {
            _longPressTimer = null;
            enterEditMode();
        }, LONG_PRESS_DURATION);
    }

    function _onMouseMove(e) {
        if (_editMode && _dragTarget) {
            _handleDragMove(e.clientX, e.clientY);
            if (_dragStarted) e.preventDefault();
            return;
        }
        if (_longPressTimer) {
            const dx = e.clientX - _lpStartX;
            const dy = e.clientY - _lpStartY;
            if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
                _cancelLongPress();
            }
        }
    }

    function _onMouseUp(e) {
        _cancelLongPress();
        if (_editMode && _dragTarget) {
            _handleDragEnd(e.clientX, e.clientY);
        }
    }

    // ============================================================
    // Find the draggable target element
    // ============================================================
    function _findDraggableTarget(target) {
        if (target.closest('.desktop-delete-badge')) return null;
        if (target.closest('.grid-drop-placeholder')) return null;

        // Check for app-item
        const appItem = target.closest('.app-item');
        if (appItem && appItem.classList.contains('desktop-app-wobble')) {
            return appItem;
        }
        // Check for custom widget (page 1)
        const widget = target.closest('.custom-widget');
        if (widget && widget.classList.contains('desktop-app-wobble')) {
            return widget;
        }
        // Check for page 2 widgets (photo, music)
        const p2Widget = target.closest('.p2-photo-upload, .p2-music-widget');
        if (p2Widget && p2Widget.classList.contains('desktop-app-wobble')) {
            return p2Widget;
        }
        // Check for section widgets (time-date, info-card)
        const section = target.closest('[data-section], [data-p2-section]');
        if (section && section.classList.contains('desktop-app-wobble')) {
            return section;
        }
        return null;
    }

    // ============================================================
    // Determine which page a drag target is on
    // ============================================================
    function _getDragPage(element) {
        if (element.closest('#desktop-page-2') || element.closest('#desktop-page2-grid')) {
            return 2;
        }
        return 1;
    }

    // ============================================================
    // Drag & Drop - Grid-based system (both pages)
    // ============================================================
    function _initDrag(element, clientX, clientY) {
        _dragTarget = element;
        _dragStarted = false;
        _dragMoveStartX = clientX;
        _dragMoveStartY = clientY;
        _dragPage = _getDragPage(element);
        _dragOriginalPage = _dragPage;

        const rect = element.getBoundingClientRect();
        _dragOffsetX = clientX - rect.left;
        _dragOffsetY = clientY - rect.top;

        // Remember original grid position (with span)
        _dragOriginalGridPos = _parseGridPos(element);
        // 实时推挤：记录当前逻辑位置
        _dragCurrentGridPos = { row: _dragOriginalGridPos.row, col: _dragOriginalGridPos.col };
        _lastHoverCell = null;
    }

    function _startDragging(clientX, clientY) {
        if (!_dragTarget) return;
        _dragStarted = true;

        if (navigator.vibrate) navigator.vibrate(30);

        // [体验] 给所有同页 app 添加 transition，实现推挤动画
        _addGridTransitions(_dragPage);

        // Create clone for visual feedback
        _dragClone = _dragTarget.cloneNode(true);
        _dragClone.classList.add('desktop-drag-clone');
        _dragClone.classList.remove('desktop-app-wobble');

        // Remove delete badge from clone
        const badgeInClone = _dragClone.querySelector('.desktop-delete-badge');
        if (badgeInClone) badgeInClone.remove();

        const targetWidth = _dragTarget.offsetWidth;
        const targetHeight = _dragTarget.offsetHeight;

        _dragClone.style.cssText =
            'position:fixed;z-index:99999;pointer-events:none;' +
            'width:' + targetWidth + 'px;' +
            'height:' + targetHeight + 'px;' +
            'left:' + (clientX - _dragOffsetX) + 'px;' +
            'top:' + (clientY - _dragOffsetY) + 'px;' +
            'opacity:0.9;transform:scale(1.1);transition:transform 0.12s ease;' +
            'border-radius:16px;';
        document.body.appendChild(_dragClone);

        // Make original hidden (it's being represented by the clone)
        _dragTarget.style.opacity = '0';
        _dragTarget.style.transition = 'opacity 0.1s';

        // Stop wobble on dragged element
        _dragTarget.classList.remove('desktop-app-wobble');
        _dragTarget.classList.add('desktop-dragging');
    }

    // [体验-推挤动画] 给 grid 内的 app 添加 CSS transition
    function _addGridTransitions(page) {
        var gridId = (page === 2) ? 'desktop-page2-grid' : 'desktop-grid';
        var grid = document.getElementById(gridId);
        if (!grid) return;
        grid.querySelectorAll('.app-item').forEach(function(el) {
            if (el === _dragTarget) return;
            if (el.getAttribute('data-hidden') === 'true') return;
            el.style.transition = 'all 0.2s cubic-bezier(0.2, 0, 0, 1)';
        });
    }

    // [体验-推挤动画] 移除 grid transition
    function _removeGridTransitions() {
        document.querySelectorAll('.app-item').forEach(function(el) {
            el.style.transition = '';
        });
    }

    // [体验-推挤动画] 实时交换：拖拽经过其他单格 app 时立即交换位置
    function _liveSwapAtCell(clientX, clientY, page) {
        if (!_dragTarget || !_dragStarted) return;
        var dragPos = _dragOriginalGridPos;
        if (!dragPos) return;
        var isSingleCell = dragPos.rowSpan === 1 && dragPos.colSpan === 1;
        if (!isSingleCell) return; // 大组件不做实时推挤

        var cell = _screenToGridCell(clientX, clientY, page);
        if (!cell) return;

        // 避免重复触发同一格子
        if (_lastHoverCell && _lastHoverCell.row === cell.row && _lastHoverCell.col === cell.col) return;
        _lastHoverCell = { row: cell.row, col: cell.col };

        // 如果悬停在自己当前的逻辑位置，不做任何事
        if (_dragCurrentGridPos && cell.row === _dragCurrentGridPos.row && cell.col === _dragCurrentGridPos.col) return;

        var maxRows = (page === 2) ? GRID_ROWS_PAGE2 : GRID_ROWS_PAGE1;
        var maxCols = (page === 2) ? GRID_COLS_PAGE2 : GRID_COLS;
        if (cell.row < 1 || cell.row > maxRows || cell.col < 1 || cell.col > maxCols) return;

        // 找到目标格子上的元素
        var elAtCell = _findElementAtCell(cell.row, cell.col, page, _dragTarget);
        if (elAtCell) {
            var targetPos = _parseGridPos(elAtCell);
            if (targetPos.rowSpan === 1 && targetPos.colSpan === 1) {
                // 单格 app：实时交换位置
                _setGridPos(elAtCell, _dragCurrentGridPos.row, _dragCurrentGridPos.col, 1, 1);
                _setGridPos(_dragTarget, cell.row, cell.col, 1, 1);
                _dragCurrentGridPos = { row: cell.row, col: cell.col };

                // 触觉反馈
                if (navigator.vibrate) navigator.vibrate(15);
            }
            // 大组件不交换，保持原位
        } else {
            // 空格子：直接移过去
            _setGridPos(_dragTarget, cell.row, cell.col, 1, 1);
            _dragCurrentGridPos = { row: cell.row, col: cell.col };
        }
    }

    function _handleDragMove(clientX, clientY) {
        if (!_dragTarget) return;

        if (!_dragStarted) {
            const dx = clientX - _dragMoveStartX;
            const dy = clientY - _dragMoveStartY;
            if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
                _startDragging(clientX, clientY);
            }
            return;
        }

        if (_dragClone) {
            _dragClone.style.left = (clientX - _dragOffsetX) + 'px';
            _dragClone.style.top = (clientY - _dragOffsetY) + 'px';
        }

        // 跨页拖动检测：拖到屏幕左右边缘时切换页面
        _checkCrossPageDrag(clientX, clientY);

        // [体验-推挤] 实时交换位置（同页单格 app）
        if (_dragPage === _dragOriginalPage) {
            _liveSwapAtCell(clientX, clientY, _dragPage);
        }

        // Highlight drop target for current page
        _highlightGridDropTarget(clientX, clientY, _dragPage);
    }

    // ============================================================
    // 跨页拖动：检测边缘并切换页面
    // ============================================================
    function _checkCrossPageDrag(clientX, clientY) {
        const device = document.getElementById('device');
        if (!device) return;
        const deviceRect = device.getBoundingClientRect();
        const edgeThreshold = 40; // 距离边缘40px触发

        const nearRightEdge = clientX > deviceRect.right - edgeThreshold;
        const nearLeftEdge = clientX < deviceRect.left + edgeThreshold;

        if (nearRightEdge && _dragPage === 1 && !_crossPageTriggered) {
            // 从第1页拖到右边缘 -> 切换到第2页
            if (!_crossPageTimer) {
                _crossPageTimer = setTimeout(function() {
                    _switchPageDuringDrag(2);
                }, 250); // [体验] 加速跨页切换 400→250ms
            }
        } else if (nearLeftEdge && _dragPage === 2 && !_crossPageTriggered) {
            // 从第2页拖到左边缘 -> 切换到第1页
            if (!_crossPageTimer) {
                _crossPageTimer = setTimeout(function() {
                    _switchPageDuringDrag(1);
                }, 250); // [体验] 加速跨页切换 400→250ms
            }
        } else {
            // 不在边缘，清除计时器
            if (_crossPageTimer) {
                clearTimeout(_crossPageTimer);
                _crossPageTimer = null;
            }
        }
    }

    function _switchPageDuringDrag(targetPage) {
        _crossPageTimer = null;
        _crossPageTriggered = true;

        if (navigator.vibrate) navigator.vibrate(30);

        // 切换桌面页面
        var wrapper = document.getElementById('desktop-swipe-wrapper');
        if (wrapper) {
            if (typeof desktopCurrentPage !== 'undefined') {
                window.desktopCurrentPage = (targetPage === 2) ? 1 : 0;
            }
            wrapper.style.transition = 'transform 0.3s ease';
            wrapper.style.transform = 'translate3d(-' + ((targetPage === 2) ? 50 : 0) + '%, 0, 0)';
            // 更新页面指示点
            document.querySelectorAll('.desktop-dot').forEach(function(d, i) {
                d.classList.toggle('active', i === ((targetPage === 2) ? 1 : 0));
            });
        }

        // 更新拖拽页面
        _dragPage = targetPage;

        // 刷新目标页的 placeholder
        _updateGridPlaceholders();

        // 短暂延迟后允许再次触发（防止来回抖动）
        setTimeout(function() {
            _crossPageTriggered = false;
        }, 500); // [体验] 加速跨页防抖 800→500ms
    }

    // 将元素从一个页面的 grid 移动到另一个页面的 grid
    function _moveElementToPage(el, fromPage, toPage, row, col) {
        var fromGridId = (fromPage === 2) ? 'desktop-page2-grid' : 'desktop-grid';
        var toGridId = (toPage === 2) ? 'desktop-page2-grid' : 'desktop-grid';
        var fromGrid = document.getElementById(fromGridId);
        var toGrid = document.getElementById(toGridId);
        if (!fromGrid || !toGrid) return false;

        // 只允许单格 app 跨页移动（大组件不允许跨页）
        var pos = _parseGridPos(el);
        if (pos.rowSpan > 1 || pos.colSpan > 1) {
            if (typeof toast === 'function') toast('大组件不支持跨页移动');
            return false;
        }

        // 从原 grid 移除，添加到目标 grid
        if (el.parentNode) {
            el.parentNode.removeChild(el);
        }
        toGrid.appendChild(el);

        // 设置新位置
        _setGridPos(el, row, col, 1, 1);

        return true;
    }

    function _handleDragEnd(clientX, clientY) {
        if (!_dragTarget) return;

        // 清除跨页计时器
        if (_crossPageTimer) {
            clearTimeout(_crossPageTimer);
            _crossPageTimer = null;
        }

        if (_dragStarted) {
            var dragPos = _dragOriginalGridPos;
            var isSingleCell = dragPos && dragPos.rowSpan === 1 && dragPos.colSpan === 1;
            var isCrossPage = (_dragPage !== _dragOriginalPage);

            if (isSingleCell && !isCrossPage) {
                // [体验-推挤] 同页单格 app 已经在拖拽过程中实时交换了，直接保存
                _saveCurrentLayout();
                _updateGridPlaceholders();
            } else {
                // 跨页或大组件：使用原来的 drop 逻辑
                _dropAtGridPosition(clientX, clientY, _dragPage);
            }
        }

        _cleanupDrag();
    }

    function _cleanupDrag() {
        // [体验] 移除推挤动画 transitions
        _removeGridTransitions();

        if (_dragClone && _dragClone.parentNode) {
            _dragClone.remove();
        }
        if (_dragTarget) {
            _dragTarget.style.opacity = '';
            _dragTarget.style.transition = '';
            _dragTarget.classList.remove('desktop-dragging');
            if (_editMode) {
                _dragTarget.classList.add('desktop-app-wobble');
            }
        }
        _dragTarget = null;
        _dragClone = null;
        _dragStarted = false;
        _dragOriginalGridPos = null;
        _dragCurrentGridPos = null;
        _lastHoverCell = null;
        _dragPage = 1;
        _dragOriginalPage = 1;
        _crossPageTriggered = false;
        if (_crossPageTimer) {
            clearTimeout(_crossPageTimer);
            _crossPageTimer = null;
        }

        _hideDropZones();
    }

    // ============================================================
    // Grid-based Drop Target Detection (Both Pages)
    // ============================================================

    // Convert screen coordinates to grid cell
    function _screenToGridCell(clientX, clientY, page) {
        const gridId = (page === 2) ? 'desktop-page2-grid' : 'desktop-grid';
        const grid = document.getElementById(gridId);
        if (!grid) return null;

        const gridRect = grid.getBoundingClientRect();
        const gridStyles = window.getComputedStyle(grid);
        const maxCols = (page === 2) ? GRID_COLS_PAGE2 : GRID_COLS;
        const maxRows = (page === 2) ? GRID_ROWS_PAGE2 : GRID_ROWS_PAGE1;

        const paddingLeft = parseFloat(gridStyles.paddingLeft) || 25;
        const paddingTop = parseFloat(gridStyles.paddingTop) || 25;
        const gap = parseFloat(gridStyles.columnGap) || 15;
        const rowGap = parseFloat(gridStyles.rowGap) || 18;

        // Calculate usable grid area
        const usableWidth = gridRect.width - paddingLeft * 2;
        const cellWidth = (usableWidth - gap * (maxCols - 1)) / maxCols;

        const relX = clientX - gridRect.left - paddingLeft;
        const relY = clientY - gridRect.top - paddingTop;

        // Calculate column from X position
        let col = -1;
        for (let c = 0; c < maxCols; c++) {
            const cellStart = c * (cellWidth + gap);
            const cellEnd = cellStart + cellWidth;
            if (relX >= cellStart - gap/2 && relX <= cellEnd + gap/2) {
                col = c + 1;
                break;
            }
        }

        if (col === -1) {
            if (relX < 0) col = 1;
            else col = maxCols;
        }

        // Calculate row from Y position
        const rowPositions = _getGridRowPositions(grid, gridRect, page);
        let row = -1;
        for (let r = 0; r < rowPositions.length; r++) {
            const rowTop = rowPositions[r].top;
            const rowBottom = rowPositions[r].bottom;
            if (relY >= rowTop - rowGap/2 && relY <= rowBottom + rowGap/2) {
                row = r + 1;
                break;
            }
        }

        if (row === -1) {
            if (relY < 0) {
                row = 1;
            } else {
                if (rowPositions.length > 0) {
                    const avgRowHeight = rowPositions[0].bottom - rowPositions[0].top;
                    row = Math.floor(relY / (avgRowHeight + rowGap)) + 1;
                } else {
                    row = 1;
                }
            }
        }

        if (row < 1) row = 1;
        if (row > maxRows) row = maxRows;

        return { row, col };
    }

    // Get the top/bottom positions of each grid row
    function _getGridRowPositions(grid, gridRect, page) {
        const gridStyles = window.getComputedStyle(grid);
        const paddingTop = parseFloat(gridStyles.paddingTop) || 25;
        const rowGap = parseFloat(gridStyles.rowGap) || 18;
        const maxRows = (page === 2) ? GRID_ROWS_PAGE2 : GRID_ROWS_PAGE1;

        // Collect all grid items and their row positions
        const items = grid.querySelectorAll('.app-item:not([data-hidden="true"]), .custom-widget:not([data-hidden="true"]), .p2-photo-upload:not([data-hidden="true"]), .p2-music-widget:not([data-hidden="true"]), .grid-drop-placeholder');
        const rowMap = {};

        items.forEach(item => {
            if (item.style.display === 'none') return;
            const gridRow = item.style.gridRow || '';
            // Parse the start row
            const spanMatch = gridRow.match(/(\d+)\s*\/\s*span\s*(\d+)/);
            let startRow, endRow;
            if (spanMatch) {
                startRow = parseInt(spanMatch[1]);
                endRow = startRow; // We only want the first row's position
            } else {
                startRow = parseInt(gridRow) || 0;
                endRow = startRow;
            }
            if (startRow <= 0) return;

            const itemRect = item.getBoundingClientRect();
            if (itemRect.width === 0 && itemRect.height === 0) return;
            const relTop = itemRect.top - gridRect.top - paddingTop;
            const relBottom = itemRect.bottom - gridRect.top - paddingTop;

            // For multi-row items, distribute height across rows
            if (spanMatch) {
                const span = parseInt(spanMatch[2]);
                const rowHeight = (relBottom - relTop) / span;
                for (let r = startRow; r < startRow + span; r++) {
                    const rTop = relTop + (r - startRow) * rowHeight;
                    const rBottom = rTop + rowHeight;
                    if (!rowMap[r]) {
                        rowMap[r] = { top: rTop, bottom: rBottom };
                    } else {
                        rowMap[r].top = Math.min(rowMap[r].top, rTop);
                        rowMap[r].bottom = Math.max(rowMap[r].bottom, rBottom);
                    }
                }
            } else {
                if (!rowMap[startRow]) {
                    rowMap[startRow] = { top: relTop, bottom: relBottom };
                } else {
                    rowMap[startRow].top = Math.min(rowMap[startRow].top, relTop);
                    rowMap[startRow].bottom = Math.max(rowMap[startRow].bottom, relBottom);
                }
            }
        });

        const positions = [];
        for (let r = 1; r <= maxRows; r++) {
            if (rowMap[r]) {
                positions.push(rowMap[r]);
            } else {
                const prevRow = positions.length > 0 ? positions[positions.length - 1] : null;
                if (prevRow) {
                    const height = prevRow.bottom - prevRow.top;
                    const top = prevRow.bottom + rowGap;
                    positions.push({ top: top, bottom: top + height });
                } else {
                    positions.push({ top: 0, bottom: 70 });
                }
            }
        }

        return positions;
    }

    function _highlightGridDropTarget(clientX, clientY, page) {
        document.querySelectorAll('.desktop-drop-highlight').forEach(el => {
            el.classList.remove('desktop-drop-highlight');
            el.classList.remove('desktop-drop-blocked');
        });
        document.querySelectorAll('.grid-drop-placeholder-active').forEach(el => {
            el.classList.remove('grid-drop-placeholder-active');
            el.classList.remove('grid-drop-placeholder-blocked');
        });

        const cell = _screenToGridCell(clientX, clientY, page);
        if (!cell) return;

        const dragPos = _dragOriginalGridPos;
        if (!dragPos) return;

        const isSingleCell = dragPos.rowSpan === 1 && dragPos.colSpan === 1;
        const maxRows = (page === 2) ? GRID_ROWS_PAGE2 : GRID_ROWS_PAGE1;
        const maxCols = (page === 2) ? GRID_COLS_PAGE2 : GRID_COLS;

        if (isSingleCell) {
            // For single-cell apps, check if target cell has another element
            const elAtCell = _findElementAtCell(cell.row, cell.col, page, _dragTarget);
            if (elAtCell) {
                const targetPos = _parseGridPos(elAtCell);
                if (targetPos.rowSpan === 1 && targetPos.colSpan === 1) {
                    // Can swap - show green highlight
                    elAtCell.classList.add('desktop-drop-highlight');
                } else {
                    // Can't swap with multi-cell widget - show red highlight
                    elAtCell.classList.add('desktop-drop-highlight');
                    elAtCell.classList.add('desktop-drop-blocked');
                }
            } else {
                const gridId = (page === 2) ? 'desktop-page2-grid' : 'desktop-grid';
                const gridEl = document.getElementById(gridId);
                if (gridEl) {
                    const placeholder = gridEl.querySelector(
                        '.grid-drop-placeholder[data-grid-row="' + cell.row + '"][data-grid-col="' + cell.col + '"]'
                    );
                    if (placeholder) {
                        placeholder.classList.add('grid-drop-placeholder-active');
                    }
                }
            }
        } else {
            // Multi-cell widget: check if entire region fits
            const fits = cell.row + dragPos.rowSpan - 1 <= maxRows &&
                         cell.col + dragPos.colSpan - 1 <= maxCols;
            const available = fits && _isRegionAvailable(cell.row, cell.col, dragPos.rowSpan, dragPos.colSpan, page, _dragTarget);

            const gridId = (page === 2) ? 'desktop-page2-grid' : 'desktop-grid';
            const gridEl = document.getElementById(gridId);
            if (gridEl) {
                // Highlight all cells that the widget would occupy
                for (let r = cell.row; r < cell.row + dragPos.rowSpan && r <= maxRows; r++) {
                    for (let c = cell.col; c < cell.col + dragPos.colSpan && c <= maxCols; c++) {
                        const placeholder = gridEl.querySelector(
                            '.grid-drop-placeholder[data-grid-row="' + r + '"][data-grid-col="' + c + '"]'
                        );
                        if (placeholder) {
                            placeholder.classList.add('grid-drop-placeholder-active');
                            if (!available) {
                                placeholder.classList.add('grid-drop-placeholder-blocked');
                            }
                        }
                        // Also highlight any occupied elements to show collision
                        const elAtPos = _findElementAtCell(r, c, page, _dragTarget);
                        if (elAtPos) {
                            elAtPos.classList.add('desktop-drop-highlight');
                            if (!available) {
                                elAtPos.classList.add('desktop-drop-blocked');
                            }
                        }
                    }
                }
            }
        }
    }

    function _dropAtGridPosition(clientX, clientY, page) {
        const cell = _screenToGridCell(clientX, clientY, page);
        if (!cell) return;

        const dragPos = _dragOriginalGridPos;
        if (!dragPos || dragPos.row <= 0 || dragPos.col <= 0) return;

        const maxRows = (page === 2) ? GRID_ROWS_PAGE2 : GRID_ROWS_PAGE1;
        const maxCols = (page === 2) ? GRID_COLS_PAGE2 : GRID_COLS;
        const isCrossPage = (page !== _dragOriginalPage);

        // Check if the dragged element is a single-cell item (app)
        const isSingleCell = dragPos.rowSpan === 1 && dragPos.colSpan === 1;

        // Check if dropping at the same position on the same page
        if (!isCrossPage && cell.row === dragPos.row && cell.col === dragPos.col) {
            return;
        }

        // Validate target cell is within grid bounds
        if (cell.row < 1 || cell.row > maxRows || cell.col < 1 || cell.col > maxCols) {
            if (typeof toast === 'function') toast('超出网格范围');
            _setGridPos(_dragTarget, dragPos.row, dragPos.col, dragPos.rowSpan, dragPos.colSpan);
            return;
        }

        let moved = false;

        if (isCrossPage && isSingleCell) {
            // === 跨页移动（仅单格app） ===
            const elAtCell = _findElementAtCell(cell.row, cell.col, page, _dragTarget);
            if (elAtCell) {
                const targetPos = _parseGridPos(elAtCell);
                if (targetPos.rowSpan === 1 && targetPos.colSpan === 1) {
                    // 跨页交换：把目标元素移到原页面的原位置
                    _moveElementToPage(elAtCell, page, _dragOriginalPage, dragPos.row, dragPos.col);
                    _moveElementToPage(_dragTarget, _dragOriginalPage, page, cell.row, cell.col);
                    moved = true;
                    // 给交换过来的元素添加编辑模式装饰
                    elAtCell.classList.add('desktop-app-wobble');
                    var computedPos = window.getComputedStyle(elAtCell).position;
                    if (computedPos === 'static') elAtCell.style.position = 'relative';
                    _addDeleteBadge(elAtCell);
                    if (typeof toast === 'function') toast('跨页交换成功');
                } else {
                    _setGridPos(_dragTarget, dragPos.row, dragPos.col, 1, 1);
                    if (typeof toast === 'function') toast('该位置被大组件占用，无法放置');
                }
            } else {
                // 目标格子为空，直接跨页移动
                if (_moveElementToPage(_dragTarget, _dragOriginalPage, page, cell.row, cell.col)) {
                    moved = true;
                    if (typeof toast === 'function') toast('已移动到另一页');
                }
            }
        } else if (isSingleCell) {
            // === 同页移动（单格app） ===
            const elAtCell = _findElementAtCell(cell.row, cell.col, page, _dragTarget);
            if (elAtCell) {
                const targetPos = _parseGridPos(elAtCell);
                if (targetPos.rowSpan === 1 && targetPos.colSpan === 1) {
                    _setGridPos(elAtCell, dragPos.row, dragPos.col, 1, 1);
                    _setGridPos(_dragTarget, cell.row, cell.col, 1, 1);
                    moved = true;
                    if (typeof toast === 'function') toast('位置已交换');
                } else {
                    _setGridPos(_dragTarget, dragPos.row, dragPos.col, 1, 1);
                    if (typeof toast === 'function') toast('该位置被大组件占用，无法放置');
                }
            } else {
                _setGridPos(_dragTarget, cell.row, cell.col, 1, 1);
                moved = true;
            }
        } else {
            // === 大组件移动（不支持跨页） ===
            if (isCrossPage) {
                _setGridPos(_dragTarget, dragPos.row, dragPos.col, dragPos.rowSpan, dragPos.colSpan);
                if (typeof toast === 'function') toast('大组件不支持跨页移动');
                // 切回原页面
                _switchPageDuringDrag(_dragOriginalPage);
                return;
            }

            const newRow = cell.row;
            const newCol = cell.col;

            if (newRow + dragPos.rowSpan - 1 > maxRows || newCol + dragPos.colSpan - 1 > maxCols) {
                _setGridPos(_dragTarget, dragPos.row, dragPos.col, dragPos.rowSpan, dragPos.colSpan);
                if (typeof toast === 'function') toast('空间不足，组件放不下');
                return;
            }

            if (_isRegionAvailable(newRow, newCol, dragPos.rowSpan, dragPos.colSpan, page, _dragTarget)) {
                _setGridPos(_dragTarget, newRow, newCol, dragPos.rowSpan, dragPos.colSpan);
                moved = true;
            } else {
                _setGridPos(_dragTarget, dragPos.row, dragPos.col, dragPos.rowSpan, dragPos.colSpan);
                if (typeof toast === 'function') toast('该位置已被占用，无法放置');
            }
        }

        if (moved) {
            _saveCurrentLayout();
        }
        _updateGridPlaceholders();
    }

    // ============================================================
    // Drop Zone Helpers
    // ============================================================
    function _hideDropZones() {
        document.querySelectorAll('.desktop-drop-highlight').forEach(el => {
            el.classList.remove('desktop-drop-highlight');
            el.classList.remove('desktop-drop-blocked');
        });
        document.querySelectorAll('.grid-drop-placeholder-active').forEach(el => {
            el.classList.remove('grid-drop-placeholder-active');
            el.classList.remove('grid-drop-placeholder-blocked');
        });
    }

    // ============================================================
    // Layout Save/Restore
    // ============================================================
    function _saveCurrentLayout() {
        const layout = {};

        // Save page 1 grid
        const grid1 = document.getElementById('desktop-grid');
        if (grid1) {
            layout['page1'] = [];
            // [FIX-保存遗漏] 保存所有可编辑元素，包括 time-date、info-card 等 widget
            const items = grid1.querySelectorAll('.app-item, .custom-widget, .desktop-time-date-area, .user-info-card');
            items.forEach(item => {
                const key = _getElementKey(item);
                if (key) {
                    layout['page1'].push({
                        key: key,
                        gridRow: item.style.gridRow || '',
                        gridColumn: item.style.gridColumn || ''
                    });
                }
            });
        }

        // Save page 2 grid
        const grid2 = document.getElementById('desktop-page2-grid');
        if (grid2) {
            layout['page2'] = [];
            const items = grid2.querySelectorAll('.app-item, .p2-photo-upload, .p2-music-widget');
            items.forEach(item => {
                const key = _getElementKey(item);
                if (key) {
                    layout['page2'].push({
                        key: key,
                        gridRow: item.style.gridRow || '',
                        gridColumn: item.style.gridColumn || ''
                    });
                }
            });
        }

        localStorage.setItem(POS_KEY, JSON.stringify(layout));
    }

    function _restoreLayout() {
        let layout;
        try {
            layout = JSON.parse(localStorage.getItem(POS_KEY) || '{}');
        } catch(e) { layout = {}; }
        if (!layout || Object.keys(layout).length === 0) return;

        // Restore page 1
        if (layout['page1']) {
            const grid = document.getElementById('desktop-grid');
            if (grid) {
                const savedOrder = layout['page1'];
                // [FIX-恢复遗漏] 恢复所有可编辑元素，包括 time-date、info-card 等 widget
                const items = [...grid.querySelectorAll('.app-item, .custom-widget, .desktop-time-date-area, .user-info-card')];
                const itemMap = {};
                items.forEach(item => {
                    const key = _getElementKey(item);
                    if (key) itemMap[key] = item;
                });

                // [FIX-图标错位] 先应用保存的位置
                savedOrder.forEach(saved => {
                    if (itemMap[saved.key]) {
                        const item = itemMap[saved.key];
                        if (saved.gridRow) item.style.gridRow = saved.gridRow;
                        if (saved.gridColumn) item.style.gridColumn = saved.gridColumn;
                    }
                });

                // [FIX-图标错位] 检测并修复第一页 app-item 位置冲突
                // 只检测单格app-item（不检测widget），如果两个app占了同一个格子就恢复默认位置
                _fixPage1Conflicts(grid);
            }
        }

        // Restore page 2
        if (layout['page2']) {
            const grid = document.getElementById('desktop-page2-grid');
            if (grid) {
                const savedOrder = layout['page2'];
                const items = [...grid.querySelectorAll('.app-item, .p2-photo-upload, .p2-music-widget')];
                const itemMap = {};
                items.forEach(item => {
                    const key = _getElementKey(item);
                    if (key) itemMap[key] = item;
                });

                // [FIX-数据迁移] 过滤掉已删除组件的旧数据
                savedOrder.forEach(saved => {
                    // 跳过已不存在的组件（如 section-p2-square）
                    if (saved.key === 'section-p2-square') return;
                    if (itemMap[saved.key]) {
                        const item = itemMap[saved.key];
                        if (saved.gridRow) item.style.gridRow = saved.gridRow;
                        if (saved.gridColumn) item.style.gridColumn = saved.gridColumn;
                    }
                });

                // [FIX-第二页冲突] 检测并修复第二页位置冲突
                _fixPage2Conflicts(grid);
            }
        }

        // Also try legacy format 'grid' key for page 1 backward compat
        if (layout['grid'] && !layout['page1']) {
            const grid = document.getElementById('desktop-grid');
            if (grid) {
                const savedOrder = layout['grid'];
                const items = [...grid.querySelectorAll('.app-item')];
                const itemMap = {};
                items.forEach(item => {
                    const key = _getElementKey(item);
                    if (key) itemMap[key] = item;
                });
                savedOrder.forEach(saved => {
                    if (itemMap[saved.key]) {
                        const item = itemMap[saved.key];
                        if (saved.gridRow) item.style.gridRow = saved.gridRow;
                        if (saved.gridColumn) item.style.gridColumn = saved.gridColumn;
                    }
                });
            }
        }
    }

    // ============================================================
    // [FIX-图标错位] Page 1 位置冲突检测与修复
    // 检测第一页的 app-item 是否有位置冲突（两个图标在同一个grid格子），
    // 如果有冲突则恢复所有第一页图标到默认位置
    // ============================================================
    function _fixPage1Conflicts(grid) {
        if (!grid) grid = document.getElementById('desktop-grid');
        if (!grid) return;

        const appItems = [...grid.querySelectorAll('.app-item')];
        if (appItems.length === 0) return;

        // [FIX-叠加] 收集 widget 占用的格子，用于检测 app 是否与 widget 冲突
        const widgetOccupied = new Set();
        const widgets = grid.querySelectorAll('.custom-widget, .desktop-time-date-area, .user-info-card');
        widgets.forEach(function(w) {
            if (w.style.display === 'none' || w.getAttribute('data-hidden') === 'true') return;
            const wPos = _parseGridPos(w);
            if (wPos.row > 0 && wPos.col > 0) {
                for (let r = wPos.row; r < wPos.row + wPos.rowSpan; r++) {
                    for (let c = wPos.col; c < wPos.col + wPos.colSpan; c++) {
                        widgetOccupied.add(r + '-' + c);
                    }
                }
            }
        });

        // 收集每个 app-item 的 grid 位置
        const positions = [];
        const positionMap = {}; // 'row-col' -> [elements]
        let hasConflict = false;

        appItems.forEach(function(item) {
            const style = item.style;
            let row = parseInt(style.gridRow) || parseInt(style.gridRowStart) || 0;
            let col = parseInt(style.gridColumn) || parseInt(style.gridColumnStart) || 0;
            
            // 如果没有 inline style 中的位置，尝试从 style 属性的完整值解析
            if (!row) {
                const gridRowVal = style.gridRow || '';
                const rowMatch = gridRowVal.match(/^(\d+)/);
                if (rowMatch) row = parseInt(rowMatch[1]);
            }
            if (!col) {
                const gridColVal = style.gridColumn || '';
                const colMatch = gridColVal.match(/^(\d+)/);
                if (colMatch) col = parseInt(colMatch[1]);
            }

            if (row > 0 && col > 0) {
                const posKey = row + '-' + col;
                if (!positionMap[posKey]) positionMap[posKey] = [];
                positionMap[posKey].push(item);
                if (positionMap[posKey].length > 1) {
                    hasConflict = true;
                }
                // [FIX-叠加] 检测 app 是否与 widget 占用的格子冲突
                if (widgetOccupied.has(posKey)) {
                    hasConflict = true;
                }
            }
            positions.push({ item: item, row: row, col: col });
        });

        if (hasConflict) {
            console.warn('[FIX-图标错位] 检测到第一页图标位置冲突，恢复到默认位置');
            // 收集已分配的格子，用于给无默认布局的 app 分配空位
            var assignedCells = new Set();
            // 先恢复有默认布局的图标
            appItems.forEach(function(item) {
                var key = _getElementKey(item);
                if (key && DEFAULT_LAYOUT_PAGE1[key]) {
                    var def = DEFAULT_LAYOUT_PAGE1[key];
                    _setGridPos(item, def.row, def.col, def.rowSpan, def.colSpan);
                    for (var r = def.row; r < def.row + def.rowSpan; r++) {
                        for (var c = def.col; c < def.col + def.colSpan; c++) {
                            assignedCells.add(r + '-' + c);
                        }
                    }
                }
            });
            // 同时恢复widget的位置
            var widget = grid.querySelector('.custom-widget');
            if (widget && DEFAULT_LAYOUT_PAGE1['custom-widget']) {
                var wDef = DEFAULT_LAYOUT_PAGE1['custom-widget'];
                _setGridPos(widget, wDef.row, wDef.col, wDef.rowSpan, wDef.colSpan);
                for (var wr = wDef.row; wr < wDef.row + wDef.rowSpan; wr++) {
                    for (var wc = wDef.col; wc < wDef.col + wDef.colSpan; wc++) {
                        assignedCells.add(wr + '-' + wc);
                    }
                }
            }
            // 把 widget 占用的格子也标记
            widgetOccupied.forEach(function(k) { assignedCells.add(k); });
            // 再给没有默认布局的 app（如跨页移入的）分配空位
            appItems.forEach(function(item) {
                var key = _getElementKey(item);
                if (key && !DEFAULT_LAYOUT_PAGE1[key]) {
                    // 找一个空格子
                    var placed = false;
                    for (var r = 1; r <= GRID_ROWS_PAGE1 && !placed; r++) {
                        for (var c = 1; c <= GRID_COLS && !placed; c++) {
                            if (!assignedCells.has(r + '-' + c)) {
                                _setGridPos(item, r, c, 1, 1);
                                assignedCells.add(r + '-' + c);
                                placed = true;
                            }
                        }
                    }
                    if (!placed) {
                        // 实在放不下，隐藏该 app
                        item.style.gridRow = '';
                        item.style.gridColumn = '';
                    }
                }
            });
            // 保存修复后的布局
            _saveCurrentLayout();
        }
    }

    // ============================================================
    // [FIX-第二页冲突] Page 2 位置冲突检测与修复
    // 类似 _fixPage1Conflicts，检测第二页的元素位置冲突
    // ============================================================
    function _fixPage2Conflicts(grid) {
        if (!grid) grid = document.getElementById('desktop-page2-grid');
        if (!grid) return;

        var allItems = [...grid.querySelectorAll('.app-item, .p2-photo-upload, .p2-music-widget')];
        if (allItems.length === 0) return;

        // 收集 widget 占用的格子
        var widgetOccupied = new Set();
        var widgets = grid.querySelectorAll('.p2-photo-upload, .p2-music-widget');
        widgets.forEach(function(w) {
            if (w.style.display === 'none' || w.getAttribute('data-hidden') === 'true') return;
            var wPos = _parseGridPos(w);
            if (wPos.row > 0 && wPos.col > 0) {
                for (var r = wPos.row; r < wPos.row + wPos.rowSpan; r++) {
                    for (var c = wPos.col; c < wPos.col + wPos.colSpan; c++) {
                        widgetOccupied.add(r + '-' + c);
                    }
                }
            }
        });

        // 收集 app-item 位置，检测冲突
        var appItems = [...grid.querySelectorAll('.app-item')];
        var positionMap = {};
        var hasConflict = false;

        appItems.forEach(function(item) {
            if (item.style.display === 'none' || item.getAttribute('data-hidden') === 'true') return;
            var row = parseInt(item.style.gridRow) || 0;
            var col = parseInt(item.style.gridColumn) || 0;
            if (!row) {
                var gridRowVal = item.style.gridRow || '';
                var rowMatch = gridRowVal.match(/^(\d+)/);
                if (rowMatch) row = parseInt(rowMatch[1]);
            }
            if (!col) {
                var gridColVal = item.style.gridColumn || '';
                var colMatch = gridColVal.match(/^(\d+)/);
                if (colMatch) col = parseInt(colMatch[1]);
            }

            if (row > 0 && col > 0) {
                var posKey = row + '-' + col;
                if (!positionMap[posKey]) positionMap[posKey] = [];
                positionMap[posKey].push(item);
                if (positionMap[posKey].length > 1) hasConflict = true;
                if (widgetOccupied.has(posKey)) hasConflict = true;
            } else {
                // 没有位置的 app 也算冲突（需要分配）
                hasConflict = true;
            }
        });

        if (hasConflict) {
            console.warn('[FIX-第二页冲突] 检测到第二页位置冲突，恢复到默认位置');
            var assignedCells = new Set();

            // 先标记 widget 占用的格子
            widgetOccupied.forEach(function(k) { assignedCells.add(k); });

            // 恢复有默认布局的 widget
            widgets.forEach(function(w) {
                var key = _getElementKey(w);
                if (key && DEFAULT_LAYOUT_PAGE2[key]) {
                    var def = DEFAULT_LAYOUT_PAGE2[key];
                    _setGridPos(w, def.row, def.col, def.rowSpan, def.colSpan);
                    for (var r = def.row; r < def.row + def.rowSpan; r++) {
                        for (var c = def.col; c < def.col + def.colSpan; c++) {
                            assignedCells.add(r + '-' + c);
                        }
                    }
                }
            });

            // 恢复有默认布局的 app
            appItems.forEach(function(item) {
                if (item.style.display === 'none' || item.getAttribute('data-hidden') === 'true') return;
                var key = _getElementKey(item);
                if (key && DEFAULT_LAYOUT_PAGE2[key]) {
                    var def = DEFAULT_LAYOUT_PAGE2[key];
                    _setGridPos(item, def.row, def.col, def.rowSpan, def.colSpan);
                    assignedCells.add(def.row + '-' + def.col);
                }
            });

            // 给没有默认布局的 app 分配空位
            appItems.forEach(function(item) {
                if (item.style.display === 'none' || item.getAttribute('data-hidden') === 'true') return;
                var key = _getElementKey(item);
                if (key && !DEFAULT_LAYOUT_PAGE2[key]) {
                    var placed = false;
                    for (var r = 1; r <= GRID_ROWS_PAGE2 && !placed; r++) {
                        for (var c = 1; c <= GRID_COLS_PAGE2 && !placed; c++) {
                            if (!assignedCells.has(r + '-' + c)) {
                                _setGridPos(item, r, c, 1, 1);
                                assignedCells.add(r + '-' + c);
                                placed = true;
                            }
                        }
                    }
                    if (!placed) {
                        item.style.gridRow = '';
                        item.style.gridColumn = '';
                    }
                }
            });

            _saveCurrentLayout();
        }
    }

    // 在页面加载后也额外检测一次（确保 renderDesktop 之后没有遗漏）
    // 延迟500ms确保所有初始化都完成
    setTimeout(function() {
        _fixPage1Conflicts(null);
        _fixPage2Conflicts(null);
    }, 500);

    // ============================================================
    // Prevent clicks in edit mode
    // ============================================================
    function _setupClickBlocker() {
        const swipeContainer = document.getElementById('desktop-swipe-container');
        if (!swipeContainer) return;

        swipeContainer.addEventListener('click', function(e) {
            if (!_editMode) return;
            if (e.target.closest('.desktop-delete-badge')) return;
            if (e.target.closest('#desktop-edit-overlay')) return;
            if (e.target.closest('#desktop-recycle-tray')) return;

            const appItem = e.target.closest('.app-item');
            if (appItem) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
            const widget = e.target.closest('.custom-widget, .p2-photo-upload, .p2-album-disc, .p2-music-widget');
            if (widget) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }

            // [体验] 点击空白区域退出编辑模式（类似手机桌面）
            const isBlank = e.target.closest('.grid-drop-placeholder') ||
                            e.target.closest('.app-grid') ||
                            e.target.closest('.p2-grid') ||
                            e.target.closest('.desktop-page');
            if (isBlank && !e.target.closest('.app-item') && !e.target.closest('[data-section]') && !e.target.closest('[data-p2-section]') && !e.target.closest('.custom-widget')) {
                e.preventDefault();
                e.stopPropagation();
                exitEditMode();
                return false;
            }
        }, true);

        // Wrap openApp to block in edit mode
        const origOpenApp = window.openApp;
        if (origOpenApp) {
            window.openApp = function(id) {
                if (_editMode) return;
                return origOpenApp.apply(this, arguments);
            };
        }

        // Wrap widget/photo upload functions
        ['openWidgetManager', 'p2UploadPhoto', 'p2UploadSquare', 'p2UploadAlbum', 'openDesktopProfileEdit', 'openLocationEdit', 'uploadImg'].forEach(fnName => {
            const orig = window[fnName];
            if (orig) {
                window[fnName] = function() {
                    if (_editMode) return;
                    return orig.apply(this, arguments);
                };
            }
        });
    }

    // ============================================================
    // Initialization
    // ============================================================
    function _init() {
        // [FIX-视觉复原] 初始化时设置正确的 grid 模板，确保 grid-row/grid-column 定位生效
        var initGrid1 = document.getElementById('desktop-grid');
        if (initGrid1) {
            initGrid1.style.gridTemplateRows = 'repeat(' + GRID_ROWS_PAGE1 + ', 1fr)';
            initGrid1.style.gridTemplateColumns = 'repeat(' + GRID_COLS + ', 1fr)';
        }
        var initGrid2 = document.getElementById('desktop-page2-grid');
        if (initGrid2) {
            initGrid2.style.gridTemplateRows = 'auto auto auto repeat(3, 1fr)';
            initGrid2.style.gridTemplateColumns = 'repeat(' + GRID_COLS_PAGE2 + ', 1fr)';
        }

        // Restore hidden elements
        _applyHiddenElements();

        // Restore layout order
        _restoreLayout();

        const swipeContainer = document.getElementById('desktop-swipe-container');
        if (!swipeContainer) return;

        // Touch events
        swipeContainer.addEventListener('touchstart', _onTouchStart, { passive: true });
        swipeContainer.addEventListener('touchmove', _onTouchMove, { passive: false });
        swipeContainer.addEventListener('touchend', _onTouchEnd, { passive: true });
        swipeContainer.addEventListener('touchcancel', _onTouchCancel, { passive: true });

        // Mouse events
        swipeContainer.addEventListener('mousedown', _onMouseDown);
        window.addEventListener('mousemove', _onMouseMove);
        window.addEventListener('mouseup', _onMouseUp);

        // Setup click blockers
        _setupClickBlocker();
    }

    // Wait for DOM and other scripts to load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() { setTimeout(_init, 200); });
    } else {
        setTimeout(_init, 200);
    }

    // Expose for external use
    window.enterDesktopEditMode = enterEditMode;
    window.exitDesktopEditMode = exitEditMode;
    window._isDesktopEditMode = function() { return _editMode; };

})();
