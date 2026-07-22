import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import LoginIcon from '@mui/icons-material/Login';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { FormEvent, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { isSupabaseConfigured } from '../lib/supabase/client';
import { getSupabaseErrorMessage } from '../utils/directory';

const LAST_LOGIN_EMAIL_KEY = 'academic-workload-admin:last-login-email';

function getStoredEmail() {
  try {
    return window.localStorage.getItem(LAST_LOGIN_EMAIL_KEY) ?? '';
  } catch {
    return '';
  }
}

function rememberEmail(email: string) {
  try {
    window.localStorage.setItem(LAST_LOGIN_EMAIL_KEY, email.trim());
  } catch {
    // Ignore unavailable storage. Login should not depend on browser settings.
  }
}

function forgetEmail() {
  try {
    window.localStorage.removeItem(LAST_LOGIN_EMAIL_KEY);
  } catch {
    // Ignore unavailable storage. Login should not depend on browser settings.
  }
}

export function LoginPage() {
  const { session, loading, signIn } = useAuth();
  const { showError } = useNotification();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState(getStoredEmail);
  const [password, setPassword] = useState('');
  const [rememberLogin, setRememberLogin] = useState(() => Boolean(getStoredEmail()));
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const redirectPath =
    (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/dashboard';

  if (!loading && session) {
    return <Navigate to={redirectPath} replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isSupabaseConfigured) {
      showError(t('login.notConfigured'));
      return;
    }

    setSubmitting(true);

    try {
      await signIn(email, password);

      if (rememberLogin) {
        rememberEmail(email);
      } else {
        forgetEmail();
      }

      navigate(redirectPath, { replace: true });
    } catch (error) {
      showError(getSupabaseErrorMessage(error, t('login.loginError')));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        bgcolor: 'background.default',
        px: 2,
      }}
    >
      <Card sx={{ width: '100%', maxWidth: 430 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h1" sx={{ mb: 1 }}>
            {t('login.title')}
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            {t('login.subtitle')}
          </Typography>

          {!isSupabaseConfigured && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {t('login.envWarning')}
            </Alert>
          )}

          {loading ? (
            <Box sx={{ display: 'grid', placeItems: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box component="form" onSubmit={(event) => void handleSubmit(event)}>
              <Stack spacing={2.5}>
                <TextField
                  label={t('login.email')}
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="username"
                  fullWidth
                  required
                />
                <TextField
                  label={t('login.password')}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label={showPassword ? t('login.hidePassword') : t('login.showPassword')}
                          onClick={() => setShowPassword((current) => !current)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  fullWidth
                  required
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={rememberLogin}
                      onChange={(event) => setRememberLogin(event.target.checked)}
                    />
                  }
                  label={t('login.rememberEmail')}
                />
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  startIcon={<LoginIcon />}
                  disabled={submitting}
                >
                  {submitting ? t('login.loggingIn') : t('login.loginButton')}
                </Button>
              </Stack>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
