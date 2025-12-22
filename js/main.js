/**
 * 主应用逻辑 - 使用 ES5 语法
 */

(function () {
    "use strict";

    var app = {
        initialized: false,
        currentGame: null,
    };

    /**
     * 初始化应用
     */
    function init() {
        if (app.initialized) {
            return;
        }

        console.log("Initializing app...");

        // 初始化配置
        Config.init();

        // 显示加载动画
        showLoading();

        // 模拟加载过程
        setTimeout(function () {
            // 尝试同步本地测试数据
            API.syncLocalTestData()
                .then(function () {
                    console.log("Local test data synced");
                })
                .catch(function (error) {
                    console.error("Failed to sync local test data:", error);
                });

            // 显示主界面
            hideLoading();
            showMainContainer();

            // 更新用户信息
            updateUserInfo();

            app.initialized = true;
            console.log("App initialized");
        }, 1000);
    }

    /**
     * 显示加载动画
     */
    function showLoading() {
        var loading = document.getElementById("loading");
        if (loading) {
            loading.style.display = "flex";
        }
    }

    /**
     * 隐藏加载动画
     */
    function hideLoading() {
        var loading = document.getElementById("loading");
        if (loading) {
            loading.style.display = "none";
        }
    }

    /**
     * 显示主界面
     */
    function showMainContainer() {
        var mainContainer = document.getElementById("main-container");
        if (mainContainer) {
            mainContainer.style.display = "block";
        }
    }

    /**
     * 更新用户信息
     */
    function updateUserInfo() {
        var userInfo = document.getElementById("user-info");
        if (!userInfo) return;

        var token = Config.get("user.token");
        if (token) {
            userInfo.textContent = "Token: " + token.substr(0, 10) + "...";
        } else {
            userInfo.textContent = "游客模式";
        }
    }

    /**
     * 开始游戏
     * @param {string} gameType - 游戏类型
     */
    window.startGame = function (gameType) {
        console.log("Starting game:", gameType);

        var gameConfig = Config.get("games." + gameType);
        if (!gameConfig || !gameConfig.enabled) {
            Utils.showToast("该游戏暂未开放", "error");
            return;
        }

        app.currentGame = gameType;

        // 根据游戏类型跳转到对应页面
        switch (gameType) {
            case "attention":
                window.location.href =
                    "pages/attention.html?token=" +
                    (Config.get("user.token") || "");
                break;
            case "dst":
                Utils.showToast("数字广度测试即将推出", "info");
                break;
            case "memory":
                Utils.showToast("情景记忆测试即将推出", "info");
                break;
            case "tmt":
                Utils.showToast("连线测试即将推出", "info");
                break;
            case "raven":
                Utils.showToast("瑞文推理即将推出", "info");
                break;
            default:
                Utils.showToast("未知的游戏类型", "error");
        }
    };

    /**
     * 页面加载完成后初始化
     */
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }

    // 处理页面可见性变化
    document.addEventListener("visibilitychange", function () {
        if (!document.hidden) {
            // 页面重新可见时，尝试同步数据
            API.syncLocalTestData().catch(function (error) {
                console.error("Failed to sync local test data:", error);
            });
        }
    });

    // 导出到全局
    window.App = app;
})();
