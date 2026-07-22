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
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { PageHeader } from '../components/PageHeader';
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

function getServerLoadLabel(t: (key: string) => string, value: number) {
  if (value >= 75) {
    return t('dashboard.highLoad');
  }

  if (value >= 45) {
    return t('dashboard.moderateLoad');
  }

  return t('dashboard.stable');
}

export function DashboardPage() {
  const { stats, loading } = useDashboard();
  const { t } = useTranslation();
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
      t('insight.mostActiveSection', { section: biggestDirectory?.title ?? t('nav.dashboard') }),
      stats.archiveCount > 0
        ? t('insight.archiveNotEmpty', { count: stats.archiveCount })
        : t('insight.archiveEmpty'),
      t('insight.dbStatus', { status: getServerLoadLabel(t, serverLoad), ms: stats.databaseResponseMs }),
    ];

    if (serverLoad >= 75) {
      insights.push(t('insight.aiAdvice'));
    }

    return insights;
  }, [serverLoad, stats, t]);

  return (
    <>
      <PageHeader
        title={t('dashboard.title')}
        subtitle={t('dashboard.subtitle')}
      />

      {loading ? (
        <LoadingOverlay />
      ) : (
        <Stack spacing={2.5}>
          <Card>
            <CardContent>
              <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2.5}>
                <Box sx={{ flex: 1 }}>
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                    <AutoAwesomeIcon color="primary" />
                    <Typography variant="h3">{t('dashboard.aiAnalytics')}</Typography>
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
                    <Typography variant="h3">{t('dashboard.serverLoad')}</Typography>
                  </Stack>
                  <Stack spacing={1.5}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography color="text.secondary">{t('dashboard.currentState')}</Typography>
                      <Chip
                        color={serverLoad >= 75 ? 'error' : serverLoad >= 45 ? 'warning' : 'success'}
                        label={getServerLoadLabel(t, serverLoad)}
                      />
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={serverLoad}
                      color={serverLoad >= 75 ? 'error' : serverLoad >= 45 ? 'warning' : 'success'}
                    />
                    <Typography variant="body2" color="text.secondary">
                      {t('dashboard.dbResponseTime')}: {stats?.databaseResponseMs ?? 0} {t('dashboard.ms')}. {t('dashboard.activeRecordsLabel')}:
                      {' '}
                      {stats?.totalDirectoryRecords ?? 0}. {t('dashboard.archiveLabel')}: {stats?.archiveCount ?? 0}.
                    </Typography>
                  </Stack>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2.5 }}>
            {stats?.directories.map((item) => (
              <Card key={item.key} sx={{ flex: '1 1 300px', maxWidth: '100%' }}>
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
            ))}

            <Card sx={{ flex: '1 1 300px', maxWidth: '100%' }}>
              <CardContent>
                <Typography color="text.secondary" fontWeight={700} gutterBottom>
                  {t('dashboard.archiveLabel')}
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
          </Box>

          <Card>
            <CardContent>
              <Stack spacing={1}>
                <Typography variant="h3">{t('dashboard.quickActions')}</Typography>
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

          <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2.5}>
            <Card sx={{ flex: 1 }}>
              <CardContent>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                  <DeleteSweepIcon color="primary" />
                  <Typography variant="h3">{t('dashboard.deleteHistory')}</Typography>
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
                  <Typography color="text.secondary">{t('dashboard.noArchivedRecords')}</Typography>
                )}
              </CardContent>
            </Card>

            <Card sx={{ flex: 1 }}>
              <CardContent>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                  <ManageSearchIcon color="primary" />
                  <Typography variant="h3">{t('dashboard.searchHistory')}</Typography>
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
                    {t('dashboard.searchHint')}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Stack>
        </Stack>
      )}
    </>
  );
}
