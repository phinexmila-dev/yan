        // ===== 锁手机功能（联系人查岗系统）- 黑白灰UI =====
        // [OPT-单次API] preGenerated: 一次API调用预生成全部内容，后续交互0调用
        // [FIX-冷却] lastDismissTime: 用户回应查岗后的冷却时间戳，10分钟内不再触发新查岗
        var _phoneLockState = { cheating: false, cheatTimer: null, lockedUntilMorning: false, lockPassword: '', lockHint: '', lockContactId: '', preGenerated: null, lastDismissTime: 0 };

        function _initPhoneLockCheck() {
            if(_phoneLockTimer) clearInterval(_phoneLockTimer);
            // 检查是否有未解除的锁屏（持久化）
            if(store._phoneLockPersist && store._phoneLockPersist.locked) {
                var now = new Date();
                // [FIX-锁手机设置] 恢复锁屏前先检查联系人是否仍开启了锁手机功能
                var _persistContact = store.contacts.find(function(x){return x.id===store._phoneLockPersist.contactId;});
                if(!_persistContact || !_persistContact.settings || !_persistContact.settings.phoneLockEnabled) {
                    // 联系人已关闭锁手机或联系人不存在，清除持久化锁
                    store._phoneLockPersist = null; save();
                } else if(now.getHours() >= 6 && now.getHours() < 23) {
                    // 早上6点后自动解锁
                    store._phoneLockPersist = null; save();
                } else {
                    // 仍在锁定期间且设置开启，恢复锁屏
                    _phoneLockState.lockPassword = store._phoneLockPersist.password;
                    _phoneLockState.lockHint = store._phoneLockPersist.hint;
                    _phoneLockState.lockContactId = _persistContact.id;
                    setTimeout(function(){ _showPhoneLockScreen(_persistContact); }, 500);
                }
            }
            _phoneLockTimer = setInterval(function() {
                if(_phoneLockShowing) return;
                // [FIX-冷却] 用户回应查岗后10分钟内不再触发新查岗，避免频繁消耗API
                if(Date.now() - _phoneLockState.lastDismissTime < 10 * 60 * 1000) return;
                // [FIX-上传锁屏] 文件上传期间不触发查岗锁屏
                if(window._isUploadingFile) return;
                if(!activeChatId) return;
                var c = store.contacts.find(function(x){return x.id===activeChatId;});
                if(!c || !c.settings || !c.settings.phoneLockEnabled) return;
                var now = new Date();
                var hour = now.getHours();
                if(hour >= 6 && hour < 23) return;
                if(Math.random() > 0.15) return;
                var chatLayer = document.getElementById('layer-chat');
                var desktopLayer = document.getElementById('layer-desktop');
                var isUsingApp = (chatLayer && chatLayer.classList.contains('show')) || (desktopLayer && desktopLayer.classList.contains('show'));
                if(!isUsingApp) return;
                _showPhoneLockPopup(c);
            }, 30000);
        }
        
        // [清理] _getOfflineQuestion 离线查岗问题池已移除：API 失败/未配置就不查岗

        async function _showPhoneLockPopup(contact) {
            if(_phoneLockShowing) return;
            var name = contact.name || 'TA';
            var avatar = contact.avatar || _ph(60);
            var persona = contact.persona || '';
            var now = new Date();
            var hour = now.getHours();
            var timeDesc = hour >= 23 || hour < 2 ? '深夜了' : hour >= 2 && hour < 5 ? '都凌晨了' : '这么早';

            // [清理] 必须有API才查岗，没有API直接放弃本次查岗
            if (!(typeof API !== 'undefined' && API && API.chatCompletion && store.system && store.system.key)) {
                return;
            }

            // [OPT-单次API] 一次API调用预生成全部内容（查岗问题+晚安话+生气话+锁屏密码+提示语）
            // 后续用户交互直接使用缓存，不再调用API
            try {
                var prompt = '你是"' + name + '"，人设：' + persona.substring(0, 300) + '。\n\n现在是' + timeDesc + '，你发现对方还在玩手机没睡觉。\n请一次性输出以下内容，严格按JSON格式，不要输出其他任何内容：\n{\n  "question": "查岗/催睡的话（15-40字，符合你性格）",\n  "goodReply": "对方答应睡了，你说的温柔晚安话（10-25字）",\n  "badReply": "对方不听话，你生气的话+表示要改密码（15-35字）",\n  "password": "4-6位纯数字锁屏密码（有创意，和你们关系相关，不要用520/1314等常见密码）",\n  "hint": "密码提示语（符合你性格，5-15字）"\n}';
                var data = await API.chatCompletion([{ role: 'user', content: prompt }], { temperature: 0.9, maxTokens: 300, silent: true });
                var aiText = (data.choices[0].message.content || '').trim();
                var jsonMatch = aiText.match(/\{[\s\S]*\}/);
                if (!jsonMatch) {
                    console.warn('[PhoneLock] AI返回非JSON，放弃本次查岗:', aiText.substring(0, 100));
                    return;
                }
                var parsed = JSON.parse(jsonMatch[0]);
                // 验证必要字段
                if (!parsed.question || parsed.question.length < 3 || parsed.question.length > 100) {
                    console.warn('[PhoneLock] question字段异常，放弃:', parsed.question);
                    return;
                }
                // 密码字段容错：如果AI没输出合法密码，用随机4位数兜底
                if (!parsed.password || !/^\d{4,6}$/.test(parsed.password)) {
                    parsed.password = String(1000 + Math.floor(Math.random() * 9000));
                    parsed.hint = parsed.hint || '猜猜看~';
                }
                if (!parsed.goodReply || parsed.goodReply.length < 2) parsed.goodReply = '乖，快去睡吧，明天见~';
                if (!parsed.badReply || parsed.badReply.length < 2) parsed.badReply = '哼，不听话是吧？那我改你锁屏密码了！';
                if (!parsed.hint || parsed.hint.length < 1) parsed.hint = '想想我们的关系~';

                // 缓存预生成结果
                _phoneLockState.preGenerated = parsed;

            } catch(e) {
                console.warn('[PhoneLock] AI预生成失败，放弃本次查岗:', e);
                return;
            }
            _phoneLockShowing = true;

            _injectPhoneLockCSS();
            var overlay = document.createElement('div');
            overlay.id = 'phone-lock-overlay';
            overlay.className = 'pl-overlay';
            overlay.innerHTML = '<div class="pl-popup">' +
                '<div class="pl-avatar-wrap"><img src="' + avatar + '" class="pl-avatar"></div>' +
                '<div class="pl-name">' + name + '</div>' +
                '<div class="pl-question">' + _phoneLockState.preGenerated.question + '</div>' +
                '<input type="text" id="pl-user-reply" class="pl-input" placeholder="输入你的回答...">' +
                '<button onclick="window._handlePhoneLockReply(\'custom\')" class="pl-btn-submit">发送回答</button>' +
                '<div class="pl-preset-btns">' +
                    '<button onclick="window._handlePhoneLockReply(\'good\')" class="pl-btn pl-btn-good">对不起，我马上睡</button>' +
                    '<button onclick="window._handlePhoneLockReply(\'bad\')" class="pl-btn pl-btn-bad">就再玩一会儿...</button>' +
                '</div>' +
            '</div>';
            document.body.appendChild(overlay);
            overlay.addEventListener('click', function(e) {
                if(e.target === overlay) {
                    var box = overlay.querySelector('.pl-popup');
                    if(box) { box.style.animation = 'phoneLockShake 0.3s ease'; setTimeout(function(){ box.style.animation = ''; }, 300); }
                }
            });
        }
        
        // [清理] _generateLockPasswordOffline 离线密码池已移除：API 失败就不上锁

        // AI生成锁屏密码（根据人设动态生成），失败返回 null
        async function _generateLockPassword(contact) {
            var persona = contact.persona || '';
            var name = contact.name || 'TA';
            if (typeof API === 'undefined' || !API || !API.chatCompletion || !store.system || !store.system.key) {
                return null;
            }
            try {
                var prompt = '你是"' + name + '"，人设：' + persona.substring(0, 300) + '。\n\n现在你要给对方的手机设一个锁屏密码（4-6位纯数字），并给一个符合你性格的提示语。\n要求：\n1. 密码要有创意，和你们的关系、人设、共同记忆相关\n2. 提示语要有角色感，符合你的说话风格\n3. 每次密码都要不一样，不要用520/1314这种太常见的\n\n严格按JSON格式输出：{"password":"纯数字密码","hint":"提示语"}';
                var data = await API.chatCompletion([{ role: 'user', content: prompt }], { temperature: 0.95, maxTokens: 150, silent: true });
                var text = (data.choices[0].message.content || '').trim();
                var jsonMatch = text.match(/\{[\s\S]*?\}/);
                if (jsonMatch) {
                    var parsed = JSON.parse(jsonMatch[0]);
                    if (parsed.password && parsed.hint && /^\d{4,6}$/.test(parsed.password)) {
                        return { password: parsed.password, hint: parsed.hint };
                    }
                }
            } catch(e) {
                console.warn('[PhoneLock] AI生成密码失败:', e);
            }
            return null;
        }

        // [锁手机-生成中过渡屏] 渲染"AI 正在出密码"的等待画面
        function _renderLockGeneratingScreen(contact) {
            var existing = document.getElementById('phone-lock-generating');
            if (existing) existing.remove();
            _injectPhoneLockCSS();
            var s = document.createElement('div');
            s.id = 'phone-lock-generating';
            s.className = 'pls-screen';
            s.innerHTML =
                '<div class="pls-gen-spinner"></div>' +
                '<div class="pls-gen-title">' + (contact.name || 'TA') + ' 正在设置新密码…</div>' +
                '<div class="pls-gen-desc">AI 基于 TA 的人设与你们的共同记忆动态生成<br>可能需要几秒，请稍候</div>';
            document.body.appendChild(s);
        }
        function _clearLockGeneratingScreen() {
            var s = document.getElementById('phone-lock-generating');
            if (s) s.remove();
        }

        // 锁屏界面（黑白灰配色）
        async function _showPhoneLockScreen(contact) {
            _phoneLockShowing = true;
            var name = contact.name || 'TA';
            var existing = document.getElementById('phone-lock-screen');
            if(existing) existing.remove();
            _injectPhoneLockCSS();
            if(!_phoneLockState.lockPassword) {
                // [锁手机-生成中过渡屏] 给用户"AI 在工作"的明确感知
                _renderLockGeneratingScreen(contact);
                if (typeof toast === 'function') toast(name + ' 正在根据你们的关系设置新密码…', 'info');
                var gen = await _generateLockPassword(contact);
                _clearLockGeneratingScreen();
                // [清理] 无离线兜底，API失败直接放弃锁屏
                if (!gen) {
                    _phoneLockShowing = false;
                    if (typeof toast === 'function') toast('锁机失败：AI 返回异常，请检查 API 或稍后重试', 'error');
                    return;
                }
                _phoneLockState.lockPassword = gen.password;
                _phoneLockState.lockHint = gen.hint;
                _phoneLockState.lockContactId = contact.id;
                // 持久化
                store._phoneLockPersist = { locked: true, password: gen.password, hint: gen.hint, contactId: contact.id };
                save();
            }
            var now = new Date();
            var timeStr = String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0');
            var dateStr = (now.getMonth()+1) + '月' + now.getDate() + '日 周' + '日一二三四五六'[now.getDay()];
            var screen = document.createElement('div');
            screen.id = 'phone-lock-screen';
            screen.className = 'pls-screen';
            screen.innerHTML = '<div class="pls-time">' + timeStr + '</div>' +
                '<div class="pls-date">' + dateStr + '</div>' +
                '<div class="pls-warning">' + name + ' 已更改了你的锁屏密码</div>' +
                // [锁手机-AI标注] 明确告知密码是 AI 基于人设动态生成
                '<div class="pls-ai-tag"><i class="fas fa-robot"></i> 基于 TA 的人设与你们的共同记忆生成</div>' +
                '<div class="pls-hint">提示：' + _phoneLockState.lockHint + '</div>' +
                '<div class="pls-input-area">' +
                    '<input type="text" id="pls-password-input" class="pls-input" placeholder="输入密码解锁..." maxlength="10">' +
                    '<button onclick="window._tryUnlockPhone()" class="pls-unlock-btn">解锁</button>' +
                '</div>' +
                '<div id="pls-error-msg" class="pls-error"></div>' +
                '<div class="pls-cheat-area">' +
                    '<button onclick="window._cheatUnlock()" class="pls-cheat-btn">偷偷溜进去</button>' +
                    '<div class="pls-cheat-note">（作弊入口，每30分钟会被发现）</div>' +
                '</div>';
            document.body.appendChild(screen);
            // Enter键解锁
            var inp = document.getElementById('pls-password-input');
            if(inp) inp.addEventListener('keydown', function(e){ if(e.key==='Enter') window._tryUnlockPhone(); });
        }

        window._tryUnlockPhone = function() {
            var inp = document.getElementById('pls-password-input');
            var errEl = document.getElementById('pls-error-msg');
            if(!inp) return;
            var val = inp.value.trim();
            if(!val) { errEl.textContent = '请输入密码'; return; }
            if(val === _phoneLockState.lockPassword) {
                // 解锁成功
                var screen = document.getElementById('phone-lock-screen');
                if(screen) screen.remove();
                _phoneLockShowing = false;
                _phoneLockState.lockPassword = '';
                _phoneLockState.lockHint = '';
                _phoneLockState.lastDismissTime = Date.now();
                store._phoneLockPersist = null; save();
                toast('解锁成功', 'success');
            } else {
                errEl.textContent = '密码错误，再想想...';
                inp.value = '';
                inp.style.animation = 'phoneLockShake 0.3s ease';
                setTimeout(function(){ inp.style.animation = ''; }, 300);
            }
        };

        window._cheatUnlock = function() {
            var screen = document.getElementById('phone-lock-screen');
            if(screen) screen.remove();
            _phoneLockShowing = false;
            _phoneLockState.cheating = true;
            toast('偷偷溜进来了...小心被发现哦', 'success');
            // 30分钟后被发现
            if(_phoneLockState.cheatTimer) clearTimeout(_phoneLockState.cheatTimer);
            _phoneLockState.cheatTimer = setTimeout(function() {
                _phoneLockState.cheating = false;
                var c = store.contacts.find(function(x){ return x.id === _phoneLockState.lockContactId; });
                if(!c) return;
                var name = c.name || 'TA';
                // 被发现弹窗
                var overlay = document.createElement('div');
                overlay.id = 'phone-lock-overlay';
                overlay.className = 'pl-overlay';
                overlay.innerHTML = '<div class="pl-popup">' +
                    '<div class="pl-name" style="font-size:18px;margin-bottom:12px;">' + name + ' 发现你作弊了！</div>' +
                    '<div class="pl-question">你以为我不知道吗？密码重新改过了，乖乖猜吧~</div>' +
                    '<button onclick="window._cheatCaught()" class="pl-btn-submit">好吧...</button>' +
                '</div>';
                document.body.appendChild(overlay);
            }, 30 * 60 * 1000);
        };

        window._cheatCaught = async function() {
            var overlay = document.getElementById('phone-lock-overlay');
            if(overlay) overlay.remove();
            var c = store.contacts.find(function(x){ return x.id === _phoneLockState.lockContactId; });
            if(!c) return;
            // [锁手机-空指针兜底] 告知用户 AI 正在改密
            if (typeof toast === 'function') toast((c.name||'TA') + ' 正在改新密码…', 'info');
            // 重新生成密码（AI）
            var gen = await _generateLockPassword(c);
            if (!gen) {
                // [锁手机-空指针兜底] AI 失败不再访问 gen.password 抛异常，原密码继续有效
                if (typeof toast === 'function') toast('AI 调用失败，暂不改密（原密码仍有效）', 'error');
                await _showPhoneLockScreen(c);
                return;
            }
            _phoneLockState.lockPassword = gen.password;
            _phoneLockState.lockHint = gen.hint;
            store._phoneLockPersist = { locked: true, password: gen.password, hint: gen.hint, contactId: c.id };
            save();
            await _showPhoneLockScreen(c);
        };

        window._handlePhoneLockReply = async function(type) {
            var overlay = document.getElementById('phone-lock-overlay');
            if(!overlay) return;
            var contact = store.contacts.find(function(x){return x.id===activeChatId;});
            var name = contact ? contact.name : 'TA';
            // [OPT-单次API] 直接使用预生成的缓存内容，不再调用API
            var pre = _phoneLockState.preGenerated || {};
            if(type === 'good') {
                // 使用预生成的晚安话（0次API调用）
                var goodReply = pre.goodReply || (name + '：乖，快去睡吧，明天见~');
                overlay.querySelector('.pl-popup').innerHTML = '<div class="pl-name">晚安</div>' +
                    '<div class="pl-question">' + goodReply + '</div>';
                setTimeout(function(){ if(overlay.parentNode) overlay.remove(); _phoneLockShowing = false; _phoneLockState.preGenerated = null; _phoneLockState.lastDismissTime = Date.now(); }, 2500);
            } else if(type === 'bad' || type === 'custom') {
                // 使用预生成的生气回复（0次API调用）
                var badReply = pre.badReply || '哼，不听话是吧？那我改你锁屏密码了！';
                overlay.querySelector('.pl-popup').innerHTML = '<div class="pl-name">' + name + '</div>' +
                    '<div class="pl-question">' + badReply + '</div>';
                // [OPT-单次API] 使用预生成的密码直接锁屏，不再调用_generateLockPassword
                if (pre.password && contact) {
                    _phoneLockState.lockPassword = pre.password;
                    _phoneLockState.lockHint = pre.hint || '想想我们的关系~';
                    _phoneLockState.lockContactId = contact.id;
                    store._phoneLockPersist = { locked: true, password: pre.password, hint: pre.hint || '想想我们的关系~', contactId: contact.id };
                    save();
                }
                setTimeout(function(){
                    if(overlay.parentNode) overlay.remove();
                    _phoneLockState.preGenerated = null;
                    if(contact) _showPhoneLockScreen(contact);
                }, 2000);
            }
        };

        // 注入锁手机CSS（黑白灰配色）
        function _injectPhoneLockCSS() {
            if(document.getElementById('phone-lock-style-v2')) return;
            var s = document.createElement('style');
            s.id = 'phone-lock-style-v2';
            s.textContent = [
                '@keyframes phoneLockFadeIn{from{opacity:0}to{opacity:1}}',
                '@keyframes phoneLockBounce{from{opacity:0;transform:scale(0.8) translateY(20px)}to{opacity:1;transform:scale(1) translateY(0)}}',
                '@keyframes phoneLockShake{0%,100%{transform:translateX(0)}25%{transform:translateX(-8px)}75%{transform:translateX(8px)}}',
                '.pl-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.9);z-index:99999;display:flex;align-items:center;justify-content:center;animation:phoneLockFadeIn .3s}',
                '.pl-popup{background:#1a1a1a;border:1px solid #333;border-radius:16px;padding:28px 24px;width:85%;max-width:340px;text-align:center;animation:phoneLockBounce .4s cubic-bezier(.34,1.56,.64,1)}',
                '.pl-avatar-wrap{width:64px;height:64px;border-radius:50%;overflow:hidden;margin:0 auto 12px;border:2px solid #444}',
                '.pl-avatar{width:100%;height:100%;object-fit:cover;filter:grayscale(30%)}',
                '.pl-name{font-size:16px;font-weight:700;color:#e0e0e0;margin-bottom:8px}',
                '.pl-question{font-size:14px;color:#999;margin-bottom:18px;line-height:1.6}',
                '.pl-input{width:100%;padding:12px;border:1px solid #444;border-radius:10px;background:#222;color:#fff;font-size:14px;outline:none;box-sizing:border-box;margin-bottom:10px}',
                '.pl-input::placeholder{color:#666}',
                '.pl-btn-submit{width:100%;padding:12px;border:none;border-radius:10px;background:#fff;color:#000;font-size:14px;font-weight:600;cursor:pointer;margin-bottom:12px}',
                '.pl-preset-btns{display:flex;gap:8px}',
                '.pl-btn{flex:1;padding:10px 8px;border:1px solid #444;border-radius:10px;font-size:12px;cursor:pointer;background:transparent;color:#aaa}',
                '.pl-btn-good{border-color:#555;color:#ccc}',
                '.pl-btn-bad{border-color:#444;color:#888}',
                '.pls-screen{position:fixed;top:0;left:0;right:0;bottom:0;background:#000;z-index:999999;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;font-family:-apple-system,sans-serif;animation:phoneLockFadeIn .3s}',
                '.pls-time{font-size:64px;font-weight:200;color:#fff;letter-spacing:2px;margin-bottom:4px}',
                '.pls-date{font-size:14px;color:#888;margin-bottom:30px}',
                '.pls-warning{font-size:13px;color:#ff4444;background:rgba(255,68,68,0.1);border:1px solid rgba(255,68,68,0.3);border-radius:8px;padding:8px 16px;margin-bottom:12px;max-width:280px;text-align:center}',
                '.pls-hint{font-size:12px;color:#666;margin-bottom:24px;max-width:260px;text-align:center;line-height:1.5}',
                '.pls-input-area{display:flex;gap:8px;width:80%;max-width:300px;margin-bottom:12px;box-sizing:border-box;padding:0 10px}',
                '.pls-input{flex:1;min-width:0;padding:12px;border:1px solid #333;border-radius:10px;background:#111;color:#fff;font-size:16px;text-align:center;outline:none;letter-spacing:4px;box-sizing:border-box}',
                '.pls-input::placeholder{color:#555;letter-spacing:0}',
                '.pls-unlock-btn{padding:12px 20px;border:none;border-radius:10px;background:#333;color:#fff;font-size:14px;cursor:pointer}',
                '.pls-error{color:#ff4444;font-size:13px;min-height:20px;margin-bottom:20px}',
                '.pls-cheat-area{position:absolute;bottom:40px;right:20px;text-align:right}',
                '.pls-cheat-btn{background:transparent;border:1px solid #333;color:#555;padding:8px 14px;border-radius:8px;font-size:11px;cursor:pointer}',
                '.pls-cheat-note{font-size:10px;color:#444;margin-top:4px}',
                /* [锁手机-AI标注] 明确告知密码由 AI 生成 */
                '.pls-ai-tag{display:inline-flex;align-items:center;gap:6px;font-size:11px;color:#7ab;background:rgba(80,160,180,0.08);border:1px solid rgba(100,180,200,0.22);border-radius:999px;padding:4px 12px;margin-bottom:12px}',
                '.pls-ai-tag i{font-size:10px}',
                /* [锁手机-生成中过渡屏] AI 生成中旋转指示 */
                '@keyframes plsGenSpin{to{transform:rotate(360deg)}}',
                '.pls-gen-spinner{width:48px;height:48px;border:3px solid #333;border-top-color:#fff;border-radius:50%;animation:plsGenSpin 1s linear infinite;margin-bottom:24px}',
                '.pls-gen-title{font-size:18px;color:#e0e0e0;font-weight:500;margin-bottom:10px;text-align:center;padding:0 20px}',
                '.pls-gen-desc{font-size:12px;color:#777;text-align:center;line-height:1.8;padding:0 30px}'
            ].join('\n');
            document.head.appendChild(s);
        }
        
        // 初始化锁手机检查
        _initPhoneLockCheck();

        // --- CHAT SETTINGS ---
        function openChatSettings() {
             const c = store.contacts.find(x=>x.id===activeChatId);
             if(!c) return;
             // [FIX-表情包挂载] 打开设置时立即初始化tempMountedCateIds
             // 之前只在toggleStickerMount时初始化，导致未展开挂载区域直接保存时使用了旧值
             if(!c.settings) c.settings = {};
             tempMountedCateIds = [...(c.settings.mountedCateIds || [])];
             document.getElementById('layer-chat-settings').classList.add('show');
             
             if(!c.settings) c.settings = { autoMsg: false, autoMsgInterval: 30, autoMoment: false, autoDiary: false, diaryTime: '22:00', time: '', wb: '', userPersona: 'p1', bg: '', stickerGallery: '' };
             
             let settingsHTML = '';
             if (c.isGroup) {
                // [FIX-1] 恢复群聊核心设置界面 [全局挂载范围] 按联系人精细过滤
                const _gwbIds = (typeof getActiveGlobalWbIds === 'function') ? getActiveGlobalWbIds(c.id) : (store.globalWbIds || []);
                // [FIX-世界书数量] 只计算实际存在的世界书，防止删除后数量不更新
                const _allWbIds = (store.worldbooks || []).map(wb => String(wb.id));
                const _contactWbCount = c.settings.mountedWbIds ? c.settings.mountedWbIds.filter(wid => _allWbIds.includes(String(wid))).length : (c.settings.wb ? 1 : 0);
                const mountedWbCount = _contactWbCount + _gwbIds.filter(gid => _allWbIds.includes(String(gid)) && !(c.settings.mountedWbIds || []).some(id => String(id) === String(gid))).length;
                const allCates = store.stickerCategories || [];
                 const currentCateIds = c.settings.mountedCateIds || [];
                 const enableMemory = c.settings.enableMemorySummary || false;
                 const memoryInterval = c.settings.memoryInterval || 10;

                // === 群成员管理数据初始化 ===
                if (!c.groupNicknames) c.groupNicknames = {};
                if (!c.groupTitles) c.groupTitles = {};
                if (!c.mutedMembers) c.mutedMembers = {};
                if (!c.groupAvatars) c.groupAvatars = {};
                const muteAll = c.muteAll || false;
                const membersArr = c.members || [];
                const _userPId = c.settings.userPersona || (store.personas.length > 0 ? store.personas[0].id : 'p1');
                const _userP = store.personas.find(p => p.id === _userPId);
                const _userName = _userP ? _userP.name : (store.user.name || '我');
                const _defaultUserAvatar = _userP?.avatar || store.user.avatar || _ph(50);
                // [群专属头像] 优先使用群专属头像
                const _userAvatar = c.groupAvatars['__user__'] || _defaultUserAvatar;
                const myGroupNick = c.groupNicknames['__user__'] || '';
                const myGroupTitle = c.groupTitles['__user__'] || '';

                // [群角色系统] 初始化角色
                if (typeof _initGroupRoles === 'function') _initGroupRoles(c);
                const _userIsOwner = !c.groupOwner || c.groupOwner === '__user__';

                let membersListHtml = '';
                // 群主(用户) - 显示角色标签
                const _userRoleTag = (typeof _getRoleTag === 'function') ? _getRoleTag(c, '__user__') : '<span style="color:#999;font-size:11px;">(群主)</span>';
                membersListHtml += `<div class="gc-member-item" onclick="openGroupMemberAction('__user__', '${c.id}')">
                    <img src="${_userAvatar}" class="gc-member-avatar">
                    <div class="gc-member-info">
                        <div class="gc-member-name">${myGroupNick || _userName} ${_userRoleTag}${myGroupTitle ? '<span class="gc-member-title">' + myGroupTitle + '</span>' : ''}</div>
                    </div>
                </div>`;
                membersArr.forEach(mid => {
                    const mem = store.contacts.find(x => x.id === mid);
                    if (!mem) return;
                    const nick = c.groupNicknames[mid] || '';
                    const title = c.groupTitles[mid] || '';
                    const isMuted = c.mutedMembers[mid] || muteAll;
                    // [群专属头像] 优先使用群专属头像
                    const memAvatar = c.groupAvatars[mid] || mem.avatar || _ph(50);
                    // [群角色系统] 显示角色标签
                    const _memRoleTag = (typeof _getRoleTag === 'function') ? _getRoleTag(c, mid) : '';
                    membersListHtml += `<div class="gc-member-item" onclick="openGroupMemberAction('${mid}', '${c.id}')">
                        <img src="${memAvatar}" class="gc-member-avatar">
                        <div class="gc-member-info">
                            <div class="gc-member-name">${nick || mem.name}${_memRoleTag}${title ? '<span class="gc-member-title">' + title + '</span>' : ''}${isMuted ? '<span style="color:#fa5151;font-size:11px;margin-left:6px;"><i class="fas fa-volume-mute"></i> 禁言中</span>' : ''}</div>
                            <div class="gc-member-sub">${mem.persona ? mem.persona.substring(0, 30) : ''}</div>
                        </div>
                    </div>`;
                });

                settingsHTML = `
                <div style="text-align:center; padding:20px;">
                    <div class="upload-box" style="width:80px; height:80px; border-radius:var(--avatar-radius, 8px); margin:0 auto; background:#fff;" onclick="uploadImg('edit-contact-avatar')"><img src="${c.avatar}" style="width:100%; height:100%; border-radius:var(--avatar-radius, 8px); object-fit:cover;"></div>
                    <input id="edit-c-name" value="${c.name}" style="margin-top:10px; text-align:center; border:none; background:transparent; font-size:18px; font-weight:bold;">
                </div>
                <h3 style="margin:10px 15px; color:#555;">群聊成员 (${membersArr.length + 1})</h3>
                <div class="group-box" style="padding:5px 0;">
                    <div id="gc-members-list" style="max-height:300px; overflow-y:auto;">
                        ${membersListHtml}
                    </div>
                    <div style="display:flex; gap:8px; padding:10px 12px; border-top:1px solid #f0f0f0;">
                        <button onclick="inviteToGroup('${c.id}')" style="flex:1; padding:10px; border:1px solid #07c160; color:#07c160; background:#fff; border-radius:8px; font-size:13px; cursor:pointer;"><i class="fas fa-user-plus"></i> 邀请成员</button>
                        <button onclick="kickFromGroup('${c.id}')" style="flex:1; padding:10px; border:1px solid #fa5151; color:#fa5151; background:#fff; border-radius:8px; font-size:13px; cursor:pointer;"><i class="fas fa-user-minus"></i> 移出成员</button>
                    </div>
                    ${_userIsOwner ? `<div style="display:flex; gap:8px; padding:6px 12px 10px; border-top:1px dashed #f0f0f0;">
                        <button onclick="transferGroupOwner('${c.id}')" style="flex:1; padding:10px; background:linear-gradient(135deg,#FFD700,#FFA500); color:#fff; border:none; border-radius:8px; font-size:13px; cursor:pointer;font-weight:600;"><i class="fas fa-crown"></i> 转让群主</button>
                        <button onclick="atAllMembers('${c.id}')" style="flex:1; padding:10px; background:linear-gradient(135deg,#667eea,#764ba2); color:#fff; border:none; border-radius:8px; font-size:13px; cursor:pointer;font-weight:600;"><i class="fas fa-at"></i> @所有人</button>
                    </div>` : ((typeof _isGroupAdmin === 'function' && _isGroupAdmin(c, '__user__')) ? `<div style="display:flex; gap:8px; padding:6px 12px 10px; border-top:1px dashed #f0f0f0;">
                        <button onclick="atAllMembers('${c.id}')" style="flex:1; padding:10px; background:linear-gradient(135deg,#667eea,#764ba2); color:#fff; border:none; border-radius:8px; font-size:13px; cursor:pointer;font-weight:600;"><i class="fas fa-at"></i> @所有人</button>
                    </div>` : '')}
                </div>
                <h3 style="margin:10px 15px; color:#555;">禁言管理</h3>
                <div class="group-box">
                    <div class="form-cell"><span class="form-label"><b>全体禁言</b></span><div class="switch"><input type="checkbox" id="edit-gc-mute-all" ${muteAll?'checked':''}><span class="slider"></span></div></div>
                    <div style="padding:4px 12px 8px; font-size:12px; color:#999;">开启后所有群成员默认禁言，需单独解除。</div>
                </div>
                <h3 style="margin:10px 15px; color:#555;">我在群里的信息</h3>
                <div class="group-box">
                    <div class="form-cell" onclick="openUserPersonaSelector()" style="cursor:pointer;"><span class="form-label">我的身份</span><input type="hidden" id="edit-c-up" value="${_userPId}"><div id="user-persona-display" style="display:flex; align-items:center; gap:8px;"><img src="${_userAvatar}" style="width:32px; height:32px; border-radius:var(--avatar-radius, 8px); object-fit:cover; border:1px solid #eee;"><div style="text-align:right; line-height:1.3;"><div style="font-size:14px; color:#333;">${_userName}</div>${_userP?.note ? '<div style="font-size:11px; color:#999;">' + _userP.note + '</div>' : ''}</div></div><i class="fas fa-chevron-right form-arrow"></i></div>
                    <div class="form-cell"><span class="form-label">我的群昵称</span><input id="edit-gc-my-nick" value="${myGroupNick}" placeholder="${_userName}" style="width:120px; text-align:center; border:1px solid #eee; border-radius:6px; padding:6px 10px; font-size:14px;"></div>
                    <div class="form-cell"><span class="form-label">我的群头衔</span><input id="edit-gc-my-title" value="${myGroupTitle}" placeholder="无" style="width:120px; text-align:center; border:1px solid #eee; border-radius:6px; padding:6px 10px; font-size:14px;"></div>
                </div>
                 <div class="group-box">
                     <div class="form-cell"><span class="form-label"><b>记忆总结系统</b></span><div class="switch"><input type="checkbox" id="edit-c-memory-enable" ${enableMemory?'checked':''} onchange="document.getElementById('memory-interval-cell').style.display=this.checked?'flex':'none'"><span class="slider"></span></div></div>
                     <div class="form-cell" id="memory-interval-cell" style="display:${enableMemory?'flex':'none'};"><span class="form-label">触发间隔(条)</span><input type="number" id="edit-c-memory-interval" value="${memoryInterval}" style="width:50px; text-align:center; border: 1px solid #ddd; border-radius: 4px; padding: 2px 5px;"></div>
                 </div>
                 <div class="group-box">
                     <div class="form-cell" onclick="openGroupHeartExport('${c.id}')" style="cursor:pointer;">
                         <span class="form-label">💗 导出群聊心声</span>
                         <i class="fas fa-chevron-right form-arrow"></i>
                     </div>
                     <div class="form-cell" onclick="exportGroupChatTxt('${c.id}')" style="cursor:pointer;">
                         <span class="form-label">📝 导出聊天记录(TXT)</span>
                         <i class="fas fa-chevron-right form-arrow"></i>
                     </div>
                     <div class="form-cell" onclick="openGroupOfflineExport('${c.id}')" style="cursor:pointer;">
                         <span class="form-label">🌍 导出群聊线下记录</span>
                         <i class="fas fa-chevron-right form-arrow"></i>
                     </div>
                 </div>
                <div class="group-box">
                     <div class="form-cell"><span class="form-label">历史互通 (记忆共享)</span><div class="switch"><input type="checkbox" id="edit-c-history" ${c.settings.historyInteroperability?'checked':''}><span class="slider"></span></div></div>
                </div>
                <h3 style="margin:10px 15px; color:#555;">🎭 关系网拉人</h3>
                <div class="group-box">
                    <div class="form-cell"><span class="form-label"><b>允许角色主动拉人</b></span><div class="switch"><input type="checkbox" id="edit-c-npc-invite" ${c.settings.allowNpcInvite?'checked':''} onchange="document.getElementById('npc-invite-opts').style.display=this.checked?'block':'none'"><span class="slider"></span></div></div>
                    <div style="padding:4px 12px 8px; font-size:12px; color:#999; line-height:1.5;">开启后，每次群聊AI回复后有几率从关系网中自动拉入一个NPC加入群聊（转为联系人）。</div>
                    <div id="npc-invite-opts" style="display:${c.settings.allowNpcInvite?'block':'none'};">
                        <div class="form-cell"><span class="form-label">拉人概率(%)</span><input type="number" id="edit-c-npc-chance" min="1" max="100" value="${Math.round(((typeof c.settings.npcInviteChance==='number'?c.settings.npcInviteChance:0.15))*100)}" style="width:60px; text-align:center; border:1px solid #ddd; border-radius:4px; padding:2px 5px;"></div>
                        <div class="form-cell"><span class="form-label">最多自动拉入</span><input type="number" id="edit-c-npc-max" min="1" max="20" value="${(typeof c.settings.npcInviteMax==='number'?c.settings.npcInviteMax:3)}" style="width:60px; text-align:center; border:1px solid #ddd; border-radius:4px; padding:2px 5px;"><span style="font-size:12px;color:#999;margin-left:6px;">人 (已拉${(c.npcAutoInvitedIds||[]).length})</span></div>
                        <div class="form-cell"><span class="form-label">关系网源</span>
                            <select id="edit-c-npc-source" style="border:1px solid #ddd;border-radius:4px;padding:4px 6px;font-size:13px;background:#fff;max-width:160px;">
                                <option value="">自动(群内首个有关系网的成员)</option>
                                ${(c.members||[]).map(mid=>{const m=store.contacts.find(x=>x.id===mid);if(!m)return '';const sel=(c.settings.npcInviteSourceContact===mid)?'selected':'';return `<option value="${mid}" ${sel}>${m.name||'未命名'}</option>`;}).join('')}
                            </select>
                        </div>
                    </div>
                </div>
                <div class="group-box">
                    <div class="form-cell" onclick="openWorldBookSelector()"><span class="form-label">挂载世界书</span><span class="form-val">${mountedWbCount}个</span><i class="fas fa-chevron-right form-arrow"></i></div>
                    <div class="form-cell" onclick="toggleStickerMount()"><span class="form-label">挂载表情分类</span><span class="form-val" id="sticker-count">${currentCateIds.length}个</span><i class="fas fa-chevron-right form-arrow"></i></div>
                    <div id="sticker-mount-area" style="display:none; padding:10px; background:#f9f9f9; flex-direction:column; gap:5px;">
                        ${allCates.length>0 ? allCates.map(cate => `<div onclick="toggleStickerSelect(this, '${cate.id}')" class="sticker-select-item" style="padding:10px; border:1px solid ${currentCateIds.includes(cate.id)?'#07c160':'#ddd'}; border-radius:6px; cursor:pointer; background:#fff; display:flex; justify-content:space-between; align-items:center;"><span>${cate.name}</span> ${currentCateIds.includes(cate.id) ? '<i class="fas fa-check" style="color:#07c160;"></i>' : ''}</div>`).join('') : '<div style="font-size:12px; color:#999;">无分类</div>'}
                    </div>
                </div>
                 <div class="group-box">
                     <div class="form-cell"><span class="form-label">推荐回复</span><div class="switch"><input type="checkbox" id="edit-c-smart-reply" ${c.settings.enableSmartReply?'checked':''}><span class="slider"></span></div></div>
                     <div class="form-cell"><span class="form-label">默认线下模式</span><div class="switch"><input type="checkbox" id="edit-c-default-offline" ${c.settings.defaultOffline?'checked':''}><span class="slider"></span></div></div>
                     <div style="padding:2px 12px 8px; font-size:11px; color:#999;">开启后进入聊天将自动进入线下模式（嵌入式）</div>
                 </div>
                 <div class="group-box">
                     <div class="form-cell"><span class="form-label">聊天背景</span><div style="display:flex;gap:6px;"><button onclick="resetChatBg()" style="font-size:12px; padding:5px 10px; background:#fff5f5; color:#e74c3c; border:1px solid #fdd; border-radius:12px; cursor:pointer;" title="还原聊天背景"><i class="fas fa-undo"></i> 还原</button><button onclick="uploadImg('chat-bg')" style="font-size:12px; padding:5px 10px; border-radius:12px;">上传</button></div></div>
                     <div class="form-cell"><span class="form-label">天气与时间感知</span><div class="switch"><input type="checkbox" id="edit-c-perc-en" ${c.settings.enablePerception!==false?'checked':''}><span class="slider"></span></div></div>
                </div>
                <h3 style="margin:10px 15px; color:#555;">语音设置</h3>
                <div class="group-box">
                    <div class="form-cell">
                        <span class="form-label">开启语音合成 (TTS)</span>
                        <div class="switch"><input type="checkbox" id="edit-c-enable-tts" ${c.settings.enableTTS?'checked':''}><span class="slider"></span></div>
                    </div>
                    <div style="padding:4px 12px 8px; font-size:12px; color:#999; line-height:1.5;">开启后，点击群聊中AI角色的语音消息可播放MiniMax语音合成。需先在全局设置中配置MiniMax API Key。</div>
                    <div class="form-cell">
                        <span class="form-label">默认音色ID</span>
                        <input id="edit-c-voice-id" value="${c.settings.voiceId||'male-qn-qingse'}" style="border:1px solid #e5e5e5; border-radius:8px; padding:8px; width:150px; text-align:center;" placeholder="输入音色ID">
                    </div>
                    <div style="padding:4px 12px 8px; font-size:12px; color:#999; line-height:1.5;">群聊中所有成员共用此音色。如需为各成员设置不同音色，请在各成员的私聊设置中单独配置。</div>
                    <div class="form-cell">
                        <span class="form-label">语言</span>
                        <select id="edit-c-voice-lang">
                            <option value="zh" ${(!c.settings.voiceLang || c.settings.voiceLang==='zh')?'selected':''}>中文 (Chinese)</option>
                            <option value="yue" ${c.settings.voiceLang==='yue'?'selected':''}>粤语 (Cantonese)</option>
                            <option value="en" ${c.settings.voiceLang==='en'?'selected':''}>英文 (English)</option>
                            <option value="ja" ${c.settings.voiceLang==='ja'?'selected':''}>日语 (Japanese)</option>
                            <option value="ko" ${c.settings.voiceLang==='ko'?'selected':''}>韩语 (Korean)</option>
                            <option value="es" ${c.settings.voiceLang==='es'?'selected':''}>西班牙语 (Spanish)</option>
                            <option value="fr" ${c.settings.voiceLang==='fr'?'selected':''}>法语 (French)</option>
                            <option value="de" ${c.settings.voiceLang==='de'?'selected':''}>德语 (German)</option>
                            <option value="id" ${c.settings.voiceLang==='id'?'selected':''}>印尼语 (Indonesian)</option>
                        </select>
                    </div>
                </div>
                <h3 style="margin:10px 15px; color:#555;">独立美化预设</h3>
                <div class="group-box">
                    <div style="padding:8px 12px; font-size:12px; color:#999; line-height:1.5; margin-bottom:4px;">
                        从已保存的美化预设中加载，仅对当前群聊生效。不会影响全局美化设置。
                    </div>
                    <div class="form-cell" onclick="openContactPresetPopup('bubble')">
                        <span class="form-label">气泡美化</span>
                        <span class="form-val" style="color:${c.settings.contactCSS?.bubble ? '#07c160' : '#999'};">${c.settings.contactCSS?.bubble ? '已设置' : '未设置'}</span>
                        <i class="fas fa-chevron-right form-arrow"></i>
                    </div>
                    <div class="form-cell" onclick="openContactPresetPopup('global')">
                        <span class="form-label">全局美化</span>
                        <span class="form-val" style="color:${c.settings.contactCSS?.global ? '#07c160' : '#999'};">${c.settings.contactCSS?.global ? '已设置' : '未设置'}</span>
                        <i class="fas fa-chevron-right form-arrow"></i>
                    </div>
                    <div class="form-cell" onclick="openContactPresetPopup('offline')">
                        <span class="form-label">线下模式美化</span>
                        <span class="form-val" style="color:${c.settings.contactCSS?.offline ? '#07c160' : '#999'};">${c.settings.contactCSS?.offline ? '已设置' : '未设置'}</span>
                        <i class="fas fa-chevron-right form-arrow"></i>
                    </div>
                    ${(c.settings.contactCSS?.bubble || c.settings.contactCSS?.global || c.settings.contactCSS?.offline) ? '<div class="form-cell" onclick="clearContactCSS()" style="justify-content:center;"><span style="color:#fa5151; font-size:14px;"><i class="fas fa-trash-alt" style="margin-right:6px;"></i>清除所有独立美化</span></div>' : ''}
                </div>
                `;
             } else {
                // Full settings for private chat [全局挂载范围] 按联系人精细过滤
                const _gwbIds2 = (typeof getActiveGlobalWbIds === 'function') ? getActiveGlobalWbIds(c.id) : (store.globalWbIds || []);
                // [FIX-世界书数量] 只计算实际存在的世界书，防止删除后数量不更新
                const _allWbIds2 = (store.worldbooks || []).map(wb => String(wb.id));
                const _contactWbCount2 = c.settings.mountedWbIds ? c.settings.mountedWbIds.filter(wid => _allWbIds2.includes(String(wid))).length : (c.settings.wb ? 1 : 0);
                const mountedWbCount = _contactWbCount2 + _gwbIds2.filter(gid => _allWbIds2.includes(String(gid)) && !(c.settings.mountedWbIds || []).some(id => String(id) === String(gid))).length;
                const _selectedPId = c.settings.userPersona || (store.personas.length > 0 ? store.personas[0].id : '');
                const _selectedP = store.personas.find(p => p.id === _selectedPId);
                const _selectedPAvatar = _selectedP?.avatar || store.user.avatar || _personaPlaceholderAvatar;
                const _selectedPName = _selectedP?.name || '未选择';
                const _selectedPNote = _selectedP?.note || '';
                const allCates = store.stickerCategories || [];
                const currentCateIds = c.settings.mountedCateIds || [];
                const enableMemory = c.settings.enableMemorySummary || false;
                const memoryInterval = c.settings.memoryInterval || 10;

                settingsHTML = `
                    <div style="text-align:center; padding:20px;">
                        <div class="upload-box" style="width:80px; height:80px; border-radius:var(--avatar-radius, 8px); margin:0 auto; background:#fff;" onclick="uploadImg('edit-contact-avatar')"><img src="${c.avatar}" style="width:100%; height:100%; border-radius:var(--avatar-radius, 8px); object-fit:cover;"></div>
                        <input id="edit-c-name" value="${c.name}" style="margin-top:10px; text-align:center; border:none; background:transparent; font-size:18px; font-weight:bold; display:block; width:100%;">
                    </div>
                    <h3 style="margin:10px 15px; color:#555;">备注与资料</h3>
                    <div class="group-box">
                        <div class="form-cell"><span class="form-label">备注名</span><input id="edit-c-remark" value="${c.remark||''}" placeholder="设置备注" style="width:140px; text-align:center; border:1px solid #eee; border-radius:6px; padding:6px 10px; font-size:14px;"></div>
                        <div class="form-cell"><span class="form-label">个性签名</span><input id="edit-c-signature" value="${c.signature||''}" placeholder="无" style="width:140px; text-align:center; border:1px solid #eee; border-radius:6px; padding:6px 10px; font-size:14px;" readonly></div>
                        ${(() => {
                            const _g = c.gender || '';
                            const _isPreset = (_g === '' || _g === '女' || _g === '男' || _g === '其他');
                            const _selVal = _isPreset ? _g : '__custom__';
                            return `<div class="form-cell"><span class="form-label">性别</span>
                                <div style="display:flex; gap:6px; align-items:center;">
                                    <select id="edit-c-gender" onchange="_onEditContactGenderChange()" style="padding:6px 10px; border:1px solid #eee; border-radius:6px; font-size:14px; background:#fff;">
                                        <option value="" ${_selVal===''?'selected':''}>未设置</option>
                                        <option value="女" ${_selVal==='女'?'selected':''}>女</option>
                                        <option value="男" ${_selVal==='男'?'selected':''}>男</option>
                                        <option value="其他" ${_selVal==='其他'?'selected':''}>其他</option>
                                        <option value="__custom__" ${_selVal==='__custom__'?'selected':''}>自定义...</option>
                                    </select>
                                    <input id="edit-c-gender-custom" value="${_selVal==='__custom__'?_g:''}" placeholder="自定义" style="display:${_selVal==='__custom__'?'inline-block':'none'}; width:100px; padding:6px 10px; border:1px solid #eee; border-radius:6px; font-size:14px;">
                                </div>
                            </div>`;
                        })()}
                        <div class="form-cell"><span class="form-label">状态</span><span class="form-val">${c.status||'在线'}</span></div>
                    </div>
                    <div class="group-box">
                         <div class="form-cell"><span class="form-label"><b>记忆总结系统</b></span><div class="switch"><input type="checkbox" id="edit-c-memory-enable" ${enableMemory?'checked':''} onchange="document.getElementById('memory-interval-cell').style.display=this.checked?'flex':'none'"><span class="slider"></span></div></div>
                         <div class="form-cell" id="memory-interval-cell" style="display:${enableMemory?'flex':'none'};"><span class="form-label">触发间隔(条)</span><input type="number" id="edit-c-memory-interval" value="${memoryInterval}" style="width:50px; text-align:center; border: 1px solid #ddd; border-radius: 4px; padding: 2px 5px;"></div>
                     </div>
                    <div class="group-box">
                        <div class="form-cell" style="flex-direction:column; align-items:center;">
                            <span class="form-label" style="font-weight:bold; margin-bottom:5px;">人设</span>
                            <textarea id="edit-c-persona" style="width:100%; height:100px; border:1px solid #eee; padding:5px; resize:none; border-radius:5px;">${c.persona || ''}</textarea>
                        </div>
                    </div>
                    <div class="group-box">
                        <div class="form-cell" style="flex-direction:column; align-items:flex-start;">
                            <span class="form-label" style="font-weight:bold; margin-bottom:5px;">✏️ 自定义系统提示词</span>
                            <div style="font-size:12px; color:#999; margin-bottom:6px; line-height:1.5;">设置后将追加到系统提示词末尾，可用于补充指令、限制行为等。留空则不生效。</div>
                            <textarea id="edit-c-custom-sys-prompt" style="width:100%; height:80px; border:1px solid #eee; padding:8px; resize:vertical; border-radius:5px; font-size:13px; box-sizing:border-box;" placeholder="例如：回复时多用颜文字 / 每次回复不超过50字 / 说话带东北口音">${c.settings.customSystemPrompt || ''}</textarea>
                        </div>
                    </div>
                    <div class="group-box">
                        <div class="form-cell"><span class="form-label">默认线下模式</span><div class="switch"><input type="checkbox" id="edit-c-default-offline" ${c.settings.defaultOffline?'checked':''}><span class="slider"></span></div></div>
                        <div style="padding:2px 12px 8px; font-size:11px; color:#999;">开启后进入聊天将自动进入线下模式（嵌入式）</div>
                    </div>
                    <div class="group-box">
                        <div class="form-cell" onclick="openWorldBookSelector()"><span class="form-label">挂载世界书</span><span class="form-val">${mountedWbCount}个</span><i class="fas fa-chevron-right form-arrow"></i></div>
                        <div class="form-cell" onclick="openUserPersonaSelector()" style="cursor:pointer;"><span class="form-label">我的身份</span><input type="hidden" id="edit-c-up" value="${_selectedPId}"><div id="user-persona-display" style="display:flex; align-items:center; gap:8px;"><img src="${_selectedPAvatar}" style="width:32px; height:32px; border-radius:var(--avatar-radius, 8px); object-fit:cover; border:1px solid #eee;"><div style="text-align:right; line-height:1.3;"><div style="font-size:14px; color:#333;">${_selectedPName}</div>${_selectedPNote ? '<div style="font-size:11px; color:#999;">' + _selectedPNote + '</div>' : ''}</div></div><i class="fas fa-chevron-right form-arrow"></i></div>
                        <div class="form-cell"><span class="form-label">聊天背景</span><div style="display:flex;gap:6px;"><button onclick="resetChatBg()" style="font-size:12px; padding:5px 10px; background:#fff5f5; color:#e74c3c; border:1px solid #fdd; border-radius:12px; cursor:pointer;" title="还原聊天背景"><i class="fas fa-undo"></i> 还原</button><button onclick="uploadImg('chat-bg')" style="font-size:12px; padding:5px 10px; border-radius:12px;">上传</button></div></div>
                        <div class="form-cell"><span class="form-label">语音通话背景</span><div style="display:flex;gap:6px;"><button onclick="resetVcBg()" style="font-size:12px; padding:5px 10px; background:#fff5f5; color:#e74c3c; border:1px solid #fdd; border-radius:12px; cursor:pointer;" title="还原通话背景"><i class="fas fa-undo"></i> 还原</button><button onclick="uploadImg('vc-bg')" style="font-size:12px; padding:5px 10px; border-radius:12px;">上传</button></div></div>
                        <div class="form-cell"><span class="form-label">视频通话背景</span><div style="display:flex;gap:6px;"><button onclick="resetVidcallBg()" style="font-size:12px; padding:5px 10px; background:#fff5f5; color:#e74c3c; border:1px solid #fdd; border-radius:12px; cursor:pointer;" title="还原视频通话背景"><i class="fas fa-undo"></i> 还原</button><button onclick="uploadImg('vidcall-bg')" style="font-size:12px; padding:5px 10px; border-radius:12px;">上传</button></div></div>
                        ${c.settings.vidcallBg ? `<div class="form-cell"><span class="form-label">视频通话动态渲染</span><div class="switch"><input type="checkbox" id="edit-c-vidcall-dynamic" ${c.settings.vidcallDynamic?'checked':''}><span class="slider"></span></div></div>
                        <div style="padding:4px 12px 8px; font-size:12px; color:#999;">开启后视频通话背景会有轻微呼吸和浮动效果。</div>` : ''}
                        ${c.settings.vidcallBg ? `<div style="padding:8px 12px;"><div style="font-size:12px; color:#999; margin-bottom:6px;">当前视频通话背景预览：</div><div style="width:100%; height:80px; border-radius:8px; overflow:hidden; border:1px solid #eee;"><img src="${c.settings.vidcallBg}" style="width:100%; height:100%; object-fit:cover;"></div></div>` : ''}
                        <div class="form-cell" onclick="toggleStickerMount()"><span class="form-label">挂载表情分类</span><span class="form-val" id="sticker-count">${currentCateIds.length}个</span><i class="fas fa-chevron-right form-arrow"></i></div>
                        <div id="sticker-mount-area" style="display:none; padding:10px; background:#f9f9f9; flex-direction:column; gap:5px;">
                            ${allCates.length>0 ? allCates.map(cate => `<div onclick="toggleStickerSelect(this, '${cate.id}')" class="sticker-select-item" style="padding:10px; border:1px solid ${currentCateIds.includes(cate.id)?'#07c160':'#ddd'}; border-radius:6px; cursor:pointer; background:#fff; display:flex; justify-content:space-between; align-items:center;"><span>${cate.name}</span> ${currentCateIds.includes(cate.id) ? '<i class="fas fa-check" style="color:#07c160;"></i>' : ''}</div>`).join('') : '<div style="font-size:12px; color:#999;">无分类</div>'}
                        </div>
                    </div>
                    <div class="group-box">
                        <div class="form-cell"><span class="form-label">推荐回复</span><div class="switch"><input type="checkbox" id="edit-c-smart-reply" ${c.settings.enableSmartReply?'checked':''}><span class="slider"></span></div></div>
                        <div style="padding:8px 12px; font-size:12px; color:#999; line-height:1.5;">
                            开启后，对方发送消息时会自动生成推荐回复供你选择。
                        </div>
                        <div class="form-cell"><span class="form-label">自动翻译</span><div class="switch"><input type="checkbox" id="edit-c-auto-translate" ${c.settings.autoTranslate?'checked':''}><span class="slider"></span></div></div>
                        <div style="padding:8px 12px; font-size:12px; color:#999; line-height:1.5;">
                            开启后，AI每轮回复完成时自动翻译外语内容为中文。
                        </div>
                    </div>
                    <div class="group-box">
                        <div class="form-cell"><span class="form-label">主动发消息</span><div class="switch"><input type="checkbox" id="edit-c-auto" ${c.settings.autoMsg?'checked':''}><span class="slider"></span></div></div>
                        <div class="form-cell"><span class="form-label">主动间隔(分)</span><input type="number" id="edit-c-auto-int" value="${c.settings.autoMsgInterval||30}" style="width:50px; text-align:center;"></div>
                        <div class="form-cell"><span class="form-label">主动发动态</span><div class="switch"><input type="checkbox" id="edit-c-auto-mom" ${c.settings.autoMoment?'checked':''}><span class="slider"></span></div></div>
                        <div class="form-cell"><span class="form-label">定时写日记</span><div class="switch"><input type="checkbox" id="edit-c-auto-dia" ${c.settings.autoDiary?'checked':''}><span class="slider"></span></div></div>
                        <div class="form-cell"><span class="form-label">日记时间</span><input type="time" id="edit-c-dia-time" value="${c.settings.diaryTime||'22:00'}" style="border:none;"></div>
                        <div class="form-cell"><span class="form-label">强制禁止动作描写</span><div class="switch"><input type="checkbox" id="edit-c-no-action" ${c.settings.noActionDescription?'checked':''}><span class="slider"></span></div></div>
                        <div class="form-cell"><span class="form-label">显示联系人状态</span><div class="switch"><input type="checkbox" id="edit-c-show-status" ${c.settings.hideContactStatus?'':'checked'}><span class="slider"></span></div></div>
                        <div style="padding:4px 12px 8px; font-size:12px; color:#999; line-height:1.5;">关闭后，聊天界面顶部不再显示联系人的在线状态（如"正在想你"、"干饭中"等）。</div>
                        <div class="form-cell"><span class="form-label">线下/线上记忆互通</span><div class="switch"><input type="checkbox" id="edit-c-mem-interop" ${c.settings.memoryInterop !== false?'checked':''}><span class="slider"></span></div></div>
                        <div class="form-cell"><span class="form-label">允许反向查岗</span><div class="switch"><input type="checkbox" id="edit-c-allow-reverse-check" ${c.settings.allowReverseCheck !== false?'checked':''}><span class="slider"></span></div></div>
                        <div class="form-cell"><span class="form-label">联系人锁手机</span><div class="switch"><input type="checkbox" id="edit-c-phone-lock" ${c.settings.phoneLockEnabled?'checked':''}><span class="slider"></span></div></div>
                        <div style="padding:4px 12px 8px; font-size:12px; color:#999; line-height:1.5;">开启后，深夜(23:00-6:00)如果你还在玩手机，联系人有几率发现并质问你，符合TA的人设风格。</div>
                        <div class="form-cell"><span class="form-label">查手机语言</span><select id="edit-c-phone-lang" style="width:130px; padding:6px 10px; border:1px solid #ddd; border-radius:6px; font-size:13px;">
                            <option value="" ${!c.settings.phoneLanguage?'selected':''}>自动检测</option>
                            <option value="zh" ${c.settings.phoneLanguage==='zh'?'selected':''}>中文</option>
                            <option value="en" ${c.settings.phoneLanguage==='en'?'selected':''}>English</option>
                            <option value="ja" ${c.settings.phoneLanguage==='ja'?'selected':''}>日本語</option>
                            <option value="ko" ${c.settings.phoneLanguage==='ko'?'selected':''}>한국어</option>
                            <option value="fr" ${c.settings.phoneLanguage==='fr'?'selected':''}>Français</option>
                            <option value="de" ${c.settings.phoneLanguage==='de'?'selected':''}>Deutsch</option>
                            <option value="es" ${c.settings.phoneLanguage==='es'?'selected':''}>Español</option>
                            <option value="ru" ${c.settings.phoneLanguage==='ru'?'selected':''}>Русский</option>
                            <option value="th" ${c.settings.phoneLanguage==='th'?'selected':''}>ไทย</option>
                            <option value="it" ${c.settings.phoneLanguage==='it'?'selected':''}>Italiano</option>
                            <option value="pt" ${c.settings.phoneLanguage==='pt'?'selected':''}>Português</option>
                            <option value="ar" ${c.settings.phoneLanguage==='ar'?'selected':''}>العربية</option>
                        </select></div>
                        <div style="padding:4px 12px 8px; font-size:12px; color:#999; line-height:1.5;">设置后查手机生成的内容将使用对应语言，并附带中文翻译按钮。"自动检测"会根据人设自动判断。</div>
                        <div class="form-cell"><span class="form-label">上下文记忆轮数</span><input type="number" id="edit-c-context-turns" value="${c.settings.contextTurns || 20}" min="1" max="200" style="width:60px; text-align:center; border:1px solid #ddd; border-radius:4px; padding:4px;"> <span style="font-size:12px; color:#999; margin-left:4px;">轮</span></div>
                    </div>
                    <h3 style="margin:10px 15px; color:#555;">回复格式设置</h3>
                    <div class="group-box">
                        <div class="form-cell"><span class="form-label">每条回复最少字数</span><input type="number" id="edit-c-reply-min-chars" value="${c.settings.replyMinChars || ''}" min="1" max="500" placeholder="不限" style="width:60px; text-align:center; border:1px solid #ddd; border-radius:4px; padding:4px;"> <span style="font-size:12px; color:#999; margin-left:4px;">字</span></div>
                        <div class="form-cell"><span class="form-label">每条回复最多字数</span><input type="number" id="edit-c-reply-max-chars" value="${c.settings.replyMaxChars || ''}" min="1" max="500" placeholder="不限" style="width:60px; text-align:center; border:1px solid #ddd; border-radius:4px; padding:4px;"> <span style="font-size:12px; color:#999; margin-left:4px;">字</span></div>
                        <div class="form-cell"><span class="form-label">回复最少条数</span><input type="number" id="edit-c-reply-min-msgs" value="${c.settings.replyMinMsgs || ''}" min="1" max="20" placeholder="不限" style="width:60px; text-align:center; border:1px solid #ddd; border-radius:4px; padding:4px;"> <span style="font-size:12px; color:#999; margin-left:4px;">条</span></div>
                        <div class="form-cell"><span class="form-label">回复最多条数</span><input type="number" id="edit-c-reply-max-msgs" value="${c.settings.replyMaxMsgs || ''}" min="1" max="20" placeholder="不限" style="width:60px; text-align:center; border:1px solid #ddd; border-radius:4px; padding:4px;"> <span style="font-size:12px; color:#999; margin-left:4px;">条</span></div>
                        <div style="padding:8px 12px; font-size:12px; color:#999; line-height:1.5;">
                            设定联系人每次回复的字数范围和消息条数范围。留空表示不限制，使用默认规则。
                        </div>
                    </div>
                    <h3 style="margin:10px 15px; color:#555;">语音设置</h3>
                    <div class="group-box">
                        <div class="form-cell">
                            <span class="form-label">开启语音合成 (TTS)</span>
                            <div class="switch"><input type="checkbox" id="edit-c-enable-tts" ${c.settings.enableTTS?'checked':''}><span class="slider"></span></div>
                        </div>
                        <div class="form-cell">
                            <span class="form-label">音色ID</span>
                            <input id="edit-c-voice-id" value="${c.settings.voiceId||'male-qn-qingse'}" style="border:1px solid #e5e5e5; border-radius:8px; padding:8px; width:150px; text-align:center;" placeholder="输入音色ID">
                        </div>
                        <div class="form-cell">
                            <span class="form-label">语言</span>
                            <select id="edit-c-voice-lang">
                                <option value="zh" ${(!c.settings.voiceLang || c.settings.voiceLang==='zh')?'selected':''}>中文 (Chinese)</option>
                                <option value="yue" ${c.settings.voiceLang==='yue'?'selected':''}>粤语 (Cantonese)</option>
                                <option value="en" ${c.settings.voiceLang==='en'?'selected':''}>英文 (English)</option>
                                <option value="ja" ${c.settings.voiceLang==='ja'?'selected':''}>日语 (Japanese)</option>
                                <option value="ko" ${c.settings.voiceLang==='ko'?'selected':''}>韩语 (Korean)</option>
                                <option value="es" ${c.settings.voiceLang==='es'?'selected':''}>西班牙语 (Spanish)</option>
                                <option value="fr" ${c.settings.voiceLang==='fr'?'selected':''}>法语 (French)</option>
                                <option value="de" ${c.settings.voiceLang==='de'?'selected':''}>德语 (German)</option>
                                <option value="id" ${c.settings.voiceLang==='id'?'selected':''}>印尼语 (Indonesian)</option>
                            </select>
                        </div>
                    </div>
                    <h3 style="margin:10px 15px; color:#555;">感知设置</h3>
                    <div class="group-box">
                        <div class="form-cell"><span class="form-label">天气与时间感知</span><div class="switch"><input type="checkbox" id="edit-c-perc-en" ${c.settings.enablePerception!==false?'checked':''}><span class="slider"></span></div></div>
                        <div class="form-cell" style="flex-direction:column; align-items:flex-start; background:#f9f9f9;"><span class="form-label" style="font-size:14px; font-weight:bold; margin-bottom:5px;">用户所在地</span><div style="width:100%; display:flex; flex-wrap:wrap; gap:8px; margin-bottom:5px;"><input id="edit-c-user-v-city" placeholder="虚拟城市" value="${c.settings.userVirtualCity||''}" style="flex:1 1 calc(50% - 4px); min-width:120px; padding:8px; border:1px solid #ddd; border-radius:4px; box-sizing:border-box;"><input id="edit-c-user-r-city" placeholder="真实城市" value="${c.settings.userRealCity||''}" style="flex:1 1 calc(50% - 4px); min-width:120px; padding:8px; border:1px solid #ddd; border-radius:4px; box-sizing:border-box;"></div></div>
                        <div class="form-cell" style="flex-direction:column; align-items:flex-start; background:#f9f9f9;"><span class="form-label" style="font-size:14px; font-weight:bold; margin-bottom:5px;">对方所在地 (留空则同用户)</span><div style="width:100%; display:flex; flex-wrap:wrap; gap:8px; margin-bottom:5px;"><input id="edit-c-ai-v-city" placeholder="虚拟城市" value="${c.settings.aiVirtualCity||''}" style="flex:1 1 calc(50% - 4px); min-width:120px; padding:8px; border:1px solid #ddd; border-radius:4px; box-sizing:border-box;"><input id="edit-c-ai-r-city" placeholder="真实城市" value="${c.settings.aiRealCity||''}" style="flex:1 1 calc(50% - 4px); min-width:120px; padding:8px; border:1px solid #ddd; border-radius:4px; box-sizing:border-box;"></div></div>
                    </div>
                    <h3 style="margin:10px 15px; color:#555;">时间戳设置</h3>
                    <div class="group-box">
                        <div class="form-cell"><span class="form-label">显示时间戳</span><div class="switch"><input type="checkbox" id="edit-c-ts-show" ${(c.settings.timestampSettings?.show !== false)?'checked':''}><span class="slider"></span></div></div>
                        <div class="form-cell"><span class="form-label">时间戳位置</span><select id="edit-c-ts-position" style="width:120px;">
                            <option value="center" ${(c.settings.timestampSettings?.position||'center')==='center'?'selected':''}>居中显示</option>
                            <option value="avatar" ${(c.settings.timestampSettings?.position||'')==='avatar'?'selected':''}>头像下方</option>
                        </select></div>
                    </div>
                    <h3 style="margin:10px 15px; color:#555;">头像显示设置</h3>
                    <div class="group-box">
                        <div class="form-cell"><span class="form-label">隐藏我的头像</span><div class="switch"><input type="checkbox" id="edit-c-hide-my-avatar" ${c.settings.avatarSettings?.hideMe?'checked':''}><span class="slider"></span></div></div>
                        <div class="form-cell"><span class="form-label">隐藏对方头像</span><div class="switch"><input type="checkbox" id="edit-c-hide-other-avatar" ${c.settings.avatarSettings?.hideOther?'checked':''}><span class="slider"></span></div></div>
                    </div>
                    <h3 style="margin:10px 15px; color:#555;">拉黑设置</h3>
                    <div class="group-box">
                        <div class="form-cell"><span class="form-label">将 ${c.name} 拉黑</span><div class="switch"><input type="checkbox" id="edit-c-block-by-me" ${c.settings.blockedByMe?'checked':''}><span class="slider"></span></div></div>
                        <div class="form-cell"><span class="form-label">允许 ${c.name} 拉黑你</span><div class="switch"><input type="checkbox" id="edit-c-blacklist" ${c.settings.blacklisted?'checked':''}><span class="slider"></span></div></div>
                    </div>
                    <h3 style="margin:10px 15px; color:#555;">拍一拍设置</h3>
                    <div class="group-box">
                        <div class="form-cell"><span class="form-label">角色被拍后缀</span><input id="edit-c-poke-suffix" value="${c.settings.pokeSuffix||''}" style="border:1px solid #e5e5e5; border-radius:8px; padding:8px; width:150px; text-align:center;" placeholder="如：肚子、脑袋"></div>
                        <div class="form-cell"><span class="form-label">用户被拍后缀</span><input id="edit-c-user-poke-suffix" value="${c.settings.userPokeSuffix||''}" style="border:1px solid #e5e5e5; border-radius:8px; padding:8px; width:150px; text-align:center;" placeholder="角色拍你时的后缀"></div>
                        <div style="padding:6px 12px; font-size:11px; color:#999; line-height:1.5;">角色会在主动拍一拍时自动更改后缀</div>
                    </div>
                    <h3 style="margin:10px 15px; color:#555;">独立美化预设</h3>
                    <div class="group-box">
                        <div style="padding:8px 12px; font-size:12px; color:#999; line-height:1.5; margin-bottom:4px;">
                            从已保存的美化预设中加载，仅对当前联系人生效。不会影响全局美化设置。
                        </div>
                        <div class="form-cell" onclick="openContactPresetPopup('bubble')">
                            <span class="form-label">气泡美化</span>
                            <span class="form-val" style="color:${c.settings.contactCSS?.bubble ? '#07c160' : '#999'};">${c.settings.contactCSS?.bubble ? '已设置' : '未设置'}</span>
                            <i class="fas fa-chevron-right form-arrow"></i>
                        </div>
                        <div class="form-cell" onclick="openContactPresetPopup('global')">
                            <span class="form-label">全局美化</span>
                            <span class="form-val" style="color:${c.settings.contactCSS?.global ? '#07c160' : '#999'};">${c.settings.contactCSS?.global ? '已设置' : '未设置'}</span>
                            <i class="fas fa-chevron-right form-arrow"></i>
                        </div>
                        <div class="form-cell" onclick="openContactPresetPopup('offline')">
                            <span class="form-label">线下模式美化</span>
                            <span class="form-val" style="color:${c.settings.contactCSS?.offline ? '#07c160' : '#999'};">${c.settings.contactCSS?.offline ? '已设置' : '未设置'}</span>
                            <i class="fas fa-chevron-right form-arrow"></i>
                        </div>
                        ${(c.settings.contactCSS?.bubble || c.settings.contactCSS?.global || c.settings.contactCSS?.offline) ? '<div class="form-cell" onclick="clearContactCSS()" style="justify-content:center;"><span style="color:#fa5151; font-size:14px;"><i class="fas fa-trash-alt" style="margin-right:6px;"></i>清除所有独立美化</span></div>' : ''}
                    </div>
                `;
             }
             document.getElementById('chat-settings-content').innerHTML = settingsHTML;
             
             // 初始化置顶开关状态
             const pinSwitch = document.getElementById('pin-contact-switch');
             if(pinSwitch) {
                 pinSwitch.checked = c.pinned || false;
             }
        }
        let tempMountedCateIds = [];
        
        function toggleStickerMount() {
            const area = document.getElementById('sticker-mount-area');
            const c = store.contacts.find(x=>x.id===activeChatId);
            if(!c) return;
            // [FIX-表情包挂载] 不再重新初始化tempMountedCateIds
            // 已在openChatSettings中初始化，这里只负责展开/收起UI
            area.style.display = area.style.display === 'none' ? 'flex' : 'none';
        }
        
        function toggleStickerSelect(el, id) {
            if(tempMountedCateIds.includes(id)) {
                tempMountedCateIds = tempMountedCateIds.filter(x=>x!==id);
                el.style.borderColor = '#ddd';
                el.querySelector('.fa-check')?.remove();
            } else {
                tempMountedCateIds.push(id);
                el.style.borderColor = '#07c160';
                if(!el.querySelector('.fa-check')) el.innerHTML += '<i class="fas fa-check" style="color:#07c160;"></i>';
            }
            document.getElementById('sticker-count').innerText = tempMountedCateIds.length + '个';
        }

        function resetChatBg() {
            const c = store.contacts.find(x=>x.id===activeChatId);
            if(!c) return;
            if(!c.settings) c.settings = {};
            c.settings.bg = '';
            save();
            // Clear the chat history background
            const chatHistEl = document.getElementById('chat-history');
            if(chatHistEl) {
                chatHistEl.classList.remove('has-custom-bg');
                // [FIX-壁纸被覆盖] 使用removeProperty清除important样式
                chatHistEl.style.removeProperty('background-image');
                chatHistEl.style.removeProperty('background-size');
                chatHistEl.style.removeProperty('background-position');
                chatHistEl.style.removeProperty('background-repeat');
            }
            /* [FIX-悬浮底栏白色] 同步清除layer-chat背景 */
            const _layerChat3 = document.getElementById('layer-chat');
            if(_layerChat3) {
                _layerChat3.style.removeProperty('background-image');
                _layerChat3.style.removeProperty('background-size');
                _layerChat3.style.removeProperty('background-position');
                _layerChat3.style.removeProperty('background-repeat');
            }
            toast('聊天背景已还原 ✅', 'success');
        }

        function resetVcBg() {
            const c = store.contacts.find(x=>x.id===activeChatId);
            if(!c) return;
            if(!c.settings) c.settings = {};
            c.settings.vcBg = '';
            save();
            toast('语音通话背景已还原 ✅', 'success');
        }

        function resetVidcallBg() {
            const c = store.contacts.find(x=>x.id===activeChatId);
            if(!c) return;
            if(!c.settings) c.settings = {};
            c.settings.vidcallBg = '';
            c.settings.vidcallDynamic = false;
            save();
            openChatSettings(); // 刷新设置页面
            toast('视频通话背景已还原 ✅', 'success');
        }

        function saveChatSettings() {
            // [FIX] 先让输入框失焦，避免移动端键盘收起引起布局抖动导致第一次点击失效
            document.activeElement && document.activeElement.blur();
            const c = store.contacts.find(x=>x.id===activeChatId);
            if(!c) return;
            if(!c.settings) c.settings = {};
            
            // [FIX-设置保存] 整个保存过程用try-catch包裹，防止任何DOM读取错误导致整个函数中止
            try {
                // [FIX-1] 重构设置保存逻辑，兼容群聊和私聊
                // 通用设置 - 添加null检查
                const nameEl = document.getElementById('edit-c-name');
                if (nameEl) c.name = nameEl.value;
                const percEl = document.getElementById('edit-c-perc-en');
                if (percEl) c.settings.enablePerception = percEl.checked;

                // 推荐回复设置
                const smartReplyEl = document.getElementById('edit-c-smart-reply');
                if (smartReplyEl) c.settings.enableSmartReply = smartReplyEl.checked;

                // [NEW-自动翻译] 保存自动翻译开关
                const autoTranslateEl = document.getElementById('edit-c-auto-translate');
                if (autoTranslateEl) c.settings.autoTranslate = autoTranslateEl.checked;

                // [NEW-默认线下模式] 保存默认线下模式开关
                const defaultOfflineEl = document.getElementById('edit-c-default-offline');
                if (defaultOfflineEl) c.settings.defaultOffline = defaultOfflineEl.checked;

                // 记忆总结设置
                const memoryEnableEl = document.getElementById('edit-c-memory-enable');
                if (memoryEnableEl) {
                    c.settings.enableMemorySummary = memoryEnableEl.checked;
                    const memoryIntervalEl = document.getElementById('edit-c-memory-interval');
                    if (memoryIntervalEl) {
                         c.settings.memoryInterval = parseInt(memoryIntervalEl.value) || 10;
                    }
                }

                if (c.isGroup) {
                    // 仅群聊设置
                    const historyEl = document.getElementById('edit-c-history');
                    if(historyEl) c.settings.historyInteroperability = historyEl.checked;
                    // [群聊语音] 保存群聊TTS语音设置
                    const ttsEl = document.getElementById('edit-c-enable-tts');
                    if (ttsEl) c.settings.enableTTS = ttsEl.checked;
                    const voiceIdEl = document.getElementById('edit-c-voice-id');
                    if (voiceIdEl) c.settings.voiceId = voiceIdEl.value.trim() || 'male-qn-qingse';
                    const voiceLangEl = document.getElementById('edit-c-voice-lang');
                    if (voiceLangEl) c.settings.voiceLang = voiceLangEl.value;
                    // [FIX-群聊人设] 群聊也保存用户人设选择
                    const upEl = document.getElementById('edit-c-up');
                    if (upEl) c.settings.userPersona = upEl.value;
                    // [关系网拉人] 保存群聊NPC自动邀请配置
                    const npcInviteEl = document.getElementById('edit-c-npc-invite');
                    if (npcInviteEl) c.settings.allowNpcInvite = npcInviteEl.checked;
                    const npcChanceEl = document.getElementById('edit-c-npc-chance');
                    if (npcChanceEl) {
                        const pct = parseInt(npcChanceEl.value, 10);
                        c.settings.npcInviteChance = isNaN(pct) ? 0.15 : Math.max(0.01, Math.min(1, pct / 100));
                    }
                    const npcMaxEl = document.getElementById('edit-c-npc-max');
                    if (npcMaxEl) {
                        const mx = parseInt(npcMaxEl.value, 10);
                        c.settings.npcInviteMax = isNaN(mx) ? 3 : Math.max(1, Math.min(50, mx));
                    }
                    const npcSourceEl = document.getElementById('edit-c-npc-source');
                    if (npcSourceEl) c.settings.npcInviteSourceContact = npcSourceEl.value || '';
                                    // 群管理设置保存
                    const muteAllEl = document.getElementById('edit-gc-mute-all');
                    if (muteAllEl) {
                        const wasMuteAll = c.muteAll || false;
                        c.muteAll = muteAllEl.checked;
                        if (!wasMuteAll && c.muteAll) {
                            if (!store.chats[c.id]) store.chats[c.id] = [];
                            store.chats[c.id].push({ sender: 'system', type: 'poke', content: '群主已开启全体禁言', time: Date.now() });
                        } else if (wasMuteAll && !c.muteAll) {
                            if (!store.chats[c.id]) store.chats[c.id] = [];
                            store.chats[c.id].push({ sender: 'system', type: 'poke', content: '群主已关闭全体禁言', time: Date.now() });
                        }
                    }
                    const myNickEl = document.getElementById('edit-gc-my-nick');
                    if (myNickEl) {
                        if (!c.groupNicknames) c.groupNicknames = {};
                        const oldNick = c.groupNicknames['__user__'] || '';
                        c.groupNicknames['__user__'] = myNickEl.value.trim();
                        if (oldNick !== myNickEl.value.trim() && myNickEl.value.trim()) {
                            if (!store.chats[c.id]) store.chats[c.id] = [];
                            store.chats[c.id].push({ sender: 'system', type: 'poke', content: `群主修改了群昵称为「${myNickEl.value.trim()}」`, time: Date.now() });
                        }
                    }
                    const myTitleEl = document.getElementById('edit-gc-my-title');
                    if (myTitleEl) {
                        if (!c.groupTitles) c.groupTitles = {};
                        const oldTitle = c.groupTitles['__user__'] || '';
                        c.groupTitles['__user__'] = myTitleEl.value.trim();
                        if (oldTitle !== myTitleEl.value.trim() && myTitleEl.value.trim()) {
                            if (!store.chats[c.id]) store.chats[c.id] = [];
                            store.chats[c.id].push({ sender: 'system', type: 'poke', content: `群主获得了群头衔「${myTitleEl.value.trim()}」`, time: Date.now() });
                        }
                    }
                } else {
                    // 仅私聊设置 - [FIX-设置保存] 所有DOM读取都添加null检查
                    const personaEl = document.getElementById('edit-c-persona');
                    if (personaEl) c.persona = personaEl.value;
                    // 自定义系统提示词保存
                    const customSysPromptEl = document.getElementById('edit-c-custom-sys-prompt');
                    if (customSysPromptEl) c.settings.customSystemPrompt = customSysPromptEl.value.trim();
                    // 备注保存
                    const remarkEl = document.getElementById('edit-c-remark');
                    if (remarkEl) {
                        const oldRemark = c.remark || '';
                        const newRemark = remarkEl.value.trim();
                        if (oldRemark !== newRemark) {
                            c.remark = newRemark;
                            // 更新聊天标题
                            const _titleEl = document.getElementById('chat-title-name') || document.getElementById('chat-title');
                            if (_titleEl) _titleEl.innerText = newRemark || c.name;
                            // 通知联系人备注变更
                            if (newRemark) _notifyContactRemarkChanged(c, oldRemark, newRemark);
                        }
                    }
                    // [性别] 保存
                    const genderEl = document.getElementById('edit-c-gender');
                    if (genderEl) {
                        let _gv = genderEl.value || '';
                        if (_gv === '__custom__') {
                            const _cv = document.getElementById('edit-c-gender-custom');
                            _gv = (_cv?.value || '').trim();
                        }
                        c.gender = _gv;
                    }
                    const upEl = document.getElementById('edit-c-up');
                    if (upEl) c.settings.userPersona = upEl.value;
                    const autoEl = document.getElementById('edit-c-auto');
                    if (autoEl) {
                        c.settings.autoMsg = autoEl.checked;
                    } else if (c.settings.autoMsg === undefined) {
                        c.settings.autoMsg = false;
                    }
                    const autoIntEl = document.getElementById('edit-c-auto-int');
                    if (autoIntEl) c.settings.autoMsgInterval = parseInt(autoIntEl.value);
                    const autoMomEl = document.getElementById('edit-c-auto-mom');
                    if (autoMomEl) {
                        c.settings.autoMoment = autoMomEl.checked;
                    } else if (c.settings.autoMoment === undefined) {
                        c.settings.autoMoment = false;
                    }
                    const autoDiaEl = document.getElementById('edit-c-auto-dia');
                    if (autoDiaEl) {
                        c.settings.autoDiary = autoDiaEl.checked;
                    } else if (c.settings.autoDiary === undefined) {
                        c.settings.autoDiary = false;
                    }
                    const diaTimeEl = document.getElementById('edit-c-dia-time');
                    if (diaTimeEl) c.settings.diaryTime = diaTimeEl.value;
                    const noActionEl = document.getElementById('edit-c-no-action');
                    if (noActionEl) {
                        c.settings.noActionDescription = noActionEl.checked;
                    } else if (c.settings.noActionDescription === undefined) {
                        c.settings.noActionDescription = false;
                    }
                    const showStatusEl = document.getElementById('edit-c-show-status');
                    if (showStatusEl) {
                        const _prevHide = !!(c.settings && c.settings.hideContactStatus);
                        c.settings.hideContactStatus = !showStatusEl.checked;
                        // [FIX-状态开关绕过] 从"显示"切到"隐藏"时，立即清理缓存并隐藏DOM
                        // 避免异步AI回调仍把状态回填到顶栏
                        if (!_prevHide && c.settings.hideContactStatus) {
                            try { if (c.status) c.status = ''; } catch(e){}
                            try {
                                if (window._aiStatusCache) delete window._aiStatusCache[c.id];
                                // 兼容模块内局部缓存：通过暴露给 window 的清理接口清掉
                                if (typeof window.clearContactAIStatusCache === 'function') {
                                    window.clearContactAIStatusCache(c.id);
                                }
                            } catch(e){}
                            if (typeof activeChatId !== 'undefined' && activeChatId === c.id) {
                                var _st = document.getElementById('chat-title-status');
                                if (_st) { _st.innerHTML=''; _st.style.display='none'; }
                            }
                        }
                    }
                    const memInteropEl = document.getElementById('edit-c-mem-interop');
                    if (memInteropEl) {
                        c.settings.memoryInterop = memInteropEl.checked;
                    } else if (c.settings.memoryInterop === undefined) {
                        c.settings.memoryInterop = true; // 默认开启
                    }
                    const allowReverseCheckEl = document.getElementById('edit-c-allow-reverse-check');
                    if (allowReverseCheckEl) {
                        c.settings.allowReverseCheck = allowReverseCheckEl.checked;
                    } else if (c.settings.allowReverseCheck === undefined) {
                        c.settings.allowReverseCheck = true; // 默认允许
                    }
                    const phoneLockEl = document.getElementById('edit-c-phone-lock');
                    if (phoneLockEl) {
                        c.settings.phoneLockEnabled = phoneLockEl.checked;
                        // [FIX-锁手机设置] 关闭锁手机时，同时清除该联系人的持久化锁屏状态
                        if (!phoneLockEl.checked) {
                            // [FIX-锁手机关闭不生效] 仅清持久化不够：运行时状态(_phoneLockState / _phoneLockShowing)
                            // 和已挂载的锁屏DOM都必须清理，否则旧密码会被 _showPhoneLockScreen 的短路逻辑复用
                            if (store._phoneLockPersist && store._phoneLockPersist.contactId === c.id) {
                                store._phoneLockPersist = null;
                            }
                            try {
                                if (typeof _phoneLockState !== 'undefined'
                                    && (_phoneLockState.lockContactId === c.id
                                        || (typeof activeChatId !== 'undefined' && activeChatId === c.id))) {
                                    var _plScr = document.getElementById('phone-lock-screen');
                                    if (_plScr) _plScr.remove();
                                    var _plOv  = document.getElementById('phone-lock-overlay');
                                    if (_plOv)  _plOv.remove();
                                    var _plGen = document.getElementById('phone-lock-generating');
                                    if (_plGen) _plGen.remove();
                                    if (typeof _phoneLockShowing !== 'undefined') _phoneLockShowing = false;
                                    _phoneLockState.lockPassword = '';
                                    _phoneLockState.lockHint = '';
                                    _phoneLockState.lockContactId = '';
                                    _phoneLockState.cheating = false;
                                    if (_phoneLockState.cheatTimer) {
                                        clearTimeout(_phoneLockState.cheatTimer);
                                        _phoneLockState.cheatTimer = null;
                                    }
                                }
                            } catch(_plErr) { console.warn('[PhoneLock] 关闭清理异常:', _plErr); }
                        }
                    }
                    const phoneLangEl = document.getElementById('edit-c-phone-lang');
                    if (phoneLangEl) {
                        c.settings.phoneLanguage = phoneLangEl.value || '';
                    }
                    const contextTurnsEl = document.getElementById('edit-c-context-turns');
                    if (contextTurnsEl) c.settings.contextTurns = parseInt(contextTurnsEl.value) || 20;
                    const uvCityEl = document.getElementById('edit-c-user-v-city');
                    if (uvCityEl) c.settings.userVirtualCity = uvCityEl.value;
                    const urCityEl = document.getElementById('edit-c-user-r-city');
                    if (urCityEl) c.settings.userRealCity = urCityEl.value;
                    const avCityEl = document.getElementById('edit-c-ai-v-city');
                    if (avCityEl) c.settings.aiVirtualCity = avCityEl.value;
                    const arCityEl = document.getElementById('edit-c-ai-r-city');
                    if (arCityEl) c.settings.aiRealCity = arCityEl.value;
                    const ttsEl = document.getElementById('edit-c-enable-tts');
                    if (ttsEl) c.settings.enableTTS = ttsEl.checked;
                    const voiceIdEl = document.getElementById('edit-c-voice-id');
                    if (voiceIdEl) c.settings.voiceId = voiceIdEl.value;
                    const voiceLangEl = document.getElementById('edit-c-voice-lang');
                    if (voiceLangEl) c.settings.voiceLang = voiceLangEl.value;
                    
                    // 时间戳设置
                    if (!c.settings.timestampSettings) c.settings.timestampSettings = {};
                    const tsShowEl = document.getElementById('edit-c-ts-show');
                    if (tsShowEl) c.settings.timestampSettings.show = tsShowEl.checked;
                    const tsPosEl = document.getElementById('edit-c-ts-position');
                    if (tsPosEl) c.settings.timestampSettings.position = tsPosEl.value;
                    
                    // 头像隐藏设置
                    if (!c.settings.avatarSettings) c.settings.avatarSettings = {};
                    const hideMyEl = document.getElementById('edit-c-hide-my-avatar');
                    if (hideMyEl) c.settings.avatarSettings.hideMe = hideMyEl.checked;
                    const hideOtherEl = document.getElementById('edit-c-hide-other-avatar');
                    if (hideOtherEl) c.settings.avatarSettings.hideOther = hideOtherEl.checked;
                    
                    // 拉黑设置
                    const blockByMeEl = document.getElementById('edit-c-block-by-me');
                    if (blockByMeEl) {
                        const wasBlockedByMe = c.settings.blockedByMe === true;
                        const nowBlockedByMe = blockByMeEl.checked;
                        c.settings.blockedByMe = nowBlockedByMe;
                        // 拉黑/解除拉黑时插入系统消息
                        if (!wasBlockedByMe && nowBlockedByMe) {
                            // 新拉黑：插入系统消息
                            if (!store.chats[c.id]) store.chats[c.id] = [];
                            store.chats[c.id].push({
                                sender: 'system', type: 'block_event',
                                content: `${c.name} 已被你拉黑`,
                                blockType: 'blocked_by_me',
                                time: Date.now()
                            });
                            // [NEW-求情弹窗] 用户拉黑联系人后，延迟触发求情弹窗
                            if (typeof window._triggerBlockPleadPopup === 'function') {
                                setTimeout(function() {
                                    window._triggerBlockPleadPopup(c.id, true);
                                }, 3000 + Math.random() * 5000);
                            }
                        } else if (wasBlockedByMe && !nowBlockedByMe) {
                            // 解除拉黑：插入系统消息
                            if (!store.chats[c.id]) store.chats[c.id] = [];
                            store.chats[c.id].push({
                                sender: 'system', type: 'block_event',
                                content: `你已解除对 ${c.name} 的拉黑`,
                                blockType: 'unblocked_by_me',
                                time: Date.now()
                            });
                        }
                    }
                    const blacklistEl = document.getElementById('edit-c-blacklist');
                    if (blacklistEl) {
                        c.settings.blacklisted = blacklistEl.checked;
                        // 关闭开关时同时解除AI拉黑状态
                        if (!blacklistEl.checked) c.settings.aiBlocked = false;
                    }
                    
                    // 视频通话动态渲染设置
                    const vidcallDynamicEl = document.getElementById('edit-c-vidcall-dynamic');
                    if (vidcallDynamicEl) c.settings.vidcallDynamic = vidcallDynamicEl.checked;
                    
                    // 拍一拍后缀
                    const pokeSuffixEl = document.getElementById('edit-c-poke-suffix');
                    if (pokeSuffixEl) c.settings.pokeSuffix = pokeSuffixEl.value;
                    const userPokeSuffixEl = document.getElementById('edit-c-user-poke-suffix');
                    if (userPokeSuffixEl) c.settings.userPokeSuffix = userPokeSuffixEl.value;
                    
                    // 回复格式设置
                    const replyMinCharsEl = document.getElementById('edit-c-reply-min-chars');
                    if (replyMinCharsEl) c.settings.replyMinChars = replyMinCharsEl.value ? parseInt(replyMinCharsEl.value) : 0;
                    const replyMaxCharsEl = document.getElementById('edit-c-reply-max-chars');
                    if (replyMaxCharsEl) c.settings.replyMaxChars = replyMaxCharsEl.value ? parseInt(replyMaxCharsEl.value) : 0;
                    const replyMinMsgsEl = document.getElementById('edit-c-reply-min-msgs');
                    if (replyMinMsgsEl) c.settings.replyMinMsgs = replyMinMsgsEl.value ? parseInt(replyMinMsgsEl.value) : 0;
                    const replyMaxMsgsEl = document.getElementById('edit-c-reply-max-msgs');
                    if (replyMaxMsgsEl) c.settings.replyMaxMsgs = replyMaxMsgsEl.value ? parseInt(replyMaxMsgsEl.value) : 0;
                }

                // [FIX-表情包挂载] 无论挂载区域是否展开，都保存tempMountedCateIds
                // 之前仅在area可见时保存，导致用户收起后点保存丢失挂载数据
                c.settings.mountedCateIds = [...tempMountedCateIds];
            } catch(e) {
                console.error("[saveChatSettings] Error reading settings from DOM:", e);
                toast("部分设置读取失败，请重试", "error");
                // 即使部分设置读取失败，也要保存已成功读取的部分
            }
            
            // [FIX-设置持久化] 直接调用_doSaveNow立即持久化，避免debounced save延迟导致设置丢失
            _doSaveNow();
            
            // [OPT] 修改联系人信息后，清理线下模式缓存状态，防止旧数据冲突
            if (offlineContactId === c.id) {
                if (typeof _resetOfflineState === 'function') {
                    _resetOfflineState();
                } else {
                    offlineContactId = null;
                    isOfflineInChat = false;
                    isGenerating = false;
                }
                // 更新offlineSettings中的联系人数据
                if (typeof offlineSettings !== 'undefined') {
                    offlineSettings.aiName = c.name;
                    offlineSettings.aiAvatar = typeof _getContactAvatar === 'function' ? _getContactAvatar(c) : (c.avatar || '');
                    if (typeof _saveOfflineSettings === 'function') _saveOfflineSettings();
                }
            }
            
            renderContacts();
            renderHistory(); // Refresh chat view to reflect persona/avatar changes
            const titleEl = document.getElementById('chat-title-name') || document.getElementById('chat-title');
            if (titleEl) titleEl.innerText = c.name;
            toast("设置已保存");
        }
        
        function pinContactToggle() {
            const c = store.contacts.find(x=>x.id===activeChatId);
            if(c) {
                const switchEl = document.getElementById('pin-contact-switch');
                if(switchEl) {
                    c.pinned = switchEl.checked;
                } else {
                    c.pinned = !c.pinned;
                }
                save(); renderContacts();
                toast(c.pinned ? "已置顶" : "已取消置顶");
            }
        }

        // --- 联系人独立美化预设功能 ---
        function openContactPresetPopup(type) {
            if (!store.cssPresets) store.cssPresets = { bubble: {}, global: {}, offline: {} };
            const presets = store.cssPresets[type] || {};
            const names = Object.keys(presets);
            const typeLabelsMap = { bubble: '气泡', global: '界面', offline: '线下模式' };
            const typeLabel = typeLabelsMap[type] || type;
            const c = store.contacts.find(x => x.id === activeChatId);
            if (!c) return;
            const currentCSS = c.settings?.contactCSS?.[type] || '';

            let html = '<div style="max-height:400px;overflow-y:auto;">';

            // 当前状态显示
            if (currentCSS) {
                html += `<div style="padding:12px;background:#f0faf0;border-bottom:2px solid #07c160;display:flex;align-items:center;justify-content:space-between;">
                    <span style="font-size:13px;color:#07c160;"><i class="fas fa-check-circle" style="margin-right:6px;"></i>当前已设置${typeLabel}美化</span>
                    <span onclick="clearContactCSSType('${type}')" style="color:#fa5151;font-size:12px;padding:4px 10px;border:1px solid #fdd;border-radius:12px;cursor:pointer;background:#fff;">清除</span>
                </div>`;
            }

            // [FIX-直接输入CSS] 添加直接输入CSS代码区域，默认收起
            html += `<div style="border-bottom:1px solid #f0f0f0;">
                <div onclick="var area=document.getElementById('contact-css-direct-input-area');var arrow=document.getElementById('contact-css-direct-arrow');if(area.style.display==='none'){area.style.display='block';arrow.className='fas fa-chevron-up';}else{area.style.display='none';arrow.className='fas fa-chevron-down';}" style="display:flex;align-items:center;justify-content:space-between;padding:12px;cursor:pointer;background:#fafafa;">
                    <span style="font-size:13px;color:#333;"><i class="fas fa-code" style="margin-right:6px;color:#667eea;"></i>直接输入CSS代码</span>
                    <i id="contact-css-direct-arrow" class="fas fa-chevron-down" style="color:#999;font-size:12px;"></i>
                </div>
                <div id="contact-css-direct-input-area" style="display:none;padding:0 12px 12px;">
                    <textarea id="contact-css-direct-textarea" style="width:100%;min-height:120px;max-height:200px;padding:10px;border:1.5px solid #ddd;border-radius:8px;font-family:monospace;font-size:12px;resize:vertical;box-sizing:border-box;outline:none;line-height:1.5;background:#f9f9f9;" placeholder="粘贴${typeLabel}美化CSS代码...">${currentCSS ? currentCSS.replace(/</g,'&lt;').replace(/>/g,'&gt;') : ''}</textarea>
                    <div style="display:flex;gap:8px;margin-top:8px;">
                        <button onclick="(function(){var css=document.getElementById('contact-css-direct-textarea').value.trim();if(!css){toast('请输入CSS代码','error');return;}var c=store.contacts.find(function(x){return x.id===activeChatId;});if(!c)return;if(!c.settings)c.settings={};if(!c.settings.contactCSS)c.settings.contactCSS={};c.settings.contactCSS['${type}']=css;save();if(typeof applyContactCSS==='function')applyContactCSS(activeChatId);toast('${typeLabel}美化已应用 ✅','success');document.getElementById('contact-css-direct-input-area').style.display='none';document.getElementById('contact-css-direct-arrow').className='fas fa-chevron-down';document.getElementById('modal-confirm').style.display='none';openChatSettings();})()" style="flex:1;padding:8px;background:#07c160;color:#fff;border:none;border-radius:8px;font-size:13px;cursor:pointer;"><i class="fas fa-check" style="margin-right:4px;"></i>应用</button>
                        <button onclick="document.getElementById('contact-css-direct-textarea').value='';toast('已清空','info');" style="padding:8px 12px;background:#f5f5f5;color:#666;border:1px solid #ddd;border-radius:8px;font-size:13px;cursor:pointer;"><i class="fas fa-eraser"></i></button>
                    </div>
                </div>
            </div>`;

            // 预设列表
            if (names.length > 0) {
                html += '<div style="padding:8px 12px 4px;font-size:12px;color:#999;">从已保存的预设中选择：</div>';
                names.forEach(name => {
                    const isActive = currentCSS && currentCSS === presets[name];
                    const checkIcon = isActive ? '<i class="fas fa-check" style="margin-right:6px;"></i>' : '';
                    html += `<div style="display:flex;align-items:center;padding:12px 8px;border-bottom:1px solid #f0f0f0;cursor:pointer;${isActive ? 'background:#f6fff6;' : ''}" class="preset-item" data-name="${name}">
                        <span style="flex:1;font-size:14px;${isActive ? 'color:#07c160;font-weight:bold;' : ''}" onclick="loadContactPreset('${type}','${name}')">${checkIcon}${name}</span>
                    </div>`;
                });
            } else if (!currentCSS) {
                html += '<div style="text-align:center;padding:20px 0;color:#999;font-size:13px;">暂无已保存的预设<br><span style="font-size:12px;">可展开上方区域直接输入CSS代码</span></div>';
            }

            html += '</div>';

            const modal = document.getElementById('modal-confirm');
            document.getElementById('confirm-title').textContent = `${typeLabel}美化设置`;
            document.getElementById('confirm-text').innerHTML = html;

            const okBtn = document.getElementById('confirm-btn-ok');
            const cancelBtn = document.getElementById('confirm-btn-cancel');
            const newOk = okBtn.cloneNode(true);
            okBtn.parentNode.replaceChild(newOk, okBtn);
            const newCancel = cancelBtn.cloneNode(true);
            cancelBtn.parentNode.replaceChild(newCancel, cancelBtn);
            newOk.textContent = '关闭';
            newOk.onclick = () => { modal.style.display = 'none'; };
            newCancel.style.display = 'none';
            modal.style.display = 'flex';
        }

        function loadContactPreset(type, presetName) {
            if (!presetName) return;
            const css = store.cssPresets?.[type]?.[presetName];
            if (css === undefined) return toast("预设不存在", "error");

            const c = store.contacts.find(x => x.id === activeChatId);
            if (!c) return;
            if (!c.settings) c.settings = {};
            if (!c.settings.contactCSS) c.settings.contactCSS = {};
            c.settings.contactCSS[type] = css;
            save();

            // 立即应用联系人独立CSS
            applyContactCSS(activeChatId);

            const typeLabelsMap = { bubble: '气泡', global: '界面', offline: '线下模式' };
            toast(`已加载${typeLabelsMap[type] || type}预设: ${presetName}`, "success");
            document.getElementById('modal-confirm').style.display = 'none';
            openChatSettings(); // 刷新设置页面显示状态
        }

        function clearContactCSSType(type) {
            const c = store.contacts.find(x => x.id === activeChatId);
            if (!c || !c.settings?.contactCSS) return;
            delete c.settings.contactCSS[type];
            // 如果所有类型都清空了，删除整个contactCSS对象
            if (!c.settings.contactCSS.bubble && !c.settings.contactCSS.global && !c.settings.contactCSS.offline) {
                delete c.settings.contactCSS;
            }
            save();
            applyContactCSS(activeChatId);
            const typeLabelsMap = { bubble: '气泡', global: '界面', offline: '线下模式' };
            toast(`已清除${typeLabelsMap[type] || type}独立美化`, "success");
            document.getElementById('modal-confirm').style.display = 'none';
            openChatSettings();
        }

        function clearContactCSS() {
            showConfirm("清除独立美化", "确定清除该联系人的所有独立美化设置吗？", () => {
                const c = store.contacts.find(x => x.id === activeChatId);
                if (!c || !c.settings) return;
                delete c.settings.contactCSS;
                save();
                applyContactCSS(activeChatId);
                toast("已清除所有独立美化", "success");
                openChatSettings();
            });
        }

        // 应用/切换联系人独立CSS
        function applyContactCSS(chatId) {
            const c = store.contacts.find(x => x.id === chatId);
            const contactCSS = c?.settings?.contactCSS;

            // [FIX-iOS美化卡顿-2026-05-12] iOS上剥离GPU重属性的辅助函数
            var _isIOSForCSS = document.documentElement.classList.contains('is-ios');
            var _stripBlurForIOS = function(cssText) {
                if (!_isIOSForCSS || !cssText) return cssText;
                return cssText
                    .replace(/[\s;]*-webkit-backdrop-filter\s*:[^;]*;?/gi, ';')
                    .replace(/[\s;]*backdrop-filter\s*:[^;]*;?/gi, ';')
                    .replace(/;{2,}/g, ';');
            };

            // --- 气泡独立CSS ---
            let contactBubbleEl = document.getElementById('contact-style-bubble');
            if (contactCSS?.bubble) {
                if (!contactBubbleEl) {
                    contactBubbleEl = document.createElement('style');
                    contactBubbleEl.id = 'contact-style-bubble';
                    document.head.appendChild(contactBubbleEl);
                }
                contactBubbleEl.innerHTML = _stripBlurForIOS(contactCSS.bubble);
                // 联系人独立CSS优先：隐藏全局自定义气泡CSS
                const globalBubble = document.getElementById('custom-style-bubble');
                if (globalBubble) globalBubble.disabled = true;
            } else {
                if (contactBubbleEl) contactBubbleEl.innerHTML = '';
                // 恢复全局自定义气泡CSS
                const globalBubble = document.getElementById('custom-style-bubble');
                if (globalBubble) globalBubble.disabled = false;
            }

            // --- 全局独立CSS ---
            let contactGlobalEl = document.getElementById('contact-style-global');
            if (contactCSS?.global) {
                if (!contactGlobalEl) {
                    contactGlobalEl = document.createElement('style');
                    contactGlobalEl.id = 'contact-style-global';
                    document.head.appendChild(contactGlobalEl);
                }
                contactGlobalEl.innerHTML = _stripBlurForIOS(contactCSS.global);
                const globalGlobal = document.getElementById('custom-style-global');
                if (globalGlobal) globalGlobal.disabled = true;
            } else {
                if (contactGlobalEl) contactGlobalEl.innerHTML = '';
                const globalGlobal = document.getElementById('custom-style-global');
                if (globalGlobal) globalGlobal.disabled = false;
            }

            // --- 线下模式独立CSS ---
            let contactOfflineEl = document.getElementById('contact-style-offline');
            if (contactCSS?.offline) {
                if (!contactOfflineEl) {
                    contactOfflineEl = document.createElement('style');
                    contactOfflineEl.id = 'contact-style-offline';
                    document.head.appendChild(contactOfflineEl);
                }
                contactOfflineEl.innerHTML = _stripBlurForIOS(contactCSS.offline);
                const globalOffline = document.getElementById('custom-style-offline');
                if (globalOffline) globalOffline.disabled = true;
                // [FIX-线下CSS兼容] 联系人独立线下CSS也需要标记body
                document.body.classList.add('has-custom-offline-css');
            } else {
                if (contactOfflineEl) contactOfflineEl.innerHTML = '';
                const globalOffline = document.getElementById('custom-style-offline');
                if (globalOffline) globalOffline.disabled = false;
                // [FIX-线下CSS兼容] 如果全局也没有线下CSS，移除标记
                if (!store.customCSS?.offline) {
                    document.body.classList.remove('has-custom-offline-css');
                }
            }
        }

        // [性别] 编辑联系人 select 切换
        window._onEditContactGenderChange = function() {
            const sel = document.getElementById('edit-c-gender');
            const cust = document.getElementById('edit-c-gender-custom');
            if (!sel || !cust) return;
            cust.style.display = (sel.value === '__custom__') ? 'inline-block' : 'none';
            if (sel.value !== '__custom__') cust.value = '';
        };
        
