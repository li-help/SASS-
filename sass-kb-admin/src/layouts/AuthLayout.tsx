import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { Spin } from 'antd';

export default function AuthLayout() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Spin size="large" />
      </div>
    }>
      <Outlet />
    </Suspense>
  );
}
