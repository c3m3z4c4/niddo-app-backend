import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { Condominium } from '@/types';
import { api } from '@/lib/api';

interface TenantContextType {
  /** The active condominiumId for API calls (null = platform-wide for PLATFORM_ADMIN) */
  tenantId: string | null;
  setTenantId: (id: string | null) => void;
  /** List of available condominiums (only loaded for PLATFORM_ADMIN) */
  condominiums: Condominium[];
  currentCondominium: Condominium | null;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

const TENANT_KEY = 'niddo_tenant_id';

export function TenantProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [tenantId, setTenantIdState] = useState<string | null>(null);
  const [condominiums, setCondominiums] = useState<Condominium[]>([]);

  // On user change: set initial tenantId
  useEffect(() => {
    if (!user) {
      setTenantIdState(null);
      return;
    }

    if (user.role === 'PLATFORM_ADMIN') {
      // Restore previously selected tenant or start with null (platform-wide)
      const stored = localStorage.getItem(TENANT_KEY);
      setTenantIdState(stored ?? null);
      // Also update the header storage
      if (stored) {
        localStorage.setItem(TENANT_KEY, stored);
      } else {
        localStorage.removeItem(TENANT_KEY);
      }
      // Fetch list of condominiums
      api.get<Condominium[]>('/condominiums').then(({ data }) => {
        setCondominiums(data);
      }).catch(() => {});
    } else {
      // Non-admin: always scoped to their own condo
      const id = user.condominiumId ?? null;
      setTenantIdState(id);
      if (id) localStorage.setItem(TENANT_KEY, id);
      else localStorage.removeItem(TENANT_KEY);
    }
  }, [user?.id]);

  const setTenantId = (id: string | null) => {
    setTenantIdState(id);
    if (id) localStorage.setItem(TENANT_KEY, id);
    else localStorage.removeItem(TENANT_KEY);
  };

  const currentCondominium = condominiums.find(c => c.id === tenantId) ?? null;

  return (
    <TenantContext.Provider value={{ tenantId, setTenantId, condominiums, currentCondominium }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}
