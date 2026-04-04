"""
Stores Router - Supabase API Version
Manages store entities (shops, supermarkets, etc.)
"""
from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
import logging

from supabase_client import get_supabase
from models import AdminUser
from schemas import StoreCreate, StoreResponse
from routers.auth import get_current_user, require_super_admin

router = APIRouter(prefix="/stores", tags=["stores"])
logger = logging.getLogger(__name__)


@router.get("/", response_model=List[StoreResponse])
async def get_stores():
    """Get all stores"""
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not available")
    
    # Try getting stores without specific ordering first to avoid schema errors
    result = supabase.table("stores").select("*").execute()
    return result.data


@router.get("/{store_id}", response_model=StoreResponse)
async def get_store(store_id: str):
    """Get a single store by ID"""
    if not store_id:
        raise HTTPException(status_code=400, detail="Invalid store ID")
    
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not available")
    
    result = supabase.table("stores").select("*").eq("id", store_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Store not found")
    
    return result.data[0]


@router.post("/", response_model=dict)
async def create_store(
    data: StoreCreate,
    current_user: AdminUser = Depends(require_super_admin)
):
    """Create a new store (super admin only)"""
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not available")
    
    try:
        # Check if store already exists
        check = supabase.table("stores").select("id").eq("id", data.id).execute()
        
        payload = data.model_dump()
        
        if check.data:
            # Update existing
            update_payload = data.model_dump(exclude={"id"})
            supabase.table("stores").update(update_payload).eq("id", data.id).execute()
            logger.info(f"Store updated: {data.id}")
        else:
            # Insert new
            supabase.table("stores").insert(payload).execute()
            logger.info(f"Store created: {data.id}")
            
        return {"success": True}
    except Exception as e:
        logger.error(f"Error creating/updating store: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.put("/{store_id}", response_model=dict)
async def update_store(
    store_id: str,
    data: StoreCreate,
    current_user: AdminUser = Depends(require_super_admin)
):
    """Update an existing store (super admin only)"""
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not available")
    
    # Check if store exists
    check = supabase.table("stores").select("id").eq("id", store_id).execute()
    if not check.data:
        raise HTTPException(status_code=404, detail="Store not found")
    
    # Update store
    update_data = data.model_dump(exclude={"id", "sort_order"})
    supabase.table("stores").update(update_data).eq("id", store_id).execute()
    
    logger.info(f"Store updated: {store_id} by {current_user.username}")
    return {"success": True}


@router.delete("/{store_id}")
async def delete_store(
    store_id: str,
    current_user: AdminUser = Depends(require_super_admin)
):
    """Delete a store (super admin only)"""
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not available")
    
    # Check if store exists
    check = supabase.table("stores").select("id").eq("id", store_id).execute()
    if not check.data:
        raise HTTPException(status_code=404, detail="Store not found")
    
    supabase.table("stores").delete().eq("id", store_id).execute()
    
    logger.info(f"Store deleted: {store_id} by {current_user.username}")
    return {"success": True}
