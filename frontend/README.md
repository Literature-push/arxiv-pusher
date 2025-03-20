# arXiv文献推送系统

一个纯前端的arXiv文献推送系统，可以部署在GitHub Pages上，使用用户的本地浏览器存储配置和数据。

## 功能特点

- 浏览最新的arXiv论文
- 订阅感兴趣的关键词和分类
- 使用OpenAI API进行智能匹配
- 通过用户配置的邮箱发送论文更新
- 所有配置和数据都存储在用户本地浏览器中，保护隐私

## 部署指南

### 本地开发

1. 克隆仓库
```bash
git clone https://github.com/your-username/arxiv-pusher.git
cd arxiv-pusher/frontend
```

2. 安装依赖
```bash
npm install
```

3. 启动开发服务器
```bash
npm start
```

### 部署到GitHub Pages

1. 在`package.json`中，将`homepage`字段更新为您的GitHub Pages URL
```json
"homepage": "https://your-username.github.io/arxiv-pusher"
```

2. 部署到GitHub Pages
```bash
npm run deploy
```

## 使用指南

### 初始设置

首次使用前，需要进行以下设置：

1. 在"设置"页面配置您的OpenAI API密钥
2. 在"设置"页面配置您的邮箱设置（如果需要接收邮件通知）

### 订阅论文

1. 在"订阅"页面输入您的邮箱和感兴趣的关键词
2. 选择您感兴趣的论文分类
3. 可以先使用"测试关键词"功能查看匹配效果
4. 点击"订阅"按钮完成订阅

### 管理订阅

1. 在"我的订阅"页面查看所有订阅
2. 可以随时刷新订阅，获取最新匹配论文
3. 也可以删除不再需要的订阅

## 配置EmailJS发送邮件

本系统使用EmailJS实现纯前端发送邮件功能，您需要：

1. 在[EmailJS网站](https://www.emailjs.com/)注册账号
2. 创建一个新的服务，连接您的邮箱
3. 创建两个模板：welcome_template（欢迎邮件）和papers_template（论文更新邮件）
4. 在`src/services/emailService.js`中更新您的EmailJS配置：
```javascript
const EMAILJS_SERVICE_ID = 'your_service_id';
const EMAILJS_WELCOME_TEMPLATE_ID = 'your_welcome_template_id';
const EMAILJS_PAPERS_TEMPLATE_ID = 'your_papers_template_id';
const EMAILJS_USER_ID = 'your_user_id';
```

## 技术栈

- React
- React Router
- React Bootstrap
- EmailJS（邮件发送）
- arXiv API（论文数据）
- OpenAI API（智能匹配）
- GitHub Pages（部署）

## 隐私说明

- 所有用户配置和数据都存储在用户本地浏览器的localStorage中
- 系统不会将用户数据发送到任何服务器（除了必要的API调用）
- 用户的OpenAI API密钥和邮箱密码仅用于API调用，不会被存储在任何其他地方 