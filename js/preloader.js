/**
 * 通用预加载组件
 * 用于预加载页面中的图片资源，显示加载进度
 */
var Preloader = (function() {
    'use strict';

    /**
     * 从HTML中提取所有图片URL
     * @param {HTMLElement} container - 容器元素
     * @returns {Array<string>} 图片URL数组
     */
    function extractImagesFromHTML(container) {
        var images = [];
        
        // 提取 img 标签的 src
        var imgTags = container.querySelectorAll('img');
        for (var i = 0; i < imgTags.length; i++) {
            var src = imgTags[i].getAttribute('src');
            if (src && images.indexOf(src) === -1) {
                images.push(src);
            }
        }
        
        // 提取 CSS background-image
        var allElements = container.querySelectorAll('*');
        for (var j = 0; j < allElements.length; j++) {
            var bgImage = window.getComputedStyle(allElements[j]).backgroundImage;
            if (bgImage && bgImage !== 'none') {
                var matches = bgImage.match(/url\(['"]?([^'"]+)['"]?\)/);
                if (matches && matches[1] && images.indexOf(matches[1]) === -1) {
                    images.push(matches[1]);
                }
            }
        }
        
        return images;
    }

    /**
     * 预加载图片
     * @param {Array<string>} imageUrls - 图片URL数组
     * @param {Function} onProgress - 进度回调 (loaded, total)
     * @param {Function} onComplete - 完成回调
     * @param {Function} onError - 错误回调 (可选)
     */
    function loadImages(imageUrls, onProgress, onComplete, onError) {
        if (!imageUrls || imageUrls.length === 0) {
            if (onComplete) onComplete();
            return;
        }

        var total = imageUrls.length;
        var loaded = 0;
        var failed = 0;

        function checkComplete() {
            if (loaded + failed >= total) {
                if (onComplete) {
                    onComplete({
                        total: total,
                        loaded: loaded,
                        failed: failed
                    });
                }
            }
        }

        imageUrls.forEach(function(url) {
            var img = new Image();
            
            img.onload = function() {
                loaded++;
                if (onProgress) {
                    onProgress(loaded + failed, total, loaded, failed);
                }
                checkComplete();
            };
            
            img.onerror = function() {
                failed++;
                console.warn('图片加载失败:', url);
                if (onError) {
                    onError(url);
                }
                if (onProgress) {
                    onProgress(loaded + failed, total, loaded, failed);
                }
                checkComplete();
            };
            
            img.src = url;
        });
    }

    /**
     * 创建预加载UI
     * @returns {Object} 包含容器和更新方法的对象
     */
    function createPreloaderUI() {
        var container = document.createElement('div');
        container.className = 'preloader-overlay';
        container.innerHTML = 
            '<div class="preloader-content">' +
                '<div class="preloader-mascot"></div>' +
                '<div class="preloader-text">加载中...</div>' +
                '<div class="preloader-bar">' +
                    '<div class="preloader-progress"></div>' +
                '</div>' +
                '<div class="preloader-percent">0%</div>' +
            '</div>';
        
        document.body.appendChild(container);
        
        var progressBar = container.querySelector('.preloader-progress');
        var percentText = container.querySelector('.preloader-percent');
        var loadingText = container.querySelector('.preloader-text');
        
        return {
            container: container,
            update: function(loaded, total) {
                var percent = Math.round((loaded / total) * 100);
                progressBar.style.width = percent + '%';
                percentText.textContent = percent + '%';
            },
            setText: function(text) {
                loadingText.textContent = text;
            },
            remove: function() {
                container.style.opacity = '0';
                setTimeout(function() {
                    if (container.parentNode) {
                        container.parentNode.removeChild(container);
                    }
                }, 300);
            }
        };
    }

    /**
     * 预加载页面资源
     * @param {Object} options - 配置选项
     * @param {Array<string>} options.images - 额外的图片URL数组
     * @param {HTMLElement} options.container - 要扫描的容器元素（默认为document.body）
     * @param {Function} options.onComplete - 完成回调
     * @param {Function} options.onProgress - 进度回调
     */
    function preload(options) {
        options = options || {};
        
        var container = options.container || document.body;
        var additionalImages = options.images || [];
        var onComplete = options.onComplete;
        var onProgress = options.onProgress;
        
        // 创建预加载UI
        var ui = createPreloaderUI();
        
        // 提取HTML中的图片
        var htmlImages = extractImagesFromHTML(container);
        
        // 合并所有图片URL（去重）
        var allImages = htmlImages.concat(additionalImages);
        var uniqueImages = [];
        for (var i = 0; i < allImages.length; i++) {
            if (uniqueImages.indexOf(allImages[i]) === -1) {
                uniqueImages.push(allImages[i]);
            }
        }
        
        console.log('开始预加载', uniqueImages.length, '张图片');
        
        // 开始加载
        loadImages(
            uniqueImages,
            function(current, total, loaded, failed) {
                // 进度回调
                ui.update(current, total);
                if (onProgress) {
                    onProgress(current, total, loaded, failed);
                }
            },
            function(result) {
                // 完成回调
                console.log('预加载完成:', result);
                ui.setText('加载完成！');
                
                setTimeout(function() {
                    ui.remove();
                    if (onComplete) {
                        onComplete(result);
                    }
                }, 500);
            },
            function(url) {
                // 错误回调（可选）
                console.warn('图片加载失败:', url);
            }
        );
    }

    /**
     * 简化的预加载方法（只需要图片数组和完成回调）
     * @param {Array<string>} images - 图片URL数组
     * @param {Function} callback - 完成回调
     */
    function preloadImages(images, callback) {
        preload({
            images: images,
            container: document.createElement('div'), // 空容器，不扫描HTML
            onComplete: callback
        });
    }

    // 暴露公共接口
    return {
        preload: preload,
        preloadImages: preloadImages,
        loadImages: loadImages,
        extractImagesFromHTML: extractImagesFromHTML,
        createPreloaderUI: createPreloaderUI
    };
})();
