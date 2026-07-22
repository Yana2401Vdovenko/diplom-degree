import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getDirectoryConfig, type SupabaseDirectoryKey } from '../config/directories';
import {
  archiveDirectoryRecord,
  createDirectoryRecord,
  fetchDirectoryRecords,
  massUpdateDirectoryRecords,
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
  const { t } = useTranslation();
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
      showError(getSupabaseErrorMessage(error, t('error.loadDirectory')));
    } finally {
      setLoading(false);
    }
  }, [key, showError, t]);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  const filterOptions = useMemo(
    () => [
      { value: 'all', label: t('directory.allFields') },
      ...config.fields.map((field) => ({ value: field.key, label: field.label })),
    ],
    [config.fields, t],
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
        showSuccess(t('message.recordAdded'));
        await loadItems();
        return true;
      } catch (error) {
        showError(getSupabaseErrorMessage(error, t('error.addRecord')));
        return false;
      } finally {
        setSaving(false);
      }
    },
    [config, key, loadItems, showError, showSuccess, t],
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
        showSuccess(t('message.recordUpdated'));
        await loadItems();
        return true;
      } catch (error) {
        showError(getSupabaseErrorMessage(error, t('error.updateRecord')));
        return false;
      } finally {
        setSaving(false);
      }
    },
    [config, key, loadItems, showError, showSuccess, t],
  );

  const archiveRecord = useCallback(
    async (record: DirectoryRecordMap) => {
      setSaving(true);

      try {
        await archiveDirectoryRecord(key, record);
        showSuccess(t('message.recordArchived'));
        await loadItems();
        return true;
      } catch (error) {
        showError(getSupabaseErrorMessage(error, t('error.archiveRecord')));
        return false;
      } finally {
        setSaving(false);
      }
    },
    [key, loadItems, showError, showSuccess, t],
  );

  const massUpdate = useCallback(
    async (primaryValues: string[], field: string, value: unknown) => {
      setSaving(true);

      try {
        await massUpdateDirectoryRecords(key, primaryValues, field, value);
        showSuccess(t('message.massUpdated', { count: primaryValues.length }));
        await loadItems();
        return true;
      } catch (error) {
        showError(getSupabaseErrorMessage(error, t('error.massUpdate')));
        return false;
      } finally {
        setSaving(false);
      }
    },
    [key, loadItems, showError, showSuccess, t],
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
    massUpdate,
    getPrimaryValue,
  };
}
