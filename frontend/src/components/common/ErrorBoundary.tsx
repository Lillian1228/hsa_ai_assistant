import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Result, Button } from 'antd';
import { FrownOutlined } from '@ant-design/icons';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary Component
 * Capture JavaScript errors in the subtree of child components, record errors and display degraded UI
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state to display degraded UI in the next render
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Record error to error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Can send error to log service
    // logErrorToService(error, errorInfo);
  }

  handleReload = () => {
    // Reset error state
    this.setState({ hasError: false, error: null });
    // Refresh page
    window.location.reload();
  };

  handleGoHome = () => {
    // Reset error state
    this.setState({ hasError: false, error: null });
    // Jump to homepage
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '20px',
          }}
        >
          <Result
            status="error"
            icon={<FrownOutlined />}
            title="Oops, an error occurred!"
            subTitle="The application encountered an unexpected error, please try refreshing the page or returning to the homepage."
            extra={[
              <Button type="primary" key="reload" onClick={this.handleReload}>
                Refresh page
              </Button>,
              <Button key="home" onClick={this.handleGoHome}>
                Return to homepage
              </Button>,
            ]}
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '24px',
              padding: '40px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            }}
          >
            {import.meta.env.DEV && this.state.error && (
              <div
                style={{
                  marginTop: '20px',
                  padding: '16px',
                  background: '#f5f5f5',
                  borderRadius: '8px',
                  textAlign: 'left',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  overflow: 'auto',
                  maxHeight: '200px',
                }}
              >
                <strong>Error details (development mode):</strong>
                <pre style={{ margin: '8px 0 0 0', whiteSpace: 'pre-wrap' }}>
                  {this.state.error.toString()}
                </pre>
              </div>
            )}
          </Result>
        </div>
      );
    }

    return this.props.children;
  }
}

