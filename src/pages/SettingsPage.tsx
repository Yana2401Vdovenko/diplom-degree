import ArchiveOutlinedIcon from '@mui/icons-material/ArchiveOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CodeIcon from '@mui/icons-material/Code';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import SecurityIcon from '@mui/icons-material/Security';
import SettingsIcon from '@mui/icons-material/Settings';
import StorageIcon from '@mui/icons-material/Storage';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  FormControlLabel,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Switch,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import type { PaletteMode } from '@mui/material';
import i18n from 'i18next';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../components/PageHeader';
import { rolePermissionTables } from '../config/rolePermissionTables';
import { useAppSettings } from '../context/AppSettingsContext';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured, supabaseProjectUrl } from '../lib/supabase/client';
import {
  runSystemDiagnostics,
  type DiagnosticCheck,
} from '../services/system.service';

const sqlSetupPath = 'supabase/sql/rls-roles.sql';

function maskProjectUrl(url: string) {
  if (!url) {
    return '—';
  }

  try {
    const parsed = new URL(url);
    return parsed.hostname;
  } catch {
    return url;
  }
}

interface StatusLineProps {
  label: string;
  value: string;
  ok: boolean;
}

function StatusLine({ label, value, ok }: StatusLineProps) {
  return (
    <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="space-between">
      <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
        {ok ? (
          <CheckCircleOutlineIcon color="success" fontSize="small" />
        ) : (
          <WarningAmberIcon color="warning" fontSize="small" />
        )}
        <Typography>{label}</Typography>
      </Stack>
      <Typography color="text.secondary" sx={{ textAlign: 'right' }}>
        {value}
      </Typography>
    </Stack>
  );
}

export function SettingsPage() {
  const { session } = useAuth();
  const {
    themeMode,
    setThemeMode,
    archiveCleanupMode,
    setArchiveCleanupMode,
    archiveRetentionDays,
    setArchiveRetentionDays,
  } = useAppSettings();
  const { t } = useTranslation();
  const currentLang = (i18n.language?.slice(0, 2) || 'uk') as 'uk' | 'en' | 'pl';
  const [diagnostics, setDiagnostics] = useState<DiagnosticCheck[]>([]);
  const [diagnosticsLoading, setDiagnosticsLoading] = useState(false);
  const tableGroups = rolePermissionTables.reduce<Record<string, number>>((accumulator, table) => {
    accumulator[table.group] = (accumulator[table.group] ?? 0) + 1;
    return accumulator;
  }, {});

  const handleRunDiagnostics = useCallback(async () => {
    setDiagnosticsLoading(true);

    try {
      const checks = await runSystemDiagnostics();
      setDiagnostics(checks);
    } finally {
      setDiagnosticsLoading(false);
    }
  }, []);

  useEffect(() => {
    void handleRunDiagnostics();
  }, [handleRunDiagnostics]);

  return (
    <>
      <PageHeader
        title={t('settings.title')}
        subtitle={t('settings.subtitle')}
      />

      <Stack spacing={2.5}>
        <Card variant="outlined">
          <CardContent>
            <Stack spacing={2.5}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2.5} alignItems="flex-start">
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack spacing={1}>
                    <Typography variant="h3">{t('settings.theme')}</Typography>
                    <ToggleButtonGroup
                      exclusive
                      value={themeMode}
                      onChange={(_event, value: PaletteMode | null) => {
                        if (value) {
                          setThemeMode(value);
                        }
                      }}
                      size="small"
                      color="primary"
                    >
                      <ToggleButton value="light">
                        <LightModeIcon fontSize="small" sx={{ mr: 1 }} />
                        {t('settings.light')}
                      </ToggleButton>
                      <ToggleButton value="dark">
                        <DarkModeIcon fontSize="small" sx={{ mr: 1 }} />
                        {t('settings.dark')}
                      </ToggleButton>
                    </ToggleButtonGroup>
                  </Stack>
                </Box>

                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack spacing={1.5}>
                    <Typography variant="h3">{t('settings.archiveCleanup')}</Typography>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                      <FormControlLabel
                        control={
                          <Switch
                            checked={archiveCleanupMode === 'auto'}
                            onChange={(event) =>
                              setArchiveCleanupMode(event.target.checked ? 'auto' : 'manual')
                            }
                          />
                        }
                        label={t('settings.autoClean')}
                      />
                      <TextField
                        label={t('settings.keepDays')}
                        type="number"
                        size="small"
                        value={archiveRetentionDays}
                        onChange={(event) => setArchiveRetentionDays(Number(event.target.value))}
                        sx={{ width: { xs: '100%', sm: 180 } }}
                        inputProps={{ min: 1 }}
                        disabled={archiveCleanupMode !== 'auto'}
                      />
                      <Chip
                        color={archiveCleanupMode === 'auto' ? 'success' : 'default'}
                        label={archiveCleanupMode === 'auto' ? t('settings.auto') : t('settings.manual')}
                      />
                    </Stack>
                  </Stack>
                </Box>
              </Stack>

              <Divider />

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2.5} alignItems="flex-start">
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack spacing={1}>
                    <Typography variant="h3">{t('settings.language')}</Typography>
                  </Stack>
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <ToggleButtonGroup
                    exclusive
                    value={currentLang}
                    onChange={(_event, value: 'uk' | 'en' | 'pl' | null) => {
                      if (value) {
                        void i18n.changeLanguage(value);
                      }
                    }}
                    size="small"
                    color="primary"
                  >
                    <ToggleButton value="uk">Українська</ToggleButton>
                    <ToggleButton value="en">English</ToggleButton>
                    <ToggleButton value="pl">Polski</ToggleButton>
                  </ToggleButtonGroup>
                </Box>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Stack spacing={2}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <StorageIcon color="primary" />
                <Box>
                  <Typography variant="h3">{t('settings.supabase')}</Typography>
                </Box>
              </Stack>

              <Divider />

              <StatusLine
                label=".env.local"
                value={isSupabaseConfigured ? t('settings.configured') : t('settings.needsKeys')}
                ok={isSupabaseConfigured}
              />
              <StatusLine
                label={t('settings.activeSession')}
                value={session ? t('settings.yes') : t('settings.no')}
                ok={Boolean(session)}
              />
              <StatusLine
                label={t('settings.project')}
                value={maskProjectUrl(supabaseProjectUrl)}
                ok={Boolean(supabaseProjectUrl)}
              />
              <StatusLine
                label={t('settings.edgeFunction')}
                value={t('settings.configured')}
                ok
              />

              <Divider />

              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1.5}
                alignItems={{ xs: 'stretch', sm: 'center' }}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h3">{t('settings.diagnostics')}</Typography>
                </Box>
                <Button
                  variant="outlined"
                  onClick={() => void handleRunDiagnostics()}
                  disabled={diagnosticsLoading}
                >
                  {diagnosticsLoading ? t('settings.checking') : t('settings.check')}
                </Button>
              </Stack>

              <Stack spacing={1}>
                {diagnostics.map((check) => (
                  <Alert key={check.key} severity={check.ok ? 'success' : 'error'}>
                    <Typography fontWeight={700}>{check.label}</Typography>
                    <Typography variant="body2">{check.message}</Typography>
                  </Alert>
                ))}
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2.5}>
          <Card sx={{ flex: 2, height: '100%' }}>
            <CardContent>
              <Stack spacing={2}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <SecurityIcon color="primary" />
                  <Box>
                    <Typography variant="h3">{t('settings.tablesAndPolicies')}</Typography>
                  </Box>
                </Stack>

                <TableContainer sx={{ maxHeight: 430 }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>{t('settings.table')}</TableCell>
                        <TableCell>{t('settings.group')}</TableCell>
                        <TableCell align="right">{t('settings.actions')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {rolePermissionTables.map((table) => (
                        <TableRow key={table.tableName} hover>
                          <TableCell>
                            <Typography fontWeight={700}>{table.label}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {table.tableName}
                            </Typography>
                          </TableCell>
                          <TableCell>{table.group}</TableCell>
                          <TableCell align="right">
                            <Chip size="small" variant="outlined" label="read/create/update/delete" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Stack>
            </CardContent>
          </Card>

          <Card sx={{ flex: 1, height: '100%' }}>
            <CardContent>
              <Stack spacing={2}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <SettingsIcon color="primary" />
                  <Box>
                    <Typography variant="h3">{t('settings.accessStructure')}</Typography>
                  </Box>
                </Stack>

                <Divider />

                <Stack spacing={1.25}>
                  {Object.entries(tableGroups).map(([group, count]) => (
                    <Stack
                      key={group}
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      justifyContent="space-between"
                    >
                      <Typography>{group}</Typography>
                      <Chip size="small" variant="outlined" label={`${count} ${t('settings.tablesCount')}`} />
                    </Stack>
                  ))}
                </Stack>

                <Alert severity="success">
                  {t('settings.tablesInRoles', { count: rolePermissionTables.length })}
                </Alert>
              </Stack>
            </CardContent>
          </Card>
        </Stack>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2.5}>
          <Card sx={{ flex: 7, height: '100%' }}>
            <CardContent>
              <Stack spacing={2}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <CodeIcon color="primary" />
                  <Box>
                    <Typography variant="h3">{t('settings.crudSupabase')}</Typography>
                  </Box>
                </Stack>

                <List dense disablePadding>
                  {([
                    'crudLayers.rolePermissions',
                    'crudLayers.currentAppRole',
                    'crudLayers.hasPermission',
                    'crudLayers.rls',
                    'crudLayers.views',
                  ] as const).map((key) => (
                    <ListItem key={key} disableGutters alignItems="flex-start">
                      <ListItemIcon sx={{ minWidth: 34, pt: 0.5 }}>
                        <CheckCircleOutlineIcon color="success" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText
                        primary={t(`${key}.title`)}
                        secondary={t(`${key}.description`)}
                        primaryTypographyProps={{ fontWeight: 700 }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Stack>
            </CardContent>
          </Card>

          <Card sx={{ flex: 5, height: '100%' }}>
            <CardContent>
              <Stack spacing={2}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <ArchiveOutlinedIcon color="primary" />
                  <Box>
                    <Typography variant="h3">{t('settings.archive')}</Typography>
                  </Box>
                </Stack>

                <List dense disablePadding>
                  {(['archiveRules.1', 'archiveRules.2', 'archiveRules.3'] as const).map((key) => (
                    <ListItem key={key} disableGutters alignItems="flex-start">
                      <ListItemIcon sx={{ minWidth: 34, pt: 0.5 }}>
                        <CheckCircleOutlineIcon color="success" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary={t(key)} />
                    </ListItem>
                  ))}
                </List>
              </Stack>
            </CardContent>
          </Card>
        </Stack>

        <Card variant="outlined">
          <CardContent>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
              <CodeIcon color="primary" />
              <Box sx={{ flex: 1 }}>
                <Typography variant="h3">{t('settings.sqlForSupabase')}</Typography>
              </Box>
              <Chip label={sqlSetupPath} variant="outlined" color="primary" />
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </>
  );
}
