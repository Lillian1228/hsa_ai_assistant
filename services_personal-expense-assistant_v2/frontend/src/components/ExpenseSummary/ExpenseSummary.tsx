import React, { useState, useMemo } from 'react';
import { Space, Empty } from 'antd';
import type { ReceiptData } from '@/types';
import { StatisticsGrid } from './StatisticsGrid';
import { FilterControls } from './FilterControls';
import { ExpenseList } from './ExpenseList';
import './ExpenseSummary.css';

/**
 * ExpenseSummary Props
 */
interface ExpenseSummaryProps {
  receipts: ReceiptData[];
}

/**
 * Filter and sort options
 */
interface FilterOptions {
  searchTerm: string;
  sortBy: 'date' | 'amount' | 'store';
  sortOrder: 'asc' | 'desc';
  dateRange?: [Date, Date];
}

/**
 * ExpenseSummary Component
 * Display user's expense details
 */
export const ExpenseSummary: React.FC<ExpenseSummaryProps> = ({ receipts }) => {
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    searchTerm: '',
    sortBy: 'date',
    sortOrder: 'desc',
  });

  // Filter and sort receipts
  const filteredReceipts = useMemo(() => {
    let result = [...receipts];

    // Search filter
    if (filterOptions.searchTerm) {
      const term = filterOptions.searchTerm.toLowerCase();
      result = result.filter(
        (receipt) =>
          receipt.store_name.toLowerCase().includes(term) ||
          receipt.eligible_items.some((item) =>
            item.name.toLowerCase().includes(term)
          )
      );
    }

    // Date range filter
    if (filterOptions.dateRange) {
      const [start, end] = filterOptions.dateRange;
      result = result.filter((receipt) => {
        const receiptDate = new Date(receipt.date);
        return receiptDate >= start && receiptDate <= end;
      });
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;

      switch (filterOptions.sortBy) {
        case 'date':
          comparison =
            new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'amount':
          comparison = a.total_hsa_cost - b.total_hsa_cost;
          break;
        case 'store':
          comparison = a.store_name.localeCompare(b.store_name);
          break;
      }

      return filterOptions.sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [receipts, filterOptions]);

  // Calculate statistics
  const statistics = useMemo(() => {
    const totalAmount = receipts.reduce(
      (sum, receipt) => sum + receipt.total_hsa_cost,
      0
    );

    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyReceipts = receipts.filter(
      (receipt) => new Date(receipt.date) >= firstDayOfMonth
    );
    const monthlyAmount = monthlyReceipts.reduce(
      (sum, receipt) => sum + receipt.total_hsa_cost,
      0
    );

    const totalItems = receipts.reduce(
      (sum, receipt) => sum + receipt.eligible_items.length,
      0
    );

    return {
      totalAmount,
      monthlyAmount,
      totalReceipts: receipts.length,
      totalItems,
    };
  }, [receipts]);

  if (receipts.length === 0) {
    return (
      <div className="expense-summary">
        <Empty
          description="No expense records yet"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </div>
    );
  }

  return (
    <div className="expense-summary">
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Statistics */}
        <StatisticsGrid statistics={statistics} />

        {/* Filter and sort controls */}
        <FilterControls
          filterOptions={filterOptions}
          onFilterChange={setFilterOptions}
        />

        {/* Expense list */}
        <ExpenseList receipts={filteredReceipts} />
      </Space>
    </div>
  );
};
