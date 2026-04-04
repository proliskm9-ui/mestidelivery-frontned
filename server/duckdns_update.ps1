# Получите токен на сайте https://www.duckdns.org
$Token = "1beb431f-f7b3-468e-a71d-59fcf8180e17" 
# Ваше имя домена (без .duckdns.org)
$Domain = "mestigoapi" 

# URL для обновления
$Url = "https://www.duckdns.org/update?domains=$Domain&token=$Token&ip="

# Выполнение запроса
try {
    $Response = Invoke-RestMethod -Uri $Url
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    
    if ($Response -eq "OK") {
        Write-Host "[$Timestamp] DuckDNS IP successfully updated." -ForegroundColor Green
    } else {
        Write-Host "[$Timestamp] DuckDNS Error: $Response" -ForegroundColor Red
    }
} catch {
    Write-Error "Failed to connect to DuckDNS: $_"
}
