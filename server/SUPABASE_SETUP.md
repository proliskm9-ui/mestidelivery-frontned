# Настройка Supabase

## 1. Создание проекта

1. Зайдите на [supabase.com](https://supabase.com)
2. Создайте новый проект
3. Запомните пароль базы данных!

## 2. Получение URL подключения

1. В Supabase Dashboard → **Settings** → **Database**
2. Найдите секцию **Connection string** → **URI**
3. Скопируйте **Transaction Pooler** строку (рекомендуется)

Пример:
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
```

## 3. Настройка .env

Замените `postgresql://` на `postgresql+asyncpg://` для асинхронного драйвера:

```env
DATABASE_URL=postgresql+asyncpg://postgres.abcdefg12345:MySecretPassword@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
```

## 4. Создание таблиц

### Вариант 1: Через SQL Editor (рекомендуется)

1. В Supabase Dashboard → **SQL Editor**
2. Создайте новый запрос
3. Скопируйте содержимое файла `supabase_init.sql`
4. Выполните запрос

### Вариант 2: Автоматически при запуске

Таблицы создадутся автоматически при первом запуске сервера через SQLAlchemy.

## 5. Установка зависимостей

```bash
cd server
pip install -r requirements.txt
```

Убедитесь что установлены:
- `asyncpg` - асинхронный драйвер PostgreSQL
- `psycopg2-binary` - синхронный драйвер (для миграций)

## 6. Запуск

```bash
cd server
python main.py
```

При успешном подключении увидите:
```
🐘 Using PostgreSQL (Supabase)
```

## 7. Настройка хранилища (Storage)
Для загрузки картинок через админку:

1. В Supabase Dashboard → **Storage**
2. Нажмите **New Bucket**
3. Назовите его `images`
4. Сделайте его **Public** (обязательно!)
5. Нажмите **Create Bucket**

Теперь картинки будут загружаться в Supabase, а не на диск сервера.

## 8. Переменные окружения для Storage

В файл `.env` добавьте (данные возьмите в Settings → API):

```ini
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-public-key
```

---

## Troubleshooting

### Ошибка подключения

1. Проверьте пароль в DATABASE_URL
2. Убедитесь что IP не заблокирован (Supabase → Settings → Database → Network)
3. Используйте порт **6543** (не 5432) для pooler

### SSL ошибки

Добавьте `?ssl=require` в конец URL:
```
postgresql+asyncpg://...@...supabase.com:6543/postgres?ssl=require
```

### Медленные запросы

Используйте **Transaction Pooler** (порт 6543), а не Direct Connection (5432).
