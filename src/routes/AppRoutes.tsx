import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { AppLayout } from '../layouts/AppLayout';
import { LoadingOverlay } from '../components/LoadingOverlay';

const LoginPage = lazy(() => import('../pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const DashboardPage = lazy(() => import('../pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const DirectoryPage = lazy(() => import('../pages/DirectoryPage').then((m) => ({ default: m.DirectoryPage })));
const ArchivePage = lazy(() => import('../pages/ArchivePage').then((m) => ({ default: m.ArchivePage })));
const RolesPage = lazy(() => import('../pages/RolesPage').then((m) => ({ default: m.RolesPage })));
const SchemaEditorPage = lazy(() => import('../pages/SchemaEditorPage').then((m) => ({ default: m.SchemaEditorPage })));
const SettingsPage = lazy(() => import('../pages/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));

const directoryRoutes = [
  '/teacher-types',
  '/positions',
  '/teacher-statuses',
  '/workload',
  '/study-forms',
  '/education-levels',
  '/faculties',
  '/departments',
];

export function AppRoutes() {
  return (
    <Suspense fallback={<LoadingOverlay />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            {directoryRoutes.map((path) => (
              <Route key={path} path={path} element={<DirectoryPage />} />
            ))}
            <Route path="/archive" element={<ArchivePage />} />
            <Route path="/roles" element={<RolesPage />} />
            <Route path="/schema" element={<SchemaEditorPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
