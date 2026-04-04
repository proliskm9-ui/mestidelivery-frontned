"""
Миграция базы данных - добавление новых таблиц и колонок
Запустите: python migrate.py
"""
import sqlite3
import os

DB_PATH = "mestigo.db"

def migrate():
    if not os.path.exists(DB_PATH):
        print("База данных не найдена. Она будет создана при запуске сервера.")
        return
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print("Начинаем миграцию...")
    
    # Добавляем новые колонки в orders
    new_order_columns = [
        ("place_type", "TEXT DEFAULT ''"),
        ("scheduled_time", "DATETIME"),
        ("promo_code", "TEXT DEFAULT ''"),
        ("discount", "REAL DEFAULT 0"),
        ("tips", "REAL DEFAULT 0"),
        ("delivery_fee", "REAL DEFAULT 5"),
        ("service_fee", "REAL DEFAULT 0"),
        ("courier_id", "INTEGER REFERENCES admin_users(id)"),
        ("courier_taken_at", "DATETIME"),
        ("rating", "INTEGER"),
        ("rating_comment", "TEXT"),
    ]
    
    for col_name, col_type in new_order_columns:
        try:
            cursor.execute(f"ALTER TABLE orders ADD COLUMN {col_name} {col_type}")
            print(f"  ✓ Добавлена колонка orders.{col_name}")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e):
                print(f"  - Колонка orders.{col_name} уже существует")
            else:
                print(f"  ✗ Ошибка: {e}")
    
    # Создаём таблицу promo_codes
    try:
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS promo_codes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                code TEXT UNIQUE NOT NULL,
                discount_percent INTEGER DEFAULT 0,
                discount_amount REAL DEFAULT 0,
                min_order REAL DEFAULT 0,
                max_uses INTEGER DEFAULT 0,
                current_uses INTEGER DEFAULT 0,
                is_active BOOLEAN DEFAULT 1,
                valid_from DATETIME,
                valid_until DATETIME,
                restaurant_id TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
            )
        """)
        print("  ✓ Таблица promo_codes создана/проверена")
    except Exception as e:
        print(f"  ✗ Ошибка создания таблицы promo_codes: {e}")
    
    conn.commit()
    conn.close()
    
    print("\nМиграция завершена!")
    print("Перезапустите сервер для применения изменений.")


if __name__ == "__main__":
    migrate()
