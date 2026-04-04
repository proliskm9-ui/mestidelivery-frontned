from fastapi import APIRouter, Depends, HTTPException, status
import logging

from supabase_client import get_supabase
from models import Customer
from schemas import CustomerResponse, CustomerUpdate
from routers.auth import get_current_customer

router = APIRouter(prefix="/profile", tags=["Profile"])
logger = logging.getLogger(__name__)

@router.get("/me", response_model=CustomerResponse)
async def get_profile(customer: Customer = Depends(get_current_customer)):
    """Get current customer profile with all fields"""
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=503, detail="Database unavailable")
    
    response = supabase.table("customers").select("*").eq("id", customer.id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    data = response.data[0]
    return CustomerResponse(
        id=data['id'],
        email=data['email'],
        full_name=data.get('full_name'),
        phone=data.get('phone'),
        avatar=data.get('avatar'),
        address=data.get('address'),
        points=data.get('points', 0)
    )

@router.put("/me", response_model=CustomerResponse)
async def update_profile(
    updates: CustomerUpdate, 
    customer: Customer = Depends(get_current_customer)
):
    """Update current customer profile fields"""
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=503, detail="Database unavailable")
    
    # Filter out None values
    update_data = {k: v for k, v in updates.dict().items() if v is not None}
    
    if not update_data:
        # No updates, just return current
        return await get_profile(customer)
        
    result = supabase.table("customers").update(update_data).eq("id", customer.id).execute()
    
    if not result.data:
        raise HTTPException(status_code=500, detail="Update failed")
        
    data = result.data[0]
    return CustomerResponse(
        id=data['id'],
        email=data['email'],
        full_name=data.get('full_name'),
        phone=data.get('phone'),
        avatar=data.get('avatar'),
        address=data.get('address'),
        points=data.get('points', 0)
    )

@router.get("/orders")
async def get_my_orders(customer: Customer = Depends(get_current_customer)):
    """Get order history for current user"""
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=503, detail="Database unavailable")
        
    # Fetch orders for the current customer
    response = supabase.table("orders").select("*").eq("user_id", str(customer.id)).order("created_at", desc=True).execute()
    orders = response.data if response.data else []

    # Enrich with restaurant names by fetching all unique restaurant_ids
    restaurant_ids = list({o["restaurant_id"] for o in orders if o.get("restaurant_id")})
    restaurant_names: dict = {}
    if restaurant_ids:
        try:
            rest_resp = supabase.table("restaurants").select("id, name").in_("id", restaurant_ids).execute()
            if rest_resp.data:
                restaurant_names = {str(r["id"]): r["name"] for r in rest_resp.data}
        except Exception:
            pass

    for order in orders:
        rid = str(order.get("restaurant_id", ""))
        order["restaurant_name"] = restaurant_names.get(rid)

    logger.info(f"Returning {len(orders)} orders for customer {customer.id}")
    return orders

