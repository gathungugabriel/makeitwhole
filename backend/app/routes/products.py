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

# ============================================================
#                   CONFIGURATION
# ============================================================
if UPLOAD_MODE == "cloudinary" and CLOUDINARY_CLOUD_NAME:
    cloudinary.config(
        cloud_name=CLOUDINARY_CLOUD_NAME,
        api_key=CLOUDINARY_API_KEY,
        api_secret=CLOUDINARY_API_SECRET
    )

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

router = APIRouter(tags=["Products"])


# ============================================================
#                   CREATE PRODUCT
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
    """Create a product with multiple images (max 5) and one optional video."""
    if have_or_need.lower() not in ["have", "need"]:
        raise HTTPException(status_code=400, detail="Invalid value for have_or_need")

    image_urls = []
    video_url = None

    try:
        # ✅ Upload multiple images
        if images:
            for img in images[:5]:
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

        # ✅ Upload single video
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

        # ✅ Save product
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
#                   LIST PRODUCTS (PUBLIC)
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
    """List products with optional filters."""
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

    products = query.order_by(models.Product.id.desc()).offset(skip).limit(limit).all()
    return products  # ✅ Let Pydantic handle image normalization


# ============================================================
#                   MY PRODUCTS
# ============================================================
@router.get("/me", response_model=List[schemas.ProductOut])
def list_my_products(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return db.query(models.Product).filter(models.Product.owner_id == current_user.id).all()


# ============================================================
#                   GET SINGLE PRODUCT
# ============================================================
@router.get("/{product_id}", response_model=schemas.ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


# ============================================================
#                   UPDATE PRODUCT
# ============================================================
@router.put("/{product_id}", response_model=schemas.ProductOut)
def update_product(
    product_id: int,
    name: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    category: Optional[str] = Form(None),
    condition: Optional[str] = Form(None),
    price: Optional[float] = Form(None),
    quantity: Optional[int] = Form(None),
    images: Optional[List[UploadFile]] = File(None),
    replace_images: Optional[bool] = Form(False),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if product.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this product")

    # Parse existing image list
    existing_images = []
    if product.image_url:
        try:
            existing_images = json.loads(product.image_url)
        except json.JSONDecodeError:
            existing_images = [product.image_url]

    # ✅ Handle new image uploads
    uploaded_images = []
    if images:
        for img in images[:5]:
            if UPLOAD_MODE == "cloudinary":
                result = cloudinary.uploader.upload(
                    img.file, folder="makeitwhole/products/images"
                )
                uploaded_images.append(result.get("secure_url"))
            else:
                filename = f"{datetime.utcnow().strftime('%Y%m%d%H%M%S')}_{img.filename}"
                filepath = os.path.join(UPLOAD_DIR, filename)
                with open(filepath, "wb") as buffer:
                    shutil.copyfileobj(img.file, buffer)
                uploaded_images.append(f"/uploads/{filename}")

    # ✅ Replace or append images
    if replace_images:
        product.image_url = json.dumps(uploaded_images)
    elif uploaded_images:
        product.image_url = json.dumps(existing_images + uploaded_images)

    # ✅ Update other fields
    if name: product.name = name
    if description: product.description = description
    if category: product.category = category
    if condition: product.condition = condition
    if price is not None: product.price = price
    if quantity is not None: product.quantity = quantity

    db.commit()
    db.refresh(product)
    return product



# ============================================================
#                   DELETE PRODUCT
# ============================================================
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


# ============================================================
#                   DELETE SINGLE IMAGE
# ============================================================
@router.delete("/{product_id}/images", status_code=status.HTTP_200_OK)
def delete_product_image(
    product_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Delete a specific image from a product's image list."""
    image_url = payload.get("image_url")
    if not image_url:
        raise HTTPException(status_code=400, detail="Image URL is required")

    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if product.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to modify this product")

    # Parse stored image URLs
    existing_images = []
    if product.image_url:
        try:
            existing_images = json.loads(product.image_url)
        except json.JSONDecodeError:
            existing_images = [product.image_url]

    # Remove image from list
    updated_images = [img for img in existing_images if img != image_url]
    if len(updated_images) == len(existing_images):
        raise HTTPException(status_code=404, detail="Image not found in product")

    # Optional: delete file from disk (only for local uploads)
    if UPLOAD_MODE != "cloudinary" and image_url.startswith("/uploads/"):
        file_path = os.path.join(BASE_DIR, image_url.lstrip("/"))
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception as e:
                print(f"⚠️ Could not remove file: {e}")

    # Update DB
    product.image_url = json.dumps(updated_images) if updated_images else None
    db.commit()
    db.refresh(product)
    return {"message": "✅ Image deleted successfully", "images": updated_images}


# ============================================================
#                   REPLACE SINGLE IMAGE
# ============================================================
@router.patch("/{product_id}/replace-image", status_code=status.HTTP_200_OK)
def replace_product_image(
    product_id: int,
    old_image_url: str = Form(...),
    new_image: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Replace an existing image with a new one (owner only)."""
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if product.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to modify this product")

    # Parse existing images
    existing_images = []
    if product.image_url:
        try:
            existing_images = json.loads(product.image_url)
        except json.JSONDecodeError:
            existing_images = [product.image_url]

    if old_image_url not in existing_images:
        raise HTTPException(status_code=404, detail="Old image not found in product")

    # Upload new image
    try:
        if UPLOAD_MODE == "cloudinary":
            result = cloudinary.uploader.upload(
                new_image.file, folder="makeitwhole/products/images"
            )
            new_image_url = result.get("secure_url")
        else:
            filename = f"{datetime.utcnow().strftime('%Y%m%d%H%M%S')}_{new_image.filename}"
            filepath = os.path.join(UPLOAD_DIR, filename)
            with open(filepath, "wb") as buffer:
                shutil.copyfileobj(new_image.file, buffer)
            new_image_url = f"/uploads/{filename}"
    except Exception as e:
        print(f"❌ Upload error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to upload new image")

    # Replace image URL
    updated_images = [
        new_image_url if img == old_image_url else img for img in existing_images
    ]
    product.image_url = json.dumps(updated_images)

    # Optional: delete old file (local only)
    if UPLOAD_MODE != "cloudinary" and old_image_url.startswith("/uploads/"):
        file_path = os.path.join(BASE_DIR, old_image_url.lstrip("/"))
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception as e:
                print(f"⚠️ Could not remove old file: {e}")

    db.commit()
    db.refresh(product)
    return {"message": "✅ Image replaced successfully", "images": updated_images}
