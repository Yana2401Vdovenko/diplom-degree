import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  clearArchiveRecords,
  deleteArchiveRecordsOlderThan,
  deleteArchiveRecordsPermanently,
  deleteArchiveRecordPermanently,
  fetchArchiveRecords,
  restoreArchiveRecord,
} from '../services/archive.service';
import type { ArchiveRow } from '../types/database';
import { formatArchiveDate, getSupabaseErrorMessage } from '../utils/directory';
import { useNotification } from '../context/NotificationContext';
import { useAppSettings } from '../context/AppSettingsContext';

export function useArchive() {
  const { showSuccess, showError } = useNotification();
  const { archiveCleanupMode, archiveRetentionDays } = useAppSettings();
  const { t } = useTranslation();
  const [records, setRecords] = useState<ArchiveRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tableFilter, setTableFilter] = useState<string>('all');

  const loadRecords = useCallback(async () => {
    setLoading(true);

    try {
      let data = await fetchArchiveRecords();

      if (archiveCleanupMode === 'auto') {
        const threshold = new Date();
        threshold.setDate(threshold.getDate() - archiveRetentionDays);
        const expiredCount = data.filter(
          (record) => new Date(record.Дата_архівації) < threshold,
        ).length;

        if (expiredCount > 0) {
          await deleteArchiveRecordsOlderThan(archiveRetentionDays);
          showSuccess(t('message.archiveAutoCleared', { count: expiredCount }));
          data = await fetchArchiveRecords();
        }
      }

      setRecords(data);
    } catch (error) {
      showError(getSupabaseErrorMessage(error, t('error.loadArchive')));
    } finally {
      setLoading(false);
    }
  }, [archiveCleanupMode, archiveRetentionDays, showError, showSuccess, t]);

  useEffect(() => {
    void loadRecords();
  }, [loadRecords]);

  const restoreRecord = useCallback(
    async (record: ArchiveRow) => {
      setSaving(true);

      try {
        await restoreArchiveRecord(record);
        showSuccess(t('message.recordRestored'));
        await loadRecords();
        return true;
      } catch (error) {
        showError(getSupabaseErrorMessage(error, t('error.restoreRecord')));
        return false;
      } finally {
        setSaving(false);
      }
    },
    [loadRecords, showError, showSuccess, t],
  );

  const deletePermanently = useCallback(
    async (id: string) => {
      setSaving(true);

      try {
        await deleteArchiveRecordPermanently(id);
        showSuccess(t('message.recordDeleted'));
        await loadRecords();
        return true;
      } catch (error) {
        showError(getSupabaseErrorMessage(error, t('error.deleteRecord')));
        return false;
      } finally {
        setSaving(false);
      }
    },
    [loadRecords, showError, showSuccess, t],
  );

  const deleteSelectedPermanently = useCallback(
    async (ids: string[]) => {
      setSaving(true);

      try {
        await deleteArchiveRecordsPermanently(ids);
        showSuccess(t('message.recordsDeleted', { count: ids.length }));
        await loadRecords();
        return true;
      } catch (error) {
        showError(getSupabaseErrorMessage(error, t('error.deleteSelected')));
        return false;
      } finally {
        setSaving(false);
      }
    },
    [loadRecords, showError, showSuccess, t],
  );

  const clearArchive = useCallback(async () => {
    setSaving(true);

    try {
      await clearArchiveRecords();
      showSuccess(t('message.archiveCleared'));
      await loadRecords();
      return true;
    } catch (error) {
      showError(getSupabaseErrorMessage(error, t('error.clearArchive')));
      return false;
    } finally {
      setSaving(false);
    }
  }, [loadRecords, showError, showSuccess, t]);

  const deleteExpiredRecords = useCallback(
    async (days: number) => {
      setSaving(true);

      try {
        await deleteArchiveRecordsOlderThan(days);
        showSuccess(t('message.archiveClearedOlder', { days }));
        await loadRecords();
        return true;
      } catch (error) {
        showError(getSupabaseErrorMessage(error, t('error.clearExpired')));
        return false;
      } finally {
        setSaving(false);
      }
    },
    [loadRecords, showError, showSuccess, t],
  );

  const filteredRecords =
    tableFilter === 'all' ? records : records.filter((record) => record.Таблиця === tableFilter);

  const tableOptions = [
    { value: 'all', label: t('archive.allTables') },
    ...Array.from(new Set(records.map((record) => record.Таблиця))).map((table) => ({
      value: table,
      label: table,
    })),
  ];

  return {
    records: filteredRecords,
    loading,
    saving,
    tableFilter,
    setTableFilter,
    tableOptions,
    loadRecords,
    restoreRecord,
    deletePermanently,
    deleteSelectedPermanently,
    clearArchive,
    deleteExpiredRecords,
    formatArchiveDate,
  };
}
