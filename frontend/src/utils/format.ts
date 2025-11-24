import dayjs from 'dayjs';

/**
 * Formatting utility functions
 */

/**
 * Format date
 */
export const formatDate = (date: Date | string): string => {
  return dayjs(date).format('YYYY-MM-DD');
};

/**
 * Format amount
 */
export const formatCurrency = (amount: number): string => {
  return `$${amount.toFixed(2)}`;
};

/**
 * Format card number (display last four digits)
 */
export const formatCardNumber = (lastFourDigits: string): string => {
  return `**** **** **** ${lastFourDigits}`;
};

