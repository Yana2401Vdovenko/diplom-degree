import { ARCHIVE_TABLE } from '../constants/tableNames';
import { getDirectoryConfig, type SupabaseDirectoryKey } from '../config/directories';
import { supabase } from '../lib/supabase/client';
import type { DirectoryTableName } from '../types/database';
import {
  buildInsertPayload,
  buildUpdatePayload,
  getRecordDisplayName,
  getRecordPrimaryValue,
  type DirectoryRecordMap,
} from '../utils/directory';

export async function fetchDirectoryRecords(key: SupabaseDirectoryKey) {
  const config = getDirectoryConfig(key);

  const { data, error } = await supabase
    .from(config.tableName)
    .select('*')
    .order(config.primaryKey, { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as DirectoryRecordMap[];
}

export async function createDirectoryRecord(
  key: SupabaseDirectoryKey,
  values: DirectoryRecordMap,
) {
  const config = getDirectoryConfig(key);
  const payload = buildInsertPayload(config, values);

  const { data, error } = await supabase
    .from(config.tableName)
    .insert(payload as never)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data as DirectoryRecordMap;
}

export async function updateDirectoryRecord(
  key: SupabaseDirectoryKey,
  primaryValue: string,
  values: DirectoryRecordMap,
) {
  const config = getDirectoryConfig(key);
  const payload = buildUpdatePayload(config, values);

  const { data, error } = await supabase
    .from(config.tableName)
    .update(payload as never)
    .eq(config.primaryKey, primaryValue)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data as DirectoryRecordMap;
}

export async function massUpdateDirectoryRecords(
  key: SupabaseDirectoryKey,
  primaryValues: string[],
  field: string,
  value: unknown,
) {
  const config = getDirectoryConfig(key);

  const { error } = await supabase
    .from(config.tableName)
    .update({ [field]: value } as never)
    .in(config.primaryKey, primaryValues);

  if (error) {
    throw error;
  }
}

export async function fetchTeacherStatusesForSelect(): Promise<
  Array<{ Код_статусу_викладача: string; Назва_статусу_викладача: string | null }>
> {
  const { data, error } = await supabase
    .from('Статус_викладача')
    .select('Код_статусу_викладача, Назва_статусу_викладача')
    .order('Код_статусу_викладача', { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as Array<{
    Код_статусу_викладача: string;
    Назва_статусу_викладача: string | null;
  }>;
}

export async function archiveDirectoryRecord(
  key: SupabaseDirectoryKey,
  record: DirectoryRecordMap,
) {
  const config = getDirectoryConfig(key);
  const primaryValue = getRecordPrimaryValue(config, record);
  const displayName = getRecordDisplayName(config, record);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error: archiveError } = await supabase.from(ARCHIVE_TABLE).insert({
    Таблиця: config.tableName,
    Ключ_запису: primaryValue,
    Дані: record as never,
    Назва: displayName,
    Архівував: user?.id ?? null,
  } as never);

  if (archiveError) {
    throw archiveError;
  }

  const { error: deleteError } = await supabase
    .from(config.tableName)
    .delete()
    .eq(config.primaryKey, primaryValue);

  if (deleteError) {
    throw deleteError;
  }
}

export type { DirectoryTableName };
