import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import {
  alpha,
  Alert,
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
import { useAppSettings } from '../context/AppSettingsContext';
import { useMemo, useState } from 'react';
import { useNotification } from '../context/NotificationContext';
import { recordSearchQuery } from '../utils/searchHistory';

const drawerWidth = 292;

const globalSearchKeywords: Record<string, string[]> = {
  '/dashboard': ['головна', 'панель', 'статистика', 'аналітика', 'історія пошуку'],
  '/teacher-types': ['типи', 'викладачі', 'тип викладача', 'довідник'],
  '/positions': ['посади', 'посада', 'кадри', 'довідник'],
  '/teacher-statuses': ['статуси', 'статус викладача', 'стани', 'довідник'],
  '/workload': ['навантаження', 'години', 'нормативи'],
  '/study-forms': ['форми навчання', 'форма', 'денна', 'заочна'],
  '/education-levels': ['рівні навчання', 'рівень', 'освіта'],
  '/archive': ['архів', 'видалені', 'архівування'],
  '/roles': ['ролі', 'доступ', 'права', 'користувачі'],
  '/settings': ['налаштування', 'мова', 'тема', 'режим'],
};

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
  const { t } = useAppSettings();
  const navigate = useNavigate();
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');

  const globalSearchOptions = useMemo(
    () =>
      navItems.map((item) => {
        const label = t(item.labelKey);
        const keywords = [label, item.path, ...(globalSearchKeywords[item.path] ?? [])];

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
    recordSearchQuery(query, 'Пошук по системі');
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
      showError('Новий пароль має містити щонайменше 6 символів.');
      return;
    }

    if (nextPassword !== profilePasswordConfirm.trim()) {
      showError('Паролі не збігаються.');
      return;
    }

    setSavingProfile(true);

    try {
      await updateProfile({
        email: profileEmail,
        login: profileLogin,
        password: nextPassword || undefined,
      });
      showSuccess('Профіль адміністратора оновлено.');
      setProfileOpen(false);
    } catch (error) {
      const message =
        error && typeof error === 'object' && 'message' in error
          ? String((error as { message: string }).message)
          : 'Не вдалося оновити профіль.';
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
              aria-label="Відкрити меню"
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
            noOptionsText="Нічого не знайдено"
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
                placeholder="Пошук по системі"
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
            Вийти
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
                {profile?.login || 'Адміністратор'}
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
        <DialogTitle>Профіль адміністратора</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <Alert severity="info">
              Тут можна змінити email і логін єдиного адміністратора. Supabase може попросити
              підтвердити новий email.
            </Alert>
            <TextField
              label="Email"
              type="email"
              value={profileEmail}
              onChange={(event) => setProfileEmail(event.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Логін"
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
              label="Новий пароль"
              type={showProfilePassword ? 'text' : 'password'}
              value={profilePassword}
              onChange={(event) => setProfilePassword(event.target.value)}
              fullWidth
              helperText="Залиште порожнім, якщо пароль змінювати не потрібно."
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={showProfilePassword ? 'Сховати пароль' : 'Показати пароль'}
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
              label="Повторіть новий пароль"
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
            Скасувати
          </Button>
          <Button variant="contained" onClick={() => void handleSaveProfile()} disabled={savingProfile}>
            Зберегти
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
