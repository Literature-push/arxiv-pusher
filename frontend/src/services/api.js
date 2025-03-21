// API服务，处理与后端的通信，以及直接调用外部API

// 当部署到GitHub Pages时，不再需要后端服务
// const API_BASE_URL = 'http://localhost:5001/api';
// 直接调用外部API

import { getOpenAIKey } from './localData';
import axios from 'axios';

const ARXIV_API_BASE = 'https://export.arxiv.org/api/query';
// 使用更可靠的CORS代理
const CORS_PROXY = 'https://cors.bridged.cc/'; 

/**
 * 从arXiv API获取最新论文列表
 * @param {string} category - 论文分类
 * @returns {Promise<Array>} - 论文列表
 */
export const fetchPapers = async (category = 'cs') => {
  try {
    // 构建arXiv API查询
    const params = {
      search_query: category === 'cs' ? 'cat:cs.*' : `cat:${category}.*`,
      sortBy: 'submittedDate',
      sortOrder: 'descending',
      max_results: 50
    };
    
    // 使用CORS代理访问arXiv API
    // 构建完整URL而不是使用params对象
    const queryParams = new URLSearchParams(params).toString();
    const apiUrl = `${ARXIV_API_BASE}?${queryParams}`;
    const proxyUrl = `${CORS_PROXY}${apiUrl}`;
    
    console.log('Fetching papers from:', proxyUrl);
    
    // 添加超时设置
    const response = await axios({
      method: 'get',
      url: proxyUrl,
      timeout: 15000, // 15秒超时
      headers: {
        'x-requested-with': 'XMLHttpRequest',
        'Accept': 'application/xml',
        'Content-Type': 'application/xml'
      }
    });
    
    // 解析XML响应
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(response.data, "text/xml");
    const entries = xmlDoc.getElementsByTagName("entry");
    
    const papers = Array.from(entries).map(entry => {
      // 提取标题
      const title = entry.getElementsByTagName("title")[0].textContent.trim();
      
      // 提取作者
      const authorElements = entry.getElementsByTagName("author");
      const authors = Array.from(authorElements).map(
        author => author.getElementsByTagName("name")[0].textContent
      );
      
      // 提取发布日期
      const published = entry.getElementsByTagName("published")[0].textContent;
      
      // 提取摘要
      const summary = entry.getElementsByTagName("summary")[0].textContent.trim();
      
      // 提取链接
      const links = entry.getElementsByTagName("link");
      const link = Array.from(links).find(link => link.getAttribute("rel") === "alternate")
        ?.getAttribute("href") || '';
      
      // 提取分类
      const categoryElements = entry.getElementsByTagName("category");
      const categories = Array.from(categoryElements).map(
        cat => cat.getAttribute("term")
      );
      
      return {
        title,
        authors,
        published,
        summary,
        link,
        categories
      };
    });
    
    // 保存到本地存储，以便离线访问
    localStorage.setItem(`papers_${category}`, JSON.stringify({
      timestamp: Date.now(),
      data: papers
    }));
    
    return papers;
  }catch (error) {
    console.error('Error fetching papers from arXiv:', error);
    
    // 如果请求失败，尝试从本地存储获取
    const cachedData = localStorage.getItem(`papers_${category}`);
    if (cachedData) {
      const { data } = JSON.parse(cachedData);
      return data;
    }
    
    // 返回示例数据而不是抛出错误，以避免UI崩溃
    return [
      {
        title: "示例论文 - 无法从arXiv获取数据",
        authors: ["示例作者"],
        published: new Date().toISOString(),
        summary: "由于CORS或网络问题，无法从arXiv获取数据。请检查网络连接或尝试更换代理服务。",
        link: "https://arxiv.org",
        categories: [category]
      }
    ];
  }
};

/**
 * 获取可用的论文分类
 * @returns {Promise<Array>} - 分类列表
 */
export const fetchCategories = async () => {
  // 返回固定的分类列表
  return [
    {"id": "cs", "name": "Computer Science"},
    {"id": "math", "name": "Mathematics"},
    {"id": "physics", "name": "Physics"},
    {"id": "q-bio", "name": "Quantitative Biology"},
    {"id": "stat", "name": "Statistics"}
  ];
};

/**
 * 用户订阅
 * @param {string} email - 用户邮箱
 * @param {Array<string>} keywords - 关键词列表
 * @param {Array<string>} categories - 分类列表
 * @returns {Promise<Object>} - 订阅结果
 */
export const subscribeUser = async (email, keywords, categories) => {
  // 仅保存到本地，不发送到后端
  try {
    const subscription = { email, keywords, categories };
    
    // 使用localData服务保存订阅
    const { saveUserSubscription } = await import('./localData');
    const result = saveUserSubscription(subscription);
    
    if (result) {
      return { message: 'Subscription successful' };
    } else {
      throw new Error('Failed to save subscription');
    }
  } catch (error) {
    console.error('Error subscribing user:', error);
    throw error;
  }
};

/**
 * 使用OpenAI API检查论文与关键词的相关性
 * @param {string} paperText - 论文文本
 * @param {Array<string>} keywords - 关键词列表
 * @returns {Promise<Object>} - 相关性检查结果
 */
export const checkRelevanceWithOpenAI = async (paperText, keywords) => {
  const apiKey = getOpenAIKey();
  if (!apiKey) {
    console.log('OpenAI API密钥未设置，使用简单关键词匹配');
    // 使用简单的关键词匹配
    const matches = keywords.filter(keyword => 
      paperText.toLowerCase().includes(keyword.toLowerCase())
    );
    return {
      isRelevant: matches.length > 0,
      matchedKeywords: matches,
      score: matches.length > 0 ? 0.7 : 0,
      explanation: matches.length > 0 
        ? `找到${matches.length}个匹配关键词` 
        : '未找到匹配关键词'
    };
  }
  
  try {
    // 将用户关键词转换为逗号分隔的字符串
    const keywordsStr = keywords.join(', ');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that determines if an academic paper is relevant to a user's research interests based on keywords."
          },
          {
            role: "user",
            content: `Determine if this paper is relevant to a researcher interested in these keywords: ${keywordsStr}\n\nPaper text:\n${paperText}\n\nRespond with a JSON object containing: 1) 'relevant': a boolean indicating if the paper is relevant, 2) 'score': a relevance score between 0 and 1, 3) 'matched_keywords': a list of the user's keywords that match the paper, and 4) 'explanation': a brief explanation of why the paper is or isn't relevant.`
          }
        ],
        temperature: 0.3,
        response_format: {"type": "json_object"}
      })
    });
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }
    
    const result = await response.json();
    const content = result.choices[0].message.content;
    const relevanceData = JSON.parse(content);
    
    return {
      isRelevant: relevanceData.relevant || (relevanceData.score >= 0.7),
      matchedKeywords: relevanceData.matched_keywords || [],
      score: relevanceData.score,
      explanation: relevanceData.explanation
    };
  } catch (error) {
    console.error('Error checking relevance with OpenAI:', error);
    // 如果OpenAI API调用失败，使用简单的关键词匹配
    const matches = keywords.filter(keyword => 
      paperText.toLowerCase().includes(keyword.toLowerCase())
    );
    return {
      isRelevant: matches.length > 0,
      matchedKeywords: matches,
      score: matches.length > 0 ? 0.7 : 0,
      explanation: matches.length > 0 
        ? `找到${matches.length}个匹配关键词` 
        : '未找到匹配关键词'
    };
  }
};

/**
 * 测试关键词匹配
 * @param {Array<string>} keywords - 关键词列表
 * @param {boolean} useOpenAI - 是否使用OpenAI增强匹配
 * @param {string} category - 论文分类
 * @returns {Promise<Array>} - 匹配的论文列表
 */
export const testKeywordMatch = async (keywords, useOpenAI = false, category = 'cs') => {
  try {
    // 获取论文
    const papers = await fetchPapers(category);
    
    // 匹配论文
    const matchedPapers = [];
    
    for (const paper of papers) {
      // 提取论文文本
      const paperText = `${paper.title} ${paper.summary}`;
      
      if (useOpenAI && getOpenAIKey()) {
        // 使用OpenAI检查相关性
        const { isRelevant, matchedKeywords } = await checkRelevanceWithOpenAI(paperText, keywords);
        
        if (isRelevant) {
          const paperCopy = { ...paper, matched_keywords: matchedKeywords };
          matchedPapers.push(paperCopy);
        }
      } else {
        // 使用简单的关键词匹配
        const matches = keywords.filter(keyword => 
          paperText.toLowerCase().includes(keyword.toLowerCase())
        );
        
        if (matches.length > 0) {
          const paperCopy = { ...paper, matched_keywords: matches };
          matchedPapers.push(paperCopy);
        }
      }
      
      // 限制处理的论文数量，避免API调用过多
      if (matchedPapers.length >= 10 && useOpenAI && getOpenAIKey()) {
        break;
      }
    }
    
    return matchedPapers;
  } catch (error) {
    console.error('Error testing keywords:', error);
    throw error;
  }
};

/**
 * 设置邮件配置
 * @param {Object} emailConfig - 邮件配置
 * @returns {Promise<Object>} - 设置结果
 */
export const setEmailConfig = async (emailConfig) => {
  try {
    // 存储到本地存储
    localStorage.setItem('email_settings', JSON.stringify(emailConfig));
    return { success: true, message: '邮箱配置已保存' };
  } catch (error) {
    console.error('Error setting email config:', error);
    throw error;
  }
};

/**
 * 发送邮件通知
 * @param {string} to - 接收邮件的邮箱
 * @param {Array} papers - 要发送的论文列表
 * @returns {Promise<Object>} - 发送结果
 */
export const sendEmailNotification = async (to, papers) => {
  try {
    const emailSettings = localStorage.getItem('email_settings');
    if (!emailSettings) {
      throw new Error('邮箱设置未配置');
    }
    
    const settings = JSON.parse(emailSettings);
    const { emailjsId, serviceId, templateId } = settings;
    
    if (!window.emailjs) {
      throw new Error('EmailJS未加载');
    }
    
    // 准备论文内容
    const papersHTML = papers.map(paper => `
      <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #eee; border-radius: 5px;">
        <h3><a href="${paper.link}" target="_blank">${paper.title}</a></h3>
        <p><strong>作者:</strong> ${paper.authors.join(', ')}</p>
        <p><strong>发布日期:</strong> ${new Date(paper.published).toLocaleDateString()}</p>
        <p><strong>匹配关键词:</strong> ${paper.matched_keywords.join(', ')}</p>
        <p>${paper.summary.substring(0, 200)}...</p>
      </div>
    `).join('');
    
    // 发送邮件
    const response = await window.emailjs.send(
      serviceId,
      templateId,
      {
        to_email: to,
        subject: '最新arXiv论文推荐',
        papers: papersHTML
      },
      emailjsId
    );
    
    return { 
      success: true, 
      message: '邮件发送成功',
      response
    };
  } catch (error) {
    console.error('Error sending email notification:', error);
    throw new Error(`邮件发送失败: ${error.message}`);
  }
};

/**
 * 手动触发推荐生成
 * @param {boolean} useOpenAI - 是否使用OpenAI增强匹配
 * @returns {Promise<Object>} - 操作结果
 */
export const generateRecommendations = async (useOpenAI = true) => {
  try {
    // 前端版本中，这个函数只返回成功状态
    // 实际的推荐生成在MySubscriptions页面中进行
    return { success: true, message: '推荐生成功能已迁移到"我的订阅"页面' };
  } catch (error) {
    console.error('Error generating recommendations:', error);
    throw error;
  }
};

/**
 * 手动触发论文更新
 * @returns {Promise<Object>} - 操作结果
 */
export const updatePapers = async () => {
  try {
    // 前端版本中，这个函数直接从arXiv API获取最新论文
    const categories = ['cs', 'math', 'physics', 'q-bio', 'stat'];
    const results = {};
    
    for (const category of categories) {
      try {
        const papers = await fetchPapers(category);
        results[category] = papers.length;
      } catch (err) {
        results[category] = 0;
      }
    }
    
    return { 
      success: true, 
      message: '论文更新完成', 
      counts: results 
    };
  } catch (error) {
    console.error('Error updating papers:', error);
    throw error;
  }
}; 