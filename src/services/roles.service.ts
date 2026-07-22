import i18n from 'i18next';
import { supabase } from '../lib/supabase/client';
import {
  rolePermissionTables,
  type RolePermissionTableName,
} from '../config/rolePermissionTables';

const BUCKET = 'app-config';
const FILE_PATH = 'roles.json';

const PERMISSION_ACTIONS = ['read', 'create', 'update', 'delete'] as const;

export type RolePermissionAction = (typeof PERMISSION_ACTIONS)[number];
export type RolePermissionSet = Record<RolePermissionAction, boolean>;
export type RoleTablePermissions = Record<RolePermissionTableName, RolePermissionSet>;
export type RolePermissionsConfig = Record<string, RoleTablePermissions>;

export interface RolesConfig {
  roles: string[];
  permissions: RolePermissionsConfig;
}

const permissionTableNames = rolePermissionTables.map((table) => table.tableName);

export function createPermissionSet(value: boolean): RolePermissionSet {
  return {
    read: value,
    create: value,
    update: value,
    delete: value,
  };
}

export function createEmptyTablePermissions(): RoleTablePermissions {
  return permissionTableNames.reduce((accumulator, tableName) => {
    accumulator[tableName] = createPermissionSet(false);
    return accumulator;
  }, {} as RoleTablePermissions);
}

function createFullTablePermissions(): RoleTablePermissions {
  return permissionTableNames.reduce((accumulator, tableName) => {
    accumulator[tableName] = createPermissionSet(true);
    return accumulator;
  }, {} as RoleTablePermissions);
}

function buildPermissionsFromConfig(config: RolesConfig): RolePermissionsConfig {
  const permissions: RolePermissionsConfig = {};

  for (const role of config.roles) {
    if (role === 'admin') {
      permissions[role] = createFullTablePermissions();
      continue;
    }

    if (config.permissions[role]) {
      permissions[role] = config.permissions[role];
    } else {
      permissions[role] = createEmptyTablePermissions();
    }
  }

  return permissions;
}

async function invokeManageRoles(action: string, params: Record<string, unknown> = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error(i18n.t('roles.edgeFunctionError'));
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

  const response = await fetch(`${supabaseUrl}/functions/v1/manage-roles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      'apikey': anonKey,
    },
    body: JSON.stringify({ action, ...params }),
  });

  const result = await response.json();

  if (!response.ok) {
    const msg = result.details
      ? `${result.error}: ${result.details}`
      : (result.error || i18n.t('roles.edgeFunctionError'));
    throw new Error(msg);
  }

  return result;
}

async function readRolesConfig(): Promise<RolesConfig> {
  const { data: { session } } = await supabase.auth.getSession();
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

  const url = `${supabaseUrl}/storage/v1/object/${BUCKET}/${FILE_PATH}?t=${Date.now()}`;
  const response = await fetch(url, {
    headers: {
      'apikey': anonKey,
      'Authorization': `Bearer ${session?.access_token ?? anonKey}`,
    },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    console.error('[readRolesConfig]', response.status, response.statusText, text);
    throw new Error(`${i18n.t('error.loadRolesConfig')} (${response.status}: ${response.statusText})`);
  }

  const text = await response.text();
  const parsed = JSON.parse(text) as RolesConfig;

  if (!parsed.roles || !Array.isArray(parsed.roles)) {
    throw new Error(i18n.t('roles.emptyRoles'));
  }

  return {
    roles: parsed.roles,
    permissions: parsed.permissions ?? {},
  };
}

async function writeRolesConfig(config: RolesConfig): Promise<void> {
  const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
  const { error } = await supabase.storage.from(BUCKET).upload(FILE_PATH, blob, {
    contentType: 'application/json',
    upsert: true,
  });

  if (error) {
    throw error;
  }
}

export async function fetchRolesConfig(): Promise<RolesConfig> {
  const config = await readRolesConfig();

  return {
    roles: config.roles,
    permissions: buildPermissionsFromConfig(config),
  };
}

export async function addRole(roleName: string): Promise<RolesConfig> {
  const trimmed = roleName.trim();

  if (!trimmed) {
    throw new Error(i18n.t('roles.emptyRoleName'));
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    throw new Error(i18n.t('roles.invalidRoleName'));
  }

  const config = await readRolesConfig();

  if (config.roles.includes(trimmed)) {
    throw new Error(i18n.t('roles.roleExists'));
  }

  config.roles.push(trimmed);
  config.permissions[trimmed] = createEmptyTablePermissions();

  await writeRolesConfig(config);

  return fetchRolesConfig();
}

export async function renameRole(currentRole: string, nextRole: string): Promise<RolesConfig> {
  const trimmedNext = nextRole.trim();

  if (!trimmedNext) {
    throw new Error(i18n.t('roles.emptyRoleName'));
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(trimmedNext)) {
    throw new Error(i18n.t('roles.invalidRoleName'));
  }

  const config = await readRolesConfig();

  if (!config.roles.includes(currentRole)) {
    throw new Error(i18n.t('roles.roleNotFound'));
  }

  if (config.roles.includes(trimmedNext) && trimmedNext !== currentRole) {
    throw new Error(i18n.t('roles.roleExists'));
  }

  config.roles = config.roles.map((role) => (role === currentRole ? trimmedNext : role));
  config.permissions[trimmedNext] = config.permissions[currentRole] ?? createEmptyTablePermissions();
  delete config.permissions[currentRole];

  await writeRolesConfig(config);

  return fetchRolesConfig();
}

export async function deleteRole(roleName: string): Promise<RolesConfig> {
  if (roleName === 'admin') {
    throw new Error(i18n.t('roles.adminDeleteProtected'));
  }

  const config = await readRolesConfig();

  if (!config.roles.includes(roleName)) {
    throw new Error(i18n.t('roles.roleNotFound'));
  }

  config.roles = config.roles.filter((role) => role !== roleName);
  delete config.permissions[roleName];

  await writeRolesConfig(config);

  return fetchRolesConfig();
}

export async function updateRolePermissions(
  roleName: string,
  tablePermissions: RoleTablePermissions,
): Promise<RolesConfig> {
  const config = await readRolesConfig();

  if (!config.roles.includes(roleName)) {
    throw new Error(i18n.t('roles.roleNotFound'));
  }

  if (roleName === 'admin') {
    throw new Error(i18n.t('roles.adminPermissionsProtected'));
  }

  config.permissions[roleName] = tablePermissions;

  await writeRolesConfig(config);

  return fetchRolesConfig();
}

export async function assignRoleToUserByEmail(email: string, role: string) {
  const config = await fetchRolesConfig();

  if (!config.roles.includes(role)) {
    throw new Error(i18n.t('roles.roleNotInRegistry'));
  }

  const data = await invokeManageRoles('assignRole', {
    email: email.trim(),
    role,
  });

  return data;
}

export async function fetchUsersWithRoles() {
  const data = await invokeManageRoles('listUsers');
  return (data as { users: Array<{ id: string; email: string; role: string }> }).users ?? [];
}

export async function pingManageRolesFunction() {
  const data = await invokeManageRoles('ping');
  return data as { ok: boolean; checkedAt: string };
}
