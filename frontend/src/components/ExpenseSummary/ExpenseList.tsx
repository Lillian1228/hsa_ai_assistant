import React from 'react';
import { List, Empty } from 'antd';
import type { ReceiptData } from '@/types';
import { ExpenseItem } from './ExpenseItem';
import './ExpenseList.css';

interface ExpenseListProps {
  receipts: ReceiptData[];
}

/**
 * ExpenseList Component
 * Display expense record list
 */
export const ExpenseList: React.FC<ExpenseListProps> = ({ receipts }) => {
  if (receipts.length === 0) {
    return (
      <Empty
        description="No matching records found"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  }

  return (
    <div className="expense-list">
      <List
        dataSource={receipts}
        renderItem={(receipt, index) => (
          <ExpenseItem key={index} receipt={receipt} />
        )}
      />
    </div>
  );
};

