import { directoryConfigs, supabaseDirectoryKeys } from '../config/directories';
import { supabase } from '../lib/supabase/client';
import type { ArchiveRow } from '../types/database';

export interface DirectoryStat {
  key: string;
  label: string;
  title: string;
  route: string;
  count: number;
}

export interface DashboardStats {
  directories: DirectoryStat[];
  archiveCount: number;
  latestArchiveRecords: ArchiveRow[];
  databaseResponseMs: number;
  totalDirectoryRecords: number;
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const startedAt = performance.now();
  const directoryResults = await Promise.all(
    supabaseDirectoryKeys.map(async (key) => {
      const config = directoryConfigs[key];
      const { count, error } = await supabase
        .from(config.tableName)
        .select('*', { count: 'exact', head: true });

      if (error) {
        throw error;
      }

      return {
        key,
        label: config.entityLabel,
        title: config.title,
        route: config.route,
        count: count ?? 0,
      };
    }),
  );

  const { count: archiveCount, error: archiveError } = await supabase
    .from('Архів')
    .select('*', { count: 'exact', head: true });

  if (archiveError) {
    throw archiveError;
  }

  const { data: latestArchiveRecords, error: latestArchiveError } = await supabase
    .from('Архів')
    .select('*')
    .order('Дата_архівації', { ascending: false })
    .limit(5);

  if (latestArchiveError) {
    throw latestArchiveError;
  }

  return {
    directories: directoryResults,
    archiveCount: archiveCount ?? 0,
    latestArchiveRecords: (latestArchiveRecords ?? []) as ArchiveRow[],
    databaseResponseMs: Math.round(performance.now() - startedAt),
    totalDirectoryRecords: directoryResults.reduce((sum, item) => sum + item.count, 0),
  };
}
