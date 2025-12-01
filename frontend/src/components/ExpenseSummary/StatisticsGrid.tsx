import React from 'react';
import { Row, Col, Card, Statistic } from 'antd';
import {
  DollarOutlined,
  CalendarOutlined,
  FileTextOutlined,
  ShoppingOutlined,
} from '@ant-design/icons';
import './StatisticsGrid.css';

interface StatisticsGridProps {
  statistics: {
    totalAmount: number;
    monthlyAmount: number;
    totalReceipts: number;
    totalItems: number;
  };
}

/**
 * StatisticsGrid Component
 * Display expense statistics information
 */
export const StatisticsGrid: React.FC<StatisticsGridProps> = ({
  statistics,
}) => {
  const cards = [
    {
      title: 'Total spending',
      value: statistics.totalAmount,
      prefix: '$',
      precision: 2,
      icon: <DollarOutlined />,
      color: '#667eea',
    },
    {
      title: 'Monthly spending',
      value: statistics.monthlyAmount,
      prefix: '$',
      precision: 2,
      icon: <CalendarOutlined />,
      color: '#52c41a',
    },
    {
      title: 'Receipt count',
      value: statistics.totalReceipts,
      suffix: 'receipts',
      icon: <FileTextOutlined />,
      color: '#fa8c16',
    },
    {
      title: 'Item count',
      value: statistics.totalItems,
      suffix: 'items',
      icon: <ShoppingOutlined />,
      color: '#eb2f96',
    },
  ];

  return (
    <Row gutter={[16, 16]} className="statistics-grid">
      {cards.map((card, index) => (
        <Col xs={24} sm={12} lg={6} key={index}>
          <Card className="statistic-card" hoverable>
            <div className="statistic-icon" style={{ color: card.color }}>
              {card.icon}
            </div>
            <Statistic
              title={card.title}
              value={card.value}
              prefix={card.prefix}
              suffix={card.suffix}
              precision={card.precision}
              valueStyle={{ color: card.color, fontWeight: 600 }}
            />
          </Card>
        </Col>
      ))}
    </Row>
  );
};

