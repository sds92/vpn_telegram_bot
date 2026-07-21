import { Markup } from 'telegraf';
import { i18n } from '../i18n';

export type BotLocale = 'ru' | 'en';

function L(locale: string): BotLocale {
  return locale === 'en' ? 'en' : 'ru';
}

export const mainMenu = (locale: string) => {
  i18n.setLocale(L(locale));
  return Markup.keyboard([
    [i18n.__('menu.cabinet'), i18n.__('menu.configs')],
    [i18n.__('menu.plans'), i18n.__('menu.support')],
    [i18n.__('menu.instructions'), i18n.__('menu.client')],
  ])
    .resize()
    .persistent();
};

export const backButton = (locale: string) => {
  i18n.setLocale(L(locale));
  return Markup.keyboard([[i18n.__('menu.back')]])
    .resize()
    .persistent();
};
