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

    provider = Column(String(50), default="local", nullable=False)

    # Optional profile fields
    full_name = Column(String(100), nullable=True)
    phone = Column(String(20), nullable=True)
    address = Column(String(255), nullable=True)

    date_created = Column(DateTime(timezone=True), server_default=func.now())
    date_updated = Column(DateTime(timezone=True), onupdate=func.now())

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
    video_url = Column(String(255))
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))

    # 🆕 Indicates whether the listing is an item someone "has" or "needs"
    item_type = Column(String(10), default="have", nullable=False)

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
    product_a_id = Column(Integer, ForeignKey("products.id"))
    product_b_id = Column(Integer, ForeignKey("products.id"))
    similarity = Column(Float)
    buyer_id = Column(Integer, ForeignKey("users.id"))
    seller_id = Column(Integer, ForeignKey("users.id"))
    timestamp = Column(DateTime, default=datetime.utcnow)

    product_a = relationship("Product", foreign_keys=[product_a_id])
    product_b = relationship("Product", foreign_keys=[product_b_id])
    buyer = relationship("User", foreign_keys=[buyer_id])
    seller = relationship("User", foreign_keys=[seller_id])


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    message = Column(String)
    match_id = Column(Integer, ForeignKey("matches.id"), nullable=True)
    read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
