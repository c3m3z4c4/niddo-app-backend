import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { CondominiumBranding } from '@/types';
import { api } from '@/lib/api';
import { useTenant } from './TenantContext';

const BORDER_RADIUS_MAP: Record<string, string> = {
  none: '0rem',
  sm:   '0.25rem',
  md:   '0.5rem',
  lg:   '0.75rem',
  full: '9999px',
};

interface BrandingContextType {
  branding: CondominiumBranding | null;
  isLoading: boolean;
}

const BrandingContext = createContext<BrandingContextType>({ branding: null, isLoading: false });

function applyBranding(branding: CondominiumBranding, isDark: boolean) {
  const root = document.documentElement;
  const c = branding.colors;

  // Light mode tokens
  root.style.setProperty('--primary',            c.primary);
  root.style.setProperty('--primary-foreground', c.primaryForeground);
  root.style.setProperty('--secondary',          c.secondary);
  root.style.setProperty('--accent',             c.accent);
  root.style.setProperty('--accent-foreground',  c.primaryForeground);
  root.style.setProperty('--background',         c.background);
  root.style.setProperty('--foreground',         c.foreground);
  root.style.setProperty('--ring',               c.primary);
  root.style.setProperty('--sidebar-background', isDark && c.darkSidebarBg ? c.darkSidebarBg : c.sidebarBg);
  root.style.setProperty('--sidebar-foreground', c.sidebarFg);
  root.style.setProperty('--sidebar-accent',     c.sidebarBg);
  root.style.setProperty('--sidebar-accent-foreground', c.sidebarFg);
  root.style.setProperty('--sidebar-border',     c.sidebarBg);
  root.style.setProperty('--sidebar-ring',       c.sidebarFg);

  if (isDark) {
    if (c.darkPrimary)    root.style.setProperty('--primary',    c.darkPrimary);
    if (c.darkBackground) root.style.setProperty('--background', c.darkBackground);
  }

  // Border radius
  const radius = BORDER_RADIUS_MAP[branding.borderRadius] ?? '0.75rem';
  root.style.setProperty('--radius', radius);

  // Font — inject Google Fonts link if not built-in
  const builtIn = ['Inter', 'Poppins', 'Dosis', 'Playfair Display'];
  if (!builtIn.includes(branding.font.family)) {
    const linkId = 'niddo-google-font';
    let link = document.getElementById(linkId) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    const weights = branding.font.weights.join(';');
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(branding.font.family)}:wght@${weights}&display=swap`;
  }
  root.style.setProperty('--font-sans', `"${branding.font.family}", sans-serif`);

  // App name
  if (branding.appName) {
    document.title = branding.appName;
  }

  // Favicon
  if (branding.faviconUrl) {
    let favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement | null;
    if (!favicon) {
      favicon = document.createElement('link');
      favicon.rel = 'icon';
      document.head.appendChild(favicon);
    }
    favicon.href = branding.faviconUrl;
  }
}

export function BrandingProvider({ children }: { children: ReactNode }) {
  const { tenantId } = useTenant();
  const [branding, setBranding] = useState<CondominiumBranding | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!tenantId) {
      setBranding(null);
      return;
    }

    setIsLoading(true);
    api.get<{ branding: CondominiumBranding }>(`/condominiums/${tenantId}/public`)
      .then(({ data }) => {
        setBranding(data.branding);
        const isDark = document.documentElement.classList.contains('dark');
        applyBranding(data.branding, isDark);
      })
      .catch(() => {
        setBranding(null);
      })
      .finally(() => setIsLoading(false));
  }, [tenantId]);

  return (
    <BrandingContext.Provider value={{ branding, isLoading }}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  return useContext(BrandingContext);
}
