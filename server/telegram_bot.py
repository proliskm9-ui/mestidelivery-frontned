"""
Telegram Bot для админов ресторанов и курьеров
Поддерживает уведомления о заказах и управление ими
Работает с Supabase БД
"""
import asyncio
import logging
import json
from datetime import datetime
from typing import Optional

from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import (
    Application,
    CommandHandler,
    CallbackQueryHandler,
    ContextTypes,
    MessageHandler,
    filters
)

from config import BOT_TOKEN, ADMIN_IDS
from supabase_client import get_supabase

# Настройка логирования
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)


# =============================================================================
# Вспомогательные функции для работы с БД
# =============================================================================

def get_user_by_telegram_id(telegram_id: int):
    """Получить пользователя по Telegram ID"""
    supabase = get_supabase()
    if not supabase:
        return None
    
    try:
        result = supabase.table("admin_users") \
            .select("*") \
            .eq("telegram_id", str(telegram_id)) \
            .execute()
        
        if result.data:
            return result.data[0]
    except Exception as e:
        logger.error(f"Error getting user by telegram_id: {e}")
    
    return None


def link_telegram_to_user(telegram_id: int, username: str):
    """Связать Telegram ID с пользователем по username"""
    supabase = get_supabase()
    if not supabase:
        return None
    
    try:
        # Найти пользователя по username
        result = supabase.table("admin_users") \
            .select("*") \
            .eq("username", username) \
            .execute()
        
        if not result.data:
            return None
        
        user = result.data[0]
        
        # Обновить telegram_id
        update_result = supabase.table("admin_users") \
            .update({"telegram_id": str(telegram_id)}) \
            .eq("id", user['id']) \
            .execute()
        
        if update_result.data:
            return update_result.data[0]
    
    except Exception as e:
        logger.error(f"Error linking telegram to user: {e}")
    
    return None


def get_order_by_id(order_id: int):
    """Получить заказ по ID"""
    supabase = get_supabase()
    if not supabase:
        return None
    
    try:
        result = supabase.table("orders") \
            .select("*") \
            .eq("id", order_id) \
            .execute()
        
        if result.data:
            return result.data[0]
    except Exception as e:
        logger.error(f"Error getting order: {e}")
    
    return None


def update_order_status(order_id: int, status: str, **kwargs):
    """Обновить статус заказа"""
    supabase = get_supabase()
    if not supabase:
        return False
    
    try:
        update_data = {"status": status}
        update_data.update(kwargs)
        
        result = supabase.table("orders") \
            .update(update_data) \
            .eq("id", order_id) \
            .execute()
        
        return bool(result.data)
    except Exception as e:
        logger.error(f"Error updating order status: {e}")
        return False


def get_restaurant_name(restaurant_id: str):
    """Получить название ресторана"""
    supabase = get_supabase()
    if not supabase:
        return "Ресторан"
    
    try:
        result = supabase.table("restaurants") \
            .select("name") \
            .eq("id", restaurant_id) \
            .execute()
        
        if result.data:
            return result.data[0]['name']
    except Exception as e:
        logger.error(f"Error getting restaurant name: {e}")
    
    return "Ресторан"


# =============================================================================
# Форматирование сообщений
# =============================================================================

def format_order_message(order: dict, restaurant_name: str = "") -> str:
    """Форматировать информацию о заказе для отображения"""
    items = order.get('items', '[]')
    if isinstance(items, str):
        try:
            items = json.loads(items)
        except:
            items = []
    elif isinstance(items, list):
        pass
    else:
        items = []
    
    items_text = "\n".join([
        f"  • {item.get('name', 'Товар')} x{item.get('quantity', 1)} - {item.get('price', 0)}₾"
        for item in items
    ])
    
    status_emoji = {
        'pending': '🕐',
        'confirmed': '✅',
        'preparing': '👨‍🍳',
        'ready': '📦',
        'delivering': '🚗',
        'delivered': '✅',
        'cancelled': '❌'
    }
    
    emoji = status_emoji.get(order.get('status', 'pending'), '📋')
    
    message = f"""
{emoji} <b>Заказ #{order.get('id')}</b>
{'🏪 ' + restaurant_name if restaurant_name else ''}

👤 <b>Клиент:</b> {order.get('customer_name', 'Не указано')}
📱 <b>Телефон:</b> {order.get('phone', 'Не указано')}
📍 <b>Адрес:</b> {order.get('address', 'Не указано')}

<b>Состав заказа:</b>
{items_text}

💰 <b>Сумма:</b> {order.get('total', 0)}₾
📊 <b>Статус:</b> {order.get('status', 'pending')}
🕐 <b>Создан:</b> {order.get('created_at', '')[:16]}
"""
    
    if order.get('comment'):
        message += f"\n💬 <b>Комментарий:</b> {order.get('comment')}"
    
    if order.get('scheduled_time'):
        message += f"\n⏰ <b>Доставить к:</b> {order.get('scheduled_time')[:16]}"
    
    return message.strip()


def get_order_keyboard(order: dict, user_role: str):
    """Создать клавиатуру для управления заказом"""
    keyboard = []
    status = order.get('status', 'pending')
    order_id = order.get('id')
    
    # Кнопки для админов ресторана
    if user_role in ['super_admin', 'restaurant_admin']:
        if status == 'pending':
            keyboard.append([
                InlineKeyboardButton("✅ Подтвердить", callback_data=f"order_confirm_{order_id}"),
                InlineKeyboardButton("❌ Отменить", callback_data=f"order_cancel_{order_id}")
            ])
        elif status == 'confirmed':
            keyboard.append([
                InlineKeyboardButton("👨‍🍳 Готовится", callback_data=f"order_preparing_{order_id}")
            ])
        elif status == 'preparing':
            keyboard.append([
                InlineKeyboardButton("📦 Готов", callback_data=f"order_ready_{order_id}")
            ])
    
    # Кнопки для курьеров
    if user_role == 'courier':
        if status == 'ready' and not order.get('courier_id'):
            keyboard.append([
                InlineKeyboardButton("🚗 Взять заказ", callback_data=f"courier_take_{order_id}")
            ])
        elif status == 'delivering' and order.get('courier_id'):
            keyboard.append([
                InlineKeyboardButton("✅ Доставлен", callback_data=f"courier_delivered_{order_id}")
            ])
    
    return InlineKeyboardMarkup(keyboard) if keyboard else None


# =============================================================================
# Команды бота
# =============================================================================

async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Команда /start"""
    telegram_id = update.effective_user.id
    user = get_user_by_telegram_id(telegram_id)
    
    if user:
        await update.message.reply_text(
            f"👋 Привет, {user['username']}!\n\n"
            f"Ваша роль: {user['role']}\n\n"
            "Доступные команды:\n"
            "/orders - Список активных заказов\n"
            "/help - Помощь"
        )
    else:
        await update.message.reply_text(
            "👋 Привет! Для начала работы свяжите ваш Telegram аккаунт.\n\n"
            "Используйте команду:\n"
            "/link <ваш_username>\n\n"
            "Например: /link admin"
        )


async def link_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Команда /link для связывания Telegram с аккаунтом"""
    if not context.args:
        await update.message.reply_text(
            "❌ Укажите ваш username:\n"
            "/link <username>"
        )
        return
    
    username = context.args[0]
    telegram_id = update.effective_user.id
    
    user = link_telegram_to_user(telegram_id, username)
    
    if user:
        await update.message.reply_text(
            f"✅ Аккаунт успешно связан!\n\n"
            f"Username: {user['username']}\n"
            f"Роль: {user['role']}\n\n"
            "Теперь вы будете получать уведомления о заказах."
        )
    else:
        await update.message.reply_text(
            "❌ Пользователь не найден. Проверьте username."
        )


async def orders_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Команда /orders - показать активные заказы"""
    telegram_id = update.effective_user.id
    user = get_user_by_telegram_id(telegram_id)
    
    if not user:
        await update.message.reply_text(
            "❌ Сначала свяжите аккаунт командой /link"
        )
        return
    
    supabase = get_supabase()
    if not supabase:
        await update.message.reply_text("❌ Ошибка подключения к БД")
        return
    
    try:
        # Получить заказы в зависимости от роли
        if user['role'] == 'super_admin':
            result = supabase.table("orders") \
                .select("*") \
                .in_("status", ["pending", "confirmed", "preparing", "ready", "delivering"]) \
                .order("created_at", desc=True) \
                .limit(10) \
                .execute()
        elif user['role'] == 'restaurant_admin':
            result = supabase.table("orders") \
                .select("*") \
                .eq("restaurant_id", user['restaurant_id']) \
                .in_("status", ["pending", "confirmed", "preparing", "ready"]) \
                .order("created_at", desc=True) \
                .limit(10) \
                .execute()
        elif user['role'] == 'courier':
            result = supabase.table("orders") \
                .select("*") \
                .in_("status", ["ready", "delivering"]) \
                .order("created_at", desc=True) \
                .limit(10) \
                .execute()
        else:
            await update.message.reply_text("❌ Недостаточно прав")
            return
        
        orders = result.data
        
        if not orders:
            await update.message.reply_text("📭 Нет активных заказов")
            return
        
        for order in orders:
            restaurant_name = get_restaurant_name(order['restaurant_id'])
            message = format_order_message(order, restaurant_name)
            keyboard = get_order_keyboard(order, user['role'])
            
            await update.message.reply_text(
                message,
                parse_mode='HTML',
                reply_markup=keyboard
            )
    
    except Exception as e:
        logger.error(f"Error in orders_command: {e}")
        await update.message.reply_text("❌ Ошибка получения заказов")


async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Команда /help"""
    help_text = """
📖 <b>Помощь по боту</b>

<b>Команды:</b>
/start - Начать работу
/link <username> - Связать Telegram с аккаунтом
/orders - Показать активные заказы
/help - Эта справка

<b>Для админов ресторанов:</b>
• Получайте уведомления о новых заказах
• Подтверждайте и управляйте заказами
• Отслеживайте статус выполнения

<b>Для курьеров:</b>
• Получайте уведомления о готовых заказах
• Берите заказы в работу
• Отмечайте доставленные заказы
"""
    await update.message.reply_text(help_text, parse_mode='HTML')


# =============================================================================
# Обработчики callback кнопок
# =============================================================================

async def button_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработка нажатий на кнопки"""
    query = update.callback_query
    await query.answer()
    
    telegram_id = update.effective_user.id
    user = get_user_by_telegram_id(telegram_id)
    
    if not user:
        await query.edit_message_text("❌ Сначала свяжите аккаунт командой /link")
        return
    
    data = query.data
    
    # Парсинг callback_data
    if data.startswith("order_confirm_"):
        order_id = int(data.split("_")[2])
        if update_order_status(order_id, "confirmed"):
            order = get_order_by_id(order_id)
            restaurant_name = get_restaurant_name(order['restaurant_id'])
            message = format_order_message(order, restaurant_name)
            keyboard = get_order_keyboard(order, user['role'])
            await query.edit_message_text(message, parse_mode='HTML', reply_markup=keyboard)
        else:
            await query.edit_message_text("❌ Ошибка обновления заказа")
    
    elif data.startswith("order_cancel_"):
        order_id = int(data.split("_")[2])
        if update_order_status(order_id, "cancelled"):
            await query.edit_message_text("❌ Заказ отменен")
        else:
            await query.edit_message_text("❌ Ошибка отмены заказа")
    
    elif data.startswith("order_preparing_"):
        order_id = int(data.split("_")[2])
        if update_order_status(order_id, "preparing"):
            order = get_order_by_id(order_id)
            restaurant_name = get_restaurant_name(order['restaurant_id'])
            message = format_order_message(order, restaurant_name)
            keyboard = get_order_keyboard(order, user['role'])
            await query.edit_message_text(message, parse_mode='HTML', reply_markup=keyboard)
        else:
            await query.edit_message_text("❌ Ошибка обновления заказа")
    
    elif data.startswith("order_ready_"):
        order_id = int(data.split("_")[2])
        if update_order_status(order_id, "ready"):
            order = get_order_by_id(order_id)
            restaurant_name = get_restaurant_name(order['restaurant_id'])
            message = format_order_message(order, restaurant_name)
            await query.edit_message_text(message, parse_mode='HTML')
            await query.message.reply_text("📦 Заказ готов! Ожидает курьера.")
        else:
            await query.edit_message_text("❌ Ошибка обновления заказа")
    
    elif data.startswith("courier_take_"):
        order_id = int(data.split("_")[2])
        if update_order_status(order_id, "delivering", courier_id=user['id'], courier_taken_at=datetime.now().isoformat()):
            order = get_order_by_id(order_id)
            restaurant_name = get_restaurant_name(order['restaurant_id'])
            message = format_order_message(order, restaurant_name)
            keyboard = get_order_keyboard(order, user['role'])
            await query.edit_message_text(message, parse_mode='HTML', reply_markup=keyboard)
        else:
            await query.edit_message_text("❌ Ошибка взятия заказа")
    
    elif data.startswith("courier_delivered_"):
        order_id = int(data.split("_")[2])
        if update_order_status(order_id, "delivered"):
            await query.edit_message_text("✅ Заказ доставлен!")
        else:
            await query.edit_message_text("❌ Ошибка обновления заказа")


# =============================================================================
# Функция для отправки уведомлений (вызывается из API)
# =============================================================================

async def send_order_notification(order_id: int, restaurant_id: str):
    """Отправить уведомление о новом заказе админам ресторана"""
    supabase = get_supabase()
    if not supabase:
        logger.error("Supabase not available")
        return
    
    try:
        # Получить заказ
        order = get_order_by_id(order_id)
        if not order:
            logger.error(f"Order {order_id} not found")
            return
        
        # Получить админов ресторана с telegram_id
        result = supabase.table("admin_users") \
            .select("telegram_id") \
            .eq("restaurant_id", restaurant_id) \
            .not_.is_("telegram_id", "null") \
            .execute()
        
        if not result.data:
            logger.warning(f"No admins with telegram_id for restaurant {restaurant_id}")
            return
        
        # Отправить уведомления
        restaurant_name = get_restaurant_name(restaurant_id)
        message = format_order_message(order, restaurant_name)
        
        app = Application.builder().token(BOT_TOKEN).build()
        
        for admin in result.data:
            try:
                telegram_id = int(admin['telegram_id'])
                keyboard = get_order_keyboard(order, 'restaurant_admin')
                await app.bot.send_message(
                    chat_id=telegram_id,
                    text=f"🔔 <b>Новый заказ!</b>\n\n{message}",
                    parse_mode='HTML',
                    reply_markup=keyboard
                )
            except Exception as e:
                logger.error(f"Error sending notification to {admin['telegram_id']}: {e}")
    
    except Exception as e:
        logger.error(f"Error in send_order_notification: {e}")


# =============================================================================
# Запуск бота
# =============================================================================

def main():
    """Запуск бота"""
    if not BOT_TOKEN:
        logger.error("BOT_TOKEN not configured!")
        return
    
    logger.info("Starting Telegram Bot...")
    
    # Создать приложение
    app = Application.builder().token(BOT_TOKEN).build()
    
    # Добавить обработчики команд
    app.add_handler(CommandHandler("start", start_command))
    app.add_handler(CommandHandler("link", link_command))
    app.add_handler(CommandHandler("orders", orders_command))
    app.add_handler(CommandHandler("help", help_command))
    
    # Добавить обработчик кнопок
    app.add_handler(CallbackQueryHandler(button_callback))
    
    # Запустить бота
    logger.info("Bot started successfully!")
    app.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()
