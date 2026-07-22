import { useTranslation } from 'react-i18next';
import { Box, CircularProgress, Typography } from '@mui/material';

interface LoadingOverlayProps {
  loading?: boolean;
  label?: string;
}

export function LoadingOverlay({ loading = true, label }: LoadingOverlayProps) {
  const { t } = useTranslation();
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
      <Typography color="text.secondary">{label ?? t('common.loading')}</Typography>
    </Box>
  );
}
