# Настройка DDNS и SSL (No-IP)

> DuckDNS заблокирован в России, поэтому используем **No-IP** — бесплатный DDNS сервис.

---

## 🚀 Шаг 1: Регистрация на No-IP

1. Перейдите на **[https://www.noip.com/](https://www.noip.com/)**
2. Нажмите **Sign Up Free**
3. Создайте аккаунт (запомните email и пароль)
4. Подтвердите email

---

## 🌐 Шаг 2: Создание hostname

1. После входа, перейдите в **Dashboard → Dynamic DNS → No-IP Hostnames**
2. Нажмите **Create Hostname**
3. Выберите:
   - **Hostname**: например `mestigoapi`
   - **Domain**: выберите бесплатный домен, например `ddns.net`
   - Полный адрес будет: `mestigoapi.ddns.net`
4. Нажмите **Create Hostname**

---

## 🔄 Шаг 3: Настройка автоматического обновления IP

### Вариант А: PowerShell скрипт (рекомендуется)

1. Откройте файл `server/noip_update.ps1`
2. Заполните данные:
   ```powershell
   $Username = "ваш-email@mail.com"
   $Password = "ваш-пароль"
   $Hostname = "mestigoapi.ddns.net"
   ```
3. Запустите скрипт вручную или добавьте в Планировщик задач

### Вариант Б: No-IP DUC (клиент)

1. Скачайте **No-IP DUC** (Dynamic Update Client):
   - [Скачать для Windows](https://www.noip.com/download?page=win)
2. Установите и войдите под своим аккаунтом
3. Выберите созданный hostname
4. Программа будет автоматически обновлять IP

---

## 🔒 Шаг 4: Получение SSL сертификата

### Подготовка

1. Убедитесь, что ваш IP обновлен в No-IP
2. Проверьте: `ping mestigoapi.ddns.net` — должен показать ваш IP
3. Откройте порт **80** в роутере (для Certbot проверки)

### Получение сертификата

1. Скачайте Certbot: [https://dl.eff.org/certbot-beta-installer-win32.exe](https://dl.eff.org/certbot-beta-installer-win32.exe)
2. Установите его
3. **ОСТАНОВИТЕ** Python сервер (порт 80 должен быть свободен)
4. Запустите `get_ssl_noip.bat` **от имени Администратора**
5. Дождитесь завершения

Сертификаты будут скопированы в `server/certs/`

---

## ⚙️ Шаг 5: Настройка .env

Откройте файл `.env` в корне проекта и измените:

```ini
VITE_API_URL=https://mestigoapi.ddns.net
```

Или в файле `server/.env`:

```ini
SSL_KEYFILE=certs/privkey.pem
SSL_CERTFILE=certs/fullchain.pem
```

---

## 📋 Проверка

1. Запустите сервер: `python main.py`
2. Откройте в браузере: `https://mestigoapi.ddns.net`
3. Должен быть зелёный замочек (HTTPS работает)

---

## 🔄 Обновление сертификата

Сертификаты Let's Encrypt действуют **90 дней**. Для обновления:

```cmd
certbot renew
```

Или запустите `get_ssl_noip.bat` заново.

---

## ⚠️ Важно для бесплатных аккаунтов No-IP

Бесплатные hostname нужно **подтверждать каждые 30 дней** (приходит email).
Если не подтвердите — hostname удалится.

**Альтернативы:**
- **Dynu** (dynu.com) — полностью бесплатный, без подтверждений
- **FreeDNS** (freedns.afraid.org) — много бесплатных доменов
