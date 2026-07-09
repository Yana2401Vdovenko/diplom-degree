import { Button } from '@mui/material';
import type { ReactNode } from 'react';

interface ActionButtonProps {
  children: string;
  icon: ReactNode;
  color?: 'primary' | 'secondary' | 'error' | 'warning' | 'success';
  onClick?: () => void;
  disabled?: boolean;
}

export function ActionButton({
  children,
  icon,
  color = 'primary',
  onClick,
  disabled = false,
}: ActionButtonProps) {
  return (
    <Button
      size="small"
      variant="outlined"
      color={color}
      startIcon={icon}
      onClick={onClick}
      disabled={disabled}
      sx={{ whiteSpace: 'nowrap' }}
    >
      {children}
    </Button>
  );
}
