import dayjs from 'dayjs';

/**
 * Formatting utility functions
 */

/**
 * Parse date string from backend (YYYY-MM-DD or ISO format) to local Date object
 * Avoids timezone issues by treating the date as local time
 */
export const parseLocalDate = (dateString: string): Date => {
  // Extract date part (YYYY-MM-DD) from ISO string if present
  const datePart = dateString.split('T')[0];
  const [year, month, day] = datePart.split('-').map(Number);
  // Create date in local timezone (month is 0-indexed)
  return new Date(year, month - 1, day);
};

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

