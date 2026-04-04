"""
Telegram Mini App Authentication Barrier
Validates X-Telegram-Init-Data header for secure API access
"""
from fastapi import Request, HTTPException
from typing import Optional, Dict, Any
import hmac
import hashlib
import json
import time
from urllib.parse import parse_qsl
import logging

from config import BOT_TOKEN

logger = logging.getLogger(__name__)


class TelegramBarrier:
    """
    Authentication barrier for Telegram Mini App.
    
    Validates the X-Telegram-Init-Data header to ensure requests
    come from legitimate Telegram Mini App users.
    
    Usage:
        @router.get("/protected")
        async def protected_endpoint(_: dict = Depends(barrier)):
            ...
    """
    
    # Maximum age of init data in seconds (default: 1 hour)
    MAX_DATA_AGE = 3600
    
    def __init__(self, auto_error: bool = True, max_age: int = MAX_DATA_AGE):
        """
        Initialize the barrier.
        
        Args:
            auto_error: If True, raise HTTPException on auth failure.
                       If False, return None instead.
            max_age: Maximum age of init data in seconds.
        """
        self.auto_error = auto_error
        self.max_age = max_age

    async def __call__(self, request: Request) -> Optional[Dict[str, Any]]:
        """
        Validate the request and extract user data.
        
        Returns:
            Dict with user data if valid, or raises HTTPException
        """
        init_data = request.headers.get("X-Telegram-Init-Data")
        
        if not init_data:
            if self.auto_error:
                # Development mode: allow if no bot token
                if not BOT_TOKEN:
                    logger.debug("No BOT_TOKEN, returning dev user")
                    return {"id": 0, "first_name": "Dev", "username": "dev_user", "is_dev": True}
                
                logger.warning(f"Missing init data from {request.client.host}")
                raise HTTPException(
                    status_code=401, 
                    detail="Authentication required: missing X-Telegram-Init-Data"
                )
            return None

        # Validate signature
        if not self._validate_init_data(init_data):
            logger.warning(f"Invalid init data signature from {request.client.host}")
            raise HTTPException(
                status_code=403, 
                detail="Invalid authentication signature"
            )
        
        # Parse and return user data
        user_data = self._parse_user_data(init_data)
        
        if not user_data:
            logger.warning("Valid signature but no user data")
            raise HTTPException(
                status_code=403,
                detail="Authentication data is missing user information"
            )
        
        return user_data

    def _validate_init_data(self, init_data: str) -> bool:
        """
        Validate the init data signature.
        
        Implements Telegram's validation algorithm:
        https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
        """
        if not BOT_TOKEN:
            # Skip validation in development mode
            logger.debug("Skipping validation: no BOT_TOKEN")
            return True
        
        try:
            parsed_data = dict(parse_qsl(init_data, keep_blank_values=True))
            received_hash = parsed_data.get('hash')
            
            if not received_hash:
                logger.debug("No hash in init data")
                return False
            
            # Check auth_date freshness
            auth_date_str = parsed_data.get('auth_date')
            if auth_date_str:
                try:
                    auth_date = int(auth_date_str)
                    if time.time() - auth_date > self.max_age:
                        logger.debug(f"Init data expired: {time.time() - auth_date}s old")
                        return False
                except ValueError:
                    pass
            
            # Build data-check-string (sorted, without hash)
            data_check_list = []
            for key in sorted(parsed_data.keys()):
                if key != 'hash':
                    data_check_list.append(f"{key}={parsed_data[key]}")
            
            data_check_string = "\n".join(data_check_list)
            
            # Calculate signature
            # secret_key = HMAC_SHA256(bot_token, "WebAppData")
            secret_key = hmac.new(
                "WebAppData".encode(), 
                BOT_TOKEN.encode(), 
                hashlib.sha256
            ).digest()
            
            # signature = HMAC_SHA256(data_check_string, secret_key)
            calculated_hash = hmac.new(
                secret_key, 
                data_check_string.encode(), 
                hashlib.sha256
            ).hexdigest()
            
            # Compare hashes (timing-safe)
            return hmac.compare_digest(calculated_hash, received_hash)
            
        except Exception as e:
            logger.error(f"Validation error: {e}")
            return False
    
    def _parse_user_data(self, init_data: str) -> Dict[str, Any]:
        """
        Extract user data from init_data string.
        
        Returns:
            Dict with user fields (id, first_name, username, etc.)
        """
        try:
            parsed_data = dict(parse_qsl(init_data, keep_blank_values=True))
            user_json = parsed_data.get('user')
            
            if user_json:
                user_data = json.loads(user_json)
                
                # Ensure id is an integer
                if 'id' in user_data:
                    user_data['id'] = int(user_data['id'])
                
                # Add raw auth_date if available
                if 'auth_date' in parsed_data:
                    user_data['auth_date'] = int(parsed_data['auth_date'])
                
                return user_data
                
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse user JSON: {e}")
        except Exception as e:
            logger.error(f"Error parsing user data: {e}")
        
        return {}


# Default barrier instance
barrier = TelegramBarrier()

# Alternative barrier that doesn't raise errors
optional_barrier = TelegramBarrier(auto_error=False)


def get_telegram_user(request: Request) -> Optional[Dict[str, Any]]:
    """
    Utility function to get Telegram user from request without raising errors.
    
    Returns:
        User data dict or None if not authenticated
    """
    init_data = request.headers.get("X-Telegram-Init-Data")
    if not init_data:
        return None
    
    temp_barrier = TelegramBarrier(auto_error=False)
    
    if not temp_barrier._validate_init_data(init_data):
        return None
    
    return temp_barrier._parse_user_data(init_data)
