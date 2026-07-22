import AutoDeleteIcon from '@mui/icons-material/AutoDelete';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import RestoreIcon from '@mui/icons-material/Restore';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getDirectoryConfigByTable } from '../config/directories';
import { ActionButton } from '../components/ActionButton';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { DataTable } from '../components/DataTable';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { PageHeader } from '../components/PageHeader';
import { SearchField } from '../components/SearchField';
import { useArchive } from '../hooks/useArchive';
import { useAppSettings } from '../context/AppSettingsContext';
import { useSearch } from '../hooks/useSearch';
import { useSort } from '../hooks/useSort';
import type { ArchiveRow } from '../types/database';

export function ArchivePage() {
  const { archiveCleanupMode, archiveRetentionDays } = useAppSettings();
  const { t } = useTranslation();
  const {
    records,
    loading,
    saving,
    tableFilter,
    setTableFilter,
    tableOptions,
    restoreRecord,
    deletePermanently,
    deleteSelectedPermanently,
    clearArchive,
    deleteExpiredRecords,
    formatArchiveDate,
  } = useArchive();

  const [restoreCandidate, setRestoreCandidate] = useState<ArchiveRow | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<ArchiveRow | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [cleanupAction, setCleanupAction] = useState<'selected' | 'expired' | 'all' | null>(null);

  const selector = useCallback(
    (record: ArchiveRow) =>
      `${record.Таблиця} ${record.Назва ?? ''} ${record.Ключ_запису} ${formatArchiveDate(record.Дата_архівації)}`,
    [formatArchiveDate],
  );

  const { query, setQuery, filteredItems } = useSearch(records, selector);

  const tableRows = useMemo(
    () =>
      filteredItems.map((record) => ({
        id: record.id,
        entity:
          getDirectoryConfigByTable(record.Таблиця)?.entityLabel ?? record.Таблиця,
        name: record.Назва ?? record.Ключ_запису,
        archivedAt: formatArchiveDate(record.Дата_архівації),
        key: record.Ключ_запису,
        raw: record,
      })),
    [filteredItems, formatArchiveDate],
  );

  const { sortedItems, sortKey, sortDirection, toggleSort } = useSort(tableRows, 'archivedAt', 'desc');
  const visibleIds = useMemo(() => sortedItems.map((row) => row.id), [sortedItems]);
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));

  const toggleSelected = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((selectedId) => selectedId !== id) : [...current, id],
    );
  };

  const toggleAllVisible = () => {
    setSelectedIds((current) => {
      if (allVisibleSelected) {
        return current.filter((id) => !visibleIds.includes(id));
      }

      return [...new Set([...current, ...visibleIds])];
    });
  };

  const cleanupDialog = {
    selected: {
      title: t('archive.deleteSelectedTitle'),
      description: t('archive.deleteSelectedDescription', { count: selectedIds.length }),
      confirmLabel: t('archive.deleteSelectedConfirm'),
    },
    expired: {
      title: t('archive.clearExpiredTitle'),
      description: t('archive.clearExpiredDescription', { days: archiveRetentionDays }),
      confirmLabel: t('archive.clearExpiredConfirm'),
    },
    all: {
      title: t('archive.clearAllTitle'),
      description: t('archive.clearAllDescription'),
      confirmLabel: t('archive.clearAllConfirm'),
    },
  }[cleanupAction ?? 'all'];

  return (
    <>
      <PageHeader
        title={t('archive.title')}
        subtitle={t('archive.subtitle')}
      />

      <Stack spacing={2.5}>
        <Card variant="outlined">
          <CardContent>
            <Stack spacing={2}>
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={1.5}
                alignItems={{ xs: 'stretch', md: 'center' }}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h3">{t('archive.cleanup')}</Typography>
                  <Typography color="text.secondary">
                    {t('archive.mode')}: {archiveCleanupMode === 'auto' ? t('archive.autoEnabled') : t('archive.manualMode')}.
                  </Typography>
                </Box>
                <Chip
                  color={archiveCleanupMode === 'auto' ? 'success' : 'default'}
                  label={archiveCleanupMode === 'auto' ? t('archive.autoEnabled') : t('archive.manualMode')}
                />
              </Stack>

              <Alert severity="warning">
                {t('archive.warning')}
              </Alert>

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteSweepIcon />}
                  disabled={selectedIds.length === 0 || saving}
                  onClick={() => setCleanupAction('selected')}
                >
                  {t('archive.deleteSelected', { count: selectedIds.length })}
                </Button>
                <Button
                  variant="outlined"
                  color="warning"
                  startIcon={<AutoDeleteIcon />}
                  disabled={records.length === 0 || saving}
                  onClick={() => setCleanupAction('expired')}
                >
                  {t('archive.clearOlder', { days: archiveRetentionDays })}
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<DeleteForeverIcon />}
                  disabled={records.length === 0 || saving}
                  onClick={() => setCleanupAction('all')}
                >
                  {t('archive.clearAll')}
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <Stack spacing={2.5} sx={{ flex: 1 }}>
            <SearchField
              value={query}
              onChange={setQuery}
              placeholder={t('archive.search')}
              historySource={t('archive.title')}
            />
          </Stack>
          <TextField
            select
            label={t('archive.table')}
            value={tableFilter}
            onChange={(event) => setTableFilter(event.target.value)}
            sx={{ minWidth: { xs: '100%', md: 260 } }}
            size="small"
          >
            {tableOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Stack>

        {loading ? (
          <LoadingOverlay />
        ) : (
          <DataTable
            columns={[
              {
                key: 'selected',
                label: allVisibleSelected ? t('archive.selectNone') : t('archive.selectAll'),
                minWidth: 90,
                align: 'center',
                render: (row) => (
                  <Checkbox
                    checked={selectedIds.includes(row.id)}
                    onChange={() => toggleSelected(row.id)}
                    inputProps={{ 'aria-label': allVisibleSelected ? t('archive.deselectVisible') : t('archive.selectVisible') }}
                  />
                ),
              },
              { key: 'entity', label: t('archive.entityType'), minWidth: 180, sortable: true },
              { key: 'name', label: t('archive.name'), minWidth: 260, sortable: true },
              { key: 'key', label: t('archive.key'), minWidth: 120, sortable: true },
              { key: 'archivedAt', label: t('archive.archivedAt'), minWidth: 180, sortable: true },
            ]}
            rows={sortedItems}
            rowKey={(row) => row.id}
            sortKey={sortKey}
            sortDirection={sortDirection}
            onSort={(key) => toggleSort(key as 'entity')}
            actions={(row) => (
              <>
                <ActionButton
                  icon={<RestoreIcon fontSize="small" />}
                  color="success"
                  onClick={() => setRestoreCandidate(row.raw)}
                >
                  {t('archive.restore')}
                </ActionButton>
                <ActionButton
                  icon={<DeleteForeverIcon fontSize="small" />}
                  color="error"
                  onClick={() => setDeleteCandidate(row.raw)}
                >
                  {t('archive.deleteForever')}
                </ActionButton>
              </>
            )}
          />
        )}

        {!loading && visibleIds.length > 0 && (
          <Button variant="text" onClick={toggleAllVisible} sx={{ alignSelf: 'flex-start' }}>
            {allVisibleSelected ? t('archive.selectNone') : t('archive.selectAll')}
          </Button>
        )}
      </Stack>

      <ConfirmDialog
        open={Boolean(restoreCandidate)}
        title={t('archive.restoreTitle')}
        description={t('archive.restoreDescription')}
        confirmLabel={t('archive.restore')}
        confirmColor="success"
        loading={saving}
        onClose={() => setRestoreCandidate(null)}
        onConfirm={() => {
          if (!restoreCandidate) {
            return;
          }

          void restoreRecord(restoreCandidate).then((success) => {
            if (success) {
              setRestoreCandidate(null);
            }
          });
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteCandidate)}
        title={t('archive.deleteForeverTitle')}
        description={t('archive.deleteForeverDescription')}
        confirmLabel={t('archive.deleteForever')}
        confirmColor="error"
        loading={saving}
        onClose={() => setDeleteCandidate(null)}
        onConfirm={() => {
          if (!deleteCandidate) {
            return;
          }

          void deletePermanently(deleteCandidate.id).then((success) => {
            if (success) {
              setDeleteCandidate(null);
            }
          });
        }}
      />

      <ConfirmDialog
        open={Boolean(cleanupAction)}
        title={cleanupDialog.title}
        description={cleanupDialog.description}
        confirmLabel={cleanupDialog.confirmLabel}
        confirmColor="error"
        loading={saving}
        onClose={() => setCleanupAction(null)}
        onConfirm={() => {
          if (cleanupAction === 'selected') {
            void deleteSelectedPermanently(selectedIds).then((success) => {
              if (success) {
                setSelectedIds([]);
                setCleanupAction(null);
              }
            });
            return;
          }

          if (cleanupAction === 'expired') {
            void deleteExpiredRecords(archiveRetentionDays).then((success) => {
              if (success) {
                setSelectedIds([]);
                setCleanupAction(null);
              }
            });
            return;
          }

          if (cleanupAction === 'all') {
            void clearArchive().then((success) => {
              if (success) {
                setSelectedIds([]);
                setCleanupAction(null);
              }
            });
          }
        }}
      />
    </>
  );
}
