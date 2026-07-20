"""
Authentication Router
JWT-based authentication for admin panel, courier app AND CUSTOMERS
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from datetime import datetime, timedelta
from typing import Optional, List
import jwt
import bcrypt
import logging
import secrets

from supabase_client import get_supabase
from models import AdminUser, UserRole, Customer
from schemas import (
    LoginRequest, LoginResponse, AdminUserResponse, CreateAdminRequest,
    CustomerRegister, CustomerLogin, CustomerGoogleAuth, CustomerResponse, CustomerLoginResponse
)
from config import SECRET_KEY, JWT_ALGORITHM, JWT_EXPIRE_DAYS

router = APIRouter(tags=["auth"])
logger = logging.getLogger(__name__)

security = HTTPBearer()


# =============================================================================
# Password Utilities
# =============================================================================

def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, hashed: str) -> bool:
    """Verify a password against its hash"""
    try:
        return bcrypt.checkpw(password.encode(), hashed.encode())
    except Exception as e:
        logger.error(f"Password verification error: {e}")
        return False


# =============================================================================
# JWT Utilities
# =============================================================================

def create_token(user_id: int, role: str, restaurant_id: Optional[str] = None) -> str:
    """Create a JWT token for a user"""
    payload = {
        "user_id": user_id,
        "role": role,
        "restaurant_id": restaurant_id,
        "iat": datetime.utcnow(),
        "exp": datetime.utcnow() + timedelta(days=JWT_EXPIRE_DAYS)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    """Decode and validate a JWT token"""
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )
    except jwt.InvalidTokenError as e:
        logger.warning(f"Invalid token: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )


# =============================================================================
# Dependencies
# =============================================================================

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> AdminUser:
    """
    Dependency to get the current authenticated ADMIN user.
    """
    try:
        payload = decode_token(credentials.credentials)
        user_id = payload.get("user_id")
        role = payload.get("role")
        
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
            
        if role == 'customer':
             raise HTTPException(status_code=403, detail="Customer cannot access admin endpoints")

        # Fetch from admin_users
        supabase = get_supabase()
        if not supabase:
            raise HTTPException(status_code=503, detail="Database error")

        response = supabase.table("admin_users").select("*").eq("id", user_id).execute()
        if not response.data:
            raise HTTPException(status_code=401, detail="User not found")
        
        user_data = response.data[0]
        return AdminUser(
            id=user_data['id'],
            username=user_data['username'],
            password_hash=user_data['password_hash'],
            role=UserRole(user_data['role']),
            restaurant_id=user_data.get('restaurant_id'),
            is_online=user_data.get('is_online', False),
            push_token=user_data.get('push_token')
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Auth error: {e}")
        raise HTTPException(status_code=401, detail="Auth failed")


async def get_current_customer(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> Customer:
    """
    Dependency to get the current authenticated CUSTOMER.
    """
    try:
        payload = decode_token(credentials.credentials)
        user_id = payload.get("user_id")
        role = payload.get("role")
        
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
            
        if role != 'customer':
             raise HTTPException(status_code=403, detail="Only customers allowed")

        supabase = get_supabase()
        if not supabase:
            raise HTTPException(status_code=503, detail="Database error")

        response = supabase.table("customers").select("*").eq("id", user_id).execute()
        if not response.data:
            raise HTTPException(status_code=401, detail="Customer not found")
        
        data = response.data[0]
        return Customer(
            id=data['id'],
            email=data['email'],
            password_hash=data['password_hash'],
            full_name=data.get('full_name'),
            phone=data.get('phone')
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Customer Auth error: {e}")
        raise HTTPException(status_code=401, detail="Auth failed")


def require_super_admin(user: AdminUser = Depends(get_current_user)) -> AdminUser:
    if user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Super admin access required")
    return user


# =============================================================================
# Admin Auth Endpoints
# =============================================================================

@router.post("/auth/login", response_model=LoginResponse)
async def login(data: LoginRequest):
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=503, detail="Database unavailable")

    response = supabase.table("admin_users").select("*").eq("username", data.username).execute()
    if not response.data:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user_data = response.data[0]
    if not verify_password(data.password, user_data['password_hash']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    role_str = get_role_value(user_data['role'])
    token = create_token(user_data['id'], role_str, user_data.get('restaurant_id'))
    
    return LoginResponse(
        token=token,
        user=AdminUserResponse(
            id=user_data['id'],
            username=user_data['username'],
            role=role_str,
            restaurant_id=user_data.get('restaurant_id')
        )
    )

def get_role_value(role) -> str:
    if isinstance(role, str):
        return role
    return role.value if hasattr(role, 'value') else str(role)


# =============================================================================
# Customer Auth Endpoints
# =============================================================================

@router.post("/auth/customer/register", response_model=CustomerLoginResponse)
async def customer_register(data: CustomerRegister):
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=503, detail="Database unavailable")
    
    # Check email
    check = supabase.table("customers").select("id").eq("email", data.email).execute()
    if check.data:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    new_customer = {
        "email": data.email,
        "password_hash": hash_password(data.password),
        "full_name": data.full_name,
        "phone": data.phone
    }
    
    result = supabase.table("customers").insert(new_customer).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Registration failed")
        
    customer = result.data[0]
    token = create_token(customer['id'], 'customer')
    
    return CustomerLoginResponse(
        token=token,
        user=CustomerResponse(
            id=customer['id'],
            email=customer['email'],
            full_name=customer.get('full_name'),
            phone=customer.get('phone')
        )
    )

@router.post("/auth/customer/login", response_model=CustomerLoginResponse)
async def customer_login(data: CustomerLogin):
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=503, detail="Database unavailable")
        
    response = supabase.table("customers").select("*").eq("email", data.email).execute()
    if not response.data:
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    customer = response.data[0]
    if not verify_password(data.password, customer['password_hash']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    token = create_token(customer['id'], 'customer')
    
    return CustomerLoginResponse(
        token=token,
        user=CustomerResponse(
            id=customer['id'],
            email=customer['email'],
            full_name=customer.get('full_name'),
            phone=customer.get('phone')
        )
    )


@router.post("/auth/customer/google", response_model=CustomerLoginResponse)
async def customer_google(data: CustomerGoogleAuth):
    """
    Exchange Google identity for a backend JWT.
    - Existing customer (by email): return JWT; phone optional.
    - New customer: requires phone, creates account, returns JWT.
    """
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=503, detail="Database unavailable")

    email = data.email.strip().lower()
    full_name = (data.full_name or '').strip() or 'User'
    phone = (data.phone or '').strip() or None

    existing = supabase.table("customers").select("*").ilike("email", email).execute()
    if not existing.data:
        # fallback exact match if ilike unsupported
        existing = supabase.table("customers").select("*").eq("email", email).execute()

    if existing.data:
        customer = existing.data[0]
        updates = {}
        if full_name and full_name != 'User' and full_name != customer.get('full_name'):
            updates['full_name'] = full_name
        if phone and phone != customer.get('phone'):
            updates['phone'] = phone
        if updates:
            updated = supabase.table("customers").update(updates).eq("id", customer['id']).execute()
            if updated.data:
                customer = updated.data[0]
    else:
        if not phone or len(phone) < 5:
            raise HTTPException(
                status_code=400,
                detail="phone_required",
            )
        new_customer = {
            "email": email,
            "password_hash": hash_password(secrets.token_urlsafe(32)),
            "full_name": full_name,
            "phone": phone,
        }
        result = supabase.table("customers").insert(new_customer).execute()
        if not result.data:
            raise HTTPException(status_code=500, detail="Registration failed")
        customer = result.data[0]

    token = create_token(customer['id'], 'customer')
    return CustomerLoginResponse(
        token=token,
        user=CustomerResponse(
            id=customer['id'],
            email=customer['email'],
            full_name=customer.get('full_name'),
            phone=customer.get('phone')
        )
    )

@router.get("/auth/customer/me", response_model=CustomerResponse)
async def get_customer_me(customer: Customer = Depends(get_current_customer)):
    return CustomerResponse(
        id=customer.id,
        email=customer.email,
        full_name=customer.full_name,
        phone=customer.phone
    )


# =============================================================================
# Super Admin - User Management
# =============================================================================

@router.get("/admin/users", response_model=List[AdminUserResponse])
async def list_admin_users(super_admin: AdminUser = Depends(require_super_admin)):
    """List all admin users (Super Admin only)"""
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=503, detail="Database unavailable")
        
    result = supabase.table("admin_users").select("*").order("role").execute()
    
    users = []
    for u in result.data:
        users.append(AdminUserResponse(
            id=u['id'],
            username=u['username'],
            role=get_role_value(u['role']),
            restaurant_id=u.get('restaurant_id')
        ))
    return users


@router.post("/admin/users", response_model=AdminUserResponse)
async def create_admin_user(data: CreateAdminRequest, super_admin: AdminUser = Depends(require_super_admin)):
    """Create a new admin/courier user (Super Admin only)"""
    logger.info(f"CREATE USER request: username={data.username}, role={data.role}, password_present={bool(data.password)}, restaurant_id={data.restaurant_id}")
    
    if not data.password or len(data.password) < 6:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password must be at least 6 characters")
    
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=503, detail="Database unavailable")
        
    # Check if username exists
    check = supabase.table("admin_users").select("id").eq("username", data.username).execute()
    if check.data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already exists")
        
    new_user = {
        "username": data.username,
        "password_hash": hash_password(data.password),
        "role": data.role,
        "restaurant_id": data.restaurant_id
    }
    
    result = supabase.table("admin_users").insert(new_user).execute()
    if not result.data:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create user")
        
    u = result.data[0]
    return AdminUserResponse(
        id=u['id'],
        username=u['username'],
        role=get_role_value(u['role']),
        restaurant_id=u.get('restaurant_id')
    )


@router.put("/admin/users/{user_id}", response_model=AdminUserResponse)
async def update_admin_user(user_id: int, data: CreateAdminRequest, super_admin: AdminUser = Depends(require_super_admin)):
    """Update an admin/courier user (Super Admin only)"""
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=503, detail="Database unavailable")
        
    update_data = {
        "username": data.username,
        "role": data.role,
        "restaurant_id": data.restaurant_id
    }
    
    # Only update password if provided and not empty
    if data.password:
        update_data["password_hash"] = hash_password(data.password)
        
    result = supabase.table("admin_users").update(update_data).eq("id", user_id).execute()
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
    u = result.data[0]
    return AdminUserResponse(
        id=u['id'],
        username=u['username'],
        role=get_role_value(u['role']),
        restaurant_id=u.get('restaurant_id')
    )


@router.delete("/admin/users/{user_id}")
async def delete_admin_user(user_id: int, super_admin: AdminUser = Depends(require_super_admin)):
    """Delete an admin/courier user (Super Admin only)"""
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=503, detail="Database unavailable")
        
    # Super Admin cannot delete themselves
    if super_admin.id == user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot delete your own account")
        
    supabase.table("admin_users").delete().eq("id", user_id).execute()
    return {"success": True}
