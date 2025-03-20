/**
 * localData.js - 管理存储在本地的用户数据
 */

// 获取用户订阅信息
export const getUserSubscriptions = () => {
  try {
    const subscriptions = localStorage.getItem('user_subscriptions');
    return subscriptions ? JSON.parse(subscriptions) : [];
  } catch (error) {
    console.error('Failed to get user subscriptions:', error);
    return [];
  }
};

// 保存用户订阅
export const saveUserSubscription = (subscription) => {
  try {
    let subscriptions = getUserSubscriptions();
    
    // 查找是否已存在相同邮箱的订阅
    const existingIndex = subscriptions.findIndex(sub => sub.email === subscription.email);
    
    if (existingIndex >= 0) {
      // 合并关键词和分类
      const existing = subscriptions[existingIndex];
      const allKeywords = [...new Set([...existing.keywords, ...subscription.keywords])];
      const allCategories = [...new Set([...existing.categories, ...subscription.categories])];
      
      subscriptions[existingIndex] = {
        ...existing,
        keywords: allKeywords,
        categories: allCategories,
        lastUpdated: new Date().toISOString()
      };
    } else {
      // 添加新订阅
      subscriptions.push({
        ...subscription,
        id: Date.now().toString(),
        created: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      });
    }
    
    localStorage.setItem('user_subscriptions', JSON.stringify(subscriptions));
    return true;
  } catch (error) {
    console.error('Failed to save user subscription:', error);
    return false;
  }
};

// 删除用户订阅
export const deleteUserSubscription = (subscriptionId) => {
  try {
    let subscriptions = getUserSubscriptions();
    subscriptions = subscriptions.filter(sub => sub.id !== subscriptionId);
    localStorage.setItem('user_subscriptions', JSON.stringify(subscriptions));
    return true;
  } catch (error) {
    console.error('Failed to delete user subscription:', error);
    return false;
  }
};

// 获取论文历史记录
export const getPaperHistory = () => {
  try {
    const history = localStorage.getItem('paper_history');
    return history ? JSON.parse(history) : {};
  } catch (error) {
    console.error('Failed to get paper history:', error);
    return {};
  }
};

// 添加论文到历史记录
export const addPapersToHistory = (email, papers) => {
  try {
    let history = getPaperHistory();
    
    if (!history[email]) {
      history[email] = [];
    }
    
    // 添加新论文链接到历史记录
    const paperLinks = papers.map(paper => paper.link);
    history[email] = [...new Set([...history[email], ...paperLinks])];
    
    localStorage.setItem('paper_history', JSON.stringify(history));
    return true;
  } catch (error) {
    console.error('Failed to add papers to history:', error);
    return false;
  }
};

// 检查论文是否已在历史记录中
export const isPaperInHistory = (email, paperLink) => {
  try {
    const history = getPaperHistory();
    return history[email] && history[email].includes(paperLink);
  } catch (error) {
    console.error('Failed to check paper history:', error);
    return false;
  }
};

// 获取OpenAI API密钥
export const getOpenAIKey = () => {
  return localStorage.getItem('openai_api_key') || '';
};

// 获取邮箱设置
export const getEmailSettings = () => {
  try {
    const settings = localStorage.getItem('email_settings');
    return settings ? JSON.parse(settings) : null;
  } catch (error) {
    console.error('Failed to get email settings:', error);
    return null;
  }
};

// 检查用户是否已完成设置
export const isConfigured = () => {
  const openaiKey = getOpenAIKey();
  const emailSettings = getEmailSettings();
  
  return Boolean(openaiKey && emailSettings && emailSettings.email && emailSettings.password);
}; 