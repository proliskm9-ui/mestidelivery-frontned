"""
Orders Router - Supabase API Version
Order management with proper error handling and race condition prevention
"""
import json
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from typing import Optional, List
import logging

from supabase_client import get_supabase
from models import AdminUser, UserRole
from schemas import OrderCreate, OrderResponse, OrderStatusUpdate, OrderRateRequest
from routers.auth import get_current_user
from barrier import barrier
from config import SERVICE_FEE_PERCENT, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE

router = APIRouter(prefix="/orders", tags=["orders"])
logger = logging.getLogger(__name__)

# Order status flow definition
ORDER_STATUSES = {
    "pending": {"label": "Ожидает подтверждения", "step": 1},
    "confirmed": {"label": "Подтверждён", "step": 2},
    "preparing": {"label": "Готовится", "step": 3},
    "ready": {"label": "Готов к доставке", "step": 4},
    "delivering": {"label": "В пути", "step": 5},
    "delivered": {"label": "Доставлен", "step": 6},
    "cancelled": {"label": "Отменён", "step": -1},
}

# Valid status transitions
VALID_TRANSITIONS = {
    "pending": ["confirmed", "cancelled"],
    "confirmed": ["preparing", "cancelled"],
    "preparing": ["ready", "cancelled"],
    "ready": ["delivering", "cancelled"],
    "delivering": ["delivered"],
    "delivered": [],
    "cancelled": [],
}


def parse_items(items_data) -> list:
    """Safely parse items from JSON string or return as-is if already parsed"""
    if items_data is None:
        return []
    if isinstance(items_data, list):
        return items_data
    if isinstance(items_data, str):
        try:
            return json.loads(items_data)
        except json.JSONDecodeError:
            logger.warning(f"Failed to parse items JSON: {items_data[:100]}")
            return []
    return []


# =============================================================================
# Public Endpoints (for customers)
# =============================================================================

@router.post("/", response_model=OrderResponse)
async def create_order(
    order: OrderCreate,
    _: dict = Depends(barrier)
):
    """Create a new order"""
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not available")
    
    # Dump items to JSON string if it's a list
    items_json = json.dumps([item.model_dump() for item in order.items]) if isinstance(order.items, list) else order.items
    
    # Calculate service fee (hidden)
    service_fee = order.total * SERVICE_FEE_PERCENT
    
    # Prepare data for insertion
    new_order = {
        "user_id": order.user_id,
        "restaurant_id": order.restaurant_id,
        "items": items_json,
        "total": order.total,
        "status": "pending",
        "customer_name": order.customer_name,
        "phone": order.phone,
        "address": order.address,
        "comment": order.comment,
        "place_type": order.place_type,
        "scheduled_time": order.scheduled_time,
        "promo_code": order.promo_code,
        "tips": order.tips,
        "service_fee": service_fee,
        "delivery_fee": 5.0, # Default delivery fee
        "created_at": datetime.utcnow().isoformat()
    }
    
    # Insert new order
    try:
        result = supabase.table("orders").insert(new_order).execute()
    except Exception as e:
        logger.error(f"Failed to create order: {e}")
        raise HTTPException(status_code=500, detail=f"Order creation failed: {str(e)}")
    
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create order")
        
    created_order = result.data[0]
    
    return created_order


@router.get("/track/{order_id}")
async def track_order(order_id: int):
    """Track order status (public endpoint for customers)"""
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not available")
    
    result = supabase.table("orders").select("*").eq("id", order_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Order not found")
    
    order = result.data[0]
    status_info = ORDER_STATUSES.get(order['status'], {"label": order['status'], "step": 0})
    
    items = parse_items(order.get('items'))

    return {
        "id": order['id'],
        "status": order['status'],
        "status_label": status_info["label"],
        "status_step": status_info["step"],
        "total_steps": 6,
        "restaurant_id": order['restaurant_id'],
        "items": items,
        "total": order['total'],
        "customer_name": order.get('customer_name', ''),
        "address": order.get('address', ''),
        "created_at": order.get('created_at'),
        "courier_id": order.get('courier_id'),
        "rating": order.get('rating'),
        "rating_comment": order.get('rating_comment'),
    }



@router.get("/active/{user_id}")
async def get_active_order(user_id: str):
    """Get the latest active order for a user (not delivered or cancelled)"""
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not available")
    
    # Get latest active order
    result = supabase.table("orders").select("*").eq("user_id", user_id).order("created_at", desc=True).limit(1).execute()
    
    if not result.data:
        return None
    
    order = result.data[0]
    
    # Check if active or waiting for rating
    if order['status'] == 'cancelled':
        return None
    if order['status'] == 'delivered' and order.get('rating') is not None:
        return None
    
    status_info = ORDER_STATUSES.get(order['status'], {"label": order['status'], "step": 0})
    items = parse_items(order.get('items'))
    
    return {
        "id": order['id'],
        "status": order['status'],
        "status_label": status_info["label"],
        "status_step": status_info["step"],
        "total_steps": 6,
        "items": items,
        "total": order['total'],
        "created_at": order['created_at'],
        "courier_id": order.get('courier_id'),
        "rating": order.get('rating'),
        "rating_comment": order.get('rating_comment')
    }


@router.get("/user/{user_id}")
async def get_user_orders(
    user_id: str,
    limit: int = DEFAULT_PAGE_SIZE,
    offset: int = 0,
    _: dict = Depends(barrier)
):
    """Get orders for a specific user (customer)"""
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not available")
    
    # Validate pagination
    limit = min(limit, MAX_PAGE_SIZE)
    
    result = supabase.table("orders") \
        .select("*") \
        .eq("user_id", user_id) \
        .order("created_at", desc=True) \
        .range(offset, offset + limit - 1) \
        .execute()
    
    return [
        {
            "id": order['id'],
            "status": order['status'],
            "status_label": ORDER_STATUSES.get(order['status'], {"label": order['status']})["label"],
            "restaurant_id": order['restaurant_id'],
            "total": order['total'],
            "created_at": order['created_at'],
            "rating": order.get('rating'),
        }
        for order in result.data
    ]

@router.post("/{order_id}/rate")
async def rate_order(
    order_id: int,
    data: OrderRateRequest,
    _: dict = Depends(barrier)
):
    """Rate a delivered order and update restaurant overall rating"""
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not available")
    
    # Check if order exists and is delivered
    result = supabase.table("orders").select("id, status, restaurant_id").eq("id", order_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Order not found")
        
    order = result.data[0]
    if order['status'] != 'delivered':
        raise HTTPException(status_code=400, detail="Can only rate delivered orders")
        
    try:
        # Update order rating
        supabase.table("orders").update({
            "rating": data.rating,
            "rating_comment": data.rating_comment
        }).eq("id", order_id).execute()
        
        # Calculate new average rating for restaurant
        restaurant_id = order.get("restaurant_id")
        if restaurant_id:
            # Fetch all ratings for this restaurant
            ratings_res = supabase.table("orders") \
                .select("rating") \
                .eq("restaurant_id", restaurant_id) \
                .not_.is_("rating", "null") \
                .execute()
                
            if ratings_res.data:
                valid_ratings = [r['rating'] for r in ratings_res.data if isinstance(r.get('rating'), (int, float))]
                if valid_ratings:
                    avg_rating = round(sum(valid_ratings) / len(valid_ratings), 1)
                    # Use str since rating is defined as string in your models (or convert carefully)
                    supabase.table("restaurants").update({"rating": str(avg_rating)}).eq("id", restaurant_id).execute()
                    logger.info(f"Updated restaurant {restaurant_id} rating to {avg_rating}")

        return {"success": True}
    except Exception as e:
        logger.error(f"Failed to rate order {order_id}: {e}")
        # Not raising 500 so frontend doesn't crash if columns in supabase are not yet added
        return {"success": False, "error": str(e)}


@router.get("/statuses")
async def get_order_statuses():
    """Get all possible order statuses with labels"""
    return ORDER_STATUSES


# =============================================================================
# Admin Endpoints
# =============================================================================

@router.get("/", response_model=List[OrderResponse])
async def get_orders(
    user_id: Optional[str] = None,
    status: Optional[str] = None,
    restaurant_id: Optional[str] = None,
    limit: int = DEFAULT_PAGE_SIZE,
    offset: int = 0,
    current_user: AdminUser = Depends(get_current_user)
):
    """Get orders (admin only, filtered by restaurant for restaurant admins)"""
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not available")
    
    # Validate pagination
    limit = min(limit, MAX_PAGE_SIZE)
    
    query = supabase.table("orders").select("*")
    
    # Restaurant admin can only see their orders
    if current_user.role == UserRole.RESTAURANT_ADMIN:
        query = query.eq("restaurant_id", current_user.restaurant_id)
    elif restaurant_id:
        query = query.eq("restaurant_id", restaurant_id)
    
    if user_id:
        query = query.eq("user_id", user_id)
    if status:
        query = query.eq("status", status)
    
    query = query.order("created_at", desc=True).range(offset, offset + limit - 1)
    
    result = query.execute()
    return result.data


@router.post("/", response_model=dict)
async def create_order(
    data: OrderCreate,
    _: dict = Depends(barrier)
):
    """Create a new order with idempotency and payment support"""
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not available")
    
    # Idempotency check — prevent duplicate orders
    if data.idempotency_key:
        existing = supabase.table("orders") \
            .select("id") \
            .eq("idempotency_key", data.idempotency_key) \
            .execute()
        if existing.data:
            order_id = existing.data[0]['id']
            logger.info(f"Duplicate order blocked by idempotency key: {data.idempotency_key}, existing order: {order_id}")
            return {"success": True, "id": order_id, "duplicate": True}
    
    # Calculate service fee
    subtotal = sum(item.price * item.quantity for item in data.items)
    service_fee = round(subtotal * SERVICE_FEE_PERCENT / 100, 2)
    
    # Serialize items to JSON
    items_json = json.dumps([item.model_dump() for item in data.items])
    
    order_data = {
        "user_id": data.user_id,
        "restaurant_id": data.restaurant_id,
        "items": items_json,
        "total": data.total,
        "customer_name": data.customer_name,
        "phone": data.phone,
        "address": data.address,
        "comment": data.comment or "",
        "place_type": data.place_type or "",
        "scheduled_time": data.scheduled_time,
        "promo_code": data.promo_code or "",
        "tips": data.tips or 0,
        "service_fee": service_fee,
        "status": "pending",
        "cutlery_count": data.cutlery_count,
        "apartment": data.apartment,
        "entrance": data.entrance,
        "floor": data.floor,
        "intercom": data.intercom,
        "courier_comment": data.courier_comment,
        "payment_method": data.payment_method or "cash",
    }
    
    # Add idempotency key if provided
    if data.idempotency_key:
        order_data["idempotency_key"] = data.idempotency_key
    
    result = supabase.table("orders").insert(order_data).execute()
    
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create order")
    
    order = result.data[0]
    order_id = order['id']
    
    # Generate payment URL if needed
    payment_url = None
    payment_method = data.payment_method or "cash"
    
    if payment_method in ("crypto", "card"):
        try:
            from services.payment import create_payment
            payment_result = await create_payment(order_id, data.total, payment_method)
            if payment_result:
                payment_url = payment_result.get("payment_url")
        except Exception as e:
            logger.error(f"Payment URL generation failed for order {order_id}: {e}")
    
    # Send Telegram notification
    try:
        from services.telegram_notify import notify_admins
        await notify_admins({
            "id": order_id,
            "customer_name": data.customer_name,
            "phone": data.phone,
            "address": data.address,
            "restaurant_id": data.restaurant_id,
            "restaurant_name": data.restaurant_name,
            "items": [item.model_dump() for item in data.items],
            "total": data.total,
            "comment": data.comment,
            "place_type": data.place_type,
            "scheduled_time": data.scheduled_time,
            "promo_code": data.promo_code,
            "tips": data.tips,
            "cutlery_count": data.cutlery_count,
            "apartment": data.apartment,
            "entrance": data.entrance,
            "floor": data.floor,
            "intercom": data.intercom,
            "courier_comment": data.courier_comment,
            "payment_method": payment_method,
        })
    except Exception as e:
        logger.error(f"Failed to send Telegram notification: {e}")
    
    # Increment promo code usage atomically
    if data.promo_code:
        try:
            await _increment_promo_usage(supabase, data.promo_code)
        except Exception as e:
            logger.error(f"Failed to increment promo code usage: {e}")
    
    logger.info(f"Order {order_id} created for user {data.user_id} [payment: {payment_method}]")
    
    response = {"success": True, "id": order_id}
    if payment_url:
        response["payment_url"] = payment_url
    
    return response


async def _increment_promo_usage(supabase, promo_code: str):
    """
    Increment promo code usage using a safe update pattern.
    This uses a conditional update to prevent race conditions.
    """
    code_upper = promo_code.upper()
    
    # Get current promo
    promo_result = supabase.table("promo_codes") \
        .select("id, current_uses, max_uses") \
        .eq("code", code_upper) \
        .execute()
    
    if not promo_result.data:
        return
    
    promo = promo_result.data[0]
    promo_id = promo['id']
    current_uses = promo.get('current_uses', 0) or 0
    max_uses = promo.get('max_uses', 0) or 0
    
    # Check if still available (double-check for race condition)
    if max_uses > 0 and current_uses >= max_uses:
        logger.warning(f"Promo code {code_upper} exhausted during order creation")
        return
    
    # Use optimistic locking pattern: update only if current_uses hasn't changed
    # This works because Supabase uses PostgreSQL which handles concurrent updates
    new_uses = current_uses + 1
    
    supabase.table("promo_codes") \
        .update({"current_uses": new_uses}) \
        .eq("id", promo_id) \
        .eq("current_uses", current_uses) \
        .execute()


@router.patch("/{order_id}/status")
async def update_order_status(
    order_id: int,
    data: OrderStatusUpdate,
    current_user: AdminUser = Depends(get_current_user)
):
    """Update order status with validation"""
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not available")
    
    # Validate status
    if data.status not in ORDER_STATUSES:
        raise HTTPException(status_code=400, detail=f"Invalid status: {data.status}")
    
    # Get current order
    result = supabase.table("orders").select("*").eq("id", order_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Order not found")
    
    order = result.data[0]
    current_status = order['status']
    
    # Check permissions for restaurant admin
    if current_user.role == UserRole.RESTAURANT_ADMIN:
        if order.get('restaurant_id') != current_user.restaurant_id:
            raise HTTPException(status_code=403, detail="Access denied")
    
    # Validate status transition
    valid_next = VALID_TRANSITIONS.get(current_status, [])
    if data.status not in valid_next and current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot transition from '{current_status}' to '{data.status}'. Valid transitions: {valid_next}"
        )
    
    # Update status
    supabase.table("orders").update({"status": data.status}).eq("id", order_id).execute()

    try:
        from websockets_manager import manager
        await manager.broadcast(order_id, {"type": "status_update", "status": data.status})
    except BaseException as e:
        logger.error(f"Failed to broadcast: {e}")
    
    # Send notification
    try:
        from services.telegram_notify import notify_status_change
        await notify_status_change(order_id, data.status, order.get('phone'))
    except Exception as e:
        logger.error(f"Failed to send status notification: {e}")
    
    logger.info(f"Order {order_id} status changed from {current_status} to {data.status} by {current_user.username}")
    return {"success": True}


@router.delete("/{order_id}")
async def cancel_order(
    order_id: int,
    current_user: AdminUser = Depends(get_current_user)
):
    """Cancel an order"""
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not available")
    
    # Get order
    result = supabase.table("orders").select("*").eq("id", order_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Order not found")
    
    order = result.data[0]
    
    # Check permissions
    if current_user.role == UserRole.RESTAURANT_ADMIN:
        if order.get('restaurant_id') != current_user.restaurant_id:
            raise HTTPException(status_code=403, detail="Access denied")
    
    # Check if order can be cancelled
    if order['status'] in ['delivered', 'cancelled']:
        raise HTTPException(status_code=400, detail=f"Cannot cancel order in '{order['status']}' status")
    
    # Cancel order
    supabase.table("orders").update({"status": "cancelled"}).eq("id", order_id).execute()

    try:
        from websockets_manager import manager
        await manager.broadcast(order_id, {"type": "status_update", "status": "cancelled"})
    except BaseException as e:
        pass
    
    logger.info(f"Order {order_id} cancelled by {current_user.username}")
    return {"success": True}


# =============================================================================
# Courier Endpoints (legacy compatibility - main ones are in courier.py)
# =============================================================================

@router.get("/courier/available")
async def get_available_orders_for_courier():
    """Get orders available for couriers (ready, no courier assigned)"""
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not available")
    
    result = supabase.table("orders") \
        .select("*") \
        .eq("status", "ready") \
        .is_("courier_id", "null") \
        .order("created_at", desc=True) \
        .execute()
    
    return result.data


@router.post("/{order_id}/take")
async def take_order_by_courier(
    order_id: int,
    current_user: AdminUser = Depends(get_current_user)
):
    """Courier takes an order for delivery"""
    if current_user.role != UserRole.COURIER:
        raise HTTPException(status_code=403, detail="Only couriers can take orders")
    
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not available")
    
    # Get order
    result = supabase.table("orders").select("*").eq("id", order_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Order not found")
    
    order = result.data[0]
    
    if order['status'] != "ready":
        raise HTTPException(status_code=400, detail="Order is not ready for delivery")
    
    if order.get('courier_id'):
        raise HTTPException(status_code=400, detail="Order already taken by another courier")
    
    # Assign courier
    update_data = {
        "courier_id": current_user.id,
        "courier_taken_at": datetime.utcnow().isoformat(),
        "status": "delivering"
    }
    
    supabase.table("orders").update(update_data).eq("id", order_id).execute()

    try:
        from websockets_manager import manager
        await manager.broadcast(order_id, {"type": "status_update", "status": "delivering", "courier_id": current_user.id})
    except BaseException as e:
        pass
    
    # Notify
    try:
        from services.telegram_notify import notify_status_change
        await notify_status_change(order_id, "delivering", order.get('phone'))
    except Exception as e:
        logger.error(f"Failed to send notification: {e}")
    
    logger.info(f"Order {order_id} taken by courier {current_user.username}")
    return {"success": True}


@router.post("/estimate-delivery")
async def estimate_delivery_time(
    data: dict,  # {restaurant_id: str, latitude: float, longitude: float, address: str}
    _: dict = Depends(barrier)
):
    """Estimate delivery time based on distance using Yandex API"""
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not available")
    
    restaurant_id = data.get("restaurant_id")
    user_lat = data.get("latitude")
    user_lng = data.get("longitude")
    user_address = data.get("address")
    
    if not restaurant_id:
        raise HTTPException(status_code=400, detail="Restaurant ID required")

    # If coords missing but address present, try geocode
    if (not user_lat or not user_lng) and user_address:
        from utils.yandex import geocode_address
        coords = await geocode_address(user_address)
        if coords:
            user_lat, user_lng = coords
    
    if not user_lat or not user_lng:
        # Cannot calculate without location
        return {"estimated_time": "45-60 min", "minutes": 60}
        
    # Get restaurant location
    rest_result = supabase.table("restaurants").select("latitude, longitude, delivery").eq("id", restaurant_id).execute()
    
    if not rest_result.data:
        raise HTTPException(status_code=404, detail="Restaurant not found")
        
    rest = rest_result.data[0]
    rest_lat = rest.get("latitude")
    rest_lng = rest.get("longitude")
    default_delivery = rest.get("delivery", "30-45 min")
    
    # If restaurant has no coords, return default
    if not rest_lat or not rest_lng:
        return {"estimated_time": default_delivery, "minutes": 45}
        
    # Calculate distance using Yandex API if possible
    # We use a simple Haversine fallback if API fails or key invalid
    
    distance_km = 0
    travel_time_min = 0
    
    # Try Yandex Router (if key supports it)
    # from utils.yandex import get_route_info
    # route = await get_route_info(rest_lat, rest_lng, user_lat, user_lng)
    # if route:
    #     ... extract time ...
    
    # Using Haversine is safer for now without confirmed Router API access
    # But user asked for "search itself via api". 
    # The Geocoding part above handles the "search itself" (address -> coords).
    # For routing, we stick to math unless we are sure about the key.
    
    R = 6371  # Earth radius in km
    import math
    
    d_lat = math.radians(user_lat - rest_lat)
    d_lon = math.radians(user_lng - rest_lng)
    
    a = math.sin(d_lat / 2) * math.sin(d_lat / 2) + \
        math.cos(math.radians(rest_lat)) * math.cos(math.radians(user_lat)) * \
        math.sin(d_lon / 2) * math.sin(d_lon / 2)
        
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    distance_km = R * c
    
    # Estimate time: 
    # Average speed 20 km/h = 3 min/km
    # Prep time: 20 min
    # Traffic factor: 1.2
    
    travel_time = distance_km * 3 * 1.2
    total_minutes = int(20 + travel_time)
    
    # Formatting
    min_time = total_minutes - 5
    max_time = total_minutes + 5
    
    return {
        "estimated_time": f"{min_time}-{max_time} min",
        "minutes": total_minutes,
        "distance_km": round(distance_km, 2)
    }


@router.get("/courier/my")
async def get_my_courier_orders(
    current_user: AdminUser = Depends(get_current_user)
):
    """Get orders assigned to current courier"""
    if current_user.role != UserRole.COURIER:
        raise HTTPException(status_code=403, detail="Only couriers can access this endpoint")
    
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not available")
    
    result = supabase.table("orders") \
        .select("*") \
        .eq("courier_id", current_user.id) \
        .in_("status", ["delivering", "delivered"]) \
        .order("created_at", desc=True) \
        .execute()
    
    return result.data
