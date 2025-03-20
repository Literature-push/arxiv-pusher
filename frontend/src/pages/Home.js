import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

function Home() {
  return (
    <div className="home">
      <div className="hero">
        <h1>arXiv文献推送系统</h1>
        <p>获取最新学术论文，根据您的兴趣自动推送</p>
        <div className="home-buttons">
          <Link to="/papers" className="btn btn-primary">
            浏览最新论文
          </Link>
          <Link to="/subscribe" className="btn btn-success">
            订阅关键词
          </Link>
          <Link to="/my-subscriptions" className="btn btn-warning">
            管理我的订阅
          </Link>
          <Link to="/settings" className="btn btn-info">
            系统设置
          </Link>
        </div>
      </div>

      <div className="features">
        <div className="feature-card">
          <h3>实时更新</h3>
          <p>每日自动从arXiv获取最新论文</p>
        </div>
        <div className="feature-card">
          <h3>智能匹配</h3>
          <p>基于关键词分析，推送符合您兴趣的论文</p>
        </div>
        <div className="feature-card">
          <h3>完全免费</h3>
          <p>所有功能完全免费，无需付费</p>
        </div>
      </div>

      <div className="how-it-works">
        <h2>工作原理</h2>
        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <h3>订阅关键词</h3>
            <p>输入您感兴趣的研究领域关键词</p>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <h3>智能分析</h3>
            <p>系统自动分析最新论文与您的关键词匹配度</p>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <h3>定期推送</h3>
            <p>匹配的论文将通过邮件推送给您</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home; 