import React from 'react';
import { Spin, Space } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

/**
 * Loading Props
 */
interface LoadingProps {
  size?: 'small' | 'default' | 'large';
  tip?: string;
  fullscreen?: boolean;
}

/**
 * Loading Component
 * Display loading animation
 */
export const Loading: React.FC<LoadingProps> = ({
  size = 'default',
  tip,
  fullscreen = false,
}) => {
  const icon = <LoadingOutlined style={{ fontSize: 24 }} spin />;

  if (fullscreen) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          zIndex: 9999,
        }}
      >
        <Space direction="vertical" align="center">
          <Spin indicator={icon} size={size} />
          {tip && <span style={{ color: '#666' }}>{tip}</span>}
        </Space>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <Space direction="vertical" align="center">
        <Spin indicator={icon} size={size} />
        {tip && <span style={{ color: '#666' }}>{tip}</span>}
      </Space>
    </div>
  );
};

