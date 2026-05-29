import { DICT_PERMISSION_KEYS, type PermissionKey } from '@/constants/permissions';

const hasPermission = (roleType?: string, permissions?: string[] | null, permission?: PermissionKey) => {
  if (roleType === 'super_admin') {
    return true;
  }
  if (!permission) {
    return false;
  }
  return Array.isArray(permissions) && permissions.includes(permission);
};

export default function access(initialState?: { currentUser?: API.CurrentUser }) {
  const currentUser = initialState?.currentUser;
  const permissions = currentUser?.permissions ?? [];
  const roleType = currentUser?.roleType;

  return {
    dashboard: hasPermission(roleType, permissions, 'dashboard'),
    core: hasPermission(roleType, permissions, 'core'),
    reports: hasPermission(roleType, permissions, 'reports'),
    ai: hasPermission(roleType, permissions, 'ai'),
    monitor: hasPermission(roleType, permissions, 'monitor'),
    dict_channels: hasPermission(roleType, permissions, 'dict_channels'),
    dict_regions: hasPermission(roleType, permissions, 'dict_regions'),
    dict_users: hasPermission(roleType, permissions, 'dict_users'),
    canViewDict:
      roleType === 'super_admin'
      || DICT_PERMISSION_KEYS.some((permission) => Array.isArray(permissions) && permissions.includes(permission)),
    isSuperAdmin: roleType === 'super_admin',
  };
}
