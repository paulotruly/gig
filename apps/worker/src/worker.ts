import { createPrisma } from '@gig/db';
import { monthOf, SimulatedWhatsAppSender } from '@gig/shared';
import cron from 'node-cron';
import { pino } from 'pino';
import { z } from 'zod';
import { dispatchPendingAlerts } from './dispatch-alerts';
import { syncOpenFinance } from './open-finance';
import { computePartnerMetrics } from './partner-metrics';
import { recalculateAll, recalculateDirty } from './recalculate';

const TIMEZONE = 'America/Sao_Paulo';

const envSchema = z.object({
  DATABASE_URL: z.string().startsWith('mysql://'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  TOKEN_ENCRYPTION_KEY: z.string().min(1).optional(),
});

const parsedEnv = envSchema.safeParse(process.env);
if (!parsedEnv.success) {
  const names = [...new Set(parsedEnv.error.issues.map((i) => String(i.path[0])))];
  console.error(`Variáveis de ambiente inválidas: ${names.join(', ')}`);
  process.exit(1);
}
const env = parsedEnv.data;

const logger = pino({ level: env.LOG_LEVEL });
const prisma = createPrisma(env.DATABASE_URL);
const whatsapp = new SimulatedWhatsAppSender(logger);

function today(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE }).format(new Date());
}

function job(name: string, expression: string, run: () => Promise<object>) {
  return cron.schedule(
    expression,
    async () => {
      try {
        // O resumo só traz contagens, nunca dados de negócio (regra 7).
        logger.info({ job: name, summary: await run() }, 'tarefa concluída');
      } catch (err) {
        logger.error(
          { job: name, errorName: err instanceof Error ? err.name : typeof err },
          'tarefa falhou',
        );
      }
    },
    { name, timezone: TIMEZONE, noOverlap: true },
  );
}

const tasks = [
  job('sincronizar-open-finance', '0 * * * *', () =>
    syncOpenFinance(prisma, null, env.TOKEN_ENCRYPTION_KEY),
  ),
  job('recalcular-alterados', '*/5 * * * *', () => recalculateDirty(prisma, today())),
  job('recalcular-todos', '0 3 * * *', () => recalculateAll(prisma, today())),
  job('enviar-alertas', '*/5 * * * *', () => dispatchPendingAlerts(prisma, whatsapp)),
  job('indicadores-de-parceiros', '30 3 * * *', () =>
    computePartnerMetrics(prisma, monthOf(today())),
  ),
];

logger.info({ tasks: tasks.length }, 'worker no ar');

async function shutdown(signal: NodeJS.Signals) {
  logger.info({ signal }, 'encerrando o worker');
  await Promise.all(tasks.map((task) => task.stop()));
  await prisma.$disconnect();
  process.exit(0);
}

process.once('SIGTERM', shutdown);
process.once('SIGINT', shutdown);
