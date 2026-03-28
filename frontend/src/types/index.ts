export type UserRole =
  | 'PLATFORM_ADMIN'
  | 'CONDO_ADMIN'
  | 'PRESIDENTE'
  | 'SECRETARIO'
  | 'TESORERO'
  | 'RESIDENT';

/** Roles that have access to admin panel */
export const ADMIN_ROLES: UserRole[] = [
  'PLATFORM_ADMIN',
  'CONDO_ADMIN',
  'PRESIDENTE',
  'SECRETARIO',
  'TESORERO',
];

export interface User {
  id: string;
  name: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  role: UserRole;
  houseId?: string | null;
  condominiumId?: string | null;
  isActive: boolean;
  avatarUrl?: string | null;
}

export interface House {
  id: string;
  houseNumber: string;
  responsibleName?: string;
  responsibleUserId?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  condominiumId?: string | null;
}

export interface Meeting {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  createdAt: string;
  createdBy: string;
  condominiumId?: string | null;
}

export interface GreenAreaEvent {
  id: string;
  title: string;
  greenArea: string;
  date: string;
  time: string;
  description: string;
  createdAt: string;
  createdBy: string;
  condominiumId?: string | null;
}

export type RsvpStatus = 'attending' | 'not_attending' | 'maybe';

export interface Rsvp {
  id: string;
  userId: string;
  userName: string;
  targetType: 'meeting' | 'event';
  targetId: string;
  status: RsvpStatus;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// ── Branding ────────────────────────────────────────────────

export interface CondominiumBrandingColors {
  primary: string;
  primaryForeground: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
  sidebarBg: string;
  sidebarFg: string;
  darkPrimary: string | null;
  darkBackground: string | null;
  darkSidebarBg: string | null;
}

export interface CondominiumBrandingFont {
  family: string;
  weights: number[];
}

export interface CondominiumBranding {
  logoUrl: string | null;
  logoMarkUrl: string | null;
  faviconUrl: string | null;
  appName: string;
  colors: CondominiumBrandingColors;
  font: CondominiumBrandingFont;
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'full';
  welcomeMessage: string | null;
  supportEmail: string | null;
  supportPhone: string | null;
}

export interface Condominium {
  id: string;
  name: string;
  slug: string;
  address?: string;
  city?: string;
  state?: string;
  contactEmail?: string;
  phone?: string;
  status: 'active' | 'suspended' | 'trial' | 'cancelled';
  branding: CondominiumBranding;
  createdAt: string;
}
