import type { SvgIconComponent } from '@mui/icons-material';
import type { TranslationKey } from '../i18n/translations';

export interface NavItem {
  labelKey: TranslationKey;
  path: string;
  icon: SvgIconComponent;
}
