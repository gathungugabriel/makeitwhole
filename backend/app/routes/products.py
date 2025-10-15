from fastapi import (
    APIRouter, Depends, HTTPException, status, UploadFile, File, Form
)
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import os
import shutil
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

router = APIRouter()  # main.py handles prefix '/products'


# ✅ Create product
@router.post("/", response_model=schemas.ProductOut, status_code=status.HTTP_201_CREATED)
def create_product(
    name: str = Form(...),
    description: Optional[str] = Form(None),
    category: Optional[str] = Form(None),
    condition: Optional[str] = Form(None),
    price: float = Form(...),
    quantity: int = Form(...),
    image: Optional[UploadFile] = File(None),
    video: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Create a new product — keeps original filenames for consistent image URLs."""
    image_url, video_url = None, None

    try:
        # ✅ Handle image upload
        if image:
            if UPLOAD_MODE == "cloudinary":
                upload_result = cloudinary.uploader.upload(
                    image.file, folder="makeitwhole/products/images"
                )
                image_url = upload_result.get("secure_url")
            else:
                # Keep original filename but ensure uniqueness
                orig_name, ext = os.path.splitext(image.filename)
                safe_name = orig_name.replace(" ", "_")
                timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
                final_name = f"{timestamp}_{safe_name}{ext}"

                image_path = os.path.join(UPLOAD_DIR, final_name)
                with open(image_path, "wb") as buffer:
                    shutil.copyfileobj(image.file, buffer)

                # ✅ Match frontend expectation: starts with /uploads/
                image_url = f"/uploads/{final_name}"

        # ✅ Handle video upload (same idea)
        if video:
            if UPLOAD_MODE == "cloudinary":
                upload_result = cloudinary.uploader.upload(
                    video.file, resource_type="video", folder="makeitwhole/products/videos"
                )
                video_url = upload_result.get("secure_url")
            else:
                orig_name, ext = os.path.splitext(video.filename)
                safe_name = orig_name.replace(" ", "_")
                timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
                final_name = f"{timestamp}_{safe_name}{ext}"

                video_path = os.path.join(UPLOAD_DIR, final_name)
                with open(video_path, "wb") as buffer:
                    shutil.copyfileobj(video.file, buffer)

                video_url = f"/uploads/{final_name}"

        # ✅ Save product
        new_product = models.Product(
            name=name,
            description=description,
            category=category,
            condition=condition,
            price=price,
            quantity=quantity,
            image_url=image_url,
            video_url=video_url,
            owner_id=current_user.id,
        )

        db.add(new_product)
        db.commit()
        db.refresh(new_product)
        return new_product

    except Exception as e:
        print(f"❌ Error creating product: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create product.")


# ✅ List all products (public)
@router.get("/", response_model=List[schemas.ProductOut])
def list_products(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.Product).offset(skip).limit(limit).all()


# ✅ My products (user)
@router.get("/me", response_model=List[schemas.ProductOut])
def list_my_products(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return db.query(models.Product).filter(models.Product.owner_id == current_user.id).all()


# ✅ Get single product
@router.get("/{product_id}", response_model=schemas.ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


# ✅ Update product
@router.put("/{product_id}", response_model=schemas.ProductOut)
def update_product(
    product_id: int,
    product_in: schemas.ProductCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if product.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this product")

    for field, value in product_in.model_dump().items():
        setattr(product, field, value)

    db.commit()
    db.refresh(product)
    return product


# ✅ Delete product
@router.delete("/{product_id}", status_code=status.HTTP_200_OK)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if product.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this product")

    db.delete(product)
    db.commit()
    return {"message": "Product deleted successfully"}
