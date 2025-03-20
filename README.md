# arXiv文献推送系统

这是一个基于arXiv API的学术论文推送系统，可以自动获取最新论文并根据用户设置的关键词进行匹配推送。

## 功能特点

- 自动从arXiv获取最新论文
- 基于关键词的智能匹配
- 用户订阅和推送系统
- 完全免费，无需付费

## 技术栈

- 前端：React.js
- 后端：Python Flask
- 数据处理：NLTK自然语言处理
- 定时任务：Python Schedule

## 项目结构

```
文献推送网站/
├── .gitignore               # Git忽略文件
├── frontend/                # React前端
│   ├── public/              # 静态资源
│   ├── src/                 # 源代码
│   │   ├── components/      # React组件
│   │   ├── pages/           # 页面组件
│   │   ├── services/        # API服务
│   │   ├── App.js           # 主应用组件
│   │   └── index.js         # 入口文件
│   └── package.json         # 依赖配置
├── backend/                 # Python后端
│   ├── app.py               # 主应用入口
│   ├── arxiv_fetcher.py     # arXiv数据获取
│   ├── keyword_analyzer.py  # 关键词分析
│   ├── user_manager.py      # 用户管理
│   ├── scheduler.py         # 定时任务
│   ├── requirements.txt     # 依赖项
│   └── data/                # 数据存储
└── README.md                # 项目说明
```

## 安装与运行

### 后端

1. 进入后端目录
   ```
   cd 文献推送网站/backend
   ```

2. 安装依赖
   ```
   pip install -r requirements.txt
   ```

3. 运行后端服务
   ```
   python app.py
   ```

### 前端

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

## 使用方法

1. 访问网站首页
2. 浏览最新论文或进入订阅页面
3. 输入邮箱和感兴趣的关键词
4. 选择感兴趣的论文分类
5. 提交订阅
6. 系统会定期检查新论文并根据关键词匹配推送

## 数据来源

本系统使用的所有论文数据均来自[arXiv.org](https://arxiv.org)，这是一个由康奈尔大学运营的开放获取学术预印本存储库。

## 许可证

MIT 