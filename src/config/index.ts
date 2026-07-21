import dotenv from 'dotenv';

dotenv.config();

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN || '',
    adminIds: (process.env.TELEGRAM_ADMIN_IDS || '')
      .split(',')
      .map((id) => parseInt(id.trim(), 10))
      .filter(Boolean),
  },
  api: {
    baseUrl: (process.env.API_BASE_URL || 'http://localhost:8000/api').replace(/\/$/, ''),
    key: process.env.API_KEY || '',
  },
  app: {
    clientAppUrl: process.env.CLIENT_APP_URL || 'https://t.me/your_bot',
    logLevel: process.env.LOG_LEVEL || 'info',
    supportUsername: (process.env.TELEGRAM_SUPPORT_USERNAME || '').replace(/^@/, ''),
    telegramBotUsername: (process.env.TELEGRAM_BOT_USERNAME || '').replace(/^@/, ''),
  },
};
