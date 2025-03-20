/**
 * emailService.js - 前端发送电子邮件的服务
 * 使用EmailJS来实现纯前端的邮件发送
 */

import { getEmailSettings } from './localData';

// 使用EmailJS的服务ID和模板ID
// 注意：这些ID需要您在EmailJS网站上创建
const EMAILJS_SERVICE_ID = 'default_service';
const EMAILJS_WELCOME_TEMPLATE_ID = 'welcome_template';
const EMAILJS_PAPERS_TEMPLATE_ID = 'papers_template';
const EMAILJS_USER_ID = 'YOUR_EMAILJS_USER_ID'; // 需要替换为您的EmailJS用户ID

/**
 * 加载EmailJS脚本
 * @returns {Promise} - 脚本加载完成的Promise
 */
const loadEmailJSScript = () => {
  return new Promise((resolve, reject) => {
    if (window.emailjs) {
      resolve();
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js';
    script.async = true;
    
    script.onload = () => {
      window.emailjs.init(EMAILJS_USER_ID);
      resolve();
    };
    
    script.onerror = (error) => {
      reject(new Error('Failed to load EmailJS script'));
    };
    
    document.body.appendChild(script);
  });
};

/**
 * 发送欢迎邮件
 * @param {string} email - 收件人邮箱
 * @param {Array<string>} keywords - 关键词列表
 * @param {Array<string>} categories - 分类列表
 * @returns {Promise<boolean>} - 发送结果
 */
export const sendWelcomeEmail = async (email, keywords, categories) => {
  try {
    // 检查用户是否已设置邮箱
    const emailSettings = getEmailSettings();
    if (!emailSettings || !emailSettings.email || !emailSettings.password) {
      console.warn('Email settings not configured. Cannot send welcome email.');
      return false;
    }
    
    // 加载EmailJS脚本
    await loadEmailJSScript();
    
    // 准备模板参数
    const templateParams = {
      to_email: email,
      from_email: emailSettings.email,
      keywords: keywords.join(', '),
      categories: categories.map(c => getCategoryName(c)).join(', '),
      current_year: new Date().getFullYear()
    };
    
    // 发送邮件
    await window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_WELCOME_TEMPLATE_ID, templateParams);
    console.log('Welcome email sent successfully!');
    return true;
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    // 如果发送失败，仍然返回true以便继续流程
    // 用户不一定需要收到邮件才能使用系统
    return true;
  }
};

/**
 * 发送论文更新邮件
 * @param {string} email - 收件人邮箱
 * @param {Array<Object>} papers - 匹配的论文列表
 * @param {boolean} isInitial - 是否为初始推送
 * @returns {Promise<boolean>} - 发送结果
 */
export const sendPapersEmail = async (email, papers, isInitial = false) => {
  try {
    // 检查用户是否已设置邮箱
    const emailSettings = getEmailSettings();
    if (!emailSettings || !emailSettings.email || !emailSettings.password) {
      console.warn('Email settings not configured. Cannot send papers email.');
      return false;
    }
    
    // 如果没有匹配的论文，不发送邮件
    if (!papers || papers.length === 0) {
      console.log('No papers to send.');
      return true;
    }
    
    // 加载EmailJS脚本
    await loadEmailJSScript();
    
    // 准备论文HTML
    const papersHTML = papers.slice(0, 10).map((paper, index) => `
      <div style="margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #eee;">
        <h3>${index + 1}. ${paper.title}</h3>
        <p><strong>作者：</strong>${Array.isArray(paper.authors) ? paper.authors.join(', ') : paper.authors}</p>
        <p><strong>发布日期：</strong>${formatDate(paper.published)}</p>
        <p><strong>匹配关键词：</strong>${paper.matched_keywords.join(', ')}</p>
        <p><strong>摘要：</strong>${truncate(paper.summary, 300)}</p>
        <p><a href="${paper.link}" target="_blank">查看完整论文</a></p>
      </div>
    `).join('');
    
    // 准备模板参数
    const templateParams = {
      to_email: email,
      from_email: emailSettings.email,
      subject: isInitial ? '您的初次文献推荐' : '新的文献推荐',
      papers_count: papers.length,
      papers_html: papersHTML,
      more_count: papers.length > 10 ? papers.length - 10 : 0,
      current_year: new Date().getFullYear()
    };
    
    // 发送邮件
    await window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_PAPERS_TEMPLATE_ID, templateParams);
    console.log('Papers email sent successfully!');
    return true;
  } catch (error) {
    console.error('Failed to send papers email:', error);
    // 如果发送失败，仍然返回true以便继续流程
    return true;
  }
};

/**
 * 获取分类名称
 * @param {string} categoryId - 分类ID
 * @returns {string} - 分类名称
 */
const getCategoryName = (categoryId) => {
  const categoryMap = {
    'cs': 'Computer Science',
    'math': 'Mathematics',
    'physics': 'Physics',
    'q-bio': 'Quantitative Biology',
    'stat': 'Statistics'
  };
  
  return categoryMap[categoryId] || categoryId;
};

/**
 * 截断文本
 * @param {string} text - 文本
 * @param {number} length - 最大长度
 * @returns {string} - 截断后的文本
 */
const truncate = (text, length) => {
  if (!text) return '';
  return text.length > length ? text.substring(0, length) + '...' : text;
};

/**
 * 格式化日期
 * @param {string} dateString - 日期字符串
 * @returns {string} - 格式化后的日期
 */
const formatDate = (dateString) => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  } catch (e) {
    return dateString;
  }
}; 