"""
Telegram Notification Service
Sends notifications to admins about orders and status changes
"""
import httpx
from config import BOT_TOKEN, ADMIN_IDS, CURRENCY_SYMBOL, CURRENCY_CODE
import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)

STATUS_LABELS = {
    "pending": "⏳ Ожидает подтверждения",
    "confirmed": "✅ Подтверждён",
    "preparing": "👨‍🍳 Готовится",
    "ready": "📦 Готов к доставке",
    "delivering": "🚗 В пути",
    "delivered": "✨ Доставлен",
    "cancelled": "❌ Отменён",
}

TELEGRAM_API_BASE = "https://api.telegram.org/bot"


def _escape_markdown(text: str) -> str:
    """Escape special characters for Telegram Markdown"""
    if not text:
        return ""
    
    # Characters that need escaping in MarkdownV2
    special_chars = ['_', '*', '[', ']', '(', ')', '~', '`', '>', '#', '+', '-', '=', '|', '{', '}', '.', '!']
    
    result = str(text)
    for char in special_chars:
        result = result.replace(char, f'\\{char}')
    
    return result


async def _send_telegram_message(chat_id: str, text: str, parse_mode: str = "Markdown") -> bool:
    """Send a message to a Telegram chat"""
    if not BOT_TOKEN:
        logger.debug("BOT_TOKEN not configured, skipping Telegram notification")
        return False
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{TELEGRAM_API_BASE}{BOT_TOKEN}/sendMessage",
                json={
                    "chat_id": chat_id,
                    "text": text,
                    "parse_mode": parse_mode
                },
                timeout=10.0
            )
            
            if response.status_code != 200:
                logger.error(f"Telegram API error: {response.status_code} - {response.text}")
                return False
            
            return True
            
    except httpx.TimeoutException:
        logger.error(f"Telegram API timeout for chat {chat_id}")
        return False
    except Exception as e:
        logger.error(f"Error sending Telegram message to {chat_id}: {e}")
        return False


async def notify_admins(order_data: Dict[str, Any]) -> bool:
    """
    Send new order notification to all admin chat IDs.
    
    Args:
        order_data: Dictionary containing order information
        
    Returns:
        True if at least one notification was sent successfully
    """
    if not BOT_TOKEN or not ADMIN_IDS:
        logger.warning("BOT_TOKEN or ADMIN_IDS not configured, skipping notification")
        return False

    # Format items list
    items = order_data.get('items', [])
    items_text = "\n".join([
        f"  • {item.get('name', 'Unknown')} x{item.get('quantity', 1)} = {item.get('price', 0) * item.get('quantity', 1):.2f} {CURRENCY_CODE}"
        for item in items
    ]) if items else "  (нет товаров)"

    # Build message
    order_id = order_data.get('id', 'N/A')
    customer_name = order_data.get('customer_name', 'N/A')
    phone = order_data.get('phone', 'N/A')
    address = order_data.get('address', 'N/A')
    restaurant_name = order_data.get('restaurant_name') or order_data.get('restaurant_id', 'N/A')
    total = order_data.get('total', 0)
    comment = order_data.get('comment') or '—'
    tips = order_data.get('tips', 0)
    place_type = order_data.get('place_type', '')
    scheduled_time = order_data.get('scheduled_time', '')

    message = f"""🆕 *Новый заказ #{order_id}*

👤 *Клиент:* {customer_name}
📞 *Телефон:* {phone}
📍 *Адрес:* {address}
🏪 *Ресторан:* {restaurant_name}

🛒 *Товары:*
{items_text}

💰 *Итого:* {total:.2f} {CURRENCY_SYMBOL}"""

    # Add optional fields
    if tips and tips > 0:
        message += f"\n💵 *Чаевые:* {tips:.2f} {CURRENCY_SYMBOL}"
    
    if place_type:
        place_labels = {
            "apartment": "🏠 Квартира",
            "house": "🏡 Дом",
            "office": "🏢 Офис",
            "other": "📍 Другое"
        }
        message += f"\n🏷 *Тип:* {place_labels.get(place_type, place_type)}"
    
    if scheduled_time:
        message += f"\n⏰ *Время:* {scheduled_time}"
    
    message += f"\n\n💬 *Комментарий:* {comment}"

    # Send to all admins
    success_count = 0
    for admin_id in ADMIN_IDS:
        admin_id = admin_id.strip()
        if not admin_id:
            continue
            
        if await _send_telegram_message(admin_id, message):
            success_count += 1

    logger.info(f"Order #{order_id} notification sent to {success_count}/{len(ADMIN_IDS)} admins")
    return success_count > 0


async def notify_status_change(
    order_id: int, 
    new_status: str, 
    phone: Optional[str] = None
) -> bool:
    """
    Notify admins about order status change.
    
    Args:
        order_id: Order ID
        new_status: New status code
        phone: Customer phone (optional, for future SMS integration)
        
    Returns:
        True if notification was sent successfully
    """
    if not BOT_TOKEN or not ADMIN_IDS:
        return False
    
    status_label = STATUS_LABELS.get(new_status, new_status)
    message = f"📋 *Заказ #{order_id}*\n\nСтатус изменён: {status_label}"
    
    success_count = 0
    for admin_id in ADMIN_IDS:
        admin_id = admin_id.strip()
        if not admin_id:
            continue
            
        if await _send_telegram_message(admin_id, message):
            success_count += 1
    
    return success_count > 0


async def notify_courier_assigned(
    order_id: int,
    courier_name: str,
    courier_phone: Optional[str] = None
) -> bool:
    """Notify admins when a courier is assigned to an order"""
    if not BOT_TOKEN or not ADMIN_IDS:
        return False
    
    message = f"""🚴 *Курьер назначен*

📋 *Заказ:* #{order_id}
👤 *Курьер:* {courier_name}"""

    if courier_phone:
        message += f"\n📞 *Телефон:* {courier_phone}"
    
    success_count = 0
    for admin_id in ADMIN_IDS:
        admin_id = admin_id.strip()
        if not admin_id:
            continue
            
        if await _send_telegram_message(admin_id, message):
            success_count += 1
    
    return success_count > 0


async def send_custom_notification(
    message: str,
    admin_ids: Optional[List[str]] = None
) -> bool:
    """
    Send a custom notification to specified or all admins.
    
    Args:
        message: Message text (supports Markdown)
        admin_ids: Optional list of specific chat IDs. If None, sends to all admins.
        
    Returns:
        True if at least one message was sent successfully
    """
    if not BOT_TOKEN:
        return False
    
    target_ids = admin_ids or ADMIN_IDS
    if not target_ids:
        return False
    
    success_count = 0
    for admin_id in target_ids:
        admin_id = str(admin_id).strip()
        if not admin_id:
            continue
            
        if await _send_telegram_message(admin_id, message):
            success_count += 1
    
    return success_count > 0
