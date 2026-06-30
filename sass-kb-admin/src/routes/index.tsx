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
const SpacePage = lazy(() => import('@/pages/space'));
const DocPage = lazy(() => import('@/pages/doc'));
const FilePage = lazy(() => import('@/pages/file'));
const RolePage = lazy(() => import('@/pages/role'));
const AuditPage = lazy(() => import('@/pages/audit'));
const PermissionPage = lazy(() => import('@/pages/permission'));
const OnboardingPage = lazy(() => import('@/pages/onboarding'));
const OnboardingReviewPage = lazy(() => import('@/pages/onboarding-review'));
const OnboardingStatusPage = lazy(() => import('@/pages/onboarding-status'));

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'onboarding', element: <OnboardingPage /> },
      { path: 'onboarding-status', element: <OnboardingStatusPage /> },
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
      { path: 'space', element: <SpacePage /> },
      { path: 'space/:spaceId', element: <DocPage /> },
      { path: 'space/:spaceId/doc/:docId', element: <DocPage /> },
      { path: 'doc/:docId', element: <DocPage /> },
      { path: 'file', element: <FilePage /> },
      { path: 'role', element: <RolePage /> },
      { path: 'audit', element: <AuditPage /> },
      { path: 'permission', element: <PermissionPage /> },
      { path: 'onboarding-review', element: <OnboardingReviewPage /> },
    ],
  },
]);
