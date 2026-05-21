        // ========== BOOK STORE & READ TOGETHER ==========
        // [PERF-2026-05-08] 书籍内容从 store 剥离到 IndexedDB，解决APK卡顿
        // store.books[] 只保留元数据（id/name/author/contentLength），
        // 书籍全文和rawData存储在 IDB key: AIChatOS_v8_Book_{bookId}
        let bsActiveCate = 'all';
        let currentReadBookId = null;

        // ---- [PERF] 书籍内容 IndexedDB 存储 ----
        // 运行时缓存：阅读器打开时加载，关闭时清除
        let _currentBookContent = '';       // 当前打开书籍的全文
        let _currentBookContentLength = 0;  // 当前打开书籍的字符数
        let _currentBookRawData = null;     // 当前打开书籍的原始字节（用于重新编码）

        function _getIdb() {
            return typeof window.__getAppIdb === 'function' ? window.__getAppIdb() : null;
        }

        function _bookIdbKey(bookId) {
            return 'AIChatOS_v8_Book_' + bookId;
        }

        async function _saveBookToIdb(bookId, content, rawData) {
            var idb = _getIdb();
            if (!idb) {
                console.warn('[BookStore] IDB不可用，书籍内容将丢失');
                return false;
            }
            try {
                var data = { content: content || '' };
                if (rawData) data.rawData = rawData;
                await idb.set(_bookIdbKey(bookId), data);
                return true;
            } catch (e) {
                console.error('[BookStore] 写入IDB失败:', e);
                return false;
            }
        }

        async function _loadBookFromIdb(bookId) {
            var idb = _getIdb();
            if (!idb) return null;
            try {
                var data = await idb.get(_bookIdbKey(bookId));
                if (data && typeof data === 'object' && typeof data.content === 'string') {
                    return data; // { content, rawData? }
                }
                // 兼容旧格式：直接存的字符串
                if (typeof data === 'string') {
                    return { content: data };
                }
                return null;
            } catch (e) {
                console.error('[BookStore] 读取IDB失败:', e);
                return null;
            }
        }

        async function _deleteBookFromIdb(bookId) {
            var idb = _getIdb();
            if (!idb) return;
            try {
                await idb.del(_bookIdbKey(bookId));
            } catch (e) {
                console.warn('[BookStore] 删除IDB失败:', e);
            }
        }

        // ---- [PERF] 数据迁移：从 store.books[].content/rawData 迁移到 IDB ----
        let _migrationDone = false;
        async function _migrateBookData() {
            if (_migrationDone) return;
            _migrationDone = true;
            var books = store.books || [];
            var needSave = false;
            var migrated = 0;

            for (var i = 0; i < books.length; i++) {
                var b = books[i];
                // 如果书籍还有 content 或 rawData 在 store 中，迁移到 IDB
                if (b.content && typeof b.content === 'string' && b.content.length > 0) {
                    var rawData = b.rawData || null;
                    var ok = await _saveBookToIdb(b.id, b.content, rawData);
                    if (ok) {
                        // 迁移成功：store中只保留 contentLength
                        b.contentLength = b.content.length;
                        delete b.content;
                        delete b.rawData;
                        needSave = true;
                        migrated++;
                    }
                } else if (b.rawData) {
                    // 只有 rawData 没有 content 的异常情况，直接清理
                    delete b.rawData;
                    needSave = true;
                    migrated++;
                }
                // 确保 contentLength 字段存在
                if (!b.contentLength && !b.content) {
                    // 尝试从 IDB 读取长度
                    var idbData = await _loadBookFromIdb(b.id);
                    if (idbData && idbData.content) {
                        b.contentLength = idbData.content.length;
                        needSave = true;
                    } else {
                        b.contentLength = 0;
                    }
                }
            }

            if (needSave) {
                console.log('[BookStore] 迁移完成: ' + migrated + ' 本书的内容已移至 IndexedDB');
                if (typeof save === 'function') save();
            }
        }

        function openBookStore() {
            if (!store.bookCategories) store.bookCategories = [{ id: 'default', name: '默认' }];
            if (!store.books) store.books = [];
            bsActiveCate = 'all';
            renderBookStore();
            document.getElementById('layer-bookstore').classList.add('show');
            // 异步执行迁移（不阻塞UI）
            _migrateBookData();
        }

        function renderBookStore() {
            renderBookCategoryBar();
            renderBookList();
        }

        function renderBookCategoryBar() {
            const bar = document.getElementById('bs-category-bar');
            if (!bar) return;
            const cats = store.bookCategories || [];
            let h = `<div class="bs-cate-chip ${bsActiveCate === 'all' ? 'active' : ''}" onclick="filterBookCate('all')">全部</div>`;
            cats.forEach(c => {
                h += `<div class="bs-cate-chip ${bsActiveCate === c.id ? 'active' : ''}" onclick="filterBookCate('${c.id}')" oncontextmenu="event.preventDefault();showBookCateMenu(event,'${c.id}')">${c.name}${c.id !== 'default' ? `<span class="bs-cate-del" onclick="event.stopPropagation();deleteBookCategory('${c.id}')">×</span>` : ''}</div>`;
            });
            bar.innerHTML = h;
        }

        function filterBookCate(id) {
            bsActiveCate = id;
            renderBookStore();
        }

        function renderBookList() {
            const list = document.getElementById('bs-book-list');
            if (!list) return;
            let books = store.books || [];
            if (bsActiveCate !== 'all') books = books.filter(b => b.categoryId === bsActiveCate);

            if (books.length === 0) {
                list.innerHTML = `<div class="bs-empty"><div style="font-size:24px;color:#ccc;margin-bottom:12px;font-family:Georgia,serif;font-style:italic;">Empty</div><div>还没有书籍</div><div style="font-size:11px;margin-top:8px;color:#bbb;">点击右上角 + 上传txt文件</div></div>`;
                return;
            }

            if (!store.bookProgress) store.bookProgress = {};
            list.innerHTML = books.map(b => {
                const catName = (store.bookCategories || []).find(c => c.id === b.categoryId)?.name || '默认';
                // [PERF] 使用 contentLength 而非 content.length
                const totalLen = b.contentLength || 0;
                const size = totalLen > 0 ? (totalLen / 1024).toFixed(1) + 'KB' : '';
                const authorStr = b.author ? ` / ${b.author}` : '';
                const bProgress = store.bookProgress[b.id] || 0;
                const bPct = totalLen > 0 ? Math.round((bProgress / totalLen) * 100) : 0;
                const progressStr = bPct > 0 ? ` / ${bPct}%` : '';
                const hlCount = ((store.bookHighlights || {})[b.id] || []).length;
                const hlStr = hlCount > 0 ? ` / ${hlCount}注` : '';
                return `<div class="bs-book-card" data-book-id="${b.id}" onclick="openBookReader('${b.id}')">
                    <div class="bs-book-icon">册</div>
                    <div class="bs-book-info">
                        <div class="bs-book-name">${b.name}</div>
                        <div class="bs-book-meta">${catName}${authorStr} / ${size}${progressStr}${hlStr}</div>
                    </div>
                    <div class="bs-book-actions">
                        <button class="bs-book-action-btn del" onclick="event.stopPropagation();deleteBook('${b.id}')" title="删除">×</button>
                    </div>
                </div>`;
            }).join('');
        }

        function openBookCategoryModal() {
            document.getElementById('new-book-cate-name').value = '';
            document.getElementById('modal-book-category').style.display = 'flex';
        }

        function saveBookCategory() {
            const name = document.getElementById('new-book-cate-name').value.trim();
            if (!name) return toast('请输入分类名称');
            if (!store.bookCategories) store.bookCategories = [];
            store.bookCategories.push({ id: 'bc_' + Date.now(), name });
            save();
            renderBookCategoryBar();
            document.getElementById('modal-book-category').style.display = 'none';
            toast('分类已创建');
        }

        function deleteBookCategory(id) {
            if (id === 'default') return toast('默认分类不可删除');
            const cat = (store.bookCategories || []).find(c => c.id === id);
            if (!cat) return;
            if (!confirm(`确定删除分类"${cat.name}"？该分类下的书籍将移至默认分类`)) return;
            // Move books to default
            (store.books || []).forEach(b => { if (b.categoryId === id) b.categoryId = 'default'; });
            store.bookCategories = store.bookCategories.filter(c => c.id !== id);
            if (bsActiveCate === id) bsActiveCate = 'all';
            save();
            renderBookStore();
            toast('分类已删除');
        }

        function showBookCateMenu(e, id) {
            if (id === 'default') return;
            deleteBookCategory(id);
        }

        function triggerBookUpload() {
            document.getElementById('book-file-input').click();
        }

        // Pending files for upload modal
        let _pendingBookFiles = [];

        function handleBookFileSelect(input) {
            const files = input.files;
            if (!files || files.length === 0) return;
            _pendingBookFiles = Array.from(files).filter(f => f.name.endsWith('.txt'));
            if (_pendingBookFiles.length === 0) { toast('仅支持txt文件'); input.value = ''; return; }

            // Populate upload modal
            const firstFile = _pendingBookFiles[0];
            document.getElementById('book-upload-name').value = firstFile.name.replace(/\.txt$/i, '');
            document.getElementById('book-upload-author').value = '';
            document.getElementById('book-upload-encoding').value = 'auto';

            // Populate category select
            const catSelect = document.getElementById('book-upload-category');
            const cats = store.bookCategories || [];
            catSelect.innerHTML = cats.map(c => `<option value="${c.id}" ${(bsActiveCate !== 'all' && bsActiveCate === c.id) ? 'selected' : ''}>${c.name}</option>`).join('');

            // File info
            const infoEl = document.getElementById('book-upload-file-info');
            if (_pendingBookFiles.length > 1) {
                infoEl.textContent = `已选择 ${_pendingBookFiles.length} 个文件（书名/作者将应用于第一个文件，其余使用文件名）`;
                infoEl.style.display = 'block';
            } else {
                infoEl.textContent = `文件大小: ${(firstFile.size / 1024).toFixed(1)} KB`;
                infoEl.style.display = 'block';
            }

            document.getElementById('modal-book-upload').style.display = 'flex';
            input.value = '';
        }

        // Auto-detect encoding by reading first bytes
        function detectEncoding(buffer) {
            const arr = new Uint8Array(buffer.slice(0, 4));
            // BOM detection
            if (arr[0] === 0xFF && arr[1] === 0xFE) return 'UTF-16LE';
            if (arr[0] === 0xFE && arr[1] === 0xFF) return 'UTF-16BE';
            if (arr[0] === 0xEF && arr[1] === 0xBB && arr[2] === 0xBF) return 'UTF-8';

            // Scan more bytes for better accuracy
            const scanLen = Math.min(buffer.byteLength, 32000);
            const bytes = new Uint8Array(buffer.slice(0, scanLen));
            let gbkScore = 0, utf8Score = 0, utf8Invalid = 0, big5Score = 0;

            for (let i = 0; i < bytes.length; i++) {
                const b = bytes[i];
                if (b < 0x80) continue; // ASCII

                // Try UTF-8 validation
                let seqLen = 0;
                if ((b & 0xE0) === 0xC0) seqLen = 2;
                else if ((b & 0xF0) === 0xE0) seqLen = 3;
                else if ((b & 0xF8) === 0xF0) seqLen = 4;

                if (seqLen > 0 && i + seqLen - 1 < bytes.length) {
                    let valid = true;
                    for (let j = 1; j < seqLen; j++) {
                        if ((bytes[i + j] & 0xC0) !== 0x80) { valid = false; break; }
                    }
                    if (valid) {
                        utf8Score += seqLen;
                        i += seqLen - 1;
                        continue;
                    } else {
                        utf8Invalid++;
                    }
                } else if (b >= 0x80) {
                    utf8Invalid++;
                }

                // GBK double-byte: lead 0x81-0xFE, trail 0x40-0xFE (excl 0x7F)
                if (b >= 0x81 && b <= 0xFE && i + 1 < bytes.length) {
                    const b2 = bytes[i + 1];
                    if (b2 >= 0x40 && b2 <= 0xFE && b2 !== 0x7F) {
                        gbkScore++;
                        // Big5 subset: lead 0xA1-0xF9, trail 0x40-0x7E or 0xA1-0xFE
                        if (b >= 0xA1 && b <= 0xF9 && ((b2 >= 0x40 && b2 <= 0x7E) || (b2 >= 0xA1 && b2 <= 0xFE))) {
                            big5Score++;
                        }
                        i++;
                    }
                }
            }

            // Decision logic
            if (utf8Invalid === 0 && utf8Score > 0) return 'UTF-8';
            if (gbkScore > 5 && utf8Invalid > 0) {
                // If most GBK chars also match Big5, could be Big5
                if (big5Score > gbkScore * 0.8 && big5Score > 10) return 'Big5';
                return 'GBK';
            }
            return 'UTF-8';
        }

        function confirmBookUpload() {
            if (_pendingBookFiles.length === 0) return;
            if (!store.books) store.books = [];

            const customName = document.getElementById('book-upload-name').value.trim();
            const customAuthor = document.getElementById('book-upload-author').value.trim();
            const encoding = document.getElementById('book-upload-encoding').value;
            const categoryId = document.getElementById('book-upload-category').value || 'default';

            let loaded = 0;
            const total = _pendingBookFiles.length;

            _pendingBookFiles.forEach((file, idx) => {
                // Always read as ArrayBuffer first to save raw data for re-encoding
                const bufReader = new FileReader();
                bufReader.onload = function(e) {
                    const rawData = e.target.result;
                    const enc = encoding === 'auto' ? detectEncoding(rawData) : encoding;
                    const decoder = new TextDecoder(enc, { fatal: false });
                    const content = decoder.decode(new Uint8Array(rawData));
                    // [PERF] rawData 转为普通数组存入IDB，不再放 store
                    addBookFromContent(content, file, idx, customName, customAuthor, categoryId, Array.from(new Uint8Array(rawData)));
                    loaded++;
                    if (loaded === total) finishBookUpload(total);
                };
                bufReader.readAsArrayBuffer(file);
            });

            document.getElementById('modal-book-upload').style.display = 'none';
        }

        function addBookFromContent(content, file, idx, customName, customAuthor, categoryId, rawData) {
            const name = idx === 0 && customName ? customName : file.name.replace(/\.txt$/i, '');
            const author = idx === 0 ? customAuthor : '';
            const bookId = 'book_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);

            // [PERF] store 中只保留元数据，content 和 rawData 存入 IndexedDB
            store.books.push({
                id: bookId,
                name,
                author,
                categoryId,
                contentLength: content.length,  // 只存长度
                addedTime: Date.now()
            });

            // 异步写入 IDB（不阻塞UI）
            _saveBookToIdb(bookId, content, rawData).then(function(ok) {
                if (!ok) {
                    console.error('[BookStore] 书籍内容写入IDB失败: ' + bookId);
                    toast('书籍内容保存失败，请重试');
                }
            });
        }

        function finishBookUpload(count) {
            save();
            renderBookList();
            toast(`已添加 ${count} 本书`);
            _pendingBookFiles = [];
        }

        function deleteBook(id) {
            const book = (store.books || []).find(b => b.id === id);
            if (!book) return;
            if (!confirm(`确定删除《${book.name}》？`)) return;
            store.books = store.books.filter(b => b.id !== id);
            // Clean up per-book progress and highlights
            if (store.bookProgress) delete store.bookProgress[id];
            if (store.bookHighlights) delete store.bookHighlights[id];
            // If currently reading this book, stop
            if (store.readState && store.readState.bookId === id) stopReadTogether();
            // [PERF] 删除 IDB 中的书籍内容
            _deleteBookFromIdb(id);
            save();
            renderBookList();
            toast('已删除');
        }

        // ---- BOOK READER ----
        let _readerSettings = {
            fontSize: 16,
            bgColor: '#faf8f5',
            textColor: '#333',
            mode: 'page', // 'scroll' or 'page'
            pageDir: 'horizontal', // 'horizontal' or 'vertical'
            encoding: 'UTF-8'
        };
        let _readerPages = [];
        let _readerCurrentPage = 0;
        let _readerNavVisible = true;
        let _progressSaveTimer = null;
        function _debouncedProgressSave() {
            if (_progressSaveTimer) clearTimeout(_progressSaveTimer);
            _progressSaveTimer = setTimeout(() => save(), 1000);
        }

        async function openBookReader(bookId) {
            const book = (store.books || []).find(b => b.id === bookId);
            if (!book) return toast('书籍不存在');
            currentReadBookId = bookId;

            // [PERF] 从 IndexedDB 加载书籍内容到运行时缓存
            const contentEl = document.getElementById('book-reader-content');
            contentEl.innerHTML = '<p style="text-align:center;color:#999;padding:40px;">加载中...</p>';

            // 先显示UI框架
            document.getElementById('book-reader-title').textContent = book.name;
            document.getElementById('book-reader-settings').style.display = 'none';
            const popup = document.getElementById('book-reader-popup');
            popup.style.display = 'flex';
            document.getElementById('book-reader-mini').style.display = 'none';
            _readerNavVisible = true;
            const header = document.querySelector('.book-popup-header');
            if (header) header.style.display = '';
            applyReaderTheme();

            // Update settings panel values
            document.getElementById('brs-font-size-val').textContent = _readerSettings.fontSize + 'px';
            document.getElementById('brs-encoding-select').value = _readerSettings.encoding || 'UTF-8';
            updateReaderModeButtons();

            // Init drag & resize
            initBookPopupDrag();
            initBookPopupResize();

            // 异步加载书籍内容
            var idbData = await _loadBookFromIdb(bookId);
            if (idbData && idbData.content) {
                _currentBookContent = idbData.content;
                _currentBookContentLength = idbData.content.length;
                _currentBookRawData = idbData.rawData || null;
            } else if (book.content) {
                // 兼容：还没迁移的旧数据
                _currentBookContent = book.content;
                _currentBookContentLength = book.content.length;
                _currentBookRawData = book.rawData || null;
            } else {
                _currentBookContent = '';
                _currentBookContentLength = 0;
                _currentBookRawData = null;
                contentEl.innerHTML = '<p style="text-align:center;color:#999;padding:40px;">书籍内容丢失，请重新上传</p>';
                return;
            }

            // 确保 contentLength 同步
            if (!book.contentLength || book.contentLength !== _currentBookContentLength) {
                book.contentLength = _currentBookContentLength;
            }

            // Load saved settings
            if (store.readerSettings) {
                Object.assign(_readerSettings, store.readerSettings);
            }

            applyReaderTheme();
            renderBookContent();

            // Restore saved reading position (per-book independent progress)
            if (!store.bookProgress) store.bookProgress = {};
            const savedProgress = store.bookProgress[bookId] || (store.readState && store.readState.bookId === bookId ? store.readState.progress : 0);
            if (savedProgress > 0) {
                const totalLen = _currentBookContentLength;
                const pct = totalLen > 0 ? savedProgress / totalLen : 0;
                // Delay to let renderBookContent's rAF finish first
                setTimeout(() => {
                    if (_readerSettings.mode === 'page' && _readerPages.length > 1) {
                        const targetPage = Math.min(Math.round(pct * (_readerPages.length - 1)), _readerPages.length - 1);
                        showPage(targetPage);
                    } else if (_readerSettings.mode === 'scroll') {
                        // For lazy scroll: render enough chunks to reach target position
                        const scrollEl = document.getElementById('book-reader-content');
                        const targetParaIdx = Math.round(pct * _readerParaOffsets.length);
                        while (_lazyRenderedCount < Math.min(targetParaIdx + _LAZY_CHUNK, _readerParaOffsets.length)) {
                            _renderScrollChunk(scrollEl);
                        }
                        requestAnimationFrame(() => {
                            scrollEl.scrollTop = pct * (scrollEl.scrollHeight - scrollEl.clientHeight);
                        });
                    }
                }, 50);
            }
        }

        // Track paragraph offsets for highlight mapping
        let _readerParaOffsets = []; // [{start, end, text}]

        function _buildParaOffsets() {
            _readerParaOffsets = [];
            const content = _currentBookContent || '';
            // Fast single-pass split tracking positions directly
            const paragraphs = [];
            let pos = 0;
            const len = content.length;
            while (pos < len) {
                // Skip newlines/whitespace between paragraphs
                while (pos < len && (content[pos] === '\n' || content[pos] === '\r')) pos++;
                if (pos >= len) break;
                // Find end of paragraph
                let end = content.indexOf('\n', pos);
                if (end === -1) end = len;
                const raw = content.substring(pos, end);
                const trimmed = raw.trim();
                if (trimmed.length > 0) {
                    const leadSpaces = raw.length - raw.trimStart().length;
                    const start = pos + leadSpaces;
                    _readerParaOffsets.push({ start, end: start + trimmed.length, text: trimmed });
                    paragraphs.push(trimmed);
                }
                pos = end + 1;
            }
            return paragraphs;
        }

        function _renderParaWithHighlights(paraText, paraStart, bookId) {
            const highlights = (store.bookHighlights || {})[bookId] || [];
            const paraEnd = paraStart + paraText.length;
            // Find overlapping highlights
            const relevant = highlights.filter(h => h.start < paraEnd && h.end > paraStart)
                .sort((a, b) => a.start - b.start);
            if (relevant.length === 0) return escapeHtml(paraText);

            let result = '';
            let cursor = 0;
            relevant.forEach(h => {
                const hlStart = Math.max(h.start - paraStart, 0);
                const hlEnd = Math.min(h.end - paraStart, paraText.length);
                if (hlStart > cursor) result += escapeHtml(paraText.substring(cursor, hlStart));
                const hlText = paraText.substring(hlStart, hlEnd);
                const noteAttr = h.note ? ` data-note="${escapeHtml(h.note)}"` : '';
                result += `<span class="reader-highlight" style="background:${h.color || '#FFEB3B'};" data-hlid="${h.id}"${noteAttr} onclick="showHlNotePopup(event,'${h.id}')">${escapeHtml(hlText)}</span>`;
                cursor = hlEnd;
            });
            if (cursor < paraText.length) result += escapeHtml(paraText.substring(cursor));
            return result;
        }

        // Lazy rendering state for scroll mode
        let _lazyRenderedCount = 0;
        let _lazyRenderBusy = false;
        const _LAZY_CHUNK = 60; // paragraphs per chunk
        const _LAZY_BUFFER = 800; // px before bottom to trigger next chunk

        function renderBookContent() {
            const contentEl = document.getElementById('book-reader-content');

            // Show loading for large books
            const isLarge = _currentBookContentLength > 100000;
            if (isLarge) contentEl.innerHTML = '<p style="text-align:center;color:#999;padding:40px;">加载中...</p>';

            // Use rAF to avoid blocking UI
            requestAnimationFrame(() => {
                const paragraphs = _buildParaOffsets().map(p => p.trim());

                if (_readerSettings.mode === 'scroll') {
                    // Scroll mode — lazy chunked rendering
                    contentEl.style.overflowY = 'auto';
                    contentEl.innerHTML = '';
                    _readerPages = [];
                    _lazyRenderedCount = 0;
                    updatePageInfo(0, 0);

                    // Render first chunk
                    _renderScrollChunk(contentEl);

                    contentEl.onscroll = function() {
                        const pct = contentEl.scrollHeight > contentEl.clientHeight
                            ? contentEl.scrollTop / (contentEl.scrollHeight - contentEl.clientHeight) : 0;
                        document.getElementById('book-reader-progress-fill').style.width = (pct * 100) + '%';
                        // Save per-book progress (debounced)
                        if (!store.bookProgress) store.bookProgress = {};
                        const charPos = Math.round(pct * _currentBookContentLength);
                        store.bookProgress[currentReadBookId] = charPos;
                        _debouncedProgressSave();
                        if (store.readState && store.readState.active && store.readState.bookId === currentReadBookId) {
                            store.readState.progress = charPos;
                            updateReadFloatInfo();
                        }
                        // Lazy load more paragraphs when near bottom
                        if (_lazyRenderedCount < _readerParaOffsets.length) {
                            const distToBottom = contentEl.scrollHeight - contentEl.scrollTop - contentEl.clientHeight;
                            if (distToBottom < _LAZY_BUFFER) {
                                _renderScrollChunk(contentEl);
                            }
                        }
                    };
                } else {
                    // Page mode
                    contentEl.style.overflowY = 'hidden';
                    contentEl.onscroll = null;
                    paginateBook(paragraphs);
                }
            });
        }

        function _renderScrollChunk(contentEl) {
            if (_lazyRenderBusy || _lazyRenderedCount >= _readerParaOffsets.length) return;
            _lazyRenderBusy = true;
            const end = Math.min(_lazyRenderedCount + _LAZY_CHUNK, _readerParaOffsets.length);
            const frag = document.createDocumentFragment();
            for (let i = _lazyRenderedCount; i < end; i++) {
                const po = _readerParaOffsets[i];
                const p = document.createElement('p');
                p.className = 'reader-para';
                p.setAttribute('data-offset', po.start);
                p.innerHTML = _renderParaWithHighlights(po.text, po.start, currentReadBookId);
                frag.appendChild(p);
            }
            contentEl.appendChild(frag);
            _lazyRenderedCount = end;
            _lazyRenderBusy = false;
        }

        // Store paragraph indices per page for highlight mapping
        let _readerPageParaIndices = []; // [[paraIdx, paraIdx, ...], ...]

        function paginateBook(paragraphs) {
            const contentEl = document.getElementById('book-reader-content');
            // Calculate available height
            const availH = contentEl.clientHeight || (window.innerHeight - 100);
            const lineH = _readerSettings.fontSize * 1.9;
            const linesPerPage = Math.floor(availH / lineH) || 20;
            const charsPerLine = Math.floor((contentEl.clientWidth || 340) / _readerSettings.fontSize) || 20;
            const charsPerPage = linesPerPage * charsPerLine;

            _readerPages = [];
            _readerPageParaIndices = [];
            let currentPage = [];
            let currentIndices = [];
            let currentLen = 0;

            paragraphs.forEach((p, i) => {
                const pLen = p.trim().length + charsPerLine; // +indent
                if (currentLen + pLen > charsPerPage && currentPage.length > 0) {
                    _readerPages.push(currentPage);
                    _readerPageParaIndices.push(currentIndices);
                    currentPage = [];
                    currentIndices = [];
                    currentLen = 0;
                }
                currentPage.push(p.trim());
                currentIndices.push(i);
                currentLen += pLen;
            });
            if (currentPage.length > 0) {
                _readerPages.push(currentPage);
                _readerPageParaIndices.push(currentIndices);
            }
            if (_readerPages.length === 0) {
                _readerPages = [['（空白）']];
                _readerPageParaIndices = [[]];
            }

            _readerCurrentPage = 0;
            showPage(_readerCurrentPage);
        }

        function showPage(pageIdx) {
            if (pageIdx < 0 || pageIdx >= _readerPages.length) return;
            _readerCurrentPage = pageIdx;
            const contentEl = document.getElementById('book-reader-content');
            const paraIndices = _readerPageParaIndices[pageIdx] || [];
            contentEl.innerHTML = _readerPages[pageIdx].map((p, i) => {
                const paraIdx = paraIndices[i];
                const po = _readerParaOffsets[paraIdx];
                if (po) {
                    return `<p class="reader-para" data-offset="${po.start}">${_renderParaWithHighlights(po.text, po.start, currentReadBookId)}</p>`;
                }
                return `<p class="reader-para">${escapeHtml(p)}</p>`;
            }).join('');
            contentEl.scrollTop = 0;

            const total = _readerPages.length;
            const pct = total > 1 ? pageIdx / (total - 1) : 1;
            document.getElementById('book-reader-progress-fill').style.width = (pct * 100) + '%';
            updatePageInfo(pageIdx + 1, total);

            // Save per-book progress (using cached content length)
            if (!store.bookProgress) store.bookProgress = {};
            const charPos = Math.round(pct * _currentBookContentLength);
            store.bookProgress[currentReadBookId] = charPos;
            _debouncedProgressSave();
            if (store.readState && store.readState.active && store.readState.bookId === currentReadBookId) {
                store.readState.progress = charPos;
                updateReadFloatInfo();
            }
        }

        function updatePageInfo(current, total) {
            const el = document.getElementById('book-reader-page-num');
            if (_readerSettings.mode === 'scroll') {
                document.getElementById('book-reader-page-info').style.display = 'none';
            } else {
                document.getElementById('book-reader-page-info').style.display = '';
                el.textContent = `${current}/${total}`;
            }
        }

        function handleReaderTap(e) {
            // Close highlight note popup if open
            closeHlNotePopup();
            // Don't navigate if text is selected (user is highlighting)
            const sel = window.getSelection();
            if (sel && !sel.isCollapsed) return;
            // Don't handle if settings panel is open
            if (document.getElementById('book-reader-settings').style.display !== 'none') {
                document.getElementById('book-reader-settings').style.display = 'none';
                return;
            }
            if (_readerSettings.mode !== 'page') return;
            const rect = e.currentTarget.getBoundingClientRect();
            const isVert = _readerSettings.pageDir === 'vertical';
            const clientX = e.clientX || (e.touches && e.touches[0]?.clientX) || (rect.left + rect.width / 2);
            const clientY = e.clientY || (e.touches && e.touches[0]?.clientY) || (rect.top + rect.height / 2);
            const ratioX = (clientX - rect.left) / rect.width;
            const ratioY = (clientY - rect.top) / rect.height;
            const zone = isVert ? ratioY : ratioX;

            if (zone < 0.3) {
                // Prev page (left or top)
                if (_readerCurrentPage > 0) showPage(_readerCurrentPage - 1);
            } else if (zone > 0.7) {
                // Next page (right or bottom)
                if (_readerCurrentPage < _readerPages.length - 1) showPage(_readerCurrentPage + 1);
            } else {
                // Center: toggle header & page info
                _readerNavVisible = !_readerNavVisible;
                const header = document.querySelector('.book-popup-header');
                if (header) header.style.display = _readerNavVisible ? '' : 'none';
                document.getElementById('book-reader-page-info').style.opacity = _readerNavVisible ? '1' : '0.3';
            }
        }

        // Swipe support for page turning
        let _readerTouchStartX = 0, _readerTouchStartY = 0;
        function handleReaderTouchStart(e) {
            _readerTouchStartX = e.touches[0].clientX;
            _readerTouchStartY = e.touches[0].clientY;
        }
        function handleReaderTouchEnd(e) {
            if (_readerSettings.mode !== 'page') return;
            const dx = e.changedTouches[0].clientX - _readerTouchStartX;
            const dy = e.changedTouches[0].clientY - _readerTouchStartY;
            const isVert = _readerSettings.pageDir === 'vertical';
            const primary = isVert ? dy : dx;
            const secondary = isVert ? dx : dy;
            if (Math.abs(primary) > 50 && Math.abs(primary) > Math.abs(secondary) * 1.5) {
                if (primary < 0 && _readerCurrentPage < _readerPages.length - 1) {
                    showPage(_readerCurrentPage + 1); // swipe left/up = next
                } else if (primary > 0 && _readerCurrentPage > 0) {
                    showPage(_readerCurrentPage - 1); // swipe right/down = prev
                }
            }
        }

        // ---- HIGHLIGHT / ANNOTATION SYSTEM ----
        let _hlSelectedColor = '#FFEB3B';
        let _hlSelectionInfo = null; // {text, start, end} from last selection

        function hlPickColor(el) {
            document.querySelectorAll('#reader-hl-toolbar .reader-hl-color').forEach(c => c.classList.remove('active'));
            el.classList.add('active');
            _hlSelectedColor = el.dataset.color;
        }

        // Listen for text selection in reader
        document.addEventListener('selectionchange', function() {
            const toolbar = document.getElementById('reader-hl-toolbar');
            if (!toolbar) return;
            const popup = document.getElementById('book-reader-popup');
            if (!popup || popup.style.display === 'none') { toolbar.classList.remove('show'); return; }

            const sel = window.getSelection();
            if (!sel || sel.isCollapsed || !sel.rangeCount) { toolbar.classList.remove('show'); _hlSelectionInfo = null; return; }

            const range = sel.getRangeAt(0);
            const contentEl = document.getElementById('book-reader-content');
            if (!contentEl || !contentEl.contains(range.commonAncestorContainer)) { toolbar.classList.remove('show'); return; }

            const selectedText = sel.toString().trim();
            if (!selectedText) { toolbar.classList.remove('show'); return; }

            // Calculate character offset in book content
            const charRange = _getSelectionCharRange(range, contentEl);
            if (!charRange) { toolbar.classList.remove('show'); return; }

            _hlSelectionInfo = { text: selectedText, start: charRange.start, end: charRange.end };

            // Position toolbar above selection
            const rect = range.getBoundingClientRect();
            const popupRect = popup.getBoundingClientRect();
            toolbar.style.left = Math.max(4, rect.left - popupRect.left + (rect.width / 2) - 100) + 'px';
            toolbar.style.top = Math.max(4, rect.top - popupRect.top - 44) + 'px';
            toolbar.classList.add('show');
        });

        function _getSelectionCharRange(range, contentEl) {
            // Walk through reader-para elements to find character positions
            const paras = contentEl.querySelectorAll('.reader-para');
            let startOffset = null, endOffset = null;

            for (const para of paras) {
                const paraStart = parseInt(para.dataset.offset);
                if (isNaN(paraStart)) continue;

                if (para.contains(range.startContainer)) {
                    const textBefore = _getTextOffsetInNode(para, range.startContainer, range.startOffset);
                    startOffset = paraStart + textBefore;
                }
                if (para.contains(range.endContainer)) {
                    const textBefore = _getTextOffsetInNode(para, range.endContainer, range.endOffset);
                    endOffset = paraStart + textBefore;
                }
            }
            if (startOffset !== null && endOffset !== null && endOffset > startOffset) {
                return { start: startOffset, end: endOffset };
            }
            return null;
        }

        function _getTextOffsetInNode(root, targetNode, targetOffset) {
            // Count text characters from start of root to the target position
            const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
            let offset = 0;
            let node;
            while (node = walker.nextNode()) {
                if (node === targetNode) {
                    return offset + targetOffset;
                }
                offset += node.textContent.length;
            }
            return offset;
        }

        function hlDoHighlight() {
            if (!_hlSelectionInfo || !currentReadBookId) return;
            if (!store.bookHighlights) store.bookHighlights = {};
            if (!store.bookHighlights[currentReadBookId]) store.bookHighlights[currentReadBookId] = [];

            // Check for overlapping highlights and merge or skip
            const existing = store.bookHighlights[currentReadBookId];
            const overlap = existing.find(h => h.start < _hlSelectionInfo.end && h.end > _hlSelectionInfo.start);
            if (overlap) {
                // Extend existing highlight
                overlap.start = Math.min(overlap.start, _hlSelectionInfo.start);
                overlap.end = Math.max(overlap.end, _hlSelectionInfo.end);
                overlap.color = _hlSelectedColor;
            } else {
                existing.push({
                    id: 'hl_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
                    start: _hlSelectionInfo.start,
                    end: _hlSelectionInfo.end,
                    color: _hlSelectedColor,
                    note: '',
                    time: Date.now()
                });
            }
            save();
            window.getSelection().removeAllRanges();
            document.getElementById('reader-hl-toolbar').classList.remove('show');
            _refreshReaderHighlights();
            toast('已划线');
        }

        function hlDoHighlightWithNote() {
            if (!_hlSelectionInfo || !currentReadBookId) return;
            showPromptModal('添加批注:', '').then(function(note) {
                if (note === null) return; // cancelled

                if (!store.bookHighlights) store.bookHighlights = {};
                if (!store.bookHighlights[currentReadBookId]) store.bookHighlights[currentReadBookId] = [];

                store.bookHighlights[currentReadBookId].push({
                    id: 'hl_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
                    start: _hlSelectionInfo.start,
                    end: _hlSelectionInfo.end,
                    color: _hlSelectedColor,
                    note: note || '',
                    time: Date.now()
                });
                save();
                window.getSelection().removeAllRanges();
                document.getElementById('reader-hl-toolbar').classList.remove('show');
                _refreshReaderHighlights();
                toast(note ? '已添加批注' : '已划线');
            });
        }

        function hlShareToChat() {
            if (!_hlSelectionInfo || !currentReadBookId) return;
            const book = (store.books || []).find(b => b.id === currentReadBookId);
            if (!book) return;

            // 使用新的文学分享系统：弹出联系人选择器
            if (typeof shareBookFragment === 'function') {
                shareBookFragment(currentReadBookId, _hlSelectionInfo.text);
            } else if (typeof window._litShare !== 'undefined' && window._litShare.showPicker) {
                window._litShare.showPicker({
                    type: 'fragment',
                    fragment: _hlSelectionInfo.text,
                    title: book.name,
                    author: book.author || '未知',
                    sourceType: 'book',
                    sourceId: currentReadBookId
                });
            } else {
                // 兜底：直接发到当前聊天（使用缓存的内容长度）
                const totalLen = _currentBookContentLength;
                const pct = totalLen > 0 ? Math.round((_hlSelectionInfo.start / totalLen) * 100) : 0;
                const snippet = _hlSelectionInfo.text.length > 100 ? _hlSelectionInfo.text.substring(0, 100) + '...' : _hlSelectionInfo.text;
                const msg = `📖 正在读《${book.name}》(${pct}%处)\n📝 "${snippet}"`;
                if (activeChatId) {
                    if (!store.chats[activeChatId]) store.chats[activeChatId] = [];
                    store.chats[activeChatId].push({ sender: 'me', type: 'text', content: msg, time: Date.now() });
                    save(); renderHistory(); toast('已分享到聊天');
                } else { toast('请先打开一个聊天'); }
            }

            // Also highlight it
            hlDoHighlight();
        }

        function showHlNotePopup(e, hlId) {
            e.stopPropagation();
            const popup = document.getElementById('reader-hl-note-popup');
            const readerPopup = document.getElementById('book-reader-popup');
            if (!popup || !readerPopup) return;

            const highlights = (store.bookHighlights || {})[currentReadBookId] || [];
            const hl = highlights.find(h => h.id === hlId);
            if (!hl) return;

            // [PERF] 使用运行时缓存的内容
            const hlText = _currentBookContent ? _currentBookContent.substring(hl.start, hl.end) : '';
            const snippet = hlText.length > 80 ? hlText.substring(0, 80) + '...' : hlText;

            popup.innerHTML = `
                <div class="hl-note-text" style="border-left:3px solid ${hl.color}; padding-left:8px;">
                    "${escapeHtml(snippet)}"
                </div>
                ${hl.note ? `<div style="padding:4px 0; color:#666; font-size:12px;">💬 ${escapeHtml(hl.note)}</div>` : ''}
                <div class="hl-note-actions">
                    <button onclick="editHlNote('${hlId}')">📝 ${hl.note ? '编辑' : '添加'}批注</button>
                    <button onclick="shareHlToChat('${hlId}')">📤 分享</button>
                    <button class="danger" onclick="deleteHighlight('${hlId}')">🗑 删除</button>
                    <button onclick="closeHlNotePopup()">关闭</button>
                </div>
            `;

            const rect = e.target.getBoundingClientRect();
            const popupRect = readerPopup.getBoundingClientRect();
            popup.style.left = Math.max(4, Math.min(rect.left - popupRect.left, popupRect.width - 270)) + 'px';
            popup.style.top = Math.max(4, rect.bottom - popupRect.top + 4) + 'px';
            popup.style.display = 'block';
        }

        function closeHlNotePopup() {
            document.getElementById('reader-hl-note-popup').style.display = 'none';
        }

        function editHlNote(hlId) {
            const highlights = (store.bookHighlights || {})[currentReadBookId] || [];
            const hl = highlights.find(h => h.id === hlId);
            if (!hl) return;
            showPromptModal('编辑批注:', hl.note || '', {multiline: true}).then(function(note) {
                if (note === null) return;
                hl.note = note;
                save();
                closeHlNotePopup();
                _refreshReaderHighlights();
                toast('批注已更新');
            });
        }

        function shareHlToChat(hlId) {
            const highlights = (store.bookHighlights || {})[currentReadBookId] || [];
            const hl = highlights.find(h => h.id === hlId);
            if (!hl) return;
            const book = (store.books || []).find(b => b.id === currentReadBookId);
            if (!book) return;

            // [PERF] 使用运行时缓存
            const totalLen = _currentBookContentLength;
            const pct = totalLen > 0 ? Math.round((hl.start / totalLen) * 100) : 0;
            const hlText = _currentBookContent ? _currentBookContent.substring(hl.start, hl.end) : '';
            const snippet = hlText.length > 100 ? hlText.substring(0, 100) + '...' : hlText;
            let msg = `📖 正在读《${book.name}》(${pct}%处)\n📝 "${snippet}"`;
            if (hl.note) msg += `\n💬 批注: ${hl.note}`;

            if (activeChatId) {
                if (!store.chats[activeChatId]) store.chats[activeChatId] = [];
                store.chats[activeChatId].push({ sender: 'me', type: 'text', content: msg, time: Date.now() });
                save();
                renderHistory();
                toast('已分享到聊天');
            } else {
                toast('请先打开一个聊天');
            }
            closeHlNotePopup();
        }

        function deleteHighlight(hlId) {
            if (!store.bookHighlights || !store.bookHighlights[currentReadBookId]) return;
            store.bookHighlights[currentReadBookId] = store.bookHighlights[currentReadBookId].filter(h => h.id !== hlId);
            save();
            closeHlNotePopup();
            _refreshReaderHighlights();
            toast('已删除划线');
        }

        function _refreshReaderHighlights() {
            // Re-render current content with updated highlights (uses cached _currentBookContent)
            if (!currentReadBookId || !_currentBookContent) return;
            const contentEl = document.getElementById('book-reader-content');
            if (_readerSettings.mode === 'scroll') {
                const scrollPos = contentEl.scrollTop;
                contentEl.innerHTML = _readerParaOffsets.map(po =>
                    `<p class="reader-para" data-offset="${po.start}">${_renderParaWithHighlights(po.text, po.start, currentReadBookId)}</p>`
                ).join('');
                contentEl.scrollTop = scrollPos;
            } else {
                showPage(_readerCurrentPage);
            }
        }

        function applyReaderTheme() {
            const contentEl = document.getElementById('book-reader-content');
            const popup = document.getElementById('book-reader-popup');
            contentEl.style.fontSize = _readerSettings.fontSize + 'px';
            contentEl.style.color = _readerSettings.textColor;
            contentEl.style.background = _readerSettings.bgColor;
            popup.style.background = _readerSettings.bgColor;
        }

        function changeReaderFontSize(delta) {
            _readerSettings.fontSize = Math.max(12, Math.min(28, _readerSettings.fontSize + delta));
            document.getElementById('brs-font-size-val').textContent = _readerSettings.fontSize + 'px';
            applyReaderTheme();
            saveReaderSettings();
            // Re-paginate if in page mode (uses cached content)
            if (_readerSettings.mode === 'page' && currentReadBookId && _currentBookContent) {
                renderBookContent();
            }
        }

        function setReaderBg(bg, text) {
            _readerSettings.bgColor = bg;
            _readerSettings.textColor = text;
            applyReaderTheme();
            saveReaderSettings();
        }

        function setReaderMode(mode) {
            _readerSettings.mode = mode;
            updateReaderModeButtons();
            saveReaderSettings();
            if (currentReadBookId && _currentBookContent) {
                renderBookContent();
            }
        }

        function updateReaderModeButtons() {
            const scrollBtn = document.getElementById('brs-mode-scroll');
            const pageBtn = document.getElementById('brs-mode-page');
            if (scrollBtn) scrollBtn.classList.toggle('active', _readerSettings.mode === 'scroll');
            if (pageBtn) pageBtn.classList.toggle('active', _readerSettings.mode === 'page');
            // Update page direction buttons
            const hBtn = document.getElementById('brs-dir-horizontal');
            const vBtn = document.getElementById('brs-dir-vertical');
            if (hBtn) hBtn.classList.toggle('active', _readerSettings.pageDir === 'horizontal');
            if (vBtn) vBtn.classList.toggle('active', _readerSettings.pageDir === 'vertical');
        }

        function setReaderPageDir(dir) {
            _readerSettings.pageDir = dir;
            updateReaderModeButtons();
            saveReaderSettings();
        }

        function toggleBookReaderSettings() {
            const panel = document.getElementById('book-reader-settings');
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        }

        async function reloadBookWithEncoding(encoding) {
            if (!currentReadBookId) return;
            const book = (store.books || []).find(b => b.id === currentReadBookId);
            if (!book) return;

            // [PERF] 从运行时缓存或 IDB 加载 rawData
            var rawData = _currentBookRawData;
            if (!rawData) {
                // 尝试从 IDB 加载
                var idbData = await _loadBookFromIdb(currentReadBookId);
                if (idbData && idbData.rawData) {
                    rawData = idbData.rawData;
                }
            }

            if (!rawData) {
                _readerSettings.encoding = encoding;
                saveReaderSettings();
                toast(`编码已切换为 ${encoding}，需重新上传文件以应用`);
                return;
            }

            // Re-decode from raw data with new encoding
            try {
                const decoder = new TextDecoder(encoding, { fatal: false });
                const uint8 = new Uint8Array(rawData);
                const newContent = decoder.decode(uint8);

                // 更新运行时缓存
                _currentBookContent = newContent;
                _currentBookContentLength = newContent.length;
                book.contentLength = newContent.length;

                // 更新 IDB
                _saveBookToIdb(currentReadBookId, newContent, rawData);

                _readerSettings.encoding = encoding;
                saveReaderSettings();
                save();
                renderBookContent();
                toast(`已用 ${encoding} 重新解码`);
            } catch (err) {
                toast('解码失败: ' + err.message);
            }
        }

        function saveReaderSettings() {
            store.readerSettings = { ..._readerSettings };
            save();
        }

        function closeBookReader() {
            // Save current per-book progress before closing
            if (currentReadBookId) {
                if (!store.bookProgress) store.bookProgress = {};
                if (_readerSettings.mode === 'page' && _readerPages.length > 1) {
                    const pct = _readerCurrentPage / (_readerPages.length - 1);
                    const charPos = Math.round(pct * _currentBookContentLength);
                    store.bookProgress[currentReadBookId] = charPos;
                    if (store.readState && store.readState.active && store.readState.bookId === currentReadBookId) {
                        store.readState.progress = charPos;
                    }
                }
                save();
                if (store.readState && store.readState.active) updateReadFloatInfo();
            }
            document.getElementById('book-reader-popup').style.display = 'none';
            document.getElementById('book-reader-mini').style.display = 'none';
            document.getElementById('book-reader-settings').style.display = 'none';

            // [PERF] 清除运行时内容缓存，释放内存
            // 如果还在共读中，保留缓存用于 float info
            if (!(store.readState && store.readState.active && store.readState.bookId === currentReadBookId)) {
                _currentBookContent = '';
                _currentBookContentLength = 0;
                _currentBookRawData = null;
            }

            currentReadBookId = null;
            // Restore float ball if read-together is active
            if (store.readState && store.readState.active) {
                document.getElementById('read-float-ball').style.display = 'flex';
            }
        }

        function minimizeBookReader() {
            document.getElementById('book-reader-popup').style.display = 'none';
            const mini = document.getElementById('book-reader-mini');
            const book = (store.books || []).find(b => b.id === currentReadBookId);
            document.getElementById('book-reader-mini-name').textContent = book ? book.name : '阅读中';
            mini.style.display = 'flex';
        }

        function restoreBookReader() {
            document.getElementById('book-reader-mini').style.display = 'none';
            document.getElementById('book-reader-popup').style.display = 'flex';
            // Reset nav visibility so header buttons are restored
            _readerNavVisible = true;
            const header = document.querySelector('.book-popup-header');
            if (header) header.style.display = '';
        }

        // ---- Popup Drag ----
        function initBookPopupDrag() {
            const popup = document.getElementById('book-reader-popup');
            const handle = document.getElementById('book-popup-drag-handle');
            let dragging = false, startX, startY, origLeft, origTop;

            function onStart(e) {
                // Don't drag if clicking buttons
                if (e.target.closest('.book-popup-btn')) return;
                dragging = true;
                const ev = e.touches ? e.touches[0] : e;
                const rect = popup.getBoundingClientRect();
                startX = ev.clientX;
                startY = ev.clientY;
                origLeft = rect.left;
                origTop = rect.top;
                popup.style.transition = 'none';
            }
            function onMove(e) {
                if (!dragging) return;
                e.preventDefault();
                const ev = e.touches ? e.touches[0] : e;
                const dx = ev.clientX - startX;
                const dy = ev.clientY - startY;
                let newLeft = origLeft + dx;
                let newTop = origTop + dy;
                // Clamp to viewport
                newLeft = Math.max(0, Math.min(window.innerWidth - popup.offsetWidth, newLeft));
                newTop = Math.max(0, Math.min(window.innerHeight - popup.offsetHeight, newTop));
                popup.style.left = newLeft + 'px';
                popup.style.top = newTop + 'px';
                popup.style.right = 'auto';
                popup.style.bottom = 'auto';
            }
            function onEnd() {
                dragging = false;
                popup.style.transition = '';
            }

            handle.addEventListener('mousedown', onStart);
            handle.addEventListener('touchstart', onStart, { passive: true });
            document.addEventListener('mousemove', onMove);
            document.addEventListener('touchmove', onMove, { passive: false });
            document.addEventListener('mouseup', onEnd);
            document.addEventListener('touchend', onEnd);
        }

        // ---- Popup Resize ----
        function initBookPopupResize() {
            const popup = document.getElementById('book-reader-popup');
            const handle = document.getElementById('book-popup-resize');
            let resizing = false, startX, startY, origW, origH, origLeft, origTop;

            function onStart(e) {
                resizing = true;
                const ev = e.touches ? e.touches[0] : e;
                startX = ev.clientX;
                startY = ev.clientY;
                const rect = popup.getBoundingClientRect();
                origW = rect.width;
                origH = rect.height;
                origLeft = rect.left;
                origTop = rect.top;
                popup.style.transition = 'none';
                e.preventDefault();
                e.stopPropagation();
            }
            function onMove(e) {
                if (!resizing) return;
                e.preventDefault();
                const ev = e.touches ? e.touches[0] : e;
                const dx = ev.clientX - startX; // negative = wider (dragging left)
                const dy = ev.clientY - startY; // negative = taller (dragging up)
                let newW = Math.max(260, origW - dx);
                let newH = Math.max(300, origH - dy);
                newW = Math.min(newW, window.innerWidth);
                newH = Math.min(newH, window.innerHeight);
                let newLeft = origLeft + dx;
                let newTop = origTop + dy;
                if (newLeft < 0) { newLeft = 0; newW = origLeft + origW; }
                if (newTop < 0) { newTop = 0; newH = origTop + origH; }
                popup.style.width = newW + 'px';
                popup.style.height = newH + 'px';
                popup.style.left = newLeft + 'px';
                popup.style.top = newTop + 'px';
                popup.style.right = 'auto';
                popup.style.bottom = 'auto';
            }
            function onEnd() {
                if (!resizing) return;
                resizing = false;
                popup.style.transition = '';
                // Re-paginate if in page mode (uses cached content)
                if (_readerSettings.mode === 'page' && currentReadBookId && _currentBookContent) {
                    renderBookContent();
                }
            }

            handle.addEventListener('mousedown', onStart);
            handle.addEventListener('touchstart', onStart, { passive: false });
            document.addEventListener('mousemove', onMove);
            document.addEventListener('touchmove', onMove, { passive: false });
            document.addEventListener('mouseup', onEnd);
            document.addEventListener('touchend', onEnd);
        }

        function jumpToBookProgress() {
            if (_readerSettings.mode === 'page') {
                const total = _readerPages.length;
                showPromptModal('输入跳转页码 (1-' + total + '):', String(_readerCurrentPage + 1)).then(function(pctStr) {
                    if (pctStr === null) return;
                    const page = Math.max(1, Math.min(total, parseInt(pctStr) || 1)) - 1;
                    showPage(page);
                    document.getElementById('book-reader-settings').style.display = 'none';
                });
            } else {
                showPromptModal('输入跳转百分比 (0-100):', '0').then(function(pctStr) {
                    if (pctStr === null) return;
                    const pct = Math.max(0, Math.min(100, parseInt(pctStr) || 0)) / 100;
                    const contentEl = document.getElementById('book-reader-content');
                    contentEl.scrollTop = pct * (contentEl.scrollHeight - contentEl.clientHeight);
                    document.getElementById('book-reader-settings').style.display = 'none';
                });
            }
        }

        function shareBookToChat() {
            if (!currentReadBookId) return;
            const book = (store.books || []).find(b => b.id === currentReadBookId);
            if (!book || !activeChatId) return toast('请先打开一个聊天');
            if (!store.chats[activeChatId]) store.chats[activeChatId] = [];
            store.chats[activeChatId].push({
                sender: 'me',
                type: 'text',
                content: `📖 分享书籍：《${book.name}》${book.author ? ' - ' + book.author : ''}`,
                time: Date.now()
            });
            save();
            if (document.getElementById('layer-chat').classList.contains('show')) renderHistory();
            document.getElementById('book-reader-settings').style.display = 'none';
            toast('已分享到聊天');
        }

        // ---- READ TOGETHER ----
        function openReadTogetherPicker() {
            closeExtMenu();
            const books = store.books || [];
            const list = document.getElementById('read-together-book-list');
            if (books.length === 0) {
                list.innerHTML = '<div style="text-align:center;padding:40px 20px;">' +
                    '<div style="font-size:13px;color:#aaa;margin-bottom:16px;letter-spacing:0.5px;">还没有书籍</div>' +
                    '<button onclick="if(typeof bsShowUpload===\'function\') bsShowUpload(); else if(typeof renderBookstoreHome===\'function\') renderBookstoreHome();" style="padding:8px 22px;background:#1a1a1a;color:#fff;border:none;border-radius:2px;font-size:12px;cursor:pointer;letter-spacing:0.5px;">去书城上传</button>' +
                '</div>';
            } else {
                list.innerHTML = books.map(b => `<div class="rt-book-item" onclick="startReadTogether('${b.id}')">
                    <div class="rt-book-icon" style="font-family:Georgia,serif;font-style:italic;font-size:13px;color:#999;">册</div>
                    <div class="rt-book-name">${b.name}</div>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style="color:#ccc;flex-shrink:0;"><path d="M5 2l5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </div>`).join('');
            }
            document.getElementById('modal-read-together').style.display = 'flex';
        }

        function startReadTogether(bookId) {
            const book = (store.books || []).find(b => b.id === bookId);
            if (!book) return;
            const partnerId = activeChatId || null;
            if (!store.bookProgress) store.bookProgress = {};
            store.readState = {
                active: true,
                partnerId,
                bookId: book.id,
                bookName: book.name,
                progress: store.bookProgress[book.id] || 0, // restore existing per-book progress
                startTime: Date.now()
            };
            save();
            document.getElementById('modal-read-together').style.display = 'none';

            // Show float ball
            document.getElementById('read-float-ball').style.display = 'flex';
            document.getElementById('read-float-name').textContent = book.name;
            updateReadFloatInfo();
            toast(`开始共读《${book.name}》`);

            // Send a message to chat
            if (activeChatId) {
                if (!store.chats[activeChatId]) store.chats[activeChatId] = [];
                store.chats[activeChatId].push({
                    sender: 'me',
                    type: 'text',
                    content: `📖 邀请你一起阅读《${book.name}》`,
                    time: Date.now()
                });
                save();
                renderHistory();
            }
        }

        function stopReadTogether() {
            store.readState = { active: false, partnerId: null, bookId: null, bookName: '', progress: 0, startTime: 0 };
            save();
            document.getElementById('read-float-ball').style.display = 'none';
            document.getElementById('read-float-panel').style.display = 'none';
            const chatBanner = document.getElementById('chat-read-banner');
            if (chatBanner) chatBanner.style.display = 'none';
            // [PERF] 共读结束时清除缓存
            _currentBookContent = '';
            _currentBookContentLength = 0;
            _currentBookRawData = null;
            toast('已结束共读');
        }

        function openReadFloatPanel() {
            updateReadFloatInfo();
            document.getElementById('read-float-ball').style.display = 'none';
            document.getElementById('read-float-panel').style.display = 'block';
        }

        function minimizeReadPanel() {
            document.getElementById('read-float-panel').style.display = 'none';
            document.getElementById('read-float-ball').style.display = 'flex';
        }

        function updateReadFloatInfo() {
            if (!store.readState || !store.readState.active) return;
            const book = (store.books || []).find(b => b.id === store.readState.bookId);
            if (!book) return;
            document.getElementById('read-float-book-name').textContent = `《${book.name}》`;
            // [PERF] 使用 contentLength 而非 content.length
            const totalLen = book.contentLength || _currentBookContentLength || 0;
            if (!store.bookProgress) store.bookProgress = {};
            const progress = store.bookProgress[book.id] || store.readState.progress || 0;
            const pct = totalLen > 0 ? Math.round((progress / totalLen) * 100) : 0;
            document.getElementById('read-float-progress').textContent = `阅读进度: ${pct}%`;
            // [PERF] snippet 使用运行时缓存（如果有的话），否则显示进度百分比
            if (_currentBookContent && store.readState.bookId === currentReadBookId) {
                const snippet = _currentBookContent.substring(Math.max(0, progress - 50), progress + 200).trim();
                document.getElementById('read-float-snippet').textContent = snippet || '(开始阅读...)';
            } else {
                document.getElementById('read-float-snippet').textContent = pct > 0 ? `已读 ${pct}%` : '(开始阅读...)';
            }
            // Also update chat banner if open
            if (typeof updateChatReadBanner === 'function' && activeChatId) {
                updateChatReadBanner(activeChatId);
            }
        }

        function openReadFromFloat() {
            document.getElementById('read-float-panel').style.display = 'none';
            document.getElementById('read-float-ball').style.display = 'flex';
            if (store.readState && store.readState.bookId) {
                openBookReader(store.readState.bookId);
            }
        }

        // Restore read state on load
        function restoreReadState() {
            if (store.readState && store.readState.active && store.readState.bookId) {
                const book = (store.books || []).find(b => b.id === store.readState.bookId);
                if (book) {
                    document.getElementById('read-float-ball').style.display = 'flex';
                    document.getElementById('read-float-name').textContent = book.name;
                }
            }
        }

        // ---- DRAG SUPPORT FOR FLOAT PANEL ----
        function initFloatPanelDrag() {
            const panel = document.getElementById('read-float-panel');
            const handle = document.getElementById('read-float-panel-drag-handle');
            if (!panel || !handle) return;

            let isDragging = false, startX, startY, origX, origY;

            handle.addEventListener('mousedown', startDrag);
            handle.addEventListener('touchstart', startDrag, { passive: false });

            function startDrag(e) {
                if (e.target.closest('span[onclick]')) return; // Don't drag on buttons
                isDragging = true;
                const touch = e.touches ? e.touches[0] : e;
                startX = touch.clientX;
                startY = touch.clientY;
                const rect = panel.getBoundingClientRect();
                origX = rect.left;
                origY = rect.top;
                panel.style.transition = 'none';
                e.preventDefault();
            }

            document.addEventListener('mousemove', onDrag);
            document.addEventListener('touchmove', onDrag, { passive: false });

            function onDrag(e) {
                if (!isDragging) return;
                const touch = e.touches ? e.touches[0] : e;
                const dx = touch.clientX - startX;
                const dy = touch.clientY - startY;
                panel.style.left = (origX + dx) + 'px';
                panel.style.top = (origY + dy) + 'px';
                panel.style.right = 'auto';
                panel.style.bottom = 'auto';
                e.preventDefault();
            }

            document.addEventListener('mouseup', endDrag);
            document.addEventListener('touchend', endDrag);

            function endDrag() {
                if (isDragging) {
                    isDragging = false;
                    panel.style.transition = '';
                }
            }
        }

        // [FIX-共读浮球拖动] 给共读浮球添加拖动支持（区分拖动和点击）
        function initReadFloatBallDrag() {
            const ball = document.getElementById('read-float-ball');
            if (!ball) return;
            let isDragging = false, moved = false, startX, startY, origX, origY;

            ball.addEventListener('touchstart', function(e) {
                const ev = e.touches[0];
                const rect = ball.getBoundingClientRect();
                startX = ev.clientX; startY = ev.clientY;
                origX = rect.left; origY = rect.top;
                moved = false;
                isDragging = true;
            }, { passive: true });

            ball.addEventListener('touchmove', function(e) {
                if (!isDragging) return;
                const ev = e.touches[0];
                const dx = ev.clientX - startX, dy = ev.clientY - startY;
                if (Math.abs(dx) > 5 || Math.abs(dy) > 5) moved = true;
                if (!moved) return;
                e.preventDefault();
                let newLeft = Math.max(0, Math.min(window.innerWidth - ball.offsetWidth, origX + dx));
                let newTop = Math.max(0, Math.min(window.innerHeight - ball.offsetHeight, origY + dy));
                ball.style.position = 'fixed';
                ball.style.left = newLeft + 'px';
                ball.style.top = newTop + 'px';
                ball.style.right = 'auto';
                ball.style.bottom = 'auto';
            }, { passive: false });

            ball.addEventListener('touchend', function() {
                isDragging = false;
            });

            // 鼠标拖动支持
            ball.addEventListener('mousedown', function(e) {
                const rect = ball.getBoundingClientRect();
                startX = e.clientX; startY = e.clientY;
                origX = rect.left; origY = rect.top;
                moved = false;
                isDragging = true;
                e.preventDefault();
            });

            document.addEventListener('mousemove', function(e) {
                if (!isDragging) return;
                const dx = e.clientX - startX, dy = e.clientY - startY;
                if (Math.abs(dx) > 5 || Math.abs(dy) > 5) moved = true;
                if (!moved) return;
                let newLeft = Math.max(0, Math.min(window.innerWidth - ball.offsetWidth, origX + dx));
                let newTop = Math.max(0, Math.min(window.innerHeight - ball.offsetHeight, origY + dy));
                ball.style.position = 'fixed';
                ball.style.left = newLeft + 'px';
                ball.style.top = newTop + 'px';
                ball.style.right = 'auto';
                ball.style.bottom = 'auto';
            });

            document.addEventListener('mouseup', function() {
                isDragging = false;
            });

            // 重写onclick：只有非拖动时才打开面板
            ball.onclick = function(e) {
                if (moved) { e.preventDefault(); e.stopPropagation(); return; }
                openReadFloatPanel();
            };
        }

        // [FIX-阅读胶囊拖动] 给最小化阅读器药丸添加拖动支持（区分拖动和点击）
        function initBookReaderMiniDrag() {
            const mini = document.getElementById('book-reader-mini');
            if (!mini) return;
            let isDragging = false, moved = false, startX, startY, origX, origY;

            mini.addEventListener('touchstart', function(e) {
                const ev = e.touches[0];
                const rect = mini.getBoundingClientRect();
                startX = ev.clientX; startY = ev.clientY;
                origX = rect.left; origY = rect.top;
                moved = false;
                isDragging = true;
            }, { passive: true });

            mini.addEventListener('touchmove', function(e) {
                if (!isDragging) return;
                const ev = e.touches[0];
                const dx = ev.clientX - startX, dy = ev.clientY - startY;
                if (Math.abs(dx) > 5 || Math.abs(dy) > 5) moved = true;
                if (!moved) return;
                e.preventDefault();
                let newLeft = Math.max(0, Math.min(window.innerWidth - mini.offsetWidth, origX + dx));
                let newTop = Math.max(0, Math.min(window.innerHeight - mini.offsetHeight, origY + dy));
                mini.style.position = 'fixed';
                mini.style.left = newLeft + 'px';
                mini.style.top = newTop + 'px';
                mini.style.right = 'auto';
                mini.style.bottom = 'auto';
            }, { passive: false });

            mini.addEventListener('touchend', function() {
                isDragging = false;
            });

            // 鼠标拖动支持
            mini.addEventListener('mousedown', function(e) {
                const rect = mini.getBoundingClientRect();
                startX = e.clientX; startY = e.clientY;
                origX = rect.left; origY = rect.top;
                moved = false;
                isDragging = true;
                e.preventDefault();
            });

            document.addEventListener('mousemove', function(e) {
                if (!isDragging) return;
                const dx = e.clientX - startX, dy = e.clientY - startY;
                if (Math.abs(dx) > 5 || Math.abs(dy) > 5) moved = true;
                if (!moved) return;
                let newLeft = Math.max(0, Math.min(window.innerWidth - mini.offsetWidth, origX + dx));
                let newTop = Math.max(0, Math.min(window.innerHeight - mini.offsetHeight, origY + dy));
                mini.style.position = 'fixed';
                mini.style.left = newLeft + 'px';
                mini.style.top = newTop + 'px';
                mini.style.right = 'auto';
                mini.style.bottom = 'auto';
            });

            document.addEventListener('mouseup', function() {
                isDragging = false;
            });

            // 重写onclick：只有非拖动时才恢复阅读器
            mini.onclick = function(e) {
                if (moved) { e.preventDefault(); e.stopPropagation(); return; }
                restoreBookReader();
            };
        }

        // Init drag on DOM ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() { initFloatPanelDrag(); initReadFloatBallDrag(); initBookReaderMiniDrag(); });
        } else {
            setTimeout(function() { initFloatPanelDrag(); initReadFloatBallDrag(); initBookReaderMiniDrag(); }, 100);
        }

        // Expose bookstore functions to global scope
        window.openBookStore = openBookStore;
        window.renderBookStore = renderBookStore;
        window.filterBookCate = filterBookCate;
        window.openBookCategoryModal = openBookCategoryModal;
        window.saveBookCategory = saveBookCategory;
        window.deleteBookCategory = deleteBookCategory;
        window.showBookCateMenu = showBookCateMenu;
        window.triggerBookUpload = triggerBookUpload;
        window.handleBookFileSelect = handleBookFileSelect;
        window.confirmBookUpload = confirmBookUpload;
        window.deleteBook = deleteBook;
        window.openBookReader = openBookReader;
        window.closeBookReader = closeBookReader;
        window.minimizeBookReader = minimizeBookReader;
        window.restoreBookReader = restoreBookReader;
        window.handleReaderTap = handleReaderTap;
        window.handleReaderTouchStart = handleReaderTouchStart;
        window.handleReaderTouchEnd = handleReaderTouchEnd;
        window.toggleBookReaderSettings = toggleBookReaderSettings;
        window.changeReaderFontSize = changeReaderFontSize;
        window.setReaderBg = setReaderBg;
        window.setReaderMode = setReaderMode;
        window.setReaderPageDir = setReaderPageDir;
        window.reloadBookWithEncoding = reloadBookWithEncoding;
        window.jumpToBookProgress = jumpToBookProgress;
        window.shareBookToChat = shareBookToChat;
        window.openReadTogetherPicker = openReadTogetherPicker;
        window.startReadTogether = startReadTogether;
        window.stopReadTogether = stopReadTogether;
        window.openReadFloatPanel = openReadFloatPanel;
        window.minimizeReadPanel = minimizeReadPanel;
        window.openReadFromFloat = openReadFromFloat;
        window.restoreReadState = restoreReadState;
        // Highlight functions
        window.hlPickColor = hlPickColor;
        window.hlDoHighlight = hlDoHighlight;
        window.hlDoHighlightWithNote = hlDoHighlightWithNote;
        window.hlShareToChat = hlShareToChat;
        window.showHlNotePopup = showHlNotePopup;
        window.closeHlNotePopup = closeHlNotePopup;
        window.editHlNote = editHlNote;
        window.shareHlToChat = shareHlToChat;
        window.deleteHighlight = deleteHighlight;
        // [PERF] 暴露迁移函数供外部调用
        window._migrateBookData = _migrateBookData;
