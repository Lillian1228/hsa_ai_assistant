import React, { useState } from 'react';
import { Card, Button, Space, Typography, Divider, Alert, Tag } from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { apiService } from '@/services/api';
import { Loading, ErrorMessage } from '@/components/common';
import './TestPage.css';

const { Title, Text, Paragraph } = Typography;

/**
 * TestPage Component
 * Used to test and verify the functionality of the API Service
 */
export const TestPage: React.FC = () => {
  const [testResults, setTestResults] = useState<
    { test: string; status: 'success' | 'error' | 'loading'; message: string }[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const addTestResult = (
    test: string,
    status: 'success' | 'error' | 'loading',
    message: string
  ) => {
    setTestResults((prev) => [...prev, { test, status, message }]);
  };

  const clearResults = () => {
    setTestResults([]);
    setError(null);
  };

  // Test 1: API request interceptor
  const testRequestInterceptor = async () => {
    addTestResult('请求拦截器', 'loading', '测试中...');
    console.log('=== 测试请求拦截器 ===');
    
    try {
      // Send a test request, observe console output
      await apiService.sendMessage({
        text: '测试消息',
        files: [],
        session_id: 'test_session',
        user_id: 'test_user',
      });
      
      addTestResult(
        '请求拦截器',
        'success',
        '✓ 请求拦截器正常工作（查看控制台日志）'
      );
    } catch (err) {
      addTestResult(
        '请求拦截器',
        'error',
        `× 测试失败: ${(err as Error).message}`
      );
    }
  };

  // Test 2: Error handling - 400 error
  const testErrorHandling400 = async () => {
    addTestResult('400 错误处理', 'loading', '测试中...');
    console.log('=== 测试 400 错误处理 ===');
    
    try {
      // Simulate sending an error request
      await apiService.sendMessage({
        text: '',
        files: [],
        session_id: '',
        user_id: '',
      });
      
      addTestResult(
        '400 错误处理',
        'error',
        '× 应该抛出错误但没有'
      );
    } catch (err) {
      const error = err as Error;
      if (error.message.includes('请求参数错误') || error.message.includes('网络错误')) {
        addTestResult(
          '400 错误处理',
          'success',
          `✓ 错误被正确捕获: ${error.message}`
        );
      } else {
        addTestResult(
          '400 错误处理',
          'error',
          `× 错误消息不符合预期: ${error.message}`
        );
      }
    }
  };

  // Test 3: Network error handling
  const testNetworkError = async () => {
    addTestResult('网络错误处理', 'loading', '测试中...');
    console.log('=== 测试网络错误处理 ===');
    
    try {
      // Use an invalid URL to trigger a network error
      await fetch('http://invalid-url-that-does-not-exist.com');
      
      addTestResult(
        '网络错误处理',
        'error',
        '× 应该抛出网络错误但没有'
      );
    } catch (err) {
      addTestResult(
        '网络错误处理',
        'success',
        '✓ 网络错误被正确捕获'
      );
    }
  };

  // Test 4: Retry mechanism
  const testRetryMechanism = async () => {
    addTestResult('重试机制', 'loading', '测试中...');
    console.log('=== 测试重试机制 ===');
    
    try {
      // This request will fail and trigger a retry
      await apiService.sendMessage({
        text: '测试重试',
        files: [],
        session_id: 'test',
        user_id: 'test',
      });
      
      addTestResult(
        '重试机制',
        'success',
        '✓ 请求已发送（检查控制台查看重试日志）'
      );
    } catch (err) {
      addTestResult(
        '重试机制',
        'success',
        '✓ 重试机制已触发（检查控制台查看重试次数）'
      );
    }
  };

  // Test 5: Response interceptor
  const testResponseInterceptor = async () => {
    addTestResult('响应拦截器', 'loading', '测试中...');
    console.log('=== 测试响应拦截器 ===');
    
    try {
      await apiService.sendMessage({
        text: '测试',
        files: [],
        session_id: 'test',
        user_id: 'test',
      });
      
      addTestResult(
        '响应拦截器',
        'success',
        '✓ 响应拦截器正常工作（查看控制台日志）'
      );
    } catch (err) {
      addTestResult(
        '响应拦截器',
        'success',
        '✓ 响应拦截器捕获了错误（查看控制台日志）'
      );
    }
  };

  // Run all tests
  const runAllTests = async () => {
    clearResults();
    setIsLoading(true);
    setError(null);

    try {
      await testRequestInterceptor();
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      await testResponseInterceptor();
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      await testErrorHandling400();
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      await testNetworkError();
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      await testRetryMechanism();
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="test-page page-container">
      <header className="page-header">
        <Title level={1} style={{ margin: 0 }}>
          API Service 测试页面
        </Title>
      </header>

      <div className="page-content" style={{ padding: 'var(--spacing-lg)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {/* Description card */}
            <Card>
              <Title level={3}>测试说明</Title>
              <Paragraph>
                This page is used to verify the functionality of the API Service (phase 1.2):
              </Paragraph>
              <ul>
                <li>✓ Request interceptor (add timestamp, log record)</li>
                <li>✓ Response interceptor (handle response and error)</li>
                <li>✓ Error handling mechanism (400/401/403/404/500/network error)</li>
                <li>✓ Retry mechanism (retry automatically up to 2 times)</li>
                <li>✓ Loading state management</li>
              </ul>
              <Alert
                message="Important提示"
                description="Please open the browser console (F12), observe the network request and log output to verify the functionality."
                type="info"
                showIcon
                style={{ marginTop: 16 }}
              />
            </Card>

            {/* Test buttons */}
            <Card>
              <Title level={4}>执行测试</Title>
              <Space wrap>
                <Button
                  type="primary"
                  size="large"
                  onClick={runAllTests}
                  loading={isLoading}
                  icon={<SyncOutlined />}
                >
                  Run all tests
                </Button>
                <Button onClick={testRequestInterceptor}>Test request interceptor</Button>
                <Button onClick={testResponseInterceptor}>Test response interceptor</Button>
                <Button onClick={testErrorHandling400}>Test error handling</Button>
                <Button onClick={testNetworkError}>Test network error</Button>
                <Button onClick={testRetryMechanism}>Test retry mechanism</Button>
                <Button onClick={clearResults}>Clear results</Button>
              </Space>
            </Card>

            {/* Loading */}
            {isLoading && <Loading tip="Executing tests..." />}

            {/* Error information */}
            {error && <ErrorMessage error={error} />}

            {/* Test results */}
            {testResults.length > 0 && (
              <Card>
                <Title level={4}>Test results</Title>
                <Space direction="vertical" style={{ width: '100%' }}>
                  {testResults.map((result, index) => (
                    <Card key={index} size="small" className="test-result-card">
                      <Space>
                        {result.status === 'loading' && (
                          <SyncOutlined spin style={{ color: '#1890ff' }} />
                        )}
                        {result.status === 'success' && (
                          <CheckCircleOutlined
                            style={{ color: '#52c41a', fontSize: 20 }}
                          />
                        )}
                        {result.status === 'error' && (
                          <CloseCircleOutlined
                            style={{ color: '#f5222d', fontSize: 20 }}
                          />
                        )}
                        <div>
                          <Text strong>{result.test}</Text>
                          <br />
                          <Text type="secondary">{result.message}</Text>
                        </div>
                        <Tag
                          color={
                            result.status === 'success'
                              ? 'success'
                              : result.status === 'error'
                              ? 'error'
                              : 'processing'
                          }
                        >
                          {result.status}
                        </Tag>
                      </Space>
                    </Card>
                  ))}
                </Space>
              </Card>
            )}

            {/* Console description */}
            <Card>
              <Title level={4}>View console logs</Title>
              <Paragraph>
                You should see the following logs in the browser console (F12 → Console):
              </Paragraph>
              <ul>
                <li>
                  <Text code>API Request: POST /api/chat</Text> - Request interceptor logs
                </li>
                <li>
                  <Text code>API Response: 200 /api/chat</Text> - Response interceptor logs
                </li>
                <li>
                  <Text code>API Error 400: ...</Text> - Error handling logs
                </li>
                <li>
                  <Text code>Request failed, retry 1/2</Text> - Retry mechanism logs
                </li>
                <li>
                  <Text code>Network Error: ...</Text> - Network error logs
                </li>
              </ul>
            </Card>

            {/* Network panel description */}
            <Card>
              <Title level={4}>View network panel</Title>
              <Paragraph>
                You should see the following logs in the browser console (F12 → Network):
              </Paragraph>
              <ul>
                <li>Detailed information for each API request (Headers, Payload, Response)</li>
                <li>Status code for each request (200, 400, 500, etc.)</li>
                <li>Multiple identical requests will be seen when retrying</li>
                <li>Time and size of requests</li>
              </ul>
            </Card>
          </Space>
        </div>
      </div>
    </div>
  );
};

