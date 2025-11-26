import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ReceiptData, ItemFull } from '@/types';

/**
 * Receipt state management Store
 */
interface ReceiptState {
  currentReceipt: ReceiptData | null;
  approvedReceipts: ReceiptData[]; // Approved receipt list (kept for backward compatibility)
  allItems: ItemFull[]; // All saved complete item information (used for Summary page)

  // Actions
  setCurrentReceipt: (receipt: ReceiptData | null) => void;
  clearReceipt: () => void;
  addApprovedReceipt: (receipt: ReceiptData) => void;
  clearApprovedReceipts: () => void;
  setAllItems: (items: ItemFull[]) => void; // Set all items
  addItems: (items: ItemFull[]) => void; // Add items to list
  clearAllItems: () => void; // Clear all items
}

// Test data (used for development testing)
const testReceipt: ReceiptData = {
  store_name: 'CVS Pharmacy',
  date: new Date('2024-11-20'),
  eligible_items: [
    { id: '1', name: 'Ibuprofen 200mg', price: 12.99, quantity: 1, description: 'Pain reliever and fever reducer', is_eligible: true },
    { id: '2', name: 'Band-Aid Bandages', price: 5.49, quantity: 2, description: 'Adhesive bandages for wound care', is_eligible: true },
    { id: '3', name: 'Multivitamins', price: 24.99, quantity: 1, description: 'Daily multivitamin supplement', is_eligible: true },
  ],
  non_eligible_items: [
    { id: '4', name: 'Candy Bar', price: 3.99, quantity: 3, description: 'Chocolate candy bar', is_eligible: false },
    { id: '5', name: 'Soda 12-pack', price: 6.99, quantity: 1, description: 'Carbonated soft drink', is_eligible: false },
  ],
  unsure_items: [
    { id: '6', name: 'Vitamin C Gummies', price: 8.99, quantity: 1, description: 'Vitamin C supplement in gummy form', is_eligible: false },
  ],
  payment_card: 'Visa',
  card_last_four_digit: '1234',
  total_cost: 43.47,
  image_url: 'https://example.com/receipts/cvs_20241120_test.jpg', // Receipt image URL
};

// Test approved records (used for development testing)
const testApprovedReceipts: ReceiptData[] = [
  {
    ...testReceipt,
    date: new Date('2024-11-20'),
  },
  {
    store_name: 'Walgreens',
    date: new Date('2024-11-15'),
    eligible_items: [
      { id: '6', name: 'First Aid Kit', price: 19.99, quantity: 1, description: 'Complete first aid kit', is_eligible: true },
      { id: '7', name: 'Thermometer', price: 15.49, quantity: 1, description: 'Digital thermometer', is_eligible: true },
    ],
    non_eligible_items: [
      { id: '8', name: 'Chips', price: 2.99, quantity: 2, description: 'Potato chips', is_eligible: false },
    ],
    unsure_items: [],
    payment_card: 'Mastercard',
    card_last_four_digit: '5678',
    total_cost: 35.48,
  },
  {
    store_name: 'Target Pharmacy',
    date: new Date('2024-11-10'),
    eligible_items: [
      { id: '9', name: 'Pain Relief Cream', price: 8.99, quantity: 1, description: 'Topical pain relief', is_eligible: true },
      { id: '10', name: 'Allergy Medicine', price: 12.49, quantity: 1, description: 'Antihistamine tablets', is_eligible: true },
    ],
    non_eligible_items: [],
    unsure_items: [],
    payment_card: 'Visa',
    card_last_four_digit: '9012',
    total_cost: 21.48,
  },
];

// Test complete item data (used for development testing)
const testAllItems: ItemFull[] = [
  {
    item_name: 'Ibuprofen 200mg',
    store_name: 'CVS Pharmacy',
    quantity: 1,
    price: 12.99,
    description: 'Pain reliever and fever reducer',
    purchase_date: '2024-11-20T00:00:00.000Z',
    image_url: 'https://example.com/receipts/cvs_20241120.jpg',
    is_eligible: true,
  },
  {
    item_name: 'Band-Aid Bandages',
    store_name: 'CVS Pharmacy',
    quantity: 2,
    price: 5.49,
    description: 'Adhesive bandages for wound care',
    purchase_date: '2024-11-20T00:00:00.000Z',
    image_url: 'https://example.com/receipts/cvs_20241120.jpg',
    is_eligible: true,
  },
  {
    item_name: 'Multivitamins',
    store_name: 'CVS Pharmacy',
    quantity: 1,
    price: 24.99,
    description: 'Daily multivitamin supplement',
    purchase_date: '2024-11-20T00:00:00.000Z',
    image_url: 'https://example.com/receipts/cvs_20241120.jpg',
    is_eligible: true,
  },
  {
    item_name: 'Candy Bar',
    store_name: 'CVS Pharmacy',
    quantity: 3,
    price: 3.99,
    description: 'Chocolate candy bar',
    purchase_date: '2024-11-20T00:00:00.000Z',
    image_url: 'https://example.com/receipts/cvs_20241120.jpg',
    is_eligible: false,
  },
  {
    item_name: 'Soda 12-pack',
    store_name: 'CVS Pharmacy',
    quantity: 1,
    price: 6.99,
    description: 'Carbonated soft drink',
    purchase_date: '2024-11-20T00:00:00.000Z',
    image_url: 'https://example.com/receipts/cvs_20241120.jpg',
    is_eligible: false,
  },
  {
    item_name: 'First Aid Kit',
    store_name: 'Walgreens',
    quantity: 1,
    price: 19.99,
    description: 'Complete first aid kit',
    purchase_date: '2024-11-15T00:00:00.000Z',
    image_url: 'https://example.com/receipts/walgreens_20241115.jpg',
    is_eligible: true,
  },
  {
    item_name: 'Thermometer',
    store_name: 'Walgreens',
    quantity: 1,
    price: 15.49,
    description: 'Digital thermometer',
    purchase_date: '2024-11-15T00:00:00.000Z',
    image_url: 'https://example.com/receipts/walgreens_20241115.jpg',
    is_eligible: true,
  },
  {
    item_name: 'Chips',
    store_name: 'Walgreens',
    quantity: 2,
    price: 2.99,
    description: 'Potato chips',
    purchase_date: '2024-11-15T00:00:00.000Z',
    image_url: 'https://example.com/receipts/walgreens_20241115.jpg',
    is_eligible: false,
  },
  {
    item_name: 'Pain Relief Cream',
    store_name: 'Target Pharmacy',
    quantity: 1,
    price: 8.99,
    description: 'Topical pain relief',
    purchase_date: '2024-11-10T00:00:00.000Z',
    image_url: 'https://example.com/receipts/target_20241110.jpg',
    is_eligible: true,
  },
  {
    item_name: 'Allergy Medicine',
    store_name: 'Target Pharmacy',
    quantity: 1,
    price: 12.49,
    description: 'Antihistamine tablets',
    purchase_date: '2024-11-10T00:00:00.000Z',
    image_url: 'https://example.com/receipts/target_20241110.jpg',
    is_eligible: true,
  },
];

/**
 * Receipt state management Store
 */
export const useReceiptStore = create<ReceiptState>()(
  persist(
    (set) => ({
      // Initialize with empty data (test data available but not auto-loaded)
      currentReceipt: null,
      approvedReceipts: [],
      allItems: [],

      setCurrentReceipt: (receipt) => set({ currentReceipt: receipt }),
      clearReceipt: () => set({ currentReceipt: null }),
      
      addApprovedReceipt: (receipt) =>
        set((state) => ({
          approvedReceipts: [...state.approvedReceipts, receipt],
          currentReceipt: null, // Clear current receipt
        })),
      
      clearApprovedReceipts: () => set({ approvedReceipts: [] }),

      setAllItems: (items) => set({ allItems: items }),
      
      addItems: (items) =>
        set((state) => ({
          allItems: [...state.allItems, ...items],
        })),
      
      clearAllItems: () => set({ allItems: [] }),
    }),
    {
      name: 'receipt-storage', // localStorage key
      // Persist approved receipts and all item information
    }
  )
);

