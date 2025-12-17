# 认知测试 WebView 应用

这是一个用于微信小程序 webview 的认知测试网页应用，包含多个认知能力测试游戏。

## 项目特点

- **兼容性优先**：使用 ES5 语法，兼容各种浏览器和微信小程序 webview
- **性能优化**：纯静态网页，无需构建工具，加载速度快
- **动效丰富**：基于 PRD 规范实现的通用交互动效组件
- **数据上报**：支持测试数据上报和本地缓存
- **响应式设计**：适配各种屏幕尺寸

## 项目结构

```
cognitive-test-webview/
├── index.html              # 主入口页面
├── pages/                  # 游戏页面
│   └── attention.html      # 注意力测试页面
├── css/                    # 样式文件
│   ├── common.css          # 通用样式
│   ├── main.css            # 主页面样式
│   └── attention.css       # 注意力测试样式
├── js/                     # JavaScript 文件
│   ├── utils.js            # 工具函数库
│   ├── config.js           # 配置管理
│   ├── api.js              # API 接口封装
│   ├── animation.js        # 通用动画组件
│   ├── main.js             # 主应用逻辑
│   └── attention.js        # 注意力测试逻辑
├── images/                 # 图片资源
│   ├── base/               # 通用图片资源
│   └── game/               # 游戏图片资源
│       └── attention/      # 注意力测试图片
├── data/                   # 数据文件
├── server.js               # 本地测试服务器
└── README.md               # 项目说明文档
```

## 已实现功能

### 1. 注意力测试游戏

完整实现了 PRD 文档中的注意力测试游戏，包括：

- **P1 欢迎页**：展示欢迎语，点击屏幕继续
- **P2 心理建设**：提示"按自己节奏来"
- **P3 核心任务发布**：说明任务目标
- **P4-P5 规则详解**：详细说明游戏规则和示例
- **P6 练习模式**：6个选项的练习关卡，实时纠错提示
- **P7 正式测试**：3页测试，每页56个选项（25-26个正确答案），每页20秒倒计时
- **P8 结果结算**：展示总耗时、正确率、加工速度、集中程度等数据

### 2. 通用交互动效组件

基于 PRD 文档的交互动效规范实现，包括：

- **页面切换动画**：引导流程切换、练习到正式测试、游戏内翻页、测试到结果
- **微交互动画**：按钮点击、选中反馈、取消选中、错误晃动
- **吉祥物动画**：闲置浮动、探头动画
- **徽章动画**：结果页徽章盖章效果

### 3. 核心功能模块

- **配置管理**：支持从 URL 参数解析 token，支持本地存储配置
- **API 接口**：封装数据上报接口，支持失败时本地缓存
- **工具函数**：URL 参数解析、Toast 提示、时间格式化、数组打乱等
- **数据统计**：准确率、加工速度、集中程度等多维度数据分析

## 待实现功能

- 数字广度测试 (DST)
- 情景记忆测试
- 连线测试 (TMT)
- 瑞文推理（60道题目）
- 答题详情页面

## 本地开发

### 1. 启动本地服务器

```bash
cd cognitive-test-webview
node server.js
```

服务器将在 http://localhost:8080/ 启动

### 2. 访问应用

- 主页面：http://localhost:8080/
- 注意力测试：http://localhost:8080/pages/attention.html

### 3. 带 Token 访问

```
http://localhost:8080/?token=your_token_here
http://localhost:8080/pages/attention.html?token=your_token_here
```

## 微信小程序集成

### 1. 配置业务域名

在微信小程序后台配置业务域名，将网页部署到服务器后，添加域名到白名单。

### 2. 使用 web-view 组件

```xml
<web-view src="https://your-domain.com/?token={{token}}"></web-view>
```

### 3. 数据交互

应用会自动从 URL 参数中获取 token，并在测试完成后上报数据到配置的 API 地址。

## 配置说明

### API 配置

修改 `js/config.js` 中的 API 配置：

```javascript
api: {
    baseUrl: 'https://api.example.com',  // 修改为实际的 API 地址
    timeout: 30000
}
```

### 游戏配置

可以在 `js/config.js` 中调整游戏参数：

```javascript
games: {
    attention: {
        name: '注意力测试',
        enabled: true,
        pages: 3,                    // 测试页数
        itemsPerPage: 56,            // 每页选项数
        correctItemsPerPage: 25,     // 每页正确答案数
        timePerPage: 20,             // 每页时间（秒）
        practiceItems: 6,            // 练习选项数
        practiceCorrectItems: 2      // 练习正确答案数
    }
}
```

## 数据格式

### 测试数据上报格式

```json
{
    "gameType": "attention",
    "timestamp": 1702728000000,
    "token": "user_token",
    "results": {
        "totalTime": 60,
        "correctCount": 70,
        "errorCount": 5,
        "omissionCount": 3,
        "totalItems": 75,
        "accuracy": 90,
        "speed": 78,
        "focus": 62
    },
    "details": {
        "pages": [
            {
                "timeSpent": 20,
                "result": {
                    "correctCount": 23,
                    "errorCount": 2,
                    "omissionCount": 1,
                    "totalCorrect": 25
                }
            }
        ]
    }
}
```

## 技术栈

- **HTML5**：语义化标签
- **CSS3**：Flexbox、Grid、动画
- **JavaScript (ES5)**：兼容性优先
- **Node.js**：本地开发服务器

## 浏览器兼容性

- Chrome/Edge: ✓
- Safari: ✓
- Firefox: ✓
- 微信浏览器: ✓
- 微信小程序 webview: ✓

## 注意事项

1. **不使用 ES6 语法**：为了兼容性，整个项目使用 ES5 语法
2. **图片资源**：需要自行准备图片资源，放在对应目录下
3. **API 接口**：需要后端提供数据上报接口
4. **Token 管理**：通过 URL 参数传递 token，应用会自动解析和使用

## 开发建议

1. 使用 VSCode 进行开发
2. 安装 Live Server 插件进行实时预览
3. 使用浏览器开发者工具调试
4. 在微信开发者工具中测试 webview 兼容性

## 部署

### 静态服务器部署

将整个项目文件夹上传到静态服务器即可，无需构建步骤。

### Nginx 配置示例

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/cognitive-test-webview;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## 许可证

MIT License

## 联系方式

如有问题，请联系开发团队。
