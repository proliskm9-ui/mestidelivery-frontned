"""
Restaurants Router - Improved Version
Restaurant management with pagination and validation
"""
from fastapi import APIRouter, Depends, HTTPException
from typing import Optional, List
import logging

from supabase_client import get_supabase
from models import AdminUser, UserRole
from schemas import RestaurantCreate, RestaurantResponse
from routers.auth import get_current_user, require_super_admin
from config import DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE

router = APIRouter(prefix="/restaurants", tags=["restaurants"])
logger = logging.getLogger(__name__)


# =============================================================================
# Public Endpoints
# =============================================================================

@router.get("/")
async def get_restaurants(
    category: Optional[str] = None,
    rating: Optional[float] = None,
    promo: Optional[bool] = None,
    limit: int = DEFAULT_PAGE_SIZE,
    offset: int = 0,
):
    """
    Get restaurants with optional filters.
    
    - **category**: Filter by category ID
    - **rating**: Minimum rating (0-5)
    - **promo**: Filter by promotional status
    - **limit**: Number of results (max 100)
    - **offset**: Pagination offset
    """
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not available")
    
    # Validate pagination
    limit = min(max(1, limit), MAX_PAGE_SIZE)
    offset = max(0, offset)
    
    query = supabase.table("restaurants").select("*")

    # Apply filters with validation
    if category and len(category) <= 50:
        query = query.eq("category_id", category)
    
    if rating is not None:
        if 0 <= rating <= 5:
            query = query.gte("rating", str(rating))
    
    if promo:
        query = query.eq("has_promo", True)

    query = query.order("rating", desc=True).range(offset, offset + limit - 1)
    
    result = query.execute()
    return result.data


@router.get("/featured", response_model=List[RestaurantResponse])
async def get_featured():
    """Get featured restaurants"""
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not available")
    
    result = supabase.table("restaurants") \
        .select("*") \
        .eq("is_featured", True) \
        .order("rating", desc=True) \
        .execute()
    
    return result.data


@router.get("/recommended", response_model=List[RestaurantResponse])
async def get_recommended():
    """Get recommended restaurants"""
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not available")
    
    result = supabase.table("restaurants") \
        .select("*") \
        .eq("is_recommended", True) \
        .order("rating", desc=True) \
        .execute()
    
    return result.data


@router.get("/search")
async def search_restaurants(
    q: str,
    limit: int = 20
):
    """Search restaurants by name"""
    if not q or len(q) < 2:
        raise HTTPException(status_code=400, detail="Search query must be at least 2 characters")
    
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not available")
    
    limit = min(max(1, limit), 50)
    
    result = supabase.table("restaurants") \
        .select("*") \
        .ilike("name", f"%{q}%") \
        .limit(limit) \
        .execute()
    
    return result.data


@router.get("/{restaurant_id}", response_model=RestaurantResponse)
async def get_restaurant(restaurant_id: str):
    """Get a single restaurant by ID"""
    if not restaurant_id:
        raise HTTPException(status_code=400, detail="Invalid restaurant ID")
    
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not available")
    
    result = supabase.table("restaurants").select("*").eq("id", restaurant_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
    return result.data[0]


@router.get("/{restaurant_id}/stats")
async def get_restaurant_stats(restaurant_id: str):
    """Get restaurant statistics (for public display)"""
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not available")
    
    # Check restaurant exists
    rest = supabase.table("restaurants").select("id, name").eq("id", restaurant_id).execute()
    if not rest.data:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
    # Count products
    products = supabase.table("products").select("id").eq("restaurant_id", restaurant_id).execute()
    
    # Count categories
    categories = supabase.table("products").select("category").eq("restaurant_id", restaurant_id).execute()
    unique_categories = list(set(p['category'] for p in categories.data if p.get('category')))
    
    return {
        "restaurant_id": restaurant_id,
        "restaurant_name": rest.data[0]['name'],
        "total_products": len(products.data),
        "total_categories": len(unique_categories),
        "categories": unique_categories
    }


@router.get("/admin", response_model=List[RestaurantResponse])
async def list_restaurants_admin(current_user: AdminUser = Depends(get_current_user)):
    """List all restaurants for admin selection (admin only)"""
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not available")
    
    result = supabase.table("restaurants").select("*").order("name").execute()
    return result.data


# =============================================================================
# Admin Endpoints
# =============================================================================

@router.post("/", response_model=dict)
async def create_restaurant(
    data: RestaurantCreate,
    current_user: AdminUser = Depends(require_super_admin)
):
    """Create a new restaurant (super admin only)"""
    if not data.id or not data.name:
        raise HTTPException(status_code=400, detail="ID and name are required")
    
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not available")
    
    # Check if restaurant ID exists
    check = supabase.table("restaurants").select("id").eq("id", data.id).execute()
    if check.data:
        raise HTTPException(status_code=400, detail="Restaurant ID already exists")
    
    # Geocode address if coordinates are missing but address is present
    if (not data.latitude or not data.longitude) and data.address:
        from utils.yandex import geocode_address
        coords = await geocode_address(data.address)
        if coords:
            data.latitude = coords[0]
            data.longitude = coords[1]
            logger.info(f"Geocoded '{data.address}' to {coords}")

    # Exclude fields that might not exist in the database table schema
    dump_data = data.model_dump(exclude={
        "category_id", "has_promo", "is_featured", "is_recommended", "screen", "min_order"
    })
    
    result = supabase.table("restaurants").insert(dump_data).execute()
    
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create restaurant")
    
    logger.info(f"Restaurant created: {data.id} by {current_user.username}")
    return {"success": True, "id": data.id}


@router.put("/{restaurant_id}", response_model=dict)
async def update_restaurant(
    restaurant_id: str,
    data: RestaurantCreate,
    current_user: AdminUser = Depends(get_current_user)
):
    """Update a restaurant"""
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not available")
    
    # Check restaurant exists
    check = supabase.table("restaurants").select("id").eq("id", restaurant_id).execute()
    if not check.data:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
    # Restaurant admin can only update their own restaurant
    if current_user.role == UserRole.RESTAURANT_ADMIN:
        if current_user.restaurant_id != restaurant_id:
            raise HTTPException(status_code=403, detail="Access denied")
            
    # Geocode address if coordinates are missing/zero but address is present
    # OR if address changed and coordinates weren't manually updated (hard to track diff here easily without fetch)
    # Strategy: If provided lat/lon is None/0, try geocode
    if (not data.latitude or not data.longitude) and data.address:
        from utils.yandex import geocode_address
        coords = await geocode_address(data.address)
        if coords:
            data.latitude = coords[0]
            data.longitude = coords[1]
            logger.info(f"Geocoded '{data.address}' to {coords}")
    
    # Update (exclude id and potential missing columns)
    update_data = data.model_dump(exclude={
        "id", "category_id", "has_promo", "is_featured", "is_recommended", "screen", "min_order"
    })
    supabase.table("restaurants").update(update_data).eq("id", restaurant_id).execute()
    
    logger.info(f"Restaurant updated: {restaurant_id} by {current_user.username}")
    return {"success": True}


@router.delete("/{restaurant_id}")
async def delete_restaurant(
    restaurant_id: str,
    delete_products: bool = False,
    current_user: AdminUser = Depends(require_super_admin)
):
    """
    Delete a restaurant (super admin only).
    
    - **delete_products**: If true, also delete all products for this restaurant
    """
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not available")
    
    # Check restaurant exists
    check = supabase.table("restaurants").select("id").eq("id", restaurant_id).execute()
    if not check.data:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
    # Check for products
    products = supabase.table("products").select("id").eq("restaurant_id", restaurant_id).limit(1).execute()
    
    if products.data and not delete_products:
        raise HTTPException(
            status_code=400, 
            detail="Restaurant has products. Set delete_products=true to delete them too."
        )
    
    # Delete products if requested
    if delete_products:
        supabase.table("products").delete().eq("restaurant_id", restaurant_id).execute()
        logger.info(f"Deleted products for restaurant: {restaurant_id}")
    
    # Delete restaurant
    supabase.table("restaurants").delete().eq("id", restaurant_id).execute()
    
    logger.info(f"Restaurant deleted: {restaurant_id} by {current_user.username}")
    return {"success": True}


# =============================================================================
# Management Endpoints
# =============================================================================

@router.patch("/{restaurant_id}/feature")
async def toggle_featured(
    restaurant_id: str,
    current_user: AdminUser = Depends(require_super_admin)
):
    """Toggle restaurant featured status (super admin only)"""
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not available")
    
    check = supabase.table("restaurants").select("id, is_featured").eq("id", restaurant_id).execute()
    if not check.data:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
    current = check.data[0].get('is_featured', False)
    
    supabase.table("restaurants").update({"is_featured": not current}).eq("id", restaurant_id).execute()
    
    logger.info(f"Restaurant {restaurant_id} featured status: {not current} by {current_user.username}")
    return {"success": True, "is_featured": not current}


@router.patch("/{restaurant_id}/recommend")
async def toggle_recommended(
    restaurant_id: str,
    current_user: AdminUser = Depends(require_super_admin)
):
    """Toggle restaurant recommended status (super admin only)"""
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not available")
    
    check = supabase.table("restaurants").select("id, is_recommended").eq("id", restaurant_id).execute()
    if not check.data:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
    current = check.data[0].get('is_recommended', False)
    
    supabase.table("restaurants").update({"is_recommended": not current}).eq("id", restaurant_id).execute()
    
    logger.info(f"Restaurant {restaurant_id} recommended status: {not current} by {current_user.username}")
    return {"success": True, "is_recommended": not current}
