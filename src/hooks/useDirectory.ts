import { useCallback, useEffect, useMemo, useState } from 'react';
import { getDirectoryConfig, type SupabaseDirectoryKey } from '../config/directories';
import {
  archiveDirectoryRecord,
  createDirectoryRecord,
  fetchDirectoryRecords,
  updateDirectoryRecord,
} from '../services/directory.service';
import {
  getRecordPrimaryValue,
  getSupabaseErrorMessage,
  validateDirectoryRecord,
  type DirectoryRecordMap,
} from '../utils/directory';
import { useNotification } from '../context/NotificationContext';

export function useDirectory(key: SupabaseDirectoryKey) {
  const config = getDirectoryConfig(key);
  const { showSuccess, showError } = useNotification();
  const [items, setItems] = useState<DirectoryRecordMap[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filterField, setFilterField] = useState<string>('all');

  const loadItems = useCallback(async () => {
    setLoading(true);

    try {
      const data = await fetchDirectoryRecords(key);
      setItems(data);
    } catch (error) {
      showError(getSupabaseErrorMessage(error, 'Не вдалося завантажити довідник.'));
    } finally {
      setLoading(false);
    }
  }, [key, showError]);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  const filterOptions = useMemo(
    () => [
      { value: 'all', label: 'Усі поля' },
      ...config.fields.map((field) => ({ value: field.key, label: field.label })),
    ],
    [config.fields],
  );

  const createRecord = useCallback(
    async (values: DirectoryRecordMap) => {
      const validationError = validateDirectoryRecord(config, values, false);

      if (validationError) {
        showError(validationError);
        return false;
      }

      setSaving(true);

      try {
        await createDirectoryRecord(key, values);
        showSuccess('Запис успішно додано.');
        await loadItems();
        return true;
      } catch (error) {
        showError(getSupabaseErrorMessage(error, 'Не вдалося додати запис.'));
        return false;
      } finally {
        setSaving(false);
      }
    },
    [config, key, loadItems, showError, showSuccess],
  );

  const updateRecord = useCallback(
    async (primaryValue: string, values: DirectoryRecordMap) => {
      const validationError = validateDirectoryRecord(config, values, true);

      if (validationError) {
        showError(validationError);
        return false;
      }

      setSaving(true);

      try {
        await updateDirectoryRecord(key, primaryValue, values);
        showSuccess('Запис успішно оновлено.');
        await loadItems();
        return true;
      } catch (error) {
        showError(getSupabaseErrorMessage(error, 'Не вдалося оновити запис.'));
        return false;
      } finally {
        setSaving(false);
      }
    },
    [config, key, loadItems, showError, showSuccess],
  );

  const archiveRecord = useCallback(
    async (record: DirectoryRecordMap) => {
      setSaving(true);

      try {
        await archiveDirectoryRecord(key, record);
        showSuccess('Запис переміщено до архіву.');
        await loadItems();
        return true;
      } catch (error) {
        showError(getSupabaseErrorMessage(error, 'Не вдалося архівувати запис.'));
        return false;
      } finally {
        setSaving(false);
      }
    },
    [key, loadItems, showError, showSuccess],
  );

  const getPrimaryValue = useCallback(
    (record: DirectoryRecordMap) => getRecordPrimaryValue(config, record),
    [config],
  );

  return {
    config,
    items,
    loading,
    saving,
    filterField,
    setFilterField,
    filterOptions,
    loadItems,
    createRecord,
    updateRecord,
    archiveRecord,
    getPrimaryValue,
  };
}
