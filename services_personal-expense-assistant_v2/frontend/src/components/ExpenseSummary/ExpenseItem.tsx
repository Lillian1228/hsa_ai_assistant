import React from 'react';
import { Card, Typography, Space, Collapse, Divider } from 'antd';
import {
  ShopOutlined,
  CalendarOutlined,
  CreditCardOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { ReceiptData } from '@/types';
import './ExpenseItem.css';

const { Text, Title } = Typography;
const { Panel } = Collapse;

interface ExpenseItemProps {
  receipt: ReceiptData;
}

/**
 * ExpenseItem Component
 * Display single expense record
 */
export const ExpenseItem: React.FC<ExpenseItemProps> = ({ receipt }) => {
  return (
    <Card className="expense-item-card" hoverable>
      <Collapse
        expandIconPosition="end"
        ghost
        className="expense-collapse"
      >
        <Panel
          header={
            <div className="expense-item-header">
              <div className="header-main">
                <Space size="middle">
                  <ShopOutlined
                    style={{ fontSize: 20, color: '#667eea' }}
                  />
                  <div>
                    <Title level={5} style={{ margin: 0 }}>
                      {receipt.store_name}
                    </Title>
                    <Space size="small" className="header-meta">
                      <CalendarOutlined />
                      <Text type="secondary">
                        {dayjs(receipt.date).format('YYYY-MM-DD')}
                      </Text>
                    </Space>
                  </div>
                </Space>
              </div>
              <div className="header-amount">
                <Title level={4} style={{ margin: 0, color: '#52c41a' }}>
                  ${receipt.total_hsa_cost.toFixed(2)}
                </Title>
                <Text type="secondary">HSA eligible</Text>
              </div>
            </div>
          }
          key="1"
        >
          <Divider style={{ margin: '12px 0' }} />

          {/* Product details */}
          <div className="expense-item-details">
            <div className="details-section">
              <Title level={5}>
                <CheckCircleOutlined style={{ color: '#52c41a' }} /> HSA eligible products
              </Title>
              <div className="items-list">
                {receipt.eligible_items.map((item) => (
                  <div key={item.id} className="item-row">
                    <Text>{item.name}</Text>
                    <Text strong>${item.price.toFixed(2)}</Text>
                  </div>
                ))}
              </div>
            </div>

            {receipt.non_eligible_items.length > 0 && (
              <div className="details-section">
                <Title level={5} type="secondary">
                  Non-eligible products
                </Title>
                <div className="items-list">
                  {receipt.non_eligible_items.map((item) => (
                    <div key={item.id} className="item-row">
                      <Text type="secondary">{item.name}</Text>
                      <Text type="secondary">${item.price.toFixed(2)}</Text>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payment information */}
            <div className="payment-info">
              <Space>
                <CreditCardOutlined />
                <Text type="secondary">
                  {receipt.payment_card} •••• {receipt.card_last_four_digit}
                </Text>
              </Space>
            </div>
          </div>
        </Panel>
      </Collapse>
    </Card>
  );
};

