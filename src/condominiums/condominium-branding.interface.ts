export interface CondominiumBrandingColors {
  // Light mode
  primary:           string;   // HSL sin unidades: "147 65% 34%"
  primaryForeground: string;
  secondary:         string;
  accent:            string;
  background:        string;
  foreground:        string;
  sidebarBg:         string;
  sidebarFg:         string;

  // Dark mode overrides (null = ajuste automático)
  darkPrimary:    string | null;
  darkBackground: string | null;
  darkSidebarBg:  string | null;
}

export interface CondominiumBrandingFont {
  family:  string;    // Nombre exacto de Google Fonts: "Inter", "Montserrat", "Poppins"
  weights: number[];  // [400, 500, 600, 700]
}

export interface CondominiumBranding {
  // Identidad visual
  logoUrl:     string | null;  // Logo principal (header / sidebar)
  logoMarkUrl: string | null;  // Ícono cuadrado (avatar, app icon)
  faviconUrl:  string | null;  // 32×32 para <link rel="icon">
  appName:     string;         // Nombre que aparece en el browser tab

  // Paleta
  colors: CondominiumBrandingColors;

  // Tipografía
  font: CondominiumBrandingFont;

  // Forma
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'full';

  // Contenido contextual
  welcomeMessage: string | null;
  supportEmail:   string | null;
  supportPhone:   string | null;
}

export const DEFAULT_BRANDING: CondominiumBranding = {
  logoUrl:     null,
  logoMarkUrl: null,
  faviconUrl:  null,
  appName:     'Mi Condominio',

  colors: {
    primary:           '239 84% 67%',   // Índigo Niddo
    primaryForeground: '0 0% 100%',
    secondary:         '239 50% 90%',
    accent:            '16 85% 60%',    // Coral/Terracota
    background:        '0 0% 98%',
    foreground:        '222 47% 11%',
    sidebarBg:         '228 45% 18%',   // Índigo oscuro
    sidebarFg:         '0 0% 100%',
    darkPrimary:       null,
    darkBackground:    null,
    darkSidebarBg:     null,
  },

  font: {
    family:  'Inter',
    weights: [400, 500, 600, 700],
  },

  borderRadius:    'lg',
  welcomeMessage:  null,
  supportEmail:    null,
  supportPhone:    null,
};

/** Branding de "Privadas del Parque" para el condominio seed */
export const PRIVADAS_DEL_PARQUE_BRANDING: CondominiumBranding = {
  logoUrl:     null,
  logoMarkUrl: null,
  faviconUrl:  null,
  appName:     'Privadas del Parque',

  colors: {
    primary:           '147 65% 34%',
    primaryForeground: '0 0% 100%',
    secondary:         '134 30% 69%',
    accent:            '25 76% 57%',
    background:        '60 7% 97%',
    foreground:        '0 0% 18%',
    sidebarBg:         '147 65% 34%',
    sidebarFg:         '0 0% 100%',
    darkPrimary:       '147 65% 40%',
    darkBackground:    '0 0% 12%',
    darkSidebarBg:     '0 0% 10%',
  },

  font: {
    family:  'Dosis',
    weights: [300, 400, 500, 600, 700, 800],
  },

  borderRadius:    'lg',
  welcomeMessage:  '¡Bienvenido a Privadas del Parque!',
  supportEmail:    null,
  supportPhone:    null,
};
