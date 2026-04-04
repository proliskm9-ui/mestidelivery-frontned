"""
Payment Service — CryptoBot & Tribute integration
Creates payment invoices and returns payment URLs
"""
import httpx
import logging
from config import BOT_TOKEN, CRYPTOBOT_TOKEN, TRIBUTE_PROVIDER_TOKEN, CURRENCY_CODE

logger = logging.getLogger(__name__)

# CryptoBot Pay API
CRYPTOBOT_API_URL = "https://pay.crypt.bot/api"

# Tribute (via Telegram Bot API)
TELEGRAM_API_URL = f"https://api.telegram.org/bot{BOT_TOKEN}"

async def create_crypto_payment(order_id: int, amount: float, currency: str = "USDT") -> dict:
    """
    Create a CryptoBot invoice using the real Crypto Pay API.
    Returns {"payment_url": "...", "invoice_id": "..."} or fallback on failure.
    """
    if not CRYPTOBOT_TOKEN:
        logger.warning("CRYPTOBOT_TOKEN not configured, returning fallback link")
        return {
            "payment_url": f"https://t.me/CryptoBot?start=pay_{order_id}",
            "invoice_id": None
        }
    
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.post(
                f"{CRYPTOBOT_API_URL}/createInvoice",
                headers={"Crypto-Pay-API-Token": CRYPTOBOT_TOKEN},
                json={
                    "currency_type": "fiat",
                    "fiat": CURRENCY_CODE,
                    "amount": str(amount),
                    "description": f"Заказ #{order_id}",
                    "payload": f"order_{order_id}",
                    "allow_anonymous": True,
                }
            )
            data = response.json()
            
            if data.get("ok"):
                invoice = data["result"]
                # Use mini_app_invoice_url preferred for bots, or generic pay_url
                pay_url = invoice.get("mini_app_invoice_url") or invoice.get("pay_url")
                return {
                    "payment_url": pay_url,
                    "invoice_id": str(invoice.get("invoice_id", ""))
                }
            else:
                logger.error(f"CryptoBot API error: {data}")
                return {
                    "payment_url": f"https://t.me/CryptoBot?start=pay_{order_id}",
                    "invoice_id": None
                }
    except Exception as e:
        logger.error(f"CryptoBot payment creation failed: {e}")
        return {
            "payment_url": f"https://t.me/CryptoBot?start=pay_{order_id}",
            "invoice_id": None
        }


async def create_tribute_payment(order_id: int, amount: float) -> dict:
    """
    Generate a Tribute payment invoice via Telegram createInvoiceLink.
    Returns {"payment_url": "...", "invoice_id": None}
    """
    if not BOT_TOKEN or not TRIBUTE_PROVIDER_TOKEN:
        logger.warning("BOT_TOKEN or TRIBUTE_PROVIDER_TOKEN not configured, returning fallback link")
        return {
            "payment_url": f"https://t.me/tribute?startapp=pay_{order_id}",
            "invoice_id": None
        }
        
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            # Telegram uses minimum price units (e.g. cents)
            # Assuming amount is in standard currency like EUR or RUB
            price_amount = int(amount * 100) 
            
            response = await client.post(
                f"{TELEGRAM_API_URL}/createInvoiceLink",
                json={
                    "title": f"Оплата заказа #{order_id}",
                    "description": "Оплата доставки еды",
                    "payload": f"order_{order_id}",
                    "provider_token": TRIBUTE_PROVIDER_TOKEN,
                    "currency": CURRENCY_CODE,
                    "prices": [{"label": f"Заказ #{order_id}", "amount": price_amount}]
                }
            )
            data = response.json()
            
            if data.get("ok"):
                return {
                    "payment_url": data["result"],
                    "invoice_id": None
                }
            else:
                logger.error(f"Tribute (Telegram API) error: {data}")
                return {
                    "payment_url": f"https://t.me/tribute?startapp=pay_{order_id}",
                    "invoice_id": None
                }
    except Exception as e:
        logger.error(f"Tribute payment creation failed: {e}")
        return {
            "payment_url": f"https://t.me/tribute?startapp=pay_{order_id}",
            "invoice_id": None
        }


async def create_payment(order_id: int, amount: float, method: str) -> dict | None:
    """
    Main entry point — create payment based on method.
    Returns {"payment_url": str, "invoice_id": str | None} or None for cash.
    """
    if method == "crypto":
        return await create_crypto_payment(order_id, amount)
    elif method == "card":
        return await create_tribute_payment(order_id, amount)
    else:
        # Cash — no payment URL needed
        return None
