import i18n from 'i18next';
import { supabase } from '../lib/supabase/client';

export interface ColumnInfo {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
  character_maximum_length: number | null;
  udt_name: string;
}

export interface ConstraintInfo {
  constraint_name: string;
  constraint_type: string;
  column_name: string;
  foreign_table_name: string | null;
  foreign_column_name: string | null;
}

export interface IndexInfo {
  index_name: string;
  column_names: string;
  is_unique: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseRpc = <T>(fn: string, params?: Record<string, any>) => Promise<{ data: T | null; error: any }>;

const rpc = supabase.rpc as unknown as SupabaseRpc;

export async function fetchAllTables(): Promise<string[]> {
  const { data, error } = await rpc<Array<{ table_name: string }>>('get_all_tables');
  if (error) throw error;
  return (data ?? []).map((r) => r.table_name);
}

export async function fetchTableColumns(tableName: string): Promise<ColumnInfo[]> {
  const { data, error } = await rpc<ColumnInfo[]>('get_table_columns', { target_table: tableName });
  if (error) throw error;
  return (data ?? []) as ColumnInfo[];
}

export async function fetchTableConstraints(tableName: string): Promise<ConstraintInfo[]> {
  const { data, error } = await rpc<ConstraintInfo[]>('get_table_constraints', { target_table: tableName });
  if (error) throw error;
  return (data ?? []) as ConstraintInfo[];
}

export async function fetchTableIndexes(tableName: string): Promise<IndexInfo[]> {
  const { data, error } = await rpc<IndexInfo[]>('get_table_indexes', { target_table: tableName });
  if (error) throw error;
  return (data ?? []) as IndexInfo[];
}

export async function executeDDL(sql: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke('schema-manager', {
    body: { sql },
  });

  if (error) {
    throw new Error(i18n.t('schema.execError'));
  }

  if (data && typeof data === 'object' && 'error' in data) {
    throw new Error(String((data as { error: string }).error));
  }
}

export function generateAddColumnSQL(
  tableName: string,
  columnName: string,
  dataType: string,
  nullable: boolean,
  defaultValue: string | null,
): string {
  let sql = `ALTER TABLE "${tableName}" ADD COLUMN "${columnName}" ${dataType}`;
  if (!nullable) {
    sql += ' NOT NULL';
  }
  if (defaultValue) {
    sql += ` DEFAULT ${defaultValue}`;
  }
  return sql + ';';
}

export function generateDropColumnSQL(tableName: string, columnName: string): string {
  return `ALTER TABLE "${tableName}" DROP COLUMN "${columnName}";`;
}

export function generateRenameColumnSQL(
  tableName: string,
  oldName: string,
  newName: string,
): string {
  return `ALTER TABLE "${tableName}" RENAME COLUMN "${oldName}" TO "${newName}";`;
}

export function generateAlterColumnTypeSQL(
  tableName: string,
  columnName: string,
  newType: string,
): string {
  return `ALTER TABLE "${tableName}" ALTER COLUMN "${columnName}" TYPE ${newType};`;
}

export function generateSetNullableSQL(
  tableName: string,
  columnName: string,
  nullable: boolean,
): string {
  const action = nullable ? 'DROP NOT NULL' : 'SET NOT NULL';
  return `ALTER TABLE "${tableName}" ALTER COLUMN "${columnName}" ${action};`;
}

export function generateSetDefaultSQL(
  tableName: string,
  columnName: string,
  defaultValue: string | null,
): string {
  if (defaultValue === null) {
    return `ALTER TABLE "${tableName}" ALTER COLUMN "${columnName}" DROP DEFAULT;`;
  }
  return `ALTER TABLE "${tableName}" ALTER COLUMN "${columnName}" SET DEFAULT ${defaultValue};`;
}

export function generateCreateIndexSQL(
  tableName: string,
  columnName: string,
  unique: boolean,
): string {
  const uniqueKeyword = unique ? 'UNIQUE ' : '';
  return `CREATE ${uniqueKeyword}INDEX "${tableName}_${columnName}_idx" ON "${tableName}" ("${columnName}");`;
}

export function generateDropIndexSQL(indexName: string): string {
  return `DROP INDEX "${indexName}";`;
}
