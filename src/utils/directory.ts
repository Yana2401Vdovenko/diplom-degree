import i18n from 'i18next';
import { DIRECTORY_TABLE_NAMES } from '../constants/tableNames';
import type { DirectoryConfig } from '../config/directories';
import type { DirectoryTableName } from '../types/database';

export type DirectoryRecordMap = Record<string, string | number | null>;

export function getRecordDisplayName(
  config: DirectoryConfig,
  record: DirectoryRecordMap,
): string {
  const value = record[config.displayNameField];
  return value != null ? String(value) : String(record[config.primaryKey] ?? '');
}

export function getRecordPrimaryValue(
  config: DirectoryConfig,
  record: DirectoryRecordMap,
): string {
  return String(record[config.primaryKey] ?? '');
}

export function formatArchiveDate(value: string): string {
  return new Intl.DateTimeFormat('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function validateDirectoryRecord(
  config: DirectoryConfig,
  values: DirectoryRecordMap,
  isEdit: boolean,
): string | null {
  for (const field of config.fields) {
    const rawValue = values[field.key];

    if (field.required) {
      if (rawValue == null || String(rawValue).trim() === '') {
        return i18n.t('validation.required', { field: field.label });
      }
    }

    if (field.maxLength && rawValue != null) {
      if (String(rawValue).trim().length > field.maxLength) {
        return i18n.t('validation.maxLength', { field: field.label, max: field.maxLength });
      }
    }

    if (field.type === 'number' && rawValue != null && String(rawValue).trim() !== '') {
      const numericValue = Number(rawValue);
      if (!Number.isFinite(numericValue) || numericValue < 0) {
        return i18n.t('validation.nonNegative', { field: field.label });
      }
    }

    if (!isEdit && field.readOnlyOnEdit && field.key === config.primaryKey) {
      if (String(rawValue).trim() === '') {
        return i18n.t('validation.required', { field: field.label });
      }
    }
  }

  return null;
}

export function buildInsertPayload(
  config: DirectoryConfig,
  values: DirectoryRecordMap,
): DirectoryRecordMap {
  const payload: DirectoryRecordMap = {};

  for (const field of config.fields) {
    const rawValue = values[field.key];

    if (field.type === 'number') {
      payload[field.key] = rawValue == null || rawValue === '' ? null : Number(rawValue);
      continue;
    }

    if (rawValue == null) {
      payload[field.key] = null;
      continue;
    }

    const trimmed = String(rawValue).trim();
    payload[field.key] =
      field.key === config.primaryKey
        ? trimmed.toUpperCase().slice(0, field.maxLength)
        : trimmed.slice(0, field.maxLength);
  }

  return payload;
}

export function buildUpdatePayload(
  config: DirectoryConfig,
  values: DirectoryRecordMap,
): DirectoryRecordMap {
  const payload: DirectoryRecordMap = {};

  for (const field of config.fields) {
    if (field.readOnlyOnEdit) {
      continue;
    }

    const rawValue = values[field.key];

    if (field.type === 'number') {
      payload[field.key] = rawValue == null || rawValue === '' ? null : Number(rawValue);
    } else {
      payload[field.key] = rawValue == null ? null : String(rawValue).trim();
    }
  }

  return payload;
}

export function isManagedDirectoryTable(tableName: string): tableName is DirectoryTableName {
  return DIRECTORY_TABLE_NAMES.includes(tableName as DirectoryTableName);
}

export function getSupabaseErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: string }).message);
  }

  return fallback;
}
