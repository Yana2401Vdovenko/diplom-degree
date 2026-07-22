import { ARCHIVE_TABLE } from '../constants/tableNames';
import i18n from 'i18next';
import { supabase } from '../lib/supabase/client';
import { getSupabaseErrorMessage } from '../utils/directory';
import { pingManageRolesFunction } from './roles.service';

export interface DiagnosticCheck {
  key: string;
  label: string;
  ok: boolean;
  message: string;
}

export async function runSystemDiagnostics(): Promise<DiagnosticCheck[]> {
  const checks: DiagnosticCheck[] = [];

  try {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      throw error;
    }

    checks.push({
      key: 'auth',
      label: 'Supabase Auth',
      ok: Boolean(data.session),
      message: data.session ? i18n.t('diagnostics.authOk') : i18n.t('diagnostics.authFail'),
    });
  } catch (error) {
    checks.push({
      key: 'auth',
      label: 'Supabase Auth',
      ok: false,
      message: getSupabaseErrorMessage(error, i18n.t('error.unknown')),
    });
  }

  try {
    const { error } = await supabase.from(ARCHIVE_TABLE).select('id', { count: 'exact', head: true });

    if (error) {
      throw error;
    }

    checks.push({
      key: 'database',
      label: i18n.t('diagnostics.database'),
      ok: true,
      message: i18n.t('diagnostics.databaseOk'),
    });
  } catch (error) {
    checks.push({
      key: 'database',
      label: i18n.t('diagnostics.database'),
      ok: false,
      message: getSupabaseErrorMessage(error, i18n.t('error.unknown')),
    });
  }

  try {
    await pingManageRolesFunction();

    checks.push({
      key: 'edge-function',
      label: 'Edge Function manage-roles',
      ok: true,
      message: i18n.t('diagnostics.edgeFunctionOk'),
    });
  } catch (error) {
    checks.push({
      key: 'edge-function',
      label: 'Edge Function manage-roles',
      ok: false,
      message: getSupabaseErrorMessage(error, i18n.t('error.unknown')),
    });
  }

  return checks;
}
