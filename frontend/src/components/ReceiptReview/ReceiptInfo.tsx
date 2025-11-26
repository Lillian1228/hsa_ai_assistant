import React from 'react';
import { Form, Input, DatePicker, Row, Col } from 'antd';
import dayjs from 'dayjs';
import type { ReceiptData } from '@/types';

interface ReceiptInfoProps {
  data: ReceiptData;
  onChange: (field: string, value: any) => void;
}

/**
 * ReceiptInfo Component
 * Display and edit receipt basic information (compact single row layout)
 */
export const ReceiptInfo: React.FC<ReceiptInfoProps> = ({ data, onChange }) => {
  return (
    <Form layout="vertical">
      <Row gutter={12}>
        <Col xs={24} sm={6}>
          <Form.Item label="Store name" style={{ marginBottom: 0 }}>
            <Input
              value={data.store_name}
              onChange={(e) => onChange('store_name', e.target.value)}
              placeholder="Store name"
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={6}>
          <Form.Item label="Purchase date" style={{ marginBottom: 0 }}>
            <DatePicker
              value={dayjs(data.date)}
              onChange={(date) => onChange('date', date?.toDate())}
              style={{ width: '100%' }}
              format="YYYY-MM-DD"
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={6}>
          <Form.Item label="Payment card type" style={{ marginBottom: 0 }}>
            <Input
              value={data.payment_card}
              onChange={(e) => onChange('payment_card', e.target.value)}
              placeholder="e.g. Visa"
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={6}>
          <Form.Item label="Card Last 4" style={{ marginBottom: 0 }}>
            <Input
              value={data.card_last_four_digit}
              onChange={(e) => {
                // Only allow input of 4 digits
                const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                onChange('card_last_four_digit', value);
              }}
              placeholder="****"
              maxLength={4}
            />
          </Form.Item>
        </Col>
      </Row>
    </Form>
  );
};

