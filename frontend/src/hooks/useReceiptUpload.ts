import { useState } from 'react';
import { apiService } from '@/services/api';

interface UploadReceiptParams {
  text: string;
  files?: File[];
  session_id: string;
  user_id: string;
}

/**
 * Receipt upload Hook
 */
export const useReceiptUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const uploadReceipt = async ({ text, files, session_id, user_id }: UploadReceiptParams) => {
    setIsUploading(true);
    setError(null);

    try {
      // Call apiService.sendMessage to send message and file
      const response = await apiService.sendMessage({
        text,
        files,
        session_id,
        user_id,
      });

      return response;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Upload failed');
      setError(error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    uploadReceipt,
    isUploading,
    error,
  };
};

