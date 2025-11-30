import { create } from 'zustand';
import type { Message } from '@/types';

/**
 * Chat state
 */
interface ChatState {
  messages: Message[];
  isLoading: boolean;

  // Actions
  addMessage: (message: Message) => void;
  setMessages: (messages: Message[]) => void;
  setLoading: (loading: boolean) => void;
  clearMessages: () => void;
  deleteLastMessage: () => void;
}

/**
 * Chat state management Store
 */
export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isLoading: false,

  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  setMessages: (messages) => set({ messages }),
  setLoading: (loading) => set({ isLoading: loading }),
  clearMessages: () => set({ messages: [] }),
  deleteLastMessage: () => set((state) => ({ messages: state.messages.slice(0, -1) })),
}));

