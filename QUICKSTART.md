# 快速开始指南

本指南帮助您快速启动和使用认知测试 WebView 应用。

## 5分钟快速启动

### 1. 解压项目（如果是压缩包）

```bash
tar -xzf cognitive-test-webview.tar.gz
cd cognitive-test-webview
```

### 2. 启动本地服务器

```bash
node server.js
```

看到以下输出表示启动成功：
```
Server running at http://localhost:8080/
Press Ctrl+C to stop the server
```

### 3. 访问应用

在浏览器中打开：http://localhost:8080/

### 4. 测试注意力游戏

1. 点击"注意力测试"卡片上的"开始测试"按钮
2. 按照页面提示完成引导流程
3. 在练习模式中熟悉游戏规则
4. 完成正式测试
5. 查看测试结果

## 带 Token 访问

如果需要传递用户 token：

```
http://localhost:8080/?token=your_token_here
```

或直接访问游戏页面：

```
http://localhost:8080/pages/attention.html?token=your_token_here
```

## 配置 API 地址

编辑 `js/config.js` 文件，修改第 12 行：

```javascript
api: {
    baseUrl: 'https://your-api-domain.com',  // 改为你的 API 地址
    timeout: 30000
}
```

## 调整游戏参数

编辑 `js/config.js` 文件，修改第 18-27 行：

```javascript
attention: {
    name: '注意力测试',
    enabled: true,
    pages: 3,                    // 测试页数（默认3页）
    itemsPerPage: 56,            // 每页选项数（默认56个）
    correctItemsPerPage: 25,     // 每页正确答案数（默认25个）
    timePerPage: 20,             // 每页时间限制（默认20秒）
    practiceItems: 6,            // 练习模式选项数（默认6个）
    practiceCorrectItems: 2      // 练习模式正确答案数（默认2个）
}
```

## 常见问题

### Q1: 端口 8080 被占用怎么办？

修改 `server.js` 文件的第 7 行：

```javascript
var PORT = 8080;  // 改为其他端口，如 8081
```

### Q2: 如何查看测试数据？

测试数据会自动上报到配置的 API 地址。如果上报失败，数据会保存在浏览器的 localStorage 中。

在浏览器开发者工具的 Console 中执行：

```javascript
Utils.storage.get('test_data_cache')
```

### Q3: 如何停止服务器？

在终端中按 `Ctrl+C` 停止服务器。

### Q4: 图片不显示怎么办？

项目预留了图片目录，但未包含实际图片。如果没有图片，会显示渐变色背景，不影响功能使用。

如需添加图片，将图片文件放到对应目录：

- `images/base/` - 通用图片
- `images/game/attention/` - 注意力测试游戏图片

### Q5: 如何在 VSCode 中开发？

1. 用 VSCode 打开项目文件夹
2. 安装 "Live Server" 插件（可选）
3. 右键点击 `index.html`，选择 "Open with Live Server"
4. 或者使用命令行启动 `node server.js`

## 目录结构

```
cognitive-test-webview/
├── index.html              # 主页面（从这里开始）
├── pages/
│   └── attention.html      # 注意力测试页面
├── css/                    # 样式文件
├── js/                     # JavaScript 文件
├── images/                 # 图片资源（需补充）
├── server.js               # 本地服务器
├── README.md               # 详细说明文档
├── DEVELOPMENT.md          # 开发指南
├── DEPLOYMENT.md           # 部署说明
└── QUICKSTART.md           # 本文档
```

## 下一步

### 开发新游戏

参考 `DEVELOPMENT.md` 文档的"添加新游戏"章节。

### 部署到生产环境

参考 `DEPLOYMENT.md` 文档。

### 集成到微信小程序

参考 `DEPLOYMENT.md` 文档的"微信小程序集成"章节。

## 技术支持

- 详细文档：查看 `README.md`
- 开发指南：查看 `DEVELOPMENT.md`
- 部署说明：查看 `DEPLOYMENT.md`
- 交付清单：查看 `DELIVERY.md`

## 在线演示

临时演示地址：https://8080-i4tq43wj8u6tigfd4mhfj-02fb4ddf.manus-asia.computer

（注意：此地址仅用于测试，不保证长期有效）

---

祝您使用愉快！如有问题，请查看详细文档或联系技术支持。
