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
  address?: string;
  status: 'active' | 'inactive';
  type?: 'terreno' | 'en_construccion' | 'casa';
  residents?: User[];
  createdAt: string;
  condominiumId?: string | null;
}

export interface Meeting {
  id: string;
  title: string;
  description?: string;
  location: string;
  date: string;         // YYYY-MM-DD
  startTime: string;    // HH:MM
  endTime?: string;
  status: 'active' | 'cancelled' | 'postponed';
  minutes?: string;
  minutesAgreements?: string;
  minutesResponsibles?: string;
  minutesClosingTime?: string;
  createdById?: string;
  createdAt: string;
  condominiumId?: string | null;
}

export interface GreenAreaEvent {
  id: string;
  title: string;
  description?: string;
  greenArea: string;
  date: string;         // YYYY-MM-DD
  startTime: string;    // HH:MM
  endTime?: string;
  status: 'active' | 'cancelled' | 'postponed';
  createdById?: string;
  createdAt: string;
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

// ── Dues / Cuotas ────────────────────────────────────────────

export type PaymentStatus = 'pending' | 'paid' | 'exempt' | 'overdue';

export interface DuesConfig {
  id: string;
  amount: string;
  effectiveFrom: string;
  condominiumId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DuesPayment {
  id: string;
  userId: string;
  houseId?: string | null;
  month: number;
  year: number;
  amount: string;
  status: PaymentStatus;
  paidAt?: string | null;
  notes?: string | null;
  user?: Pick<User, 'id' | 'name' | 'lastName' | 'email'>;
  house?: Pick<House, 'id' | 'houseNumber' | 'address'>;
  createdAt: string;
  condominiumId?: string | null;
}

export interface DuesSummary {
  total: number;
  paid: number;
  pending: number;
  exempt: number;
  totalAmount: number;
  collectedAmount: number;
}

export interface Debtor {
  userId: string;
  userName: string;
  userEmail: string;
  houseNumber: string;
  houseAddress?: string;
  pendingMonths: number;
  accessStatus: string;
  pendingPayments: { month: number; year: number; amount: number }[];
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
  trialEndsAt?: string | null;
  maxHouses?: number | null;
  maxUsers?: number | null;
  branding: CondominiumBranding;
  createdAt: string;
}
