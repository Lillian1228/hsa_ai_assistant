import React from 'react';
import { Alert, Button } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';

/**
 * ErrorMessage Props
 */
interface ErrorMessageProps {
  error: Error | string | null;
  onRetry?: () => void;
  showRetry?: boolean;
  type?: 'error' | 'warning' | 'info';
}

/**
 * ErrorMessage Component
 * Display error information
 */
export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  error,
  onRetry,
  showRetry = true,
  type = 'error',
}) => {
  if (!error) return null;

  const errorMessage = typeof error === 'string' ? error : error.message;

  return (
    <Alert
      message="An error occurred"
      description={
        <div>
          <p>{errorMessage}</p>
          {showRetry && onRetry && (
            <Button
              type="link"
              icon={<ReloadOutlined />}
              onClick={onRetry}
              style={{ paddingLeft: 0 }}
            >
              重试
            </Button>
          )}
        </div>
      }
      type={type}
      showIcon
      style={{ marginTop: 16 }}
    />
  );
};

