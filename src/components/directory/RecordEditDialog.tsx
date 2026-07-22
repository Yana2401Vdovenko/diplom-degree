import {
  Autocomplete,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase/client';
import type { DirectoryFieldConfig } from '../../config/directories';
import type { DirectoryRecordMap } from '../../utils/directory';

interface RecordEditDialogProps {
  open: boolean;
  isEditMode: boolean;
  fields: DirectoryFieldConfig[];
  record: DirectoryRecordMap | null;
  saving: boolean;
  statusOptions?: Array<{ code: string; label: string }>;
  showStatusSelect?: boolean;
  onClose: () => void;
  onSubmit: (values: DirectoryRecordMap) => void;
}

export function RecordEditDialog({
  open,
  isEditMode,
  fields,
  record,
  saving,
  statusOptions = [],
  showStatusSelect = false,
  onClose,
  onSubmit,
}: RecordEditDialogProps) {
  const { t } = useTranslation();
  const [values, setValues] = useState<DirectoryRecordMap>({});
  const [foreignOptions, setForeignOptions] = useState<Record<string, Array<{ key: string; label: string }>>>({});

  useEffect(() => {
    if (record) {
      setValues({ ...record });
    }
  }, [record]);

  useEffect(() => {
    if (!open) return;

    const selectFields = fields.filter((f) => f.type === 'select' && f.foreignTable);
    if (selectFields.length === 0) return;

    const loadForeignData = async () => {
      const results: Record<string, Array<{ key: string; label: string }>> = {};

      await Promise.all(
        selectFields.map(async (field) => {
          const extraFields = field.foreignExtraFields?.join(', ') ?? '';
          const selectFields = [field.foreignKey!, field.foreignLabel!, extraFields].filter(Boolean).join(', ');

          const { data } = await supabase
            .from(field.foreignTable!)
            .select(selectFields);

          if (data) {
            results[field.key] = data.map((row: Record<string, unknown>) => {
              const code = String(row[field.foreignKey!]);
              const label = String(row[field.foreignLabel!]);
              const extras = field.foreignExtraFields
                ?.map((f) => String(row[f] ?? ''))
                .filter(Boolean)
                .join(' — ')
                ?? '';
              return {
                key: code,
                label: extras ? `${code} — ${extras}` : label,
              };
            });
          }
        }),
      );

      setForeignOptions(results);
    };

    void loadForeignData();
  }, [open, fields]);

  const handleChange = (key: string, value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {isEditMode ? t('directory.editRecord') : t('directory.addRecord')}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          {fields.map((field) => {
            const disabled = Boolean(isEditMode && field.readOnlyOnEdit);
            const value = values[field.key] ?? '';

            if (showStatusSelect && field.key === 'Код_статусу_викладача' && !isEditMode) {
              return (
                <TextField
                  key={field.key}
                  label={field.label}
                  select
                  value={value}
                  onChange={(event) => handleChange(field.key, event.target.value)}
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

            if (field.type === 'select' && field.foreignTable) {
              const options = foreignOptions[field.key] ?? [];
              const selectedOption = options.find((o) => o.key === value) ?? null;

              return (
                <Autocomplete
                  key={field.key}
                  options={options}
                  getOptionLabel={(option) => option.label}
                  isOptionEqualToValue={(option, val) => option.key === val.key}
                  value={selectedOption}
                  onChange={(_, newValue) => handleChange(field.key, newValue?.key ?? '')}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={field.label}
                      required={field.required}
                      disabled={disabled}
                    />
                  )}
                  fullWidth
                  disabled={disabled}
                />
              );
            }

            return (
              <TextField
                key={field.key}
                label={field.label}
                type={field.type === 'number' ? 'number' : 'text'}
                value={value}
                onChange={(event) => handleChange(field.key, event.target.value)}
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
        <Button onClick={onClose} disabled={saving}>
          {t('directory.cancel')}
        </Button>
        <Button
          variant="contained"
          onClick={() => onSubmit(values)}
          disabled={saving}
        >
          {t('directory.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
