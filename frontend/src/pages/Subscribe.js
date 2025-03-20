import React, { useState, useEffect } from 'react';
import { fetchCategories, subscribeUser, testKeywordMatch } from '../services/api';
import { isConfigured } from '../services/localData';
import { Link } from 'react-router-dom';
import { Alert } from 'react-bootstrap';
import './Subscribe.css';

function Subscribe() {
  const [email, setEmail] = useState('');
  const [keywords, setKeywords] = useState('');
  const [selectedCategories, setSelectedCategories] = useState(['cs']);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('');
  const [testResults, setTestResults] = useState([]);
  const [showTestResults, setShowTestResults] = useState(false);
  const [useOpenAI, setUseOpenAI] = useState(true);
  const [configured, setConfigured] = useState(false);

  useEffect(() => {
    // 获取分类列表
    const getCategories = async () => {
      try {
        const data = await fetchCategories();
        setCategories(data);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    
    getCategories();
    
    // 检查是否已配置API密钥和邮箱
    setConfigured(isConfigured());
  }, []);

  const handleCategoryChange = (categoryId) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !keywords) {
      setMessage('请填写所有必填字段');
      setMessageType('error');
      return;
    }
    
    if (selectedCategories.length === 0) {
      setMessage('请至少选择一个论文分类');
      setMessageType('error');
      return;
    }
    
    const keywordsList = keywords
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0);
    
    if (keywordsList.length === 0) {
      setMessage('请输入有效的关键词');
      setMessageType('error');
      return;
    }
    
    setLoading(true);
    try {
      await subscribeUser(email, keywordsList, selectedCategories);
      setMessage('订阅成功！您将收到匹配关键词的论文推送');
      setMessageType('success');
      
      // 清空表单
      setEmail('');
      setKeywords('');
      setSelectedCategories(['cs']);
    } catch (err) {
      console.error('Subscription error:', err);
      setMessage(err.message || '订阅失败，请稍后再试');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleTestKeywords = async () => {
    if (!keywords) {
      setMessage('请输入关键词进行测试');
      setMessageType('error');
      return;
    }
    
    if (useOpenAI && !configured) {
      setMessage('使用AI增强匹配需要先配置OpenAI API密钥，请前往设置页面进行配置');
      setMessageType('error');
      return;
    }
    
    const keywordsList = keywords
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0);
    
    setLoading(true);
    try {
      const response = await testKeywordMatch(keywordsList, useOpenAI);
      setTestResults(response);
      setShowTestResults(true);
      setMessage('关键词测试成功');
      setMessageType('success');
    } catch (err) {
      console.error('Keyword test error:', err);
      setMessage(err.message || '关键词测试失败，请稍后再试');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="subscribe-page">
      <h1>订阅论文推送</h1>
      
      {message && (
        <div className={`message ${messageType}`}>
          {message}
        </div>
      )}
      
      {useOpenAI && !configured && (
        <Alert variant="warning" className="mb-4">
          您尚未配置OpenAI API密钥和邮箱设置。使用AI增强匹配和接收邮件通知需要先
          <Link to="/settings" className="alert-link mx-1">前往设置页面</Link>
          完成配置。
        </Alert>
      )}
      
      <div className="subscribe-container">
        <div className="subscribe-form-container">
          <form onSubmit={handleSubmit} className="subscribe-form">
            <div className="form-group">
              <label htmlFor="email">邮箱地址 *</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="keywords">关键词 *</label>
              <textarea
                id="keywords"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="输入关键词，用逗号分隔，如：机器学习, 神经网络, 深度学习"
                required
              />
              <small>多个关键词请用逗号分隔</small>
            </div>
            
            <div className="form-group">
              <label>论文分类 *</label>
              <div className="categories-container">
                {categories.map(category => (
                  <div key={category.id} className="category-checkbox">
                    <input
                      type="checkbox"
                      id={`category-${category.id}`}
                      checked={selectedCategories.includes(category.id)}
                      onChange={() => handleCategoryChange(category.id)}
                    />
                    <label htmlFor={`category-${category.id}`}>{category.name}</label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="form-group">
              <div className="ai-option">
                <input
                  type="checkbox"
                  id="use-openai"
                  checked={useOpenAI}
                  onChange={() => setUseOpenAI(!useOpenAI)}
                />
                <label htmlFor="use-openai">使用AI增强匹配（更准确但可能较慢）</label>
              </div>
            </div>
            
            <div className="form-actions">
              <button 
                type="button" 
                onClick={handleTestKeywords}
                disabled={loading}
                className="btn btn-secondary"
              >
                测试关键词
              </button>
              <button 
                type="submit" 
                disabled={loading}
                className="btn btn-primary"
              >
                {loading ? '处理中...' : '订阅'}
              </button>
            </div>
          </form>
        </div>
        
        {showTestResults && (
          <div className="test-results-container">
            <h2>关键词测试结果</h2>
            {testResults.length === 0 ? (
              <p>没有找到匹配的论文，请尝试其他关键词</p>
            ) : (
              <>
                <p>找到 {testResults.length} 篇匹配的论文：</p>
                <div className="test-papers-list">
                  {testResults.map((paper, index) => (
                    <div key={index} className="test-paper-item">
                      <h3>{paper.title}</h3>
                      <p className="paper-authors">作者: {Array.isArray(paper.authors) ? paper.authors.join(', ') : paper.authors}</p>
                      <p className="paper-summary">
                        {paper.summary.substring(0, 200)}...
                      </p>
                      <p className="paper-matched-keywords">
                        匹配关键词: {paper.matched_keywords.join(', ')}
                      </p>
                      <a 
                        href={paper.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="paper-link"
                      >
                        查看原文
                      </a>
                    </div>
                  ))}
                </div>
              </>
            )}
            <button 
              onClick={() => setShowTestResults(false)}
              className="btn btn-secondary"
            >
              关闭测试结果
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Subscribe; 