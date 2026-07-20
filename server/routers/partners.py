"""
Partner Requests Router
Handles restaurant and courier partnership applications
"""
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime
import re

from supabase_client import get_supabase

router = APIRouter(prefix="/api/partners", tags=["partners"])


# =============================================================================
# Schemas
# =============================================================================

_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class PartnerRequestCreate(BaseModel):
    type: str = Field(..., pattern="^(restaurant|courier)$")
    name: str = Field(..., min_length=2, max_length=100)
    phone: str = Field(..., min_length=5, max_length=32)
    email: Optional[str] = None
    company_name: Optional[str] = Field(None, max_length=200)
    message: Optional[str] = Field(None, max_length=1000)

    @field_validator("email", "company_name", "message", mode="before")
    @classmethod
    def empty_str_to_none(cls, v):
        if v is None:
            return None
        if isinstance(v, str):
            v = v.strip()
            return v or None
        return v

    @field_validator("name", "phone", mode="before")
    @classmethod
    def strip_required(cls, v):
        if isinstance(v, str):
            return v.strip()
        return v

    @field_validator("email")
    @classmethod
    def validate_email(cls, v):
        if v is None:
            return None
        if not _EMAIL_RE.match(v):
            raise ValueError("Укажите корректный email или оставьте поле пустым")
        return v


class PartnerRequestResponse(BaseModel):
    id: int
    type: str
    name: str
    phone: str
    email: Optional[str]
    company_name: Optional[str]
    message: Optional[str]
    status: str
    created_at: datetime
    updated_at: datetime
    notes: Optional[str]


class PartnerRequestUpdate(BaseModel):
    status: Optional[str] = Field(None, pattern="^(pending|contacted|approved|rejected)$")
    notes: Optional[str] = None


# =============================================================================
# Public Endpoints
# =============================================================================

@router.post("/request", status_code=status.HTTP_201_CREATED)
async def create_partner_request(request: PartnerRequestCreate):
    """
    Создать заявку на партнерство (публичный endpoint)
    """
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection unavailable"
        )
    
    try:
        # Вставка заявки
        result = supabase.table("partner_requests").insert({
            "type": request.type,
            "name": request.name,
            "phone": request.phone,
            "email": request.email,
            "company_name": request.company_name,
            "message": request.message,
            "status": "pending"
        }).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create partner request"
            )
        
        return {
            "success": True,
            "message": "Заявка успешно отправлена! Мы свяжемся с вами в ближайшее время.",
            "request_id": result.data[0]["id"]
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating partner request: {str(e)}"
        )


# =============================================================================
# Admin Endpoints
# =============================================================================

@router.get("/requests", response_model=List[PartnerRequestResponse])
async def get_partner_requests(
    status_filter: Optional[str] = None,
    type_filter: Optional[str] = None,
    limit: int = 50,
    offset: int = 0
):
    """
    Получить список заявок (только для админов)
    """
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection unavailable"
        )
    
    try:
        query = supabase.table("partner_requests").select("*")
        
        if status_filter:
            query = query.eq("status", status_filter)
        
        if type_filter:
            query = query.eq("type", type_filter)
        
        result = query.order("created_at", desc=True).range(offset, offset + limit - 1).execute()
        
        return result.data
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching partner requests: {str(e)}"
        )


@router.get("/requests/{request_id}", response_model=PartnerRequestResponse)
async def get_partner_request(request_id: int):
    """
    Получить конкретную заявку (только для админов)
    """
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection unavailable"
        )
    
    try:
        result = supabase.table("partner_requests").select("*").eq("id", request_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Partner request not found"
            )
        
        return result.data[0]
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching partner request: {str(e)}"
        )


@router.patch("/requests/{request_id}")
async def update_partner_request(request_id: int, update: PartnerRequestUpdate):
    """
    Обновить статус заявки (только для админов)
    """
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection unavailable"
        )
    
    try:
        update_data = {}
        if update.status:
            update_data["status"] = update.status
        if update.notes is not None:
            update_data["notes"] = update.notes
        
        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields to update"
            )
        
        result = supabase.table("partner_requests").update(update_data).eq("id", request_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Partner request not found"
            )
        
        return {
            "success": True,
            "message": "Partner request updated successfully",
            "data": result.data[0]
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating partner request: {str(e)}"
        )


@router.delete("/requests/{request_id}")
async def delete_partner_request(request_id: int):
    """
    Удалить заявку (только для админов)
    """
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection unavailable"
        )
    
    try:
        result = supabase.table("partner_requests").delete().eq("id", request_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Partner request not found"
            )
        
        return {
            "success": True,
            "message": "Partner request deleted successfully"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting partner request: {str(e)}"
        )
