import { createApp } from './app.js';
import { createLogger } from './shared/logging.js';

const logger = createLogger();
const port = Number(process.env.PORT) || 3000;

createApp({ logger }).listen(port, (error?: Error) => {
  if (error) {
    logger.error({ err: error, port }, 'api could not start');
    process.exit(1);
  }
  logger.info({ port }, 'api listening');
});
