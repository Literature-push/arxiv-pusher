import React, { useState, useEffect } from 'react';
import { fetchPapers, fetchCategories } from '../services/api';
import './Papers.css';

function Papers() {
  const [papers, setPapers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('cs');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

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
  }, []);

  useEffect(() => {
    // 获取论文列表
    const getPapers = async () => {
      setLoading(true);
      try {
        const data = await fetchPapers(selectedCategory);
        setPapers(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching papers:', err);
        setError('获取论文失败，请稍后再试');
        setPapers([]);
      } finally {
        setLoading(false);
      }
    };
    
    getPapers();
  }, [selectedCategory]);

  // 过滤论文
  const filteredPapers = papers.filter(paper => 
    paper.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    paper.summary.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="papers-page">
      <h1>最新学术论文</h1>
      
      <div className="papers-controls">
        <div className="category-selector">
          <label htmlFor="category">选择分类：</label>
          <select 
            id="category" 
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="search-box">
          <input
            type="text"
            placeholder="搜索论文..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="loading">加载中...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : (
        <div className="papers-list">
          {filteredPapers.length === 0 ? (
            <p>没有找到匹配的论文</p>
          ) : (
            filteredPapers.map((paper, index) => (
              <div key={index} className="paper-card">
                <h3 className="paper-title">{paper.title}</h3>
                <p className="paper-authors">
                  作者: {paper.authors.join(', ')}
                </p>
                <p className="paper-date">
                  发布日期: {new Date(paper.published).toLocaleDateString()}
                </p>
                <p className="paper-summary">
                  {paper.summary.length > 300
                    ? paper.summary.substring(0, 300) + '...'
                    : paper.summary}
                </p>
                <div className="paper-footer">
                  <a 
                    href={paper.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="paper-link"
                  >
                    查看原文
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default Papers; 