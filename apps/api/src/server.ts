import { createPrisma } from '@gig/db';
import { SimulatedWhatsAppSender } from '@gig/shared';
import { pino } from 'pino';
import { apiRouters, createApp } from './app';
import { InvalidConfigError, loadConfig, type Config } from './config';

function readConfig(): Config {
  try {
    return loadConfig();
  } catch (err) {
    if (err instanceof InvalidConfigError) {
      console.error(err.message);
      process.exit(1);
    }
    throw err;
  }
}

const config = readConfig();
const logger = pino({ level: config.LOG_LEVEL });
const prisma = createPrisma(config.DATABASE_URL);
const partnerMetricsDb = config.DATABASE_URL_PARTNER_METRICS
  ? createPrisma(config.DATABASE_URL_PARTNER_METRICS)
  : prisma;

const server = createApp({
  logger,
  checkDatabase: () => prisma.$queryRaw`SELECT 1`,
  corsOrigin: config.FRONTEND_ORIGIN,
  trustProxyHops: config.TRUST_PROXY_HOPS,
  rateLimitPerMinute: config.RATE_LIMIT_PER_MINUTE,
  routers: apiRouters({
    prisma,
    partnerMetricsDb,
    config,
    whatsapp: new SimulatedWhatsAppSender(logger),
  }),
}).listen(config.PORT, () => {
  logger.info({ port: config.PORT }, 'API no ar');
});

function shutdown(signal: NodeJS.Signals) {
  logger.info({ signal }, 'encerrando a API');
  server.close(async (err) => {
    await prisma.$disconnect();
    if (partnerMetricsDb !== prisma) {
      await partnerMetricsDb.$disconnect();
    }
    if (err) {
      logger.error({ errorName: err.name }, 'falha ao encerrar a API');
      process.exit(1);
    }
    process.exit(0);
  });
}

process.once('SIGTERM', shutdown);
process.once('SIGINT', shutdown);
