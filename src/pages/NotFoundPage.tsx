import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Box, Button, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        textAlign: 'center',
        px: 2,
        bgcolor: 'background.default',
      }}
    >
      <Box>
        <Typography variant="h1" sx={{ mb: 1 }}>
          {t('notFound.title')}
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          {t('notFound.subtitle')}
        </Typography>
        <Button component={RouterLink} to="/dashboard" variant="contained" startIcon={<ArrowBackIcon />}>
          {t('notFound.backToHome')}
        </Button>
      </Box>
    </Box>
  );
}
