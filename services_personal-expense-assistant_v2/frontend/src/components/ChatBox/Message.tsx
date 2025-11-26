import React from 'react';
import { Avatar, Space } from 'antd';
import { UserOutlined, RobotOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Message as MessageType } from '@/types';
import './Message.css';

interface MessageProps {
  message: MessageType;
}

/**
 * Message Component
 * Display single chat message
 */
export const Message: React.FC<MessageProps> = ({ message }) => {
  const isUser = message.type === 'user';
  const isAssistant = message.type === 'assistant';

  return (
    <div className={`message ${isUser ? 'message-user' : 'message-assistant'}`}>
      {/* AI message: avatar on the left */}
      {isAssistant && (
        <div className="message-container">
          <Avatar
            size={36}
            icon={<RobotOutlined />}
            className="message-avatar message-avatar-assistant"
          />
          <div className="message-content-wrapper">
            <div className="message-bubble message-bubble-assistant">
              <div className="message-text">{message.content}</div>
            </div>
            <div className="message-time">
              {dayjs(message.timestamp).format('HH:mm')}
            </div>
          </div>
        </div>
      )}

      {/* User message: avatar on the right */}
      {isUser && (
        <div className="message-container message-container-user">
          <div className="message-content-wrapper">
            <div className="message-bubble message-bubble-user">
              <div className="message-text">{message.content}</div>
            </div>
            <div className="message-time">
              {dayjs(message.timestamp).format('HH:mm')}
            </div>
          </div>
          <Avatar
            size={36}
            icon={<UserOutlined />}
            className="message-avatar message-avatar-user"
          />
        </div>
      )}
    </div>
  );
};

