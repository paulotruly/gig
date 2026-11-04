import { pino } from 'pino';
import { createApp } from './app';
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
const server = createApp({ logger }).listen(config.PORT, () => {
  logger.info({ port: config.PORT }, 'API no ar');
});

function shutdown(signal: NodeJS.Signals) {
  logger.info({ signal }, 'encerrando a API');
  server.close((err) => {
    if (err) {
      logger.error({ errorName: err.name }, 'falha ao encerrar a API');
      process.exit(1);
    }
    process.exit(0);
  });
}

process.once('SIGTERM', shutdown);
process.once('SIGINT', shutdown);
