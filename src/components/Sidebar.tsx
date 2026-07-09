import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import {
  alpha,
  Box,
  Chip,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { NavLink } from 'react-router-dom';
import { navItems } from '../constants/navItems';
import { useAppSettings } from '../context/AppSettingsContext';
import { isSupabaseConfigured } from '../lib/supabase/client';

interface SidebarProps {
  width: number;
  onNavigate?: () => void;
}

export function Sidebar({ width, onNavigate }: SidebarProps) {
  const theme = useTheme();
  const { t } = useAppSettings();

  return (
    <Box
      sx={{
        width,
        minHeight: '100%',
        bgcolor: 'background.paper',
        borderRight: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ px: 2.5, py: 2.5 }}>
        <Box
          sx={{
            width: 42,
            height: 42,
            borderRadius: 2,
            display: 'grid',
            placeItems: 'center',
            color: '#ffffff',
            bgcolor: 'primary.main',
          }}
        >
          <AutoStoriesIcon />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle1" fontWeight={800} noWrap>
            Панель адміністратора
          </Typography>
        </Box>
      </Stack>

      <List sx={{ px: 1.5, py: 1, overflowY: 'auto', flex: 1 }}>
        {navItems.map((item) => {
          const Icon = item.icon;

          return (
            <ListItemButton
              key={item.path}
              component={NavLink}
              to={item.path}
              onClick={onNavigate}
              sx={{
                mb: 0.4,
                borderRadius: 2,
                color: 'text.secondary',
                '& .MuiListItemIcon-root': {
                  color: 'inherit',
                  minWidth: 38,
                },
                '&.active': {
                  color: 'primary.main',
                  bgcolor: alpha(theme.palette.primary.main, 0.12),
                  fontWeight: 700,
                },
                '&:hover': {
                  bgcolor: alpha(theme.palette.text.primary, 0.06),
                },
              }}
            >
              <ListItemIcon>
                <Icon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={t(item.labelKey)}
                primaryTypographyProps={{
                  fontSize: 14,
                  fontWeight: 700,
                  noWrap: true,
                }}
              />
            </ListItemButton>
          );
        })}
      </List>

      <Box sx={{ p: 2 }}>
        <Chip
          label={isSupabaseConfigured ? 'Supabase' : 'Потрібен .env.local'}
          color={isSupabaseConfigured ? 'success' : 'warning'}
          variant="outlined"
          size="small"
          sx={{ fontWeight: 700 }}
        />
      </Box>
    </Box>
  );
}
