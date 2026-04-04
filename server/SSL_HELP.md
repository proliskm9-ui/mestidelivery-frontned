# SSL Сертификат — Инструкция

> ⚠️ **DuckDNS заблокирован в России!**  
> Используйте **No-IP** или **Dynu**. См. файл `DDNS_SETUP.md`

---

## Быстрый старт

### 1. Настройте DDNS

Следуйте инструкции в файле **`DDNS_SETUP.md`**

### 2. Получите сертификат

1. Установите Certbot: [https://dl.eff.org/certbot-beta-installer-win32.exe](https://dl.eff.org/certbot-beta-installer-win32.exe)
2. Откройте CMD от имени **Администратора**
3. Убедитесь, что сервер **ОСТАНОВЛЕН** (порт 80 свободен)
4. Выполните:

   ```cmd
   certbot certonly --standalone -d ваш-домен.ddns.net
   ```

5. Сертификаты будут здесь: `C:\Certbot\live\ваш-домен.ddns.net\`

### 3. Скопируйте сертификаты

```cmd
copy "C:\Certbot\live\ваш-домен.ddns.net\fullchain.pem" "server\certs\fullchain.pem"
copy "C:\Certbot\live\ваш-домен.ddns.net\privkey.pem" "server\certs\privkey.pem"
```

Или используйте скрипт `get_ssl_noip.bat`

### 4. Настройте .env

```ini
SSL_KEYFILE=certs/privkey.pem
SSL_CERTFILE=certs/fullchain.pem
```

---

## Обновление сертификата

Сертификаты действуют 90 дней. Для обновления:

```cmd
certbot renew
```

---

## Связанные файлы

| Файл | Назначение |
|------|------------|
| `DDNS_SETUP.md` | Полная инструкция по DDNS |
| `noip_update.ps1` | Скрипт обновления IP (No-IP) |
| `dynu_update.ps1` | Скрипт обновления IP (Dynu) |
| `get_ssl_noip.bat` | Автоматическое получение SSL |
