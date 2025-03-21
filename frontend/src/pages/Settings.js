import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { setEmailConfig } from '../services/api';
import { getOpenAIKey, saveOpenAIKey } from '../services/localData';
import './Settings.css';

function Settings() {
  const [openaiKey, setOpenaiKey] = useState('');
  const [openaiMessage, setOpenaiMessage] = useState(null);
  
  // EmailJS设置
  const [emailjsId, setEmailjsId] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [emailMessage, setEmailMessage] = useState(null);
  
  useEffect(() => {
    // 加载保存的设置
    const savedOpenAIKey = getOpenAIKey();
    if (savedOpenAIKey) {
      setOpenaiKey('************' + savedOpenAIKey.slice(-4));
    }
    
    // 加载邮箱设置
    const savedEmailSettings = localStorage.getItem('email_settings');
    if (savedEmailSettings) {
      try {
        const settings = JSON.parse(savedEmailSettings);
        if (settings.emailjsId) setEmailjsId('************' + settings.emailjsId.slice(-4));
        if (settings.serviceId) setServiceId(settings.serviceId);
        if (settings.templateId) setTemplateId(settings.templateId);
      } catch (e) {
        console.error('Error loading email settings:', e);
      }
    }
  }, []);
  
  const handleOpenAISave = (e) => {
    e.preventDefault();
    try {
      if (!openaiKey || openaiKey.startsWith('******')) {
        setOpenaiMessage({
          type: 'danger',
          text: '请输入有效的API密钥'
        });
        return;
      }
      
      saveOpenAIKey(openaiKey);
      setOpenaiMessage({
        type: 'success',
        text: 'OpenAI API密钥已保存'
      });
      
      // 隐藏大部分API密钥
      setOpenaiKey('************' + openaiKey.slice(-4));
      
      setTimeout(() => {
        setOpenaiMessage(null);
      }, 3000);
    } catch (error) {
      setOpenaiMessage({
        type: 'danger',
        text: `保存失败: ${error.message}`
      });
    }
  };
  
  const handleEmailSave = async (e) => {
    e.preventDefault();
    try {
      // 如果输入被掩码，不更新
      const config = {};
      
      if (!emailjsId || emailjsId.startsWith('******')) {
        setEmailMessage({
          type: 'danger',
          text: '请输入有效的EmailJS Public Key'
        });
        return;
      }
      
      if (!serviceId) {
        setEmailMessage({
          type: 'danger',
          text: '请输入EmailJS Service ID'
        });
        return;
      }
      
      if (!templateId) {
        setEmailMessage({
          type: 'danger',
          text: '请输入EmailJS Template ID'
        });
        return;
      }
      
      config.emailjsId = emailjsId.startsWith('******') ? 
        JSON.parse(localStorage.getItem('email_settings')).emailjsId : 
        emailjsId;
      
      config.serviceId = serviceId;
      config.templateId = templateId;
      
      const result = await setEmailConfig(config);
      
      if (result.success) {
        setEmailMessage({
          type: 'success',
          text: '邮箱设置已保存'
        });
        
        // 隐藏EmailJS ID
        if (!emailjsId.startsWith('******')) {
          setEmailjsId('************' + emailjsId.slice(-4));
        }
        
        setTimeout(() => {
          setEmailMessage(null);
        }, 3000);
      }
    } catch (error) {
      setEmailMessage({
        type: 'danger',
        text: `保存失败: ${error.message}`
      });
    }
  };
  
  const clearSettings = () => {
    if (window.confirm('确定要清除所有设置吗？这将删除您的API密钥和邮箱设置。')) {
      localStorage.removeItem('openai_key');
      localStorage.removeItem('email_settings');
      setOpenaiKey('');
      setEmailjsId('');
      setServiceId('');
      setTemplateId('');
      setOpenaiMessage({
        type: 'success',
        text: '所有设置已清除'
      });
      setEmailMessage(null);
    }
  };
  
  return (
    <Container className="my-4">
      <h1>设置</h1>
      <p className="text-muted">
        配置您的API密钥和邮箱设置。所有设置都保存在您的浏览器中，不会发送到任何服务器。
      </p>
      
      <Row className="mt-4">
        <Col md={6}>
          <Card className="mb-4">
            <Card.Header>OpenAI API密钥设置</Card.Header>
            <Card.Body>
              <p>
                设置OpenAI API密钥可以使用AI增强匹配功能，提高论文推荐的质量。
                API密钥仅用于本地调用OpenAI API，不会发送给任何第三方。
              </p>
              {openaiMessage && (
                <Alert variant={openaiMessage.type}>
                  {openaiMessage.text}
                </Alert>
              )}
              <Form onSubmit={handleOpenAISave}>
                <Form.Group className="mb-3">
                  <Form.Label>OpenAI API密钥</Form.Label>
                  <Form.Control 
                    type="text" 
                    placeholder="sk-..." 
                    value={openaiKey}
                    onChange={(e) => setOpenaiKey(e.target.value)}
                  />
                  <Form.Text className="text-muted">
                    在<a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer">OpenAI网站</a>获取API密钥
                  </Form.Text>
                </Form.Group>
                <Button variant="primary" type="submit">
                  保存API密钥
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card className="mb-4">
            <Card.Header>EmailJS设置</Card.Header>
            <Card.Body>
              <p>
                设置EmailJS可以发送论文推荐邮件通知。注册<a href="https://www.emailjs.com/" target="_blank" rel="noreferrer">EmailJS</a>账户后，
                创建一个邮件服务和模板，然后在下方填写相关ID。
              </p>
              {emailMessage && (
                <Alert variant={emailMessage.type}>
                  {emailMessage.text}
                </Alert>
              )}
              <Form onSubmit={handleEmailSave}>
                <Form.Group className="mb-3">
                  <Form.Label>EmailJS Public Key</Form.Label>
                  <Form.Control 
                    type="text" 
                    placeholder="您的EmailJS Public Key" 
                    value={emailjsId}
                    onChange={(e) => setEmailjsId(e.target.value)}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Service ID</Form.Label>
                  <Form.Control 
                    type="text" 
                    placeholder="service_xxxxxx" 
                    value={serviceId}
                    onChange={(e) => setServiceId(e.target.value)}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Template ID</Form.Label>
                  <Form.Control 
                    type="text" 
                    placeholder="template_xxxxxx" 
                    value={templateId}
                    onChange={(e) => setTemplateId(e.target.value)}
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
      
      <div className="d-flex justify-content-center mt-3 mb-5">
        <Button variant="danger" onClick={clearSettings}>
          清除所有设置
        </Button>
      </div>
    </Container>
  );
}

export default Settings; 