import ArchiveIcon from '@mui/icons-material/Archive';
import CategoryIcon from '@mui/icons-material/Category';
import DashboardIcon from '@mui/icons-material/Dashboard';
import DatasetIcon from '@mui/icons-material/Dataset';
import GroupsIcon from '@mui/icons-material/Groups';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import SecurityIcon from '@mui/icons-material/Security';
import SettingsIcon from '@mui/icons-material/Settings';
import TimelapseIcon from '@mui/icons-material/Timelapse';
import WorkIcon from '@mui/icons-material/Work';
import type { NavItem } from '../types/navigation';

export const navItems: NavItem[] = [
  { labelKey: 'nav.dashboard', path: '/dashboard', icon: DashboardIcon },
  { labelKey: 'nav.teacherTypes', path: '/teacher-types', icon: GroupsIcon },
  { labelKey: 'nav.positions', path: '/positions', icon: WorkIcon },
  { labelKey: 'nav.teacherStatuses', path: '/teacher-statuses', icon: ManageAccountsIcon },
  { labelKey: 'nav.workload', path: '/workload', icon: TimelapseIcon },
  { labelKey: 'nav.studyForms', path: '/study-forms', icon: CategoryIcon },
  { labelKey: 'nav.educationLevels', path: '/education-levels', icon: DatasetIcon },
  { labelKey: 'nav.archive', path: '/archive', icon: ArchiveIcon },
  { labelKey: 'nav.roles', path: '/roles', icon: SecurityIcon },
  { labelKey: 'nav.settings', path: '/settings', icon: SettingsIcon },
];
