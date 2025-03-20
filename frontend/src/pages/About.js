import React from 'react';
import './About.css';

function About() {
  return (
    <div className="about-page">
      <h1>关于arXiv文献推送系统</h1>
      
      <section className="about-section">
        <h2>项目简介</h2>
        <p>
          arXiv文献推送系统是一个免费的学术论文推送服务，旨在帮助研究人员、学生和学者及时获取最新的学术研究成果。
          系统自动从arXiv.org获取最新论文，并根据用户设置的关键词进行智能匹配，将相关论文推送给用户。
        </p>
      </section>
      
      <section className="about-section">
        <h2>数据来源</h2>
        <p>
          本系统使用的所有论文数据均来自<a href="https://arxiv.org" target="_blank" rel="noopener noreferrer">arXiv.org</a>，
          这是一个由康奈尔大学运营的开放获取学术预印本存储库，包含物理学、数学、计算机科学、生物学等多个领域的学术论文。
        </p>
        <p>
          我们通过arXiv提供的公开API获取数据，并遵循其使用条款。本系统不存储完整论文，仅提供论文的基本信息和链接。
        </p>
      </section>
      
      <section className="about-section">
        <h2>技术实现</h2>
        <p>
          本系统采用现代Web技术构建：
        </p>
        <ul>
          <li>前端：React.js</li>
          <li>后端：Python Flask</li>
          <li>数据处理：NLTK自然语言处理</li>
          <li>定时任务：Python Schedule</li>
        </ul>
        <p>
          系统完全开源，代码可在GitHub上获取。
        </p>
      </section>
      
      <section className="about-section">
        <h2>隐私声明</h2>
        <p>
          我们非常重视用户隐私。本系统仅收集用户提供的邮箱地址和关键词，用于论文推送服务。
          我们不会将用户数据用于其他目的，也不会与任何第三方共享。
        </p>
      </section>
      
      <section className="about-section">
        <h2>联系我们</h2>
        <p>
          如有任何问题、建议或反馈，请发送邮件至：<a href="mailto:contact@example.com">contact@example.com</a>
        </p>
      </section>
    </div>
  );
}

export default About; 