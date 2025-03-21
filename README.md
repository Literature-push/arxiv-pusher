# arXiv文献推送系统

这是一个基于arXiv API的学术论文推送系统，使用React构建的纯前端应用，可以自动获取最新论文并根据用户设置的关键词进行匹配推送。

## 线上演示

访问 [https://literature-push.github.io/arxiv-pusher/](https://literature-push.github.io/arxiv-pusher/) 体验在线版本。

## 功能特点

- 自动从arXiv获取最新论文
- 基于关键词的智能匹配
- 使用OpenAI API进行强化匹配（可选）
- 使用EmailJS发送邮件通知（可选）
- 完全本地化，所有数据保存在浏览器中
- 无需后端服务器，可部署在GitHub Pages等静态网站托管服务

## 技术栈

- 前端：React.js
- UI库：React Bootstrap
- 路由：React Router (HashRouter)
- AI增强：OpenAI API (可选)
- 邮件服务：EmailJS (可选)

## 项目结构

```
文献推送网站/
├── frontend/                # React前端
│   ├── public/              # 静态资源
│   ├── src/                 # 源代码
│   │   ├── components/      # React组件
│   │   ├── pages/           # 页面组件
│   │   ├── services/        # API服务
│   │   ├── App.js           # 主应用组件
│   │   └── index.js         # 入口文件
│   └── package.json         # 依赖配置
└── README.md                # 项目说明
```

## 安装与运行

### 本地开发

1. 进入前端目录
   ```
   cd 文献推送网站/frontend
   ```

2. 安装依赖
   ```
   npm install
   ```

3. 运行前端开发服务器
   ```
   npm start
   ```

4. 构建生产版本
   ```
   npm run build
   ```

### 部署到GitHub Pages

1. 在package.json中设置homepage字段
   ```json
   "homepage": "https://[你的用户名].github.io/[你的仓库名]"
   ```

2. 安装gh-pages依赖
   ```
   npm install --save-dev gh-pages
   ```

3. 添加部署脚本到package.json
   ```json
   "scripts": {
     "predeploy": "npm run build",
     "deploy": "gh-pages -d build"
   }
   ```

4. 部署到GitHub Pages
   ```
   npm run deploy
   ```

## 详细设置攻略

### OpenAI API密钥获取

为了使用AI增强匹配功能，您需要获取OpenAI API密钥：

1. 访问 [OpenAI平台](https://platform.openai.com/)，注册或登录您的OpenAI账户
2. 导航至"API keys"部分（通常在左侧导航栏）
3. 点击"Create new secret key"按钮
4. 为新密钥添加名称（可选）并创建
5. **立即复制并保存**生成的API密钥，因为它只会显示一次
6. 在arXiv推送系统的"设置"页面，将复制的API密钥粘贴到"OpenAI API密钥"字段中
7. 点击"保存API密钥"按钮

**重要说明**：
- 您的API密钥仅存储在浏览器的本地存储中，不会被发送至任何第三方服务器
- API密钥只在您调用OpenAI API进行论文匹配时使用
- 本应用是纯前端应用，没有后端服务器来存储您的密钥
- 我们不会收集或存储您的API密钥，所有API调用直接从您的浏览器发起
- 如果您清除浏览器数据，API密钥将被删除，需要重新输入

### 邮箱设置全流程

本应用使用EmailJS服务发送邮件通知。以下是完整设置流程：

1. **注册EmailJS账户**：
   - 访问 [EmailJS官网](https://www.emailjs.com/) 并注册账户
   - 免费计划每月可发送200封邮件，足够个人使用

2. **创建邮件服务**：
   - 登录后，点击"Email Services"→"Add New Service"
   - 选择您喜欢的邮件服务提供商（Gmail、Outlook等）
   - 按照提示完成服务连接（通常需要授权访问）

3. **创建邮件模板**：
   - 前往"Email Templates"→"Create New Template"
   - 设计您的模板，确保包含以下变量：
     - `{{to_email}}` - 收件人邮箱
     - `{{subject}}` - 邮件主题
     - `{{papers}}` - 推荐论文列表

4. **获取必要ID**：
   - 记下您的Service ID（在Email Services页面）
   - 记下您的Template ID（在Email Templates页面）
   - 前往Integration页面复制您的Public Key

5. **在arXiv推送系统中配置**：
   - 前往"设置"页面的"邮件设置"部分
   - 输入您的EmailJS Public Key
   - 输入您的Service ID
   - 输入您的Template ID
   - 点击"保存邮件设置"按钮

**使用建议**：
- 邮件服务设置是可选的，即使不设置也能使用基本推荐功能
- 设置完成后，系统会在"我的订阅"页面显示"发送邮件"按钮
- 每次发送邮件都会消耗您的EmailJS配额
- 定期检查EmailJS仪表板监控用量情况

## 使用方法

1. 访问网站首页，浏览最新论文
2. 在设置页面配置OpenAI API密钥和EmailJS设置（可选）
3. 在订阅页面输入邮箱和感兴趣的关键词
4. 选择感兴趣的论文分类
5. 提交订阅，系统会将保存您的订阅信息
6. 在"我的订阅"页面可以查看匹配的论文

## 隐私说明

- 所有配置和订阅信息仅保存在浏览器本地存储中
- OpenAI API密钥仅用于增强论文匹配，不会被发送到任何第三方服务器
- 邮件发送功能使用您提供的服务，系统不会收集或存储任何个人信息

## 数据来源

本系统使用的所有论文数据均来自[arXiv.org](https://arxiv.org)，这是一个由康奈尔大学运营的开放获取学术预印本存储库。

## 许可证

MIT 