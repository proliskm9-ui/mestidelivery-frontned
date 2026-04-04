"""
Promo Codes Router - Improved Version
Promo code management with proper validation and race condition handling
"""
from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone
from typing import List, Optional
import logging

from supabase_client import get_supabase
from models import AdminUser
from schemas import PromoCodeCreate, PromoCodeResponse, PromoCodeValidate, PromoCodeValidateResponse
from routers.auth import require_super_admin
from barrier import barrier
from config import CURRENCY_SYMBOL

router = APIRouter(prefix="/promo", tags=["promo"])
logger = logging.getLogger(__name__)


def parse_datetime(dt_string: Optional[str]) -> Optional[datetime]:
    """Safely parse ISO datetime string"""
    if not dt_string:
        return None
    try:
        # Handle various ISO formats
        if dt_string.endswith('Z'):
            dt_string = dt_string[:-1] + '+00:00'
        return datetime.fromisoformat(dt_string)
    except (ValueError, AttributeError):
        return None


def get_utc_now() -> datetime:
    """Get current UTC time as timezone-aware datetime"""
    return datetime.now(timezone.utc)


# =============================================================================
# Admin Endpoints
# =============================================================================

@router.get("", response_model=List[PromoCodeResponse])
async def get_promo_codes(
    is_active: Optional[bool] = None,
    current_user: AdminUser = Depends(require_super_admin)
):
    """Get all promo codes (admin only)"""
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not available")
    
    query = supabase.table("promo_codes").select("*")
    
    if is_active is not None:
        query = query.eq("is_active", is_active)
    
    result = query.order("created_at", desc=True).execute()
    return result.data


@router.get("/{promo_id}", response_model=PromoCodeResponse)
async def get_promo_code(
    promo_id: int,
    current_user: AdminUser = Depends(require_super_admin)
):
    """Get a specific promo code by ID (admin only)"""
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not available")
    
    result = supabase.table("promo_codes").select("*").eq("id", promo_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Promo code not found")
    
    return result.data[0]


@router.post("", response_model=PromoCodeResponse)
async def create_promo_code(
    promo: PromoCodeCreate,
    current_user: AdminUser = Depends(require_super_admin)
):
    """Create a new promo code (admin only)"""
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not available")
    
    # Validate: must have either percent or fixed discount
    if promo.discount_percent <= 0 and promo.discount_amount <= 0:
        raise HTTPException(
            status_code=400, 
            detail="Promo code must have either discount_percent or discount_amount > 0"
        )
    
    # Validate: can't have both
    if promo.discount_percent > 0 and promo.discount_amount > 0:
        raise HTTPException(
            status_code=400,
            detail="Promo code cannot have both percentage and fixed discount"
        )
    
    # Check code uniqueness
    code_upper = promo.code.upper().strip()
    check = supabase.table("promo_codes").select("id").eq("code", code_upper).execute()
    if check.data:
        raise HTTPException(status_code=400, detail="Promo code already exists")
    
    # Validate restaurant_id if provided
    if promo.restaurant_id:
        rest_check = supabase.table("restaurants").select("id").eq("id", promo.restaurant_id).execute()
        if not rest_check.data:
            raise HTTPException(status_code=400, detail="Restaurant not found")
    
    new_promo = {
        "code": code_upper,
        "discount_percent": promo.discount_percent,
        "discount_amount": promo.discount_amount,
        "min_order": promo.min_order,
        "max_uses": promo.max_uses,
        "current_uses": 0,
        "is_active": promo.is_active,
        "valid_from": promo.valid_from,
        "valid_until": promo.valid_until,
        "restaurant_id": promo.restaurant_id
    }
    
    result = supabase.table("promo_codes").insert(new_promo).execute()
    
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create promo code")
    
    logger.info(f"Promo code created: {code_upper} by {current_user.username}")
    return result.data[0]


@router.put("/{promo_id}", response_model=PromoCodeResponse)
async def update_promo_code(
    promo_id: int,
    promo: PromoCodeCreate,
    current_user: AdminUser = Depends(require_super_admin)
):
    """Update an existing promo code (admin only)"""
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not available")
    
    # Check if promo exists
    check = supabase.table("promo_codes").select("id, code").eq("id", promo_id).execute()
    if not check.data:
        raise HTTPException(status_code=404, detail="Promo code not found")
    
    # Check for code collision if code is being changed
    code_upper = promo.code.upper().strip()
    if code_upper != check.data[0]['code']:
        code_check = supabase.table("promo_codes").select("id").eq("code", code_upper).execute()
        if code_check.data:
            raise HTTPException(status_code=400, detail="Another promo code with this code already exists")
    
    update_data = {
        "code": code_upper,
        "discount_percent": promo.discount_percent,
        "discount_amount": promo.discount_amount,
        "min_order": promo.min_order,
        "max_uses": promo.max_uses,
        "is_active": promo.is_active,
        "valid_from": promo.valid_from,
        "valid_until": promo.valid_until,
        "restaurant_id": promo.restaurant_id
    }
    
    result = supabase.table("promo_codes").update(update_data).eq("id", promo_id).execute()
    
    logger.info(f"Promo code {promo_id} updated by {current_user.username}")
    return result.data[0]


@router.patch("/{promo_id}/toggle")
async def toggle_promo_code(
    promo_id: int,
    current_user: AdminUser = Depends(require_super_admin)
):
    """Toggle promo code active status (admin only)"""
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not available")
    
    # Get current status
    check = supabase.table("promo_codes").select("id, is_active, code").eq("id", promo_id).execute()
    if not check.data:
        raise HTTPException(status_code=404, detail="Promo code not found")
    
    current_status = check.data[0]['is_active']
    new_status = not current_status
    
    supabase.table("promo_codes").update({"is_active": new_status}).eq("id", promo_id).execute()
    
    logger.info(f"Promo code {check.data[0]['code']} {'activated' if new_status else 'deactivated'} by {current_user.username}")
    return {"success": True, "is_active": new_status}


@router.delete("/{promo_id}")
async def delete_promo_code(
    promo_id: int,
    current_user: AdminUser = Depends(require_super_admin)
):
    """Delete a promo code (admin only)"""
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not available")
    
    check = supabase.table("promo_codes").select("id, code").eq("id", promo_id).execute()
    if not check.data:
        raise HTTPException(status_code=404, detail="Promo code not found")
    
    supabase.table("promo_codes").delete().eq("id", promo_id).execute()
    
    logger.info(f"Promo code {check.data[0]['code']} deleted by {current_user.username}")
    return {"success": True}


# =============================================================================
# Public Endpoints (for customers)
# =============================================================================

@router.post("/validate", response_model=PromoCodeValidateResponse)
async def validate_promo_code(
    data: PromoCodeValidate,
    _: dict = Depends(barrier)
):
    """
    Validate a promo code and calculate discount.
    
    Returns discount amount if valid, or error message if invalid.
    """
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not available")
    
    code_upper = data.code.upper().strip()
    
    result = supabase.table("promo_codes").select("*").eq("code", code_upper).execute()
    
    if not result.data:
        return PromoCodeValidateResponse(valid=False, message="Промокод не найден")
    
    promo = result.data[0]
    
    # Check if active
    if not promo.get('is_active', False):
        return PromoCodeValidateResponse(valid=False, message="Промокод неактивен")
    
    # Check validity period
    now = get_utc_now()
    
    valid_from = parse_datetime(promo.get('valid_from'))
    if valid_from:
        # Make naive datetime timezone-aware if needed
        if valid_from.tzinfo is None:
            valid_from = valid_from.replace(tzinfo=timezone.utc)
        if now < valid_from:
            return PromoCodeValidateResponse(valid=False, message="Промокод ещё не действует")
    
    valid_until = parse_datetime(promo.get('valid_until'))
    if valid_until:
        if valid_until.tzinfo is None:
            valid_until = valid_until.replace(tzinfo=timezone.utc)
        if now > valid_until:
            return PromoCodeValidateResponse(valid=False, message="Срок действия промокода истёк")
    
    # Check usage limit
    max_uses = promo.get('max_uses', 0) or 0
    current_uses = promo.get('current_uses', 0) or 0
    
    if max_uses > 0 and current_uses >= max_uses:
        return PromoCodeValidateResponse(valid=False, message="Промокод исчерпан")
    
    # Check minimum order amount
    min_order = promo.get('min_order', 0) or 0
    if data.order_total < min_order:
        return PromoCodeValidateResponse(
            valid=False,
            message=f"Минимальная сумма заказа: {min_order}{CURRENCY_SYMBOL}"
        )
    
    # Check restaurant restriction
    promo_restaurant_id = promo.get('restaurant_id')
    if promo_restaurant_id and data.restaurant_id:
        if promo_restaurant_id != data.restaurant_id:
            return PromoCodeValidateResponse(
                valid=False,
                message="Промокод не действует для этого ресторана"
            )
    
    # Calculate discount
    discount = 0.0
    discount_percent = promo.get('discount_percent', 0) or 0
    discount_amount = promo.get('discount_amount', 0) or 0
    
    if discount_percent > 0:
        discount = data.order_total * discount_percent / 100
        discount_message = f"Скидка {discount_percent}%"
    elif discount_amount > 0:
        discount = min(discount_amount, data.order_total)  # Can't exceed order total
        discount_message = f"Скидка {discount_amount}{CURRENCY_SYMBOL}"
    
    discount = round(discount, 2)
    
    return PromoCodeValidateResponse(
        valid=True,
        discount=discount,
        message=f"{discount_message} применена! Вы сэкономите {discount}{CURRENCY_SYMBOL}"
    )


@router.post("/use/{code}")
async def use_promo_code(
    code: str,
    _: dict = Depends(barrier)
):
    """
    Increment promo code usage counter.
    Called when order is successfully placed.
    Uses optimistic locking to prevent race conditions.
    """
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not available")
    
    code_upper = code.upper().strip()
    
    result = supabase.table("promo_codes").select("id, current_uses, max_uses, is_active").eq("code", code_upper).execute()
    
    if not result.data:
        logger.warning(f"Attempted to use non-existent promo code: {code_upper}")
        return {"success": False, "message": "Promo code not found"}
    
    promo = result.data[0]
    
    # Check if still valid
    if not promo.get('is_active', False):
        return {"success": False, "message": "Promo code is no longer active"}
    
    max_uses = promo.get('max_uses', 0) or 0
    current_uses = promo.get('current_uses', 0) or 0
    
    if max_uses > 0 and current_uses >= max_uses:
        return {"success": False, "message": "Promo code exhausted"}
    
    # Optimistic update: only update if current_uses hasn't changed
    new_uses = current_uses + 1
    
    supabase.table("promo_codes") \
        .update({"current_uses": new_uses}) \
        .eq("id", promo['id']) \
        .eq("current_uses", current_uses) \
        .execute()
    
    logger.info(f"Promo code {code_upper} used (now {new_uses} uses)")
    return {"success": True}


# =============================================================================
# Statistics Endpoint
# =============================================================================

@router.get("/stats/summary")
async def get_promo_stats(
    current_user: AdminUser = Depends(require_super_admin)
):
    """Get promo code usage statistics (admin only)"""
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not available")
    
    result = supabase.table("promo_codes").select("*").execute()
    
    total = len(result.data)
    active = sum(1 for p in result.data if p.get('is_active', False))
    total_uses = sum(p.get('current_uses', 0) or 0 for p in result.data)
    
    # Find most used
    most_used = max(result.data, key=lambda p: p.get('current_uses', 0) or 0, default=None)
    
    return {
        "total_promo_codes": total,
        "active_promo_codes": active,
        "inactive_promo_codes": total - active,
        "total_uses": total_uses,
        "most_used": {
            "code": most_used['code'],
            "uses": most_used.get('current_uses', 0)
        } if most_used else None
    }
