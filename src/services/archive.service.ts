import { getDirectoryConfigByTable } from '../config/directories';
import { ARCHIVE_TABLE } from '../constants/tableNames';
import i18n from 'i18next';
import { supabase } from '../lib/supabase/client';
import type { ArchiveRow } from '../types/database';
import { isManagedDirectoryTable } from '../utils/directory';

export async function fetchArchiveRecords() {
  const { data, error } = await supabase
    .from(ARCHIVE_TABLE)
    .select('*')
    .order('Дата_архівації', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as ArchiveRow[];
}

export async function restoreArchiveRecord(record: ArchiveRow) {
  if (!isManagedDirectoryTable(record.Таблиця)) {
    throw new Error(i18n.t('archive.unknownTable', { table: record.Таблиця }));
  }

  const config = getDirectoryConfigByTable(record.Таблиця);

  if (!config) {
    throw new Error(i18n.t('archive.configNotFound', { table: record.Таблиця }));
  }

  const payload =
    record.Дані && typeof record.Дані === 'object' && !Array.isArray(record.Дані)
      ? record.Дані
      : {};

  const { error: insertError } = await supabase
    .from(config.tableName)
    .insert(payload as never);

  if (insertError) {
    throw insertError;
  }

  const { error: deleteError } = await supabase.from('Архів').delete().eq('id', record.id);

  if (deleteError) {
    throw deleteError;
  }
}

export async function deleteArchiveRecordPermanently(id: string) {
  const { error } = await supabase.from('Архів').delete().eq('id', id);

  if (error) {
    throw error;
  }
}

export async function deleteArchiveRecordsPermanently(ids: string[]) {
  if (ids.length === 0) {
    return;
  }

  const { error } = await supabase.from('Архів').delete().in('id', ids);

  if (error) {
    throw error;
  }
}

export async function clearArchiveRecords() {
  const { error } = await supabase.from('Архів').delete().not('id', 'is', null);

  if (error) {
    throw error;
  }
}

export async function deleteArchiveRecordsOlderThan(days: number) {
  const threshold = new Date();
  threshold.setDate(threshold.getDate() - days);

  const { error } = await supabase
    .from(ARCHIVE_TABLE)
    .delete()
    .lt('Дата_архівації', threshold.toISOString());

  if (error) {
    throw error;
  }
}
