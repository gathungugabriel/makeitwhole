from pydantic import BaseModel, EmailStr, Field, constr
from typing import Optional
from datetime import datetime


# ================================
#              USERS
# ================================

class UserCreate(BaseModel):
    username: constr(min_length=3, max_length=50)
    email: EmailStr
    password: constr(min_length=6)


class UserOut(BaseModel):
    id: int
    username: str
    email: EmailStr
    full_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    date_created: datetime
    date_updated: Optional[datetime] = None

    model_config = {"from_attributes": True}


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    username: Optional[constr(min_length=3, max_length=50)] = None
    email: Optional[EmailStr] = None
    password: Optional[constr(min_length=6)] = None
    full_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None


# ================================
#            PRODUCTS
# ================================

class ProductCreate(BaseModel):
    name: constr(min_length=1, max_length=100)
    description: str
    category: str
    condition: str
    price: float = Field(..., ge=0, description="Product price must be 0 or more.")
    quantity: Optional[int] = Field(default=1, ge=1, le=1000)
    image_url: Optional[str] = None
    video_url: Optional[str] = None


class ProductOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    category: Optional[str]
    condition: Optional[str]
    price: float
    quantity: int
    image_url: Optional[str]
    video_url: Optional[str]
    owner_id: int
    date_posted: datetime
    date_updated: Optional[datetime] = None

    model_config = {"from_attributes": True}


# ================================
#             MATCHES
# ================================

class MatchOut(BaseModel):
    id: int
    product_a_id: int
    product_b_id: int
    similarity_score: Optional[float]
    date_matched: datetime

    model_config = {"from_attributes": True}


# ================================
#           AUTH TOKEN
# ================================

class Token(BaseModel):
    """Returned when user logs in or refreshes token."""
    access_token: str
    refresh_token: Optional[str] = None  # optional for refresh route
    token_type: str
    user_id: Optional[int] = None
    username: Optional[str] = None
    email: Optional[EmailStr] = None


class TokenData(BaseModel):
    """Used internally to extract user ID from JWT."""
    sub: Optional[str] = None
