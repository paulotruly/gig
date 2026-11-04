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
