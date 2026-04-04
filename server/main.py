"""
Mestigo API - Production Server
Mode: Supabase API Client
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.staticfiles import StaticFiles
from starlette.exceptions import HTTPException as StarletteHTTPException
import logging
import os

from config import (
    CORS_ORIGINS, CORS_ALLOW_ALL, UPLOAD_DIR, LOG_LEVEL, ENABLE_DOCS,
    RATE_LIMIT_REQUESTS, RATE_LIMIT_WINDOW, HOST, PORT, SSL_KEYFILE, SSL_CERTFILE, WORKERS
)
from routers import categories, restaurants, products, orders, upload, stores, auth, promo, courier, profile, partners
from middleware import SecurityHeadersMiddleware, RateLimitMiddleware, RequestLoggingMiddleware

# Configure logging
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle - startup and shutdown"""
    logger.info("🚀 Starting Mestigo API (Supabase API Mode)...")
    
    # Check Supabase connection
    try:
        from supabase_client import get_supabase
        client = get_supabase()
        if not client:
            logger.warning("⚠️ Supabase client not initialized! Check SUPABASE_URL and SUPABASE_KEY")
        else:
            # Test connection with a simple query
            try:
                test = client.table("categories").select("id").limit(1).execute()
                logger.info("✅ Supabase connection verified")
            except Exception as e:
                logger.warning(f"⚠️ Supabase connection test failed: {e}")
    except Exception as e:
        logger.error(f"❌ Supabase init error: {e}")

    logger.info("✅ Mestigo API started successfully")
    
    yield
    
    logger.info("🛑 Shutting down Mestigo API...")


# Create FastAPI app
app = FastAPI(
    title="Mestigo API",
    description="Food Delivery Backend API",
    version="2.1.0",
    lifespan=lifespan,
    docs_url="/docs" if ENABLE_DOCS else None,
    redoc_url="/redoc" if ENABLE_DOCS else None,
)

# =============================================================================
# Middleware Stack (order matters - last added = first executed)
# CORS MUST be added last so it executes first and handles errors properly
# =============================================================================

# 1. CORS - MUST BE FIRST (added last = executed first)
# This ensures CORS headers are added even on error responses
if CORS_ALLOW_ALL:
    logger.warning("⚠️ CORS is set to allow ALL origins. Not recommended for production!")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["*"],
    )
else:
    logger.info(f"✅ CORS configured for {len(CORS_ORIGINS)} origins")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
        allow_headers=[
            "Content-Type", 
            "Authorization", 
            "X-Telegram-Init-Data",
            "Accept",
            "Origin",
            "X-Requested-With"
        ],
    )

# 2. Security Headers
app.add_middleware(SecurityHeadersMiddleware)

# 3. Rate Limiting
app.add_middleware(
    RateLimitMiddleware, 
    max_requests=RATE_LIMIT_REQUESTS, 
    window_seconds=RATE_LIMIT_WINDOW
)

# 4. Request Logging
app.add_middleware(RequestLoggingMiddleware)

# =============================================================================
# Static Files
# =============================================================================
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


# =============================================================================
# Exception Handlers
# =============================================================================

def _add_cors_headers(response: JSONResponse) -> JSONResponse:
    """Add CORS headers to error responses"""
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PATCH, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "*"
    return response


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors with detailed response"""
    errors = exc.errors()
    logger.warning(f"Validation error on {request.url.path}: {errors}")
    
    # Simplify error messages for client
    simplified_errors = []
    for error in errors:
        simplified_errors.append({
            "field": ".".join(str(loc) for loc in error.get("loc", [])),
            "message": error.get("msg", "Invalid value"),
            "type": error.get("type", "unknown")
        })
    
    response = JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": "Validation error",
            "errors": simplified_errors
        }
    )
    return _add_cors_headers(response)


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """Handle HTTP exceptions (404, 500, etc.)"""
    response = JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )
    return _add_cors_headers(response)


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle unexpected errors"""
    import traceback
    error_trace = traceback.format_exc()
    logger.error(f"Unhandled exception on {request.url.path}: {str(exc)}\n{error_trace}")
    
    # Expose error details for debugging (disable in production!)
    return _add_cors_headers(JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": str(exc),
            "type": type(exc).__name__,
            "path": request.url.path
        }
    ))


# =============================================================================
# API Routes
# =============================================================================

# Auth routes (no prefix, they define their own)
app.include_router(auth.router, prefix="/api", tags=["Auth"])

# Main API routes
app.include_router(categories.router, prefix="/api", tags=["Categories"])
app.include_router(restaurants.router, prefix="/api", tags=["Restaurants"])
app.include_router(products.router, prefix="/api", tags=["Products"])
app.include_router(orders.router, prefix="/api", tags=["Orders"])
app.include_router(stores.router, prefix="/api", tags=["Stores"])
app.include_router(promo.router, prefix="/api", tags=["Promo"])
app.include_router(courier.router, prefix="/api", tags=["Courier"])

# Upload route
app.include_router(upload.router, prefix="/api", tags=["Upload"])

# Profile route
app.include_router(profile.router, prefix="/api", tags=["Profile"])

# Partners route
app.include_router(partners.router, tags=["Partners"])


# =============================================================================
# WebSocket Routes
# =============================================================================
from fastapi import WebSocket, WebSocketDisconnect
from websockets_manager import manager

@app.websocket("/ws/tracking/{order_id}")
async def websocket_endpoint(websocket: WebSocket, order_id: int):
    await manager.connect(websocket, order_id)
    try:
        while True:
            # Keep connection alive, maybe listen for client pings if needed
            data = await websocket.receive_text()
            # We can ignore client messages for now, this is one-way broadcast mostly
    except WebSocketDisconnect:
        manager.disconnect(websocket, order_id)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket, order_id)



# =============================================================================
# Health Endpoints
# =============================================================================

@app.get("/", tags=["Health"])
async def root():
    """Root endpoint - API info"""
    return {
        "status": "ok",
        "name": "Mestigo API",
        "version": "2.1.0",
        "mode": "supabase_api"
    }


@app.get("/health", tags=["Health"])
async def health():
    """Health check endpoint"""
    # Check Supabase connection
    from supabase_client import get_supabase
    supabase = get_supabase()
    
    db_status = "unknown"
    if supabase:
        try:
            supabase.table("categories").select("id").limit(1).execute()
            db_status = "connected"
        except Exception:
            db_status = "error"
    else:
        db_status = "not_configured"
    
    return {
        "status": "healthy" if db_status == "connected" else "degraded",
        "database": db_status,
        "version": "2.1.0"
    }


@app.get("/api/debug/db", tags=["Health"])
async def debug_db():
    """Diagnostic endpoint for database connection"""
    from supabase_client import get_supabase
    supabase = get_supabase()
    if not supabase:
        return {"status": "error", "message": "Supabase client not initialized"}
    
    results = {}
    tables = ["categories", "restaurants", "products", "orders", "admin_users", "customers"]
    
    for table in tables:
        try:
            # Try a simple count or select
            res = supabase.table(table).select("count", count="exact").limit(1).execute()
            results[table] = {"status": "ok", "count": res.count}
        except Exception as e:
            results[table] = {"status": "error", "message": str(e)}
            
    return {
        "status": "ready",
        "url": os.environ.get("SUPABASE_URL"),
        "tables": results
    }


@app.get("/api/ping", tags=["Health"])
async def ping():
    """Simple ping endpoint"""
    return {"pong": True}


# =============================================================================
# Run Server
# =============================================================================

if __name__ == "__main__":
    import uvicorn
    
    # Check if SSL certificates exist
    use_ssl = os.path.exists(SSL_KEYFILE) and os.path.exists(SSL_CERTFILE)
    
    if use_ssl:
        logger.info(f"🔒 Starting HTTPS server on {HOST}:{PORT}")
        uvicorn.run(
            "main:app",
            host=HOST,
            port=PORT,
            ssl_keyfile=SSL_KEYFILE,
            ssl_certfile=SSL_CERTFILE,
            log_level=LOG_LEVEL.lower(),
            workers=WORKERS
        )
    else:
        # HTTP mode using configured port
        logger.info(f"⚠️ No SSL certificates found, starting HTTP on {HOST}:{PORT}")
        uvicorn.run(
            "main:app",
            host=HOST,
            port=PORT,
            reload=True,
            log_level="info"
        )
