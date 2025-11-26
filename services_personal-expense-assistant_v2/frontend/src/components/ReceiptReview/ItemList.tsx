import React from 'react';
import { List, Empty } from 'antd';
import type { Item } from '@/types';
import { ItemCard } from './ItemCard';

interface ItemListProps {
  items: Item[];
  isEligible: boolean;
  isUnsure?: boolean; // New prop for unsure items
  onItemUpdate: (id: string, item: Item) => void;
  onItemDelete: (id: string) => void;
  onItemMove: (id: string) => void;
  onMoveToEligible?: (id: string) => void; // For unsure items
  onMoveToNonEligible?: (id: string) => void; // For unsure items
}

/**
 * ItemList Component
 * Display item list
 */
export const ItemList: React.FC<ItemListProps> = ({
  items,
  isEligible,
  isUnsure = false,
  onItemUpdate,
  onItemDelete,
  onItemMove,
  onMoveToEligible,
  onMoveToNonEligible,
}) => {
  if (items.length === 0) {
    const description = isUnsure 
      ? 'No unsure items' 
      : isEligible 
        ? 'No eligible items' 
        : 'No non-eligible items';
    
    return (
      <Empty
        description={description}
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  }

  return (
    <List
      dataSource={items}
      renderItem={(item) => (
        <ItemCard
          item={item}
          isEligible={isEligible}
          isUnsure={isUnsure}
          onUpdate={(updated) => onItemUpdate(item.id, updated)}
          onDelete={() => onItemDelete(item.id)}
          onMove={() => onItemMove(item.id)}
          onMoveToEligible={onMoveToEligible ? () => onMoveToEligible(item.id) : undefined}
          onMoveToNonEligible={onMoveToNonEligible ? () => onMoveToNonEligible(item.id) : undefined}
        />
      )}
    />
  );
};

