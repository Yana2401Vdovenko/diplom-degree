import { CssBaseline, ThemeProvider } from '@mui/material';
import type { PaletteMode } from '@mui/material';
import i18n from 'i18next';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { createAppTheme } from '../theme';

type ArchiveCleanupMode = 'manual' | 'auto';

interface AppSettingsContextValue {
  themeMode: PaletteMode;
  setThemeMode: (mode: PaletteMode) => void;
  archiveCleanupMode: ArchiveCleanupMode;
  setArchiveCleanupMode: (mode: ArchiveCleanupMode) => void;
  archiveRetentionDays: number;
  setArchiveRetentionDays: (days: number) => void;
}

const THEME_MODE_KEY = 'academic-workload-admin:theme-mode';
const ARCHIVE_CLEANUP_MODE_KEY = 'academic-workload-admin:archive-cleanup-mode';
const ARCHIVE_RETENTION_DAYS_KEY = 'academic-workload-admin:archive-retention-days';
const DEFAULT_ARCHIVE_RETENTION_DAYS = 30;

const AppSettingsContext = createContext<AppSettingsContextValue | null>(null);

function readStorageValue(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorageValue(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Settings should keep working even when localStorage is unavailable.
  }
}

function getInitialThemeMode(): PaletteMode {
  const stored = readStorageValue(THEME_MODE_KEY);

  if (stored === 'light' || stored === 'dark') {
    return stored;
  }

  return 'light';
}

function getInitialCleanupMode(): ArchiveCleanupMode {
  return readStorageValue(ARCHIVE_CLEANUP_MODE_KEY) === 'auto' ? 'auto' : 'manual';
}

function getInitialRetentionDays() {
  const stored = Number(readStorageValue(ARCHIVE_RETENTION_DAYS_KEY));
  return Number.isFinite(stored) && stored > 0 ? stored : DEFAULT_ARCHIVE_RETENTION_DAYS;
}

interface AppSettingsProviderProps {
  children: ReactNode;
}

export function AppSettingsProvider({ children }: AppSettingsProviderProps) {
  const [themeMode, setThemeModeState] = useState<PaletteMode>(getInitialThemeMode);
  const [archiveCleanupMode, setArchiveCleanupModeState] =
    useState<ArchiveCleanupMode>(getInitialCleanupMode);
  const [archiveRetentionDays, setArchiveRetentionDaysState] = useState(getInitialRetentionDays);

  const theme = useMemo(() => createAppTheme(themeMode), [themeMode]);

  const setThemeMode = useCallback((mode: PaletteMode) => {
    setThemeModeState(mode);
    writeStorageValue(THEME_MODE_KEY, mode);
  }, []);

  const setArchiveCleanupMode = useCallback((mode: ArchiveCleanupMode) => {
    setArchiveCleanupModeState(mode);
    writeStorageValue(ARCHIVE_CLEANUP_MODE_KEY, mode);
  }, []);

  const setArchiveRetentionDays = useCallback((days: number) => {
    const normalizedDays = Math.max(1, Math.round(days || DEFAULT_ARCHIVE_RETENTION_DAYS));
    setArchiveRetentionDaysState(normalizedDays);
    writeStorageValue(ARCHIVE_RETENTION_DAYS_KEY, String(normalizedDays));
  }, []);

  const value = useMemo<AppSettingsContextValue>(
    () => ({
      archiveCleanupMode,
      archiveRetentionDays,
      setArchiveCleanupMode,
      setArchiveRetentionDays,
      setThemeMode,
      themeMode,
    }),
    [
      archiveCleanupMode,
      archiveRetentionDays,
      setArchiveCleanupMode,
      setArchiveRetentionDays,
      setThemeMode,
      themeMode,
    ],
  );

  return (
    <AppSettingsContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </AppSettingsContext.Provider>
  );
}

export function useAppSettings() {
  const context = useContext(AppSettingsContext);

  if (!context) {
    throw new Error('useAppSettings must be used inside AppSettingsProvider');
  }

  return context;
}
