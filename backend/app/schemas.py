from pydantic import BaseModel, EmailStr, Field, constr
from typing import Optional, List
from datetime import datetime
import json


# ======================================================
#                       USERS
# ======================================================
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


# ======================================================
#                       PRODUCTS
# ======================================================
class ProductBase(BaseModel):
    name: constr(min_length=1, max_length=100)
    description: Optional[str] = None
    category: Optional[str] = None
    condition: Optional[str] = None
    price: float = Field(default=0, ge=0)
    quantity: int = Field(default=1, ge=1, le=1000)
    image_url: Optional[str] = None  # raw storage (JSON string or single URL)
    video_url: Optional[str] = None
    item_type: Optional[str] = Field(default="have", pattern="^(have|need)$")

    def get_image_list(self) -> List[str]:
        """Parse image_url JSON into a list of URLs."""
        if not self.image_url:
            return []
        try:
            urls = json.loads(self.image_url)
            return urls if isinstance(urls, list) else [urls]
        except Exception:
            return [self.image_url]


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    condition: Optional[str] = None
    price: Optional[float] = None
    quantity: Optional[int] = None
    image_url: Optional[str] = None
    video_url: Optional[str] = None
    item_type: Optional[str] = Field(default=None, pattern="^(have|need)$")


class ProductOut(ProductBase):
    id: int
    owner_id: int
    date_posted: datetime
    date_updated: Optional[datetime] = None

    # ✅ Include parsed image URLs as a list
    images: List[str] = []

    model_config = {"from_attributes": True}

    def model_post_init(self, __context):
        self.images = self.get_image_list()


# ======================================================
#                       MATCHES
# ======================================================
class MatchOut(BaseModel):
    id: int
    product_a_id: int
    product_b_id: int
    similarity_score: Optional[float]
    date_matched: datetime

    model_config = {"from_attributes": True}


# ======================================================
#                     AUTH TOKEN
# ======================================================
class Token(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str
    user_id: Optional[int] = None
    username: Optional[str] = None
    email: Optional[EmailStr] = None


class TokenData(BaseModel):
    sub: Optional[str] = None
