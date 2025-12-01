import { ItemFull } from './item';

/**
 * API request and response type definitions
 */

/**
 * Image data structure for API requests
 * Used when sending base64 encoded images to backend
 */
export interface ApiImageData {
  serialized_image: string;
  mime_type: string;
}

// ============ Chat API ============

export interface ChatRequest {
  text: string;
  files: ApiImageData[];
  session_id: string;
  user_id: string;
}

/**
 * Item without id and is_eligible (from backend)
 */
export interface ReceiptItem {
  name: string;
  price: number;
  quantity: number;
  description: string;
}

/**
 * Receipt review request data (nested in ReceiptResponse)
 */
export interface ReceiptReviewRequest {
  store_name: string;
  date: string;
  hsa_eligible_items: ReceiptItem[];
  non_hsa_eligible_items: ReceiptItem[];
  unsure_hsa_items: ReceiptItem[]; // Note: Backend schema shows object, but should be array
  payment_card: string;
  card_last_four_digit: string;
  total_cost: number;
  receipt_id: string;
}

/**
 * Attachment data
 */
export interface Attachment {
  serialized_image: string;
  mime_type: string;
}

/**
 * ReceiptResponse - Receipt recognition response from /chat API
 * Contains receipt data and chat response
 */
export interface ReceiptResponse {
  review_request?: ReceiptReviewRequest; // Optional, only present when receipt is detected
  response: string; // Always present, should be displayed in chatbox
  thinking_process: string;
  attachments: Attachment[];
  error: string;
  image_url: string;
}

// ChatResponse is now just ReceiptResponse
// The response field contains the text to display in chatbox
// If receipt_review_request is present, navigate to review page
export type ChatResponse = ReceiptResponse;

/**
 * ChatTextResponse - Simple text response
 * Alias for ChatResponse for compatibility
 */
export type ChatTextResponse = ChatResponse;

// ============ Approve API ============

/**
 * ApproveRequest - Approve receipt request
 * Same structure as ReceiptReviewRequest, items without id and is_eligible
 */
export interface ApproveRequest {
  receipt_id: string;
  store_name: string;
  date: string; // ISO 8601 string format
  approved_hsa_eligible_items: ReceiptItem[];
  approved_non_hsa_eligible_items: ReceiptItem[];
  approved_unsure_hsa_items: ReceiptItem[];
  payment_card: string;
  card_last_four_digit: string;
  total_cost: number;
}

/**
  * ApproveResponse - Approve receipt response
 * Return ItemFull[] (complete item information, used for Summary page display and statistics)
 */
export interface ApproveResponse {
  items: ItemFull[];
}

