'use client';

import type {
  AlertsResponse,
  Business,
  CommitmentsResponse,
  ForecastResponse,
  LoginBody,
  MeResponse,
  RegisterBody,
} from '@gig/shared/contracts';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, ApiError, setUnauthenticatedHandler } from './api';
import { useResource, type Resource } from './useResource';

// Só uma preferência visual fica no navegador; a sessão vive no cookie httpOnly.
const BUSINESS_KEY = 'gig:negocio';

type SessionState =
  | { status: 'loading' }
  | { status: 'anonymous' }
  | { status: 'authenticated'; user: MeResponse; businesses: Business[] };

type SessionContextValue = {
  state: SessionState;
  business: Business | undefined;
  selectBusiness: (id: number) => void;
  login: (body: LoginBody) => Promise<void>;
  register: (body: RegisterBody) => Promise<void>;
  logout: () => Promise<void>;
  reloadBusinesses: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

function savedBusinessId(): number | undefined {
  try {
    const value = Number(window.localStorage.getItem(BUSINESS_KEY));
    return Number.isInteger(value) && value > 0 ? value : undefined;
  } catch {
    return undefined;
  }
}

function saveBusinessId(id: number): void {
  try {
    window.localStorage.setItem(BUSINESS_KEY, String(id));
  } catch {
    // Sem armazenamento local, só não lembra a escolha.
  }
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SessionState>({ status: 'loading' });
  const [businessId, setBusinessId] = useState<number>();

  const loadAuthenticated = useCallback(async (user: MeResponse) => {
    const { businesses } = await api.listBusinesses();
    setState({ status: 'authenticated', user, businesses });
    const saved = savedBusinessId();
    // O contador só envia extrato; o painel é do dono.
    const owned = businesses.filter((b) => b.role === 'OWNER');
    setBusinessId(owned.find((b) => b.id === saved)?.id ?? owned[0]?.id);
  }, []);

  useEffect(() => {
    setUnauthenticatedHandler(() => setState({ status: 'anonymous' }));
    api
      .me()
      .then(loadAuthenticated)
      .catch(() => setState({ status: 'anonymous' }));
  }, [loadAuthenticated]);

  const login = useCallback(
    async (body: LoginBody) => {
      await loadAuthenticated(await api.login(body));
    },
    [loadAuthenticated],
  );

  const register = useCallback(
    async (body: RegisterBody) => {
      await api.register(body);
      await login({ email: body.email, password: body.password });
    },
    [login],
  );

  const logout = useCallback(async () => {
    await api.logout().catch(() => undefined);
    setBusinessId(undefined);
    setState({ status: 'anonymous' });
  }, []);

  const reloadBusinesses = useCallback(async () => {
    if (state.status === 'authenticated') await loadAuthenticated(state.user);
  }, [state, loadAuthenticated]);

  const selectBusiness = useCallback((id: number) => {
    saveBusinessId(id);
    setBusinessId(id);
  }, []);

  const business =
    state.status === 'authenticated'
      ? state.businesses.find((b) => b.id === businessId && b.role === 'OWNER')
      : undefined;

  return (
    <SessionContext.Provider
      value={{ state, business, selectBusiness, login, register, logout, reloadBusinesses }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession precisa do SessionProvider.');
  return value;
}

type BusinessDataValue = {
  business: Business;
  forecast: Resource<ForecastResponse>;
  commitments: Resource<CommitmentsResponse>;
  alerts: Resource<AlertsResponse>;
  // Chamado depois de qualquer mudança feita pela pessoa (extrato, correção, compromisso).
  refreshAll: () => void;
  version: number;
};

const BusinessDataContext = createContext<BusinessDataValue | null>(null);

export function BusinessDataProvider({
  business,
  children,
}: {
  business: Business;
  children: React.ReactNode;
}) {
  const [version, setVersion] = useState(0);
  const { reloadBusinesses } = useSession();
  const forecast = useResource(() => api.getForecast(business.id), [business.id, version]);
  const commitments = useResource(() => api.listCommitments(business.id), [business.id, version]);
  const alerts = useResource(() => api.listAlerts(business.id), [business.id, version]);

  const refreshAll = useCallback(() => {
    setVersion((v) => v + 1);
    void reloadBusinesses();
  }, [reloadBusinesses]);

  return (
    <BusinessDataContext.Provider
      value={{ business, forecast, commitments, alerts, refreshAll, version }}
    >
      {children}
    </BusinessDataContext.Provider>
  );
}

export function useBusinessData(): BusinessDataValue {
  const value = useContext(BusinessDataContext);
  if (!value) throw new Error('useBusinessData precisa do BusinessDataProvider.');
  return value;
}

// Sem previsão gerada, a API responde 404 com este código.
export function isForecastNotReady(error: ApiError | undefined): boolean {
  return error?.code === 'forecast_not_ready';
}
