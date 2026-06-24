import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { Layout, Spin } from 'antd';

export default function AuthLayout() {
  return (
    <Layout style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <Suspense fallback={<Spin size="large" />}>
        <Outlet />
      </Suspense>
    </Layout>
  );
}
