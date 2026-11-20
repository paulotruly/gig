import { z } from 'zod';

const decimal = z.string().regex(/^-?\d{1,12}(\.\d{1,2})?$/, 'Use texto decimal, como "1200.50".');
const positiveDecimal = decimal.refine((value) => !value.startsWith('-') && Number(value) > 0, {
  message: 'O valor precisa ser positivo.',
});
const isoDate = z.iso.date();

export const BUSINESS_TYPES = ['MEI', 'ME', 'STARTUP', 'SERVICE_PROVIDER'] as const;
export const PARTNER_TYPES = [
  'BANK',
  'ACCOUNTING',
  'ACCELERATOR',
  'INCUBATOR',
  'PLATFORM',
  'COMMUNITY',
  'INVESTOR',
] as const;
export const CONSENT_PURPOSES = [
  'ASSISTED_INGESTION',
  'OPEN_FINANCE',
  'WHATSAPP_NOTIFICATIONS',
  'PARTNER_AGGREGATES',
] as const;
export const LABEL_VALUES = ['PERSONAL', 'BUSINESS', 'TAX', 'SUPPLIER', 'WITHDRAWAL'] as const;

export const registerBody = z.strictObject({
  name: z.string().trim().min(1).max(120),
  email: z.email().max(191),
  password: z.string().min(10).max(200),
  phone: z
    .string()
    .regex(/^\d{10,15}$/)
    .optional(),
});

export const authProvidersResponse = z.object({ google: z.boolean() });
export type AuthProvidersResponse = z.infer<typeof authProvidersResponse>;

export const loginBody = z.strictObject({
  email: z.email().max(191),
  password: z.string().min(1).max(200),
});

export const createBusinessBody = z.strictObject({
  name: z.string().trim().min(1).max(120),
  type: z.enum(BUSINESS_TYPES),
  partnerCode: z.string().trim().min(1).max(32).optional(),
});

export const cashBalanceBody = z.strictObject({ amount: decimal, date: isoDate });

export const addMemberBody = z.strictObject({ email: z.email().max(191) });

export const createConsentBody = z.strictObject({
  businessId: z.number().int().positive(),
  purpose: z.enum(CONSENT_PURPOSES),
  scope: z.string().trim().min(1).max(191),
  expiresAt: z.iso.datetime().optional(),
});

export const statementQuery = z.object({ format: z.enum(['csv', 'ofx']) });

export const listTransactionsQuery = z.object({
  q: z.string().trim().min(1).max(100).optional(),
  from: isoDate.optional(),
  to: isoDate.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
});

export const patchTransactionBody = z.strictObject({ label: z.enum(LABEL_VALUES) });

export const createCommitmentBody = z.strictObject({
  type: z.enum(['FIXED_EXPENSE', 'RECEIVABLE']),
  description: z.string().trim().min(1).max(191),
  amount: positiveDecimal,
  dueDate: isoDate,
  recurrence: z.enum(['NONE', 'MONTHLY']).default('NONE'),
});

export const listTracksQuery = z.object({
  businessId: z.coerce.number().int().positive().optional(),
});

export const trackProgressBody = z.strictObject({
  businessId: z.number().int().positive(),
  percent: z.number().int().min(0).max(100),
});

const scenarioResponse = z.object({
  endBalance: decimal,
  firstNegativeDate: isoDate.nullable(),
  runway: z.object({
    months: z.string().nullable(),
    status: z.enum(['finite', 'not_burning']),
  }),
});

export const forecastResponse = z.object({
  businessId: z.number().int(),
  generatedAt: isoDate,
  horizonWeeks: z.number().int(),
  scenarios: z.object({
    conservative: scenarioResponse,
    likely: scenarioResponse,
    favorable: scenarioResponse,
  }),
  safeWithdrawal: decimal,
  explanation: z.array(z.string()),
  rulesVersion: z.string(),
});
export type ForecastResponse = z.infer<typeof forecastResponse>;

// Respostas consumidas pelo front-end: o formato vem dos módulos da API e é conferido em teste.
export const errorResponse = z.object({
  error: z.object({ code: z.string(), message: z.string() }),
});
export type ErrorResponse = z.infer<typeof errorResponse>;

export const meResponse = z.object({ id: z.number().int(), name: z.string(), email: z.string() });
export type MeResponse = z.infer<typeof meResponse>;

const business = z.object({
  id: z.number().int(),
  name: z.string(),
  type: z.enum(BUSINESS_TYPES),
  role: z.enum(['OWNER', 'ACCOUNTANT']),
  cashBalance: decimal.nullable(),
  cashBalanceDate: isoDate.nullable(),
});
export type Business = z.infer<typeof business>;
export const businessesResponse = z.object({ businesses: z.array(business) });
export type BusinessesResponse = z.infer<typeof businessesResponse>;

export const createBusinessResponse = business.pick({ id: true, name: true, type: true });

const transaction = z.object({
  id: z.number().int(),
  date: isoDate,
  amount: decimal,
  description: z.string(),
  category: z.string(),
  label: z.enum(LABEL_VALUES),
  origin: z.enum(['PERSONAL', 'BUSINESS']),
  labelSource: z.enum(['RULE', 'LEARNED', 'USER']),
  userCorrected: z.boolean(),
});
export const transactionResponse = transaction;
export type Transaction = z.infer<typeof transaction>;
export const transactionsResponse = z.object({
  total: z.number().int(),
  page: z.number().int(),
  pageSize: z.number().int(),
  transactions: z.array(transaction),
});
export type TransactionsResponse = z.infer<typeof transactionsResponse>;

const commitment = z.object({
  id: z.number().int(),
  type: z.enum(['FIXED_EXPENSE', 'RECEIVABLE']),
  description: z.string(),
  amount: decimal,
  dueDate: isoDate,
  recurrence: z.enum(['NONE', 'MONTHLY']),
});
export const commitmentResponse = commitment;
export type Commitment = z.infer<typeof commitment>;
export const commitmentsResponse = z.object({ commitments: z.array(commitment) });
export type CommitmentsResponse = z.infer<typeof commitmentsResponse>;

const alert = z.object({
  id: z.number().int(),
  ruleId: z.string(),
  referenceDate: isoDate,
  message: z.string(),
  explanation: z.string(),
  data: z.unknown(),
  trackSlug: z.string(),
  rulesVersion: z.string(),
  channel: z.enum(['APP', 'WHATSAPP']),
  status: z.enum(['PENDING', 'SENT', 'SKIPPED', 'FAILED']),
  createdAt: z.iso.datetime(),
});
export type Alert = z.infer<typeof alert>;
export const alertsResponse = z.object({ alerts: z.array(alert) });
export type AlertsResponse = z.infer<typeof alertsResponse>;

const track = z.object({
  id: z.number().int(),
  slug: z.string(),
  title: z.string(),
  summary: z.string(),
  percent: z.number().int().min(0).max(100).optional(),
});
export type Track = z.infer<typeof track>;
export const tracksResponse = z.object({ tracks: z.array(track) });
export type TracksResponse = z.infer<typeof tracksResponse>;

export const trackProgressResponse = z.object({
  trackId: z.number().int(),
  businessId: z.number().int(),
  percent: z.number().int(),
});
export type TrackProgressResponse = z.infer<typeof trackProgressResponse>;

export const statementUploadResponse = z.object({
  importId: z.number().int(),
  rowsTotal: z.number().int(),
  rowsImported: z.number().int(),
  duplicates: z.number().int(),
});
export type StatementUploadResponse = z.infer<typeof statementUploadResponse>;

export type RegisterBody = z.input<typeof registerBody>;
export type LoginBody = z.input<typeof loginBody>;
export type CreateBusinessBody = z.input<typeof createBusinessBody>;
export type CashBalanceBody = z.input<typeof cashBalanceBody>;
export type CreateConsentBody = z.input<typeof createConsentBody>;
export type CreateCommitmentBody = z.input<typeof createCommitmentBody>;
export type LabelValue = (typeof LABEL_VALUES)[number];

export const whatsappWebhookBody = z.object({
  entry: z
    .array(
      z.object({
        changes: z
          .array(
            z.object({
              value: z.object({
                messages: z
                  .array(z.object({ id: z.string().min(1).max(191), from: z.string().min(1) }))
                  .optional(),
              }),
            }),
          )
          .default([]),
      }),
    )
    .default([]),
});
