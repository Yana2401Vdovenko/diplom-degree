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
  Grid,
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
import { useCallback, useEffect, useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { rolePermissionTables } from '../config/rolePermissionTables';
import { useAppSettings } from '../context/AppSettingsContext';
import { useAuth } from '../context/AuthContext';
import {
  languageLabels,
  type AppLanguage,
} from '../i18n/translations';
import { isSupabaseConfigured, supabaseProjectUrl } from '../lib/supabase/client';
import {
  runSystemDiagnostics,
  type DiagnosticCheck,
} from '../services/system.service';

const sqlSetupPath = 'supabase/sql/role-permissions-and-crud.sql';

const crudLayers = [
  {
    title: 'Таблиця role_permissions',
    description: 'Зберігає права ролей по кожній таблиці: перегляд, додавання, редагування, видалення.',
  },
  {
    title: 'Функція current_app_role()',
    description: 'Бере роль поточного користувача з JWT Supabase Auth.',
  },
  {
    title: 'Функція has_permission()',
    description: 'Дає єдину перевірку прав для RLS policies, views і triggers.',
  },
  {
    title: 'RLS policies',
    description: 'Блокують прямий доступ до таблиць, якщо роль не має потрібної дії.',
  },
  {
    title: 'Views + INSTEAD OF triggers',
    description: 'Дають контрольований шар для додавання, редагування і видалення записів.',
  },
];

const archiveRules = [
  'Архів зберігає назву таблиці, ключ запису, дані запису і адміністратора, який виконав дію.',
  'М’яке видалення краще робити через архівування, а остаточне видалення залишати тільки адміну.',
  'Відновлення має повертати запис у його початкову таблицю і прибирати запис з архіву.',
];

function maskProjectUrl(url: string) {
  if (!url) {
    return 'Не задано';
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
    language,
    setLanguage,
    t,
  } = useAppSettings();
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
        title="Загальні налаштування"
        subtitle="Центр керування адміном, Supabase, політиками доступу, архівом і SQL-рівнем CRUD."
      />

      <Stack spacing={2.5}>
        <Alert severity="info">
          У системі один адміністратор, тому профіль містить тільки email і логін. Права інших
          користувачів керуються ролями та політиками Supabase.
        </Alert>

        <Card variant="outlined">
          <CardContent>
            <Grid container spacing={2.5} alignItems="center">
              <Grid item xs={12} md={5}>
                <Stack spacing={1}>
                  <Typography variant="h3">Вигляд системи</Typography>
                  <Typography color="text.secondary">
                    Перемикач теми зберігається в браузері для цього пристрою.
                  </Typography>
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
                      Світла
                    </ToggleButton>
                    <ToggleButton value="dark">
                      <DarkModeIcon fontSize="small" sx={{ mr: 1 }} />
                      Темна
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Stack>
              </Grid>

              <Grid item xs={12} md={7}>
                <Stack spacing={1.5}>
                  <Typography variant="h3">Очищення архіву</Typography>
                  <Typography color="text.secondary">
                    Можна чистити архів вручну або автоматично видаляти записи після заданого строку.
                  </Typography>
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
                      label="Автоматично очищати архів"
                    />
                    <TextField
                      label="Зберігати, днів"
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
                      label={archiveCleanupMode === 'auto' ? 'Авто' : 'Вручну'}
                    />
                  </Stack>
                </Stack>
              </Grid>

              <Grid item xs={12}>
                <Divider />
              </Grid>

              <Grid item xs={12} md={5}>
                <Stack spacing={1}>
                  <Typography variant="h3">{t('settings.language')}</Typography>
                  <Typography color="text.secondary">{t('settings.languageHint')}</Typography>
                </Stack>
              </Grid>
              <Grid item xs={12} md={7}>
                <ToggleButtonGroup
                  exclusive
                  value={language}
                  onChange={(_event, value: AppLanguage | null) => {
                    if (value) {
                      setLanguage(value);
                    }
                  }}
                  size="small"
                  color="primary"
                >
                  {(Object.keys(languageLabels) as AppLanguage[]).map((key) => (
                    <ToggleButton key={key} value={key}>
                      {languageLabels[key]}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Grid container spacing={2.5}>
          <Grid item xs={12}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Stack spacing={2}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <StorageIcon color="primary" />
                    <Box>
                      <Typography variant="h3">Supabase</Typography>
                      <Typography color="text.secondary">Підключення, Auth і службові змінні</Typography>
                    </Box>
                  </Stack>

                  <Divider />

                  <StatusLine
                    label=".env.local"
                    value={isSupabaseConfigured ? 'налаштовано' : 'потрібні ключі'}
                    ok={isSupabaseConfigured}
                  />
                  <StatusLine
                    label="Активна сесія"
                    value={session ? 'є' : 'немає'}
                    ok={Boolean(session)}
                  />
                  <StatusLine
                    label="Проєкт"
                    value={maskProjectUrl(supabaseProjectUrl)}
                    ok={Boolean(supabaseProjectUrl)}
                  />
                  <StatusLine
                    label="Edge Function manage-roles"
                    value="використовується для списку email і призначення ролей"
                    ok
                  />

                  <Divider />

                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={1.5}
                    alignItems={{ xs: 'stretch', sm: 'center' }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h3">Діагностика стабільності</Typography>
                      <Typography color="text.secondary">
                        Перевірка Auth, доступу до БД і Edge Function.
                      </Typography>
                    </Box>
                    <Button
                      variant="outlined"
                      onClick={() => void handleRunDiagnostics()}
                      disabled={diagnosticsLoading}
                    >
                      {diagnosticsLoading ? 'Перевірка...' : 'Перевірити'}
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
          </Grid>
        </Grid>

        <Grid container spacing={2.5}>
          <Grid item xs={12} lg={7}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Stack spacing={2}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <SecurityIcon color="primary" />
                    <Box>
                      <Typography variant="h3">Таблиці та політики</Typography>
                      <Typography color="text.secondary">
                        Усі таблиці, які мають брати участь у ролях і доступах
                      </Typography>
                    </Box>
                  </Stack>

                  <TableContainer sx={{ maxHeight: 430 }}>
                    <Table stickyHeader size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Таблиця</TableCell>
                          <TableCell>Група</TableCell>
                          <TableCell align="right">Дії</TableCell>
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
          </Grid>

          <Grid item xs={12} lg={5}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Stack spacing={2}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <SettingsIcon color="primary" />
                    <Box>
                      <Typography variant="h3">Структура доступів</Typography>
                      <Typography color="text.secondary">Зведення по групах таблиць</Typography>
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
                        <Chip size="small" color="primary" variant="outlined" label={`${count} табл.`} />
                      </Stack>
                    ))}
                  </Stack>

                  <Alert severity="success">
                    У ролях використовується {rolePermissionTables.length} таблиць Supabase.
                  </Alert>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={2.5}>
          <Grid item xs={12} md={7}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Stack spacing={2}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <CodeIcon color="primary" />
                    <Box>
                      <Typography variant="h3">CRUD через Supabase</Typography>
                      <Typography color="text.secondary">
                        Додавання, редагування і видалення мають контролюватися SQL-рівнем
                      </Typography>
                    </Box>
                  </Stack>

                  <List dense disablePadding>
                    {crudLayers.map((layer) => (
                      <ListItem key={layer.title} disableGutters alignItems="flex-start">
                        <ListItemIcon sx={{ minWidth: 34, pt: 0.5 }}>
                          <CheckCircleOutlineIcon color="success" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          primary={layer.title}
                          secondary={layer.description}
                          primaryTypographyProps={{ fontWeight: 700 }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={5}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Stack spacing={2}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <ArchiveOutlinedIcon color="primary" />
                    <Box>
                      <Typography variant="h3">Архів</Typography>
                      <Typography color="text.secondary">Правила м’якого видалення</Typography>
                    </Box>
                  </Stack>

                  <List dense disablePadding>
                    {archiveRules.map((rule) => (
                      <ListItem key={rule} disableGutters alignItems="flex-start">
                        <ListItemIcon sx={{ minWidth: 34, pt: 0.5 }}>
                          <CheckCircleOutlineIcon color="success" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary={rule} />
                      </ListItem>
                    ))}
                  </List>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Card variant="outlined">
          <CardContent>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
              <CodeIcon color="primary" />
              <Box sx={{ flex: 1 }}>
                <Typography variant="h3">SQL для Supabase</Typography>
                <Typography color="text.secondary">
                  Скрипт створює таблицю прав, функції перевірки ролі, RLS policies і приклад
                  view + INSTEAD OF triggers для контрольованого CRUD.
                </Typography>
              </Box>
              <Chip label={sqlSetupPath} variant="outlined" color="primary" />
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </>
  );
}
