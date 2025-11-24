import { ImageData } from './receipt';

/**
 * Message type
 */
export type MessageType = 'user' | 'assistant';

/**
 * Chat message model
 */
export interface Message {
  id: string;
  type: MessageType;
  content: string;
  timestamp: Date;
  attachments?: ImageData[];
}

