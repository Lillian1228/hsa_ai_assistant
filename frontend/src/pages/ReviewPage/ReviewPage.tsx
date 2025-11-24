import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Button } from 'antd';
import { ChatBox, ReceiptReview } from '@/components';
import { StepIndicator } from '@/components/common';
import { useAppStore } from '@/store/useAppStore';
import { useReceiptStore } from '@/store/useReceiptStore';
import type { ReceiptData } from '@/types';

const { Title } = Typography;

/**
 * ReviewPage Component
 * Review page for displaying and editing AI-extracted receipt information
 */
export const ReviewPage: React.FC = () => {
  const navigate = useNavigate();
  const { sessionId, userId, setCurrentStep } = useAppStore();
  const { currentReceipt } = useReceiptStore();

  const handleApprove = (data: ReceiptData) => {
    // TODO: Call API to approve receipt
    console.log('Approve receipt:', data);
    setCurrentStep('summary');
    navigate('/summary');
  };

  const handleDiscard = () => {
    // TODO: Handle discard action
    console.log('Discard receipt');
    setCurrentStep('upload');
    navigate('/');
  };

  if (!currentReceipt) {
    return (
      <div className="review-page page-container">
        <header className="page-header">
          <Title level={1} style={{ margin: 0 }}>
            HSA AI Assistant
          </Title>
        </header>

        <div className="page-content">
          <main className="main-section-with-steps">
            <div className="step-indicator-wrapper">
              <StepIndicator currentStep="review" />
            </div>
            
            <div className="main-section" style={{ textAlign: 'center' }}>
            <p>No receipts to review</p>
            <Button type="primary" onClick={() => navigate('/')}>
              Back to Home
            </Button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="review-page page-container">
      <header className="page-header">
        <Title level={1} style={{ margin: 0 }}>
          HSA AI Assistant
        </Title>
      </header>

      <div className="page-content">
        <main className="main-section-with-steps">
          <div className="step-indicator-wrapper">
            <StepIndicator currentStep="review" />
          </div>
          
          <div className="main-section">
          <ReceiptReview
            receiptData={currentReceipt}
            onApprove={handleApprove}
            onDiscard={handleDiscard}
          />
          </div>
        </main>

        <aside className="chat-section">
          <ChatBox sessionId={sessionId} userId={userId} />
        </aside>
      </div>
    </div>
  );
};

