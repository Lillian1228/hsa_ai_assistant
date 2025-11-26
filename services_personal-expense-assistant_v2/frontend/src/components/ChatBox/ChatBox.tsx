import React from 'react';
import { Typography, Space } from 'antd';
import { RobotOutlined } from '@ant-design/icons';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { useChat } from '@/hooks/useChat';
import './ChatBox.css';

const { Title, Text } = Typography;

/**
 * ChatBox Props
 */
interface ChatBoxProps {
  sessionId: string;
  userId: string;
}

/**
 * ChatBox Component
 * Global chat box, across all pages
 */
export const ChatBox: React.FC<ChatBoxProps> = ({ sessionId, userId }) => {
  const { messages, sendMessage, isLoading } = useChat(sessionId, userId);

  const handleSend = async (message: string) => {
    try {
      await sendMessage(message);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  return (
    <div className="chat-box">
      {/* Header */}
      <div className="chat-header">
        <Space align="center">
          <div className="chat-avatar">
            <RobotOutlined style={{ fontSize: 24, color: '#fff' }} />
          </div>
          <div>
            <Title level={4} style={{ margin: 0, fontSize: 18 }}>
              AI Assistant
            </Title>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Available for your service
            </Text>
          </div>
        </Space>
      </div>

      {/* Message list */}
      <div className="chat-messages">
        <MessageList messages={messages} loading={isLoading} />
      </div>

      {/* Input area */}
      <ChatInput onSend={handleSend} loading={isLoading} />
    </div>
  );
};

