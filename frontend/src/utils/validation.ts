/**
 * Validation utility functions
 */

/**
 * Validate if file is an image
 */
export const isImageFile = (file: File): boolean => {
  return file.type.startsWith('image/');
};

/**
 * Validate image size (default maximum 10MB)
 */
export const isFileSizeValid = (
  file: File,
  maxSizeMB: number = 10
): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
};

/**
 * Validate required fields
 */
export const isRequired = (value: string | null | undefined): boolean => {
  return !!value && value.trim().length > 0;
};

