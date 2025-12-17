# 开发指南

本文档提供详细的开发指南，帮助开发者理解项目架构和添加新游戏。

## 项目架构

### 1. 模块化设计

项目采用 IIFE (立即执行函数表达式) 模式实现模块化，避免全局命名空间污染。

```javascript
var ModuleName = (function() {
    'use strict';
    
    // 私有变量和函数
    var privateVar = 'private';
    
    function privateFunction() {
        // ...
    }
    
    // 公共接口
    return {
        publicMethod: function() {
            // ...
        }
    };
})();
```

### 2. 核心模块

#### Utils 模块 (utils.js)

提供通用工具函数：

- `getUrlParam(name)` - 获取 URL 参数
- `showToast(message, type, duration)` - 显示提示信息
- `formatTime(seconds)` - 格式化时间
- `shuffleArray(array)` - 随机打乱数组
- `randomInt(min, max)` - 生成随机整数
- `deepClone(obj)` - 深拷贝对象
- `debounce(func, wait)` - 防抖函数
- `throttle(func, wait)` - 节流函数
- `storage` - 本地存储封装

#### Config 模块 (config.js)

管理应用配置：

- `init(customConfig)` - 初始化配置
- `get(path)` - 获取配置值
- `set(path, value)` - 设置配置值
- `reset()` - 重置配置

配置路径示例：
```javascript
Config.get('api.baseUrl')
Config.get('games.attention.pages')
Config.set('user.token', 'new_token')
```

#### API 模块 (api.js)

封装 API 接口：

- `request(options)` - 通用 HTTP 请求
- `get(url, params)` - GET 请求
- `post(url, data)` - POST 请求
- `submitTestData(testData)` - 上报测试数据
- `getLocalTestData()` - 获取本地缓存数据
- `syncLocalTestData()` - 同步本地数据
- `getGameConfig(gameType)` - 获取游戏配置

#### Animation 模块 (animation.js)

通用动画组件：

- `pageTransition(oldPage, newPage, callback)` - 页面切换动画
- `tutorialToGameTransition(oldPage, newPage, callback)` - 练习到正式测试动画
- `gamePageTransition(oldPage, newPage, callback)` - 游戏内翻页动画
- `gameToResultTransition(oldPage, newPage, callback)` - 测试到结果动画
- `buttonPress(button)` - 按钮点击动画
- `selectFeedback(element)` - 选中反馈动画
- `deselectFeedback(element)` - 取消选中动画
- `errorShake(element)` - 错误晃动动画
- `startMascotIdle(mascot)` - 吉祥物闲置动画
- `mascotPeek(mascot)` - 吉祥物探头动画
- `badgeStamp(badge, delay)` - 徽章盖章动画

## 添加新游戏

### 步骤 1：更新配置

在 `js/config.js` 中添加游戏配置：

```javascript
games: {
    // 现有游戏...
    newGame: {
        name: '新游戏名称',
        enabled: true,
        // 游戏特定配置
        rounds: 5,
        timeLimit: 30
    }
}
```

### 步骤 2：创建游戏页面

创建 `pages/newgame.html`：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>新游戏</title>
    <link rel="stylesheet" href="../css/common.css">
    <link rel="stylesheet" href="../css/newgame.css">
</head>
<body>
    <div id="app">
        <!-- 游戏页面内容 -->
    </div>
    
    <script src="../js/utils.js"></script>
    <script src="../js/config.js"></script>
    <script src="../js/api.js"></script>
    <script src="../js/animation.js"></script>
    <script src="../js/newgame.js"></script>
</body>
</html>
```

### 步骤 3：创建游戏样式

创建 `css/newgame.css`：

```css
/* 新游戏样式 */
.game-container {
    /* 游戏容器样式 */
}

/* 其他样式... */
```

### 步骤 4：创建游戏逻辑

创建 `js/newgame.js`：

```javascript
var NewGame = (function() {
    'use strict';
    
    var state = {
        // 游戏状态
    };
    
    function init() {
        console.log('Initializing New Game...');
        Config.init();
        // 初始化逻辑
    }
    
    function startGame() {
        // 开始游戏
    }
    
    function endGame() {
        // 结束游戏
        submitResults();
    }
    
    function submitResults() {
        var testData = {
            gameType: 'newGame',
            timestamp: Date.now(),
            token: Config.get('user.token'),
            results: {
                // 结果数据
            }
        };
        
        API.submitTestData(testData);
    }
    
    // 导出公共方法
    return {
        init: init,
        startGame: startGame,
        endGame: endGame
    };
})();

// 页面加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', NewGame.init);
} else {
    NewGame.init();
}
```

### 步骤 5：更新主页面

在 `index.html` 中添加游戏卡片：

```html
<div class="game-card" data-game="newGame">
    <div class="game-icon">
        <img src="images/base/newgame-icon.png" alt="新游戏">
    </div>
    <div class="game-info">
        <h3>新游戏</h3>
        <p>游戏描述</p>
    </div>
    <button class="btn-start" onclick="startGame('newGame')">开始测试</button>
</div>
```

在 `js/main.js` 的 `startGame` 函数中添加路由：

```javascript
switch (gameType) {
    // 现有游戏...
    case 'newGame':
        window.location.href = 'pages/newgame.html?token=' + (Config.get('user.token') || '');
        break;
}
```

## 动画使用指南

### 页面切换

```javascript
// 标准页面切换（引导流程）
Animation.pageTransition(oldPage, newPage, function() {
    // 切换完成后的回调
});

// 练习到正式测试
Animation.tutorialToGameTransition(oldPage, newPage, callback);

// 游戏内翻页
Animation.gamePageTransition(oldPage, newPage, callback);

// 测试到结果
Animation.gameToResultTransition(oldPage, newPage, callback);
```

### 微交互

```javascript
// 按钮点击
button.addEventListener('click', function() {
    Animation.buttonPress(this);
});

// 选中反馈
element.addEventListener('click', function() {
    if (isSelected) {
        Animation.deselectFeedback(this);
    } else {
        Animation.selectFeedback(this);
    }
});

// 错误提示
if (isError) {
    Animation.errorShake(element);
}
```

### 吉祥物动画

```javascript
// 启动闲置动画
var mascot = document.querySelector('.mascot');
var idleController = Animation.startMascotIdle(mascot);

// 停止闲置动画
idleController.stop();

// 探头动画（页面切换时）
Animation.mascotPeek(mascot);
```

## 数据上报

### 标准数据格式

```javascript
var testData = {
    gameType: 'gameName',           // 游戏类型
    timestamp: Date.now(),          // 时间戳
    token: Config.get('user.token'), // 用户 token
    results: {
        // 核心结果数据
        totalTime: 60,              // 总耗时（秒）
        score: 85,                  // 分数
        accuracy: 90,               // 准确率
        // 其他指标...
    },
    details: {
        // 详细数据
        rounds: [
            {
                roundIndex: 0,
                timeSpent: 20,
                correct: true
            }
        ]
    }
};

API.submitTestData(testData);
```

### 本地缓存

如果上报失败，数据会自动保存到本地：

```javascript
// 获取本地缓存的数据
var localData = API.getLocalTestData();

// 手动同步本地数据
API.syncLocalTestData().then(function() {
    console.log('Sync completed');
});
```

## ES5 语法注意事项

### 1. 变量声明

使用 `var` 而不是 `let` 或 `const`：

```javascript
// ✓ 正确
var name = 'value';

// ✗ 错误
let name = 'value';
const NAME = 'value';
```

### 2. 函数声明

使用传统函数声明，不使用箭头函数：

```javascript
// ✓ 正确
function myFunction() {
    // ...
}

var myFunction = function() {
    // ...
};

// ✗ 错误
const myFunction = () => {
    // ...
};
```

### 3. 字符串拼接

使用 `+` 拼接，不使用模板字符串：

```javascript
// ✓ 正确
var message = 'Hello, ' + name + '!';

// ✗ 错误
const message = `Hello, ${name}!`;
```

### 4. 对象和数组

不使用解构赋值和扩展运算符：

```javascript
// ✓ 正确
var name = obj.name;
var newArray = array.slice();

// ✗ 错误
const { name } = obj;
const newArray = [...array];
```

### 5. 循环

使用传统 for 循环，不使用 for...of：

```javascript
// ✓ 正确
for (var i = 0; i < array.length; i++) {
    var item = array[i];
}

// ✗ 错误
for (const item of array) {
    // ...
}
```

### 6. Promise

可以使用 Promise（ES6 特性，但大多数浏览器支持）：

```javascript
// ✓ 可以使用
new Promise(function(resolve, reject) {
    // ...
});
```

如果需要兼容更老的浏览器，可以使用回调函数：

```javascript
function asyncOperation(callback) {
    setTimeout(function() {
        callback(null, result);
    }, 1000);
}
```

## 调试技巧

### 1. 控制台日志

在关键位置添加日志：

```javascript
console.log('Game state:', state);
console.error('Error occurred:', error);
```

### 2. 断点调试

在浏览器开发者工具中设置断点，逐步执行代码。

### 3. 网络监控

在开发者工具的 Network 面板中查看 API 请求。

### 4. 本地存储检查

在 Application 面板中查看 localStorage 数据。

### 5. 移动端调试

使用微信开发者工具的 webview 调试功能。

## 性能优化

### 1. 减少 DOM 操作

批量更新 DOM，使用 DocumentFragment：

```javascript
var fragment = document.createDocumentFragment();
for (var i = 0; i < items.length; i++) {
    var element = document.createElement('div');
    element.textContent = items[i];
    fragment.appendChild(element);
}
container.appendChild(fragment);
```

### 2. 事件委托

使用事件委托减少事件监听器数量：

```javascript
container.addEventListener('click', function(e) {
    if (e.target.classList.contains('grid-item')) {
        handleItemClick(e.target);
    }
});
```

### 3. 防抖和节流

对频繁触发的事件使用防抖或节流：

```javascript
var debouncedResize = Utils.debounce(function() {
    // 处理 resize
}, 300);

window.addEventListener('resize', debouncedResize);
```

### 4. 图片优化

- 使用适当的图片格式和尺寸
- 使用 CSS Sprites 减少请求
- 懒加载图片

### 5. CSS 动画

优先使用 CSS 动画而不是 JavaScript 动画：

```css
.element {
    transition: transform 0.3s ease-out;
}

.element.active {
    transform: scale(1.1);
}
```

## 测试清单

### 功能测试

- [ ] 所有页面正常显示
- [ ] 页面切换动画流畅
- [ ] 按钮点击响应正常
- [ ] 游戏逻辑正确
- [ ] 数据统计准确
- [ ] 数据上报成功

### 兼容性测试

- [ ] Chrome 浏览器
- [ ] Safari 浏览器
- [ ] Firefox 浏览器
- [ ] 微信浏览器
- [ ] 微信小程序 webview

### 性能测试

- [ ] 页面加载时间 < 3秒
- [ ] 动画帧率 > 30fps
- [ ] 内存占用合理
- [ ] 无内存泄漏

### 用户体验测试

- [ ] 操作流畅自然
- [ ] 提示信息清晰
- [ ] 错误处理友好
- [ ] 响应式布局正常

## 常见问题

### Q: 如何修改 API 地址？

A: 在 `js/config.js` 中修改 `api.baseUrl`。

### Q: 如何调整游戏难度？

A: 在 `js/config.js` 中修改对应游戏的配置参数。

### Q: 如何添加新的动画效果？

A: 在 `js/animation.js` 中添加新的动画函数，并在 `css/common.css` 中定义对应的 CSS 动画。

### Q: 如何处理数据上报失败？

A: 数据会自动保存到本地，应用会在下次启动或页面可见时自动同步。

### Q: 如何自定义 Toast 样式？

A: 修改 `css/common.css` 中的 `.toast` 相关样式。

## 资源链接

- [MDN Web Docs](https://developer.mozilla.org/)
- [微信小程序文档](https://developers.weixin.qq.com/miniprogram/dev/)
- [Can I Use](https://caniuse.com/) - 检查浏览器兼容性

## 贡献指南

1. 遵循项目的代码风格
2. 使用 ES5 语法
3. 添加适当的注释
4. 测试新功能
5. 更新文档

## 联系方式

如有问题或建议，请联系开发团队。
