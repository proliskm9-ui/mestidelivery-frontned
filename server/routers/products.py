"""
Products Router - Improved Version
Product management with pagination and better error handling
"""
from fastapi import APIRouter, Depends, HTTPException
from typing import Optional, List
import logging

from supabase_client import get_supabase
from models import AdminUser, UserRole
from schemas import ProductCreate, ProductResponse
from routers.auth import get_current_user
from config import DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE

router = APIRouter(prefix="/products", tags=["products"])
logger = logging.getLogger(__name__)


# =============================================================================
# Public Endpoints
# =============================================================================

@router.get("/")
async def get_products_public(
    restaurant_id: Optional[str] = None,
    category: Optional[str] = None,
    limit: int = DEFAULT_PAGE_SIZE,
    offset: int = 0
):
    """
    Get products (public endpoint).
    
    - **restaurant_id**: Filter by restaurant
    - **category**: Filter by product category
    - **limit**: Number of results (max 100)
    - **offset**: Pagination offset
    """
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not available")
    
    # Validate pagination
    limit = min(max(1, limit), MAX_PAGE_SIZE)
    offset = max(0, offset)
    
    query = supabase.table("products").select("*")
    
    if restaurant_id:
        query = query.eq("restaurant_id", restaurant_id)
    
    if category:
        query = query.eq("category", category)
    
    query = query.range(offset, offset + limit - 1)
    
    response = query.execute()
    return response.data


@router.get("/search")
async def search_products(
    q: str,
    restaurant_id: Optional[str] = None,
    limit: int = 20
):
    """
    Search products by name or description.
    
    - **q**: Search query
    - **restaurant_id**: Optional restaurant filter
    - **limit**: Number of results
    """
    if not q or len(q) < 2:
        raise HTTPException(status_code=400, detail="Search query must be at least 2 characters")
    
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not available")
    
    limit = min(max(1, limit), 50)
    
    # Supabase full-text search using ilike
    query = supabase.table("products").select("*")
    
    if restaurant_id:
        query = query.eq("restaurant_id", restaurant_id)
    
    # Search in name (case-insensitive)
    query = query.ilike("name", f"%{q}%")
    query = query.limit(limit)
    
    response = query.execute()
    return response.data


@router.get("/categories/{restaurant_id}")
async def get_product_categories(restaurant_id: str):
    """Get all unique product categories for a restaurant"""
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not available")
    
    response = supabase.table("products") \
        .select("category") \
        .eq("restaurant_id", restaurant_id) \
        .execute()
    
    # Get unique categories
    categories = list(set(
        p['category'] for p in response.data 
        if p.get('category')
    ))
    categories.sort()
    
    return {"categories": categories}


# =============================================================================
# Admin Endpoints
# =============================================================================

@router.get("/admin")
async def get_products_admin(
    restaurant_id: Optional[str] = None,
    category: Optional[str] = None,
    limit: int = DEFAULT_PAGE_SIZE,
    offset: int = 0,
    current_user: AdminUser = Depends(get_current_user)
):
    """Get products (admin view with restaurant filtering)"""
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not available")
    
    # Validate pagination
    limit = min(max(1, limit), MAX_PAGE_SIZE)
    offset = max(0, offset)
    
    query = supabase.table("products").select("*")
    
    # Restaurant admin can only see their products
    if current_user.role == UserRole.RESTAURANT_ADMIN:
        query = query.eq("restaurant_id", current_user.restaurant_id)
    elif restaurant_id:
        query = query.eq("restaurant_id", restaurant_id)
    
    if category:
        query = query.eq("category", category)
    
    query = query.range(offset, offset + limit - 1)
    
    try:
        response = query.execute()
        return response.data
    except Exception as e:
        logger.error(f"Error fetching products for admin: {e}")
        # Try without range if it failed (some older supabase versions had issues with range)
        try:
            response = query.execute()
            return response.data
        except:
             raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(product_id: str):
    """Get a single product by ID"""
    if not product_id:
        raise HTTPException(status_code=400, detail="Invalid product ID")
    
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not available")
    
    result = supabase.table("products").select("*").eq("id", product_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return result.data[0]


@router.post("/", response_model=dict)
async def create_product(
    data: ProductCreate,
    current_user: AdminUser = Depends(get_current_user)
):
    """Create a new product"""
    # Check permissions
    if current_user.role == UserRole.RESTAURANT_ADMIN:
        if data.restaurant_id != current_user.restaurant_id:
            raise HTTPException(
                status_code=403, 
                detail="Can only create products for your restaurant"
            )
    
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not available")
    
    try:
        # Verify restaurant exists
        rest_check = supabase.table("restaurants").select("id").eq("id", data.restaurant_id).execute()
        if not rest_check.data:
            raise HTTPException(status_code=400, detail="Restaurant not found")
        
        # Check if product ID already exists
        check = supabase.table("products").select("id").eq("id", data.id).execute()
        if check.data:
            raise HTTPException(status_code=400, detail="Product ID already exists")
        
        # Create product
        result = supabase.table("products").insert(data.model_dump()).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to create product - no data returned")
            
        logger.info(f"Product created: {data.id} for restaurant {data.restaurant_id} by {current_user.username}")
        return {"success": True, "id": data.id}
    except Exception as e:
        logger.error(f"Error creating product: {str(e)}")
        if "categories" in str(e) or "restaurants" in str(e) or "products" in str(e):
            raise HTTPException(status_code=500, detail=f"Database table missing: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.put("/{product_id}", response_model=dict)
async def update_product(
    product_id: str,
    data: ProductCreate,
    current_user: AdminUser = Depends(get_current_user)
):
    """Update an existing product"""
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not available")
    
    # Get existing product
    check = supabase.table("products").select("*").eq("id", product_id).execute()
    if not check.data:
        raise HTTPException(status_code=404, detail="Product not found")
    
    existing = check.data[0]
    
    # Check permissions
    if current_user.role == UserRole.RESTAURANT_ADMIN:
        if existing.get('restaurant_id') != current_user.restaurant_id:
            raise HTTPException(status_code=403, detail="Access denied")
        # Restaurant admin can't change restaurant_id
        if data.restaurant_id != current_user.restaurant_id:
            raise HTTPException(
                status_code=403, 
                detail="Can only update products for your restaurant"
            )
    
    # Update (exclude id as it shouldn't change)
    update_data = data.model_dump(exclude={"id"})
    supabase.table("products").update(update_data).eq("id", product_id).execute()
    
    logger.info(f"Product updated: {product_id} by {current_user.username}")
    return {"success": True}


@router.delete("/{product_id}")
async def delete_product(
    product_id: str,
    current_user: AdminUser = Depends(get_current_user)
):
    """Delete a product"""
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not available")
    
    # Check product exists and get restaurant_id
    check = supabase.table("products").select("*").eq("id", product_id).execute()
    
    if not check.data:
        # Already deleted or doesn't exist
        return {"success": True}
    
    existing = check.data[0]
    
    # Check permissions
    if current_user.role == UserRole.RESTAURANT_ADMIN:
        if existing.get('restaurant_id') != current_user.restaurant_id:
            raise HTTPException(status_code=403, detail="Access denied")
    
    supabase.table("products").delete().eq("id", product_id).execute()
    
    logger.info(f"Product deleted: {product_id} by {current_user.username}")
    return {"success": True}


@router.delete("/")
async def delete_all_products(
    restaurant_id: Optional[str] = None,
    current_user: AdminUser = Depends(get_current_user)
):
    """
    Delete all products (with optional restaurant filter).
    
    - Super admin can delete all products or filter by restaurant
    - Restaurant admin can only delete their own products
    """
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not available")
    
    target = ""
    
    if current_user.role == UserRole.RESTAURANT_ADMIN:
        # Restaurant admin can only delete their products
        query = supabase.table("products").delete().eq("restaurant_id", current_user.restaurant_id)
        target = f"for restaurant {current_user.restaurant_id}"
    elif restaurant_id:
        # Super admin deleting for specific restaurant
        query = supabase.table("products").delete().eq("restaurant_id", restaurant_id)
        target = f"for restaurant {restaurant_id}"
    else:
        # Super admin deleting ALL products (dangerous!)
        if current_user.role != UserRole.SUPER_ADMIN:
            raise HTTPException(status_code=403, detail="Only super admin can delete all products")
        
        # Supabase requires a filter for delete, use a trick
        query = supabase.table("products").delete().neq("id", "__impossible_id__")
        target = "ALL products"
    
    query.execute()
    
    logger.warning(f"Bulk delete: {target} by {current_user.username}")
    return {"success": True, "deleted": target}


# =============================================================================
# Bulk Operations
# =============================================================================

@router.post("/bulk")
async def bulk_create_products(
    products: List[ProductCreate],
    current_user: AdminUser = Depends(get_current_user)
):
    """
    Create multiple products at once.
    
    - Max 50 products per request
    - All products must be for the same restaurant (for restaurant admins)
    """
    if len(products) > 50:
        raise HTTPException(status_code=400, detail="Maximum 50 products per request")
    
    if len(products) == 0:
        return {"success": True, "created": 0}
    
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not available")
    
    # Check permissions for restaurant admin
    if current_user.role == UserRole.RESTAURANT_ADMIN:
        for product in products:
            if product.restaurant_id != current_user.restaurant_id:
                raise HTTPException(
                    status_code=403, 
                    detail="Can only create products for your restaurant"
                )
    
    # Prepare data
    products_data = [p.model_dump() for p in products]
    
    # Check for duplicate IDs
    ids = [p['id'] for p in products_data]
    if len(ids) != len(set(ids)):
        raise HTTPException(status_code=400, detail="Duplicate product IDs in request")
    
    # Check existing IDs in database
    existing = supabase.table("products").select("id").in_("id", ids).execute()
    if existing.data:
        existing_ids = [p['id'] for p in existing.data]
        raise HTTPException(
            status_code=400, 
            detail=f"Product IDs already exist: {existing_ids}"
        )
    
    # Bulk insert
    result = supabase.table("products").insert(products_data).execute()
    
    logger.info(f"Bulk created {len(products_data)} products by {current_user.username}")
    return {"success": True, "created": len(result.data)}
