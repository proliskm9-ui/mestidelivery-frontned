# =============================================================
# Скрипт обновления Dynu DDNS (Альтернатива No-IP)
# =============================================================
# Dynu полностью бесплатный и НЕ требует подтверждения каждые 30 дней!
#
# 1. Зарегистрируйтесь на https://www.dynu.com/
# 2. Добавьте DDNS Services -> Add -> создайте hostname
# 3. Получите API Key в Control Panel -> API Credentials
# =============================================================

# Ваши данные Dynu
$ApiKey = "ВАШ_API_KEY"              # API Key из Dynu
$Hostname = "mestigoapi.dynu.net"    # Ваш hostname на Dynu

# =============================================================

# Определяем текущий публичный IP
try {
    $CurrentIP = (Invoke-RestMethod -Uri "https://api.ipify.org").Trim()
    Write-Host "Текущий IP: $CurrentIP" -ForegroundColor Cyan
} catch {
    Write-Error "Не удалось определить внешний IP: $_"
    exit 1
}

# Получаем ID домена
$Headers = @{
    "API-Key" = $ApiKey
    "Content-Type" = "application/json"
}

try {
    # Получаем список доменов
    $Domains = Invoke-RestMethod -Uri "https://api.dynu.com/v2/dns" -Headers $Headers -Method Get
    $Domain = $Domains.domains | Where-Object { $_.name -eq $Hostname }
    
    if (-not $Domain) {
        Write-Error "Домен $Hostname не найден в вашем аккаунте Dynu"
        exit 1
    }
    
    # Обновляем IP
    $Body = @{
        name = $Hostname
        ipv4Address = $CurrentIP
        ipv4 = $true
    } | ConvertTo-Json
    
    $Response = Invoke-RestMethod -Uri "https://api.dynu.com/v2/dns/$($Domain.id)" -Headers $Headers -Method Post -Body $Body
    
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$Timestamp] Dynu успешно обновлен! IP: $CurrentIP" -ForegroundColor Green
    
} catch {
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Error "[$Timestamp] Ошибка Dynu: $_"
}
