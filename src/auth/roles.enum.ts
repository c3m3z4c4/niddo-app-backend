export enum Role {
  // Platform level — Niddo owner, no condominiumId
  PLATFORM_ADMIN = 'PLATFORM_ADMIN',

  // Condominium level — admins
  CONDO_ADMIN  = 'CONDO_ADMIN',
  PRESIDENTE   = 'PRESIDENTE',
  SECRETARIO   = 'SECRETARIO',
  TESORERO     = 'TESORERO',

  // Condominium level — resident
  RESIDENT = 'RESIDENT',
}

/** Board roles that are unique per condominium (max 1 each) */
export const UNIQUE_ROLES: Role[] = [
  Role.PRESIDENTE,
  Role.SECRETARIO,
  Role.TESORERO,
];

/** All roles with admin-level access inside a condominium */
export const CONDO_ADMIN_ROLES: Role[] = [
  Role.PLATFORM_ADMIN,
  Role.CONDO_ADMIN,
  Role.PRESIDENTE,
  Role.SECRETARIO,
  Role.TESORERO,
];

/** @deprecated use CONDO_ADMIN_ROLES */
export const ADMIN_ROLES = CONDO_ADMIN_ROLES;
