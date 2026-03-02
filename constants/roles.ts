export const KNOWN_ROLE_SLUGS = [
  'superadmin',
  'admin',
  'moderator',
  'developer',
  'user',
  'agent',
  'client',
  'branch_admin',
  'manager',
  'operator',
  'rop',
] as const;

export type RoleSlug = (typeof KNOWN_ROLE_SLUGS)[number] | 'guest';

const KNOWN_ROLES_SET = new Set<string>(KNOWN_ROLE_SLUGS);

export const PLATFORM_ADMIN_ROLES: readonly RoleSlug[] = ['superadmin', 'admin'];
export const LISTING_MODERATION_ROLES: readonly RoleSlug[] = ['superadmin', 'admin', 'moderator'];
export const CRM_ACCESS_ROLES: readonly RoleSlug[] = ['superadmin', 'admin', 'moderator'];
export const NEW_BUILDINGS_MANAGE_ROLES: readonly RoleSlug[] = [
  'superadmin',
  'admin',
  'developer',
];

export const OWNER_ROLES: readonly RoleSlug[] = ['user', 'client', 'agent'];

export function isOwnerRole(role: unknown): boolean {
  const normalized = normalizeRoleSlug(role);
  return OWNER_ROLES.includes(normalized);
}

export function normalizeRoleSlug(role: unknown): RoleSlug {
  if (typeof role !== 'string') return 'guest';
  const normalized = role.trim().toLowerCase();
  return KNOWN_ROLES_SET.has(normalized) ? (normalized as RoleSlug) : 'guest';
}

export function isPlatformAdminRole(role: unknown): boolean {
  const normalized = normalizeRoleSlug(role);
  return PLATFORM_ADMIN_ROLES.includes(normalized);
}

export function isListingModeratorRole(role: unknown): boolean {
  const normalized = normalizeRoleSlug(role);
  return LISTING_MODERATION_ROLES.includes(normalized);
}

export function canAccessCrm(role: unknown): boolean {
  const normalized = normalizeRoleSlug(role);
  return CRM_ACCESS_ROLES.includes(normalized);
}

export function canManageNewBuildings(role: unknown): boolean {
  const normalized = normalizeRoleSlug(role);
  return NEW_BUILDINGS_MANAGE_ROLES.includes(normalized);
}

export function canAccessAdminPath(pathname: string, role: unknown): boolean {
  const normalized = normalizeRoleSlug(role);

  if (pathname.startsWith('/admin/new-buildings')) {
    return canManageNewBuildings(normalized);
  }

  if (pathname === '/admin/crm' || pathname.startsWith('/admin/crm/')) {
    return canAccessCrm(normalized);
  }

  if (pathname === '/admin' || pathname.startsWith('/admin/users') || pathname.startsWith('/admin/branches')) {
    return isPlatformAdminRole(normalized);
  }

  return isPlatformAdminRole(normalized);
}
