import { useChatStore } from '@/store/useChatStore';
import { apiService } from '@/services/api';
import { message as antdMessage } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useReceiptStore } from '@/store/useReceiptStore';
import type { Message } from '@/types';

/**
 * Chat functionality Hook
 */
export const useChat = (sessionId: string, userId: string) => {
  const { messages, addMessage, setLoading, isLoading } = useChatStore();
  const navigate = useNavigate();
  const { setCurrentReceipt } = useReceiptStore();

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
          attachments: response.attachments?.map(att => ({
            serialized_image: att.serialized_image,
            mime_type: att.mime_type
          })),
        };
        addMessage(assistantMessage);
      }

      // Check if response contains receipt review request
      if (response.review_request) {
        // Convert ReceiptReviewRequest to ReceiptData format
        const receiptData = {
          receipt_id: response.review_request.receipt_id,
          store_name: response.review_request.store_name,
          date: new Date(response.review_request.date),
          eligible_items: (response.review_request.hsa_eligible_items || []).map((item, index) => ({
            id: `eligible-${index}`,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            description: item.description,
            is_eligible: true,
          })),
          non_eligible_items: (response.review_request.non_hsa_eligible_items || []).map((item, index) => ({
            id: `non-eligible-${index}`,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            description: item.description,
            is_eligible: false,
          })),
          unsure_items: (response.review_request.unsure_hsa_items || []).map((item, index) => ({
            id: `unsure-${index}`,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            description: item.description,
            is_eligible: false,
          })),
          payment_card: response.review_request.payment_card,
          card_last_four_digit: response.review_request.card_last_four_digit,
          total_cost: response.review_request.total_cost,
          total_hsa_cost: (response.review_request.hsa_eligible_items || []).reduce((sum, item) => sum + item.price, 0),
          image_url: response.image_url,
        };

        setCurrentReceipt(receiptData);
        navigate('/review');
      }
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

