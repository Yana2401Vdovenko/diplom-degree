import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import {
  Box,
  Chip,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Typography,
} from '@mui/material';
import type { ReactNode } from 'react';
import type { SortDirection } from '../hooks/useSort';

export interface DataColumn<T> {
  key: keyof T | string;
  label: string;
  minWidth?: number;
  align?: 'left' | 'right' | 'center';
  sortable?: boolean;
  render?: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: DataColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  actions?: (row: T) => ReactNode;
  emptyMessage?: string;
  sortKey?: keyof T | string;
  sortDirection?: SortDirection;
  onSort?: (key: keyof T | string) => void;
}

export function DataTable<T extends object>({
  columns,
  rows,
  rowKey,
  actions,
  emptyMessage = 'Немає даних для відображення',
  sortKey,
  sortDirection,
  onSort,
}: DataTableProps<T>) {
  return (
    <TableContainer
      component={Paper}
      variant="outlined"
      sx={{
        borderRadius: 2,
        overflowX: 'auto',
        boxShadow: '0 10px 28px rgba(15, 23, 42, 0.05)',
      }}
    >
      <Table sx={{ minWidth: 820 }}>
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell
                key={String(column.key)}
                align={column.align}
                sx={{ minWidth: column.minWidth }}
                sortDirection={sortKey === column.key ? sortDirection : false}
              >
                {column.sortable && onSort ? (
                  <TableSortLabel
                    active={sortKey === column.key}
                    direction={sortKey === column.key ? sortDirection : 'asc'}
                    onClick={() => onSort(column.key)}
                    IconComponent={
                      sortKey === column.key
                        ? sortDirection === 'asc'
                          ? ArrowUpwardIcon
                          : ArrowDownwardIcon
                        : UnfoldMoreIcon
                    }
                  >
                    {column.label}
                  </TableSortLabel>
                ) : (
                  column.label
                )}
              </TableCell>
            ))}
            {actions && (
              <TableCell align="right" sx={{ minWidth: 260 }}>
                Дії
              </TableCell>
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={rowKey(row)} hover>
              {columns.map((column) => {
                const value = (row as Record<string, unknown>)[String(column.key)];
                const isStatus = String(column.key).toLowerCase().includes('status');

                return (
                  <TableCell key={String(column.key)} align={column.align}>
                    {column.render ? (
                      column.render(row)
                    ) : isStatus ? (
                      <Chip
                        label={String(value ?? '')}
                        color={String(value).includes('Актив') ? 'success' : 'default'}
                        variant="outlined"
                        size="small"
                        sx={{ fontWeight: 700 }}
                      />
                    ) : (
                      String(value ?? '')
                    )}
                  </TableCell>
                );
              })}
              {actions && (
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    {actions(row)}
                  </Stack>
                </TableCell>
              )}
            </TableRow>
          ))}

          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={columns.length + (actions ? 1 : 0)}>
                <Box sx={{ py: 5, textAlign: 'center' }}>
                  <Typography color="text.secondary">{emptyMessage}</Typography>
                </Box>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
