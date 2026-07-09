import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import ManageSearchIcon from '@mui/icons-material/ManageSearch';
import SpeedIcon from '@mui/icons-material/Speed';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { PageHeader } from '../components/PageHeader';
import { useAppSettings } from '../context/AppSettingsContext';
import { useDashboard } from '../hooks/useDashboard';
import {
  getSearchHistory,
  subscribeToSearchHistory,
  type SearchHistoryItem,
} from '../utils/searchHistory';
import { formatArchiveDate } from '../utils/directory';

function getServerLoadLevel(responseMs: number, totalRecords: number) {
  const responseScore = Math.min(70, Math.round(responseMs / 18));
  const recordsScore = Math.min(30, Math.round(totalRecords / 20));
  return Math.min(100, responseScore + recordsScore);
}

function getServerLoadLabel(value: number) {
  if (value >= 75) {
    return 'високе навантаження';
  }

  if (value >= 45) {
    return 'помірне навантаження';
  }

  return 'стабільно';
}

export function DashboardPage() {
  const { stats, loading } = useDashboard();
  const { t } = useAppSettings();
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>(() => getSearchHistory());

  useEffect(() => subscribeToSearchHistory(() => setSearchHistory(getSearchHistory())), []);

  const serverLoad = useMemo(
    () =>
      stats
        ? getServerLoadLevel(stats.databaseResponseMs, stats.totalDirectoryRecords + stats.archiveCount)
        : 0,
    [stats],
  );

  const aiInsights = useMemo(() => {
    if (!stats) {
      return [];
    }

    const biggestDirectory = [...stats.directories].sort((a, b) => b.count - a.count)[0];
    const insights = [
      `Найбільше активних записів зараз у розділі "${biggestDirectory?.title ?? 'довідники'}".`,
      stats.archiveCount > 0
        ? `В архіві є ${stats.archiveCount} записів. Варто періодично очищати або переглядати їх.`
        : 'Архів порожній, зайвих видалених записів немає.',
      `Стан БД: ${getServerLoadLabel(serverLoad)}, відповідь приблизно ${stats.databaseResponseMs} мс.`,
    ];

    if (serverLoad >= 75) {
      insights.push('AI-порада: перевірити великі таблиці, архів і часті запити пошуку.');
    }

    return insights;
  }, [serverLoad, stats]);

  return (
    <>
      <PageHeader
        title={t('dashboard.title')}
        subtitle={t('dashboard.subtitle')}
      />

      {loading ? (
        <LoadingOverlay />
      ) : (
        <Grid container spacing={2.5}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2.5}>
                  <Box sx={{ flex: 1 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                      <AutoAwesomeIcon color="primary" />
                      <Typography variant="h3">AI-аналітика системи</Typography>
                    </Stack>
                    <Stack spacing={1}>
                      {aiInsights.map((insight) => (
                        <Alert key={insight} severity="info">
                          {insight}
                        </Alert>
                      ))}
                    </Stack>
                  </Box>

                  <Box sx={{ flex: 1 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                      <SpeedIcon color="primary" />
                      <Typography variant="h3">Навантаження серверу та БД</Typography>
                    </Stack>
                    <Stack spacing={1.5}>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography color="text.secondary">Поточний стан</Typography>
                        <Chip
                          color={serverLoad >= 75 ? 'error' : serverLoad >= 45 ? 'warning' : 'success'}
                          label={getServerLoadLabel(serverLoad)}
                        />
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={serverLoad}
                        color={serverLoad >= 75 ? 'error' : serverLoad >= 45 ? 'warning' : 'success'}
                      />
                      <Typography variant="body2" color="text.secondary">
                        Час відповіді БД: {stats?.databaseResponseMs ?? 0} мс. Активні записи:
                        {' '}
                        {stats?.totalDirectoryRecords ?? 0}. Архів: {stats?.archiveCount ?? 0}.
                      </Typography>
                    </Stack>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {stats?.directories.map((item) => (
            <Grid item xs={12} sm={6} lg={4} key={item.key}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography color="text.secondary" fontWeight={700} gutterBottom>
                    {item.title}
                  </Typography>
                  <Typography variant="h2" sx={{ mb: 1 }}>
                    {item.count}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {t('dashboard.activeRecords')}
                  </Typography>
                  <Button
                    component={RouterLink}
                    to={item.route}
                    size="small"
                    endIcon={<ArrowForwardIcon />}
                  >
                    {t('dashboard.open')}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}

          <Grid item xs={12} sm={6} lg={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography color="text.secondary" fontWeight={700} gutterBottom>
                  Архів
                </Typography>
                <Typography variant="h2" sx={{ mb: 1 }}>
                  {stats?.archiveCount ?? 0}
                </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {t('dashboard.archiveCount')}
                </Typography>
                <Button
                  component={RouterLink}
                  to="/archive"
                  size="small"
                  endIcon={<ArrowForwardIcon />}
                >
                  {t('dashboard.viewArchive')}
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Stack spacing={1}>
                  <Typography variant="h3">{t('dashboard.quickActions')}</Typography>
                  <Typography color="text.secondary">
                    {t('dashboard.quickActionsText')}
                  </Typography>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ pt: 1 }}>
                    <Button component={RouterLink} to="/roles" variant="outlined">
                      {t('nav.roles')}
                    </Button>
                    <Button component={RouterLink} to="/archive" variant="outlined">
                      {t('nav.archive')}
                    </Button>
                    <Button component={RouterLink} to="/settings" variant="outlined">
                      {t('nav.settings')}
                    </Button>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} lg={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                  <DeleteSweepIcon color="primary" />
                  <Typography variant="h3">Історія видалень та архівування</Typography>
                </Stack>
                {stats?.latestArchiveRecords.length ? (
                  <List dense disablePadding>
                    {stats.latestArchiveRecords.map((record) => (
                      <ListItem key={record.id} disableGutters>
                        <ListItemText
                          primary={record.Назва ?? record.Ключ_запису}
                          secondary={`${record.Таблиця} · ${formatArchiveDate(record.Дата_архівації)}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography color="text.secondary">Поки немає архівованих записів.</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} lg={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                  <ManageSearchIcon color="primary" />
                  <Typography variant="h3">Історія пошуку</Typography>
                </Stack>
                {searchHistory.length ? (
                  <List dense disablePadding>
                    {searchHistory.map((item) => (
                      <ListItem key={`${item.source}-${item.query}-${item.searchedAt}`} disableGutters>
                        <ListItemText
                          primary={item.query}
                          secondary={`${item.source} · ${formatArchiveDate(item.searchedAt)}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography color="text.secondary">
                    Пошукові запити з’являться тут після використання пошуку в розділах.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </>
  );
}
