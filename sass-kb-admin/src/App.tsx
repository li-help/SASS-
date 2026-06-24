import { RouterProvider } from 'react-router-dom';
import { App as AntApp } from 'antd';
import { router } from '@/routes';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function App() {
  return (
    <AntApp>
      <ErrorBoundary>
        <RouterProvider router={router} />
      </ErrorBoundary>
    </AntApp>
  );
}
