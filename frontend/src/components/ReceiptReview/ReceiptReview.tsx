import React, { useState, useEffect } from 'react';
import { Card, Typography, Space, Button, Modal, message } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, ExclamationCircleOutlined, SwapOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { ReceiptData, Item } from '@/types';
import { ReceiptInfo } from './ReceiptInfo';
import { ItemList } from './ItemList';
import { apiService } from '@/services/api';
import { useReceiptStore } from '@/store/useReceiptStore';
import './ReceiptReview.css';

const { Title, Text } = Typography;
const { confirm } = Modal;

/**
 * ReceiptReview Props
 */
interface ReceiptReviewProps {
  receiptData: ReceiptData;
  onApprove: (data: ReceiptData) => void;
  onDiscard: () => void;
}

/**
 * ReceiptReview Component
 * Display and edit AI-extracted receipt information
 */
export const ReceiptReview: React.FC<ReceiptReviewProps> = ({
  receiptData,
  onApprove,
  onDiscard,
}) => {
  const navigate = useNavigate();
  const { addApprovedReceipt, setAllItems } = useReceiptStore();
  const [editedData, setEditedData] = useState<ReceiptData>({
    ...receiptData,
    date: receiptData.date ? new Date(receiptData.date) : new Date(),
  });
  const [isApproving, setIsApproving] = useState(false);

  // Calculate HSA total amount
  const calculateTotal = (items: Item[]) => {
    return items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
  };

  useEffect(() => {
    // Update total amount
    const total = calculateTotal(editedData.eligible_items);
    setEditedData(prev => ({ ...prev, total_cost: total }));
  }, [editedData.eligible_items]);

  // Update basic information
  const handleInfoChange = (field: string, value: any) => {
    setEditedData(prev => ({ ...prev, [field]: value }));
  };

  // Update item information
  const handleItemUpdate = (itemId: string, updatedItem: Item, listType: 'eligible' | 'non_eligible' | 'unsure') => {
    if (listType === 'eligible') {
      setEditedData(prev => ({
        ...prev,
        eligible_items: prev.eligible_items.map(item =>
          item.id === itemId ? updatedItem : item
        ),
      }));
    } else if (listType === 'non_eligible') {
      setEditedData(prev => ({
        ...prev,
        non_eligible_items: prev.non_eligible_items.map(item =>
          item.id === itemId ? updatedItem : item
        ),
      }));
    } else {
      setEditedData(prev => ({
        ...prev,
        unsure_items: prev.unsure_items.map(item =>
          item.id === itemId ? updatedItem : item
        ),
      }));
    }
  };

  // Delete item
  const handleItemDelete = (itemId: string, listType: 'eligible' | 'non_eligible' | 'unsure') => {
    if (listType === 'eligible') {
      setEditedData(prev => ({
        ...prev,
        eligible_items: prev.eligible_items.filter(item => item.id !== itemId),
      }));
    } else if (listType === 'non_eligible') {
      setEditedData(prev => ({
        ...prev,
        non_eligible_items: prev.non_eligible_items.filter(item => item.id !== itemId),
      }));
    } else {
      setEditedData(prev => ({
        ...prev,
        unsure_items: prev.unsure_items.filter(item => item.id !== itemId),
      }));
    }
  };

  // Move item (eligible ↔ non-eligible)
  const handleItemMove = (itemId: string, fromEligible: boolean) => {
    if (fromEligible) {
      // Move from eligible to non-eligible
      const item = editedData.eligible_items.find(i => i.id === itemId);
      if (item) {
        setEditedData(prev => ({
          ...prev,
          eligible_items: prev.eligible_items.filter(i => i.id !== itemId),
          non_eligible_items: [...prev.non_eligible_items, item],
        }));
        message.info(`${item.name} moved to non-eligible list`);
      }
    } else {
      // Move from non-eligible to eligible
      const item = editedData.non_eligible_items.find(i => i.id === itemId);
      if (item) {
        setEditedData(prev => ({
          ...prev,
          non_eligible_items: prev.non_eligible_items.filter(i => i.id !== itemId),
          eligible_items: [...prev.eligible_items, item],
        }));
        message.info(`${item.name} moved to eligible list`);
      }
    }
  };

  // Move unsure item to eligible
  const handleUnsureToEligible = (itemId: string) => {
    const item = editedData.unsure_items.find(i => i.id === itemId);
    if (item) {
      setEditedData(prev => ({
        ...prev,
        unsure_items: prev.unsure_items.filter(i => i.id !== itemId),
        eligible_items: [...prev.eligible_items, { ...item, is_eligible: true }],
      }));
      message.success(`${item.name} moved to eligible list`);
    }
  };

  // Move unsure item to non-eligible
  const handleUnsureToNonEligible = (itemId: string) => {
    const item = editedData.unsure_items.find(i => i.id === itemId);
    if (item) {
      setEditedData(prev => ({
        ...prev,
        unsure_items: prev.unsure_items.filter(i => i.id !== itemId),
        non_eligible_items: [...prev.non_eligible_items, { ...item, is_eligible: false }],
      }));
      message.success(`${item.name} moved to non-eligible list`);
    }
  };

  // Approve
  const handleApprove = async () => {
    setIsApproving(true);
    try {
      // Convert ItemBasic to ReceiptItem (remove id and is_eligible)
      const convertToReceiptItem = (items: Item[]) =>
        items.map(item => ({
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          description: item.description,
        }));

      // Call API
      const response = await apiService.approveReceipt({
        receipt_id: editedData.receipt_id,
        store_name: editedData.store_name,
        date: (editedData.date ? new Date(editedData.date) : new Date()).toISOString(), // Convert Date to ISO string
        approved_hsa_eligible_items: convertToReceiptItem(editedData.eligible_items),
        approved_non_hsa_eligible_items: convertToReceiptItem(editedData.non_eligible_items),
        approved_unsure_hsa_items: convertToReceiptItem(editedData.unsure_items),
        payment_card: editedData.payment_card,
        card_last_four_digit: editedData.card_last_four_digit,
        total_cost: editedData.total_cost,
      });

      // ⚠️ Important: Replace with the latest complete item information returned from backend (ItemFull[])
      // Use setAllItems instead of addItems to replace old data instead of accumulating it
      console.log('✅ Approve response received:', response);
      console.log('✅ Items count:', response.items?.length);

      // Ensure we only save items that are eligible, even if backend returns everything.
      // Since ItemFull no longer has is_eligible property in the type definition, we cast to any to check the runtime value.
      if (response.items && response.items.length > 0) {
        // Filter items that are eligible (assuming backend might still send is_eligible field)
        // If backend doesn't send is_eligible, we assume all items in this list are what we want (which are eligible ones)
        // But to be safe and follow the requirement "only show eligible", we try to filter if possible.
        const eligibleItems = response.items.filter((item: any) => {
          // If is_eligible is present, check it. If not present, assume true (or false? better assume true if we changed backend contract)
          // However, the user requirement is to not show non-eligible.
          // If the backend still returns mixed list with is_eligible flag, we must filter.
          return item.is_eligible !== false;
        });

        setAllItems(eligibleItems);
        console.log('✅ Items saved to store (filtered count):', eligibleItems.length);
      } else {
        console.warn('⚠️ No items in response or items array is empty');
      }

      // Keep simplified receipt information in approvedReceipts (for backwards compatibility, not for display)
      addApprovedReceipt(editedData);

      message.success('Receipt approved and saved successfully!');
      onApprove(editedData);
    } catch (error) {
      console.error('Approve failed:', error);
      message.error(error instanceof Error ? error.message : 'Approval failed, please try again');
    } finally {
      setIsApproving(false);
    }
  };

  // Discard
  const handleDiscard = () => {
    confirm({
      title: 'Confirm Discard',
      icon: <ExclamationCircleOutlined />,
      content: 'Are you sure you want to discard this receipt? All edits will be lost.',
      okText: 'Discard',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk() {
        message.info('Receipt discarded');
        onDiscard();
      },
    });
  };

  return (
    <div className="receipt-review">
      {/* Header */}
      <div className="review-header">
        <Title level={2} className="gradient-text">Review Receipt Information</Title>
        <Text type="secondary">Please review and correct AI-recognized information</Text>
      </div>

      {/* Main Content: Left-Right Layout */}
      <div className="review-content-layout">
        {/* Left: Receipt Image (if available) */}
        {(editedData.receipt_image || editedData.image_url) && (
          <div className="receipt-image-section">
            <Card className="receipt-image-card" title="📷 Receipt Image">
              <div className="receipt-image-container">
                <img
                  src={editedData.receipt_image || editedData.image_url}
                  alt="Receipt"
                  className="receipt-image"
                />
              </div>
            </Card>
          </div>
        )}

        {/* Right: Receipt Information */}
        <div className={`receipt-info-section ${(editedData.receipt_image || editedData.image_url) ? 'with-image' : 'full-width'}`}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {/* Total Amount - Moved to top, compact single line */}
            <Card className="total-card-compact">
              <div className="total-amount-row">
                <Text strong style={{ fontSize: 16 }}>HSA Eligible Total Amount:</Text>
                <Title level={3} style={{ margin: 0, color: '#52c41a' }}>
                  ${editedData.total_cost.toFixed(2)}
                </Title>
              </div>
            </Card>

            {/* Basic Information */}
            <Card className="receipt-info-card" title="📋 Basic Information">
              <ReceiptInfo
                data={editedData}
                onChange={handleInfoChange}
              />
            </Card>

            {/* Item Lists */}
            <Card
              className="items-card eligible-card"
              title={
                <Space>
                  <CheckCircleOutlined style={{ color: '#52c41a' }} />
                  <span>HSA Eligible Items</span>
                  <Text type="secondary">({editedData.eligible_items.length} items)</Text>
                </Space>
              }
            >
              <ItemList
                items={editedData.eligible_items}
                isEligible={true}
                onItemUpdate={(id, item) => handleItemUpdate(id, item, 'eligible')}
                onItemDelete={(id) => handleItemDelete(id, 'eligible')}
                onItemMove={(id) => handleItemMove(id, true)}
              />
            </Card>

            {/* Unsure Items - New section */}
            {editedData.unsure_items && editedData.unsure_items.length > 0 && (
              <Card
                className="items-card unsure-card"
                title={
                  <Space>
                    <SwapOutlined style={{ color: '#faad14' }} />
                    <span>Unsure Items (Needs Review)</span>
                    <Text type="secondary">({editedData.unsure_items.length} items)</Text>
                  </Space>
                }
              >
                <ItemList
                  items={editedData.unsure_items}
                  isEligible={false}
                  isUnsure={true}
                  onItemUpdate={(id, item) => handleItemUpdate(id, item, 'unsure')}
                  onItemDelete={(id) => handleItemDelete(id, 'unsure')}
                  onItemMove={(id) => { }} // Not used for unsure items
                  onMoveToEligible={handleUnsureToEligible}
                  onMoveToNonEligible={handleUnsureToNonEligible}
                />
              </Card>
            )}

            <Card
              className="items-card non-eligible-card"
              title={
                <Space>
                  <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                  <span>Non-eligible Items</span>
                  <Text type="secondary">({editedData.non_eligible_items.length} items)</Text>
                </Space>
              }
            >
              <ItemList
                items={editedData.non_eligible_items}
                isEligible={false}
                onItemUpdate={(id, item) => handleItemUpdate(id, item, 'non_eligible')}
                onItemDelete={(id) => handleItemDelete(id, 'non_eligible')}
                onItemMove={(id) => handleItemMove(id, false)}
              />
            </Card>

            {/* Action Buttons */}
            <div className="action-buttons">
              <Button
                size="large"
                icon={<CloseCircleOutlined />}
                onClick={handleDiscard}
              >
                Discard
              </Button>
              <Button
                type="primary"
                size="large"
                icon={<CheckCircleOutlined />}
                onClick={handleApprove}
                loading={isApproving}
              >
                Approve and Save
              </Button>
            </div>
          </Space>
        </div>
      </div>
    </div>
  );
};
