"""
Supabase Client
Singleton client for Supabase API interactions
Compatible with multiple supabase-py versions
"""
import os
from typing import Optional
from dotenv import load_dotenv
import logging

logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Get credentials from environment
_supabase_url: str = os.environ.get("SUPABASE_URL", "")
_supabase_key: str = os.environ.get("SUPABASE_KEY", "")

# Singleton client instance
_supabase_client = None


def _init_client():
    """Initialize the Supabase client with fallback for version incompatibilities"""
    global _supabase_client
    
    if not _supabase_url or not _supabase_key:
        logger.warning("⚠️ Supabase credentials missing. Check SUPABASE_URL and SUPABASE_KEY in .env")
        return None
    
    # Try method 1: Standard create_client
    try:
        from supabase import create_client
        _supabase_client = create_client(_supabase_url, _supabase_key)
        logger.info(f"✅ Supabase client initialized (standard) for: {_supabase_url}")
        return _supabase_client
    except TypeError as e:
        logger.warning(f"⚠️ Standard init failed ({e}), trying alternative...")
    except Exception as e:
        logger.warning(f"⚠️ Standard init failed ({e}), trying alternative...")

    # Try method 2: Create Client directly without proxy
    try:
        from supabase import Client
        from supabase.lib.client_options import ClientOptions
        opts = ClientOptions()
        _supabase_client = Client(_supabase_url, _supabase_key, options=opts)
        logger.info(f"✅ Supabase client initialized (direct) for: {_supabase_url}")
        return _supabase_client
    except TypeError as e:
        logger.warning(f"⚠️ Direct init failed ({e}), trying minimal...")
    except Exception as e:
        logger.warning(f"⚠️ Direct init failed ({e}), trying minimal...")

    # Try method 3: Minimal - just use postgrest directly
    try:
        from postgrest import SyncPostgrestClient
        
        class MinimalSupabaseClient:
            """Minimal Supabase-compatible client using postgrest directly"""
            def __init__(self, url: str, key: str):
                self._url = url
                self._key = key
                self._rest_url = f"{url}/rest/v1"
                self._headers = {
                    "apikey": key,
                    "Authorization": f"Bearer {key}",
                    "Content-Type": "application/json",
                    "Prefer": "return=representation"
                }
                self._postgrest = SyncPostgrestClient(
                    self._rest_url,
                    headers=self._headers
                )
            
            def table(self, table_name: str):
                return self._postgrest.from_(table_name)
        
        _supabase_client = MinimalSupabaseClient(_supabase_url, _supabase_key)
        logger.info(f"✅ Supabase client initialized (minimal/postgrest) for: {_supabase_url}")
        return _supabase_client
    except Exception as e:
        logger.error(f"❌ All Supabase init methods failed: {e}")
        return None


def get_supabase():
    """
    Get the Supabase client singleton.
    
    Returns:
        Client or None if not configured/failed to initialize
    """
    global _supabase_client
    
    if _supabase_client is None:
        _supabase_client = _init_client()
    
    return _supabase_client


def is_supabase_configured() -> bool:
    """Check if Supabase credentials are configured"""
    return bool(_supabase_url and _supabase_key)


def get_supabase_url() -> str:
    """Get the Supabase URL (for debugging/logging)"""
    return _supabase_url


def reset_client():
    """Reset the client (useful for testing or reconnection)"""
    global _supabase_client
    _supabase_client = None
    logger.info("Supabase client reset")


# Initialize on module import
if _supabase_url and _supabase_key:
    _init_client()
