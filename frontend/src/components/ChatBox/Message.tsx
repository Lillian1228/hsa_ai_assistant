import React from 'react';
import { Avatar, Image } from 'antd';
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

  const renderAttachments = () => {
    if (!message.attachments || message.attachments.length === 0) return null;

    return (
      <div className="message-attachments" style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {message.attachments.map((att, index) => {
          let src = '';
          if (att.preview) {
            src = att.preview;
          } else if (att.serialized_image) {
            src = `data:${att.mime_type || 'image/jpeg'};base64,${att.serialized_image}`;
          }

          if (!src) return null;

          return (
            <Image
              key={index}
              src={src}
              width={100}
              style={{ borderRadius: 8, objectFit: 'cover' }}
              alt="attachment"
            />
          );
        })}
      </div>
    );
  };

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
              {renderAttachments()}
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
              {renderAttachments()}
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

