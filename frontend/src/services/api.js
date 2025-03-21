// API服务，处理与后端的通信，以及直接调用外部API

// 当部署到GitHub Pages时，不再需要后端服务
// const API_BASE_URL = 'http://localhost:5001/api';
// 直接调用外部API

import { getOpenAIKey } from './localData';
import axios from 'axios';

const ARXIV_API_BASE = 'https://export.arxiv.org/api/query';
// 使用更可靠的CORS代理，按优先级尝试
const CORS_PROXIES = [
  'https://api.codetabs.com/v1/proxy?quest=',
  'https://corsproxy.io/?',
  'https://proxy.cors.sh/',
  'https://cors-proxy.htmldriven.com/?url='
];

// 当前使用的代理索引
let currentProxyIndex = 0;

/**
 * 获取当前CORS代理URL
 * @returns {string}
 */
const getCurrentProxy = () => {
  return CORS_PROXIES[currentProxyIndex];
};

/**
 * 切换到下一个CORS代理
 */
const switchToNextProxy = () => {
  currentProxyIndex = (currentProxyIndex + 1) % CORS_PROXIES.length;
  console.log(`切换到下一个CORS代理: ${getCurrentProxy()}`);
  return getCurrentProxy();
};

/**
 * 从arXiv API获取最新论文列表
 * @param {string} category - 论文分类
 * @returns {Promise<Array>} - 论文列表
 */
export const fetchPapers = async (category = 'cs') => {
  try {
    // 尝试从本地存储获取缓存的论文
    const cachedData = localStorage.getItem(`papers_${category}`);
    if (cachedData) {
      const parsed = JSON.parse(cachedData);
      // 如果缓存不超过1小时，直接使用缓存数据
      if (Date.now() - parsed.timestamp < 3600000) {
        console.log(`使用缓存的${category}分类论文数据`);
        return parsed.data;
      }
    }

    // 构建arXiv API查询
    const params = {
      search_query: `cat:${category === 'cs' ? 'cs.AI' : category}`,
      sortBy: 'submittedDate',
      sortOrder: 'descending',
      max_results: 30
    };
    
    const queryParams = new URLSearchParams(params).toString();
    const arxivApiUrl = `${ARXIV_API_BASE}?${queryParams}`;
    
    // 尝试所有可用的代理
    let papers = null;
    let lastError = null;
    
    // 循环尝试所有代理
    for (let attempt = 0; attempt < CORS_PROXIES.length * 2; attempt++) {
      try {
        const proxyUrl = `${getCurrentProxy()}${encodeURIComponent(arxivApiUrl)}`;
        console.log(`正在尝试通过代理获取论文: ${proxyUrl}`);
        
        const response = await axios({
          method: 'get',
          url: proxyUrl,
          timeout: 15000, // 15秒超时
          headers: {}
        });
        
        // 检查响应内容
        if (!response.data || typeof response.data !== 'string') {
          console.warn('无效的API响应格式', response.data);
          switchToNextProxy();
          continue;
        }
        
        // 解析XML响应
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(response.data, "text/xml");
        
        // 检查是否有解析错误
        const parserError = xmlDoc.querySelector('parsererror');
        if (parserError) {
          console.warn('XML解析错误', parserError);
          switchToNextProxy();
          continue;
        }
        
        const entries = xmlDoc.getElementsByTagName("entry");
        
        if (!entries || entries.length === 0) {
          console.warn('响应中未找到论文条目');
          switchToNextProxy();
          continue;
        }
        
        papers = Array.from(entries).map(entry => {
          try {
            // 提取标题
            const title = entry.getElementsByTagName("title")[0]?.textContent.trim() || "无标题";
            
            // 提取作者
            const authorElements = entry.getElementsByTagName("author");
            const authors = Array.from(authorElements).map(
              author => author.getElementsByTagName("name")[0]?.textContent || "未知作者"
            );
            
            // 提取发布日期
            const published = entry.getElementsByTagName("published")[0]?.textContent || new Date().toISOString();
            
            // 提取摘要
            const summary = entry.getElementsByTagName("summary")[0]?.textContent.trim() || "无摘要";
            
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
          } catch (err) {
            console.error('解析论文条目时出错:', err);
            return null;
          }
        }).filter(Boolean); // 过滤掉解析失败的条目
        
        if (papers.length === 0) {
          console.warn('未能解析任何论文条目');
          switchToNextProxy();
          continue;
        }
        
        // 成功获取论文，保存到本地存储
        localStorage.setItem(`papers_${category}`, JSON.stringify({
          timestamp: Date.now(),
          data: papers
        }));
        
        return papers;
      } catch (error) {
        lastError = error;
        console.warn(`通过代理 ${getCurrentProxy()} 获取论文失败:`, error);
        
        // 切换到下一个代理
        switchToNextProxy();
        
        // 延迟一秒后重试
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // 所有代理都失败了，返回错误或缓存
    throw new Error(lastError || '所有CORS代理都失败了');
    
  } catch (error) {
    console.error('从arXiv获取论文时出错:', error);
    
    // 如果请求失败，尝试从本地存储获取
    const cachedData = localStorage.getItem(`papers_${category}`);
    if (cachedData) {
      const { data } = JSON.parse(cachedData);
      console.log(`使用缓存的${category}分类论文数据（API请求失败）`);
      return data;
    }
    
    // 返回示例数据而不是抛出错误，以避免UI崩溃
    return [
      {
        title: "示例论文 - 无法从arXiv获取数据",
        authors: ["示例作者"],
        published: new Date().toISOString(),
        summary: "由于CORS或网络问题，无法从arXiv获取数据。请尝试稍后刷新页面，或检查网络连接。",
        link: "https://arxiv.org",
        categories: [category],
        matched_keywords: []
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
  console.log('Starting email notification process...');
  
  try {
    // 验证收件人邮箱
    if (!to || typeof to !== 'string' || !to.includes('@')) {
      console.error('Invalid recipient email:', to);
      throw new Error('收件人邮箱无效');
    }
    
    const emailSettings = localStorage.getItem('email_settings');
    if (!emailSettings) {
      console.error('Email settings not found');
      throw new Error('邮箱设置未配置');
    }
    
    const settings = JSON.parse(emailSettings);
    console.log('Email settings loaded:', settings);
    
    if (!settings.emailjsId || !settings.serviceId || !settings.templateId) {
      console.error('Incomplete email settings:', settings);
      throw new Error('邮箱设置不完整，请确保已配置所有必要参数');
    }
    
    if (!window.emailjs) {
      console.error('EmailJS not loaded');
      throw new Error('EmailJS未加载，请刷新页面重试');
    }
    
    // 准备论文内容
    const papersHTML = papers.map(paper => `
      <div class="paper">
        <h3 class="paper-title"><a href="${paper.link}" target="_blank">${paper.title}</a></h3>
        <div class="paper-meta">
          <strong>作者:</strong> ${paper.authors.join(', ')}
        </div>
        <div class="paper-meta">
          <strong>发布日期:</strong> ${new Date(paper.published).toLocaleDateString()}
        </div>
        <div class="paper-keywords">
          <strong>匹配关键词:</strong> ${paper.matched_keywords ? paper.matched_keywords.join(', ') : '通用推荐'}
        </div>
        <div class="paper-summary">
          ${paper.summary.substring(0, 200)}...
        </div>
      </div>
    `).join('');
    
    console.log('Sending email to:', to);
    
    // 确保EmailJS已初始化
    try {
      console.log('Initializing EmailJS...');
      window.emailjs.init(settings.emailjsId);
    } catch (err) {
      console.error('EmailJS initialization error:', err);
      // 继续执行，因为可能已经初始化
    }
    
    // 发送参数 - 确保包含多种可能的收件人字段名称，以适应不同的模板设置
    const templateParams = {
      // 必须包含的字段 - 确保模板中的{{to_email}}变量能找到值
      to_email: to,
      // 兼容性字段 - 为可能使用的其他变量名提供值
      email: to,
      recipient: to,
      user_email: to,
      // 其他参数
      to_name: to.split('@')[0],
      from_name: 'arXiv文献推送系统',
      subject: `为您找到了 ${papers.length} 篇相关论文`,
      papers: papersHTML
    };
    
    console.log('EmailJS params:', {
      serviceId: settings.serviceId,
      templateId: settings.templateId,
      emailLength: templateParams.to_email.length,
      recipientFields: ['to_email', 'email', 'recipient', 'user_email'].map(f => `${f}=${templateParams[f]}`).join(', ')
    });
    
    // 对EmailJS进行直接调用，简化参数传递
    // 注意：根据EmailJS的API文档，第4个参数(publicKey)是必需的
    const response = await window.emailjs.send(
      settings.serviceId,
      settings.templateId,
      templateParams,
      settings.emailjsId
    );
    
    console.log('Email sent successfully:', response);
    
    return { 
      success: true, 
      message: '邮件发送成功',
      response
    };
  } catch (error) {
    console.error('EmailJS send error:', error);
    
    // 详细的错误处理和用户友好的消息
    if (error.text && typeof error.text === 'string') {
      // 检查是否是收件人问题
      if (error.text.includes('recipients') || error.text.includes('empty')) {
        throw new Error(`收件人地址错误: "${to}"。请检查您的EmailJS模板，确保在"To Email"字段中使用了{{to_email}}变量而不是其他名称，如{{email}}等。`);
      } else if (error.text.includes('template')) {
        throw new Error(`模板错误: ${error.text}。请检查模板ID是否正确，并确保模板包含必要的变量。`);
      } else if (error.text.includes('service')) {
        throw new Error(`服务错误: ${error.text}。请检查Service ID是否正确。`);
      } else {
        throw new Error(`邮件发送错误: ${error.text}`);
      }
    }
    
    throw new Error(`邮件发送失败: ${error.message || '未知错误'}`);
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