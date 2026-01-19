/**
 * 全局配置文件 - 使用 ES5 语法
 */

var Config = (function () {
    "use strict";

    // 默认配置
    var defaultConfig = {
        // API 配置
        api: {
            baseUrl: "https://api.example.com",
            timeout: 30000,
        },

        // 游戏配置
        games: {
            attention: {
                name: "注意力测试",
                enabled: true,
                // 正式测试页数
                pages: 7,
                itemsPerPage: 56,
                // 每个页面正确的个数
                correctItemsPerPage: 25,
                // 每个页面的答题时间
                timePerPage: 70,
                // 模拟测试的选项个数
                practiceItems: 6,
                // 模拟测试的正确选项个数
                practiceCorrectItems: 2,
            },
            dst: {
                name: "数字广度测试",
                enabled: false,
            },
            memory: {
                name: "情景记忆测试",
                enabled: false,
            },
            tmt: {
                name: "连线测试",
                enabled: false,
            },
            raven: {
                name: "瑞文推理",
                enabled: false,
            },
        },

        // 用户配置
        user: {
            token: null,
            userId: null,
            userName: null,
        },

        // 动画配置
        animation: {
            pageTransitionDuration: 400,
            popupDuration: 500,
            buttonPressDuration: 100,
            selectFeedbackDuration: 250,
            errorShakeDuration: 300,
        },
    };

    // 当前配置
    var currentConfig = Utils.deepClone(defaultConfig);

    /**
     * 初始化配置
     * @param {Object} customConfig - 自定义配置
     */
    function init(customConfig) {
        if (customConfig && typeof customConfig === "object") {
            mergeConfig(currentConfig, customConfig);
        }

        // 从 URL 参数中获取 token
        var token = Utils.getUrlParam("token");
        if (token) {
            currentConfig.user.token = token;
            console.log("Token from URL:", token);
        }

        // 从本地存储中恢复配置
        var savedConfig = Utils.storage.get("app_config");
        if (savedConfig) {
            mergeConfig(currentConfig, savedConfig);
            console.log("Config loaded from storage");
        }

        return currentConfig;
    }

    /**
     * 合并配置
     * @param {Object} target - 目标对象
     * @param {Object} source - 源对象
     */
    function mergeConfig(target, source) {
        for (var key in source) {
            if (source.hasOwnProperty(key)) {
                if (
                    typeof source[key] === "object" &&
                    source[key] !== null &&
                    !Array.isArray(source[key])
                ) {
                    if (!target[key]) {
                        target[key] = {};
                    }
                    mergeConfig(target[key], source[key]);
                } else {
                    target[key] = source[key];
                }
            }
        }
    }

    /**
     * 获取配置
     * @param {string} path - 配置路径，如 'api.baseUrl'
     * @returns {*} 配置值
     */
    function get(path) {
        if (!path) {
            return currentConfig;
        }

        var keys = path.split(".");
        var value = currentConfig;

        for (var i = 0; i < keys.length; i++) {
            if (value && typeof value === "object" && keys[i] in value) {
                value = value[keys[i]];
            } else {
                return undefined;
            }
        }

        return value;
    }

    /**
     * 设置配置
     * @param {string} path - 配置路径
     * @param {*} value - 配置值
     */
    function set(path, value) {
        var keys = path.split(".");
        var obj = currentConfig;

        for (var i = 0; i < keys.length - 1; i++) {
            if (!(keys[i] in obj)) {
                obj[keys[i]] = {};
            }
            obj = obj[keys[i]];
        }

        obj[keys[keys.length - 1]] = value;

        // 保存到本地存储
        Utils.storage.set("app_config", currentConfig);
    }

    /**
     * 重置配置
     */
    function reset() {
        currentConfig = Utils.deepClone(defaultConfig);
        Utils.storage.remove("app_config");
    }

    // 导出公共方法
    return {
        init: init,
        get: get,
        set: set,
        reset: reset,
    };
})();
