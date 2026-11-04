import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(0).max(65535).default(3000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
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
