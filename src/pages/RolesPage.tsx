import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SaveIcon from '@mui/icons-material/Save';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActionButton } from '../components/ActionButton';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { DataTable } from '../components/DataTable';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { PageHeader } from '../components/PageHeader';
import {
  rolePermissionTables,
  type RolePermissionTableName,
} from '../config/rolePermissionTables';
import { useNotification } from '../context/NotificationContext';
import {
  addRole,
  assignRoleToUserByEmail,
  deleteRole,
  fetchRolesConfig,
  fetchUsersWithRoles,
  renameRole,
  updateRolePermissions,
  type RolePermissionAction,
  type RolePermissionSet,
  type RolePermissionsConfig,
  type RoleTablePermissions,
  type RolesConfig,
} from '../services/roles.service';
import { getSupabaseErrorMessage } from '../utils/directory';

const permissionActions: Array<{ key: RolePermissionAction; label: string }> = [
  { key: 'read', label: 'Перегляд' },
  { key: 'create', label: 'Додавати' },
  { key: 'update', label: 'Редагувати' },
  { key: 'delete', label: 'Видаляти / архівувати' },
];

function createPermissionSet(value: boolean): RolePermissionSet {
  return {
    read: value,
    create: value,
    update: value,
    delete: value,
  };
}

function createEmptyRolePermissions(): RoleTablePermissions {
  return rolePermissionTables.reduce((accumulator, row) => {
    accumulator[row.tableName] = createPermissionSet(false);
    return accumulator;
  }, {} as RoleTablePermissions);
}

export function RolesPage() {
  const { showSuccess, showError } = useNotification();
  const [roles, setRoles] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<RolePermissionsConfig>({});
  const [users, setUsers] = useState<Array<{ id: string; email: string; role: string }>>([]);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newRole, setNewRole] = useState('');
  const [renameTarget, setRenameTarget] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [assignEmail, setAssignEmail] = useState('');
  const [assignRole, setAssignRole] = useState('');

  const assignedUsers = useMemo(
    () =>
      users
        .filter((user) => Boolean(user.email.trim()) && Boolean(user.role.trim()))
        .sort((first, second) => first.email.localeCompare(second.email, 'uk')),
    [users],
  );

  const applyRolesConfig = useCallback((config: RolesConfig) => {
    setRoles(config.roles);
    setPermissions(config.permissions);
    setAssignRole((current) =>
      current && config.roles.includes(current) ? current : config.roles[0] ?? '',
    );
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setUsersError(null);

    try {
      const nextConfig = await fetchRolesConfig();
      applyRolesConfig(nextConfig);

      try {
        const nextUsers = await fetchUsersWithRoles();
        setUsers(nextUsers);
      } catch (usersLoadError) {
        setUsers([]);
        setUsersError(
          getSupabaseErrorMessage(
            usersLoadError,
            'Не вдалося завантажити email користувачів через Edge Function manage-roles.',
          ),
        );
      }
    } catch (error) {
      showError(getSupabaseErrorMessage(error, 'Не вдалося завантажити ролі.'));
    } finally {
      setLoading(false);
    }
  }, [applyRolesConfig, showError]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleAddRole = async () => {
    setSaving(true);

    try {
      const config = await addRole(newRole);
      applyRolesConfig(config);
      setNewRole('');
      showSuccess('Роль додано.');
    } catch (error) {
      showError(getSupabaseErrorMessage(error, 'Не вдалося додати роль.'));
    } finally {
      setSaving(false);
    }
  };

  const handleRenameRole = async () => {
    if (!renameTarget) {
      return;
    }

    setSaving(true);

    try {
      const config = await renameRole(renameTarget, renameValue);
      applyRolesConfig(config);
      setRenameTarget(null);
      setRenameValue('');
      showSuccess('Роль перейменовано.');
      await loadData();
    } catch (error) {
      showError(getSupabaseErrorMessage(error, 'Не вдалося перейменувати роль.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRole = async () => {
    if (!deleteTarget) {
      return;
    }

    setSaving(true);

    try {
      const config = await deleteRole(deleteTarget);
      applyRolesConfig(config);
      setDeleteTarget(null);
      showSuccess('Роль видалено.');
    } catch (error) {
      showError(getSupabaseErrorMessage(error, 'Не вдалося видалити роль.'));
    } finally {
      setSaving(false);
    }
  };

  const handleAssignRole = async () => {
    setSaving(true);

    try {
      await assignRoleToUserByEmail(assignEmail, assignRole);
      setAssignEmail('');
      showSuccess('Роль призначено користувачу.');
      await loadData();
    } catch (error) {
      showError(
        getSupabaseErrorMessage(
          error,
          'Не вдалося призначити роль. Перевірте Edge Function manage-roles.',
        ),
      );
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePermission = (
    role: string,
    tableName: RolePermissionTableName,
    action: RolePermissionAction,
  ) => {
    if (role === 'admin') {
      return;
    }

    setPermissions((current) => {
      const rolePermissions = current[role] ?? createEmptyRolePermissions();
      const tablePermissions = rolePermissions[tableName] ?? createPermissionSet(false);
      const nextTablePermissions: RolePermissionSet = {
        ...tablePermissions,
        [action]: !tablePermissions[action],
      };

      if (action === 'read' && !nextTablePermissions.read) {
        nextTablePermissions.create = false;
        nextTablePermissions.update = false;
        nextTablePermissions.delete = false;
      }

      if (action !== 'read' && nextTablePermissions[action]) {
        nextTablePermissions.read = true;
      }

      return {
        ...current,
        [role]: {
          ...rolePermissions,
          [tableName]: nextTablePermissions,
        },
      };
    });
  };

  const handleSavePermissions = async (role: string) => {
    const rolePermissions = permissions[role];

    if (!rolePermissions) {
      return;
    }

    setSaving(true);

    try {
      const config = await updateRolePermissions(role, rolePermissions);
      applyRolesConfig(config);
      showSuccess(`Права для ролі "${role}" збережено.`);
    } catch (error) {
      showError(getSupabaseErrorMessage(error, 'Не вдалося зберегти права ролі.'));
    } finally {
      setSaving(false);
    }
  };

  const getPermissionsSummary = (role: string) => {
    if (role === 'admin') {
      return 'Повний доступ';
    }

    const rolePermissions = permissions[role];

    if (!rolePermissions) {
      return 'Не налаштовано';
    }

    const allowedTables = rolePermissionTables.filter((row) =>
      permissionActions.some((action) => rolePermissions[row.tableName]?.[action.key]),
    ).length;

    return `${allowedTables} з ${rolePermissionTables.length} таблиць`;
  };

  return (
    <>
      <PageHeader
        title="Ролі користувачів"
        subtitle="Реєстр ролей, призначення користувачам і просте налаштування прав доступу."
      />

      <Stack spacing={2.5}>
        <Alert severity="info">
          Ролі та політики зберігаються у bucket `app-config/roles.json`. Призначення ролі
          користувачам виконується через Edge Function `manage-roles`, а права нижче можна
          виставляти галочками для кожної таблиці.
        </Alert>

        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Додати роль
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Назва ролі"
                value={newRole}
                onChange={(event) => setNewRole(event.target.value)}
                fullWidth
                placeholder="manager"
              />
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => void handleAddRole()}
                disabled={saving}
              >
                Додати
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {loading ? (
          <LoadingOverlay />
        ) : (
          <DataTable
            columns={[
              { key: 'role', label: 'Роль', minWidth: 220 },
              { key: 'access', label: 'Політики доступу', minWidth: 220 },
            ]}
            rows={roles.map((role) => ({ role, access: getPermissionsSummary(role) }))}
            rowKey={(row) => row.role}
            actions={(row) => (
              <>
                <ActionButton
                  icon={<DriveFileRenameOutlineIcon fontSize="small" />}
                  onClick={() => {
                    setRenameTarget(row.role);
                    setRenameValue(row.role);
                  }}
                >
                  Перейменувати
                </ActionButton>
                <ActionButton
                  icon={<DeleteOutlineIcon fontSize="small" />}
                  color="error"
                  onClick={() => setDeleteTarget(row.role)}
                  disabled={row.role === 'admin'}
                >
                  Видалити
                </ActionButton>
              </>
            )}
          />
        )}

        {!loading && (
          <Box>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Політики доступу
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              Розгорніть роль і виберіть, що вона може робити з конкретними таблицями.
            </Typography>

            <Stack spacing={1.5}>
              {roles.map((role) => {
                const rolePermissions = permissions[role] ?? createEmptyRolePermissions();
                const isAdminRole = role === 'admin';

                return (
                  <Accordion key={role} variant="outlined" disableGutters>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={1}
                        alignItems={{ xs: 'flex-start', sm: 'center' }}
                        sx={{ width: '100%', pr: 2 }}
                      >
                        <Typography sx={{ fontWeight: 700, flex: 1 }}>{role}</Typography>
                        <Chip
                          size="small"
                          color={isAdminRole ? 'success' : 'primary'}
                          variant={isAdminRole ? 'filled' : 'outlined'}
                          label={getPermissionsSummary(role)}
                        />
                      </Stack>
                    </AccordionSummary>
                    <AccordionDetails>
                      {isAdminRole && (
                        <Alert severity="success" sx={{ mb: 2 }}>
                          Роль admin має повний доступ до всіх таблиць і не редагується.
                        </Alert>
                      )}

                      <TableContainer sx={{ overflowX: 'auto' }}>
                        <Table size="small" sx={{ minWidth: 780 }}>
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ minWidth: 220 }}>Таблиця</TableCell>
                              {permissionActions.map((action) => (
                                <TableCell key={action.key} align="center" sx={{ minWidth: 130 }}>
                                  {action.label}
                                </TableCell>
                              ))}
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {rolePermissionTables.map((row) => (
                              <TableRow key={row.tableName} hover>
                                <TableCell>
                                  <Typography sx={{ fontWeight: 700 }}>{row.label}</Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {row.group} · {row.tableName}
                                  </Typography>
                                </TableCell>
                                {permissionActions.map((action) => (
                                  <TableCell key={action.key} align="center">
                                    <Checkbox
                                      checked={Boolean(rolePermissions[row.tableName]?.[action.key])}
                                      disabled={isAdminRole || saving}
                                      onChange={() =>
                                        handleTogglePermission(role, row.tableName, action.key)
                                      }
                                      inputProps={{
                                        'aria-label': `${role}: ${action.label} ${row.label}`,
                                      }}
                                    />
                                  </TableCell>
                                ))}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>

                      {!isAdminRole && (
                        <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }}>
                          <Button
                            variant="contained"
                            startIcon={<SaveIcon />}
                            onClick={() => void handleSavePermissions(role)}
                            disabled={saving}
                          >
                            Зберегти права
                          </Button>
                        </Stack>
                      )}
                    </AccordionDetails>
                  </Accordion>
                );
              })}
            </Stack>
          </Box>
        )}

        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Призначити роль користувачу
            </Typography>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField
                label="Email користувача"
                value={assignEmail}
                onChange={(event) => setAssignEmail(event.target.value)}
                fullWidth
              />
              <TextField
                select
                label="Роль"
                value={assignRole}
                onChange={(event) => setAssignRole(event.target.value)}
                sx={{ minWidth: { xs: '100%', md: 220 } }}
              >
                {roles.map((role) => (
                  <MenuItem key={role} value={role}>
                    {role}
                  </MenuItem>
                ))}
              </TextField>
              <Button variant="contained" onClick={() => void handleAssignRole()} disabled={saving}>
                Призначити
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {!loading && (
          <Box>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1}
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              sx={{ mb: 2 }}
            >
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6">Призначені email</Typography>
                <Typography color="text.secondary">
                  Користувачі Supabase Auth, яким уже задано роль.
                </Typography>
              </Box>
              <Chip
                color="primary"
                variant="outlined"
                label={`${assignedUsers.length} email`}
              />
            </Stack>

            {usersError && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                {usersError}
              </Alert>
            )}

          <DataTable
            columns={[
              { key: 'email', label: 'Email', minWidth: 260 },
              { key: 'role', label: 'Роль', minWidth: 160 },
            ]}
            rows={assignedUsers}
            rowKey={(row) => row.id}
            emptyMessage="Поки немає користувачів із призначеними ролями"
          />
          </Box>
        )}
      </Stack>

      <Dialog open={Boolean(renameTarget)} onClose={() => setRenameTarget(null)} fullWidth maxWidth="xs">
        <DialogTitle>Перейменувати роль</DialogTitle>
        <DialogContent>
          <TextField
            label="Нова назва"
            value={renameValue}
            onChange={(event) => setRenameValue(event.target.value)}
            fullWidth
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setRenameTarget(null)}>Скасувати</Button>
          <Button variant="contained" onClick={() => void handleRenameRole()} disabled={saving}>
            Зберегти
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Видалити роль?"
        description={`Роль "${deleteTarget ?? ''}" буде видалена з реєстру.`}
        confirmLabel="Видалити"
        confirmColor="error"
        loading={saving}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void handleDeleteRole()}
      />
    </>
  );
}
