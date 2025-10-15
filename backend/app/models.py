# backend/app/models.py
from sqlalchemy import (
    Column, Integer, String, Text, ForeignKey, Float,
    DateTime, Boolean, func
)
from sqlalchemy.orm import relationship
from .database import Base

# ==========================
# 👤 USER MODEL
# ==========================
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    date_created = Column(DateTime(timezone=True), server_default=func.now())
    date_updated = Column(DateTime(timezone=True), onupdate=func.now())

    # 🪝 Relationship to products
    products = relationship(
        "Product",
        back_populates="owner",
        cascade="all, delete-orphan"
    )


# ==========================
# 📦 PRODUCT MODEL
# ==========================
class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    category = Column(String(50))
    condition = Column(String(30))
    price = Column(Float, nullable=False)
    quantity = Column(Integer, default=1)
    image_url = Column(String(255))
    video_url = Column(String(255))  # For optional product video
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))

    # 🕒 Timestamp fields
    date_posted = Column(DateTime(timezone=True), server_default=func.now())
    date_updated = Column(DateTime(timezone=True), onupdate=func.now())

    owner = relationship("User", back_populates="products")


# ==========================
# 🔁 MATCH MODEL
# ==========================
class Match(Base):
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True, index=True)
    product_a_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"))
    product_b_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"))
    similarity_score = Column(Float)
    date_matched = Column(DateTime(timezone=True), server_default=func.now())
