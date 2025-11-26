import { RouterProvider } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import { router } from './router';
import { antdTheme } from './styles/theme';
import { ErrorBoundary } from './components/common';

/**
 * App root component
 */
function App() {
  return (
    <ErrorBoundary>
      <ConfigProvider theme={antdTheme}>
        <RouterProvider router={router} />
      </ConfigProvider>
    </ErrorBoundary>
  );
}

export default App;

