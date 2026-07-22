import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchDashboardStats, type DashboardStats } from '../services/dashboard.service';
import { getSupabaseErrorMessage } from '../utils/directory';
import { useNotification } from '../context/NotificationContext';

export function useDashboard() {
  const { showError } = useNotification();
  const { t } = useTranslation();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    setLoading(true);

    try {
      const data = await fetchDashboardStats();
      setStats(data);
    } catch (error) {
      showError(getSupabaseErrorMessage(error, t('dashboard.loadError')));
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  return { stats, loading, reload: loadStats };
}
