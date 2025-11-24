import { createBrowserRouter } from 'react-router-dom';
import { HomePage, ReviewPage, SummaryPage } from '@/pages';
import { TestPage } from '@/pages/TestPage';

/**
 * Application routing configuration
 */
export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <HomePage />,
    },
    {
      path: '/review',
      element: <ReviewPage />,
    },
    {
      path: '/summary',
      element: <SummaryPage />,
    },
    {
      path: '/test',
      element: <TestPage />,
    },
  ],
  {
    future: {
      v7_startTransition: true,
    },
  }
);

