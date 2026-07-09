import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { AppLayout } from '../layouts/AppLayout';
import { ArchivePage } from '../pages/ArchivePage';
import { DashboardPage } from '../pages/DashboardPage';
import { EducationLevelsPage } from '../pages/directories/EducationLevelsPage';
import { LoginPage } from '../pages/LoginPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { PositionsPage } from '../pages/directories/PositionsPage';
import { RolesPage } from '../pages/RolesPage';
import { SettingsPage } from '../pages/SettingsPage';
import { StudyFormsPage } from '../pages/directories/StudyFormsPage';
import { TeacherStatusesPage } from '../pages/directories/TeacherStatusesPage';
import { TeacherTypesPage } from '../pages/directories/TeacherTypesPage';
import { WorkloadDirectoryPage } from '../pages/directories/WorkloadDirectoryPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/teacher-types" element={<TeacherTypesPage />} />
          <Route path="/positions" element={<PositionsPage />} />
          <Route path="/teacher-statuses" element={<TeacherStatusesPage />} />
          <Route path="/workload" element={<WorkloadDirectoryPage />} />
          <Route path="/study-forms" element={<StudyFormsPage />} />
          <Route path="/education-levels" element={<EducationLevelsPage />} />
          <Route path="/archive" element={<ArchivePage />} />
          <Route path="/roles" element={<RolesPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
