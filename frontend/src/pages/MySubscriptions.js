import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Badge, Alert, Row, Col, Spinner, ListGroup } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { getUserSubscriptions, deleteUserSubscription, isPaperInHistory, addPapersToHistory } from '../services/localData';
import { testKeywordMatch, sendEmailNotification } from '../services/api';
import { isConfigured } from '../services/localData';
import './MySubscriptions.css';

function MySubscriptions() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('');
  const [configured, setConfigured] = useState(false);
  const [activeSubscription, setActiveSubscription] = useState(null);
  const [matchedPapers, setMatchedPapers] = useState({});

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
      deleteUserSubscription(id);
      loadSubscriptions();
      setMessage('订阅已删除');
      setMessageType('success');
    }
  };

  const handleRefreshRecommendations = async (subscription) => {
    try {
      setLoading(true);
      setActiveSubscription(subscription.id);
      
      const { email, keywords, categories } = subscription;
      
      // 获取所有分类的匹配论文
      const allMatches = {};
      
      for (const category of categories) {
        setMessage(`正在获取 ${category} 分类的论文...`);
        setMessageType('info');
        
        // 使用简单匹配，默认不使用OpenAI
        const matches = await testKeywordMatch(keywords, false, category);
        
        // 过滤掉历史上已发送过的论文
        const newMatches = matches.filter(paper => !isPaperInHistory(email, paper.link));
        
        if (newMatches.length > 0) {
          allMatches[category] = newMatches;
        }
      }
      
      setMatchedPapers({
        ...matchedPapers,
        [subscription.id]: allMatches
      });
      
      setMessage('推荐刷新完成');
      setMessageType('success');
    } catch (error) {
      console.error('Error refreshing recommendations:', error);
      setMessage(`刷新推荐失败: ${error.message}`);
      setMessageType('danger');
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async (subscription) => {
    try {
      const { email } = subscription;
      const papers = [];
      
      // 收集所有分类的论文
      const subPapers = matchedPapers[subscription.id];
      if (!subPapers) {
        throw new Error('没有找到匹配的论文，请先刷新推荐');
      }
      
      Object.values(subPapers).forEach(categoryPapers => {
        papers.push(...categoryPapers);
      });
      
      if (papers.length === 0) {
        throw new Error('没有找到新的匹配论文');
      }
      
      // 限制论文数量，避免邮件过大
      const limitedPapers = papers.slice(0, 10);
      
      setMessage('正在发送邮件...');
      setMessageType('info');
      
      // 发送邮件
      await sendEmailNotification(email, limitedPapers);
      
      // 记录已发送的论文
      addPapersToHistory(email, limitedPapers);
      
      setMessage('邮件发送成功');
      setMessageType('success');
    } catch (error) {
      console.error('Error sending email:', error);
      setMessage(`邮件发送失败: ${error.message}`);
      setMessageType('danger');
    }
  };

  return (
    <Container className="my-4">
      <h1>我的订阅</h1>
      
      {message && (
        <Alert variant={messageType} onClose={() => setMessage(null)} dismissible>
          {message}
        </Alert>
      )}
      
      {subscriptions.length === 0 ? (
        <div className="text-center my-5">
          <p>您还没有订阅任何关键词。</p>
          <Link to="/subscribe" className="btn btn-primary">
            添加订阅
          </Link>
        </div>
      ) : (
        subscriptions.map(subscription => (
          <Card key={subscription.id} className="subscription-card mb-4">
            <Card.Header>
              <Row>
                <Col>
                  <h5 className="mb-0">{subscription.email}</h5>
                </Col>
                <Col xs="auto">
                  <Button 
                    variant="outline-danger" 
                    size="sm" 
                    onClick={() => handleDelete(subscription.id)}
                  >
                    删除
                  </Button>
                </Col>
              </Row>
            </Card.Header>
            <Card.Body>
              <Card.Title>关键词</Card.Title>
              <div className="keywords-container mb-3">
                {subscription.keywords.map((keyword, idx) => (
                  <Badge bg="primary" className="me-2 mb-2" key={idx}>
                    {keyword}
                  </Badge>
                ))}
              </div>
              <Card.Title>分类</Card.Title>
              <div className="categories-container mb-3">
                {subscription.categories.map((category, idx) => (
                  <Badge bg="secondary" className="me-2 mb-2" key={idx}>
                    {category}
                  </Badge>
                ))}
              </div>
              <div className="d-flex justify-content-between mt-3">
                <div>
                  <Button 
                    variant="outline-primary" 
                    size="sm"
                    onClick={() => handleRefreshRecommendations(subscription)}
                    disabled={loading && activeSubscription === subscription.id}
                  >
                    {loading && activeSubscription === subscription.id ? (
                      <>
                        <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                        <span className="ms-2">刷新中...</span>
                      </>
                    ) : '刷新推荐'}
                  </Button>
                  
                  <Button 
                    variant="outline-success" 
                    size="sm"
                    className="ms-2"
                    onClick={() => handleSendEmail(subscription)}
                    disabled={!matchedPapers[subscription.id] || (loading && activeSubscription === subscription.id)}
                  >
                    发送邮件
                  </Button>
                </div>
                <small className="text-muted">
                  上次更新: {new Date(subscription.lastUpdated).toLocaleString()}
                </small>
              </div>
            </Card.Body>
            {matchedPapers[subscription.id] && (
              <Card.Footer>
                <Card.Title>匹配论文</Card.Title>
                {Object.keys(matchedPapers[subscription.id]).length === 0 ? (
                  <Alert variant="info">
                    未找到新的匹配论文
                  </Alert>
                ) : (
                  Object.entries(matchedPapers[subscription.id]).map(([category, papers]) => (
                    <div key={category} className="mb-3">
                      <h5>{category}</h5>
                      <ListGroup variant="flush">
                        {papers.slice(0, 5).map((paper, idx) => (
                          <ListGroup.Item key={idx}>
                            <div className="d-flex justify-content-between align-items-start">
                              <div>
                                <a href={paper.link} target="_blank" rel="noreferrer">
                                  {paper.title}
                                </a>
                                <div className="text-muted small">
                                  {paper.authors.slice(0, 3).join(', ')}
                                  {paper.authors.length > 3 && ' 等'}
                                </div>
                                <div>
                                  <small>
                                    匹配关键词: {paper.matched_keywords.join(', ')}
                                  </small>
                                </div>
                              </div>
                              <Badge bg="info">
                                {new Date(paper.published).toLocaleDateString()}
                              </Badge>
                            </div>
                          </ListGroup.Item>
                        ))}
                        {papers.length > 5 && (
                          <ListGroup.Item className="text-center">
                            <small>还有 {papers.length - 5} 篇相关论文</small>
                          </ListGroup.Item>
                        )}
                      </ListGroup>
                    </div>
                  ))
                )}
              </Card.Footer>
            )}
          </Card>
        ))
      )}
    </Container>
  );
}

export default MySubscriptions; 