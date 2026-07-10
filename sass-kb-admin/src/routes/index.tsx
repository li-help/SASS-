import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy } from 'react';
import MainLayout from '@/layouts/MainLayout';
import AuthLayout from '@/layouts/AuthLayout';
import AuthGuard from './AuthGuard';
import ErrorPage from '@/pages/error-page';

const LoginPage = lazy(() => import('@/pages/login'));
const RegisterPage = lazy(() => import('@/pages/register'));
const OnboardingPage = lazy(() => import('@/pages/onboarding'));
const OnboardingStatusPage = lazy(() => import('@/pages/onboarding-status'));
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
const CoursePage = lazy(() => import('@/pages/course'));
const CourseCategoryPage = lazy(() => import('@/pages/course-category'));
const CourseChapterPage = lazy(() => import('@/pages/course-chapter'));
const TeacherPage = lazy(() => import('@/pages/teacher'));

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    errorElement: <ErrorPage />,
    children: [
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'onboarding', element: <OnboardingPage /> },
      { path: 'onboarding-status', element: <OnboardingStatusPage /> },
    ],
  },
  {
    path: '/',
    errorElement: <ErrorPage />,
    element: (
      <AuthGuard>
        <MainLayout />
      </AuthGuard>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', handle: { breadcrumb: '仪表盘' }, element: <DashboardPage /> },
      { path: 'tenant', handle: { breadcrumb: '租户管理' }, element: <TenantPage /> },
      { path: 'user', handle: { breadcrumb: '用户管理' }, element: <UserPage /> },
      { path: 'file', handle: { breadcrumb: '文件管理' }, element: <FilePage /> },
      { path: 'role', handle: { breadcrumb: '角色管理' }, element: <RolePage /> },
      { path: 'onboarding-review', handle: { breadcrumb: '入驻审核' }, element: <OnboardingReviewPage /> },
      { path: 'menu', handle: { breadcrumb: '菜单管理' }, element: <MenuPage /> },
      { path: 'file/:id/preview', handle: { breadcrumb: '文件预览' }, element: <FilePreviewPage /> },
      { path: 'profile', handle: { breadcrumb: '个人中心' }, element: <ProfilePage /> },
      { path: 'audit', handle: { breadcrumb: '审计日志' }, element: <AuditPage /> },
      { path: 'course', handle: { breadcrumb: '课程管理' }, element: <CoursePage /> },
      { path: 'course-category', handle: { breadcrumb: '课程分类' }, element: <CourseCategoryPage /> },
      { path: 'course-chapter', handle: { breadcrumb: '章节管理' }, element: <CourseChapterPage /> },
      { path: 'teacher', handle: { breadcrumb: '讲师管理' }, element: <TeacherPage /> },
    ],
  },
]);
