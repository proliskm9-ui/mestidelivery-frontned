"""
Categories Router - Improved Version
Category management with validation
"""
from fastapi import APIRouter, Depends, HTTPException
from typing import List
import logging

from supabase_client import get_supabase
from schemas import CategoryCreate, CategoryResponse
from routers.auth import require_super_admin, get_current_user
from models import AdminUser

router = APIRouter(prefix="/categories", tags=["categories"])
logger = logging.getLogger(__name__)


@router.get("/", response_model=List[CategoryResponse])
async def get_categories():
    """Get all categories ordered by sort_order"""
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not available")
    
    result = supabase.table("categories").select("*").order("sort_order").execute()
    return result.data


@router.get("/{category_id}", response_model=CategoryResponse)
async def get_category(category_id: str):
    """Get a single category by ID"""
    if not category_id:
        raise HTTPException(status_code=400, detail="Invalid category ID")
    
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not available")
    
    result = supabase.table("categories").select("*").eq("id", category_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Category not found")
    
    return result.data[0]


@router.get("/{category_id}/restaurants")
async def get_category_restaurants(category_id: str):
    """Get all restaurants in a category"""
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not available")
    
    # Check category exists
    cat = supabase.table("categories").select("id, name").eq("id", category_id).execute()
    if not cat.data:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Get restaurants
    restaurants = supabase.table("restaurants") \
        .select("*") \
        .eq("category_id", category_id) \
        .order("rating", desc=True) \
        .execute()
    
    return {
        "category": cat.data[0],
        "restaurants": restaurants.data,
        "count": len(restaurants.data)
    }


@router.post("/", response_model=dict)
async def create_category(
    data: CategoryCreate,
    current_user: AdminUser = Depends(require_super_admin)
):
    """Create or update a category (upsert behavior)"""
    if not data.id or not data.name:
        raise HTTPException(status_code=400, detail="ID and name are required")
    
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not available")
    
    # Upsert (create or update)
    result = supabase.table("categories").upsert(data.model_dump()).execute()
    
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create category")
    
    logger.info(f"Category created/updated: {data.id} by {current_user.username}")
    return {"success": True, "id": data.id}


@router.patch("/{category_id}", response_model=dict)
async def update_category(
    category_id: str,
    data: CategoryCreate,
    current_user: AdminUser = Depends(require_super_admin)
):
    """Update an existing category"""
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not available")
    
    # Check exists
    check = supabase.table("categories").select("id").eq("id", category_id).execute()
    if not check.data:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Update (exclude id)
    update_data = data.model_dump(exclude={"id"})
    supabase.table("categories").update(update_data).eq("id", category_id).execute()
    
    logger.info(f"Category updated: {category_id} by {current_user.username}")
    return {"success": True}


@router.delete("/{category_id}")
async def delete_category(
    category_id: str,
    force: bool = False,
    current_user: AdminUser = Depends(require_super_admin)
):
    """
    Delete a category.
    
    - **force**: If true, also unlink all restaurants from this category
    """
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not available")
    
    # Check exists
    check = supabase.table("categories").select("id").eq("id", category_id).execute()
    if not check.data:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Check for restaurants using this category
    restaurants = supabase.table("restaurants").select("id").eq("category_id", category_id).limit(1).execute()
    
    if restaurants.data and not force:
        raise HTTPException(
            status_code=400,
            detail="Category has restaurants. Set force=true to unlink them and delete."
        )
    
    # Unlink restaurants if force
    if force and restaurants.data:
        supabase.table("restaurants").update({"category_id": None}).eq("category_id", category_id).execute()
        logger.info(f"Unlinked restaurants from category: {category_id}")
    
    # Delete category
    supabase.table("categories").delete().eq("id", category_id).execute()
    
    logger.info(f"Category deleted: {category_id} by {current_user.username}")
    return {"success": True}


@router.post("/reorder")
async def reorder_categories(
    order: List[str],
    current_user: AdminUser = Depends(require_super_admin)
):
    """
    Reorder categories by providing list of category IDs in desired order.
    
    - **order**: List of category IDs in desired order
    """
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not available")
    
    for idx, category_id in enumerate(order):
        supabase.table("categories").update({"sort_order": idx}).eq("id", category_id).execute()
    
    logger.info(f"Categories reordered by {current_user.username}")
    return {"success": True}
