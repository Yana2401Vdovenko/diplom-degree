import { supabase } from '../lib/supabase/client';
import { pingManageRolesFunction } from './roles.service';

export interface DiagnosticCheck {
  key: string;
  label: string;
  ok: boolean;
  message: string;
}

function getErrorMessage(error: unknown) {
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: string }).message);
  }

  return 'Невідома помилка.';
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
      message: data.session ? 'Активна сесія знайдена.' : 'Активної сесії немає.',
    });
  } catch (error) {
    checks.push({
      key: 'auth',
      label: 'Supabase Auth',
      ok: false,
      message: getErrorMessage(error),
    });
  }

  try {
    const { error } = await supabase.from('Архів').select('id', { count: 'exact', head: true });

    if (error) {
      throw error;
    }

    checks.push({
      key: 'database',
      label: 'База даних',
      ok: true,
      message: 'Запит до таблиці Архів виконано успішно.',
    });
  } catch (error) {
    checks.push({
      key: 'database',
      label: 'База даних',
      ok: false,
      message: getErrorMessage(error),
    });
  }

  try {
    await pingManageRolesFunction();

    checks.push({
      key: 'edge-function',
      label: 'Edge Function manage-roles',
      ok: true,
      message: 'Функція відповіла на ping.',
    });
  } catch (error) {
    checks.push({
      key: 'edge-function',
      label: 'Edge Function manage-roles',
      ok: false,
      message: getErrorMessage(error),
    });
  }

  return checks;
}
