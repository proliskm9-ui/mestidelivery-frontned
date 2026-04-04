"""
Courier API Router - Supabase API Version
GPS tracking, order assignment, push notifications
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import math
import json
import logging

from supabase_client import get_supabase
from models import AdminUser, UserRole
from routers.auth import get_current_user

router = APIRouter(prefix="/courier", tags=["Courier"])
logger = logging.getLogger(__name__)


# =============================================================================
# Schemas
# =============================================================================

class LocationUpdate(BaseModel):
    latitude: float
    longitude: float
    heading: Optional[float] = None
    speed: Optional[float] = None


class CourierStatusUpdate(BaseModel):
    is_online: bool


class PushTokenUpdate(BaseModel):
    push_token: str


class OrderConfirmation(BaseModel):
    order_id: int
    confirmed_by: str  # "restaurant" or "courier"


class CourierLocationResponse(BaseModel):
    courier_id: int
    latitude: float
    longitude: float
    heading: Optional[float] = None
    speed: Optional[float] = None
    updated_at: Optional[datetime] = None


class AvailableOrder(BaseModel):
    id: int
    restaurant_id: str
    restaurant_name: str
    address: str
    total: float
    tips: float
    distance_km: float
    items_count: int
    created_at: Optional[datetime] = None


# =============================================================================
# Helper Functions
# =============================================================================

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two GPS points in kilometers"""
    R = 6371  # Earth radius in km
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    a = math.sin(delta_lat / 2) ** 2 + \
        math.cos(lat1_rad) * math.cos(lat2_rad) * \
        math.sin(delta_lon / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    return R * c


def require_courier(user: AdminUser = Depends(get_current_user)) -> AdminUser:
    """Dependency that requires the user to be a courier"""
    if user.role != UserRole.COURIER:
        raise HTTPException(status_code=403, detail="Courier access required")
    return user


def require_courier_or_admin(user: AdminUser = Depends(get_current_user)) -> AdminUser:
    """Dependency that requires the user to be a courier or admin"""
    if user.role not in [UserRole.COURIER, UserRole.SUPER_ADMIN]:
        raise HTTPException(status_code=403, detail="Courier or admin access required")
    return user


# =============================================================================
# Location Endpoints
# =============================================================================

@router.post("/location")
async def update_courier_location(
    location: LocationUpdate,
    current_user: AdminUser = Depends(require_courier)
):
    """Update courier's GPS location (called frequently from courier app)"""
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not available")
    
    courier_id = current_user.id
    location_data = {
        "courier_id": courier_id,
        "latitude": location.latitude,
        "longitude": location.longitude,
        "heading": location.heading,
        "speed": location.speed,
        "updated_at": datetime.utcnow().isoformat()
    }
    
    try:
        existing = supabase.table("courier_locations").select("id").eq("courier_id", courier_id).execute()
        if existing.data:
            supabase.table("courier_locations").update(location_data).eq("courier_id", courier_id).execute()
        else:
            supabase.table("courier_locations").insert(location_data).execute()
            
        # --- WebSocket Broadcast ---
        # Find active orders for this courier
        from websockets_manager import manager
        
        active_orders = supabase.table("orders").select("id").eq("courier_id", courier_id).eq("status", "delivering").execute()
        
        if active_orders.data:
            for order in active_orders.data:
                await manager.broadcast(order['id'], {
                    "type": "location_update",
                    "latitude": location.latitude,
                    "longitude": location.longitude,
                    "heading": location.heading,
                    "speed": location.speed,
                    "updated_at": location_data["updated_at"]
                })
                
    except Exception as e:
        logger.warning(f"Error updating location or broadcasting: {e}")
        # Don't fail the request if WS fails, just log it
        return {"success": False, "message": "Location update partial failure"}
    
    return {"success": True}


@router.get("/location/{courier_id}")
async def get_courier_location(courier_id: int):
    """Get courier's current location (for client order tracking)"""
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not available")
    
    try:
        result = supabase.table("courier_locations").select("*").eq("courier_id", courier_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Courier location not found")
        loc = result.data[0]
        return {
            "courier_id": loc['courier_id'],
            "latitude": loc['latitude'],
            "longitude": loc['longitude'],
            "heading": loc.get('heading'),
            "speed": loc.get('speed'),
            "updated_at": loc.get('updated_at')
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.warning(f"courier_locations table not available: {e}")
        raise HTTPException(status_code=404, detail="Location tracking not available")


@router.get("/order/{order_id}/location")
async def get_order_courier_location(order_id: int):
    """Get courier location for a specific order (client tracking)"""
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not available")
    
    order_result = supabase.table("orders").select("courier_id").eq("id", order_id).execute()
    if not order_result.data:
        raise HTTPException(status_code=404, detail="Order not found")
    
    courier_id = order_result.data[0].get('courier_id')
    if not courier_id:
        return {"courier_assigned": False, "location": None}
    
    try:
        loc_result = supabase.table("courier_locations").select("*").eq("courier_id", courier_id).execute()
        if not loc_result.data:
            return {"courier_assigned": True, "location": None}
        loc = loc_result.data[0]
        return {
            "courier_assigned": True,
            "location": {
                "latitude": loc['latitude'],
                "longitude": loc['longitude'],
                "heading": loc.get('heading'),
                "speed": loc.get('speed'),
                "updated_at": loc.get('updated_at')
            }
        }
    except Exception as e:
        logger.warning(f"courier_locations table not available: {e}")
        return {"courier_assigned": True, "location": None}


# =============================================================================
# Status Endpoints
# =============================================================================

@router.post("/status")
async def update_courier_status(
    status: CourierStatusUpdate,
    current_user: AdminUser = Depends(require_courier)
):
    """Update courier online/offline status"""
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not available")
    
    supabase.table("admin_users").update({"is_online": status.is_online}).eq("id", current_user.id).execute()
    
    logger.info(f"Courier {current_user.username} is now {'online' if status.is_online else 'offline'}")
    return {"success": True, "is_online": status.is_online}


@router.post("/push-token")
async def update_push_token(
    data: PushTokenUpdate,
    current_user: AdminUser = Depends(require_courier)
):
    """Update courier's push notification token"""
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not available")
    
    supabase.table("admin_users").update({"push_token": data.push_token}).eq("id", current_user.id).execute()
    
    return {"success": True}


# =============================================================================
# Order Management Endpoints
# =============================================================================

@router.get("/available-orders")
async def get_available_orders(
    max_distance_km: float = 50.0,
    current_user: AdminUser = Depends(require_courier)
) -> List[AvailableOrder]:
    """Get available orders near courier's location"""
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not available")
    
    courier_id = current_user.id
    courier_lat, courier_lng = None, None
    
    # Try to get courier location (table may not exist)
    try:
        loc_result = supabase.table("courier_locations").select("*").eq("courier_id", courier_id).execute()
        if loc_result.data:
            courier_lat = loc_result.data[0]['latitude']
            courier_lng = loc_result.data[0]['longitude']
    except Exception as e:
        logger.warning(f"courier_locations not available: {e}")
    
    # Get orders that are ready for delivery (status = ready, no courier assigned)
    orders_result = supabase.table("orders").select("*").eq("status", "ready").is_("courier_id", "null").execute()
    
    # Get all restaurants for name lookup
    restaurants_result = supabase.table("restaurants").select("id, name").execute()
    restaurants_map = {r['id']: r['name'] for r in restaurants_result.data}
    
    available = []
    for order in orders_result.data:
        distance = 2.0  # default
        if courier_lat and courier_lng and order.get('delivery_lat') and order.get('delivery_lng'):
            distance = haversine_distance(
                courier_lat, courier_lng,
                order['delivery_lat'], order['delivery_lng']
            )
        
        # Parse items to get count
        items_data = order.get('items', '[]')
        if isinstance(items_data, str):
            try:
                items = json.loads(items_data)
            except json.JSONDecodeError:
                items = []
        else:
            items = items_data if items_data else []
        
        available.append(AvailableOrder(
            id=order['id'],
            restaurant_id=order['restaurant_id'],
            restaurant_name=restaurants_map.get(order['restaurant_id'], "Unknown"),
            address=order.get('address', ''),
            total=order.get('total', 0),
            tips=order.get('tips', 0),
            distance_km=round(distance, 2),
            items_count=len(items),
            created_at=order.get('created_at')
        ))
    
    # Sort by distance (nearest first), fallback by created_at
    available.sort(key=lambda x: (x.distance_km, x.created_at or ''))
    
    return available


@router.post("/take-order/{order_id}")
async def take_order(
    order_id: int,
    current_user: AdminUser = Depends(require_courier)
):
    """Courier takes an order for delivery"""
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not available")
    
    if not current_user.is_online:
        raise HTTPException(status_code=400, detail="You must be online to take orders")
    
    # Get order
    order_result = supabase.table("orders").select("*").eq("id", order_id).execute()
    
    if not order_result.data:
        raise HTTPException(status_code=404, detail="Order not found")
    
    order = order_result.data[0]
    
    if order.get('status') != "ready":
        raise HTTPException(status_code=400, detail="Order is not ready for delivery")
    
    if order.get('courier_id'):
        raise HTTPException(status_code=400, detail="Order already taken by another courier")
    
    # Assign courier to order
    update_data = {
        "courier_id": current_user.id,
        "courier_taken_at": datetime.utcnow().isoformat(),
        "status": "delivering"
    }
    
    supabase.table("orders").update(update_data).eq("id", order_id).execute()
    
    try:
        from websockets_manager import manager
        await manager.broadcast(order_id, {"type": "status_update", "status": "delivering"})
    except Exception as e:
        logger.error(f"Failed to broadcast status update: {e}")
    
    # Notify via Telegram
    try:
        from services.telegram_notify import notify_status_change
        await notify_status_change(order_id, "delivering", order.get('phone'))
    except Exception as e:
        logger.error(f"Failed to send notification: {e}")
    
    logger.info(f"Order {order_id} taken by courier {current_user.username}")
    return {"success": True, "message": "Order assigned successfully"}


@router.post("/confirm-handover")
async def confirm_handover(
    data: OrderConfirmation,
    current_user: AdminUser = Depends(get_current_user)
):
    """
    Confirm order handover from restaurant to courier.
    Both restaurant admin and courier must confirm.
    """
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not available")
    
    # Validate confirmation type
    if data.confirmed_by not in ["restaurant", "courier"]:
        raise HTTPException(status_code=400, detail="Invalid confirmation type")
    
    # Validate permissions
    if data.confirmed_by == "courier" and current_user.role != UserRole.COURIER:
        raise HTTPException(status_code=403, detail="Only couriers can confirm as courier")
    
    if data.confirmed_by == "restaurant" and current_user.role not in [UserRole.RESTAURANT_ADMIN, UserRole.SUPER_ADMIN]:
        raise HTTPException(status_code=403, detail="Only restaurant admins can confirm as restaurant")
    
    # Get order
    order_result = supabase.table("orders").select("*").eq("id", data.order_id).execute()
    
    if not order_result.data:
        raise HTTPException(status_code=404, detail="Order not found")
    
    order = order_result.data[0]
    
    # Check restaurant admin permission
    if data.confirmed_by == "restaurant" and current_user.role == UserRole.RESTAURANT_ADMIN:
        if order.get('restaurant_id') != current_user.restaurant_id:
            raise HTTPException(status_code=403, detail="You can only confirm orders for your restaurant")
    
    # Check courier permission
    if data.confirmed_by == "courier":
        if order.get('courier_id') != current_user.id:
            raise HTTPException(status_code=403, detail="This order is not assigned to you")
    
    # Update confirmation status
    now = datetime.utcnow().isoformat()
    update_data = {}
    
    if data.confirmed_by == "restaurant":
        update_data["restaurant_confirmed"] = True
        update_data["restaurant_confirmed_at"] = now
    else:
        update_data["courier_confirmed"] = True
        update_data["courier_confirmed_at"] = now
    
    # Check if both confirmed after this update
    will_be_restaurant_confirmed = update_data.get("restaurant_confirmed", order.get('restaurant_confirmed', False))
    will_be_courier_confirmed = update_data.get("courier_confirmed", order.get('courier_confirmed', False))
    
    if will_be_restaurant_confirmed and will_be_courier_confirmed:
        update_data["status"] = "delivering"
    
    supabase.table("orders").update(update_data).eq("id", data.order_id).execute()

    if update_data.get("status"):
        try:
            from websockets_manager import manager
            await manager.broadcast(data.order_id, {"type": "status_update", "status": update_data["status"]})
        except Exception as e:
            logger.error(f"Failed to broadcast status update: {e}")
    
    logger.info(f"Order {data.order_id} handover confirmed by {data.confirmed_by} ({current_user.username})")
    
    # Get updated order
    updated = supabase.table("orders").select("restaurant_confirmed, courier_confirmed, status").eq("id", data.order_id).execute()
    
    if updated.data:
        return {
            "success": True,
            "restaurant_confirmed": updated.data[0].get('restaurant_confirmed', False),
            "courier_confirmed": updated.data[0].get('courier_confirmed', False),
            "status": updated.data[0].get('status')
        }
    
    return {"success": True}


@router.post("/complete-delivery/{order_id}")
async def complete_delivery(
    order_id: int,
    current_user: AdminUser = Depends(require_courier)
):
    """Mark order as delivered"""
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not available")
    
    # Get order
    order_result = supabase.table("orders").select("*").eq("id", order_id).execute()
    
    if not order_result.data:
        raise HTTPException(status_code=404, detail="Order not found")
    
    order = order_result.data[0]
    
    if order.get('courier_id') != current_user.id:
        raise HTTPException(status_code=403, detail="This order is not assigned to you")
    
    if order.get('status') != "delivering":
        raise HTTPException(status_code=400, detail="Order is not in delivering status")
    
    # Update status
    supabase.table("orders").update({"status": "delivered"}).eq("id", order_id).execute()

    try:
        from websockets_manager import manager
        await manager.broadcast(order_id, {"type": "status_update", "status": "delivered"})
    except Exception as e:
        logger.error(f"Failed to broadcast status update: {e}")
    
    # Notify via Telegram
    try:
        from services.telegram_notify import notify_status_change
        await notify_status_change(order_id, "delivered", order.get('phone'))
    except Exception as e:
        logger.error(f"Failed to send notification: {e}")
    
    logger.info(f"Order {order_id} delivered by courier {current_user.username}")
    return {"success": True, "message": "Order delivered successfully"}


# =============================================================================
# Admin Endpoints
# =============================================================================

@router.get("/online-couriers")
async def get_online_couriers(
    current_user: AdminUser = Depends(get_current_user)
):
    """Get list of online couriers with their locations (for admin dashboard)"""
    # Only admins can see all couriers
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.RESTAURANT_ADMIN]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not available")
    
    # Get online couriers
    couriers_result = supabase.table("admin_users").select("*").eq("role", "courier").eq("is_online", True).execute()
    
    if not couriers_result.data:
        return []
    
    # Get their locations (table may not exist yet)
    courier_ids = [c['id'] for c in couriers_result.data]
    locations_map = {}
    try:
        locations_result = supabase.table("courier_locations").select("*").in_("courier_id", courier_ids).execute()
        locations_map = {loc['courier_id']: loc for loc in locations_result.data}
    except Exception as e:
        logger.warning(f"courier_locations not available: {e}")
    
    result = []
    for courier in couriers_result.data:
        location = locations_map.get(courier['id'])
        result.append({
            "id": courier['id'],
            "username": courier['username'],
            "is_online": courier['is_online'],
            "location": {
                "latitude": location['latitude'],
                "longitude": location['longitude'],
                "heading": location.get('heading'),
                "speed": location.get('speed'),
                "updated_at": location.get('updated_at')
            } if location else None
        })
    
    return result


@router.get("/my-orders")
async def get_my_orders(
    status: Optional[str] = None,
    current_user: AdminUser = Depends(require_courier)
) -> List[dict]:
    """Get orders assigned to current courier"""
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not available")
    
    query = supabase.table("orders").select("*").eq("courier_id", current_user.id)
    
    if status:
        query = query.eq("status", status)
    else:
        # Default: show active orders (delivering) and recent delivered
        query = query.in_("status", ["delivering", "delivered"])
    
    query = query.order("created_at", desc=True).limit(50)
    
    result = query.execute()
    return result.data


@router.get("/stats")
async def get_courier_stats(
    current_user: AdminUser = Depends(require_courier)
):
    """Get courier statistics"""
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not available")
    
    # Get all delivered orders for this courier
    delivered = supabase.table("orders").select("total, tips").eq("courier_id", current_user.id).eq("status", "delivered").execute()
    
    total_deliveries = len(delivered.data)
    total_earnings = sum(order.get('tips', 0) for order in delivered.data)
    total_order_value = sum(order.get('total', 0) for order in delivered.data)
    
    # Get active orders count
    active = supabase.table("orders").select("id").eq("courier_id", current_user.id).eq("status", "delivering").execute()
    
    return {
        "total_deliveries": total_deliveries,
        "total_tips_earned": round(total_earnings, 2),
        "total_order_value": round(total_order_value, 2),
        "active_orders": len(active.data),
        "is_online": current_user.is_online
    }


# =============================================================================
# Auto-Assignment Logic
# =============================================================================

async def find_best_courier(supabase, restaurant_id: str) -> Optional[dict]:
    """
    Find the best available courier for an order.
    Priority: closest to the restaurant, then by time if few couriers.
    """
    # Get restaurant coordinates (if available)
    rest_result = supabase.table("restaurants").select("id, name, latitude, longitude").eq("id", restaurant_id).execute()
    rest_lat, rest_lng = None, None
    if rest_result.data and rest_result.data[0].get("latitude"):
        rest_lat = rest_result.data[0]["latitude"]
        rest_lng = rest_result.data[0]["longitude"]
    
    # Get online couriers not currently delivering
    couriers = supabase.table("admin_users").select("id, username, is_online").eq("role", "courier").eq("is_online", True).execute()
    
    if not couriers.data:
        return None
    
    courier_ids = [c["id"] for c in couriers.data]
    
    # Filter out couriers that already have active deliveries
    active_deliveries = supabase.table("orders").select("courier_id").eq("status", "delivering").in_("courier_id", courier_ids).execute()
    busy_ids = set(o["courier_id"] for o in active_deliveries.data if o.get("courier_id"))
    available_couriers = [c for c in couriers.data if c["id"] not in busy_ids]
    
    if not available_couriers:
        # All couriers busy — allow multi-order, just sort by distance
        available_couriers = couriers.data
    
    if not available_couriers:
        return None
    
    # Get locations for available couriers
    avail_ids = [c["id"] for c in available_couriers]
    loc_map = {}
    try:
        locs = supabase.table("courier_locations").select("*").in_("courier_id", avail_ids).execute()
        loc_map = {l["courier_id"]: l for l in locs.data}
    except Exception as e:
        logger.warning(f"courier_locations not available in find_best_courier: {e}")
    
    # Score couriers: closest to restaurant wins
    scored = []
    for courier in available_couriers:
        loc = loc_map.get(courier["id"])
        if loc and rest_lat and rest_lng:
            dist = haversine_distance(loc["latitude"], loc["longitude"], rest_lat, rest_lng)
        else:
            dist = 999  # No location data, treat as far
        
        scored.append({"courier": courier, "distance": dist, "location": loc})
    
    if not scored:
        # No scored couriers at all, just return first available
        return available_couriers[0] if available_couriers else None
    
    # Sort by distance (nearest first)
    scored.sort(key=lambda x: x["distance"])
    
    return scored[0]["courier"]


@router.post("/auto-assign/{order_id}")
async def auto_assign_courier(
    order_id: int,
    current_user: AdminUser = Depends(get_current_user)
):
    """Auto-assign the best available courier to an order (called when order is ready)"""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.RESTAURANT_ADMIN]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not available")
    
    # Get the order
    order_result = supabase.table("orders").select("*").eq("id", order_id).execute()
    if not order_result.data:
        raise HTTPException(status_code=404, detail="Order not found")
    
    order = order_result.data[0]
    
    if order.get("courier_id"):
        return {"success": True, "message": "Courier already assigned", "courier_id": order["courier_id"]}
    
    if order["status"] != "ready":
        raise HTTPException(status_code=400, detail="Order must be in 'ready' status for courier assignment")
    
    # Find best courier
    best = await find_best_courier(supabase, order["restaurant_id"])
    
    if not best:
        return {"success": False, "message": "No available couriers online"}
    
    # Assign courier
    supabase.table("orders").update({
        "courier_id": best["id"],
        "courier_taken_at": datetime.utcnow().isoformat(),
        "status": "delivering"
    }).eq("id", order_id).execute()

    try:
        from websockets_manager import manager
        await manager.broadcast(order_id, {"type": "status_update", "status": "delivering", "courier_id": best["id"]})
    except Exception as e:
        logger.error(f"Failed to broadcast status update: {e}")
    
    logger.info(f"Order {order_id} auto-assigned to courier {best['username']}")
    
    return {"success": True, "message": f"Assigned to {best['username']}", "courier_id": best["id"]}
