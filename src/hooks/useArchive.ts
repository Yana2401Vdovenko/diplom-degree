import { useCallback, useEffect, useState } from 'react';
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
          showSuccess(`Автоматично очищено ${expiredCount} записів архіву.`);
          data = await fetchArchiveRecords();
        }
      }

      setRecords(data);
    } catch (error) {
      showError(getSupabaseErrorMessage(error, 'Не вдалося завантажити архів.'));
    } finally {
      setLoading(false);
    }
  }, [archiveCleanupMode, archiveRetentionDays, showError, showSuccess]);

  useEffect(() => {
    void loadRecords();
  }, [loadRecords]);

  const restoreRecord = useCallback(
    async (record: ArchiveRow) => {
      setSaving(true);

      try {
        await restoreArchiveRecord(record);
        showSuccess('Запис успішно відновлено.');
        await loadRecords();
        return true;
      } catch (error) {
        showError(getSupabaseErrorMessage(error, 'Не вдалося відновити запис.'));
        return false;
      } finally {
        setSaving(false);
      }
    },
    [loadRecords, showError, showSuccess],
  );

  const deletePermanently = useCallback(
    async (id: string) => {
      setSaving(true);

      try {
        await deleteArchiveRecordPermanently(id);
        showSuccess('Запис остаточно видалено.');
        await loadRecords();
        return true;
      } catch (error) {
        showError(getSupabaseErrorMessage(error, 'Не вдалося видалити запис.'));
        return false;
      } finally {
        setSaving(false);
      }
    },
    [loadRecords, showError, showSuccess],
  );

  const deleteSelectedPermanently = useCallback(
    async (ids: string[]) => {
      setSaving(true);

      try {
        await deleteArchiveRecordsPermanently(ids);
        showSuccess(`Видалено записів: ${ids.length}.`);
        await loadRecords();
        return true;
      } catch (error) {
        showError(getSupabaseErrorMessage(error, 'Не вдалося видалити обрані записи.'));
        return false;
      } finally {
        setSaving(false);
      }
    },
    [loadRecords, showError, showSuccess],
  );

  const clearArchive = useCallback(async () => {
    setSaving(true);

    try {
      await clearArchiveRecords();
      showSuccess('Архів повністю очищено.');
      await loadRecords();
      return true;
    } catch (error) {
      showError(getSupabaseErrorMessage(error, 'Не вдалося очистити архів.'));
      return false;
    } finally {
      setSaving(false);
    }
  }, [loadRecords, showError, showSuccess]);

  const deleteExpiredRecords = useCallback(
    async (days: number) => {
      setSaving(true);

      try {
        await deleteArchiveRecordsOlderThan(days);
        showSuccess(`Архів очищено від записів старших за ${days} дн.`);
        await loadRecords();
        return true;
      } catch (error) {
        showError(getSupabaseErrorMessage(error, 'Не вдалося очистити старі записи архіву.'));
        return false;
      } finally {
        setSaving(false);
      }
    },
    [loadRecords, showError, showSuccess],
  );

  const filteredRecords =
    tableFilter === 'all' ? records : records.filter((record) => record.Таблиця === tableFilter);

  const tableOptions = [
    { value: 'all', label: 'Усі таблиці' },
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
