/**
 * YAN 免责声明弹窗
 * 首次使用时显示，确认后不再弹出（localStorage持久化）
 * 白底黑字极简风格
 */
(function() {
    'use strict';

    var DISCLAIMER_KEY = 'YAN_DISCLAIMER_ACCEPTED_V2';

    function hasAccepted() {
        try { return localStorage.getItem(DISCLAIMER_KEY) === '1'; } catch(e) { return false; }
    }

    function markAccepted() {
        try { localStorage.setItem(DISCLAIMER_KEY, '1'); } catch(e) {}
    }

    function injectDisclaimerCSS() {
        if (document.getElementById('yan-disclaimer-style')) return;
        var s = document.createElement('style');
        s.id = 'yan-disclaimer-style';
        s.textContent = [
            '@keyframes dclFadeIn{from{opacity:0}to{opacity:1}}',
            '@keyframes dclSlideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}',
            '.dcl-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:999998;display:flex;align-items:center;justify-content:center;animation:dclFadeIn .25s;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Hiragino Sans GB",sans-serif}',
            '.dcl-modal{background:#fff;border-radius:16px;width:92%;max-width:420px;max-height:80vh;display:flex;flex-direction:column;animation:dclSlideUp .3s ease;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.12)}',
            '.dcl-header{padding:24px 24px 16px;border-bottom:1px solid #eee}',
            '.dcl-title{font-size:18px;font-weight:600;color:#111;text-align:center;letter-spacing:0.5px}',
            '.dcl-body{flex:1;overflow-y:auto;padding:20px 24px;-webkit-overflow-scrolling:touch}',
            '.dcl-body::-webkit-scrollbar{width:2px}',
            '.dcl-body::-webkit-scrollbar-thumb{background:#ddd;border-radius:2px}',
            '.dcl-section{margin-bottom:20px;padding-bottom:20px;border-bottom:1px solid #f0f0f0}',
            '.dcl-section:last-child{margin-bottom:0;padding-bottom:0;border-bottom:none}',
            '.dcl-section-title{font-size:14px;font-weight:600;color:#222;margin-bottom:8px}',
            '.dcl-section-text{font-size:13px;color:#555;line-height:1.9}',
            '.dcl-section-text p{margin:0 0 6px}',
            '.dcl-section-text p:last-child{margin-bottom:0}',
            '.dcl-section-list{font-size:13px;color:#555;line-height:1.9;padding-left:0;list-style:none;margin:8px 0 0}',
            '.dcl-section-list li{position:relative;padding-left:14px;margin-bottom:2px}',
            '.dcl-section-list li::before{content:"·";position:absolute;left:2px;color:#999;font-weight:bold}',
            '.dcl-footer{padding:16px 24px 20px;border-top:1px solid #eee}',
            '.dcl-btn{width:100%;padding:14px;border:none;border-radius:10px;font-size:15px;font-weight:500;cursor:pointer;transition:all .2s;text-align:center}',
            '.dcl-btn-disabled{background:#f5f5f5;color:#bbb;cursor:not-allowed}',
            '.dcl-btn-active{background:#111;color:#fff;cursor:pointer}',
            '.dcl-btn-active:active{opacity:0.85}',
            '.dcl-scroll-hint{text-align:center;font-size:11px;color:#bbb;padding:4px 0 8px}'
        ].join('\n');
        document.head.appendChild(s);
    }

    function showDisclaimer() {
        if (hasAccepted()) return;
        injectDisclaimerCSS();

        var countdown = 8;
        var overlay = document.createElement('div');
        overlay.id = 'yan-disclaimer-overlay';
        overlay.className = 'dcl-overlay';

        overlay.innerHTML = '<div class="dcl-modal">' +
            '<div class="dcl-header">' +
                '<div class="dcl-title">免责声明</div>' +
            '</div>' +
            '<div class="dcl-body" id="dcl-body">' +

                // 1. AI虚拟性质
                '<div class="dcl-section">' +
                    '<div class="dcl-section-title">一、AI 虚拟性质声明</div>' +
                    '<div class="dcl-section-text">' +
                        '<p>本应用中的所有角色均为 AI 虚拟角色，由第三方人工智能大模型驱动生成，不具备真实意识、情感或人格。所有对话、互动内容均为算法自动产出的虚构内容，与现实中的任何人物、事件无关。</p>' +
                        '<p>AI 角色的回复不代表开发者的观点、立场或态度。AI 生成内容可能存在不准确、不完整或不当之处，不应作为任何专业建议的依据。</p>' +
                    '</div>' +
                '</div>' +

                // 2. 理性使用与情感提示
                '<div class="dcl-section">' +
                    '<div class="dcl-section-title">二、理性使用与情感提示</div>' +
                    '<div class="dcl-section-text">' +
                        '<p>请理性看待与 AI 角色的互动。AI 不是真实的人，无法建立真正的情感关系，也不能替代现实中的人际交往、情感陪伴或心理咨询服务。</p>' +
                        '<p>如您发现自己对 AI 角色产生过度依赖或情感寄托，建议适当减少使用时长，回归现实社交，必要时寻求专业心理帮助。本应用仅供娱乐和创作辅助，请勿将虚拟互动等同于真实关系。</p>' +
                    '</div>' +
                '</div>' +

                // 3. 未成年人保护
                '<div class="dcl-section">' +
                    '<div class="dcl-section-title">三、未成年人保护</div>' +
                    '<div class="dcl-section-text">' +
                        '<p>本应用部分功能不适合未满 18 周岁的未成年人独立使用。未成年人须在监护人知情并同意的情况下使用。</p>' +
                        '<p>监护人应关注未成年人的使用情况，合理控制使用时长，引导其正确认识 AI 内容的虚拟性质，防止沉迷或产生不当认知。因监护人未尽到监护责任导致的任何问题，开发者不承担责任。</p>' +
                    '</div>' +
                '</div>' +

                // 4. 合规声明与内容责任
                '<div class="dcl-section">' +
                    '<div class="dcl-section-title">四、合规声明与内容责任</div>' +
                    '<div class="dcl-section-text">' +
                        '<p>本应用严格遵守《中华人民共和国网络安全法》《生成式人工智能服务管理暂行办法》等相关法律法规。本应用不内置任何绕过 AI 安全限制的机制，所有内容生成均依赖第三方 AI 模型的原生能力。</p>' +
                        '<p>AI 生成的具体内容取决于用户的输入引导和 AI 模型自身的响应，开发者无法预见或控制每一条生成结果。用户不得利用本应用生成或传播违法违规内容，因用户不当使用导致的一切后果由用户自行承担。</p>' +
                    '</div>' +
                '</div>' +

                // 5. 付费服务与使用授权
                '<div class="dcl-section">' +
                    '<div class="dcl-section-title">五、付费服务与使用授权</div>' +
                    '<div class="dcl-section-text">' +
                        '<p>本应用为付费服务产品，用户通过付费获得的是个人使用授权，而非对应用本身的所有权。未经开发者书面许可，任何个人或组织不得：</p>' +
                    '</div>' +
                    '<ul class="dcl-section-list">' +
                        '<li>将本应用进行二次传播、转售或分享给未授权的第三方</li>' +
                        '<li>对本应用进行修改、二次开发或制作衍生作品</li>' +
                        '<li>对本应用进行逆向工程、反编译或以任何方式提取源代码</li>' +
                    '</ul>' +
                    '<div class="dcl-section-text" style="margin-top:8px">' +
                        '<p>违反上述规定的，开发者有权终止其使用授权，并保留追究法律责任的权利。本声明将根据法律法规变化适时修订，继续使用即视为同意修订后的内容。</p>' +
                    '</div>' +
                '</div>' +

            '</div>' +
            '<div class="dcl-scroll-hint" id="dcl-scroll-hint">下滑阅读全部内容</div>' +
            '<div class="dcl-footer">' +
                '<button class="dcl-btn dcl-btn-disabled" id="dcl-accept-btn" disabled>我已阅读并同意 (' + countdown + 's)</button>' +
            '</div>' +
        '</div>';

        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) e.stopPropagation();
        });

        document.body.appendChild(overlay);

        var body = document.getElementById('dcl-body');
        var scrollHint = document.getElementById('dcl-scroll-hint');
        if (body && scrollHint) {
            body.addEventListener('scroll', function() {
                if (body.scrollTop + body.clientHeight >= body.scrollHeight - 20) {
                    scrollHint.style.display = 'none';
                } else {
                    scrollHint.style.display = '';
                }
            });
        }

        var btn = document.getElementById('dcl-accept-btn');
        var timer = setInterval(function() {
            countdown--;
            if (countdown <= 0) {
                clearInterval(timer);
                btn.textContent = '我已阅读并同意';
                btn.className = 'dcl-btn dcl-btn-active';
                btn.disabled = false;
            } else {
                btn.textContent = '我已阅读并同意 (' + countdown + 's)';
            }
        }, 1000);

        btn.addEventListener('click', function() {
            if (btn.disabled) return;
            markAccepted();
            overlay.style.transition = 'opacity 0.3s';
            overlay.style.opacity = '0';
            setTimeout(function() {
                if (overlay.parentNode) overlay.remove();
            }, 300);
        });
    }

    window._showDisclaimerPopup = showDisclaimer;

    function autoShow() {
        if (!document.getElementById('device-lock-overlay')) {
            showDisclaimer();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(autoShow, 600);
        });
    } else {
        setTimeout(autoShow, 600);
    }
})();
