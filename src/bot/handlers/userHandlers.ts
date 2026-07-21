import { Input, Telegraf } from 'telegraf';
import { SessionContext } from '../middleware/user';
import { mainMenu, type BotLocale } from '../keyboards';
import { backendApi } from '../../services/api';
import { config } from '../../config';
import { i18n } from '../../i18n';
import { generateQRCodeBuffer } from '../../utils/qrcode';
import { logger } from '../../utils/logger';

function userLocale(ctx: SessionContext): BotLocale {
  return ctx.languageCode === 'en' ? 'en' : 'ru';
}

function formatTraffic(used: number, limit: number | null, locale: BotLocale): string {
  const toGb = (b: number) => (b / (1024 ** 3)).toFixed(1);
  if (limit == null) {
    return locale === 'en' ? `${toGb(used)} GB / ∞` : `${toGb(used)} ГБ / ∞`;
  }
  return `${toGb(used)} / ${toGb(limit)} GB`;
}

const CLIENT_LINKS: { msgKey: string; url: string }[] = [
  { msgKey: 'clients.hiddify', url: 'https://github.com/hiddify/hiddify-app/releases' },
  { msgKey: 'clients.v2rayng', url: 'https://github.com/2dust/v2rayNG/releases' },
  { msgKey: 'clients.nekoray', url: 'https://github.com/MatsuriDayo/nekoray/releases' },
];

export function registerUserHandlers(bot: Telegraf<SessionContext>) {
  bot.start(async (ctx) => {
    const locale = userLocale(ctx);
    i18n.setLocale(locale);
    await ctx.reply(i18n.__('welcome'), mainMenu(locale));
  });

  bot.hears(/^(Личный кабинет|Dashboard)$/i, async (ctx) => {
    const locale = userLocale(ctx);
    i18n.setLocale(locale);

    const lines = [i18n.__('cabinet.title')];

    if (ctx.user?.username) {
      lines.push(i18n.__('cabinet.username', ctx.user.username));
    }

    const vpn = ctx.from ? await backendApi.fetchVpnConfig(ctx.from.id) : null;
    if (vpn) {
      lines.push(i18n.__('cabinet.statusActive'));
      lines.push(i18n.__('cabinet.node', vpn.node_name));
    } else {
      lines.push(i18n.__('cabinet.statusInactive'));
    }

    if (ctx.user) {
      lines.push(
        i18n.__('cabinet.traffic', formatTraffic(ctx.user.traffic_used_bytes, ctx.user.traffic_limit_bytes, locale))
      );
    }

    await ctx.reply(lines.join('\n'), mainMenu(locale));
  });

  bot.hears(/^(Мой VPN|My VPN)$/i, async (ctx) => {
    if (!ctx.from) return;
    const locale = userLocale(ctx);
    i18n.setLocale(locale);

    const vpn = await backendApi.fetchVpnConfig(ctx.from.id);
    if (!vpn) {
      await ctx.reply(i18n.__('configs.empty'), mainMenu(locale));
      return;
    }

    let text = i18n.__('configs.ready', vpn.node_name, vpn.share_link);
    if (vpn.fallback_nodes?.length) {
      text += `\n\n${i18n.__('configs.fallbacks', vpn.fallback_nodes.slice(0, 3).join(', '))}`;
    }

    await ctx.reply(text, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: i18n.__('configs.btnQr'), callback_data: 'vpn_qr' },
            { text: i18n.__('configs.btnCopy'), callback_data: 'vpn_copy' },
          ],
        ],
      },
    });
  });

  bot.action('vpn_qr', async (ctx) => {
    await ctx.answerCbQuery();
    if (!ctx.from) return;
    const locale = userLocale(ctx);
    i18n.setLocale(locale);

    const vpn = await backendApi.fetchVpnConfig(ctx.from.id);
    if (!vpn?.share_link) {
      await ctx.reply(i18n.__('errors.noConfig'), mainMenu(locale));
      return;
    }

    try {
      let buffer: Buffer;
      if (vpn.qr_code_base64) {
        const raw = vpn.qr_code_base64.replace(/^data:image\/\w+;base64,/, '');
        buffer = Buffer.from(raw, 'base64');
      } else {
        buffer = await generateQRCodeBuffer(vpn.share_link);
      }
      await ctx.replyWithPhoto(Input.fromBuffer(buffer, 'qr.png'), {
        caption: i18n.__('configs.qrCaption'),
      });
    } catch (err) {
      logger.error('QR send failed', { err });
      await ctx.reply(i18n.__('errors.generic'), mainMenu(locale));
    }
  });

  bot.action('vpn_copy', async (ctx) => {
    await ctx.answerCbQuery();
    if (!ctx.from) return;
    const locale = userLocale(ctx);
    i18n.setLocale(locale);

    const vpn = await backendApi.fetchVpnConfig(ctx.from.id);
    if (!vpn?.share_link) {
      await ctx.reply(i18n.__('errors.noConfig'), mainMenu(locale));
      return;
    }

    await ctx.reply(`\`${vpn.share_link}\``, {
      parse_mode: 'Markdown',
      ...mainMenu(locale),
    });
  });

  bot.hears(/^(Тарифы|Plans)$/i, async (ctx) => {
    const locale = userLocale(ctx);
    i18n.setLocale(locale);

    const plans = await backendApi.fetchPlans();
    if (!plans.length) {
      await ctx.reply(i18n.__('plans.empty'), mainMenu(locale));
      return;
    }

    const lines = [i18n.__('plans.title'), ''];
    for (const p of plans) {
      const traffic =
        p.traffic_limit_gb != null ? `${p.traffic_limit_gb} GB` : i18n.__('plans.unlimited');
      lines.push(
        i18n.__('plans.item', p.name, String(p.price_rub), String(p.duration_days), traffic)
      );
    }
    lines.push('', i18n.__('plans.footer'));

    await ctx.reply(lines.join('\n'), mainMenu(locale));
  });

  bot.hears(/^(Поддержка|Support)$/i, async (ctx) => {
    const locale = userLocale(ctx);
    i18n.setLocale(locale);

    const username = config.app.supportUsername;
    if (!username) {
      await ctx.reply(i18n.__('support.none'), mainMenu(locale));
      return;
    }

    await ctx.reply(i18n.__('support.line', username), {
      reply_markup: {
        inline_keyboard: [[{ text: `@${username}`, url: `https://t.me/${username}` }]],
      },
    });
  });

  bot.hears(/^(Инструкции|Instructions)$/i, async (ctx) => {
    const locale = userLocale(ctx);
    i18n.setLocale(locale);
    await ctx.reply(`${i18n.__('instructions.title')}\n\n${i18n.__('instructions.steps')}`, mainMenu(locale));
  });

  bot.hears(/^(Скачать клиент|Download client)$/i, async (ctx) => {
    const locale = userLocale(ctx);
    i18n.setLocale(locale);

    const buttons = CLIENT_LINKS.map(({ msgKey, url }) => [{ text: i18n.__(msgKey), url }]);
    if (config.app.clientAppUrl) {
      buttons.unshift([{ text: i18n.__('clients.shield'), url: config.app.clientAppUrl }]);
    }

    await ctx.reply(i18n.__('clients.title'), {
      reply_markup: { inline_keyboard: buttons },
    });
  });
}
