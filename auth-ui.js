/**
 * YAN 账号密码登录 + 设备数量限制 前端 UI
 * -----------------------------------------
 * - 启动时检测本地 token，无 token 则显示登录/注册界面
 * - 登录成功后隐藏蒙层，开始每 30s 心跳
 * - 心跳返回 401（被踢）则弹窗 + 强制重新登录
 *
 * 对外接口（挂在 window.YAN_AUTH 上）：
 *   - getToken()          返回当前 token（无则空字符串）
 *   - getUsername()
 *   - authHeader()        返回 { Authorization: 'Bearer xxx' } 或 {}
 *   - fetchWithAuth(url, init)  带 token 的 fetch，自动处理被踢
 *   - logout()            主动退出
 *   - showDevicesModal()  显示"已登录设备管理"弹窗（可在"我的"页面按钮调用）
 */
(function () {
    'use strict';

    if (window.YAN_AUTH) return; // 防重复加载

    // ========== 配置 ==========
    var API_URL = '/api/auth';
    var LS_TOKEN = 'yan_auth_token';
    var LS_USERNAME = 'yan_auth_username';
    var HEARTBEAT_INTERVAL = 30000; // 30 秒
    var DEVICE_FP_KEY = 'yan_device_fp';

    // ========== 设备指纹（简易版，用于辅助识别） ==========
    function getDeviceFingerprint() {
        try {
            var cached = localStorage.getItem(DEVICE_FP_KEY);
            if (cached) return cached;
            // 仅用稳定字段生成指纹，避免 Safari ITP 清掉 localStorage 后
            // 重新生成的新指纹被后端当成"新设备"占用 3 台设备名额
            var info = [
                screen.width + 'x' + screen.height,
                screen.colorDepth,
                (Intl.DateTimeFormat().resolvedOptions().timeZone || ''),
                navigator.language || '',
                navigator.platform || '',
                navigator.hardwareConcurrency || 0
            ].join('|');
            // 简单哈希
            var h = 0;
            for (var i = 0; i < info.length; i++) {
                h = ((h << 5) - h) + info.charCodeAt(i);
                h |= 0;
            }
            var fp = 'fp-' + Math.abs(h).toString(16);
            localStorage.setItem(DEVICE_FP_KEY, fp);
            return fp;
        } catch (e) {
            return 'fp-unknown';
        }
    }

    // ========== 状态管理 ==========
    function getToken() {
        try { return localStorage.getItem(LS_TOKEN) || ''; } catch (e) { return ''; }
    }
    function getUsername() {
        try { return localStorage.getItem(LS_USERNAME) || ''; } catch (e) { return ''; }
    }
    function setAuth(token, username) {
        try {
            localStorage.setItem(LS_TOKEN, token);
            localStorage.setItem(LS_USERNAME, username);
        } catch (e) {}
    }
    function clearAuth() {
        try {
            localStorage.removeItem(LS_TOKEN);
            localStorage.removeItem(LS_USERNAME);
        } catch (e) {}
    }
    function authHeader() {
        var t = getToken();
        return t ? { 'Authorization': 'Bearer ' + t } : {};
    }

    // ========== HTTP 封装 ==========
    function postJson(action, body, extraHeaders) {
        return fetch(API_URL + '?action=' + encodeURIComponent(action), {
            method: 'POST',
            headers: Object.assign({ 'Content-Type': 'application/json' }, extraHeaders || {}),
            body: JSON.stringify(body || {})
        }).then(function (resp) {
            return resp.json().then(function (data) {
                return { status: resp.status, data: data };
            }).catch(function () {
                return { status: resp.status, data: { error: '响应解析失败' } };
            });
        });
    }

    // 带 token 的 fetch，401 自动触发"被踢"处理
    function fetchWithAuth(url, init) {
        init = init || {};
        init.headers = Object.assign({}, init.headers || {}, authHeader());
        return fetch(url, init).then(function (resp) {
            if (resp.status === 401) {
                // 可能是被踢或 token 过期
                handleKicked('您的登录已失效，请重新登录');
            }
            return resp;
        });
    }

    // ========== 样式注入 ==========
    var STYLE_ID = 'yan-auth-style';
    function injectStyle() {
        if (document.getElementById(STYLE_ID)) return;
        var css = [
            '#yan-auth-overlay{position:fixed;inset:0;z-index:2147483600;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);display:flex;align-items:center;justify-content:center;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"PingFang SC","Microsoft YaHei",sans-serif;padding:20px;box-sizing:border-box;-webkit-user-select:none;user-select:none;}',
            '#yan-auth-overlay *{box-sizing:border-box;}',
            '.yan-auth-card{background:#fff;border-radius:18px;box-shadow:0 20px 60px rgba(0,0,0,0.3);width:100%;max-width:380px;padding:32px 28px;animation:yanAuthIn .35s ease-out;}',
            '@keyframes yanAuthIn{from{opacity:0;transform:translateY(20px) scale(.95);}to{opacity:1;transform:none;}}',
            '.yan-auth-title{font-size:22px;font-weight:700;color:#222;text-align:center;margin:0 0 6px;}',
            '.yan-auth-sub{font-size:13px;color:#888;text-align:center;margin:0 0 24px;}',
            '.yan-auth-field{margin-bottom:14px;}',
            '.yan-auth-field label{display:block;font-size:13px;color:#555;margin-bottom:6px;font-weight:500;}',
            '.yan-auth-field input{width:100%;padding:12px 14px;border:1.5px solid #e0e0e0;border-radius:10px;font-size:15px;outline:none;transition:border-color .2s;background:#fafafa;color:#222;}',
            '.yan-auth-field input:focus{border-color:#667eea;background:#fff;}',
            '.yan-auth-pwd-wrap{position:relative;}',
            '.yan-auth-pwd-wrap input{padding-right:42px;}',
            '.yan-auth-eye{position:absolute;right:12px;top:50%;transform:translateY(-50%);cursor:pointer;color:#aaa;font-size:16px;padding:4px;transition:color .2s;-webkit-tap-highlight-color:transparent;}',
            '.yan-auth-eye:hover{color:#667eea;}',
            '.yan-auth-btn{width:100%;padding:13px;border:none;border-radius:10px;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;font-size:15px;font-weight:600;cursor:pointer;transition:transform .15s,box-shadow .2s;margin-top:8px;}',
            '.yan-auth-btn:hover{transform:translateY(-1px);box-shadow:0 6px 16px rgba(102,126,234,0.4);}',
            '.yan-auth-btn:active{transform:translateY(0);}',
            '.yan-auth-btn:disabled{opacity:.6;cursor:not-allowed;transform:none;box-shadow:none;}',
            '.yan-auth-switch{text-align:center;margin-top:18px;font-size:13px;color:#666;}',
            '.yan-auth-switch a{color:#667eea;cursor:pointer;font-weight:600;text-decoration:none;}',
            '.yan-auth-switch a:hover{text-decoration:underline;}',
            '.yan-auth-error{background:#fff0f0;color:#c0392b;padding:10px 12px;border-radius:8px;font-size:13px;margin-bottom:14px;display:none;border:1px solid #f5c6cb;}',
            '.yan-auth-success{background:#f0fff4;color:#27ae60;padding:10px 12px;border-radius:8px;font-size:13px;margin-bottom:14px;display:none;border:1px solid #c3e6cb;}',
            '.yan-auth-hint{font-size:12px;color:#aaa;text-align:center;margin-top:16px;line-height:1.6;}',
            /* 被踢弹窗 */
            '#yan-kicked-mask{position:fixed;inset:0;z-index:2147483601;background:rgba(0,0,0,0.55);display:flex;align-items:center;justify-content:center;padding:20px;font-family:-apple-system,"PingFang SC","Microsoft YaHei",sans-serif;}',
            '.yan-kicked-box{background:#fff;border-radius:14px;max-width:320px;width:100%;padding:24px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.4);}',
            '.yan-kicked-icon{width:56px;height:56px;border-radius:50%;background:#fff3cd;color:#f39c12;display:flex;align-items:center;justify-content:center;font-size:30px;margin:0 auto 14px;}',
            '.yan-kicked-title{font-size:18px;font-weight:700;color:#222;margin:0 0 8px;}',
            '.yan-kicked-msg{font-size:14px;color:#666;line-height:1.6;margin:0 0 18px;}',
            '.yan-kicked-btn{padding:10px 28px;border:none;border-radius:8px;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;font-size:14px;font-weight:600;cursor:pointer;}',
            /* 设备列表弹窗 */
            '#yan-devices-mask{position:fixed;inset:0;z-index:2147483602;background:rgba(0,0,0,0.55);display:flex;align-items:center;justify-content:center;padding:20px;font-family:-apple-system,"PingFang SC","Microsoft YaHei",sans-serif;}',
            '.yan-devices-box{background:#fff;border-radius:14px;max-width:420px;width:100%;max-height:80vh;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,0.4);}',
            '.yan-devices-head{padding:18px 20px;border-bottom:1px solid #eee;display:flex;justify-content:space-between;align-items:center;}',
            '.yan-devices-head h3{margin:0;font-size:17px;color:#222;}',
            '.yan-devices-close{border:none;background:none;font-size:22px;color:#999;cursor:pointer;padding:0;width:30px;height:30px;}',
            '.yan-devices-list{flex:1;overflow-y:auto;padding:8px 0;}',
            '.yan-device-item{padding:14px 20px;border-bottom:1px solid #f5f5f5;display:flex;justify-content:space-between;align-items:center;}',
            '.yan-device-item:last-child{border-bottom:none;}',
            '.yan-device-info{flex:1;min-width:0;}',
            '.yan-device-name{font-size:14px;color:#222;font-weight:600;margin-bottom:4px;}',
            '.yan-device-meta{font-size:12px;color:#888;}',
            '.yan-device-current{display:inline-block;padding:2px 8px;background:#e3f2fd;color:#1976d2;font-size:11px;border-radius:4px;margin-left:6px;}',
            '.yan-device-kick{padding:6px 12px;background:#fff0f0;color:#c0392b;border:1px solid #f5c6cb;border-radius:6px;font-size:12px;cursor:pointer;}',
            '.yan-device-kick:hover{background:#c0392b;color:#fff;}',
            '.yan-devices-foot{padding:12px 20px;border-top:1px solid #eee;display:flex;gap:10px;}',
            '.yan-devices-foot button{flex:1;padding:10px;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;}',
            '.yan-devices-logout{background:#f5f5f5;color:#333;}',
            '.yan-devices-refresh{background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;}'
        ].join('\n');

        var st = document.createElement('style');
        st.id = STYLE_ID;
        st.textContent = css;
        document.head.appendChild(st);
    }

    // ========== 登录/注册蒙层 ==========
    var overlay = null;
    var currentMode = 'login'; // 'login' | 'register' | 'reset'

    function buildOverlay() {
        injectStyle();
        if (overlay) return overlay;

        overlay = document.createElement('div');
        overlay.id = 'yan-auth-overlay';
        overlay.innerHTML =
            '<div class="yan-auth-card">' +
                '<h2 class="yan-auth-title" id="yan-auth-title">账号登录</h2>' +
                '<p class="yan-auth-sub" id="yan-auth-sub">登录后最多 3 台设备同时在线</p>' +
                '<div class="yan-auth-error" id="yan-auth-err"></div>' +
                '<div class="yan-auth-success" id="yan-auth-ok"></div>' +
                '<div class="yan-auth-field">' +
                    '<label>用户名</label>' +
                    '<input type="text" id="yan-auth-user" autocomplete="username" maxlength="32" placeholder="请输入用户名" />' +
                '</div>' +
                '<div class="yan-auth-field">' +
                    '<label>密码</label>' +
                    '<div class="yan-auth-pwd-wrap">' +
                        '<input type="password" id="yan-auth-pwd" autocomplete="current-password" maxlength="128" placeholder="请输入密码" />' +
                        '<i class="fas fa-eye-slash yan-auth-eye" id="yan-auth-eye"></i>' +
                    '</div>' +
                '</div>' +
                '<div class="yan-auth-field" id="yan-auth-confirm-wrap" style="display:none;">' +
                    '<label>确认密码</label>' +
                    '<div class="yan-auth-pwd-wrap">' +
                        '<input type="password" id="yan-auth-pwd2" autocomplete="new-password" maxlength="128" placeholder="请再次输入密码" />' +
                        '<i class="fas fa-eye-slash yan-auth-eye" id="yan-auth-eye2"></i>' +
                    '</div>' +
                '</div>' +
                '<div class="yan-auth-field" id="yan-auth-invite-wrap" style="display:none;">' +
                    '<label>邀请码</label>' +
                    '<input type="text" id="yan-auth-invite" maxlength="8" placeholder="请输入邀请码" style="text-transform:uppercase;letter-spacing:2px;font-family:monospace;" />' +
                '</div>' +
                '<button class="yan-auth-btn" id="yan-auth-submit">登录</button>' +
                '<div id="yan-auth-forgot-wrap" style="text-align:right;margin-top:8px;margin-bottom:-6px;">' +
                    '<a id="yan-auth-forgot-link" style="font-size:12px;color:#667eea;cursor:pointer;">忘记密码？</a>' +
                '</div>' +
                '<div class="yan-auth-switch">' +
                    '<span id="yan-auth-switch-tip">还没有账号？</span>' +
                    '<a id="yan-auth-switch-link">立即注册</a>' +
                '</div>' +
                '<div class="yan-auth-hint" id="yan-auth-hint">每个账号最多 3 台设备同时登录<br/>超过时最早登录的设备会被自动踢出</div>' +
            '</div>';

        document.body.appendChild(overlay);

        var userInput = overlay.querySelector('#yan-auth-user');
        var pwdInput = overlay.querySelector('#yan-auth-pwd');
        var submitBtn = overlay.querySelector('#yan-auth-submit');
        var switchLink = overlay.querySelector('#yan-auth-switch-link');

        var pwd2Input = overlay.querySelector('#yan-auth-pwd2');
        var inviteInput = overlay.querySelector('#yan-auth-invite');

        // 回车提交
        [userInput, pwdInput, pwd2Input, inviteInput].forEach(function (inp) {
            inp.addEventListener('keydown', function (e) {
                if (e.key === 'Enter') doSubmit();
            });
        });

        submitBtn.addEventListener('click', doSubmit);
        switchLink.addEventListener('click', toggleMode);

        var forgotLink = overlay.querySelector('#yan-auth-forgot-link');
        forgotLink.addEventListener('click', function () {
            switchToMode('reset');
        });

        // 密码可见性切换
        overlay.querySelector('#yan-auth-eye').addEventListener('click', function () {
            var isHidden = pwdInput.type === 'password';
            pwdInput.type = isHidden ? 'text' : 'password';
            this.className = (isHidden ? 'fas fa-eye' : 'fas fa-eye-slash') + ' yan-auth-eye';
        });
        overlay.querySelector('#yan-auth-eye2').addEventListener('click', function () {
            var isHidden = pwd2Input.type === 'password';
            pwd2Input.type = isHidden ? 'text' : 'password';
            this.className = (isHidden ? 'fas fa-eye' : 'fas fa-eye-slash') + ' yan-auth-eye';
        });

        // 回填上次登录的用户名
        try {
            var last = localStorage.getItem(LS_USERNAME);
            if (last) userInput.value = last;
        } catch (e) {}

        return overlay;
    }

    function setOverlayMsg(type, text) {
        if (!overlay) return;
        var err = overlay.querySelector('#yan-auth-err');
        var ok = overlay.querySelector('#yan-auth-ok');
        err.style.display = 'none';
        ok.style.display = 'none';
        if (type === 'error') {
            err.textContent = text;
            err.style.display = 'block';
        } else if (type === 'success') {
            ok.textContent = text;
            ok.style.display = 'block';
        }
    }

    function switchToMode(mode) {
        currentMode = mode;
        var title = overlay.querySelector('#yan-auth-title');
        var sub = overlay.querySelector('#yan-auth-sub');
        var btn = overlay.querySelector('#yan-auth-submit');
        var tip = overlay.querySelector('#yan-auth-switch-tip');
        var link = overlay.querySelector('#yan-auth-switch-link');
        var pwdInput = overlay.querySelector('#yan-auth-pwd');
        var pwdField = pwdInput.closest('.yan-auth-field');

        var confirmWrap = overlay.querySelector('#yan-auth-confirm-wrap');
        var pwd2Input = overlay.querySelector('#yan-auth-pwd2');

        var inviteWrap = overlay.querySelector('#yan-auth-invite-wrap');
        var forgotWrap = overlay.querySelector('#yan-auth-forgot-wrap');
        var hintEl = overlay.querySelector('#yan-auth-hint');

        if (mode === 'login') {
            title.textContent = '账号登录';
            sub.textContent = '登录后最多 3 台设备同时在线';
            btn.textContent = '登录';
            tip.textContent = '还没有账号？';
            link.textContent = '立即注册';
            pwdInput.setAttribute('autocomplete', 'current-password');
            pwdInput.setAttribute('placeholder', '请输入密码');
            pwdField.style.display = 'block';
            confirmWrap.style.display = 'none';
            inviteWrap.style.display = 'none';
            forgotWrap.style.display = 'block';
            hintEl.textContent = '';
            hintEl.innerHTML = '每个账号最多 3 台设备同时登录<br/>超过时最早登录的设备会被自动踢出';
            pwd2Input.value = '';
        } else if (mode === 'register') {
            title.textContent = '注册新账号';
            sub.textContent = '用户名 2-32 位（不区分大小写），密码至少 6 位';
            btn.textContent = '注册';
            tip.textContent = '已有账号？';
            link.textContent = '返回登录';
            pwdInput.setAttribute('autocomplete', 'new-password');
            pwdInput.setAttribute('placeholder', '请输入密码');
            pwdField.style.display = 'block';
            confirmWrap.style.display = 'block';
            inviteWrap.style.display = 'block';
            forgotWrap.style.display = 'none';
            hintEl.textContent = '';
            hintEl.innerHTML = '每个账号最多 3 台设备同时登录<br/>超过时最早登录的设备会被自动踢出';
        } else if (mode === 'reset') {
            title.textContent = '重置密码';
            sub.textContent = '请输入注册时使用的邀请码来验证身份';
            btn.textContent = '重置密码';
            tip.textContent = '想起密码了？';
            link.textContent = '返回登录';
            pwdInput.setAttribute('autocomplete', 'new-password');
            pwdInput.setAttribute('placeholder', '请输入新密码');
            pwdField.style.display = 'block';
            confirmWrap.style.display = 'block';
            inviteWrap.style.display = 'block';
            forgotWrap.style.display = 'none';
            hintEl.innerHTML = '输入您注册时使用的邀请码<br/>验证通过后即可设置新密码';
            pwd2Input.value = '';
        }
        setOverlayMsg('', '');
    }

    function toggleMode() {
        switchToMode(currentMode === 'login' ? 'register' : 'login');
    }

    function doSubmit() {
        var userInput = overlay.querySelector('#yan-auth-user');
        var pwdInput = overlay.querySelector('#yan-auth-pwd');
        var submitBtn = overlay.querySelector('#yan-auth-submit');
        var username = (userInput.value || '').trim().toLowerCase();
        var password = pwdInput.value || '';

        if (!username || !password) {
            setOverlayMsg('error', currentMode === 'reset' ? '请填写用户名和新密码' : '请填写用户名和密码');
            return;
        }

        var inviteCode = '';
        if (currentMode === 'register' || currentMode === 'reset') {
            var pwd2 = (overlay.querySelector('#yan-auth-pwd2').value || '');
            inviteCode = (overlay.querySelector('#yan-auth-invite').value || '').trim();
            if (password.length < 6) {
                setOverlayMsg('error', '密码至少需要 6 位');
                return;
            }
            if (password !== pwd2) {
                setOverlayMsg('error', '两次输入的密码不一致');
                return;
            }
            if (!inviteCode) {
                setOverlayMsg('error', '请输入邀请码');
                return;
            }
        }

        submitBtn.disabled = true;
        var origText = submitBtn.textContent;
        setOverlayMsg('', '');

        if (currentMode === 'reset') {
            submitBtn.textContent = '重置中...';
            postJson('reset-password', { username: username, newPassword: password, inviteCode: inviteCode })
                .then(function (r) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = origText;
                    if (r.status >= 200 && r.status < 300 && r.data.ok) {
                        setOverlayMsg('success', '密码重置成功！即将跳转登录...');
                        setTimeout(function () {
                            switchToMode('login');
                            // 保留用户名方便直接登录
                            overlay.querySelector('#yan-auth-user').value = username;
                        }, 1200);
                    } else {
                        setOverlayMsg('error', r.data.error || '重置失败');
                    }
                })
                .catch(function (e) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = origText;
                    setOverlayMsg('error', '网络错误：' + (e && e.message || e));
                });
        } else if (currentMode === 'register') {
            submitBtn.textContent = '注册中...';
            postJson('register', { username: username, password: password, inviteCode: inviteCode })
                .then(function (r) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = origText;
                    if (r.status >= 200 && r.status < 300 && r.data.ok) {
                        setOverlayMsg('success', '注册成功！即将自动登录...');
                        setTimeout(function () {
                            currentMode = 'login';
                            doLoginInternal(username, password);
                        }, 600);
                    } else {
                        setOverlayMsg('error', r.data.error || '注册失败');
                    }
                })
                .catch(function (e) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = origText;
                    setOverlayMsg('error', '网络错误：' + (e && e.message || e));
                });
        } else {
            submitBtn.textContent = '登录中...';
            doLoginInternal(username, password);
        }
    }

    function doLoginInternal(username, password) {
        var submitBtn = overlay.querySelector('#yan-auth-submit');
        submitBtn.disabled = true;
        var origText = submitBtn.textContent;
        submitBtn.textContent = '登录中...';

        postJson('login', {
            username: username,
            password: password,
            deviceFingerprint: getDeviceFingerprint()
        }).then(function (r) {
            submitBtn.disabled = false;
            submitBtn.textContent = origText;
            if (r.status >= 200 && r.status < 300 && r.data.ok) {
                setAuth(r.data.token, r.data.username);
                var tip = '';
                if (r.data.kickedCount > 0) {
                    tip = '（已踢出 ' + r.data.kickedCount + ' 台最早登录的设备）';
                }
                setOverlayMsg('success', '登录成功 ' + tip);
                setTimeout(function () {
                    hideOverlay();
                    startHeartbeat();
                }, 400);
            } else {
                setOverlayMsg('error', r.data.error || '登录失败');
            }
        }).catch(function (e) {
            submitBtn.disabled = false;
            submitBtn.textContent = origText;
            setOverlayMsg('error', '网络错误：' + (e && e.message || e));
        });
    }

    function showOverlay() {
        buildOverlay();
        overlay.style.display = 'flex';
        // 清空密码
        var pwd = overlay.querySelector('#yan-auth-pwd');
        if (pwd) pwd.value = '';
        setOverlayMsg('', '');
        // 聚焦第一个空输入框
        setTimeout(function () {
            var u = overlay.querySelector('#yan-auth-user');
            var p = overlay.querySelector('#yan-auth-pwd');
            if (u && !u.value) u.focus();
            else if (p) p.focus();
        }, 100);
    }
    function hideOverlay() {
        if (overlay) overlay.style.display = 'none';
    }

    // ========== 被踢弹窗 ==========
    var kickedShown = false;
    function handleKicked(msg) {
        if (kickedShown) return;
        kickedShown = true;
        stopHeartbeat();
        clearAuth();

        injectStyle();
        var mask = document.createElement('div');
        mask.id = 'yan-kicked-mask';
        mask.innerHTML =
            '<div class="yan-kicked-box">' +
                '<div class="yan-kicked-icon">⚠️</div>' +
                '<h3 class="yan-kicked-title">登录已失效</h3>' +
                '<p class="yan-kicked-msg">' + (msg || '您的账号已在其他设备登录，当前设备已被下线。') + '</p>' +
                '<button class="yan-kicked-btn" id="yan-kicked-ok">重新登录</button>' +
            '</div>';
        document.body.appendChild(mask);

        mask.querySelector('#yan-kicked-ok').addEventListener('click', function () {
            document.body.removeChild(mask);
            kickedShown = false;
            showOverlay();
        });
    }

    // ========== 心跳 ==========
    var heartbeatTimer = null;
    function startHeartbeat() {
        stopHeartbeat();
        // 立即执行一次（延迟 2s 避免和登录接口同时打满）
        setTimeout(doHeartbeat, 2000);
        heartbeatTimer = setInterval(doHeartbeat, HEARTBEAT_INTERVAL);
    }
    function stopHeartbeat() {
        if (heartbeatTimer) {
            clearInterval(heartbeatTimer);
            heartbeatTimer = null;
        }
    }
    function doHeartbeat() {
        var t = getToken();
        if (!t) { stopHeartbeat(); return; }
        postJson('heartbeat', {}, { 'Authorization': 'Bearer ' + t })
            .then(function (r) {
                if (r.status === 401 && r.data) {
                    var code = r.data.code;
                    if (code === 'KICKED') {
                        handleKicked('您的账号已在其他设备登录，当前设备已被下线。');
                    } else if (code === 'EXPIRED') {
                        handleKicked('登录已过期，请重新登录。');
                    } else {
                        handleKicked(r.data.error || '登录已失效');
                    }
                }
            })
            .catch(function () {
                // 网络错误不踢出，下次再试
            });
    }

    // ========== 设备列表 ==========
    function showDevicesModal() {
        injectStyle();
        var mask = document.createElement('div');
        mask.id = 'yan-devices-mask';
        mask.innerHTML =
            '<div class="yan-devices-box">' +
                '<div class="yan-devices-head">' +
                    '<h3>已登录设备</h3>' +
                    '<button class="yan-devices-close" aria-label="关闭">×</button>' +
                '</div>' +
                '<div class="yan-devices-list" id="yan-dev-list">加载中...</div>' +
                '<div class="yan-devices-foot">' +
                    '<button class="yan-devices-logout" id="yan-dev-logout">退出登录</button>' +
                    '<button class="yan-devices-refresh" id="yan-dev-refresh">刷新</button>' +
                '</div>' +
            '</div>';
        document.body.appendChild(mask);

        function close() {
            if (mask.parentNode) mask.parentNode.removeChild(mask);
        }
        mask.querySelector('.yan-devices-close').addEventListener('click', close);
        mask.addEventListener('click', function (e) { if (e.target === mask) close(); });
        mask.querySelector('#yan-dev-refresh').addEventListener('click', loadList);
        mask.querySelector('#yan-dev-logout').addEventListener('click', function () {
            if (confirm('确定要退出登录吗？')) {
                logout();
                close();
            }
        });

        function loadList() {
            var list = mask.querySelector('#yan-dev-list');
            list.innerHTML = '加载中...';
            postJson('devices', {}, authHeader())
                .then(function (r) {
                    if (r.status === 401) { handleKicked(); close(); return; }
                    if (!r.data.ok) {
                        list.innerHTML = '<div style="padding:20px;text-align:center;color:#999;">加载失败：' + (r.data.error || '') + '</div>';
                        return;
                    }
                    var devs = r.data.devices || [];
                    if (devs.length === 0) {
                        list.innerHTML = '<div style="padding:20px;text-align:center;color:#999;">暂无设备</div>';
                        return;
                    }
                    list.innerHTML = devs.map(function (d) {
                        var loginStr = formatTime(d.loginAt);
                        var activeStr = formatTime(d.lastActiveAt);
                        var currentTag = d.isCurrent ? '<span class="yan-device-current">当前设备</span>' : '';
                        var kickBtn = d.isCurrent ? '' : '<button class="yan-device-kick" data-id="' + d.id + '">踢出</button>';
                        return '' +
                            '<div class="yan-device-item">' +
                                '<div class="yan-device-info">' +
                                    '<div class="yan-device-name">' + escapeHtml(d.deviceName || '未知设备') + currentTag + '</div>' +
                                    '<div class="yan-device-meta">登录：' + loginStr + '　活跃：' + activeStr + '</div>' +
                                '</div>' +
                                kickBtn +
                            '</div>';
                    }).join('');

                    // 绑定踢出
                    list.querySelectorAll('.yan-device-kick').forEach(function (btn) {
                        btn.addEventListener('click', function () {
                            var id = btn.getAttribute('data-id');
                            if (!confirm('确定踢出该设备？')) return;
                            btn.disabled = true;
                            btn.textContent = '处理中';
                            postJson('kick', { targetId: id }, authHeader()).then(function (r) {
                                if (r.data.ok) loadList();
                                else { alert('踢出失败：' + (r.data.error || '')); btn.disabled = false; btn.textContent = '踢出'; }
                            });
                        });
                    });
                });
        }
        loadList();
    }

    function formatTime(iso) {
        if (!iso) return '-';
        try {
            var d = new Date(iso);
            var diff = (Date.now() - d.getTime()) / 1000;
            if (diff < 60) return '刚刚';
            if (diff < 3600) return Math.floor(diff / 60) + ' 分钟前';
            if (diff < 86400) return Math.floor(diff / 3600) + ' 小时前';
            return d.toLocaleString('zh-CN', { hour12: false });
        } catch (e) { return iso; }
    }
    function escapeHtml(s) {
        return String(s).replace(/[&<>"']/g, function (c) {
            return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
        });
    }

    // ========== 登出 ==========
    function logout() {
        var t = getToken();
        stopHeartbeat();
        clearAuth();
        if (t) {
            postJson('logout', {}, { 'Authorization': 'Bearer ' + t }).catch(function () {});
        }
        showOverlay();
    }

    // ========== 启动 ==========
    function bootstrap() {
        if (getToken()) {
            // 有 token，先隐式验证一次；验证失败会自动弹登录
            startHeartbeat();
        } else {
            showOverlay();
        }
    }

    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', bootstrap);
        } else {
            bootstrap();
        }
    }

    // ========== 对外暴露 ==========
    window.YAN_AUTH = {
        getToken: getToken,
        getUsername: getUsername,
        authHeader: authHeader,
        fetchWithAuth: fetchWithAuth,
        logout: logout,
        showDevicesModal: showDevicesModal,
        // 手动触发（备用）
        _showLogin: showOverlay,
        _handleKicked: handleKicked
    };

    init();
})();
