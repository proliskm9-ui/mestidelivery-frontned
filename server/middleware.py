"""
Mestigo API Middleware
Security headers, rate limiting, request logging
"""
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
import time
import logging
from collections import defaultdict
from datetime import datetime, timedelta
from typing import Dict, List
import hashlib

logger = logging.getLogger(__name__)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add security headers to all responses"""
    
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        # Security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(self), microphone=()"
        
        return response


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Rate limiting middleware with sliding window algorithm.
    Limits requests per IP address.
    """
    
    def __init__(self, app, max_requests: int = 100, window_seconds: int = 60):
        super().__init__(app)
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests: Dict[str, List[datetime]] = defaultdict(list)
        self._last_cleanup = datetime.now()
        self._cleanup_interval = timedelta(minutes=5)
    
    def _get_client_identifier(self, request: Request) -> str:
        """Get unique client identifier (IP + optional user agent hash)"""
        client_ip = request.client.host if request.client else "unknown"
        
        # For additional uniqueness, hash with user agent
        user_agent = request.headers.get("user-agent", "")
        identifier = f"{client_ip}:{hashlib.md5(user_agent.encode()).hexdigest()[:8]}"
        
        return identifier
    
    def _cleanup_old_entries(self):
        """Periodically clean up old request records to prevent memory leak"""
        now = datetime.now()
        if now - self._last_cleanup < self._cleanup_interval:
            return
        
        cutoff = now - timedelta(seconds=self.window_seconds * 2)
        to_delete = []
        
        for client_id, timestamps in self.requests.items():
            # Remove old timestamps
            self.requests[client_id] = [ts for ts in timestamps if ts > cutoff]
            # Mark for deletion if empty
            if not self.requests[client_id]:
                to_delete.append(client_id)
        
        for client_id in to_delete:
            del self.requests[client_id]
        
        self._last_cleanup = now
    
    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting for health checks
        if request.url.path in ["/", "/health", "/api/ping"]:
            return await call_next(request)
        
        client_id = self._get_client_identifier(request)
        now = datetime.now()
        
        # Clean up old entries periodically
        self._cleanup_old_entries()
        
        # Filter out old requests outside the window
        window_start = now - timedelta(seconds=self.window_seconds)
        self.requests[client_id] = [
            req_time for req_time in self.requests[client_id]
            if req_time > window_start
        ]
        
        # Check rate limit
        if len(self.requests[client_id]) >= self.max_requests:
            logger.warning(f"Rate limit exceeded for client: {client_id}")
            
            # Calculate retry-after
            oldest_request = min(self.requests[client_id])
            retry_after = int((oldest_request + timedelta(seconds=self.window_seconds) - now).total_seconds())
            retry_after = max(1, retry_after)
            
            return JSONResponse(
                status_code=429,
                content={
                    "detail": "Too many requests",
                    "retry_after": retry_after
                },
                headers={"Retry-After": str(retry_after)}
            )
        
        # Record this request
        self.requests[client_id].append(now)
        
        return await call_next(request)


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Log all requests with timing information"""
    
    # Paths to skip detailed logging (for noise reduction)
    SKIP_PATHS = {"/health", "/api/ping", "/favicon.ico"}
    
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        
        # Get client info
        client_ip = request.client.host if request.client else "unknown"
        
        # Skip noisy endpoints
        if request.url.path in self.SKIP_PATHS:
            return await call_next(request)
        
        # Log incoming request
        logger.info(f"→ {request.method} {request.url.path} - IP: {client_ip}")
        
        try:
            response = await call_next(request)
            process_time = time.time() - start_time
            
            # Determine log level based on status code
            if response.status_code >= 500:
                log_func = logger.error
            elif response.status_code >= 400:
                log_func = logger.warning
            else:
                log_func = logger.info
            
            log_func(
                f"← {request.method} {request.url.path} - "
                f"Status: {response.status_code} - "
                f"Time: {process_time:.3f}s"
            )
            
            # Add timing header
            response.headers["X-Process-Time"] = f"{process_time:.3f}"
            
            return response
            
        except Exception as e:
            process_time = time.time() - start_time
            logger.error(
                f"✗ {request.method} {request.url.path} - "
                f"Error: {str(e)} - "
                f"Time: {process_time:.3f}s"
            )
            raise
