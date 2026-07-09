import { createTheme } from '@mui/material/styles';
import type { PaletteMode } from '@mui/material';

export function createAppTheme(mode: PaletteMode) {
  const isDark = mode === 'dark';

  return createTheme({
  palette: {
    mode,
    primary: {
      main: isDark ? '#60a5fa' : '#2563eb',
      dark: isDark ? '#3b82f6' : '#1d4ed8',
    },
    secondary: {
      main: isDark ? '#2dd4bf' : '#0f766e',
    },
    success: {
      main: isDark ? '#22c55e' : '#15803d',
    },
    warning: {
      main: isDark ? '#f59e0b' : '#b45309',
    },
    error: {
      main: isDark ? '#f87171' : '#dc2626',
    },
    background: {
      default: isDark ? '#0f172a' : '#f6f8fb',
      paper: isDark ? '#111827' : '#ffffff',
    },
    text: {
      primary: isDark ? '#f9fafb' : '#111827',
      secondary: isDark ? '#cbd5e1' : '#5b6472',
    },
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily:
      '"Inter", "Roboto", "Helvetica", "Arial", "Segoe UI", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2rem',
    },
    h2: {
      fontWeight: 700,
      fontSize: '1.5rem',
    },
    h3: {
      fontWeight: 700,
      fontSize: '1.25rem',
    },
    button: {
      fontWeight: 700,
      textTransform: 'none',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: `1px solid ${isDark ? '#263244' : '#e5e7eb'}`,
          boxShadow: isDark
            ? '0 10px 28px rgba(0, 0, 0, 0.28)'
            : '0 10px 28px rgba(15, 23, 42, 0.06)',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          color: isDark ? '#e5e7eb' : '#374151',
          fontWeight: 700,
          backgroundColor: isDark ? '#1f2937' : '#f9fafb',
        },
      },
    },
  },
});
}
