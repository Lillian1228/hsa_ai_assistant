import { useChatStore } from '@/store/useChatStore';
import { apiService } from '@/services/api';
import { message as antdMessage } from 'antd';
import type { Message } from '@/types';

/**
 * Chat functionality Hook
 */
export const useChat = (sessionId: string, userId: string) => {
  const { messages, addMessage, setLoading, isLoading } = useChatStore();

  const sendMessage = async (text: string) => {
    setLoading(true);

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: text,
      timestamp: new Date(),
    };
    addMessage(userMessage);

    try {
      // Call API
      const response = await apiService.sendMessage({
        text,
        files: [],
        session_id: sessionId,
        user_id: userId,
      });

      // Always add assistant reply from response.response field
      if (response.response) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: response.response,
          timestamp: new Date(),
        };
        addMessage(assistantMessage);
      }

      // Note: If receipt_review_request is present, the caller (e.g., ReceiptUploader) 
      // will handle navigation to review page
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Send failed');
      
      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `Sorry, there was an error: ${error.message}. Please try again later.`,
        timestamp: new Date(),
      };
      addMessage(errorMessage);
      
      antdMessage.error(error.message);
      console.error('Send message failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    messages,
    sendMessage,
    isLoading,
  };
};

