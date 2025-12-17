/**
 * API 接口封装 - 使用 ES5 语法
 */

var API = (function() {
    'use strict';
    
    /**
     * 发送 HTTP 请求
     * @param {Object} options - 请求选项
     * @returns {Promise} Promise 对象（使用回调模拟）
     */
    function request(options) {
        var xhr = new XMLHttpRequest();
        var method = options.method || 'GET';
        var url = options.url;
        var data = options.data || null;
        var headers = options.headers || {};
        var timeout = options.timeout || Config.get('api.timeout');
        
        return new Promise(function(resolve, reject) {
            xhr.open(method, url, true);
            xhr.timeout = timeout;
            
            // 设置请求头
            xhr.setRequestHeader('Content-Type', 'application/json');
            var token = Config.get('user.token');
            if (token) {
                xhr.setRequestHeader('Authorization', 'Bearer ' + token);
            }
            
            for (var key in headers) {
                if (headers.hasOwnProperty(key)) {
                    xhr.setRequestHeader(key, headers[key]);
                }
            }
            
            // 监听响应
            xhr.onload = function() {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        var response = JSON.parse(xhr.responseText);
                        resolve(response);
                    } catch (e) {
                        resolve(xhr.responseText);
                    }
                } else {
                    reject({
                        status: xhr.status,
                        statusText: xhr.statusText,
                        response: xhr.responseText
                    });
                }
            };
            
            xhr.onerror = function() {
                reject({
                    status: 0,
                    statusText: 'Network Error',
                    response: null
                });
            };
            
            xhr.ontimeout = function() {
                reject({
                    status: 0,
                    statusText: 'Request Timeout',
                    response: null
                });
            };
            
            // 发送请求
            if (data && typeof data === 'object') {
                xhr.send(JSON.stringify(data));
            } else {
                xhr.send(data);
            }
        });
    }
    
    /**
     * GET 请求
     */
    function get(url, params) {
        if (params) {
            var queryString = Object.keys(params).map(function(key) {
                return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
            }).join('&');
            url += (url.indexOf('?') === -1 ? '?' : '&') + queryString;
        }
        
        return request({
            method: 'GET',
            url: url
        });
    }
    
    /**
     * POST 请求
     */
    function post(url, data) {
        return request({
            method: 'POST',
            url: url,
            data: data
        });
    }
    
    /**
     * 上报测试数据
     * @param {Object} testData - 测试数据
     */
    function submitTestData(testData) {
        var baseUrl = Config.get('api.baseUrl');
        var url = baseUrl + '/api/test/submit';
        
        console.log('Submitting test data:', testData);
        
        return post(url, testData).then(function(response) {
            console.log('Test data submitted successfully:', response);
            return response;
        }).catch(function(error) {
            console.error('Failed to submit test data:', error);
            // 失败时保存到本地
            saveTestDataLocally(testData);
            throw error;
        });
    }
    
    /**
     * 保存测试数据到本地
     * @param {Object} testData - 测试数据
     */
    function saveTestDataLocally(testData) {
        var localData = Utils.storage.get('test_data_cache') || [];
        testData.timestamp = Date.now();
        testData.synced = false;
        localData.push(testData);
        Utils.storage.set('test_data_cache', localData);
        console.log('Test data saved locally');
    }
    
    /**
     * 获取本地缓存的测试数据
     */
    function getLocalTestData() {
        return Utils.storage.get('test_data_cache') || [];
    }
    
    /**
     * 同步本地测试数据
     */
    function syncLocalTestData() {
        var localData = getLocalTestData();
        var unsyncedData = localData.filter(function(item) {
            return !item.synced;
        });
        
        if (unsyncedData.length === 0) {
            return Promise.resolve();
        }
        
        console.log('Syncing local test data:', unsyncedData.length + ' items');
        
        var promises = unsyncedData.map(function(item) {
            return submitTestData(item).then(function() {
                item.synced = true;
            }).catch(function() {
                // 忽略错误，下次再同步
            });
        });
        
        return Promise.all(promises).then(function() {
            Utils.storage.set('test_data_cache', localData);
            console.log('Local test data synced');
        });
    }
    
    /**
     * 获取游戏配置
     * @param {string} gameType - 游戏类型
     */
    function getGameConfig(gameType) {
        var baseUrl = Config.get('api.baseUrl');
        var url = baseUrl + '/api/game/config/' + gameType;
        
        return get(url).catch(function(error) {
            console.error('Failed to get game config:', error);
            // 返回默认配置
            return Config.get('games.' + gameType);
        });
    }
    
    // 导出公共方法
    return {
        request: request,
        get: get,
        post: post,
        submitTestData: submitTestData,
        getLocalTestData: getLocalTestData,
        syncLocalTestData: syncLocalTestData,
        getGameConfig: getGameConfig
    };
})();
