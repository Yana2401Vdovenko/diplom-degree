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
import { useTranslation } from 'react-i18next';
import { ActionButton } from '../components/ActionButton';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { DataTable } from '../components/DataTable';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { PageHeader } from '../components/PageHeader';
import { rolePermissionTables } from '../config/rolePermissionTables';
import { useNotification } from '../context/NotificationContext';
import {
  addRole,
  assignRoleToUserByEmail,
  createEmptyTablePermissions,
  createPermissionSet,
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

const permissionActions: RolePermissionAction[] = ['read', 'create', 'update', 'delete'];

export function RolesPage() {
  const { t } = useTranslation();
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

  const permissionLabels: Array<{ key: RolePermissionAction; label: string }> = useMemo(
    () => [
      { key: 'read', label: t('roles.permission.read') },
      { key: 'create', label: t('roles.permission.create') },
      { key: 'update', label: t('roles.permission.update') },
      { key: 'delete', label: t('roles.permission.delete') },
    ],
    [t],
  );

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
        setUsersError(getSupabaseErrorMessage(usersLoadError, t('error.loadUsers')));
      }
    } catch (error) {
      showError(getSupabaseErrorMessage(error, t('error.loadRoles')));
    } finally {
      setLoading(false);
    }
  }, [applyRolesConfig, showError, t]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleAddRole = async () => {
    setSaving(true);
    try {
      const config = await addRole(newRole);
      applyRolesConfig(config);
      setNewRole('');
      showSuccess(t('message.roleAdded'));
    } catch (error) {
      showError(getSupabaseErrorMessage(error, t('error.addRole')));
    } finally {
      setSaving(false);
    }
  };

  const handleRenameRole = async () => {
    if (!renameTarget) return;
    setSaving(true);
    try {
      const config = await renameRole(renameTarget, renameValue);
      applyRolesConfig(config);
      setRenameTarget(null);
      setRenameValue('');
      showSuccess(t('message.roleRenamed'));
      await loadData();
    } catch (error) {
      showError(getSupabaseErrorMessage(error, t('error.renameRole')));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRole = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      const config = await deleteRole(deleteTarget);
      applyRolesConfig(config);
      setDeleteTarget(null);
      showSuccess(t('message.roleDeleted'));
    } catch (error) {
      showError(getSupabaseErrorMessage(error, t('error.deleteRole')));
    } finally {
      setSaving(false);
    }
  };

  const handleAssignRole = async () => {
    setSaving(true);
    try {
      await assignRoleToUserByEmail(assignEmail, assignRole);
      setAssignEmail('');
      showSuccess(t('message.roleAssigned'));
      await loadData();
    } catch (error) {
      showError(getSupabaseErrorMessage(error, t('error.assignRole')));
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePermission = (
    role: string,
    tableName: string,
    action: RolePermissionAction,
  ) => {
    if (role === 'admin') return;

    setPermissions((current) => {
      const rolePermissions = current[role] ?? createEmptyTablePermissions();
      const tablePermissions = rolePermissions[tableName as keyof RoleTablePermissions] ?? createPermissionSet(false);
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
    if (!rolePermissions) return;
    setSaving(true);
    try {
      const config = await updateRolePermissions(role, rolePermissions);
      applyRolesConfig(config);
      showSuccess(t('message.permissionsSaved', { role }));
    } catch (error) {
      showError(getSupabaseErrorMessage(error, t('error.savePermissions')));
    } finally {
      setSaving(false);
    }
  };

  const getPermissionsSummary = (role: string) => {
    if (role === 'admin') return t('roles.fullAccess');
    const rolePermissions = permissions[role];
    if (!rolePermissions) return t('roles.notConfigured');
    const allowedTables = rolePermissionTables.filter((row) =>
      permissionActions.some((action) => rolePermissions[row.tableName]?.[action]),
    ).length;
    return t('roles.tablesCount', { allowed: allowedTables, total: rolePermissionTables.length });
  };

  return (
    <>
      <PageHeader title={t('roles.title')} subtitle={t('roles.subtitle')} />

      <Stack spacing={2.5}>

        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>{t('roles.addRole')}</Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label={t('roles.roleName')}
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
                {t('roles.add')}
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {loading ? (
          <LoadingOverlay />
        ) : (
          <DataTable
            columns={[
              { key: 'role', label: t('roles.role'), minWidth: 220 },
              { key: 'access', label: t('roles.accessPolicies'), minWidth: 220 },
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
                  {t('roles.rename')}
                </ActionButton>
                <ActionButton
                  icon={<DeleteOutlineIcon fontSize="small" />}
                  color="error"
                  onClick={() => setDeleteTarget(row.role)}
                  disabled={row.role === 'admin'}
                >
                  {t('roles.delete')}
                </ActionButton>
              </>
            )}
          />
        )}

        {!loading && (
          <Box>
            <Typography variant="h6" sx={{ mb: 1 }}>{t('roles.accessPolicies')}</Typography>
            <Stack spacing={1.5}>
              {roles.map((role) => {
                const rolePermissions = permissions[role] ?? createEmptyTablePermissions();
                const isAdminRole = role === 'admin';
                return (
                  <Accordion key={role} variant="outlined" disableGutters>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'flex-start', sm: 'center' }} sx={{ width: '100%', pr: 2 }}>
                        <Typography sx={{ fontWeight: 700, flex: 1 }}>{role}</Typography>
                        <Chip size="small" color={isAdminRole ? 'success' : 'primary'} variant={isAdminRole ? 'filled' : 'outlined'} label={getPermissionsSummary(role)} />
                      </Stack>
                    </AccordionSummary>
                    <AccordionDetails>
                      <TableContainer sx={{ overflowX: 'auto' }}>
                        <Table size="small" sx={{ minWidth: 780 }}>
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ minWidth: 220 }}>{t('settings.table')}</TableCell>
                              {permissionLabels.map((action) => (
                                <TableCell key={action.key} align="center" sx={{ minWidth: 130 }}>{action.label}</TableCell>
                              ))}
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {rolePermissionTables.map((row) => (
                              <TableRow key={row.tableName} hover>
                                <TableCell>
                                  <Typography sx={{ fontWeight: 700 }}>{row.label}</Typography>
                                  <Typography variant="body2" color="text.secondary">{row.group} · {row.tableName}</Typography>
                                </TableCell>
                                {permissionLabels.map((action) => (
                                  <TableCell key={action.key} align="center">
                                    <Checkbox
                                      checked={Boolean(rolePermissions[row.tableName]?.[action.key])}
                                      disabled={isAdminRole || saving}
                                      onChange={() => handleTogglePermission(role, row.tableName, action.key)}
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
                          <Button variant="contained" startIcon={<SaveIcon />} onClick={() => void handleSavePermissions(role)} disabled={saving}>
                            {t('roles.savePermissions')}
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
            <Typography variant="h6" sx={{ mb: 2 }}>{t('roles.assignRole')}</Typography>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField label={t('roles.userEmail')} value={assignEmail} onChange={(event) => setAssignEmail(event.target.value)} fullWidth />
              <TextField select label={t('roles.role')} value={assignRole} onChange={(event) => setAssignRole(event.target.value)} sx={{ minWidth: { xs: '100%', md: 220 } }}>
                {roles.map((role) => (
                  <MenuItem key={role} value={role}>{role}</MenuItem>
                ))}
              </TextField>
              <Button variant="contained" onClick={() => void handleAssignRole()} disabled={saving}>{t('roles.assign')}</Button>
            </Stack>
          </CardContent>
        </Card>

        {!loading && (
          <Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'flex-start', sm: 'center' }} sx={{ mb: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6">{t('roles.assignedEmails')}</Typography>
              </Box>
              <Chip color="primary" variant="outlined" label={`${assignedUsers.length} email`} />
            </Stack>
            {usersError && <Alert severity="warning" sx={{ mb: 2 }}>{usersError}</Alert>}
            <DataTable
              columns={[
                { key: 'email', label: 'Email', minWidth: 260 },
                { key: 'role', label: t('roles.role'), minWidth: 160 },
              ]}
              rows={assignedUsers}
              rowKey={(row) => row.id}
              emptyMessage={t('roles.noUsers')}
            />
          </Box>
        )}
      </Stack>

      <Dialog open={Boolean(renameTarget)} onClose={() => setRenameTarget(null)} fullWidth maxWidth="xs">
        <DialogTitle>{t('roles.renameTitle')}</DialogTitle>
        <DialogContent>
          <TextField label={t('roles.newName')} value={renameValue} onChange={(event) => setRenameValue(event.target.value)} fullWidth sx={{ mt: 1 }} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setRenameTarget(null)}>{t('confirm.cancel')}</Button>
          <Button variant="contained" onClick={() => void handleRenameRole()} disabled={saving}>{t('confirm.confirm')}</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={t('roles.deleteTitle')}
        description={t('roles.deleteDescription', { role: deleteTarget ?? '' })}
        confirmLabel={t('roles.delete')}
        confirmColor="error"
        loading={saving}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void handleDeleteRole()}
      />
    </>
  );
}
