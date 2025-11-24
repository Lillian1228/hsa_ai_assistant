import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Button, Space, Result, Empty } from 'antd';
import { CheckCircleOutlined, PlusOutlined, HomeOutlined } from '@ant-design/icons';
import { ChatBox } from '@/components';
import { StepIndicator } from '@/components/common';
import { ItemsTable } from '@/components/ItemsTable';
import { useAppStore } from '@/store/useAppStore';
import { useReceiptStore } from '@/store/useReceiptStore';
import './SummaryPage.css';

const { Title } = Typography;

/**
 * SummaryPage Component
 * Overview page displaying all saved items in a table format (based on ItemFull data)
 */
export const SummaryPage: React.FC = () => {
  const navigate = useNavigate();
  const { sessionId, userId } = useAppStore();
  const { currentReceipt, allItems } = useReceiptStore();

  // Debug logging
  console.log('📊 SummaryPage - currentReceipt:', currentReceipt);
  console.log('📊 SummaryPage - allItems count:', allItems?.length);
  console.log('📊 SummaryPage - allItems:', allItems);

  // Show success message if there's a current receipt
  const showSuccessMessage = !!currentReceipt;

  return (
    <div className="summary-page page-container">
      <header className="page-header">
        <Title level={1} style={{ margin: 0 }}>
          HSA AI Assistant
        </Title>
      </header>

      <div className="page-content">
        <main className="main-section-with-steps">
          <div className="step-indicator-wrapper">
            <StepIndicator currentStep="finish" />
          </div>
          
          <div className="main-section">
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {/* Success Message - Compact Version */}
            {showSuccessMessage && (
              <div className="success-result">
                <CheckCircleOutlined style={{ fontSize: 24, color: '#52c41a', marginRight: 12, verticalAlign: 'middle' }} />
                <span style={{ fontSize: 16, fontWeight: 600, color: '#52c41a', verticalAlign: 'middle' }}>
                  Receipt saved successfully!
                </span>
                <span style={{ fontSize: 14, color: '#666', marginLeft: 8, verticalAlign: 'middle' }}>
                  Your HSA expense records have been added to the system
                </span>
              </div>
            )}

            {/* Items Table */}
            {allItems.length > 0 ? (
              <ItemsTable items={allItems} />
            ) : (
              <Empty
                description="No expense records yet, please upload a receipt first"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}

            {/* Action Buttons */}
            <div className="action-buttons">
              <Button
                type="default"
                size="large"
                icon={<HomeOutlined />}
                onClick={() => navigate('/')}
              >
                Back to Home
              </Button>
              <Button
                type="primary"
                size="large"
                icon={<PlusOutlined />}
                onClick={() => navigate('/')}
              >
                Upload New Receipt
              </Button>
            </div>
          </Space>
          </div>
        </main>

        <aside className="chat-section">
          <ChatBox sessionId={sessionId} userId={userId} />
        </aside>
      </div>
    </div>
  );
};
