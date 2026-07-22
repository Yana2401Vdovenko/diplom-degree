import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';
import VisibilityIcon from '@mui/icons-material/Visibility';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNotification } from '../context/NotificationContext';
import {
  fetchAllTables,
  fetchTableColumns,
  fetchTableConstraints,
  fetchTableIndexes,
  executeDDL,
  generateAddColumnSQL,
  generateDropColumnSQL,
  generateRenameColumnSQL,
  generateAlterColumnTypeSQL,
  generateSetNullableSQL,
  generateCreateIndexSQL,
  generateDropIndexSQL,
  type ColumnInfo,
  type ConstraintInfo,
  type IndexInfo,
} from '../services/schema.service';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { PageHeader } from '../components/PageHeader';

const SQL_TYPES = [
  'text', 'varchar', 'char', 'integer', 'bigint', 'smallint',
  'numeric', 'real', 'double precision', 'boolean', 'date',
  'timestamp', 'timestamptz', 'uuid', 'jsonb', 'json',
];

export function SchemaEditorPage() {
  const { t } = useTranslation();
  const { showSuccess, showError } = useNotification();

  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [columns, setColumns] = useState<ColumnInfo[]>([]);
  const [constraints, setConstraints] = useState<ConstraintInfo[]>([]);
  const [indexes, setIndexes] = useState<IndexInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  const [addColOpen, setAddColOpen] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [newColType, setNewColType] = useState('text');
  const [newColNullable, setNewColNullable] = useState(true);
  const [newColDefault, setNewColDefault] = useState('');

  const [renameOpen, setRenameOpen] = useState(false);
  const [renameOld, setRenameOld] = useState('');
  const [renameNew, setRenameNew] = useState('');

  const [sqlPreviewOpen, setSqlPreviewOpen] = useState(false);
  const [pendingSQL, setPendingSQL] = useState('');
  const [pendingDescription, setPendingDescription] = useState('');
  const [executing, setExecuting] = useState(false);

  const loadTables = useCallback(async () => {
    try {
      const list = await fetchAllTables();
      setTables(list);
      if (!selectedTable && list.length > 0) {
        setSelectedTable(list[0]);
      }
    } catch (error) {
      showError(t('schema.loadTablesError'));
    }
  }, [selectedTable, showError, t]);

  const loadTableStructure = useCallback(async () => {
    if (!selectedTable) return;
    setLoading(true);
    try {
      const [cols, cons, idxs] = await Promise.all([
        fetchTableColumns(selectedTable),
        fetchTableConstraints(selectedTable),
        fetchTableIndexes(selectedTable),
      ]);
      setColumns(cols);
      setConstraints(cons);
      setIndexes(idxs);
    } catch (error) {
      showError(t('schema.loadStructureError'));
    } finally {
      setLoading(false);
    }
  }, [selectedTable, showError, t]);

  useEffect(() => {
    void loadTables();
  }, []);

  useEffect(() => {
    if (selectedTable) {
      void loadTableStructure();
    }
  }, [selectedTable]);

  const confirmAndExecute = (sql: string, description: string) => {
    setPendingSQL(sql);
    setPendingDescription(description);
    setSqlPreviewOpen(true);
  };

  const executePending = async () => {
    setExecuting(true);
    try {
      await executeDDL(pendingSQL);
      showSuccess(t('schema.execSuccess'));
      setSqlPreviewOpen(false);
      await loadTableStructure();
    } catch (error) {
      showError(String(error));
    } finally {
      setExecuting(false);
    }
  };

  const handleAddColumn = () => {
    if (!newColName.trim()) return;
    const sql = generateAddColumnSQL(
      selectedTable,
      newColName.trim(),
      newColType,
      newColNullable,
      newColDefault || null,
    );
    confirmAndExecute(sql, t('schema.addColumn'));
    setAddColOpen(false);
    setNewColName('');
    setNewColType('text');
    setNewColNullable(true);
    setNewColDefault('');
  };

  const handleDropColumn = (col: ColumnInfo) => {
    const sql = generateDropColumnSQL(selectedTable, col.column_name);
    confirmAndExecute(sql, t('schema.dropColumn', { name: col.column_name }));
  };

  const handleRename = () => {
    if (!renameNew.trim()) return;
    const sql = generateRenameColumnSQL(selectedTable, renameOld, renameNew.trim());
    confirmAndExecute(sql, t('schema.renameColumn', { from: renameOld, to: renameNew }));
    setRenameOpen(false);
  };

  const handleToggleNullable = (col: ColumnInfo) => {
    const isCurrentlyNullable = col.is_nullable === 'YES';
    const sql = generateSetNullableSQL(selectedTable, col.column_name, !isCurrentlyNullable);
    confirmAndExecute(sql, t('schema.toggleNullable', { name: col.column_name }));
  };

  const handleCreateIndex = (col: ColumnInfo) => {
    const sql = generateCreateIndexSQL(selectedTable, col.column_name, false);
    confirmAndExecute(sql, t('schema.createIndex', { name: col.column_name }));
  };

  const handleDropIndex = (idx: IndexInfo) => {
    const sql = generateDropIndexSQL(idx.index_name);
    confirmAndExecute(sql, t('schema.dropIndex', { name: idx.index_name }));
  };

  return (
    <>
      <PageHeader
        title={t('schema.title')}
        subtitle={t('schema.subtitle')}
      />

      <Stack spacing={2.5}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
          <TextField
            select
            label={t('schema.table')}
            value={selectedTable}
            onChange={(event) => setSelectedTable(event.target.value)}
            sx={{ minWidth: 300 }}
            size="small"
          >
            {tables.map((name) => (
              <MenuItem key={name} value={name}>{name}</MenuItem>
            ))}
          </TextField>
          <Button startIcon={<RefreshIcon />} onClick={() => void loadTableStructure()}>
            {t('schema.refresh')}
          </Button>
        </Stack>

        {selectedTable && (
          <>
            <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
              <Tab label={t('schema.columns')} />
              <Tab label={t('schema.constraints')} />
              <Tab label={t('schema.indexes')} />
            </Tabs>

            {loading ? (
              <LoadingOverlay />
            ) : tabValue === 0 ? (
              <Stack spacing={2}>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => setAddColOpen(true)}
                >
                  {t('schema.addColumn')}
                </Button>

                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>{t('schema.colName')}</TableCell>
                        <TableCell>{t('schema.colType')}</TableCell>
                        <TableCell>{t('schema.colNullable')}</TableCell>
                        <TableCell>{t('schema.colDefault')}</TableCell>
                        <TableCell align="right">{t('directory.actions')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {columns.map((col) => (
                        <TableRow key={col.column_name}>
                          <TableCell><strong>{col.column_name}</strong></TableCell>
                          <TableCell>
                            <Chip label={col.udt_name === 'varchar' ? `varchar(${col.character_maximum_length ?? ''})` : col.udt_name} size="small" variant="outlined" />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={col.is_nullable === 'YES' ? t('schema.nullable') : t('schema.notNull')}
                              color={col.is_nullable === 'YES' ? 'default' : 'success'}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>{col.column_default ?? '—'}</TableCell>
                          <TableCell align="right">
                            <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                              <Button
                                size="small"
                                startIcon={<EditOutlinedIcon />}
                                onClick={() => {
                                  setRenameOld(col.column_name);
                                  setRenameNew(col.column_name);
                                  setRenameOpen(true);
                                }}
                              >
                                {t('schema.rename')}
                              </Button>
                              <Button
                                size="small"
                                onClick={() => void handleToggleNullable(col)}
                              >
                                {col.is_nullable === 'YES' ? t('schema.setNotNull') : t('schema.setNullable')}
                              </Button>
                              <Button
                                size="small"
                                startIcon={<DeleteOutlineIcon />}
                                color="error"
                                onClick={() => void handleDropColumn(col)}
                              >
                                {t('schema.drop')}
                              </Button>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Stack>
            ) : tabValue === 1 ? (
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('schema.constraintName')}</TableCell>
                      <TableCell>{t('schema.constraintType')}</TableCell>
                      <TableCell>{t('schema.constraintColumn')}</TableCell>
                      <TableCell>{t('schema.constraintForeign')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {constraints.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4}>
                          <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                            {t('schema.noConstraints')}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      constraints.map((c) => (
                        <TableRow key={c.constraint_name}>
                          <TableCell>{c.constraint_name}</TableCell>
                          <TableCell><Chip label={c.constraint_type} size="small" /></TableCell>
                          <TableCell>{c.column_name}</TableCell>
                          <TableCell>
                            {c.foreign_table_name ? `${c.foreign_table_name}.${c.foreign_column_name}` : '—'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Stack spacing={2}>
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>{t('schema.indexName')}</TableCell>
                        <TableCell>{t('schema.indexColumns')}</TableCell>
                        <TableCell>{t('schema.indexUnique')}</TableCell>
                        <TableCell align="right">{t('directory.actions')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {indexes.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4}>
                            <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                              {t('schema.noIndexes')}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        indexes.map((idx) => (
                          <TableRow key={idx.index_name}>
                            <TableCell>{idx.index_name}</TableCell>
                            <TableCell>{idx.column_names}</TableCell>
                            <TableCell>
                              <Chip
                                label={idx.is_unique ? t('schema.yes') : t('schema.no')}
                                color={idx.is_unique ? 'success' : 'default'}
                                size="small"
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell align="right">
                              <Button
                                size="small"
                                color="error"
                                startIcon={<DeleteOutlineIcon />}
                                onClick={() => void handleDropIndex(idx)}
                              >
                                {t('schema.dropIndex')}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Typography variant="subtitle2">{t('schema.CreateIndex')}</Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {columns
                    .filter((col) => !indexes.some((idx) => idx.column_names === col.column_name))
                    .map((col) => (
                      <Button
                        key={col.column_name}
                        size="small"
                        variant="outlined"
                        onClick={() => void handleCreateIndex(col)}
                      >
                        {col.column_name}
                      </Button>
                    ))}
                </Stack>
              </Stack>
            )}
          </>
        )}
      </Stack>

      <Dialog open={addColOpen} onClose={() => setAddColOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{t('schema.addColumn')}</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <Stack spacing={2}>
            <TextField
              label={t('schema.colName')}
              value={newColName}
              onChange={(e) => setNewColName(e.target.value)}
              fullWidth
              size="small"
              autoFocus
            />
            <TextField
              select
              label={t('schema.colType')}
              value={newColType}
              onChange={(e) => setNewColType(e.target.value)}
              fullWidth
              size="small"
            >
              {SQL_TYPES.map((type) => (
                <MenuItem key={type} value={type}>{type}</MenuItem>
              ))}
            </TextField>
            <FormControlLabel
              control={
                <Switch
                  checked={newColNullable}
                  onChange={(e) => setNewColNullable(e.target.checked)}
                />
              }
              label={t('schema.nullable')}
            />
            <TextField
              label={t('schema.colDefault')}
              value={newColDefault}
              onChange={(e) => setNewColDefault(e.target.value)}
              fullWidth
              size="small"
              placeholder={t('schema.colDefaultPlaceholder')}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setAddColOpen(false)}>{t('common.cancel')}</Button>
          <Button variant="contained" onClick={() => void handleAddColumn()} disabled={!newColName.trim()}>
            {t('schema.addColumn')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={renameOpen} onClose={() => setRenameOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{t('schema.renameColumn', { from: renameOld, to: '' })}</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <TextField
            label={t('schema.newName')}
            value={renameNew}
            onChange={(e) => setRenameNew(e.target.value)}
            fullWidth
            size="small"
            autoFocus
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setRenameOpen(false)}>{t('common.cancel')}</Button>
          <Button variant="contained" onClick={() => void handleRename()} disabled={!renameNew.trim()}>
            {t('schema.rename')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={sqlPreviewOpen} onClose={() => !executing && setSqlPreviewOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{t('schema.sqlPreview')}</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>{pendingDescription}</Alert>
          <Paper variant="outlined" sx={{ p: 2, fontFamily: 'monospace', whiteSpace: 'pre-wrap', fontSize: 13 }}>
            {pendingSQL}
          </Paper>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setSqlPreviewOpen(false)} disabled={executing}>
            {t('common.cancel')}
          </Button>
          <Button variant="contained" color="warning" onClick={() => void executePending()} disabled={executing}>
            {executing ? t('schema.executing') : t('schema.execute')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
