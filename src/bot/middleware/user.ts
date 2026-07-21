import { Context } from 'telegraf';
import { getOrCreateUser, type TelegramFrom } from '../../services/userService';
import { config } from '../../config';
import { i18n } from '../../i18n';
import type { BackendUser } from '../../services/api';

export interface SessionContext extends Context {
  user?: BackendUser | null;
  languageCode?: string;
  isAdmin?: boolean;
}

export async function userMiddleware(ctx: SessionContext, next: () => Promise<void>): Promise<void> {
  const from = ctx.from;
  if (!from) return next();

  const { user, languageCode } = await getOrCreateUser(from as TelegramFrom);

  ctx.user = user;
  ctx.languageCode = languageCode;
  ctx.isAdmin = config.telegram.adminIds.includes(from.id);

  if (user?.status === 'banned') {
    i18n.setLocale(languageCode);
    await ctx.reply(i18n.__('errors.banned'));
    return;
  }

  return next();
}
