/**
 * 工具函数库 - 使用 ES5 语法
 */

var Utils = (function() {
    'use strict';
    
    /**
     * 获取 URL 参数
     * @param {string} name - 参数名
     * @returns {string|null} 参数值
     */
    function getUrlParam(name) {
        var reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)', 'i');
        var r = window.location.search.substr(1).match(reg);
        if (r != null) {
            return decodeURIComponent(r[2]);
        }
        return null;
    }
    
    /**
     * 显示 Toast 提示
     * @param {string} message - 提示信息
     * @param {string} type - 类型: 'success', 'error', 'info'
     * @param {number} duration - 持续时间（毫秒）
     */
    function showToast(message, type, duration) {
        type = type || 'info';
        duration = duration || 2000;
        
        // 移除已存在的 toast
        var existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.parentNode.removeChild(existingToast);
        }
        
        var toast = document.createElement('div');
        toast.className = 'toast';
        if (type === 'error') {
            toast.className += ' toast-error';
        } else if (type === 'success') {
            toast.className += ' toast-success';
        }
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(function() {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, duration);
    }
    
    /**
     * 格式化时间为 MM:SS
     * @param {number} seconds - 秒数
     * @returns {string} 格式化的时间
     */
    function formatTime(seconds) {
        var minutes = Math.floor(seconds / 60);
        var secs = seconds % 60;
        return (minutes < 10 ? '0' : '') + minutes + ':' + (secs < 10 ? '0' : '') + secs;
    }
    
    /**
     * 随机打乱数组
     * @param {Array} array - 要打乱的数组
     * @returns {Array} 打乱后的数组
     */
    function shuffleArray(array) {
        var newArray = array.slice();
        for (var i = newArray.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = newArray[i];
            newArray[i] = newArray[j];
            newArray[j] = temp;
        }
        return newArray;
    }
    
    /**
     * 生成指定范围的随机整数
     * @param {number} min - 最小值
     * @param {number} max - 最大值
     * @returns {number} 随机整数
     */
    function randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
    /**
     * 深拷贝对象
     * @param {*} obj - 要拷贝的对象
     * @returns {*} 拷贝后的对象
     */
    function deepClone(obj) {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }
        
        if (obj instanceof Date) {
            return new Date(obj.getTime());
        }
        
        if (obj instanceof Array) {
            var clonedArr = [];
            for (var i = 0; i < obj.length; i++) {
                clonedArr[i] = deepClone(obj[i]);
            }
            return clonedArr;
        }
        
        var clonedObj = {};
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                clonedObj[key] = deepClone(obj[key]);
            }
        }
        return clonedObj;
    }
    
    /**
     * 防抖函数
     * @param {Function} func - 要执行的函数
     * @param {number} wait - 等待时间
     * @returns {Function} 防抖后的函数
     */
    function debounce(func, wait) {
        var timeout;
        return function() {
            var context = this;
            var args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(function() {
                func.apply(context, args);
            }, wait);
        };
    }
    
    /**
     * 节流函数
     * @param {Function} func - 要执行的函数
     * @param {number} wait - 等待时间
     * @returns {Function} 节流后的函数
     */
    function throttle(func, wait) {
        var lastTime = 0;
        return function() {
            var now = Date.now();
            if (now - lastTime >= wait) {
                func.apply(this, arguments);
                lastTime = now;
            }
        };
    }
    
    /**
     * 本地存储封装
     */
    var storage = {
        set: function(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (e) {
                console.error('Storage set error:', e);
                return false;
            }
        },
        get: function(key) {
            try {
                var value = localStorage.getItem(key);
                return value ? JSON.parse(value) : null;
            } catch (e) {
                console.error('Storage get error:', e);
                return null;
            }
        },
        remove: function(key) {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (e) {
                console.error('Storage remove error:', e);
                return false;
            }
        },
        clear: function() {
            try {
                localStorage.clear();
                return true;
            } catch (e) {
                console.error('Storage clear error:', e);
                return false;
            }
        }
    };
    
    // 导出公共方法
    return {
        getUrlParam: getUrlParam,
        showToast: showToast,
        formatTime: formatTime,
        shuffleArray: shuffleArray,
        randomInt: randomInt,
        deepClone: deepClone,
        debounce: debounce,
        throttle: throttle,
        storage: storage
    };
})();
