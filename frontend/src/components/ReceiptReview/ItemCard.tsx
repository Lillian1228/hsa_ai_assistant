import React, { useState } from 'react';
import { Card, Input, InputNumber, Button, Space, Modal, Typography, Tooltip } from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  SaveOutlined,
  CloseOutlined,
  ArrowRightOutlined,
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import type { Item } from '@/types';
import './ItemCard.css';

const { Text, Paragraph } = Typography;
const { confirm } = Modal;
const { TextArea } = Input;

interface ItemCardProps {
  item: Item;
  isEligible: boolean;
  isUnsure?: boolean; // New prop for unsure items
  onUpdate: (item: Item) => void;
  onDelete: () => void;
  onMove: () => void;
  onMoveToEligible?: () => void; // For unsure items
  onMoveToNonEligible?: () => void; // For unsure items
}

/**
 * ItemCard Component
 * Display a single item card
 */
export const ItemCard: React.FC<ItemCardProps> = ({
  item,
  isEligible,
  isUnsure = false,
  onUpdate,
  onDelete,
  onMove,
  onMoveToEligible,
  onMoveToNonEligible,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(item.name);
  const [editedPrice, setEditedPrice] = useState(item.price);
  const [editedQuantity, setEditedQuantity] = useState(item.quantity || 1);
  const [editedDescription, setEditedDescription] = useState(item.description || '');

  const handleSave = () => {
    onUpdate({
      ...item,
      name: editedName,
      price: editedPrice,
      quantity: editedQuantity,
      description: editedDescription,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedName(item.name);
    setEditedPrice(item.price);
    setEditedQuantity(item.quantity || 1);
    setEditedDescription(item.description || '');
    setIsEditing(false);
  };

  const handleDelete = () => {
    confirm({
      title: 'Confirm deletion',
      content: `Are you sure you want to delete "${item.name}"?`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: onDelete,
    });
  };

  // Get card class based on status
  const getCardClass = () => {
    if (isUnsure) return 'unsure';
    return isEligible ? 'eligible' : 'non-eligible';
  };

  // Get status icon
  const getStatusIcon = () => {
    if (isUnsure) {
      return <SwapOutlined style={{ fontSize: 18, color: '#faad14' }} />;
    }
    return isEligible ? (
      <CheckCircleOutlined style={{ fontSize: 18, color: '#52c41a' }} />
    ) : (
      <CloseCircleOutlined style={{ fontSize: 18, color: '#ff4d4f' }} />
    );
  };

  return (
    <Tooltip title={item.description || 'No description'} placement="top">
      <Card
        className={`item-card ${getCardClass()}`}
        size="small"
        style={{ marginBottom: 8 }}
      >
        <div className="item-content-compact">
          {/* Left: status icon */}
          <div className="item-icon">
            {getStatusIcon()}
          </div>

          {/* Middle: product information (name | quantity × price) */}
          <div className="item-info-compact">
            {isEditing ? (
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Space size="small">
                  <Input
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    placeholder="Product name"
                    size="small"
                    style={{ width: 180 }}
                  />
                  <InputNumber
                    value={editedQuantity}
                    onChange={(value) => setEditedQuantity(value || 1)}
                    min={1}
                    size="small"
                    style={{ width: 70 }}
                    prefix="×"
                  />
                  <InputNumber
                    value={editedPrice}
                    onChange={(value) => setEditedPrice(value || 0)}
                    prefix="$"
                    min={0}
                    step={0.01}
                    precision={2}
                    size="small"
                    style={{ width: 100 }}
                  />
                </Space>
                <TextArea
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  placeholder="Item description"
                  size="small"
                  rows={2}
                  style={{ width: '100%' }}
                />
              </Space>
            ) : (
              <>
                <Text strong style={{ fontSize: 14 }}>{item.name}</Text>
                <Text type="secondary" style={{ fontSize: 14, marginLeft: 8 }}>
                  ×{item.quantity || 1}
                </Text>
                <Text type="secondary" style={{ fontSize: 14, marginLeft: 8 }}>
                  ${item.price.toFixed(2)}
                </Text>
              </>
            )}
          </div>

          {/* Right: action buttons */}
          <div className="item-actions">
            {isEditing ? (
              <Space size="small">
                <Tooltip title="Save">
                  <Button
                    type="primary"
                    size="small"
                    icon={<SaveOutlined />}
                    onClick={handleSave}
                  />
                </Tooltip>
                <Tooltip title="Cancel">
                  <Button
                    size="small"
                    icon={<CloseOutlined />}
                    onClick={handleCancel}
                  />
                </Tooltip>
              </Space>
            ) : isUnsure ? (
              // Unsure items have two move buttons
              <Space size="small">
                <Tooltip title="Edit">
                  <Button
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => setIsEditing(true)}
                    type="text"
                  />
                </Tooltip>
                <Tooltip title="Move to eligible">
                  <Button
                    size="small"
                    icon={<ArrowLeftOutlined rotate={90} />}
                    onClick={onMoveToEligible}
                    type="text"
                    style={{ color: '#52c41a' }}
                  />
                </Tooltip>
                <Tooltip title="Move to non-eligible">
                  <Button
                    size="small"
                    icon={<ArrowRightOutlined rotate={90} />}
                    onClick={onMoveToNonEligible}
                    type="text"
                    style={{ color: '#ff4d4f' }}
                  />
                </Tooltip>
                <Tooltip title="Delete">
                  <Button
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={handleDelete}
                    type="text"
                  />
                </Tooltip>
              </Space>
            ) : (
              // Eligible/Non-eligible items have one move button
              <Space size="small">
                <Tooltip title="Edit">
                  <Button
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => setIsEditing(true)}
                    type="text"
                  />
                </Tooltip>
                <Tooltip title={isEligible ? 'Move to non-eligible' : 'Move to eligible'}>
                  <Button
                    size="small"
                    icon={isEligible ? <ArrowRightOutlined rotate={90} /> : <ArrowLeftOutlined rotate={90} />}
                    onClick={onMove}
                    type="text"
                    style={{ color: isEligible ? '#ff4d4f' : '#52c41a' }}
                  />
                </Tooltip>
                <Tooltip title="Delete">
                  <Button
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={handleDelete}
                    type="text"
                  />
                </Tooltip>
              </Space>
            )}
          </div>
        </div>
      </Card>
    </Tooltip>
  );
};

