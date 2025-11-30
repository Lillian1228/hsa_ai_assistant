import { createBrowserRouter } from 'react-router-dom';
import { HomePage, ReviewPage, SummaryPage } from '@/pages';

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
  ]
);

