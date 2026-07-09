import { Box, CircularProgress, Typography } from '@mui/material';

interface LoadingOverlayProps {
  loading?: boolean;
  label?: string;
}

export function LoadingOverlay({ loading = true, label = 'Завантаження...' }: LoadingOverlayProps) {
  if (!loading) {
    return null;
  }

  return (
    <Box
      sx={{
        display: 'grid',
        placeItems: 'center',
        py: 8,
        gap: 2,
      }}
    >
      <CircularProgress size={42} />
      <Typography color="text.secondary">{label}</Typography>
    </Box>
  );
}
