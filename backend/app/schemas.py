from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


# --- Users ---
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    username: str
    email: EmailStr
    date_created: datetime

    model_config = {"from_attributes": True}


class UserLogin(BaseModel):
    email: EmailStr
    password: str


# --- Products ---
class ProductCreate(BaseModel):
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    condition: Optional[str] = None
    image_url: Optional[str] = None
    video_url: Optional[str] = None


class ProductOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    category: Optional[str]
    condition: Optional[str]
    image_url: Optional[str]
    video_url: Optional[str]
    owner_id: int
    date_posted: datetime

    model_config = {"from_attributes": True}


# --- Matches / Auth Token ---
class MatchOut(BaseModel):
    id: int
    product_a_id: int
    product_b_id: int
    similarity_score: Optional[float]
    date_matched: datetime

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type: str
