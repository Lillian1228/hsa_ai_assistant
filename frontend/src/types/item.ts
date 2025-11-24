/**
 * ItemBasic - Basic item information
 * Used for Review page (simplified information when reviewing receipts)
 */
export interface ItemBasic {
  id: string;
  name: string;
  price: number; // Total price (not unit price)
  quantity: number; // Quantity of the item
  description: string; // Item description
  is_eligible: boolean; // Whether eligible for HSA
}

/**
 * ItemFull - Complete item information
 * Used for Summary page (complete item information saved, used for statistics and filtering)
 * Note: Backend does NOT include 'id' field, frontend can generate if needed
 */
export interface ItemFull {
  item_name: string; // Item name
  store_name: string; // Store name
  quantity: number; // Quantity
  price: number; // Total price (not unit price)
  description: string; // Item description
  purchase_date: string; // Purchase date (ISO 8601 format)
  image_url: string; // Path to receipt image in cloud storage
  is_eligible: boolean; // Whether eligible for HSA
}

/**
 * Item - Default export basic version (keep backward compatibility)
 */
export type Item = ItemBasic;

