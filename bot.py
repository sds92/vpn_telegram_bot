import asyncio
import logging

import httpx
from aiogram import Bot, Dispatcher, F
from aiogram.filters import Command
from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup, Message

from config import settings

logging.basicConfig(level=logging.INFO)
bot = Bot(token=settings.bot_token)
dp = Dispatcher()


def main_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text="📥 Получить VPN", callback_data="get_vpn")],
            [InlineKeyboardButton(text="💳 Тарифы", callback_data="plans")],
            [InlineKeyboardButton(text="📊 Мой статус", callback_data="status")],
            [InlineKeyboardButton(text="🆘 Поддержка", url=f"https://t.me/{settings.support_username}")],
        ]
    )


async def register_user(telegram_id: int, username: str | None) -> dict:
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            f"{settings.api_base_url}/internal/users/telegram",
            params={"telegram_id": telegram_id, "username": username},
            headers={"X-Api-Key": settings.api_key},
        )
        return resp.json() if resp.status_code < 400 else {}


async def fetch_vpn_config(telegram_id: int) -> dict | None:
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(
            f"{settings.api_base_url}/vpn/config/subscription/{telegram_id}",
            params={"api_key": settings.api_key},
        )
        if resp.status_code != 200:
            return None
        return resp.json()


async def fetch_plans() -> list:
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(f"{settings.api_base_url}/public/plans")
        return resp.json() if resp.status_code == 200 else []


@dp.message(Command("start"))
async def cmd_start(message: Message):
    user = message.from_user
    if user:
        await register_user(user.id, user.username)
    await message.answer(
        "👋 *ShieldVPN* — VPN для России\n\n"
        "• VLESS + Reality — обход блокировок и DPI\n"
        "• Автопереключение при блокировке IP\n"
        "• iOS / Android приложение\n\n"
        "Нажмите «Получить VPN» для конфигурации.",
        parse_mode="Markdown",
        reply_markup=main_keyboard(),
    )


@dp.callback_query(F.data == "get_vpn")
async def cb_get_vpn(callback):
    await callback.answer()
    user = callback.from_user
    config = await fetch_vpn_config(user.id)

    if not config:
        await callback.message.answer(
            "⚠️ Активная подписка не найдена.\n"
            "Оформите тариф через «💳 Тарифы» или напишите в поддержку.",
            reply_markup=main_keyboard(),
        )
        return

    link = config.get("share_link", "")
    node = config.get("node_name", "")
    fallbacks = config.get("fallback_nodes", [])

    text = (
        f"✅ *Конфиг готов*\n\n"
        f"🖥 Нода: `{node}`\n"
        f"📡 Протокол: VLESS + Reality\n\n"
        f"```\n{link}\n```\n\n"
        f"Скопируйте ссылку в приложение ShieldVPN или v2rayNG.\n"
    )
    if fallbacks:
        text += f"\n🔄 Резервные ноды: {', '.join(fallbacks[:3])}"

    await callback.message.answer(text, parse_mode="Markdown", reply_markup=main_keyboard())


@dp.callback_query(F.data == "plans")
async def cb_plans(callback):
    await callback.answer()
    plans = await fetch_plans()
    if not plans:
        await callback.message.answer("Тарифы временно недоступны.", reply_markup=main_keyboard())
        return

    lines = ["💳 *Тарифы ShieldVPN*\n"]
    for p in plans:
        traffic = f"{p['traffic_limit_gb']} GB" if p.get("traffic_limit_gb") else "∞"
        lines.append(f"• *{p['name']}* — {p['price_rub']} ₽ / {p['duration_days']} дн. ({traffic})")
    lines.append("\nДля оплаты напишите в поддержку или используйте автоплатёж (настройте в backend).")

    await callback.message.answer("\n".join(lines), parse_mode="Markdown", reply_markup=main_keyboard())


@dp.callback_query(F.data == "status")
async def cb_status(callback):
    await callback.answer()
    config = await fetch_vpn_config(callback.from_user.id)
    if config:
        await callback.message.answer(
            f"✅ Подписка активна\n🖥 Нода: {config.get('node_name')}",
            reply_markup=main_keyboard(),
        )
    else:
        await callback.message.answer("❌ Подписка не активна", reply_markup=main_keyboard())


async def main():
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
