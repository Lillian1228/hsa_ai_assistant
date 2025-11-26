import React from 'react';
import { Card, Typography, Space, Row, Col } from 'antd';
import {
  CloudUploadOutlined,
  SafetyOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { ChatBox, ReceiptUploader } from '@/components';
import { StepIndicator } from '@/components/common';
import { useAppStore } from '@/store/useAppStore';
import './HomePage.css';

const { Title, Paragraph, Text } = Typography;

/**
 * HomePage Component
 * Home/portal page with welcome information and receipt upload functionality
 */
export const HomePage: React.FC = () => {
  const { sessionId, userId } = useAppStore();

  const handleUploadSuccess = () => {
    // TODO: Handle upload success, navigate to review page
    console.log('Upload success');
  };

  const handleUploadError = (error: Error) => {
    // TODO: Handle upload error
    console.error('Upload error:', error);
  };

  const features = [
    {
      icon: <CloudUploadOutlined style={{ fontSize: 32, color: '#667eea' }} />,
      title: 'AI Smart Recognition',
      description: 'Upload receipt, AI automatically recognizes item information',
    },
    {
      icon: <SafetyOutlined style={{ fontSize: 32, color: '#667eea' }} />,
      title: 'HSA Compliance Check',
      description: 'Automatically distinguish HSA-eligible and non-eligible items',
    },
    {
      icon: <ThunderboltOutlined style={{ fontSize: 32, color: '#667eea' }} />,
      title: 'Fast Processing',
      description: 'Complete receipt analysis and cost calculation in seconds',
    },
    {
      icon: <CheckCircleOutlined style={{ fontSize: 32, color: '#667eea' }} />,
      title: 'Expense Tracking',
      description: 'Automatically store records, view expense details anytime',
    },
  ];

  return (
    <div className="home-page page-container">
      <header className="page-header">
        <Title level={1} style={{ margin: 0 }}>
          HSA AI Assistant
        </Title>
      </header>

      <div className="page-content">
        {/* Main Content Area with Step Indicator */}
        <main className="main-section-with-steps">
          <div className="step-indicator-wrapper">
            <StepIndicator currentStep="upload" />
          </div>
          
          <div className="main-section">
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            {/* Welcome Section */}
            <div className="welcome-section-compact">
              <Title level={2} className="gradient-text">
                Welcome to HSA AI Assistant
              </Title>
              <Paragraph className="welcome-description">
                Upload your shopping receipt, AI will help identify HSA-eligible items
              </Paragraph>
            </div>

            {/* Feature Highlights */}
            <Row gutter={[12, 12]}>
              {features.map((feature, index) => (
                <Col xs={24} sm={12} key={index}>
                  <Card className="feature-card-compact" hoverable>
                    <Space size="small">
                      {feature.icon}
                      <div>
                        <Text strong style={{ fontSize: 14, display: 'block' }}>
                          {feature.title}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {feature.description}
                        </Text>
                      </div>
                    </Space>
                  </Card>
                </Col>
              ))}
            </Row>

            {/* Upload Area */}
            <Card className="upload-card-compact">
              <ReceiptUploader
                onUploadSuccess={handleUploadSuccess}
                onUploadError={handleUploadError}
              />
            </Card>
          </Space>
          </div>
        </main>

        {/* Chat Area */}
        <aside className="chat-section">
          <ChatBox sessionId={sessionId} userId={userId} />
        </aside>
      </div>
    </div>
  );
};

