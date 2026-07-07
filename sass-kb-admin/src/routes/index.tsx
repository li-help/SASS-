import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy } from 'react';
import MainLayout from '@/layouts/MainLayout';
import AuthLayout from '@/layouts/AuthLayout';
import AuthGuard from './AuthGuard';

const LoginPage = lazy(() => import('@/pages/login'));
const RegisterPage = lazy(() => import('@/pages/register'));
const DashboardPage = lazy(() => import('@/pages/dashboard'));
const TenantPage = lazy(() => import('@/pages/tenant'));
const UserPage = lazy(() => import('@/pages/user'));
const FilePage = lazy(() => import('@/pages/file'));
const RolePage = lazy(() => import('@/pages/role'));
const OnboardingReviewPage = lazy(() => import('@/pages/onboarding-review'));
const MenuPage = lazy(() => import('@/pages/menu'));
const FilePreviewPage = lazy(() => import('@/pages/file/preview'));
const ProfilePage = lazy(() => import('@/pages/profile'));
const AuditPage = lazy(() => import('@/pages/audit'));

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
    ],
  },
  {
    path: '/',
    element: (
      <AuthGuard>
        <MainLayout />
      </AuthGuard>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'tenant', element: <TenantPage /> },
      { path: 'user', element: <UserPage /> },
      { path: 'file', element: <FilePage /> },
      { path: 'role', element: <RolePage /> },
      { path: 'onboarding-review', element: <OnboardingReviewPage /> },
      { path: 'menu', element: <MenuPage /> },
      { path: 'file/:id/preview', element: <FilePreviewPage /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'audit', element: <AuditPage /> },
    ],
  },
]);
