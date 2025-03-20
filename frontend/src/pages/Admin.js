import React, { useState } from 'react';
import { Container, Form, Button, Alert, Card, Row, Col, Spinner } from 'react-bootstrap';
import { setEmailConfig, generateRecommendations, updatePapers } from '../services/api';
import { useNavigate } from 'react-router-dom';
import './Admin.css';

const Admin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [useOpenAI, setUseOpenAI] = useState(true);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState({
    emailConfig: false,
    updatePapers: false,
    generateRecommendations: false
  });
  const navigate = useNavigate();

  const handleEmailConfig = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setMessage({ type: 'danger', text: '请填写完整的邮箱和密码信息' });
      return;
    }

    setLoading(prev => ({ ...prev, emailConfig: true }));
    setMessage(null);

    try {
      const result = await setEmailConfig(email, password);
      setMessage({ type: 'success', text: '邮箱配置成功！' + (result.message || '') });
    } catch (error) {
      setMessage({ type: 'danger', text: '邮箱配置失败: ' + error.message });
    } finally {
      setLoading(prev => ({ ...prev, emailConfig: false }));
    }
  };

  const handleUpdatePapers = async () => {
    setLoading(prev => ({ ...prev, updatePapers: true }));
    setMessage(null);

    try {
      const result = await updatePapers();
      setMessage({ type: 'success', text: '论文更新任务已启动！' + (result.message || '') });
    } catch (error) {
      setMessage({ type: 'danger', text: '论文更新任务启动失败: ' + error.message });
    } finally {
      setLoading(prev => ({ ...prev, updatePapers: false }));
    }
  };

  const handleGenerateRecommendations = async () => {
    setLoading(prev => ({ ...prev, generateRecommendations: true }));
    setMessage(null);

    try {
      const result = await generateRecommendations(useOpenAI);
      setMessage({ type: 'success', text: '推荐生成任务已启动！' + (result.message || '') });
    } catch (error) {
      setMessage({ type: 'danger', text: '推荐生成任务启动失败: ' + error.message });
    } finally {
      setLoading(prev => ({ ...prev, generateRecommendations: false }));
    }
  };

  return (
    <Container className="admin-container">
      <h1 className="text-center mb-4">管理员控制面板</h1>
      
      {message && (
        <Alert variant={message.type} onClose={() => setMessage(null)} dismissible>
          {message.text}
        </Alert>
      )}

      <Row>
        <Col md={6} className="mb-4">
          <Card>
            <Card.Header as="h5">邮箱配置</Card.Header>
            <Card.Body>
              <Form onSubmit={handleEmailConfig}>
                <Form.Group className="mb-3">
                  <Form.Label>发送邮箱</Form.Label>
                  <Form.Control 
                    type="email" 
                    placeholder="输入用于发送通知的邮箱" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>邮箱密码/应用密码</Form.Label>
                  <Form.Control 
                    type="password" 
                    placeholder="输入邮箱密码或应用密码" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <Form.Text className="text-muted">
                    对于Gmail等服务，建议使用应用专用密码
                  </Form.Text>
                </Form.Group>

                <Button 
                  variant="primary" 
                  type="submit"
                  disabled={loading.emailConfig}
                >
                  {loading.emailConfig ? (
                    <>
                      <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                      <span className="ms-2">处理中...</span>
                    </>
                  ) : '保存配置'}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="mb-4">
            <Card.Header as="h5">系统任务</Card.Header>
            <Card.Body>
              <div className="d-grid gap-3">
                <Button 
                  variant="info" 
                  onClick={handleUpdatePapers}
                  disabled={loading.updatePapers}
                >
                  {loading.updatePapers ? (
                    <>
                      <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                      <span className="ms-2">处理中...</span>
                    </>
                  ) : '手动更新论文数据'}
                </Button>

                <Form.Group className="mb-2">
                  <Form.Check 
                    type="checkbox"
                    id="use-openai-checkbox"
                    label="使用OpenAI增强匹配（更准确但较慢）"
                    checked={useOpenAI}
                    onChange={(e) => setUseOpenAI(e.target.checked)}
                  />
                </Form.Group>

                <Button 
                  variant="success" 
                  onClick={handleGenerateRecommendations}
                  disabled={loading.generateRecommendations}
                >
                  {loading.generateRecommendations ? (
                    <>
                      <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                      <span className="ms-2">处理中...</span>
                    </>
                  ) : '手动生成推荐'}
                </Button>
              </div>
            </Card.Body>
          </Card>

          <div className="d-grid">
            <Button variant="secondary" onClick={() => navigate('/')}>
              返回首页
            </Button>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default Admin; 