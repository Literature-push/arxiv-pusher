import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Badge, Alert, Row, Col, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { getUserSubscriptions, deleteUserSubscription } from '../services/localData';
import { testKeywordMatch } from '../services/api';
import { sendPapersEmail } from '../services/emailService';
import { addPapersToHistory } from '../services/localData';
import { isConfigured } from '../services/localData';
import './MySubscriptions.css';

function MySubscriptions() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState({});
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('');
  const [configured, setConfigured] = useState(false);

  useEffect(() => {
    loadSubscriptions();
    setConfigured(isConfigured());
  }, []);

  const loadSubscriptions = () => {
    const subs = getUserSubscriptions();
    setSubscriptions(subs);
  };

  const handleDelete = (id) => {
    if (window.confirm('确定要删除这个订阅吗？')) {
      const success = deleteUserSubscription(id);
      if (success) {
        setMessage('订阅已删除');
        setMessageType('success');
        loadSubscriptions();
      } else {
        setMessage('删除订阅失败');
        setMessageType('danger');
      }
    }
  };

  const handleRefresh = async (subscription) => {
    if (!configured) {
      setMessage('请先在设置页面配置您的API密钥和邮箱信息！');
      setMessageType('warning');
      return;
    }
    
    setRefreshing({ ...refreshing, [subscription.id]: true });
    setMessage(null);
    
    try {
      // 遍历所有分类，查找匹配的论文
      let allMatchedPapers = [];
      
      for (const category of subscription.categories) {
        const matchedPapers = await testKeywordMatch(
          subscription.keywords, 
          true,  // 使用OpenAI
          category
        );
        allMatchedPapers = [...allMatchedPapers, ...matchedPapers];
      }
      
      if (allMatchedPapers.length === 0) {
        setMessage(`没有找到与"${subscription.email}"订阅匹配的新论文`);
        setMessageType('info');
      } else {
        // 发送邮件
        const sent = await sendPapersEmail(subscription.email, allMatchedPapers);
        
        // 添加到历史记录
        addPapersToHistory(subscription.email, allMatchedPapers);
        
        if (sent) {
          setMessage(`已找到${allMatchedPapers.length}篇匹配的论文并发送到"${subscription.email}"`);
          setMessageType('success');
        } else {
          setMessage(`已找到${allMatchedPapers.length}篇匹配的论文，但邮件发送失败`);
          setMessageType('warning');
        }
      }
    } catch (error) {
      console.error('Error refreshing subscription:', error);
      setMessage(`刷新订阅失败: ${error.message}`);
      setMessageType('danger');
    } finally {
      setRefreshing({ ...refreshing, [subscription.id]: false });
    }
  };

  const handleRefreshAll = async () => {
    if (!configured) {
      setMessage('请先在设置页面配置您的API密钥和邮箱信息！');
      setMessageType('warning');
      return;
    }
    
    if (subscriptions.length === 0) {
      setMessage('没有订阅可以刷新');
      setMessageType('info');
      return;
    }
    
    setLoading(true);
    setMessage('正在刷新所有订阅，这可能需要一些时间...');
    setMessageType('info');
    
    let successCount = 0;
    let totalPapers = 0;
    
    for (const subscription of subscriptions) {
      try {
        // 遍历所有分类，查找匹配的论文
        let matchedPapers = [];
        
        for (const category of subscription.categories) {
          const papers = await testKeywordMatch(
            subscription.keywords, 
            true,  // 使用OpenAI
            category
          );
          matchedPapers = [...matchedPapers, ...papers];
        }
        
        if (matchedPapers.length > 0) {
          // 发送邮件
          await sendPapersEmail(subscription.email, matchedPapers);
          
          // 添加到历史记录
          addPapersToHistory(subscription.email, matchedPapers);
          
          successCount++;
          totalPapers += matchedPapers.length;
        }
      } catch (error) {
        console.error(`Error refreshing subscription for ${subscription.email}:`, error);
      }
    }
    
    setLoading(false);
    
    if (successCount > 0) {
      setMessage(`成功刷新了${successCount}个订阅，共找到${totalPapers}篇匹配的论文`);
      setMessageType('success');
    } else {
      setMessage('没有找到与任何订阅匹配的新论文');
      setMessageType('info');
    }
  };

  return (
    <Container className="my-subscriptions-container">
      <h1 className="text-center mb-4">我的订阅</h1>
      
      {message && (
        <Alert variant={messageType} onClose={() => setMessage(null)} dismissible>
          {message}
        </Alert>
      )}
      
      {!configured && (
        <Alert variant="warning">
          您尚未配置API密钥和邮箱设置。请先前往
          <Link to="/settings" className="alert-link mx-1">设置页面</Link>
          完成配置，以便能够接收论文更新。
        </Alert>
      )}
      
      <div className="d-flex justify-content-between mb-4">
        <Button 
          variant="primary" 
          as={Link} 
          to="/subscribe"
        >
          添加新订阅
        </Button>
        
        <Button 
          variant="success" 
          onClick={handleRefreshAll}
          disabled={loading || subscriptions.length === 0}
        >
          {loading ? (
            <>
              <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
              <span className="ms-2">正在刷新...</span>
            </>
          ) : '刷新所有订阅'}
        </Button>
      </div>
      
      {subscriptions.length === 0 ? (
        <div className="text-center p-5 bg-light rounded">
          <h3>您还没有任何订阅</h3>
          <p>点击"添加新订阅"开始接收论文更新</p>
          <Button variant="primary" as={Link} to="/subscribe" className="mt-3">
            添加新订阅
          </Button>
        </div>
      ) : (
        <Row>
          {subscriptions.map(subscription => (
            <Col md={6} key={subscription.id} className="mb-4">
              <Card className="subscription-card">
                <Card.Header>
                  <h5 className="mb-0">{subscription.email}</h5>
                </Card.Header>
                <Card.Body>
                  <div className="mb-3">
                    <h6>关键词:</h6>
                    <div>
                      {subscription.keywords.map((keyword, index) => (
                        <Badge bg="primary" key={index} className="me-1 mb-1">{keyword}</Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <h6>分类:</h6>
                    <div>
                      {subscription.categories.map((category, index) => (
                        <Badge bg="info" key={index} className="me-1 mb-1">
                          {category === 'cs' ? 'Computer Science' : 
                           category === 'math' ? 'Mathematics' : 
                           category === 'physics' ? 'Physics' : 
                           category === 'q-bio' ? 'Quantitative Biology' : 
                           category === 'stat' ? 'Statistics' : category}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mt-3 d-flex justify-content-between">
                    <Button 
                      variant="outline-danger" 
                      size="sm"
                      onClick={() => handleDelete(subscription.id)}
                    >
                      删除
                    </Button>
                    
                    <Button 
                      variant="outline-primary" 
                      size="sm"
                      onClick={() => handleRefresh(subscription)}
                      disabled={refreshing[subscription.id]}
                    >
                      {refreshing[subscription.id] ? (
                        <>
                          <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                          <span className="ms-2">刷新中...</span>
                        </>
                      ) : '立即刷新'}
                    </Button>
                  </div>
                </Card.Body>
                <Card.Footer className="text-muted">
                  创建于 {new Date(subscription.created).toLocaleDateString()}
                </Card.Footer>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
}

export default MySubscriptions; 