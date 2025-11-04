from fastapi import (
    APIRouter, Depends, HTTPException, status, UploadFile, File, Form
)
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from datetime import datetime
import os
import shutil
import json
import cloudinary
import cloudinary.uploader

from app import models, schemas
from app.database import get_db
from app.auth import get_current_user
from app.config import (
    UPLOAD_MODE, CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
)

# ✅ Cloudinary configuration
if UPLOAD_MODE == "cloudinary" and CLOUDINARY_CLOUD_NAME:
    cloudinary.config(
        cloud_name=CLOUDINARY_CLOUD_NAME,
        api_key=CLOUDINARY_API_KEY,
        api_secret=CLOUDINARY_API_SECRET
    )

# ✅ Local uploads directory
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

router = APIRouter(prefix="/products", tags=["Products"])

# ============================================================
#                    CREATE PRODUCT
# ============================================================
@router.post("/", response_model=schemas.ProductOut, status_code=status.HTTP_201_CREATED)
def create_product(
    name: str = Form(...),
    description: Optional[str] = Form(None),
    category: Optional[str] = Form(None),
    condition: Optional[str] = Form(None),
    have_or_need: str = Form(...),
    price: Optional[float] = Form(0),
    quantity: int = Form(1),
    images: Optional[List[UploadFile]] = File(None),
    video: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Create a product supporting multiple images and one video."""

    if have_or_need.lower() not in ["have", "need"]:
        raise HTTPException(status_code=400, detail="Invalid value for have_or_need")

    image_urls = []
    video_url = None

    try:
        # ✅ Upload multiple images
        if images:
            for img in images:
                if UPLOAD_MODE == "cloudinary":
                    result = cloudinary.uploader.upload(
                        img.file,
                        folder="makeitwhole/products/images"
                    )
                    image_urls.append(result.get("secure_url"))
                else:
                    filename = f"{datetime.utcnow().strftime('%Y%m%d%H%M%S')}_{img.filename}"
                    filepath = os.path.join(UPLOAD_DIR, filename)
                    with open(filepath, "wb") as buffer:
                        shutil.copyfileobj(img.file, buffer)
                    image_urls.append(f"/uploads/{filename}")

        # ✅ Upload video
        if video:
            if UPLOAD_MODE == "cloudinary":
                result = cloudinary.uploader.upload(
                    video.file,
                    resource_type="video",
                    folder="makeitwhole/products/videos"
                )
                video_url = result.get("secure_url")
            else:
                filename = f"{datetime.utcnow().strftime('%Y%m%d%H%M%S')}_{video.filename}"
                filepath = os.path.join(UPLOAD_DIR, filename)
                with open(filepath, "wb") as buffer:
                    shutil.copyfileobj(video.file, buffer)
                video_url = f"/uploads/{filename}"

        # ✅ Store JSON of image URLs
        new_product = models.Product(
            name=name,
            description=description,
            category=category,
            condition=condition,
            item_type=have_or_need.lower(),
            price=price or 0,
            quantity=quantity,
            image_url=json.dumps(image_urls) if image_urls else None,
            video_url=video_url,
            owner_id=current_user.id,
        )

        db.add(new_product)
        db.commit()
        db.refresh(new_product)
        return new_product

    except Exception as e:
        print(f"❌ Error creating product: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create product")


# ============================================================
#                    LIST PRODUCTS
# ============================================================
@router.get("/", response_model=List[schemas.ProductOut])
def list_products(
    search: Optional[str] = None,
    item_type: Optional[str] = None,
    category: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    """List products with optional search, type, and category filters."""
    query = db.query(models.Product)

    if item_type in ["have", "need"]:
        query = query.filter(models.Product.item_type == item_type)

    if category:
        query = query.filter(models.Product.category.ilike(f"%{category}%"))

    if search:
        search_term = f"%{search.lower()}%"
        query = query.filter(
            or_(
                models.Product.name.ilike(search_term),
                models.Product.description.ilike(search_term),
                models.Product.category.ilike(search_term)
            )
        )

    query = query.order_by(models.Product.id.desc())
    return query.offset(skip).limit(limit).all()


# ============================================================
#                    MY PRODUCTS
# ============================================================
@router.get("/me", response_model=List[schemas.ProductOut])
def list_my_products(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Return products belonging to the current user."""
    return db.query(models.Product).filter(models.Product.owner_id == current_user.id).all()


# ============================================================
#                    GET SINGLE PRODUCT
# ============================================================
@router.get("/{product_id}", response_model=schemas.ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db)):
    """Fetch a single product by ID."""
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


# ============================================================
#                    UPDATE PRODUCT
# ============================================================
@router.put("/{product_id}", response_model=schemas.ProductOut)
def update_product(
    product_id: int,
    product_in: schemas.ProductUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Update an existing product."""
    product = db.query(models.Product).filter(models.Product.id == product_id).first()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if product.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this product")

    for field, value in product_in.model_dump(exclude_unset=True).items():
        setattr(product, field, value)

    db.commit()
    db.refresh(product)
    return product


# ============================================================
#                    DELETE PRODUCT
# ============================================================
@router.delete("/{product_id}", status_code=status.HTTP_200_OK)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Delete a product owned by the current user."""
    product = db.query(models.Product).filter(models.Product.id == product_id).first()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if product.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this product")

    db.delete(product)
    db.commit()
    return {"message": "Product deleted successfully"}
