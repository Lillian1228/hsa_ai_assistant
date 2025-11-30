

/**
 * Message type
 */
export type MessageType = 'user' | 'assistant';

/**
 * Attachment type for messages
 * Can be either user uploaded image (ImageData) or backend response attachment
 */
export interface MessageAttachment {
  // From user upload
  file?: File;
  preview?: string;
  // From backend response
  serialized_image?: string;
  mime_type?: string;
}

/**
 * Chat message model
 */
export interface Message {
  id: string;
  type: MessageType;
  content: string;
  timestamp: Date;
  attachments?: MessageAttachment[];
}

