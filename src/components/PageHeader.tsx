import AddIcon from '@mui/icons-material/Add';
import { Box, Button, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  actionIcon?: ReactNode;
  onAction?: () => void;
}

export function PageHeader({
  title,
  subtitle,
  actionLabel,
  actionIcon = <AddIcon />,
  onAction,
}: PageHeaderProps) {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={2}
      alignItems={{ xs: 'stretch', sm: 'center' }}
      justifyContent="space-between"
      sx={{ mb: 3 }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="h1" sx={{ mb: 0.75 }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography color="text.secondary" sx={{ maxWidth: 760 }}>
            {subtitle}
          </Typography>
        )}
      </Box>

      {actionLabel && (
        <Button
          variant="contained"
          startIcon={actionIcon}
          onClick={onAction}
          sx={{ minHeight: 42, alignSelf: { xs: 'stretch', sm: 'center' } }}
        >
          {actionLabel}
        </Button>
      )}
    </Stack>
  );
}
