import React, { useEffect, useRef } from 'react';
import { Empty } from 'antd';
import { RobotOutlined } from '@ant-design/icons';
import { Message } from './Message';
import type { Message as MessageType } from '@/types';
import './MessageList.css';

interface MessageListProps {
  messages: MessageType[];
  loading?: boolean;
}

/**
 * MessageList Component
 * Display message list
 */
export const MessageList: React.FC<MessageListProps> = ({
  messages,
  loading = false,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMessagesLength = useRef(0);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (messages.length > prevMessagesLength.current) {
      scrollToBottom();
    }
    prevMessagesLength.current = messages.length;
  }, [messages]);

  if (messages.length === 0 && !loading) {
    return (
      <div className="message-list-empty">
        <Empty
          image={<RobotOutlined style={{ fontSize: 64, color: '#667eea' }} />}
          description={
            <div>
              <div style={{ marginBottom: 8 }}>Hello! I am HSA AI Assistant</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                You can ask me any questions
              </div>
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div className="message-list">
      {messages.map((message) => (
        <Message key={message.id} message={message} />
      ))}

      {/* Loading indicator */}
      {loading && (
        <div className="message-loading">
          <div className="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      )}

      {/* Scroll anchor */}
      <div ref={messagesEndRef} />
    </div>
  );
};

