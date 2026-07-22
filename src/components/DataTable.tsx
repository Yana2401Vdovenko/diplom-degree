import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import {
  Box,
  Checkbox,
  Chip,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Typography,
} from '@mui/material';
import { useState, useCallback, type ReactNode } from 'react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import type { SortDirection } from '../hooks/useSort';

export interface DataColumn<T> {
  key: keyof T | string;
  label: string;
  minWidth?: number;
  align?: 'left' | 'right' | 'center';
  sortable?: boolean;
  format?: 'text' | 'date' | 'status';
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
  defaultRowsPerPage?: number;
  rowsPerPageOptions?: number[];
  selectedKeys?: Set<string | number>;
  onSelectionChange?: (selected: Set<string | number>) => void;
}

function DataTableInner<T extends object>({
  columns,
  rows,
  rowKey,
  actions,
  emptyMessage,
  sortKey,
  sortDirection,
  onSort,
  defaultRowsPerPage = 25,
  rowsPerPageOptions = [10, 25, 50, 100],
  selectedKeys,
  onSelectionChange,
}: DataTableProps<T>) {
  const { t } = useTranslation();
  const resolvedEmptyMessage = emptyMessage ?? t('directory.noData');

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(defaultRowsPerPage);

  const paginatedRows = rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const hasSelection = Boolean(selectedKeys && onSelectionChange);
  const allPageSelected = hasSelection && paginatedRows.length > 0 && paginatedRows.every((row) => selectedKeys!.has(rowKey(row)));
  const somePageSelected = hasSelection && paginatedRows.some((row) => selectedKeys!.has(rowKey(row)));

  const handleSelectAll = () => {
    if (!hasSelection) return;
    if (allPageSelected) {
      const next = new Set(selectedKeys!);
      for (const row of paginatedRows) {
        next.delete(rowKey(row));
      }
      onSelectionChange!(next);
    } else {
      const next = new Set(selectedKeys!);
      for (const row of paginatedRows) {
        next.add(rowKey(row));
      }
      onSelectionChange!(next);
    }
  };

  const handleSelectRow = (key: string | number) => {
    if (!hasSelection) return;
    const next = new Set(selectedKeys!);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    onSelectionChange!(next);
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const showPagination = rows.length > rowsPerPageOptions[0];

  return (
    <Paper variant="outlined" sx={{ borderRadius: 2, boxShadow: '0 10px 28px rgba(15, 23, 42, 0.05)' }}>
      <TableContainer sx={{ overflowX: 'auto' }}>
        <Table sx={{ minWidth: 820 }}>
          <TableHead>
            <TableRow>
              {hasSelection && (
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={somePageSelected && !allPageSelected}
                    checked={allPageSelected}
                    onChange={handleSelectAll}
                  />
                </TableCell>
              )}
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
                  {t('directory.actions')}
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedRows.map((row) => {
              const key = rowKey(row);
              return (
                <TableRow key={key} hover selected={hasSelection && selectedKeys!.has(key)}>
                  {hasSelection && (
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedKeys!.has(key)}
                        onChange={() => handleSelectRow(key)}
                      />
                    </TableCell>
                  )}
                {columns.map((column) => {
                  const value = (row as Record<string, unknown>)[String(column.key)];

                  return (
                    <TableCell key={String(column.key)} align={column.align}>
                      {column.render ? (
                        column.render(row)
                      ) : column.format === 'status' ? (
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
              );
            })}

            {paginatedRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length + (hasSelection ? 1 : 0) + (actions ? 1 : 0)}>
                  <Box sx={{ py: 5, textAlign: 'center' }}>
                    <Typography color="text.secondary">{resolvedEmptyMessage}</Typography>
                  </Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {showPagination && (
        <TablePagination
          component="div"
          count={rows.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={rowsPerPageOptions}
          labelRowsPerPage={t('common.rowsPerPage')}
          labelDisplayedRows={({ from, to, count }) =>
            t('common.displayedRows', { from, to, count })
          }
        />
      )}
    </Paper>
  );
}

export const DataTable = React.memo(DataTableInner) as typeof DataTableInner;
