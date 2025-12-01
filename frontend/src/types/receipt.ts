import { ItemBasic } from './item';

/**
 * Receipt data model
 * Contains all information extracted from the receipt
 * Used for Review page (using ItemBasic simplified information)
 */
export interface ReceiptData {
  receipt_id: string; // Receipt ID from backend
  store_name: string;
  date: Date;
  eligible_items: ItemBasic[];
  non_eligible_items: ItemBasic[];
  unsure_items: ItemBasic[]; // Items with uncertain eligibility
  payment_card: string;
  card_last_four_digit: string;
  total_cost: number; // Changed from total_hsa_cost
  total_hsa_cost: number; // HSA eligible total cost
  image_url?: string; // Receipt image URL (from backend, if available)
  receipt_image?: string; // Base64 data URL from attachments (data:image/jpeg;base64,...)
}

/**
 * Image data model
 * Used for uploading receipt images
 */
export interface ImageData {
  file: File;
  preview?: string; // Base64 or URL
}

