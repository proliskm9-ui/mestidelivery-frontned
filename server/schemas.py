"""
Pydantic Schemas
Data validation and serialization models for API requests/responses
"""
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Union
from datetime import datetime


# =============================================================================
# Category Schemas
# =============================================================================

class CategoryBase(BaseModel):
    id: str = Field(..., min_length=1, max_length=100)
    name: str = Field(..., min_length=1, max_length=200)
    icon: str = Field(..., max_length=500)
    sort_order: int = Field(default=0, ge=0)


class CategoryCreate(CategoryBase):
    pass


class CategoryResponse(CategoryBase):
    class Config:
        from_attributes = True


# =============================================================================
# Restaurant Schemas
# =============================================================================

class RestaurantBase(BaseModel):
    id: str = Field(..., min_length=1, max_length=100)
    name: str = Field(..., min_length=1, max_length=500)
    rating: Union[str, float, None] = Field(default=0.0)
    delivery: Optional[str] = Field(default="", max_length=200)
    img: Optional[str] = Field(default="", max_length=1000)
    screen: Optional[str] = Field(default="", max_length=1000)
    category_id: Optional[str] = Field(default=None, max_length=100)
    is_featured: bool = False
    is_recommended: bool = False
    has_promo: bool = False
    min_order: int = Field(default=0, ge=0)
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = Field(default="", max_length=500)


class RestaurantCreate(RestaurantBase):
    pass


class RestaurantResponse(RestaurantBase):
    class Config:
        from_attributes = True


# =============================================================================
# Product Schemas
# =============================================================================

class ProductBase(BaseModel):
    id: str = Field(..., min_length=1, max_length=100)
    restaurant_id: str = Field(..., min_length=1, max_length=100)
    name: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = Field(default="")
    price: float = Field(default=0.0, ge=0)
    img: Optional[str] = Field(default="", max_length=1000)
    category: Optional[str] = Field(default="", max_length=200)
    weight: Optional[str] = Field(default="", max_length=100)
    calories: Optional[str] = Field(default="", max_length=100)
    proteins: Optional[str] = Field(default="", max_length=100)
    fats: Optional[str] = Field(default="", max_length=100)
    carbs: Optional[str] = Field(default="", max_length=100)
    ingredients: Optional[str] = Field(default="")


class ProductCreate(ProductBase):
    pass


class ProductResponse(ProductBase):
    class Config:
        from_attributes = True


# =============================================================================
# Store Schemas
# =============================================================================

class StoreBase(BaseModel):
    id: str = Field(..., min_length=1, max_length=100)
    name: str = Field(..., min_length=1, max_length=500)
    img: str = Field(..., max_length=1000)
    delivery: str = Field(..., max_length=200)
    sort_order: int = Field(default=0, ge=0)


class StoreCreate(StoreBase):
    pass


class StoreResponse(StoreBase):
    class Config:
        from_attributes = True


# =============================================================================
# Order Schemas
# =============================================================================

class CartItem(BaseModel):
    product_id: str = Field(..., min_length=1)
    name: str = Field(..., min_length=1, max_length=500)
    price: float = Field(..., ge=0)
    quantity: int = Field(..., gt=0)
    
    @field_validator('quantity')
    @classmethod
    def validate_quantity(cls, v):
        if v > 1000:
            raise ValueError('Quantity cannot exceed 1000')
        return v


class OrderCreate(BaseModel):
    user_id: str = Field(..., min_length=1, max_length=100)
    restaurant_id: str = Field(..., min_length=1, max_length=100)
    restaurant_name: str = Field(default="", max_length=500)
    items: Union[List[CartItem], str] = Field(...)
    total: float = Field(..., ge=0)
    customer_name: str = Field(..., min_length=1, max_length=500)
    phone: str = Field(..., min_length=5, max_length=100)
    address: str = Field(..., min_length=5, max_length=1000)
    comment: Optional[str] = Field(default="", max_length=2000)
    place_type: Optional[str] = Field(default="", max_length=100)
    scheduled_time: Optional[str] = Field(default=None, max_length=100)
    promo_code: Optional[str] = Field(default="", max_length=100)
    tips: Optional[float] = Field(default=0, ge=0)
    cutlery_count: int = Field(default=0, ge=0)
    apartment: Optional[str] = Field(default="", max_length=100)
    entrance: Optional[str] = Field(default="", max_length=100)
    floor: Optional[str] = Field(default="", max_length=100)
    intercom: Optional[str] = Field(default="", max_length=100)
    courier_comment: Optional[str] = Field(default="", max_length=2000)
    payment_method: Optional[str] = Field(default="cash", max_length=50)  # cash, card, crypto
    idempotency_key: Optional[str] = Field(default=None, max_length=200)


class OrderResponse(BaseModel):
    id: int
    user_id: str
    restaurant_id: str
    items: str  # JSON string
    total: float
    status: str
    created_at: Optional[datetime] = None
    customer_name: str = ""
    phone: str = ""
    address: str = ""
    comment: str = ""
    place_type: str = ""
    scheduled_time: Optional[datetime] = None
    promo_code: str = ""
    discount: float = 0
    tips: float = 0
    delivery_fee: float = 5
    courier_id: Optional[int] = None
    cutlery_count: int = 0
    apartment: str = ""
    entrance: str = ""
    floor: str = ""
    intercom: str = ""
    courier_comment: str = ""
    rating: Optional[int] = None
    rating_comment: Optional[str] = None
    restaurant_name: Optional[str] = None

    class Config:
        from_attributes = True


class OrderStatusUpdate(BaseModel):
    status: str = Field(..., min_length=1, max_length=100)


class OrderRateRequest(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    rating_comment: Optional[str] = Field(default="", max_length=1000)


# =============================================================================
# Auth Schemas
# =============================================================================

class LoginRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=100)
    password: str = Field(..., min_length=4, max_length=100)


class AdminUserResponse(BaseModel):
    id: int
    username: str
    role: str
    restaurant_id: Optional[str] = None


class LoginResponse(BaseModel):
    token: str
    user: AdminUserResponse


class CreateAdminRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=100)
    password: Optional[str] = Field(default=None, max_length=100)
    role: str = Field(..., min_length=1, max_length=100)
    restaurant_id: Optional[str] = Field(default=None, max_length=100)
    
    @field_validator('username')
    @classmethod
    def validate_username(cls, v):
        if not v.replace('_', '').replace('-', '').isalnum():
            raise ValueError('Username can only contain letters, numbers, underscores and hyphens')
        return v.lower()


class ChangePasswordRequest(BaseModel):
    old_password: str = Field(..., min_length=4)
    new_password: str = Field(..., min_length=6, max_length=100)


# =============================================================================
# Customer Auth Schemas
# =============================================================================

class CustomerRegister(BaseModel):
    email: str = Field(..., min_length=5, max_length=200)
    password: str = Field(..., min_length=6, max_length=100)
    full_name: str = Field(..., min_length=1, max_length=200)
    phone: str = Field(..., min_length=5, max_length=100)


class CustomerLogin(BaseModel):
    email: str = Field(..., min_length=5, max_length=200)
    password: str = Field(..., min_length=6, max_length=100)


class CustomerResponse(BaseModel):
    id: int
    email: str
    full_name: Optional[str] = None
    phone: Optional[str] = None
    avatar: Optional[str] = None
    address: Optional[dict] = None
    points: int = 0

    class Config:
        from_attributes = True


class CustomerUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    avatar: Optional[str] = None
    address: Optional[dict] = None
    points: Optional[int] = None


class CustomerLoginResponse(BaseModel):
    token: str
    user: CustomerResponse


# =============================================================================
# Promo Code Schemas
# =============================================================================

class PromoCodeCreate(BaseModel):
    code: str = Field(..., min_length=2, max_length=100)
    discount_percent: int = Field(default=0, ge=0, le=100)
    discount_amount: float = Field(default=0, ge=0)
    min_order: float = Field(default=0, ge=0)
    max_uses: int = Field(default=0, ge=0)  # 0 = unlimited
    is_active: bool = True
    valid_from: Optional[str] = Field(default=None, max_length=100)
    valid_until: Optional[str] = Field(default=None, max_length=100)
    restaurant_id: Optional[str] = Field(default=None, max_length=100)
    
    @field_validator('code')
    @classmethod
    def validate_code(cls, v):
        if not v.replace('_', '').replace('-', '').isalnum():
            raise ValueError('Promo code can only contain letters, numbers, underscores and hyphens')
        return v.upper()


class PromoCodeResponse(BaseModel):
    id: int
    code: str
    discount_percent: int
    discount_amount: float
    min_order: float
    max_uses: int
    current_uses: int = 0
    is_active: bool
    valid_from: Optional[datetime] = None
    valid_until: Optional[datetime] = None
    restaurant_id: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class PromoCodeValidate(BaseModel):
    code: str = Field(..., min_length=1, max_length=100)
    order_total: float = Field(..., gt=0)
    restaurant_id: Optional[str] = Field(default=None, max_length=100)


class PromoCodeValidateResponse(BaseModel):
    valid: bool
    discount: float = 0
    message: str = ""


# =============================================================================
# Pagination Schemas
# =============================================================================

class PaginationParams(BaseModel):
    limit: int = Field(default=20, gt=0, le=1000)
    offset: int = Field(default=0, ge=0)


class PaginatedResponse(BaseModel):
    data: list
    total: int
    limit: int
    offset: int
    has_more: bool
