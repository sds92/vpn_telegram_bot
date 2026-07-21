import { Telegraf } from 'telegraf';
import { config } from './config';
import { logger } from './utils/logger';
import { userMiddleware, SessionContext } from './bot/middleware/user';
import { registerUserHandlers } from './bot/handlers/userHandlers';

async function main() {
  if (!config.telegram.botToken) {
    logger.error('TELEGRAM_BOT_TOKEN is required');
    process.exit(1);
  }

  const bot = new Telegraf<SessionContext>(config.telegram.botToken);

  bot.use(userMiddleware);
  registerUserHandlers(bot);

  bot.catch((err, ctx) => {
    logger.error('Bot error', { err, update: ctx.update });
  });

  await bot.launch();
  logger.info('Bot started');

  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}

main().catch((err) => {
  logger.error('Fatal error', err);
  process.exit(1);
});
