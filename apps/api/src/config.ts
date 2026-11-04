import { z } from 'zod';

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().min(0).max(65535).default(3000),
    LOG_LEVEL: z
      .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
      .default('info'),
    DATABASE_URL: z.string().startsWith('mysql://'),
    DATABASE_URL_PARTNER_METRICS: z.string().startsWith('mysql://').optional(),
    FRONTEND_ORIGIN: z.url().optional(),
    APP_BASE_URL: z.url().default('http://localhost:3001'),
    TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(5).default(0),
    RATE_LIMIT_PER_MINUTE: z.coerce.number().int().positive().default(300),
    RATE_LIMIT_PER_USER_PER_MINUTE: z.coerce.number().int().positive().default(300),
    LOGIN_LIMIT_PER_15_MINUTES: z.coerce.number().int().positive().default(10),
    WHATSAPP_APP_SECRET: z.string().min(1).optional(),
    WHATSAPP_VERIFY_TOKEN: z.string().min(1).optional(),
  })
  .superRefine((env, context) => {
    if (env.NODE_ENV === 'production' && !env.DATABASE_URL_PARTNER_METRICS) {
      context.addIssue({
        code: 'custom',
        path: ['DATABASE_URL_PARTNER_METRICS'],
        message: 'Obrigatória em produção (regra 4).',
      });
    }
  });

export type Config = z.infer<typeof envSchema>;

export class InvalidConfigError extends Error {
  constructor(public readonly variables: string[]) {
    super(`Variáveis de ambiente inválidas: ${variables.join(', ')}`);
    this.name = 'InvalidConfigError';
  }
}

// A mensagem cita só os nomes das variáveis: os valores podem ser segredos (regra 8).
export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const result = envSchema.safeParse(env);
  if (!result.success) {
    throw new InvalidConfigError([...new Set(result.error.issues.map((i) => String(i.path[0])))]);
  }
  return result.data;
}
