import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Alert, Card, Row, Col } from 'react-bootstrap';
import './Settings.css';

function Settings() {
  const [openaiKey, setOpenaiKey] = useState('');
  const [emailSettings, setEmailSettings] = useState({
    email: '',
    password: '',
    smtpServer: 'smtp.gmail.com',
    smtpPort: '587'
  });
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('');

  useEffect(() => {
    // 从LocalStorage加载设置
    const savedOpenaiKey = localStorage.getItem('openai_api_key');
    if (savedOpenaiKey) {
      setOpenaiKey(savedOpenaiKey);
    }

    const savedEmailSettings = localStorage.getItem('email_settings');
    if (savedEmailSettings) {
      try {
        setEmailSettings(JSON.parse(savedEmailSettings));
      } catch (e) {
        console.error('Failed to parse email settings:', e);
      }
    }
  }, []);

  const handleOpenAISubmit = (e) => {
    e.preventDefault();
    if (!openaiKey) {
      setMessage('请输入OpenAI API密钥');
      setMessageType('danger');
      return;
    }

    // 保存到LocalStorage
    localStorage.setItem('openai_api_key', openaiKey);
    setMessage('OpenAI API密钥保存成功！');
    setMessageType('success');
  };

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    if (!emailSettings.email || !emailSettings.password) {
      setMessage('请输入邮箱和密码');
      setMessageType('danger');
      return;
    }

    // 保存到LocalStorage
    localStorage.setItem('email_settings', JSON.stringify(emailSettings));
    setMessage('邮箱设置保存成功！');
    setMessageType('success');
  };

  const clearSettings = () => {
    // 清除所有设置
    localStorage.removeItem('openai_api_key');
    localStorage.removeItem('email_settings');
    localStorage.removeItem('user_subscriptions');
    localStorage.removeItem('paper_history');
    
    setOpenaiKey('');
    setEmailSettings({
      email: '',
      password: '',
      smtpServer: 'smtp.gmail.com',
      smtpPort: '587'
    });
    
    setMessage('所有设置已清除！');
    setMessageType('warning');
  };

  return (
    <Container className="settings-container">
      <h1 className="text-center mb-4">设置</h1>
      
      {message && (
        <Alert variant={messageType} onClose={() => setMessage(null)} dismissible>
          {message}
        </Alert>
      )}
      
      <Row>
        <Col md={6} className="mb-4">
          <Card>
            <Card.Header as="h5">OpenAI API设置</Card.Header>
            <Card.Body>
              <Form onSubmit={handleOpenAISubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>OpenAI API密钥</Form.Label>
                  <Form.Control 
                    type="password" 
                    placeholder="输入你的OpenAI API密钥" 
                    value={openaiKey}
                    onChange={(e) => setOpenaiKey(e.target.value)}
                  />
                  <Form.Text className="text-muted">
                    您的API密钥将只保存在您的浏览器中，不会发送到任何服务器。
                  </Form.Text>
                </Form.Group>
                <Button variant="primary" type="submit">
                  保存API密钥
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6} className="mb-4">
          <Card>
            <Card.Header as="h5">邮箱设置</Card.Header>
            <Card.Body>
              <Form onSubmit={handleEmailSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>发送邮箱</Form.Label>
                  <Form.Control 
                    type="email" 
                    placeholder="your.email@gmail.com" 
                    value={emailSettings.email}
                    onChange={(e) => setEmailSettings({...emailSettings, email: e.target.value})}
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>邮箱密码/应用密码</Form.Label>
                  <Form.Control 
                    type="password" 
                    placeholder="输入邮箱密码或应用密码" 
                    value={emailSettings.password}
                    onChange={(e) => setEmailSettings({...emailSettings, password: e.target.value})}
                  />
                  <Form.Text className="text-muted">
                    对于Gmail，建议使用应用专用密码。您的密码将只保存在您的浏览器中。
                  </Form.Text>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>SMTP服务器</Form.Label>
                  <Form.Control 
                    type="text" 
                    placeholder="smtp.gmail.com" 
                    value={emailSettings.smtpServer}
                    onChange={(e) => setEmailSettings({...emailSettings, smtpServer: e.target.value})}
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>SMTP端口</Form.Label>
                  <Form.Control 
                    type="text" 
                    placeholder="587" 
                    value={emailSettings.smtpPort}
                    onChange={(e) => setEmailSettings({...emailSettings, smtpPort: e.target.value})}
                  />
                </Form.Group>
                
                <Button variant="primary" type="submit">
                  保存邮箱设置
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <div className="text-center mt-4 mb-5">
        <Button variant="danger" onClick={clearSettings}>
          清除所有设置
        </Button>
      </div>
      
      <div className="settings-info">
        <h4>关于数据存储</h4>
        <p>
          为了保护您的隐私，所有设置和数据都只存储在您的浏览器本地，不会发送到任何服务器。
          这意味着：
        </p>
        <ul>
          <li>如果清除浏览器数据，您的设置将被删除</li>
          <li>您的API密钥和邮箱密码不会被发送到任何服务器</li>
          <li>您的订阅和论文历史记录只存在于您的设备上</li>
          <li>不同设备或浏览器之间的设置不会同步</li>
        </ul>
      </div>
    </Container>
  );
}

export default Settings; 