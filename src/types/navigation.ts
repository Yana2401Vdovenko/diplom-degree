import type { SvgIconComponent } from '@mui/icons-material';

export interface NavItem {
  labelKey: string;
  path: string;
  icon: SvgIconComponent;
}

export interface NavSection {
  type: 'header';
  labelKey: string;
}

export type NavEntry = NavItem | NavSection;
