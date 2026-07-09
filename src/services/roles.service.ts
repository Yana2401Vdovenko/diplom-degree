import { supabase } from '../lib/supabase/client';
import {
  rolePermissionTables,
  type RolePermissionTableName,
} from '../config/rolePermissionTables';

const ROLES_FILE_PATH = 'roles.json';
const ADMIN_ROLE = 'admin';
const PERMISSION_ACTIONS = ['read', 'create', 'update', 'delete'] as const;

export type RolePermissionAction = (typeof PERMISSION_ACTIONS)[number];
export type RolePermissionSet = Record<RolePermissionAction, boolean>;
export type RoleTablePermissions = Record<RolePermissionTableName, RolePermissionSet>;
export type RolePermissionsConfig = Record<string, RoleTablePermissions>;

export interface RolesConfig {
  roles: string[];
  permissions: RolePermissionsConfig;
  updatedAt: string;
}

const permissionTableNames = rolePermissionTables.map((table) => table.tableName);

function normalizeRoles(roles: string[]): string[] {
  return [...new Set(roles.map((role) => role.trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, 'uk'),
  );
}

function getEdgeFunctionErrorMessage(error: unknown) {
  const message =
    error && typeof error === 'object' && 'message' in error
      ? String((error as { message: string }).message)
      : '';

  if (message.includes('Failed to send a request')) {
    return [
      'Не вдалося звернутися до Edge Function manage-roles.',
      'Перевірте, що функцію задеплоєно в Supabase, у неї є CORS-заголовки,',
      'а в Secrets задано SUPABASE_URL та SUPABASE_SERVICE_ROLE_KEY.',
    ].join(' ');
  }

  return message || 'Помилка Edge Function manage-roles.';
}

function createPermissionSet(value: boolean): RolePermissionSet {
  return {
    read: value,
    create: value,
    update: value,
    delete: value,
  };
}

function createEmptyTablePermissions(): RoleTablePermissions {
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

function normalizeRolePermissions(
  roles: string[],
  permissions?: Partial<Record<string, Partial<Record<string, Partial<RolePermissionSet>>>>>,
): RolePermissionsConfig {
  return roles.reduce<RolePermissionsConfig>((accumulator, role) => {
    if (role === ADMIN_ROLE) {
      accumulator[role] = createFullTablePermissions();
      return accumulator;
    }

    const rolePermissions = createEmptyTablePermissions();

    permissionTableNames.forEach((tableName) => {
      const source = permissions?.[role]?.[tableName];

      PERMISSION_ACTIONS.forEach((action) => {
        rolePermissions[tableName][action] = Boolean(source?.[action]);
      });
    });

    accumulator[role] = rolePermissions;
    return accumulator;
  }, {});
}

async function readRolesConfig(): Promise<RolesConfig> {
  const { data, error } = await supabase.storage.from('app-config').download(ROLES_FILE_PATH);

  if (error || !data) {
    throw new Error(
      error?.message ??
        'Не вдалося завантажити roles.json. Перевірте bucket app-config і права доступу admin.',
    );
  }

  const text = await data.text();

  try {
    const parsed = JSON.parse(text) as Partial<RolesConfig>;

    if (!parsed.roles?.length) {
      throw new Error('Файл roles.json не містить списку ролей.');
    }

    return {
      roles: normalizeRoles(parsed.roles),
      permissions: normalizeRolePermissions(
        normalizeRoles(parsed.roles),
        parsed.permissions as Partial<
          Record<string, Partial<Record<string, Partial<RolePermissionSet>>>>
        >,
      ),
      updatedAt: parsed.updatedAt ?? new Date().toISOString(),
    };
  } catch (parseError) {
    if (parseError instanceof Error && parseError.message.includes('roles.json')) {
      throw parseError;
    }

    throw new Error('Файл roles.json має некоректний формат JSON.');
  }
}

async function writeRolesConfig(roles: string[], permissions?: RolePermissionsConfig) {
  const normalizedRoles = normalizeRoles(roles);
  const payload: RolesConfig = {
    roles: normalizedRoles,
    permissions: normalizeRolePermissions(normalizedRoles, permissions),
    updatedAt: new Date().toISOString(),
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  });

  const { error } = await supabase.storage.from('app-config').upload(ROLES_FILE_PATH, blob, {
    upsert: true,
    contentType: 'application/json',
  });

  if (error) {
    throw new Error(getEdgeFunctionErrorMessage(error));
  }

  return payload;
}

export async function fetchRolesConfig() {
  return readRolesConfig();
}

export async function fetchAvailableRoles() {
  const config = await readRolesConfig();
  return config.roles;
}

export async function addRole(roleName: string) {
  const trimmed = roleName.trim();

  if (!trimmed) {
    throw new Error('Назва ролі не може бути порожньою.');
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    throw new Error('Роль може містити лише латинські літери, цифри, _ та -.');
  }

  const current = await readRolesConfig();

  if (current.roles.includes(trimmed)) {
    throw new Error('Такa роль уже існує.');
  }

  return writeRolesConfig([...current.roles, trimmed], current.permissions);
}

export async function renameRole(currentRole: string, nextRole: string) {
  const trimmedNext = nextRole.trim();

  if (!trimmedNext) {
    throw new Error('Нова назва ролі не може бути порожньою.');
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(trimmedNext)) {
    throw new Error('Роль може містити лише латинські літери, цифри, _ та -.');
  }

  const current = await readRolesConfig();

  if (!current.roles.includes(currentRole)) {
    throw new Error('Роль для перейменування не знайдена.');
  }

  if (current.roles.includes(trimmedNext) && trimmedNext !== currentRole) {
    throw new Error('Роль з такою назвою вже існує.');
  }

  const roles = current.roles.map((role) => (role === currentRole ? trimmedNext : role));
  const permissions = { ...current.permissions };

  if (permissions[currentRole]) {
    permissions[trimmedNext] = permissions[currentRole];
    delete permissions[currentRole];
  }

  return writeRolesConfig(roles, permissions);
}

export async function deleteRole(roleName: string) {
  if (roleName === ADMIN_ROLE) {
    throw new Error('Роль admin не може бути видалена.');
  }

  const current = await readRolesConfig();
  const roles = current.roles.filter((role) => role !== roleName);

  if (roles.length === current.roles.length) {
    throw new Error('Роль для видалення не знайдена.');
  }

  const permissions = { ...current.permissions };
  delete permissions[roleName];

  return writeRolesConfig(roles, permissions);
}

export async function updateRolePermissions(
  roleName: string,
  tablePermissions: RoleTablePermissions,
) {
  const current = await readRolesConfig();

  if (!current.roles.includes(roleName)) {
    throw new Error('Роль для налаштування прав не знайдена.');
  }

  if (roleName === ADMIN_ROLE) {
    throw new Error('Права ролі admin завжди повні та не редагуються.');
  }

  return writeRolesConfig(current.roles, {
    ...current.permissions,
    [roleName]: tablePermissions,
  });
}

export async function assignRoleToUserByEmail(email: string, role: string) {
  const roles = await fetchAvailableRoles();

  if (!roles.includes(role)) {
    throw new Error('Обрана роль відсутня у реєстрі ролей.');
  }

  const { data, error } = await supabase.functions.invoke('manage-roles', {
    body: {
      action: 'assignRole',
      email: email.trim(),
      role,
    },
  });

  if (error) {
    throw error;
  }

  if (data && typeof data === 'object' && 'error' in data) {
    throw new Error(String((data as { error: string }).error));
  }

  return data;
}

export async function fetchUsersWithRoles() {
  const { data, error } = await supabase.functions.invoke('manage-roles', {
    body: { action: 'listUsers' },
  });

  if (error) {
    throw new Error(getEdgeFunctionErrorMessage(error));
  }

  if (data && typeof data === 'object' && 'error' in data) {
    throw new Error(String((data as { error: string }).error));
  }

  return (data as { users: Array<{ id: string; email: string; role: string }> }).users ?? [];
}

export async function pingManageRolesFunction() {
  const { data, error } = await supabase.functions.invoke('manage-roles', {
    body: { action: 'ping' },
  });

  if (error) {
    throw new Error(getEdgeFunctionErrorMessage(error));
  }

  if (data && typeof data === 'object' && 'error' in data) {
    throw new Error(String((data as { error: string }).error));
  }

  return data as { ok: boolean; checkedAt: string };
}
