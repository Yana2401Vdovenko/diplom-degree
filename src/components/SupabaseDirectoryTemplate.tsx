import ArchiveOutlinedIcon from '@mui/icons-material/ArchiveOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import EditRoadIcon from '@mui/icons-material/EditRoad';
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
import { useTranslation } from 'react-i18next';
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
import { RecordEditDialog } from './directory/RecordEditDialog';

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
  const { t } = useTranslation();
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
    massUpdate,
    getPrimaryValue,
  } = useDirectory(directoryKey);

  const [editingRecord, setEditingRecord] = useState<DirectoryRecordMap | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [archiveCandidate, setArchiveCandidate] = useState<DirectoryRecordMap | null>(null);
  const [statusOptions, setStatusOptions] = useState<
    Array<{ code: string; label: string }>
  >([]);

  const [selectedKeys, setSelectedKeys] = useState<Set<string | number>>(new Set());
  const [massEditOpen, setMassEditOpen] = useState(false);
  const [massEditField, setMassEditField] = useState('');
  const [massEditValue, setMassEditValue] = useState('');

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
        minWidth: field.minWidth ?? (field.key === config.primaryKey ? 120 : 220),
        align: field.align,
        sortable: field.sortable ?? true,
        format: field.format,
      })),
    [config.fields, config.primaryKey],
  );

  const { sortedItems, sortKey, sortDirection, toggleSort } = useSort(
    fieldFilteredItems,
    config.primaryKey,
  );

  const massEditFields = useMemo(
    () => config.fields.filter((f) => !f.readOnlyOnEdit),
    [config.fields],
  );

  const closeDialog = () => {
    setEditingRecord(null);
    setIsEditMode(false);
  };

  const handleSubmit = async (values: DirectoryRecordMap) => {
    const primaryValue = String(values[config.primaryKey] ?? '');

    const success = isEditMode
      ? await updateRecord(primaryValue, values)
      : await createRecord(values);

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

  const handleMassEdit = async () => {
    const primaryValues = Array.from(selectedKeys).map(String);
    const success = await massUpdate(primaryValues, massEditField, massEditValue || null);
    if (success) {
      setSelectedKeys(new Set());
      setMassEditOpen(false);
      setMassEditField('');
      setMassEditValue('');
    }
  };

  return (
    <>
      <PageHeader
        title={config.title}
        subtitle={config.subtitle}
        actionLabel={t('directory.add')}
        onAction={openCreateDialog}
      />

      <Stack spacing={2.5}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <Box sx={{ flex: 1 }}>
            <SearchField
              value={query}
              onChange={setQuery}
              placeholder={t('directory.searchIn', { title: config.title })}
              historySource={config.title}
            />
          </Box>
          <TextField
            select
            label={t('directory.filter')}
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

        {selectedKeys.size > 0 && (
          <Stack direction="row" spacing={1} alignItems="center">
            <Button
              variant="outlined"
              startIcon={<EditRoadIcon />}
              onClick={() => {
                setMassEditField(massEditFields[0]?.key ?? '');
                setMassEditValue('');
                setMassEditOpen(true);
              }}
            >
              {t('directory.massEdit')} ({selectedKeys.size})
            </Button>
            <Button variant="text" color="inherit" onClick={() => setSelectedKeys(new Set())}>
              {t('common.cancel')}
            </Button>
          </Stack>
        )}

        {loading ? (
          <LoadingOverlay />
        ) : (
          <DataTable
            columns={tableColumns}
            rows={sortedItems}
            rowKey={getPrimaryValue}
            sortKey={sortKey}
            sortDirection={sortDirection}
            onSort={toggleSort}
            selectedKeys={selectedKeys}
            onSelectionChange={setSelectedKeys}
            actions={(row) => (
              <>
                <ActionButton
                  icon={<EditOutlinedIcon fontSize="small" />}
                  onClick={() => openEditDialog(row)}
                >
                  {t('directory.edit')}
                </ActionButton>
                <ActionButton
                  icon={<ArchiveOutlinedIcon fontSize="small" />}
                  color="warning"
                  onClick={() => setArchiveCandidate(row)}
                >
                  {t('directory.toArchive')}
                </ActionButton>
              </>
            )}
          />
        )}
      </Stack>

      <RecordEditDialog
        open={Boolean(editingRecord)}
        isEditMode={isEditMode}
        fields={config.fields}
        record={editingRecord}
        saving={saving}
        statusOptions={statusOptions}
        showStatusSelect={directoryKey === 'workload'}
        onClose={closeDialog}
        onSubmit={(values) => void handleSubmit(values)}
      />

      <ConfirmDialog
        open={Boolean(archiveCandidate)}
        title={t('directory.archiveConfirm')}
        description={t('directory.archiveConfirmDescription')}
        confirmLabel={t('directory.archiveConfirmLabel')}
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

      <Dialog open={massEditOpen} onClose={() => setMassEditOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{t('directory.massEditTitle', { count: selectedKeys.size })}</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <Stack spacing={2}>
            <TextField
              select
              label={t('directory.massEditField')}
              value={massEditField}
              onChange={(event) => {
                setMassEditField(event.target.value);
                setMassEditValue('');
              }}
              fullWidth
              size="small"
            >
              {massEditFields.map((field) => (
                <MenuItem key={field.key} value={field.key}>
                  {field.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label={t('directory.massEditValue')}
              value={massEditValue}
              onChange={(event) => setMassEditValue(event.target.value)}
              fullWidth
              size="small"
              placeholder={t('directory.massEditValuePlaceholder')}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setMassEditOpen(false)} disabled={saving}>
            {t('common.cancel')}
          </Button>
          <Button variant="contained" onClick={() => void handleMassEdit()} disabled={saving || !massEditField}>
            {t('common.confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
