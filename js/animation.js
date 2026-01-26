/**
 * 通用动画组件 - 使用 ES5 语法
 * 基于 PRD 文档中的交互动效规范
 */

var Animation = (function () {
    "use strict";

    // 遮罩元素（单例）
    var overlay = null;

    /**
     * 创建或获取遮罩元素
     * @returns {HTMLElement} 遮罩元素
     */
    function getOverlay() {
        if (!overlay) {
            overlay = document.createElement("div");
            overlay.id = "animation-overlay";
            overlay.style.cssText =
                "position: fixed;" +
                "top: 0;" +
                "left: 0;" +
                "width: 100%;" +
                "height: 100%;" +
                "z-index: 9999;" +
                "background: transparent;" +
                "pointer-events: all;" +
                "display: none;";
            document.body.appendChild(overlay);
        }
        return overlay;
    }

    /**
     * 显示遮罩
     */
    function showOverlay() {
        var mask = getOverlay();
        mask.style.display = "block";
    }

    /**
     * 隐藏遮罩
     */
    function hideOverlay() {
        var mask = getOverlay();
        mask.style.display = "none";
    }

    /**
     * 页面切换动画 - 引导流程切换 (P1 → P2 → P3 → P4 → P5)
     * @param {HTMLElement} oldPage - 旧页面元素
     * @param {HTMLElement} newPage - 新页面元素
     * @param {Function} callback - 动画完成回调
     */
    function pageTransition(oldPage, newPage, callback) {
        // 显示遮罩，屏蔽点击事件
        showOverlay();

        // 旧页面退出动画
        if (oldPage) {
            oldPage.classList.add("page-transition-exit");
        }

        // 新页面进入动画
        // newPage.style.display = 'block';
        newPage.classList.add("active");
        newPage.classList.add("page-transition-enter");
        var duration = Config.get("animation.pageTransitionDuration") || 400;

        setTimeout(function () {
            if (oldPage) {
                // oldPage.style.display = 'none';
                oldPage.classList.remove("active");
                oldPage.classList.remove("page-transition-exit");
            }
            newPage.classList.remove("page-transition-enter");

            // 隐藏遮罩，恢复点击事件
            hideOverlay();

            if (callback) {
                callback();
            }
        }, duration);
    }

    /**
     * 练习模式到正式测试的转场动画 (P6 → P7)
     * @param {HTMLElement} oldPage - 旧页面元素
     * @param {HTMLElement} newPage - 新页面元素
     * @param {Function} callback - 动画完成回调
     */
    function tutorialToGameTransition(oldPage, newPage, callback) {
        // 显示遮罩，屏蔽点击事件
        showOverlay();

        // 旧页面向下沉降
        oldPage.style.transition = "all 0.4s ease-out";
        oldPage.style.transform = "translateY(30%)";
        oldPage.style.opacity = "0";

        // 新页面从底部升起
        // newPage.style.display = 'block';
        newPage.classList.add("active");
        newPage.style.transform = "translateY(100%) scale(0.85)";
        newPage.style.opacity = "0";

        setTimeout(function () {
            newPage.style.transition = "all 0.4s ease-out";
            newPage.style.transform = "translateY(0) scale(1)";
            newPage.style.opacity = "1";
        }, 50);

        setTimeout(function () {
            // oldPage.style.display = 'none';
            oldPage.style.transform = "";
            oldPage.style.opacity = "";
            oldPage.style.transition = "";

            newPage.style.transform = "";
            newPage.style.opacity = "";
            newPage.style.transition = "";

            // 隐藏遮罩，恢复点击事件
            hideOverlay();

            if (callback) {
                callback();
            }
        }, 450);
    }

    /**
     * 游戏内翻页动画 (P7 Page 1 → P7 Page 2)
     * @param {HTMLElement} oldPage - 旧页面元素
     * @param {HTMLElement} newPage - 新页面元素
     * @param {Function} callback - 动画完成回调
     */
    //     function gamePageTransition(oldPage, newPage, callback) {
    //     // 确保新页面已参与布局
    //     newPage.style.display = 'block';
    //     newPage.style.transition = 'none';
    //     newPage.style.transform = 'translateX(100%)';

    //     // 强制浏览器确认初始状态
    //     newPage.offsetWidth;

    //     requestAnimationFrame(() => {
    //         oldPage.style.transition = 'transform 0.3s ease-out';
    //         newPage.style.transition = 'transform 0.3s ease-out';

    //         oldPage.style.transform = 'translateX(-100%)';
    //         newPage.style.transform = 'translateX(0)';
    //     });

    //     function onEnd() {
    //         oldPage.style.transition = '';
    //         oldPage.style.transform = '';
    //         oldPage.style.visibility = 'hidden'; // ❗不用 display:none

    //         newPage.style.transition = '';
    //         newPage.style.transform = '';

    //         oldPage.removeEventListener('transitionend', onEnd);

    //         if (callback) callback();
    //     }

    //     oldPage.addEventListener('transitionend', onEnd, { once: true });
    // }

    /**
     * 测试结束到结果结算的动画 (P7 → P8)
     * @param {HTMLElement} oldPage - 旧页面元素
     * @param {HTMLElement} newPage - 新页面元素
     * @param {Function} callback - 动画完成回调
     */
    function gameToResultTransition(oldPage, newPage, callback) {
        // 显示遮罩，屏蔽点击事件
        showOverlay();

        // 背景渐变
        oldPage.classList.remove("active");
        newPage.classList.add("active");
        newPage.style.opacity = "0";

        setTimeout(function () {
            newPage.style.transition = "opacity 0.3s ease-out";
            newPage.style.opacity = "1";
        }, 50);

        // 结果卡片弹射出现
        var resultCard = newPage.querySelector(".result-card");
        if (resultCard) {
            resultCard.classList.add("popup-enter");
        }

        setTimeout(function () {
            // oldPage.style.display = 'none';
            newPage.style.opacity = "";
            newPage.style.transition = "";

            if (resultCard) {
                resultCard.classList.remove("popup-enter");
            }

            // 隐藏遮罩，恢复点击事件
            hideOverlay();

            if (callback) {
                callback();
            }
        }, 500);
    }

    /**
     * 按钮点击动画
     * @param {HTMLElement} button - 按钮元素
     */
    function buttonPress(button) {
        button.style.transform = "scale(0.95)";

        setTimeout(function () {
            button.style.transform = "";
        }, 100);
    }

    /**
     * 选中反馈动画
     * @param {HTMLElement} element - 元素
     */
    function selectFeedback(element) {
        element.classList.add("select-feedback");

        setTimeout(function () {
            element.classList.remove("select-feedback");
        }, 250);
    }

    /**
     * 取消选中反馈动画
     * @param {HTMLElement} element - 元素
     */
    function deselectFeedback(element) {
        element.classList.add("deselect-feedback");

        setTimeout(function () {
            element.classList.remove("deselect-feedback");
            console.log("item点击移除：");
        }, 150);
    }

    /**
     * 错误提示动画（晃动）
     * @param {HTMLElement} element - 元素
     */
    function errorShake(element) {
        element.classList.add("shake-error");

        setTimeout(function () {
            element.classList.remove("shake-error");
        }, 300);
    }

    /**
     * 猴子IP闲置动画
     * @param {HTMLElement} mascot - 猴子元素
     */
    function startMascotIdle(mascot) {
        if (!mascot) return;

        var idleTimer = setTimeout(function () {
            mascot.classList.add("mascot-idle");
        }, 3000);

        // 用户交互时停止闲置动画
        var stopIdle = function () {
            clearTimeout(idleTimer);
            mascot.classList.remove("mascot-idle");

            idleTimer = setTimeout(function () {
                mascot.classList.add("mascot-idle");
            }, 3000);
        };

        document.addEventListener("click", stopIdle);
        document.addEventListener("touchstart", stopIdle);

        return {
            stop: function () {
                clearTimeout(idleTimer);
                mascot.classList.remove("mascot-idle");
                document.removeEventListener("click", stopIdle);
                document.removeEventListener("touchstart", stopIdle);
            },
        };
    }

    /**
     * 猴子探头动画（页面切换时）
     * @param {HTMLElement} mascot - 猴子元素
     */
    function mascotPeek(mascot) {
        if (!mascot) return;

        mascot.style.transformOrigin = "right bottom";
        mascot.style.transition = "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)";
        mascot.style.transform = "rotate(10deg) scale(0.9)";

        setTimeout(function () {
            mascot.style.transform = "rotate(0deg) scale(1)";
        }, 50);

        setTimeout(function () {
            mascot.style.transform = "";
            mascot.style.transition = "";
            mascot.style.transformOrigin = "";
        }, 450);
    }

    /**
     * 徽章/星星元素动画（结果页）
     * @param {HTMLElement} badge - 徽章元素
     * @param {number} delay - 延迟时间（毫秒）
     */
    function badgeStamp(badge, delay) {
        if (!badge) return;

        delay = delay || 200;
        badge.style.opacity = "0";

        setTimeout(function () {
            badge.style.transition = "all 0.3s ease-out";
            badge.style.transform = "scale(2) rotate(-30deg)";
            badge.style.opacity = "1";

            setTimeout(function () {
                badge.style.transform = "scale(1) rotate(0deg)";
            }, 50);

            setTimeout(function () {
                badge.style.transform = "";
                badge.style.transition = "";
            }, 350);
        }, delay);
    }

    // 导出公共方法
    return {
        pageTransition: pageTransition,
        tutorialToGameTransition: tutorialToGameTransition,
        gameToResultTransition: gameToResultTransition,
        buttonPress: buttonPress,
        selectFeedback: selectFeedback,
        deselectFeedback: deselectFeedback,
        errorShake: errorShake,
        startMascotIdle: startMascotIdle,
        mascotPeek: mascotPeek,
        badgeStamp: badgeStamp,
    };
})();
