import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import {
  alpha,
  AppBar,
  Autocomplete,
  Avatar,
  Box,
  Button,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Drawer,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Toolbar,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { navItems } from '../constants/navItems';
import { useAuth } from '../context/AuthContext';
import { useMemo, useState } from 'react';
import i18n from 'i18next';
import { useTranslation } from 'react-i18next';
import { useNotification } from '../context/NotificationContext';
import { recordSearchQuery } from '../utils/searchHistory';

const drawerWidth = 292;

const getGlobalSearchKeywords = (): Record<string, string[]> => ({
  '/dashboard': [i18n.t('search.dashboard').toLowerCase()],
  '/teacher-types': [i18n.t('search.teacherTypes').toLowerCase()],
  '/positions': [i18n.t('search.positions').toLowerCase()],
  '/teacher-statuses': [i18n.t('search.teacherStatuses').toLowerCase()],
  '/workload': [i18n.t('search.workload').toLowerCase()],
  '/study-forms': [i18n.t('search.studyForms').toLowerCase()],
  '/education-levels': [i18n.t('search.educationLevels').toLowerCase()],
  '/archive': [i18n.t('search.archive').toLowerCase()],
  '/roles': [i18n.t('search.roles').toLowerCase()],
  '/settings': [i18n.t('search.settings').toLowerCase()],
});

export function AppLayout() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileEmail, setProfileEmail] = useState('');
  const [profileLogin, setProfileLogin] = useState('');
  const [profilePassword, setProfilePassword] = useState('');
  const [profilePasswordConfirm, setProfilePasswordConfirm] = useState('');
  const [showProfilePassword, setShowProfilePassword] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const { profile, signOut, updateProfile } = useAuth();
  const { showSuccess, showError } = useNotification();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');

  const globalSearchOptions = useMemo(
    () =>
      navItems.map((item) => {
        const label = t(item.labelKey);
        const keywords = [label, item.path, ...(getGlobalSearchKeywords()[item.path] ?? [])];

        return {
          label,
          path: item.path,
          searchText: keywords.join(' ').toLowerCase(),
        };
      }),
    [t],
  );

  const drawer = (
    <Sidebar
      width={drawerWidth}
      onNavigate={() => setMobileOpen(false)}
    />
  );

  const initials = profile?.login?.charAt(0)?.toUpperCase() ?? profile?.email?.charAt(0)?.toUpperCase() ?? 'A';

  const handleGlobalSearchNavigate = (path: string, query = globalSearchQuery) => {
    recordSearchQuery(query, t('layout.searchPlaceholder'));
    setGlobalSearchQuery('');
    navigate(path);
  };

  const openProfileDialog = () => {
    setProfileEmail(profile?.email ?? '');
    setProfileLogin(profile?.login ?? '');
    setProfilePassword('');
    setProfilePasswordConfirm('');
    setShowProfilePassword(false);
    setProfileOpen(true);
  };

  const handleSaveProfile = async () => {
    const nextPassword = profilePassword.trim();

    if (nextPassword && nextPassword.length < 6) {
      showError(t('message.passwordTooShort'));
      return;
    }

    if (nextPassword !== profilePasswordConfirm.trim()) {
      showError(t('message.passwordsDontMatch'));
      return;
    }

    setSavingProfile(true);

    try {
      await updateProfile({
        email: profileEmail,
        login: profileLogin,
        password: nextPassword || undefined,
      });
      showSuccess(t('message.profileUpdated'));
      setProfileOpen(false);
    } catch (error) {
      const message =
        error && typeof error === 'object' && 'message' in error
          ? String((error as { message: string }).message)
          : t('error.profileUpdate');
      showError(message);
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar
        position="fixed"
        color="inherit"
        elevation={0}
        sx={{
          borderBottom: '1px solid',
          borderColor: 'divider',
          width: { lg: `calc(100% - ${drawerWidth}px)` },
          ml: { lg: `${drawerWidth}px` },
          bgcolor: alpha(theme.palette.background.paper, 0.92),
          backdropFilter: 'blur(14px)',
        }}
      >
        <Toolbar sx={{ gap: 2, minHeight: 72 }}>
          {!isDesktop && (
            <IconButton
              aria-label={t('layout.openMenu')}
              onClick={() => setMobileOpen(true)}
              edge="start"
            >
              <MenuIcon />
            </IconButton>
          )}

          <Autocomplete
            freeSolo
            clearOnBlur={false}
            inputValue={globalSearchQuery}
            options={globalSearchOptions}
            filterOptions={(options) => {
              const normalizedQuery = globalSearchQuery.trim().toLowerCase();

              if (!normalizedQuery) {
                return options;
              }

              return options.filter((option) => option.searchText.includes(normalizedQuery));
            }}
            getOptionLabel={(option) => (typeof option === 'string' ? option : option.label)}
            noOptionsText={t('layout.noResults')}
            onInputChange={(_, value) => setGlobalSearchQuery(value)}
            onChange={(_, option) => {
              if (option && typeof option !== 'string') {
                handleGlobalSearchNavigate(option.path, option.label);
              }
            }}
            size="small"
            sx={{ maxWidth: 420, flex: 1, display: { xs: 'none', sm: 'block' } }}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder={t('layout.searchPlaceholder')}
                onKeyDown={(event) => {
                  if (event.key !== 'Enter') {
                    return;
                  }

                  const normalizedQuery = globalSearchQuery.trim().toLowerCase();
                  const firstMatch = globalSearchOptions.find((option) =>
                    option.searchText.includes(normalizedQuery),
                  );

                  if (normalizedQuery && firstMatch) {
                    event.preventDefault();
                    handleGlobalSearchNavigate(firstMatch.path);
                  }
                }}
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <>
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" />
                      </InputAdornment>
                      {params.InputProps.startAdornment}
                    </>
                  ),
                }}
              />
            )}
            renderOption={(props, option) => (
              <Box component="li" {...props} key={option.path}>
                <SearchIcon fontSize="small" sx={{ mr: 1.5, color: 'text.secondary' }} />
                <Box>
                  <Typography variant="body2" fontWeight={700}>
                    {option.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {option.path}
                  </Typography>
                </Box>
              </Box>
            )}
          />

          <Box sx={{ flexGrow: 1 }} />

          <Button
            variant="outlined"
            size="small"
            startIcon={<LogoutIcon />}
            onClick={() => {
              void signOut().then(() => navigate('/login', { replace: true }));
            }}
            sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
          >
            {t('layout.logout')}
          </Button>

          <Divider flexItem orientation="vertical" sx={{ display: { xs: 'none', sm: 'block' } }} />

          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
            onClick={openProfileDialog}
            sx={{
              cursor: 'pointer',
              borderRadius: 2,
              px: 1,
              py: 0.75,
              '&:hover': {
                bgcolor: alpha(theme.palette.text.primary, 0.06),
              },
            }}
          >
            <Avatar sx={{ bgcolor: 'primary.main', width: 38, height: 38 }}>{initials}</Avatar>
            <Box sx={{ display: { xs: 'none', md: 'block' } }}>
              <Typography variant="body2" fontWeight={700}>
                {profile?.login || t('layout.administrator')}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {profile?.email ?? 'admin'}
              </Typography>
            </Box>
          </Stack>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { lg: drawerWidth }, flexShrink: { lg: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', lg: 'none' },
            '& .MuiDrawer-paper': { width: drawerWidth, border: 'none' },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', lg: 'block' },
            '& .MuiDrawer-paper': { width: drawerWidth, border: 'none' },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          width: { lg: `calc(100% - ${drawerWidth}px)` },
          pt: '96px',
          px: { xs: 2, sm: 3, xl: 4 },
          pb: 4,
        }}
      >
        <Outlet />
      </Box>

      <Dialog open={profileOpen} onClose={() => setProfileOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>{t('profile.title')}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <TextField
              label={t('profile.email')}
              type="email"
              value={profileEmail}
              onChange={(event) => setProfileEmail(event.target.value)}
              fullWidth
              required
            />
            <TextField
              label={t('profile.login')}
              value={profileLogin}
              onChange={(event) => setProfileLogin(event.target.value)}
              fullWidth
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <ManageAccountsIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              label={t('profile.newPassword')}
              type={showProfilePassword ? 'text' : 'password'}
              value={profilePassword}
              onChange={(event) => setProfilePassword(event.target.value)}
              fullWidth
              helperText={t('profile.passwordHint')}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={showProfilePassword ? t('login.hidePassword') : t('login.showPassword')}
                      onClick={() => setShowProfilePassword((current) => !current)}
                      edge="end"
                    >
                      {showProfilePassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              label={t('profile.confirmPassword')}
              type={showProfilePassword ? 'text' : 'password'}
              value={profilePasswordConfirm}
              onChange={(event) => setProfilePasswordConfirm(event.target.value)}
              fullWidth
              disabled={!profilePassword}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setProfileOpen(false)} disabled={savingProfile}>
            {t('confirm.cancel')}
          </Button>
          <Button variant="contained" onClick={() => void handleSaveProfile()} disabled={savingProfile}>
            {t('confirm.confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
