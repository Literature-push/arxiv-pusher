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

本应用使用EmailJS服务发送邮件通知，这是一个简单的无需后端服务器的邮件发送方案：

1. **注册EmailJS账户**：
   - 访问 [EmailJS官网](https://www.emailjs.com/) 并免费注册账户
   - 免费计划每月可发送200封邮件，无需信用卡

2. **创建邮件服务**：
   - 登录后，点击"Email Services"→"Add New Service"
   - 选择您喜欢的邮件服务提供商（如Gmail）并连接账户

3. **创建邮件模板**：
   - 前往"Email Templates"→"Create New Template"
   - 设计简单的模板，确保包含变量：`{{to_email}}`和`{{papers}}`
   - 模板可以使用简单的HTML代码：
     ```html
     <h2>arXiv论文推荐</h2>
     <p>您好，以下是基于您的兴趣关键词的最新论文:</p>
     <div>{{papers}}</div>
     ```

4. **获取必要信息**：
   - 复制您的Public Key (在Integration页面)
   - 复制您的Service ID (格式如：service_xxxxxxx)
   - 复制您的Template ID (格式如：template_xxxxxxx)

5. **在arXiv推送系统中配置**：
   - 前往"设置"页面的"EmailJS设置"部分
   - 输入上面获取的三个ID
   - 点击"保存邮箱设置"

完成以上步骤后，您就可以在"我的订阅"页面发送邮件通知了。

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