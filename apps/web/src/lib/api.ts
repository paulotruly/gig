import type {
  AlertsResponse,
  Business,
  BusinessesResponse,
  CashBalanceBody,
  Commitment,
  CommitmentsResponse,
  CreateBusinessBody,
  CreateCommitmentBody,
  ErrorResponse,
  ForecastResponse,
  LabelValue,
  LoginBody,
  MeResponse,
  RegisterBody,
  StatementUploadResponse,
  TrackProgressResponse,
  TracksResponse,
  Transaction,
  TransactionsResponse,
} from '@gig/shared/contracts';

// Mesma origem: o Nginx (ou o Next, em desenvolvimento) encaminha /api para a API.
const BASE = '/api';

// Limite igual ao da API (apps/api/src/modules/ingestion.ts).
export const STATEMENT_MAX_BYTES = 5 * 1024 * 1024;

export const INGESTION_CONSENT_SCOPE = 'Extratos enviados pelo app (CSV e OFX)';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

let onUnauthenticated: () => void = () => {};

// A sessão registra aqui o que fazer quando a renovação falha.
export function setUnauthenticatedHandler(handler: () => void): void {
  onUnauthenticated = handler;
}

async function toApiError(res: Response): Promise<ApiError> {
  const body = (await res.json().catch(() => null)) as ErrorResponse | null;
  return new ApiError(
    res.status,
    body?.error?.code ?? 'unknown_error',
    body?.error?.message ?? 'Não foi possível falar com o servidor.',
  );
}

async function send(path: string, init: RequestInit): Promise<Response> {
  return fetch(`${BASE}${path}`, {
    ...init,
    // O cookie httpOnly viaja sozinho; o JavaScript nunca toca no token.
    credentials: 'include',
    headers: { Accept: 'application/json', ...init.headers },
  });
}

let refreshing: Promise<boolean> | null = null;

function refreshSession(): Promise<boolean> {
  refreshing ??= send('/auth/refresh', { method: 'POST' })
    .then((res) => res.ok)
    .catch(() => false)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

type RequestOptions = { method?: string; body?: unknown; raw?: { text: string; type: string } };

async function request<T>(path: string, options: RequestOptions = {}, retry = true): Promise<T> {
  const init: RequestInit = { method: options.method ?? 'GET' };
  if (options.raw) {
    init.body = options.raw.text;
    init.headers = { 'Content-Type': options.raw.type };
  } else if (options.body !== undefined) {
    init.body = JSON.stringify(options.body);
    init.headers = { 'Content-Type': 'application/json' };
  }
  const res = await send(path, init);
  if (res.status === 401 && retry && !path.startsWith('/auth/')) {
    if (await refreshSession()) {
      return request<T>(path, options, false);
    }
    onUnauthenticated();
  }
  if (!res.ok) {
    throw await toApiError(res);
  }
  return (res.status === 204 ? undefined : await res.json()) as T;
}

export const api = {
  register: (body: RegisterBody) => request<MeResponse>('/auth/register', { method: 'POST', body }),
  login: (body: LoginBody) => request<MeResponse>('/auth/login', { method: 'POST', body }),
  logout: () => request<void>('/auth/logout', { method: 'POST' }),
  me: () => request<MeResponse>('/auth/me'),

  listBusinesses: () => request<BusinessesResponse>('/businesses'),
  createBusiness: (body: CreateBusinessBody) =>
    request<Pick<Business, 'id' | 'name' | 'type'>>('/businesses', { method: 'POST', body }),
  setCashBalance: (businessId: number, body: CashBalanceBody) =>
    request<void>(`/businesses/${businessId}/cash-balance`, { method: 'PUT', body }),

  grantConsent: (businessId: number, purpose: 'ASSISTED_INGESTION', scope: string) =>
    request<{ id: number }>('/consents', { method: 'POST', body: { businessId, purpose, scope } }),
  uploadStatement: (businessId: number, file: { text: string; format: 'csv' | 'ofx' }) =>
    request<StatementUploadResponse>(`/businesses/${businessId}/statements?format=${file.format}`, {
      method: 'POST',
      raw: { text: file.text, type: file.format === 'csv' ? 'text/csv' : 'application/x-ofx' },
    }),

  listTransactions: (businessId: number, query: { page?: number; pageSize?: number } = {}) => {
    const params = new URLSearchParams();
    if (query.page) params.set('page', String(query.page));
    if (query.pageSize) params.set('pageSize', String(query.pageSize));
    const qs = params.size > 0 ? `?${params}` : '';
    return request<TransactionsResponse>(`/businesses/${businessId}/transactions${qs}`);
  },
  correctTransaction: (transactionId: number, label: LabelValue) =>
    request<Transaction>(`/transactions/${transactionId}`, { method: 'PATCH', body: { label } }),

  listCommitments: (businessId: number) =>
    request<CommitmentsResponse>(`/businesses/${businessId}/commitments`),
  createCommitment: (businessId: number, body: CreateCommitmentBody) =>
    request<Commitment>(`/businesses/${businessId}/commitments`, { method: 'POST', body }),
  deleteCommitment: (businessId: number, commitmentId: number) =>
    request<void>(`/businesses/${businessId}/commitments/${commitmentId}`, { method: 'DELETE' }),

  getForecast: (businessId: number) =>
    request<ForecastResponse>(`/businesses/${businessId}/forecast`),
  listAlerts: (businessId: number) => request<AlertsResponse>(`/businesses/${businessId}/alerts`),

  listTracks: () => request<TracksResponse>('/tracks'),
  saveTrackProgress: (trackId: number, businessId: number, percent: number) =>
    request<TrackProgressResponse>(`/tracks/${trackId}/progress`, {
      method: 'POST',
      body: { businessId, percent },
    }),
};
