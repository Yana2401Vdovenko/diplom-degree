import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Box, Button, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

export function NotFoundPage() {
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
          Сторінку не знайдено
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Обраний маршрут відсутній у макеті адміністративної панелі.
        </Typography>
        <Button component={RouterLink} to="/dashboard" variant="contained" startIcon={<ArrowBackIcon />}>
          До головної панелі
        </Button>
      </Box>
    </Box>
  );
}
