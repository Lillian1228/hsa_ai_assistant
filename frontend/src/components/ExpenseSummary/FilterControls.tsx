import React from 'react';
import { Card, Input, Select, DatePicker, Space, Row, Col } from 'antd';
import { SearchOutlined, SortAscendingOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import './FilterControls.css';

const { RangePicker } = DatePicker;

interface FilterOptions {
  searchTerm: string;
  sortBy: 'date' | 'amount' | 'store';
  sortOrder: 'asc' | 'desc';
  dateRange?: [Date, Date];
}

interface FilterControlsProps {
  filterOptions: FilterOptions;
  onFilterChange: (options: FilterOptions) => void;
}

/**
 * FilterControls Component
 * Filter and sort controls
 */
export const FilterControls: React.FC<FilterControlsProps> = ({
  filterOptions,
  onFilterChange,
}) => {
  return (
    <Card className="filter-controls-card">
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={8}>
          <Input
            placeholder="Search store or product name"
            prefix={<SearchOutlined />}
            value={filterOptions.searchTerm}
            onChange={(e) =>
              onFilterChange({ ...filterOptions, searchTerm: e.target.value })
            }
            allowClear
          />
        </Col>

        <Col xs={12} sm={6} md={4}>
          <Select
            style={{ width: '100%' }}
            value={filterOptions.sortBy}
            onChange={(value) =>
              onFilterChange({ ...filterOptions, sortBy: value })
            }
            options={[
              { label: 'Date', value: 'date' },
              { label: 'Amount', value: 'amount' },
              { label: 'Store', value: 'store' },
            ]}
          />
        </Col>

        <Col xs={12} sm={6} md={4}>
          <Select
            style={{ width: '100%' }}
            value={filterOptions.sortOrder}
            onChange={(value) =>
              onFilterChange({ ...filterOptions, sortOrder: value })
            }
            options={[
              { label: 'Descending', value: 'desc' },
              { label: 'Ascending', value: 'asc' },
            ]}
          />
        </Col>

        <Col xs={24} sm={12} md={8}>
          <RangePicker
            style={{ width: '100%' }}
            value={
              filterOptions.dateRange
                ? [dayjs(filterOptions.dateRange[0]), dayjs(filterOptions.dateRange[1])]
                : undefined
            }
            onChange={(dates) => {
              if (dates) {
                onFilterChange({
                  ...filterOptions,
                  dateRange: [dates[0]!.toDate(), dates[1]!.toDate()],
                });
              } else {
                const { dateRange, ...rest } = filterOptions;
                onFilterChange(rest);
              }
            }}
            placeholder={['Start date', 'End date']}
          />
        </Col>
      </Row>
    </Card>
  );
};

