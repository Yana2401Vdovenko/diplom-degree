import ArchiveIcon from '@mui/icons-material/Archive';
import CategoryIcon from '@mui/icons-material/Category';
import DashboardIcon from '@mui/icons-material/Dashboard';
import DatasetIcon from '@mui/icons-material/Dataset';
import GroupsIcon from '@mui/icons-material/Groups';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import SchemaIcon from '@mui/icons-material/Schema';
import SchoolIcon from '@mui/icons-material/School';
import SecurityIcon from '@mui/icons-material/Security';
import SettingsIcon from '@mui/icons-material/Settings';
import TimelapseIcon from '@mui/icons-material/Timelapse';
import WorkIcon from '@mui/icons-material/Work';
import type { NavEntry } from '../types/navigation';

export const navItems: NavEntry[] = [
  { labelKey: 'nav.dashboard', path: '/dashboard', icon: DashboardIcon },
  { type: 'header', labelKey: 'nav.sectionDirectories' },
  { labelKey: 'nav.faculties', path: '/faculties', icon: SchoolIcon },
  { labelKey: 'nav.departments', path: '/departments', icon: LocationCityIcon },
  { labelKey: 'nav.teacherTypes', path: '/teacher-types', icon: GroupsIcon },
  { labelKey: 'nav.positions', path: '/positions', icon: WorkIcon },
  { labelKey: 'nav.teacherStatuses', path: '/teacher-statuses', icon: ManageAccountsIcon },
  { labelKey: 'nav.workload', path: '/workload', icon: TimelapseIcon },
  { labelKey: 'nav.studyForms', path: '/study-forms', icon: CategoryIcon },
  { labelKey: 'nav.educationLevels', path: '/education-levels', icon: DatasetIcon },
  { type: 'header', labelKey: 'nav.sectionSystem' },
  { labelKey: 'nav.schema', path: '/schema', icon: SchemaIcon },
  { labelKey: 'nav.roles', path: '/roles', icon: SecurityIcon },
  { labelKey: 'nav.archive', path: '/archive', icon: ArchiveIcon },
  { labelKey: 'nav.settings', path: '/settings', icon: SettingsIcon },
];
