# Mock Data Examples

This document provides complete API request and response examples for Apifox Mock server testing.

## Table of Contents
- [POST /chat (with file)](#post-chat-with-file)
- [POST /chat (without file)](#post-chat-without-file)
- [POST /approve](#post-approve)

---

## POST /chat (with file)

### Request Example

```json
{
  "text": "Please help me analyze this receipt",
  "files": [
    {
      "file": "<File Object>",
      "preview": "data:image/jpeg;base64,..."
    }
  ],
  "session_id": "session_123",
  "user_id": "user_456"
}
```

**Note**: When testing in Apifox, use `multipart/form-data` format.

### Response Example (ReceiptResponse - with receipt)

```json
{
  "receipt_review_request": {
    "store_name": "CVS Pharmacy",
    "date": "2024-11-22T00:00:00.000Z",
    "eligible_items": [
      {
        "name": "Ibuprofen 200mg (50 tablets)",
        "price": 12.99,
        "quantity": 1,
        "description": "Pain reliever and fever reducer"
      },
      {
        "name": "Band-Aid Adhesive Bandages",
        "price": 5.49,
        "quantity": 2,
        "description": "Adhesive bandages for wound care"
      },
      {
        "name": "Multivitamins Daily Pack",
        "price": 24.99,
        "quantity": 1,
        "description": "Daily multivitamin supplement"
      }
    ],
    "non_eligible_items": [
      {
        "name": "Candy Bar (Snickers)",
        "price": 1.99,
        "quantity": 3,
        "description": "Chocolate candy bar"
      },
      {
        "name": "Potato Chips",
        "price": 3.49,
        "quantity": 2,
        "description": "Salted potato chips"
      }
    ],
    "unsure_items": [
      {
        "name": "Vitamin C Gummies",
        "price": 8.99,
        "quantity": 1,
        "description": "Vitamin C supplement in gummy form"
      }
    ],
    "payment_card": "Visa",
    "card_last_four_digit": "1234",
    "price": 106.93
  },
  "response": "I've analyzed your receipt from CVS Pharmacy. Found 3 eligible items, 2 non-eligible items, and 1 item that needs your review.",
  "thinking_process": "Analyzing receipt image... Extracting text... Categorizing items...",
  "attachments": [
    {
      "serialized_image": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "mime_type": "image/png"
    }
  ],
  "error": "",
  "image_url": "https://example.com/receipts/cvs_20241122_abc123.jpg"
}
```

**Note**: 
- `attachments[0].serialized_image` contains the base64-encoded receipt image
- Frontend will convert it to data URL: `data:image/png;base64,{serialized_image}`
- The example above is a 1x1 pixel placeholder. In production, this will be the actual receipt image
- `image_url` is optional and can be used as fallback if attachments are not available
```

**Note**: Items in `eligible_items`, `non_eligible_items`, and `unsure_items` do NOT have `id` or `is_eligible` fields. The frontend generates `id` values and sets `is_eligible` based on which list the item is in.

### Response Example (ReceiptResponse - without receipt, text only)

```json
{
  "response": "HSA (Health Savings Account) eligible items are medical-related products and services that comply with U.S. federal tax law. These typically include prescription medications, OTC medications, medical devices, medical supplies, vision care products, and dental supplies.",
  "thinking_process": "User asked about HSA eligible items...",
  "attachments": [],
  "error": "",
  "image_url": ""
}
```

**Note**: When `receipt_review_request` is not present or empty, the frontend should only display `response` in the chatbox. When `receipt_review_request` is present, display `response` in chatbox AND navigate to the review page.

---

## POST /chat (without file)

This section has been merged into the main POST /chat response above. When no receipt is detected, `receipt_review_request` will be absent or empty.

---

## POST /approve

### Request Example

User-edited data from the Review page (including user modifications). **Note**: Frontend removes `id` and `is_eligible` fields before sending to backend:

```json
{
  "store_name": "CVS Pharmacy",
  "date": "2024-11-22T00:00:00.000Z",
  "eligible_items": [
    {
      "name": "Ibuprofen 200mg (50 tablets)",
      "price": 11.99,
      "quantity": 1,
      "description": "Pain reliever and fever reducer"
    },
    {
      "name": "Band-Aid Adhesive Bandages",
      "price": 5.49,
      "quantity": 2,
      "description": "Adhesive bandages for wound care"
    }
  ],
  "non_eligible_items": [
    {
      "name": "Potato Chips",
      "price": 3.49,
      "quantity": 2,
      "description": "Salted potato chips"
    }
  ],
  "unsure_items": [
    {
      "name": "Protein Powder",
      "price": 29.99,
      "quantity": 1,
      "description": "Whey protein powder supplement"
    }
  ],
  "payment_card": "Visa",
  "card_last_four_digit": "1234",
  "price": 50.00
}
```

**User Modifications** (example):
- ✏️ Ibuprofen price: $12.99 → $11.99
- 🗑️ Deleted some items
- 🔄 Moved items between lists

### Response Example

```json
{
  "items": [
    {
      "item_name": "Ibuprofen 200mg (50 tablets)",
      "store_name": "CVS Pharmacy",
      "quantity": 1,
      "price": 11.99,
      "description": "Pain reliever and fever reducer",
      "purchase_date": "2024-11-22T00:00:00.000Z",
      "image_url": "https://example.com/receipts/cvs_20241122_abc123.jpg",
      "is_eligible": true
    },
    {
      "item_name": "Band-Aid Adhesive Bandages",
      "store_name": "CVS Pharmacy",
      "quantity": 2,
      "price": 5.49,
      "description": "Adhesive bandages for wound care",
      "purchase_date": "2024-11-22T00:00:00.000Z",
      "image_url": "https://example.com/receipts/cvs_20241122_abc123.jpg",
      "is_eligible": true
    },
    {
      "item_name": "Multivitamins Daily Pack",
      "store_name": "CVS Pharmacy",
      "quantity": 1,
      "price": 22.99,
      "description": "Daily multivitamin supplement",
      "purchase_date": "2024-11-22T00:00:00.000Z",
      "image_url": "https://example.com/receipts/cvs_20241122_abc123.jpg",
      "is_eligible": true
    },
    {
      "item_name": "First Aid Kit",
      "store_name": "CVS Pharmacy",
      "quantity": 1,
      "price": 19.99,
      "description": "Complete first aid kit",
      "purchase_date": "2024-11-22T00:00:00.000Z",
      "image_url": "https://example.com/receipts/cvs_20241122_abc123.jpg",
      "is_eligible": true
    },
    {
      "item_name": "Digital Thermometer",
      "store_name": "CVS Pharmacy",
      "quantity": 1,
      "price": 15.49,
      "description": "Digital thermometer for accurate temperature measurement",
      "purchase_date": "2024-11-22T00:00:00.000Z",
      "image_url": "https://example.com/receipts/cvs_20241122_abc123.jpg",
      "is_eligible": true
    },
    {
      "item_name": "Allergy Medicine (Claritin)",
      "store_name": "CVS Pharmacy",
      "quantity": 1,
      "price": 18.99,
      "description": "Antihistamine for allergy relief",
      "purchase_date": "2024-11-22T00:00:00.000Z",
      "image_url": "https://example.com/receipts/cvs_20241122_abc123.jpg",
      "is_eligible": true
    },
    {
      "item_name": "Candy Bar (Snickers)",
      "store_name": "CVS Pharmacy",
      "quantity": 3,
      "price": 1.99,
      "description": "Chocolate candy bar",
      "purchase_date": "2024-11-22T00:00:00.000Z",
      "image_url": "https://example.com/receipts/cvs_20241122_abc123.jpg",
      "is_eligible": false
    },
    {
      "item_name": "Potato Chips",
      "store_name": "CVS Pharmacy",
      "quantity": 2,
      "price": 3.49,
      "description": "Salted potato chips",
      "purchase_date": "2024-11-22T00:00:00.000Z",
      "image_url": "https://example.com/receipts/cvs_20241122_abc123.jpg",
      "is_eligible": false
    },
    {
      "item_name": "Coca Cola 2L",
      "store_name": "CVS Pharmacy",
      "quantity": 1,
      "price": 2.99,
      "description": "Carbonated soft drink",
      "purchase_date": "2024-11-22T00:00:00.000Z",
      "image_url": "https://example.com/receipts/cvs_20241122_abc123.jpg",
      "is_eligible": false
    },
    {
      "item_name": "Energy Drink",
      "store_name": "CVS Pharmacy",
      "quantity": 1,
      "price": 2.79,
      "description": "Caffeinated energy drink",
      "purchase_date": "2024-11-22T00:00:00.000Z",
      "image_url": "https://example.com/receipts/cvs_20241122_abc123.jpg",
      "is_eligible": false
    },
    {
      "item_name": "Aspirin 325mg",
      "store_name": "Walgreens",
      "quantity": 1,
      "price": 9.99,
      "description": "Pain reliever for headaches and minor aches",
      "purchase_date": "2024-11-15T00:00:00.000Z",
      "image_url": "https://example.com/receipts/walgreens_20241115_xyz789.jpg",
      "is_eligible": true
    },
    {
      "item_name": "Contact Lens Solution",
      "store_name": "Walgreens",
      "quantity": 1,
      "price": 12.49,
      "description": "Multi-purpose contact lens solution",
      "purchase_date": "2024-11-15T00:00:00.000Z",
      "image_url": "https://example.com/receipts/walgreens_20241115_xyz789.jpg",
      "is_eligible": true
    },
    {
      "item_name": "Sunscreen SPF 50",
      "store_name": "Walgreens",
      "quantity": 2,
      "price": 14.99,
      "description": "Broad spectrum sunscreen",
      "purchase_date": "2024-11-15T00:00:00.000Z",
      "image_url": "https://example.com/receipts/walgreens_20241115_xyz789.jpg",
      "is_eligible": false
    },
    {
      "item_name": "Shampoo",
      "store_name": "Walgreens",
      "quantity": 1,
      "price": 8.99,
      "description": "Daily hair shampoo",
      "purchase_date": "2024-11-15T00:00:00.000Z",
      "image_url": "https://example.com/receipts/walgreens_20241115_xyz789.jpg",
      "is_eligible": false
    },
    {
      "item_name": "Blood Pressure Monitor",
      "store_name": "Target Pharmacy",
      "quantity": 1,
      "price": 45.99,
      "description": "Digital blood pressure monitor with large display",
      "purchase_date": "2024-11-10T00:00:00.000Z",
      "image_url": "https://example.com/receipts/target_20241110_def456.jpg",
      "is_eligible": true
    },
    {
      "item_name": "Cough Syrup",
      "store_name": "Target Pharmacy",
      "quantity": 1,
      "price": 11.99,
      "description": "Cough suppressant syrup",
      "purchase_date": "2024-11-10T00:00:00.000Z",
      "image_url": "https://example.com/receipts/target_20241110_def456.jpg",
      "is_eligible": true
    },
    {
      "item_name": "Hand Sanitizer",
      "store_name": "Target Pharmacy",
      "quantity": 3,
      "price": 4.99,
      "description": "Antibacterial hand sanitizer gel",
      "purchase_date": "2024-11-10T00:00:00.000Z",
      "image_url": "https://example.com/receipts/target_20241110_def456.jpg",
      "is_eligible": true
    },
    {
      "item_name": "Notebook",
      "store_name": "Target Pharmacy",
      "quantity": 2,
      "price": 5.99,
      "description": "Spiral notebook for notes",
      "purchase_date": "2024-11-10T00:00:00.000Z",
      "image_url": "https://example.com/receipts/target_20241110_def456.jpg",
      "is_eligible": false
    },
    {
      "item_name": "Prescription Antibiotic",
      "store_name": "Rite Aid",
      "quantity": 1,
      "price": 25.00,
      "description": "Prescription antibiotic medication",
      "purchase_date": "2024-11-05T00:00:00.000Z",
      "image_url": "https://example.com/receipts/riteaid_20241105_ghi123.jpg",
      "is_eligible": true
    },
    {
      "item_name": "Glucose Test Strips",
      "store_name": "Rite Aid",
      "quantity": 1,
      "price": 32.99,
      "description": "Blood glucose test strips for diabetes monitoring",
      "purchase_date": "2024-11-05T00:00:00.000Z",
      "image_url": "https://example.com/receipts/riteaid_20241105_ghi123.jpg",
      "is_eligible": true
    },
    {
      "item_name": "Dental Floss",
      "store_name": "Rite Aid",
      "quantity": 2,
      "price": 3.99,
      "description": "Mint flavored dental floss",
      "purchase_date": "2024-11-05T00:00:00.000Z",
      "image_url": "https://example.com/receipts/riteaid_20241105_ghi123.jpg",
      "is_eligible": true
    },
    {
      "item_name": "Greeting Card",
      "store_name": "Rite Aid",
      "quantity": 1,
      "price": 4.99,
      "description": "Birthday greeting card",
      "purchase_date": "2024-11-05T00:00:00.000Z",
      "image_url": "https://example.com/receipts/riteaid_20241105_ghi123.jpg",
      "is_eligible": false
    },
    {
      "item_name": "Prenatal Vitamins",
      "store_name": "CVS Pharmacy",
      "quantity": 1,
      "price": 28.99,
      "description": "Prenatal multivitamin supplement",
      "purchase_date": "2024-10-28T00:00:00.000Z",
      "image_url": "https://example.com/receipts/cvs_20241028_jkl456.jpg",
      "is_eligible": true
    },
    {
      "item_name": "Heating Pad",
      "store_name": "CVS Pharmacy",
      "quantity": 1,
      "price": 19.99,
      "description": "Electric heating pad for pain relief",
      "purchase_date": "2024-10-28T00:00:00.000Z",
      "image_url": "https://example.com/receipts/cvs_20241028_jkl456.jpg",
      "is_eligible": true
    },
    {
      "item_name": "Ice Cream",
      "store_name": "CVS Pharmacy",
      "quantity": 2,
      "price": 7.99,
      "description": "Vanilla ice cream",
      "purchase_date": "2024-10-28T00:00:00.000Z",
      "image_url": "https://example.com/receipts/cvs_20241028_jkl456.jpg",
      "is_eligible": false
    },
    {
      "item_name": "Reading Glasses +2.0",
      "store_name": "Walgreens",
      "quantity": 1,
      "price": 15.99,
      "description": "Reading glasses with +2.0 magnification",
      "purchase_date": "2024-10-20T00:00:00.000Z",
      "image_url": "https://example.com/receipts/walgreens_20241020_mno789.jpg",
      "is_eligible": true
    },
    {
      "item_name": "Nicotine Patches",
      "store_name": "Walgreens",
      "quantity": 1,
      "price": 42.99,
      "description": "Nicotine replacement therapy patches",
      "purchase_date": "2024-10-20T00:00:00.000Z",
      "image_url": "https://example.com/receipts/walgreens_20241020_mno789.jpg",
      "is_eligible": true
    },
    {
      "item_name": "Magazine",
      "store_name": "Walgreens",
      "quantity": 1,
      "price": 5.99,
      "description": "Health and wellness magazine",
      "purchase_date": "2024-10-20T00:00:00.000Z",
      "image_url": "https://example.com/receipts/walgreens_20241020_mno789.jpg",
      "is_eligible": false
    }
  ]
}
```

**Note**: This response includes items from 5 different stores (CVS Pharmacy, Walgreens, Target Pharmacy, Rite Aid) across 5 different dates (Nov 22, Nov 15, Nov 10, Nov 5, Oct 28, Oct 20) to thoroughly test the filtering and sorting functionality. All items include the required fields: `item_name`, `store_name`, `quantity`, `price`, `description`, `purchase_date`, `image_url`, and `is_eligible`.

---

## Apifox Configuration Guide

### 1. POST /chat API Configuration

Since `/chat` has two response types, you need to use **Mock Expectations (matching rules)**:

#### Matching Rule 1: With File Upload
- **Match Condition**: `has_file` query parameter is `true`
- **Response**: Returns ReceiptResponse (receipt data)

#### Matching Rule 2: Without File
- **Match Condition**: `has_file` query parameter is `false` or does not exist
- **Response**: Returns ChatTextResponse (text reply)

### 2. POST /approve API Configuration

- **Request Body**: ApproveRequest (user-edited receipt data)
- **Response**: ApproveResponse (complete ItemFull[] data)
- **No matching rules needed**: Only one response type

---

## Data Structure Documentation

### ReceiptItem (from backend, no id or is_eligible)
```typescript
interface ReceiptItem {
  name: string;
  price: number; // Total price (not unit price)
  quantity: number; // Item quantity
  description: string; // Item description
}
```

### ItemBasic (for Review page, frontend adds id and is_eligible)
```typescript
interface ItemBasic {
  id: string; // Generated by frontend
  name: string;
  price: number; // Total price (not unit price)
  quantity: number; // Item quantity
  description: string; // Item description
  is_eligible: boolean; // Set by frontend based on which list it's in
}
```

### ItemFull (for Summary page)
```typescript
interface ItemFull {
  item_name: string;
  store_name: string;
  quantity: number;
  price: number; // Total price (not unit price)
  description: string; // Item description
  purchase_date: string; // ISO 8601
  image_url: string;
  is_eligible: boolean;
  // Note: Backend does NOT include 'id' field
}
```

### ReceiptData (receipt information)
```typescript
interface ReceiptData {
  store_name: string;
  date: Date;
  eligible_items: ItemBasic[]; // Includes quantity and description fields
  non_eligible_items: ItemBasic[]; // Includes quantity and description fields
  unsure_items: ItemBasic[]; // Items with uncertain eligibility
  payment_card: string;
  card_last_four_digit: string;
  total_cost: number; // Changed from total_hsa_cost
}
```

---

## Testing Workflow

1. **Upload Receipt** (POST /chat?has_file=true)
   - User uploads receipt image
   - Receives ReceiptResponse (simplified item information)
   - Navigates to Review page

2. **Review and Edit** (Review page)
   - User can edit item information
   - Modify prices, move items between categories, delete items, etc.

3. **Approve and Save** (POST /approve)
   - Sends user-edited data
   - Receives ItemFull[] (complete item information)
   - Navigates to Summary page

4. **View Summary** (Summary page)
   - Displays all saved items (ItemFull[])
   - Groups by category, calculates totals, etc.
   - Supports filtering and sorting

---

## Important Notes

⚠️ **Frontend Temporary Modification**: To work with Apifox Mock matching, the frontend adds a `has_file` query parameter to the URL when sending `/chat` requests. This is a temporary modification for testing purposes. In production, the backend should determine whether the request contains files on its own.

⚠️ **Date Format**: All dates use ISO 8601 format (`YYYY-MM-DDTHH:mm:ss.sssZ`)

⚠️ **Price Precision**: All prices are rounded to two decimal places

⚠️ **Test Data**: In development environment, the Store automatically loads test data, allowing direct viewing of Summary page effects

