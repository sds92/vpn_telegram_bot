# vpn_telegram_bot

Telegram-бот ShieldVPN: выдача VLESS-конфигов, тарифы, статус.

## Стек

- **Node.js** + TypeScript
- **Telegraf**
- **i18n** (RU/EN)
- HTTP-клиент к [vpn_backend](https://github.com/sds92/vpn_backend)

## Структура

```
src/
├── bot/           # хендлеры, клавиатуры, middleware
├── config/        # переменные окружения
├── i18n/          # локализация
├── services/      # API-клиент к backend
├── utils/         # logger, QR
└── index.ts
```

## Запуск

```bash
cp .env.example .env
# TELEGRAM_BOT_TOKEN, API_KEY (= TELEGRAM_WEBHOOK_SECRET из backend)
npm install
npm run dev
```

### Docker

```bash
docker compose up -d
```

## Меню

- Личный кабинет — статус и трафик
- Мой VPN — ссылка + QR
- Тарифы — список из `/public/plans`
- Поддержка / Инструкции / Скачать клиент
