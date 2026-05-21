/**
 * app-html-popup.js — 世界书HTML弹窗独立支持模块
 * 
 * 功能：
 * 1. 关键词匹配触发弹窗 (checkWorldBookKeywords)
 * 2. HTML内容提取与清洗 (_extractHtmlFromMixed)
 * 3. 变量替换系统 ({{user}}, {{char}}, {{time}} 等 + 自定义 [VAR:key=value])
 * 4. 中文提示词 → AI生成HTML弹窗
 * 5. 纯HTML弹窗直接渲染（iframe Blob URL）
 * 6. 交互增强（触摸/点击/表单/滚动等完全支持）
 * 7. 弹窗关闭与资源释放
 * 8. CSS纯radio/checkbox交互自动修复
 * 
 * 依赖：store, save, activeChatId, API (来自 app-part1.js)
 */

// ============================================================
//  [1] 关键词匹配
// ============================================================
function checkWorldBookKeywords(message, contactId) {
    if (!message || !contactId) return [];
    var contact = store.contacts.find(function(c) { return c.id === contactId; });
    if (!contact) return [];

    var mountedWbIds = (contact.settings && contact.settings.mountedWbIds) || [];
    if (mountedWbIds.length === 0 && !(contact.settings && contact.settings.wb)) return [];

    var allMountedWbs = (store.worldbooks || []).filter(function(wb) {
        if (mountedWbIds.includes(wb.id)) return true;
        if (contact.settings && contact.settings.wb === wb.id) return true;
        return false;
    });

    var matches = [];
    var msgLower = message.toLowerCase();

    allMountedWbs.forEach(function(wb) {
        if (!wb.keywords || wb.keywords.length === 0 || !wb.htmlCode) return;
        wb.keywords.forEach(function(kw) {
            if (kw && msgLower.includes(kw.toLowerCase())) {
                if (!matches.find(function(m) { return m.wbId === wb.id; })) {
                    matches.push({ wbId: wb.id, wbName: wb.name, keyword: kw, htmlCode: wb.htmlCode });
                }
            }
        });
    });

    return matches;
}

// ============================================================
//  [2] HTML提取
// ============================================================
function _extractHtmlFromMixed(rawHtml) {
    var cleanHtml = rawHtml || '';

    // 步骤1：优先提取 ```html ... ``` 代码块
    var codeBlockMatch = cleanHtml.match(/```(?:html)?\s*\n?([\s\S]*?)```/i);
    if (codeBlockMatch) {
        cleanHtml = codeBlockMatch[1].trim();
    } else {
        // 步骤2：查找第一个HTML标签位置，截掉前面的纯文本
        var firstTagMatch = cleanHtml.match(/(<(!DOCTYPE|html|head|body|div|style|script|meta|link|section|nav|main|header|footer|table|form|input|button|canvas|svg|img|p|h[1-6]|ul|ol|li|span|a)[\s>]|<!DOCTYPE\s)/i);
        if (firstTagMatch && firstTagMatch.index > 0) {
            var prefix = cleanHtml.substring(0, firstTagMatch.index);
            if (!/<[a-zA-Z]/.test(prefix)) {
                cleanHtml = cleanHtml.substring(firstTagMatch.index);
            }
        }
    }

    // 步骤3：逐行过滤非HTML前缀
    if (cleanHtml && !/^\s*(<|<!)/i.test(cleanHtml)) {
        var lines = cleanHtml.split('\n');
        var htmlStartLine = -1;
        for (var i = 0; i < lines.length; i++) {
            var trimmed = lines[i].trim();
            if (trimmed.charAt(0) === '<') {
                htmlStartLine = i;
                break;
            }
        }
        if (htmlStartLine > 0) {
            cleanHtml = lines.slice(htmlStartLine).join('\n');
        }
    }

    // 步骤4：如果清理后为空或太短，回退到原始内容
    if (!cleanHtml || cleanHtml.trim().length < 5) {
        cleanHtml = rawHtml || '';
    }

    return cleanHtml;
}

// ============================================================
//  [3] 变量映射构建
// ============================================================
function _buildPopupVarMap(contactId) {
    var cid = contactId || (typeof activeChatId !== 'undefined' ? activeChatId : '');
    var contact = cid ? store.contacts.find(function(x) { return x.id === cid; }) : null;
    var userPersona = null;

    if (contact && contact.settings && contact.settings.userPersona) {
        userPersona = store.personas.find(function(p) { return p.id === contact.settings.userPersona; });
    }
    if (!userPersona && store.personas && store.personas.length > 0) {
        userPersona = store.personas[0];
    }

    var now = new Date();
    var timeStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    var dateStr = now.getFullYear() + '-' + (now.getMonth() + 1).toString().padStart(2, '0') + '-' + now.getDate().toString().padStart(2, '0');
    var weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    var weekdayStr = weekdays[now.getDay()];

    var recentChats = '';
    if (cid && store.chats && store.chats[cid]) {
        recentChats = store.chats[cid].slice(-5).map(function(m) {
            var sender = m.sender === 'me'
                ? (userPersona ? userPersona.name : '用户')
                : (contact ? contact.name : '角色');
            return sender + ': ' + (m.content || '[非文本消息]');
        }).join('\n');
    }

    var varMap = {
        'char': contact ? contact.name : '',
        'char_name': contact ? contact.name : '',
        'user': userPersona ? userPersona.name : (store.user && store.user.name ? store.user.name : '用户'),
        'user_name': userPersona ? userPersona.name : (store.user && store.user.name ? store.user.name : '用户'),
        'char_persona': contact ? (contact.persona || '') : '',
        'user_persona': userPersona ? (userPersona.desc || '') : '',
        'char_avatar': contact ? (contact.avatar || '') : '',
        'user_avatar': userPersona ? (userPersona.avatar || (store.user && store.user.avatar ? store.user.avatar : '')) : (store.user && store.user.avatar ? store.user.avatar : ''),
        'time': timeStr,
        'date': dateStr,
        'weekday': weekdayStr,
        'datetime': dateStr + ' ' + timeStr,
        'recent_chat': recentChats,
        'chat_count': (cid && store.chats && store.chats[cid]) ? store.chats[cid].length.toString() : '0'
    };

    // 挂载的世界书内容也作为变量 + 自定义变量 [VAR:key=value]
    if (contact && contact.settings && contact.settings.mountedWbIds) {
        var mountedWbs = (store.worldbooks || []).filter(function(w) {
            return contact.settings.mountedWbIds.includes(w.id);
        });
        mountedWbs.forEach(function(wb) {
            var safeKey = 'wb_' + (wb.name || '').replace(/[^\w\u4e00-\u9fff]/g, '_');
            varMap[safeKey] = wb.content || '';
            // 解析 [VAR:key=value] 自定义变量
            var varMatches = (wb.content || '').matchAll(/\[VAR:([\w]+)=([\s\S]*?)\]/gi);
            var iter = varMatches;
            var result = iter.next();
            while (!result.done) {
                var vm = result.value;
                varMap[vm[1].trim()] = vm[2].trim();
                result = iter.next();
            }
        });
    }

    return varMap;
}

// ============================================================
//  [4] 变量替换
// ============================================================
function _replacePopupVars(html, varMap) {
    return html.replace(/\{\{\s*([\w\u4e00-\u9fff]+)\s*\}\}/g, function(match, key) {
        return varMap[key] !== undefined ? varMap[key] : match;
    });
}

// ============================================================
//  [5] 交互增强脚本（注入到iframe中）
//      ★ v3: 不覆盖用户模板的背景色/文字色
//      ★ v3: 排除label/radio/checkbox/summary等原生交互元素，避免合成click干扰
// ============================================================
function _getInteractionEnhanceScript() {
    // 使用数组拼接避免转义问题
    var scriptLines = [];
    scriptLines.push('<scr' + 'ipt>');
    scriptLines.push('(function() {');
    scriptLines.push('  // 注入基础交互增强CSS（不覆盖背景色和文字色，避免破坏用户模板样式）');
    scriptLines.push('  var style = document.createElement("style");');
    scriptLines.push('  style.textContent = [');
    scriptLines.push('    "html, body { touch-action: manipulation; min-height: 100%; }",');
    scriptLines.push('    "* { -webkit-touch-callout: default; -webkit-user-select: auto; user-select: auto; box-sizing: border-box; }",');
    scriptLines.push('    "button, a, [onclick], [onmousedown], [onmouseup], [ontouchstart], [ontouchend], [role=\\\"button\\\"], [role=\\\"link\\\"], .clickable, .btn, [tabindex], [data-action], summary { touch-action: manipulation; -webkit-tap-highlight-color: rgba(0,0,0,0.1); cursor: pointer; }",');
    scriptLines.push('    "input, textarea, select, [contenteditable] { -webkit-user-select: text; user-select: text; touch-action: auto; }",');
    scriptLines.push('    "label { touch-action: manipulation; cursor: pointer; }",');
    scriptLines.push('    "[style*=\\\"overflow\\\"], [style*=\\\"scroll\\\"], .scroll, .scrollable { -webkit-overflow-scrolling: touch; touch-action: pan-y pan-x; }",');
    scriptLines.push('    "canvas { touch-action: none; }",');
    scriptLines.push('    "input[type=\\\"range\\\"] { touch-action: pan-x; }"');
    scriptLines.push('  ].join("\\n");');
    scriptLines.push('  (document.head || document.documentElement).appendChild(style);');
    scriptLines.push('');
    scriptLines.push('  // 追踪click事件是否由原生触发');
    scriptLines.push('  var _clickFired = false;');
    scriptLines.push('  document.addEventListener("touchstart", function() { _clickFired = false; }, {passive: true});');
    scriptLines.push('  document.addEventListener("click", function(e) {');
    scriptLines.push('    _clickFired = true;');
    scriptLines.push('    if (e.target) {');
    scriptLines.push('      e.target._lastNativeClick = Date.now();');
    scriptLines.push('      var p = e.target.parentElement, d = 5;');
    scriptLines.push('      while (p && d > 0) { p._lastNativeClick = Date.now(); p = p.parentElement; d--; }');
    scriptLines.push('    }');
    scriptLines.push('  }, true);');
    scriptLines.push('');
    scriptLines.push('  // touchend → 合成click（解决移动端交互延迟/不响应）');
    scriptLines.push('  // ★ 排除 label、radio、checkbox、details/summary 等原生交互元素');
    scriptLines.push('  //   这些元素的浏览器原生行为（如label关联radio切换）会被合成click干扰');
    scriptLines.push('  document.addEventListener("touchend", function(e) {');
    scriptLines.push('    var target = e.target;');
    scriptLines.push('    if (!target) return;');
    scriptLines.push('');
    scriptLines.push('    // ★ 跳过会被合成click干扰的原生交互元素');
    scriptLines.push('    var skipEl = target;');
    scriptLines.push('    var skipDepth = 5;');
    scriptLines.push('    while (skipEl && skipDepth > 0) {');
    scriptLines.push('      skipDepth--;');
    scriptLines.push('      var tn = skipEl.tagName;');
    scriptLines.push('      // label+for 关联 radio/checkbox 时，浏览器原生就会触发click');
    scriptLines.push('      if (tn === "LABEL" || tn === "SUMMARY" || tn === "DETAILS") return;');
    scriptLines.push('      if (tn === "INPUT") {');
    scriptLines.push('        var inputType = (skipEl.type || "").toLowerCase();');
    scriptLines.push('        if (inputType === "radio" || inputType === "checkbox" || inputType === "file") return;');
    scriptLines.push('      }');
    scriptLines.push('      skipEl = skipEl.parentElement;');
    scriptLines.push('    }');
    scriptLines.push('');
    scriptLines.push('    var el = target, isInteractive = false, maxDepth = 10;');
    scriptLines.push('    while (el && maxDepth > 0) {');
    scriptLines.push('      maxDepth--;');
    scriptLines.push('      if (el.tagName === "BUTTON" || el.tagName === "A" ||');
    scriptLines.push('          el.hasAttribute("onclick") || el.hasAttribute("onmousedown") ||');
    scriptLines.push('          el.hasAttribute("ontouchstart") || el.hasAttribute("ontouchend") ||');
    scriptLines.push('          el.hasAttribute("data-action") ||');
    scriptLines.push('          el.classList.contains("clickable") || el.classList.contains("btn") ||');
    scriptLines.push('          el.onclick || el.onmousedown) {');
    scriptLines.push('        isInteractive = true; break;');
    scriptLines.push('      }');
    scriptLines.push('      try { if (window.getComputedStyle(el).cursor === "pointer") { isInteractive = true; break; } } catch(ex) {}');
    scriptLines.push('      el = el.parentElement;');
    scriptLines.push('    }');
    scriptLines.push('    if (isInteractive) {');
    scriptLines.push('      var clickTarget = el || target;');
    scriptLines.push('      setTimeout(function() {');
    scriptLines.push('        if (_clickFired) return;');
    scriptLines.push('        if (clickTarget._lastNativeClick && (Date.now() - clickTarget._lastNativeClick < 300)) return;');
    scriptLines.push('        try {');
    scriptLines.push('          var touch = e.changedTouches && e.changedTouches[0];');
    scriptLines.push('          var clickEvt = new MouseEvent("click", { bubbles: true, cancelable: true, view: window, clientX: touch ? touch.clientX : 0, clientY: touch ? touch.clientY : 0 });');
    scriptLines.push('          clickEvt._synthesized = true;');
    scriptLines.push('          clickTarget.dispatchEvent(clickEvt);');
    scriptLines.push('        } catch(ex) {}');
    scriptLines.push('      }, 80);');
    scriptLines.push('    }');
    scriptLines.push('  }, {passive: true});');
    scriptLines.push('');
    scriptLines.push('  // DOM增强：为可交互元素添加tabindex');
    scriptLines.push('  var enhanceDom = function() {');
    scriptLines.push('    var els = document.querySelectorAll("[onclick]:not([tabindex]), [role=\\\"button\\\"]:not([tabindex])");');
    scriptLines.push('    for (var i = 0; i < els.length; i++) els[i].setAttribute("tabindex", "0");');
    scriptLines.push('  };');
    scriptLines.push('  enhanceDom();');
    scriptLines.push('  if (typeof MutationObserver !== "undefined") {');
    scriptLines.push('    new MutationObserver(function() { enhanceDom(); }).observe(document.body || document.documentElement, { childList: true, subtree: true });');
    scriptLines.push('  }');
    scriptLines.push('  setInterval(enhanceDom, 3000);');
    scriptLines.push('');
    scriptLines.push('  // 确保表单元素可以获得焦点');
    scriptLines.push('  document.addEventListener("click", function(e) {');
    scriptLines.push('    var t = e.target;');
    scriptLines.push('    if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT")) {');
    scriptLines.push('      setTimeout(function() { try { t.focus(); } catch(ex) {} }, 50);');
    scriptLines.push('    }');
    scriptLines.push('  }, true);');
    scriptLines.push('');
    scriptLines.push('  // 通知父窗口iframe已就绪');
    scriptLines.push('  try { window.parent.postMessage({ type: "yan-iframe-ready" }, "*"); } catch(ex) {}');
    scriptLines.push('})();');
    scriptLines.push('</scr' + 'ipt>');

    return scriptLines.join('\n');
}

// ============================================================
//  [5.5] CSS纯交互修复（自动修复常见的CSS选择器不匹配问题）
//        针对使用 input[type=radio/checkbox]:checked ~ 兄弟选择器
//        实现tab切换的HTML模板
// ============================================================
function _fixCssSiblingSelectors(html) {
    // 检测是否有CSS纯交互模式（radio/checkbox + ~ 兄弟选择器）
    var hasRadioCheckbox = /<input\s+[^>]*type\s*=\s*["']?(radio|checkbox)["']?/i.test(html);
    var hasSiblingSelector = /:\s*checked\s*~\s*\./i.test(html);
    if (!hasRadioCheckbox || !hasSiblingSelector) return html;

    // 提取所有CSS中 :checked~ 后面引用的class名
    var selectorRegex = /:\s*checked\s*~\s*\.([a-zA-Z0-9_-]+)/g;
    var referencedClasses = {};
    var match;
    while ((match = selectorRegex.exec(html)) !== null) {
        referencedClasses[match[1]] = true;
    }

    // 检查这些class是否在HTML中实际存在
    var classNames = Object.keys(referencedClasses);
    for (var i = 0; i < classNames.length; i++) {
        var cls = classNames[i];
        var classInHtmlRegex = new RegExp('class\\s*=\\s*["\'][^"\']*\\b' + cls.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '\\b[^"\']*["\']', 'i');
        if (!classInHtmlRegex.test(html)) {
            // 该class在CSS中被引用但在HTML中不存在
            // 尝试找到可能的正确class（相似名称的class）
            var allClassesRegex = /class\s*=\s*["']([^"']+)["']/gi;
            var allClasses = {};
            var cm;
            while ((cm = allClassesRegex.exec(html)) !== null) {
                var classList = cm[1].split(/\s+/);
                for (var j = 0; j < classList.length; j++) {
                    if (classList[j]) allClasses[classList[j]] = true;
                }
            }

            // 查找可能的匹配（包含关系或相似度）
            var actualClassNames = Object.keys(allClasses);
            for (var k = 0; k < actualClassNames.length; k++) {
                var actual = actualClassNames[k];
                // 检查CSS引用的class是否是HTML实际class的子串或反过来
                if (actual.indexOf(cls) !== -1 || cls.indexOf(actual) !== -1) {
                    continue; // 有部分匹配，可能是其他用途
                }
            }

            // 如果CSS中引用了 .screen-layer 但HTML中只有 .ym3-screen 这种情况
            // 我们需要更智能地处理：检查 ~ 选择器的上下文
            // 在CSS中替换不存在的class为实际存在的兄弟元素class
            console.log('[app-html-popup] CSS修复: class "' + cls + '" 在CSS中被 :checked~ 引用但在HTML中不存在');
        }
    }

    // ★ 核心修复：检测并修复 input[hidden]:checked ~ .xxx 选择器中 .xxx 与实际DOM不匹配的情况
    // 提取所有 :checked~.classname 中的 classname，并检查HTML中是否有对应的元素
    var styleBlocks = html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi);
    if (!styleBlocks) return html;

    for (var si = 0; si < styleBlocks.length; si++) {
        var styleContent = styleBlocks[si];
        var innerStyle = styleContent.replace(/<\/?style[^>]*>/gi, '');

        // 找到所有 #id:checked~.class 模式
        var checkedSiblingRegex = /(#[a-zA-Z0-9_-]+:checked\s*~\s*)\.([a-zA-Z0-9_-]+)/g;
        var replacements = {};
        var csMatch;

        while ((csMatch = checkedSiblingRegex.exec(innerStyle)) !== null) {
            var targetClass = csMatch[2];
            // 检查这个class是否在HTML中存在
            var classExistsRegex = new RegExp('class\\s*=\\s*["\'][^"\']*\\b' + targetClass.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '\\b', 'i');
            if (!classExistsRegex.test(html)) {
                // 找radio/checkbox input的ID
                var inputIdMatch = csMatch[1].match(/#([a-zA-Z0-9_-]+)/);
                if (inputIdMatch) {
                    var inputId = inputIdMatch[1];
                    // 找到这个input在HTML中的位置，然后找它的兄弟元素
                    var inputRegex = new RegExp('id\\s*=\\s*["\']' + inputId.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '["\']', 'i');
                    if (inputRegex.test(html)) {
                        // 找这些input的共同父容器下的其他子元素的class
                        // 通过分析HTML结构找到正确的目标class
                        var allDivClasses = [];
                        var divClassRegex = /<div\s+[^>]*class\s*=\s*["']([^"']+)["'][^>]*>/gi;
                        var dcm;
                        while ((dcm = divClassRegex.exec(html)) !== null) {
                            var classes = dcm[1].split(/\s+/);
                            for (var ci = 0; ci < classes.length; ci++) {
                                if (classes[ci] && allDivClasses.indexOf(classes[ci]) === -1) {
                                    allDivClasses.push(classes[ci]);
                                }
                            }
                        }

                        // 在所有div class中找和目标class最相似的
                        // 特别处理 "screen-layer" vs "ym3-screen" 这种常见情况
                        for (var di = 0; di < allDivClasses.length; di++) {
                            var candidate = allDivClasses[di];
                            // 检查候选class是否包含 "screen" 等关键词
                            var targetWords = targetClass.toLowerCase().split(/[-_]/);
                            var candidateWords = candidate.toLowerCase().split(/[-_]/);
                            var commonWords = 0;
                            for (var tw = 0; tw < targetWords.length; tw++) {
                                for (var cw = 0; cw < candidateWords.length; cw++) {
                                    if (targetWords[tw] === candidateWords[cw] && targetWords[tw].length > 2) {
                                        commonWords++;
                                    }
                                }
                            }
                            if (commonWords > 0 && !replacements[targetClass]) {
                                replacements[targetClass] = candidate;
                                console.log('[app-html-popup] CSS自动修复: .' + targetClass + ' → .' + candidate);
                            }
                        }
                    }
                }
            }
        }

        // 应用CSS替换
        var keys = Object.keys(replacements);
        if (keys.length > 0) {
            var newStyle = innerStyle;
            for (var ri = 0; ri < keys.length; ri++) {
                var oldClass = keys[ri];
                var newClass = replacements[oldClass];
                // 只替换 :checked~ 上下文中的class引用
                var replaceRegex = new RegExp('(:\\s*checked\\s*~\\s*)\\.' + oldClass.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '\\b', 'g');
                newStyle = newStyle.replace(replaceRegex, '$1.' + newClass);
            }
            if (newStyle !== innerStyle) {
                var newStyleBlock = styleBlocks[si].replace(innerStyle, newStyle);
                html = html.replace(styleBlocks[si], newStyleBlock);
            }
        }
    }

    return html;
}

// ============================================================
//  [6] 渲染HTML到iframe（核心渲染函数）
// ============================================================
function _renderHtmlPopupContent(cleanHtml, contactId, container, overlay, title) {
    // 构建变量映射并替换
    var varMap = _buildPopupVarMap(contactId);
    cleanHtml = _replacePopupVars(cleanHtml, varMap);

    // ★ 自动修复CSS纯交互选择器不匹配问题
    cleanHtml = _fixCssSiblingSelectors(cleanHtml);

    // 注入交互增强脚本
    var interactionScript = _getInteractionEnhanceScript();
    var enhancedHtml = cleanHtml;

    if (enhancedHtml.indexOf('</body>') !== -1) {
        enhancedHtml = enhancedHtml.replace('</body>', interactionScript + '</body>');
    } else if (enhancedHtml.indexOf('</html>') !== -1) {
        enhancedHtml = enhancedHtml.replace('</html>', interactionScript + '</html>');
    } else {
        enhancedHtml += interactionScript;
    }

    // 确保HTML有基本结构（如果没有完整的html/body标签）
    if (enhancedHtml.indexOf('<html') === -1 && enhancedHtml.indexOf('<HTML') === -1) {
        enhancedHtml = '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no"></head><body style="margin:0;padding:0;">' + enhancedHtml + '</body></html>';
    }

    // 使用Blob URL渲染iframe
    try {
        // 清除旧iframe和Blob URL
        var oldIframe = container.querySelector('iframe');
        if (oldIframe && oldIframe.src && oldIframe.src.indexOf('blob:') === 0) {
            URL.revokeObjectURL(oldIframe.src);
        }
        container.innerHTML = '';

        var blob = new Blob([enhancedHtml], { type: 'text/html; charset=utf-8' });
        var blobUrl = URL.createObjectURL(blob);

        var iframe = document.createElement('iframe');
        iframe.src = blobUrl;
        iframe.style.cssText = 'width:100%;height:100%;border:none;border-radius:0 0 12px 12px;display:block;background:transparent;';
        // sandbox权限全面开放，确保交互可用
        iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-pointer-lock allow-orientation-lock allow-presentation allow-downloads allow-top-navigation-by-user-activation');
        iframe.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture; clipboard-write');

        // iframe加载完成后释放blob URL（延迟10秒确保复杂HTML完全加载）
        iframe.addEventListener('load', function() {
            setTimeout(function() { URL.revokeObjectURL(blobUrl); }, 10000);
            try { iframe.contentWindow.postMessage({ type: 'yan-popup-ready' }, '*'); } catch(e) {}
        });

        container.appendChild(iframe);
    } catch (e) {
        // 降级：使用srcdoc
        console.warn('[app-html-popup] Blob URL failed, falling back to srcdoc:', e);
        var escapedHtml = cleanHtml
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;');
        container.innerHTML = '<iframe srcdoc="' + escapedHtml + '" style="width:100%;height:100%;border:none;border-radius:0 0 12px 12px;background:transparent;" sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-pointer-lock allow-orientation-lock allow-presentation allow-downloads allow-top-navigation-by-user-activation"></iframe>';
    }

    // 显示弹窗
    overlay.classList.add('show');
    overlay.dataset.wbTitle = title || '';
    overlay.dataset.contactId = contactId || (typeof activeChatId !== 'undefined' ? activeChatId : '') || '';

    // 绑定overlay事件（只绑定一次）
    _bindPopupOverlayEvents(overlay);
}

// ============================================================
//  [7] 弹窗overlay事件绑定
// ============================================================
function _bindPopupOverlayEvents(overlay) {
    if (overlay._popupEventsBound) return;
    overlay._popupEventsBound = true;

    // [FIX] 不再点击overlay背景关闭弹窗，用户反馈弹窗太容易被误关
    // 只保留关闭按钮关闭弹窗，确保弹窗不退出就一直在

    // 阻止overlay和header的touchmove冒泡（防止底部页面滚动）
    overlay.addEventListener('touchmove', function(e) {
        if (e.target === overlay || (e.target.closest && e.target.closest('.wb-html-popup-header'))) {
            e.preventDefault();
        }
    }, { passive: false });

    // 确保关闭按钮始终可点击
    var closeBtn = overlay.querySelector('.wb-html-popup-close');
    if (closeBtn) {
        closeBtn.addEventListener('touchend', function(e) {
            e.preventDefault();
            e.stopPropagation();
            closeHtmlPopup();
        }, { passive: false });
        closeBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            closeHtmlPopup();
        }, false);
    }
}

// ============================================================
//  [8] 主入口：显示HTML弹窗
// ============================================================
function showHtmlPopup(htmlCode, title, contactId) {
    var overlay = document.getElementById('wb-html-popup-overlay');
    var container = document.getElementById('wb-html-popup-content');
    var titleEl = document.getElementById('wb-html-popup-title');
    if (!overlay || !container) {
        console.error('[app-html-popup] 弹窗DOM元素不存在，无法显示弹窗');
        return;
    }

    // 处理标题显示
    var displayTitle = (title || '').trim();
    if (displayTitle.indexOf('<') !== -1 || displayTitle.length > 40) {
        displayTitle = '';
    }
    if (titleEl) {
        titleEl.textContent = displayTitle;
        var header = titleEl.closest('.wb-html-popup-header');
        if (header) {
            header.style.display = displayTitle ? '' : 'none';
            var closeBtn = header.querySelector('.wb-html-popup-close');
            if (closeBtn && !displayTitle) {
                closeBtn.style.marginLeft = 'auto';
                header.style.display = 'flex';
                titleEl.style.display = 'none';
            } else if (closeBtn) {
                titleEl.style.display = '';
            }
        }
    }

    // 提前构建变量映射并替换模板变量（在所有路径之前）
    var earlyVarMap = _buildPopupVarMap(contactId);
    var rawHtml = _replacePopupVars(htmlCode || '', earlyVarMap);
    var trimmedRaw = rawHtml.trim();

    // 判断是纯HTML还是中文提示词（需要AI生成）
    var startsWithHtml = /^\s*(<|<!)/i.test(trimmedRaw);
    var hasHtmlTags = /<(div|style|script|html|body|head|section|button|input|form|canvas|svg|table|p|h[1-6]|ul|ol|span|a|img|meta|link)[\s>]/i.test(trimmedRaw);
    var hasChinesePrompt = /[\u4e00-\u9fff]/.test(trimmedRaw.substring(0, 50));

    // 只有纯中文提示词（无HTML标签）才走AI生成路径
    if (!startsWithHtml && hasChinesePrompt && !hasHtmlTags && store.system && store.system.key) {
        _showHtmlPopupViaAI(rawHtml, title, contactId, overlay, container);
        return;
    }

    // 纯HTML内容：直接提取并渲染
    var cleanHtml = _extractHtmlFromMixed(rawHtml);
    _renderHtmlPopupContent(cleanHtml, contactId, container, overlay, title);
}

// ============================================================
//  [9] AI生成HTML弹窗内容
// ============================================================
function _showHtmlPopupViaAI(rawHtml, title, contactId, overlay, container) {
    // 显示加载状态
    overlay.classList.add('show');
    container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;flex-direction:column;gap:12px;color:#999;"><i class="fas fa-spinner fa-spin" style="font-size:24px;color:var(--primary,#07c160);"></i><div style="font-size:14px;">正在生成弹窗内容...</div></div>';
    overlay.dataset.wbTitle = title || '';
    overlay.dataset.contactId = contactId || (typeof activeChatId !== 'undefined' ? activeChatId : '') || '';

    // 绑定overlay事件
    _bindPopupOverlayEvents(overlay);

    // 构建AI请求上下文
    var cid = contactId || (typeof activeChatId !== 'undefined' ? activeChatId : '');
    var contact = cid ? store.contacts.find(function(x) { return x.id === cid; }) : null;
    var userPersona = null;
    if (contact && contact.settings && contact.settings.userPersona) {
        userPersona = store.personas.find(function(p) { return p.id === contact.settings.userPersona; });
    }
    if (!userPersona && store.personas && store.personas.length > 0) {
        userPersona = store.personas[0];
    }

    var now = new Date();
    var contextInfo = '当前角色: ' + (contact ? contact.name : '未知') +
        '\n用户: ' + (userPersona ? userPersona.name : '用户') +
        '\n时间: ' + now.getFullYear() + '-' + (now.getMonth() + 1).toString().padStart(2, '0') + '-' + now.getDate().toString().padStart(2, '0') + ' ' + now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0') +
        '\n角色人设: ' + (contact ? (contact.persona || '无') : '无');

    // 获取世界书content内容作为AI指导信息
    var wbContentInfo = '';
    if (title) {
        var matchedWb = (store.worldbooks || []).find(function(wb) { return wb.name === title; });
        if (matchedWb && matchedWb.content && matchedWb.content.trim()) {
            wbContentInfo = '\n\n世界书设定（' + matchedWb.name + '）：\n' + matchedWb.content;
        }
    }

    // 获取最近聊天记录
    var recentMsgs = '';
    if (cid && store.chats && store.chats[cid]) {
        recentMsgs = store.chats[cid].slice(-8).map(function(m) {
            var sender = m.sender === 'me'
                ? (userPersona ? userPersona.name : '用户')
                : (contact ? contact.name : '角色');
            return sender + ': ' + (m.content || '[非文本消息]');
        }).join('\n');
    }

    var sysPrompt = '你是一个HTML弹窗内容生成器。用户会给你一段包含中文说明/指令和可能的HTML模板的内容。你需要根据中文指令生成完整的、可独立运行的HTML页面。\n\n' +
        '要求：\n' +
        '1. 生成的HTML必须是完整的，包含<!DOCTYPE html>、<html>、<head>、<body>标签\n' +
        '2. HTML必须可以在iframe中独立运行\n' +
        '3. 所有交互（按钮点击、表单输入、选项切换等）必须可以正常工作\n' +
        '4. 所有CSS样式直接写在<style>标签中，所有JavaScript直接写在<script>标签中\n' +
        '5. 样式要美观、现代化，适配移动端（使用相对单位和flexbox/grid布局）\n' +
        '6. 只输出HTML代码，不要输出任何解释性文字\n' +
        '7. 如果指令中提到角色信息，使用下面提供的上下文中的实际名字\n' +
        '8. 必须确保所有按钮、表单、交互元素都有对应的JavaScript事件处理\n' +
        '9. 页面背景设为白色，文字颜色设为深色，确保可读性\n' +
        '10. 所有交互反馈要即时可见（如点击按钮后有变化）\n' +
        '11. 如果使用CSS纯交互（radio/checkbox + :checked ~ 兄弟选择器），确保CSS选择器中的class名与HTML中的实际class完全一致\n\n' +
        '上下文信息：\n' + contextInfo + wbContentInfo + '\n\n' +
        '最近聊天记录：\n' + recentMsgs;

    // 调用AI API
    (function() {
        var _overlay = overlay;
        var _container = container;
        var _title = title;
        var _contactId = contactId;
        var _rawHtml = rawHtml;

        if (typeof API === 'undefined' || !API.chatCompletion) {
            console.error('[app-html-popup] API.chatCompletion不可用，降级为直接渲染');
            var fallbackHtml = _extractHtmlFromMixed(_rawHtml);
            _renderHtmlPopupContent(fallbackHtml, _contactId, _container, _overlay, _title);
            return;
        }

        API.chatCompletion([
            { role: 'system', content: sysPrompt },
            { role: 'user', content: _rawHtml }
        ], { temperature: 0.7 }).then(function(response) {
            var aiHtml = '';
            try {
                aiHtml = (response.choices[0].message.content || '').trim();
            } catch(e) {
                aiHtml = '';
            }

            // 从AI回复中提取HTML（可能被```包裹）
            var codeMatch = aiHtml.match(/```(?:html)?\s*\n?([\s\S]*?)```/i);
            if (codeMatch) {
                aiHtml = codeMatch[1].trim();
            }

            // 如果AI没有返回有效HTML，使用原始内容中的HTML部分
            if (!aiHtml || aiHtml.length < 10 || aiHtml.indexOf('<') === -1) {
                aiHtml = _extractHtmlFromMixed(_rawHtml);
            }

            // 渲染AI生成的HTML
            _renderHtmlPopupContent(aiHtml, _contactId, _container, _overlay, _title);

        }).catch(function(err) {
            console.error('[app-html-popup] AI generation failed:', err);
            // 降级：直接提取HTML部分渲染
            var fallbackHtml = _extractHtmlFromMixed(_rawHtml);
            if (fallbackHtml && fallbackHtml.trim().length > 10) {
                _renderHtmlPopupContent(fallbackHtml, _contactId, _container, _overlay, _title);
            } else {
                // 最终降级：显示错误信息和原始内容
                _container.innerHTML = '<div style="padding:20px;color:#333;font-size:14px;">' +
                    '<div style="color:#fa5151;margin-bottom:10px;font-weight:bold;">⚠ 弹窗生成失败</div>' +
                    '<div style="background:#f7f7f7;padding:12px;border-radius:8px;white-space:pre-wrap;word-break:break-all;font-size:12px;max-height:60vh;overflow-y:auto;">' +
                    (_rawHtml || '').replace(/</g, '&lt;').replace(/>/g, '&gt;') +
                    '</div></div>';
            }
        });
    })();
}

// ============================================================
//  [10] 关闭弹窗
// ============================================================
function closeHtmlPopup() {
    var overlay = document.getElementById('wb-html-popup-overlay');
    if (overlay) {
        overlay.classList.remove('show');
        overlay.style.display = '';  // 清除内联display样式，防止弹窗变白卡住

        // 释放Blob URL，避免内存泄漏
        var container = document.getElementById('wb-html-popup-content');
        if (container) {
            var iframe = container.querySelector('iframe');
            if (iframe && iframe.src && iframe.src.indexOf('blob:') === 0) {
                URL.revokeObjectURL(iframe.src);
            }
            container.innerHTML = '';
        }
    }
}

// ============================================================
//  [11] 监听来自iframe的postMessage通信
// ============================================================
window.addEventListener('message', function(e) {
    if (!e.data) return;

    // iframe通知就绪
    if (e.data.type === 'yan-iframe-ready') {
        console.log('[app-html-popup] iframe内容已就绪');
    }

    // iframe请求关闭弹窗
    if (e.data.type === 'yan-close-popup' || e.data.type === 'close-popup') {
        closeHtmlPopup();
    }

    // iframe请求保存数据到store
    if (e.data.type === 'yan-save-data' && e.data.key && e.data.value !== undefined) {
        try {
            var overlay = document.getElementById('wb-html-popup-overlay');
            var cid = overlay ? overlay.dataset.contactId : '';
            if (cid) {
                var contact = store.contacts.find(function(c) { return c.id === cid; });
                if (contact) {
                    if (!contact.popupData) contact.popupData = {};
                    contact.popupData[e.data.key] = e.data.value;
                    if (typeof save === 'function') save();
                }
            }
        } catch(err) {
            console.error('[app-html-popup] save-data error:', err);
        }
    }

    // iframe请求读取数据
    if (e.data.type === 'yan-read-data' && e.data.key) {
        try {
            var overlay2 = document.getElementById('wb-html-popup-overlay');
            var cid2 = overlay2 ? overlay2.dataset.contactId : '';
            var value = null;
            if (cid2) {
                var contact2 = store.contacts.find(function(c) { return c.id === cid2; });
                if (contact2 && contact2.popupData) {
                    value = contact2.popupData[e.data.key];
                }
            }
            // 回复数据给iframe
            var container2 = document.getElementById('wb-html-popup-content');
            if (container2) {
                var iframe2 = container2.querySelector('iframe');
                if (iframe2 && iframe2.contentWindow) {
                    iframe2.contentWindow.postMessage({
                        type: 'yan-data-response',
                        key: e.data.key,
                        value: value
                    }, '*');
                }
            }
        } catch(err) {
            console.error('[app-html-popup] read-data error:', err);
        }
    }

    // iframe请求发送消息到聊天
    if (e.data.type === 'yan-send-message' && e.data.content) {
        try {
            var overlay3 = document.getElementById('wb-html-popup-overlay');
            var cid3 = overlay3 ? overlay3.dataset.contactId : '';
            if (cid3 && store.chats) {
                if (!store.chats[cid3]) store.chats[cid3] = [];
                store.chats[cid3].push({
                    sender: e.data.sender || 'system',
                    type: 'text',
                    content: e.data.content,
                    time: Date.now(),
                    isSystemNote: e.data.sender === 'system'
                });
                if (typeof save === 'function') save();
                // 如果当前正在查看该聊天，刷新聊天界面
                if (typeof activeChatId !== 'undefined' && activeChatId === cid3 && typeof renderHistory === 'function') {
                    renderHistory();
                }
            }
        } catch(err) {
            console.error('[app-html-popup] send-message error:', err);
        }
    }

    // iframe请求显示toast
    if (e.data.type === 'yan-toast' && e.data.message) {
        if (typeof showToast === 'function') {
            showToast(e.data.message, e.data.toastType || 'success');
        }
    }
});

console.log('[app-html-popup] 世界书HTML弹窗模块已加载 (v3: CSS交互修复+注入优化)');
