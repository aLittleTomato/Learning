# 部署说明

本文档提供详细的部署指南，帮助将应用部署到生产环境。

## 部署前准备

### 1. 配置 API 地址

修改 `js/config.js` 中的 API 配置：

```javascript
api: {
    baseUrl: 'https://your-api-domain.com',  // 修改为实际的 API 地址
    timeout: 30000
}
```

### 2. 准备图片资源

将图片资源放置到对应目录：

```
images/
├── base/                    # 通用图片资源
│   ├── attention-icon.png   # 注意力测试图标
│   ├── dst-icon.png         # 数字广度测试图标
│   ├── memory-icon.png      # 情景记忆测试图标
│   ├── tmt-icon.png         # 连线测试图标
│   └── raven-icon.png       # 瑞文推理图标
└── game/                    # 游戏图片资源
    └── attention/           # 注意力测试图片
        └── (游戏相关图片)
```

### 3. 测试功能

在本地环境测试所有功能：

```bash
node server.js
```

访问 http://localhost:8080/ 进行测试。

## 部署方式

### 方式一：静态文件服务器

最简单的部署方式，将整个项目文件夹上传到静态文件服务器。

#### 1. 上传文件

将以下文件和目录上传到服务器：

```
cognitive-test-webview/
├── index.html
├── pages/
├── css/
├── js/
├── images/
└── data/
```

**注意**：不需要上传 `server.js`、`server.log`、`README.md` 等开发文件。

#### 2. 配置服务器

确保服务器支持静态文件访问，并配置正确的 MIME 类型。

### 方式二：Nginx 部署

#### 1. 安装 Nginx

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install nginx

# CentOS/RHEL
sudo yum install nginx
```

#### 2. 配置 Nginx

创建配置文件 `/etc/nginx/sites-available/cognitive-test`：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    root /var/www/cognitive-test-webview;
    index index.html;
    
    # 启用 gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    gzip_min_length 1000;
    
    # 静态文件缓存
    location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
    
    # HTML 文件不缓存
    location ~* \.html$ {
        expires -1;
        add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0";
    }
    
    # 处理所有请求
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

#### 3. 启用配置

```bash
sudo ln -s /etc/nginx/sites-available/cognitive-test /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 方式三：HTTPS 部署（推荐）

微信小程序要求使用 HTTPS，需要配置 SSL 证书。

#### 1. 获取 SSL 证书

使用 Let's Encrypt 免费证书：

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

#### 2. Nginx HTTPS 配置

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    root /var/www/cognitive-test-webview;
    index index.html;
    
    # 其他配置同上...
}
```

### 方式四：CDN 加速

使用 CDN 加速静态资源访问。

#### 1. 上传到 CDN

将 `css/`、`js/`、`images/` 目录上传到 CDN。

#### 2. 修改引用路径

在 HTML 文件中修改资源引用路径：

```html
<!-- 修改前 -->
<link rel="stylesheet" href="css/common.css">

<!-- 修改后 -->
<link rel="stylesheet" href="https://cdn.your-domain.com/css/common.css">
```

## 微信小程序集成

### 1. 配置业务域名

在微信小程序后台配置业务域名：

1. 登录微信小程序后台
2. 进入「开发」-「开发管理」-「开发设置」
3. 在「业务域名」中添加部署的域名
4. 下载校验文件并上传到服务器根目录

### 2. 配置服务器域名

在「服务器域名」中添加 API 域名：

- request 合法域名：`https://your-api-domain.com`

### 3. 使用 web-view 组件

在小程序页面中使用 web-view：

```xml
<!-- pages/test/test.wxml -->
<web-view src="{{webviewUrl}}"></web-view>
```

```javascript
// pages/test/test.js
Page({
  data: {
    webviewUrl: ''
  },
  
  onLoad: function(options) {
    // 获取用户 token
    const token = wx.getStorageSync('token') || '';
    
    // 构建 URL
    const baseUrl = 'https://your-domain.com';
    const url = `${baseUrl}/?token=${token}`;
    
    this.setData({
      webviewUrl: url
    });
  }
});
```

### 4. 接收 webview 消息

如果需要从 webview 向小程序发送消息：

在网页中：

```javascript
// 发送消息到小程序
wx.miniProgram.postMessage({
  data: {
    type: 'testComplete',
    results: testResults
  }
});

// 跳转到小程序页面
wx.miniProgram.navigateTo({
  url: '/pages/result/result'
});
```

在小程序中：

```xml
<web-view src="{{webviewUrl}}" bindmessage="handleMessage"></web-view>
```

```javascript
Page({
  handleMessage: function(e) {
    console.log('收到消息：', e.detail.data);
    
    // 处理测试完成消息
    if (e.detail.data[0].type === 'testComplete') {
      const results = e.detail.data[0].results;
      // 处理结果...
    }
  }
});
```

## 后端 API 实现

### 1. 数据上报接口

**接口地址**：`POST /api/test/submit`

**请求头**：
```
Content-Type: application/json
Authorization: Bearer {token}
```

**请求体**：
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
    "pages": [...]
  }
}
```

**响应**：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": "test_record_id"
  }
}
```

### 2. 游戏配置接口（可选）

**接口地址**：`GET /api/game/config/{gameType}`

**响应**：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "name": "注意力测试",
    "enabled": true,
    "pages": 3,
    "itemsPerPage": 56,
    "correctItemsPerPage": 25,
    "timePerPage": 20
  }
}
```

### 3. Node.js 示例实现

```javascript
const express = require('express');
const app = express();

app.use(express.json());

// 数据上报接口
app.post('/api/test/submit', (req, res) => {
  const { gameType, timestamp, token, results, details } = req.body;
  
  // 验证 token
  if (!token) {
    return res.status(401).json({
      code: 401,
      message: 'Unauthorized'
    });
  }
  
  // 保存数据到数据库
  // ...
  
  res.json({
    code: 0,
    message: 'success',
    data: {
      id: 'test_record_' + Date.now()
    }
  });
});

// 游戏配置接口
app.get('/api/game/config/:gameType', (req, res) => {
  const { gameType } = req.params;
  
  // 从数据库获取配置
  // ...
  
  res.json({
    code: 0,
    message: 'success',
    data: {
      name: '注意力测试',
      enabled: true,
      pages: 3,
      itemsPerPage: 56,
      correctItemsPerPage: 25,
      timePerPage: 20
    }
  });
});

app.listen(3000, () => {
  console.log('API server running on port 3000');
});
```

## 性能优化

### 1. 启用 gzip 压缩

在 Nginx 配置中启用 gzip：

```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
gzip_min_length 1000;
```

### 2. 设置缓存策略

```nginx
# 静态文件长期缓存
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 30d;
    add_header Cache-Control "public, immutable";
}

# HTML 文件不缓存
location ~* \.html$ {
    expires -1;
    add_header Cache-Control "no-store, no-cache, must-revalidate";
}
```

### 3. 压缩图片

使用工具压缩图片：

```bash
# 安装 imagemagick
sudo apt-get install imagemagick

# 批量压缩图片
for img in images/**/*.png; do
    convert "$img" -quality 85 "$img"
done
```

### 4. 合并和压缩 CSS/JS

可以使用工具合并和压缩文件（可选）：

```bash
# 安装 UglifyJS
npm install -g uglify-js

# 压缩 JS 文件
uglifyjs js/utils.js js/config.js js/api.js js/animation.js -o js/bundle.min.js
```

## 监控和日志

### 1. Nginx 访问日志

```nginx
access_log /var/log/nginx/cognitive-test-access.log;
error_log /var/log/nginx/cognitive-test-error.log;
```

### 2. 应用监控

可以集成第三方监控服务，如：

- Google Analytics
- 百度统计
- 友盟统计

在 `index.html` 中添加统计代码：

```html
<script>
// Google Analytics 示例
(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

ga('create', 'UA-XXXXX-Y', 'auto');
ga('send', 'pageview');
</script>
```

## 故障排查

### 问题 1：页面无法访问

**检查项**：
- 服务器是否启动
- 防火墙是否开放端口
- 域名解析是否正确
- Nginx 配置是否正确

### 问题 2：静态资源加载失败

**检查项**：
- 文件路径是否正确
- 文件权限是否正确
- MIME 类型是否配置
- CORS 是否配置（如果使用 CDN）

### 问题 3：微信小程序无法加载

**检查项**：
- 业务域名是否配置
- 是否使用 HTTPS
- 校验文件是否上传
- 服务器域名是否配置

### 问题 4：数据上报失败

**检查项**：
- API 地址是否正确
- 网络是否正常
- Token 是否有效
- 后端接口是否正常

## 安全建议

### 1. HTTPS

必须使用 HTTPS，保护数据传输安全。

### 2. 安全头

在 Nginx 配置中添加安全头：

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
```

### 3. Token 验证

后端必须验证 token 的有效性。

### 4. 输入验证

后端必须验证所有输入数据。

### 5. 限流

防止恶意请求，可以使用 Nginx 限流：

```nginx
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

location /api/ {
    limit_req zone=api burst=20;
    # ...
}
```

## 备份和恢复

### 1. 定期备份

```bash
# 备份脚本
#!/bin/bash
BACKUP_DIR="/backup/cognitive-test"
DATE=$(date +%Y%m%d_%H%M%S)

# 备份文件
tar -czf "$BACKUP_DIR/files_$DATE.tar.gz" /var/www/cognitive-test-webview

# 删除 30 天前的备份
find "$BACKUP_DIR" -name "files_*.tar.gz" -mtime +30 -delete
```

### 2. 恢复

```bash
# 解压备份文件
tar -xzf files_20231215_120000.tar.gz -C /var/www/
```

## 更新和维护

### 1. 更新流程

1. 在测试环境测试新版本
2. 备份当前版本
3. 上传新版本文件
4. 清除浏览器缓存
5. 验证功能正常

### 2. 版本管理

建议使用 Git 进行版本管理：

```bash
# 初始化仓库
git init
git add .
git commit -m "Initial commit"

# 创建版本标签
git tag -a v1.0.0 -m "Version 1.0.0"
```

## 联系方式

如有部署问题，请联系技术支持团队。
