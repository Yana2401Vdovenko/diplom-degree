import ArchiveOutlinedIcon from '@mui/icons-material/ArchiveOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { SupabaseDirectoryKey } from '../config/directories';
import { useDirectory } from '../hooks/useDirectory';
import { useSearch } from '../hooks/useSearch';
import { useSort } from '../hooks/useSort';
import { fetchTeacherStatusesForSelect } from '../services/directory.service';
import type { DirectoryRecordMap } from '../utils/directory';
import { ActionButton } from './ActionButton';
import { ConfirmDialog } from './ConfirmDialog';
import { DataTable } from './DataTable';
import { LoadingOverlay } from './LoadingOverlay';
import { PageHeader } from './PageHeader';
import { SearchField } from './SearchField';

interface SupabaseDirectoryTemplateProps {
  directoryKey: SupabaseDirectoryKey;
}

function createEmptyValues(fieldKeys: string[]): DirectoryRecordMap {
  return fieldKeys.reduce<DirectoryRecordMap>((accumulator, key) => {
    accumulator[key] = '';
    return accumulator;
  }, {});
}

export function SupabaseDirectoryTemplate({ directoryKey }: SupabaseDirectoryTemplateProps) {
  const {
    config,
    items,
    loading,
    saving,
    filterField,
    setFilterField,
    filterOptions,
    createRecord,
    updateRecord,
    archiveRecord,
    getPrimaryValue,
  } = useDirectory(directoryKey);

  const [editingRecord, setEditingRecord] = useState<DirectoryRecordMap | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [archiveCandidate, setArchiveCandidate] = useState<DirectoryRecordMap | null>(null);
  const [statusOptions, setStatusOptions] = useState<
    Array<{ code: string; label: string }>
  >([]);

  useEffect(() => {
    if (directoryKey !== 'workload') {
      return;
    }

    void fetchTeacherStatusesForSelect()
      .then((rows) =>
        setStatusOptions(
          rows.map((row) => ({
            code: row.Код_статусу_викладача,
            label: `${row.Код_статусу_викладача} — ${row.Назва_статусу_викладача ?? ''}`,
          })),
        ),
      )
      .catch(() => setStatusOptions([]));
  }, [directoryKey]);

  const selector = useCallback(
    (item: DirectoryRecordMap) =>
      config.fields.map((field) => String(item[field.key] ?? '')).join(' '),
    [config.fields],
  );

  const { query, setQuery, filteredItems } = useSearch(items, selector);

  const fieldFilteredItems = useMemo(() => {
    if (filterField === 'all') {
      return filteredItems;
    }

    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return filteredItems;
    }

    return filteredItems.filter((item) =>
      String(item[filterField] ?? '')
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [filterField, filteredItems, query]);

  const tableColumns = useMemo(
    () =>
      config.fields.map((field) => ({
        key: field.key,
        label: field.label,
        minWidth: field.key === config.primaryKey ? 120 : 220,
        sortable: true,
      })),
    [config.fields, config.primaryKey],
  );

  const { sortedItems, sortKey, sortDirection, toggleSort } = useSort(
    fieldFilteredItems,
    config.primaryKey,
  );

  const closeDialog = () => {
    setEditingRecord(null);
    setIsEditMode(false);
  };

  const handleSubmit = async () => {
    if (!editingRecord) {
      return;
    }

    const primaryValue = String(editingRecord[config.primaryKey] ?? '');

    const success = isEditMode
      ? await updateRecord(primaryValue, editingRecord)
      : await createRecord(editingRecord);

    if (success) {
      closeDialog();
    }
  };

  const openCreateDialog = () => {
    setIsEditMode(false);
    setEditingRecord(createEmptyValues(config.fields.map((field) => field.key)));
  };

  const openEditDialog = (record: DirectoryRecordMap) => {
    setIsEditMode(true);
    setEditingRecord({ ...record });
  };

  return (
    <>
      <PageHeader
        title={config.title}
        subtitle={config.subtitle}
        actionLabel="Додати"
        onAction={openCreateDialog}
      />

      <Stack spacing={2.5}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <Box sx={{ flex: 1 }}>
            <SearchField
              value={query}
              onChange={setQuery}
              placeholder={`Пошук у розділі "${config.title}"`}
              historySource={config.title}
            />
          </Box>
          <TextField
            select
            label="Фільтр"
            value={filterField}
            onChange={(event) => setFilterField(event.target.value)}
            sx={{ minWidth: { xs: '100%', md: 240 } }}
            size="small"
          >
            {filterOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Stack>

        {loading ? (
          <LoadingOverlay />
        ) : (
          <DataTable
            columns={tableColumns}
            rows={sortedItems}
            rowKey={(row) => getPrimaryValue(row)}
            sortKey={sortKey}
            sortDirection={sortDirection}
            onSort={(key) => toggleSort(key)}
            actions={(row) => (
              <>
                <ActionButton
                  icon={<EditOutlinedIcon fontSize="small" />}
                  onClick={() => openEditDialog(row)}
                >
                  Редагувати
                </ActionButton>
                <ActionButton
                  icon={<ArchiveOutlinedIcon fontSize="small" />}
                  color="warning"
                  onClick={() => setArchiveCandidate(row)}
                >
                  До архіву
                </ActionButton>
              </>
            )}
          />
        )}
      </Stack>

      <Dialog open={Boolean(editingRecord)} onClose={closeDialog} fullWidth maxWidth="sm">
        <DialogTitle>{isEditMode ? 'Редагувати запис' : 'Додати запис'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            {config.fields.map((field) => {
              const disabled = Boolean(isEditMode && field.readOnlyOnEdit);
              const value = editingRecord?.[field.key] ?? '';

              if (
                directoryKey === 'workload' &&
                field.key === 'Код_статусу_викладача' &&
                !isEditMode
              ) {
                return (
                  <TextField
                    key={field.key}
                    label={field.label}
                    select
                    value={value}
                    onChange={(event) =>
                      setEditingRecord((current) =>
                        current ? { ...current, [field.key]: event.target.value } : current,
                      )
                    }
                    fullWidth
                    required
                  >
                    {statusOptions.map((option) => (
                      <MenuItem key={option.code} value={option.code}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                );
              }

              return (
                <TextField
                  key={field.key}
                  label={field.label}
                  type={field.type === 'number' ? 'number' : 'text'}
                  value={value}
                  onChange={(event) =>
                    setEditingRecord((current) =>
                      current ? { ...current, [field.key]: event.target.value } : current,
                    )
                  }
                  fullWidth
                  required={field.required}
                  disabled={disabled}
                  inputProps={field.maxLength ? { maxLength: field.maxLength } : undefined}
                  multiline={field.type !== 'number' && field.maxLength === 500}
                  minRows={field.type !== 'number' && field.maxLength === 500 ? 2 : undefined}
                />
              );
            })}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={closeDialog} disabled={saving}>
            Скасувати
          </Button>
          <Button variant="contained" onClick={() => void handleSubmit()} disabled={saving}>
            Зберегти
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={Boolean(archiveCandidate)}
        title="Перемістити до архіву?"
        description="Запис буде прибрано з активного довідника та збережено в архіві. Його можна буде відновити пізніше."
        confirmLabel="До архіву"
        confirmColor="warning"
        loading={saving}
        onClose={() => setArchiveCandidate(null)}
        onConfirm={() => {
          if (!archiveCandidate) {
            return;
          }

          void archiveRecord(archiveCandidate).then((success) => {
            if (success) {
              setArchiveCandidate(null);
            }
          });
        }}
      />
    </>
  );
}
