"""
Mestigo API Configuration
Centralized configuration management with validation
"""
import os
import secrets
from typing import List, Set
from dotenv import load_dotenv

load_dotenv()

# =============================================================================
# Supabase API Settings (Primary Database)
# =============================================================================
SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("⚠️ SUPABASE_URL or SUPABASE_KEY not found! Database operations will fail.")

# =============================================================================
# Server Settings
# =============================================================================
HOST: str = os.getenv("HOST", "0.0.0.0")
PORT: int = int(os.getenv("PORT", "443"))
WORKERS: int = int(os.getenv("WORKERS", "4"))
LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
ENABLE_DOCS: bool = os.getenv("ENABLE_DOCS", "false").lower() == "true"

# =============================================================================
# Security Settings
# =============================================================================
# Generate secure SECRET_KEY if not provided
_default_secret = secrets.token_urlsafe(32)
SECRET_KEY: str = os.getenv("SECRET_KEY", _default_secret)

if SECRET_KEY == _default_secret:
    print("⚠️ WARNING: Using auto-generated SECRET_KEY. Set SECRET_KEY in .env for production!")

# CORS Origins - parse comma-separated list
_cors_env = os.getenv("CORS_ORIGINS", "")
if _cors_env and _cors_env != "*":
    CORS_ORIGINS: List[str] = [origin.strip() for origin in _cors_env.split(",") if origin.strip()]
else:
    # Default origins for development
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "https://web.telegram.org",
    ]

# In production, you should set specific origins
CORS_ALLOW_ALL: bool = os.getenv("CORS_ALLOW_ALL", "false").lower() == "true"

# =============================================================================
# File Upload Settings
# =============================================================================
UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "./uploads")
MAX_UPLOAD_SIZE: int = int(os.getenv("MAX_UPLOAD_SIZE", str(5 * 1024 * 1024)))  # 5MB default
ALLOWED_EXTENSIONS: Set[str] = {".jpg", ".jpeg", ".png", ".webp"}
SUPABASE_STORAGE_BUCKET: str = os.getenv("SUPABASE_STORAGE_BUCKET", "images")

# =============================================================================
# Business Settings
# =============================================================================
# Service fee (hidden commission) in percent
SERVICE_FEE_PERCENT: float = float(os.getenv("SERVICE_FEE_PERCENT", "5"))

# Default delivery fee
DEFAULT_DELIVERY_FEE: float = float(os.getenv("DEFAULT_DELIVERY_FEE", "5"))

# Currency symbol
CURRENCY_SYMBOL: str = os.getenv("CURRENCY_SYMBOL", "₾")
CURRENCY_CODE: str = os.getenv("CURRENCY_CODE", "GEL")

# =============================================================================
# Telegram Bot Settings
# =============================================================================
BOT_TOKEN: str = os.getenv("BOT_TOKEN", "")
CRYPTOBOT_TOKEN: str = os.getenv("CRYPTOBOT_TOKEN", "")
TRIBUTE_PROVIDER_TOKEN: str = os.getenv("TRIBUTE_PROVIDER_TOKEN", "")

ADMIN_IDS: List[str] = [
    admin_id.strip() 
    for admin_id in os.getenv("ADMIN_IDS", "").split(",") 
    if admin_id.strip()
]

# =============================================================================
# SSL Settings
# =============================================================================
SSL_KEYFILE: str = os.getenv("SSL_KEYFILE", "./certs/privkey.pem")
SSL_CERTFILE: str = os.getenv("SSL_CERTFILE", "./certs/fullchain.pem")

# =============================================================================
# JWT Settings
# =============================================================================
JWT_ALGORITHM: str = "HS256"
JWT_EXPIRE_DAYS: int = int(os.getenv("JWT_EXPIRE_DAYS", "7"))

# =============================================================================
# Rate Limiting
# =============================================================================
RATE_LIMIT_REQUESTS: int = int(os.getenv("RATE_LIMIT_REQUESTS", "100"))
RATE_LIMIT_WINDOW: int = int(os.getenv("RATE_LIMIT_WINDOW", "60"))  # seconds

# =============================================================================
# Pagination Defaults
# =============================================================================
DEFAULT_PAGE_SIZE: int = int(os.getenv("DEFAULT_PAGE_SIZE", "20"))
MAX_PAGE_SIZE: int = int(os.getenv("MAX_PAGE_SIZE", "100"))

# =============================================================================
# Startup Info
# =============================================================================
print(f"✅ Configuration loaded")
print(f"   - Supabase: {'Connected' if SUPABASE_URL else 'Not configured'}")
print(f"   - Telegram Bot: {'Configured' if BOT_TOKEN else 'Not configured'}")
print(f"   - CORS: {'Allow All' if CORS_ALLOW_ALL else f'{len(CORS_ORIGINS)} origins'}")
