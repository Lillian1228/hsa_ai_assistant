import React, { useState, useMemo } from 'react';
import { Table, Tag, Space, Button, Input, Select, DatePicker, Card, Tooltip } from 'antd';
import { LinkOutlined, SearchOutlined, ClearOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { ItemFull } from '@/types';
import dayjs, { Dayjs } from 'dayjs';
import './ItemsTable.css';

const { RangePicker } = DatePicker;
const { Option } = Select;

interface ItemsTableProps {
  items: ItemFull[];
}

interface FilterState {
  searchText: string;
  storeName: string | null;
  showEligibleOnly: boolean;
  dateRange: [Dayjs, Dayjs] | null;
}

interface SortState {
  field: 'purchase_date' | 'price' | 'store_name' | 'item_name';
  order: 'asc' | 'desc';
}

export const ItemsTable: React.FC<ItemsTableProps> = ({ items }) => {
  const [filters, setFilters] = useState<FilterState>({
    searchText: '',
    storeName: null,
    showEligibleOnly: true, // Default: show only eligible items
    dateRange: null,
  });

  const [sort, setSort] = useState<SortState>({
    field: 'purchase_date',
    order: 'desc', // Default: sort by date descending
  });

  // Get all unique store names
  const storeNames = useMemo(() => {
    return Array.from(new Set(items.filter(item => item.store_name).map(item => item.store_name))).sort();
  }, [items]);

  // Filter and sort data
  const processedData = useMemo(() => {
    let result = [...items];

    // Filter: Eligibility
    if (filters.showEligibleOnly) {
      result = result.filter(item => item.is_eligible);
    }

    // Filter: Store
    if (filters.storeName) {
      result = result.filter(item => item.store_name === filters.storeName);
    }

    // Filter: Search text
    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase();
      result = result.filter(
        item =>
          (item.item_name && item.item_name.toLowerCase().includes(searchLower)) ||
          (item.description && item.description.toLowerCase().includes(searchLower))
      );
    }

    // Filter: Date range
    if (filters.dateRange) {
      const [start, end] = filters.dateRange;
      result = result.filter(item => {
        if (!item.purchase_date) return false;
        const itemDate = dayjs(item.purchase_date);
        return itemDate.isAfter(start) && itemDate.isBefore(end.add(1, 'day'));
      });
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sort.field) {
        case 'purchase_date':
          comparison = dayjs(a.purchase_date || 0).valueOf() - dayjs(b.purchase_date || 0).valueOf();
          break;
        case 'price':
          comparison = (a.price || 0) - (b.price || 0);
          break;
        case 'store_name':
          comparison = (a.store_name || '').localeCompare(b.store_name || '');
          break;
        case 'item_name':
          comparison = (a.item_name || '').localeCompare(b.item_name || '');
          break;
      }
      return sort.order === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [items, filters, sort]);

  // Calculate statistics
  const statistics = useMemo(() => {
    const eligibleItems = processedData.filter(item => item.is_eligible);
    const totalCost = eligibleItems.reduce((sum, item) => sum + (item.price || 0), 0);
    return {
      total: processedData.length,
      eligible: eligibleItems.length,
      totalCost,
    };
  }, [processedData]);

  // Clear all filters
  const handleClearFilters = () => {
    setFilters({
      searchText: '',
      storeName: null,
      showEligibleOnly: true,
      dateRange: null,
    });
  };

  // Table column definitions
  const columns: ColumnsType<ItemFull> = [
    {
      title: 'Item Name',
      dataIndex: 'item_name',
      key: 'item_name',
      width: 200,
      fixed: 'left',
      ellipsis: true,
      align: 'center',
      render: (text: string, record: ItemFull) => (
        <Tooltip title={record.description || 'No description'}>
          <span style={{ fontWeight: 500 }}>{text || '-'}</span>
        </Tooltip>
      ),
    },
    {
      title: 'Store',
      dataIndex: 'store_name',
      key: 'store_name',
      width: 120,
      ellipsis: true,
      align: 'center',
      render: (text: string) => text || '-',
    },
    {
      title: 'Qty',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 60,
      align: 'center',
      render: (qty: number) => qty || 0,
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      width: 90,
      align: 'center',
      render: (price: number, record: ItemFull) => (
        <Tooltip title={`Quantity: ${record.quantity || 1}`}>
          <span style={{ fontWeight: 600, color: '#52c41a' }}>
            ${price ? price.toFixed(2) : '0.00'}
          </span>
        </Tooltip>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'purchase_date',
      key: 'purchase_date',
      width: 110,
      align: 'center',
      render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD') : '-',
    },
    {
      title: 'Eligibility',
      dataIndex: 'is_eligible',
      key: 'is_eligible',
      width: 100,
      align: 'center',
      render: (eligible: boolean) => (
        <Tag color={eligible ? 'green' : 'red'}>
          {eligible ? 'Eligible' : 'Not Eligible'}
        </Tag>
      ),
    },
    {
      title: 'Receipt',
      dataIndex: 'image_url',
      key: 'image_url',
      width: 90,
      align: 'center',
      render: (url: string) => url ? (
        <a href={url} target="_blank" rel="noopener noreferrer">
          <Button type="link" icon={<LinkOutlined />} size="small">
            View
          </Button>
        </a>
      ) : (
        <span style={{ color: '#999' }}>-</span>
      ),
    },
  ];

  return (
    <div className="items-table-container">
      {/* Filter and Sort Controls */}
      <Card className="filter-card" bordered={false}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {/* First Row: Search and Store Filter */}
          <Space wrap>
            <Input
              placeholder="Search item name or description"
              prefix={<SearchOutlined />}
              value={filters.searchText}
              onChange={(e) => setFilters({ ...filters, searchText: e.target.value })}
              style={{ width: 250 }}
              allowClear
            />

            <Select
              placeholder="Select store"
              value={filters.storeName}
              onChange={(value) => setFilters({ ...filters, storeName: value })}
              style={{ width: 200 }}
              allowClear
            >
              {storeNames.map(name => (
                <Option key={name} value={name}>{name}</Option>
              ))}
            </Select>

            <Select
              value={filters.showEligibleOnly ? 'eligible' : 'all'}
              onChange={(value) =>
                setFilters({ ...filters, showEligibleOnly: value === 'eligible' })
              }
              style={{ width: 150 }}
            >
              <Option value="eligible">Eligible Only</Option>
              <Option value="all">All Items</Option>
            </Select>

            <RangePicker
              value={filters.dateRange}
              onChange={(dates) => setFilters({ ...filters, dateRange: dates as [Dayjs, Dayjs] | null })}
              format="YYYY-MM-DD"
            />
          </Space>

          {/* Second Row: Sort and Actions */}
          <Space wrap>
            <span style={{ color: '#666' }}>Sort by:</span>
            <Select
              value={sort.field}
              onChange={(value) => setSort({ ...sort, field: value })}
              style={{ width: 140 }}
            >
              <Option value="purchase_date">Purchase Date</Option>
              <Option value="price">Price</Option>
              <Option value="store_name">Store</Option>
              <Option value="item_name">Item Name</Option>
            </Select>

            <Select
              value={sort.order}
              onChange={(value) => setSort({ ...sort, order: value })}
              style={{ width: 120 }}
            >
              <Option value="desc">Descending</Option>
              <Option value="asc">Ascending</Option>
            </Select>

            <Button
              icon={<ClearOutlined />}
              onClick={handleClearFilters}
            >
              Clear Filters
            </Button>
          </Space>

          {/* Statistics Bar */}
          <div className="statistics-bar">
            <Space size="large">
              <span>
                Showing <strong>{processedData.length}</strong> items
              </span>
              {filters.showEligibleOnly && (
                <>
                  <span className="divider">|</span>
                  <span>
                    Eligible items: <strong style={{ color: '#52c41a' }}>{statistics.eligible}</strong>
                  </span>
                  <span className="divider">|</span>
                  <span>
                    Eligible total: <strong style={{ color: '#52c41a' }}>${statistics.totalCost.toFixed(2)}</strong>
                  </span>
                </>
              )}
            </Space>
          </div>
        </Space>
      </Card>

      {/* Data Table */}
      <Table
        columns={columns}
        dataSource={processedData}
        rowKey={(record, index) => `${record.item_name}-${record.purchase_date}-${index}`}
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} items`,
          pageSizeOptions: ['10', '20', '50', '100'],
        }}
        scroll={{ x: 1200 }}
        className="items-table"
      />
    </div>
  );
};
