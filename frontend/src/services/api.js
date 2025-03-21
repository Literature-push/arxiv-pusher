// API服务，处理与后端的通信，以及直接调用外部API

// 当部署到GitHub Pages时，不再需要后端服务
// const API_BASE_URL = 'http://localhost:5001/api';
// 直接调用外部API

import { getOpenAIKey } from './localData';
import axios from 'axios';

const ARXIV_API_BASE = 'https://export.arxiv.org/api/query';
const CORS_PROXY = 'https://api.allorigins.win/raw?url='; // 使用CORS代理

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
    const response = await axios.get(`${CORS_PROXY}${encodeURIComponent(`${ARXIV_API_BASE}?${new URLSearchParams(params)}`)}`);    
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
    throw new Error('OpenAI API密钥未设置');
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
        ? `Found ${matches.length} matching keywords` 
        : 'No matching keywords found'
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
export const testKeywordMatch = async (keywords, useOpenAI = true, category = 'cs') => {
  try {
    // 获取论文
    const papers = await fetchPapers(category);
    
    // 匹配论文
    const matchedPapers = [];
    
    for (const paper of papers) {
      // 提取论文文本
      const paperText = `${paper.title} ${paper.summary}`;
      
      if (useOpenAI) {
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
      if (matchedPapers.length >= 10 && useOpenAI) {
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
 * @param {string} email - 发送邮件的邮箱
 * @param {string} password - 邮箱密码或应用密码
 * @returns {Promise<Object>} - 设置结果
 */
export const setEmailConfig = async (email, password) => {
  try {
    // 存储到本地存储
    localStorage.setItem('email_settings', JSON.stringify({ email, password }));
    return { success: true, message: '邮箱配置已保存' };
  } catch (error) {
    console.error('Error setting email config:', error);
    throw error;
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