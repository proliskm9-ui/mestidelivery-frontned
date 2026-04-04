# =============================================================
# Скрипт обновления No-IP DDNS
# =============================================================
# 1. Зарегистрируйтесь на https://www.noip.com/
# 2. Создайте бесплатный hostname (например: mestigoapi.ddns.net)
# 3. Введите ваш email и пароль от No-IP ниже

# Ваши данные No-IP
$Username = "ВАШ_EMAIL"      # <-- ВПИШИТЕ СЮДА EMAIL NO-IP
$Password = "ВАШ_ПАРОЛЬ"     # <-- ВПИШИТЕ СЮДА ПАРОЛЬ NO-IP
$Hostname = "mestiapi.ddns.net"  # Обновлено!

# =============================================================

# Определяем текущий публичный IP
try {
    $CurrentIP = (Invoke-RestMethod -Uri "https://api.ipify.org").Trim()
} catch {
    Write-Error "Не удалось определить внешний IP: $_"
    exit 1
}

# URL для обновления No-IP
$Url = "https://dynupdate.no-ip.com/nic/update?hostname=$Hostname&myip=$CurrentIP"

# Создаём заголовок авторизации
$Base64Auth = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("${Username}:${Password}"))
$Headers = @{
    Authorization = "Basic $Base64Auth"
    "User-Agent"  = "PowerShell/NoIP-Updater"
}

# Выполнение запроса
try {
    $Response = Invoke-RestMethod -Uri $Url -Headers $Headers -Method Get
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    
    if ($Response -match "^(good|nochg)") {
        Write-Host "[$Timestamp] No-IP успешно обновлен! IP: $CurrentIP" -ForegroundColor Green
    } else {
        Write-Host "[$Timestamp] No-IP Ошибка: $Response" -ForegroundColor Red
    }
} catch {
    Write-Error "Не удалось подключиться к No-IP: $_"
}
