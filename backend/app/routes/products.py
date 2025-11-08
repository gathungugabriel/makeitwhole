from fastapi import (
    APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Body
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
# CONFIG
# ============================================================
API_BASE_URL = os.getenv("API_BASE_URL", "https://api.makeitwhole.com")

if UPLOAD_MODE == "cloudinary" and CLOUDINARY_CLOUD_NAME:
    cloudinary.config(
        cloud_name=CLOUDINARY_CLOUD_NAME,
        api_key=CLOUDINARY_API_KEY,
        api_secret=CLOUDINARY_API_SECRET
    )

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

router = APIRouter()


# ============================================================
# HELPERS
# ============================================================
def make_absolute_url(path: Optional[str]) -> Optional[str]:
    if not path:
        return None
    if isinstance(path, str) and path.startswith("http"):
        return path
    if not path.startswith("/"):
        path = f"/{path}"
    return f"{API_BASE_URL}{path}"


def to_relative_path(url: str) -> str:
    if not isinstance(url, str):
        return url
    if url.startswith(API_BASE_URL):
        rel = url[len(API_BASE_URL):]
        if not rel.startswith("/"):
            rel = "/" + rel
        return rel
    return url


async def save_upload_file(upload_file: UploadFile) -> str:
    orig_name = upload_file.filename or "file"
    safe_name = orig_name.replace(" ", "_")
    stamp = datetime.utcnow().strftime("%Y%m%d%H%M%S%f")
    filename = f"{stamp}_{safe_name}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(upload_file.file, buffer)
    return f"/uploads/{filename}"


def upload_to_cloudinary(file: UploadFile, folder: str, resource_type: str = "auto") -> Optional[str]:
    try:
        result = cloudinary.uploader.upload(file.file, folder=folder, resource_type=resource_type)
        return result.get("secure_url")
    except Exception as e:
        print(f"❌ Cloudinary upload failed: {e}")
        return None


def _normalize_list_for_storage(urls: List[str]) -> List[str]:
    return urls


def _product_response_normalize(product: models.Product):
    if product.image_url:
        try:
            imgs = json.loads(product.image_url) if isinstance(product.image_url, str) else product.image_url
            abs_imgs = [make_absolute_url(u) for u in imgs]
            product.image_url = json.dumps(abs_imgs)
        except Exception:
            product.image_url = json.dumps([make_absolute_url(product.image_url)])
    else:
        product.image_url = json.dumps([])

    if product.video_url:
        product.video_url = make_absolute_url(product.video_url)
    else:
        product.video_url = None


# ============================================================
# CREATE PRODUCT
# ============================================================
@router.post("/", response_model=schemas.ProductOut, status_code=status.HTTP_201_CREATED)
async def create_product(
    name: str = Form(...),
    price: float = Form(0),
    description: Optional[str] = Form(None),
    category: Optional[str] = Form(None),
    condition: Optional[str] = Form(None),
    item_type: str = Form("have"),
    quantity: int = Form(1),
    image_files: Optional[List[UploadFile]] = File(None),
    video_file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    image_urls: List[str] = []
    video_url: Optional[str] = None

    if image_files:
        for file in image_files[:10]:
            if UPLOAD_MODE == "cloudinary":
                uploaded = upload_to_cloudinary(file, folder="makeitwhole/products/images")
                if uploaded:
                    image_urls.append(uploaded)
            else:
                saved_rel = await save_upload_file(file)
                image_urls.append(saved_rel)

    if video_file:
        if UPLOAD_MODE == "cloudinary":
            uploaded = upload_to_cloudinary(video_file, folder="makeitwhole/products/videos", resource_type="video")
            if uploaded:
                video_url = uploaded
        else:
            saved_rel = await save_upload_file(video_file)
            video_url = saved_rel

    stored_images = json.dumps(_normalize_list_for_storage(image_urls)) if image_urls else None

    new_product = models.Product(
        name=name,
        price=price,
        description=description,
        category=category,
        condition=condition,
        item_type=item_type,
        quantity=quantity,
        image_url=stored_images,
        video_url=video_url,
        owner_id=current_user.id,
    )
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    _product_response_normalize(new_product)
    return new_product


# ============================================================
# LIST PRODUCTS
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
    query = db.query(models.Product)

    if item_type in ("have", "need"):
        query = query.filter(models.Product.item_type == item_type)
    if category:
        query = query.filter(models.Product.category.ilike(f"%{category}%"))
    if search:
        search_term = f"%{search.lower()}%"
        query = query.filter(
            or_(
                models.Product.name.ilike(search_term),
                models.Product.description.ilike(search_term),
                models.Product.category.ilike(search_term),
            )
        )

    products = query.order_by(models.Product.id.desc()).offset(skip).limit(limit).all()
    for p in products:
        _product_response_normalize(p)
    return products


# ============================================================
# MY PRODUCTS
# ============================================================
@router.get("/me", response_model=List[schemas.ProductOut])
def list_my_products(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    items = db.query(models.Product).filter(models.Product.owner_id == current_user.id).order_by(models.Product.id.desc()).all()
    for p in items:
        _product_response_normalize(p)
    return items


# ============================================================
# GET PRODUCT
# ============================================================
@router.get("/{product_id}", response_model=schemas.ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    _product_response_normalize(product)
    return product


# ============================================================
# UPDATE PRODUCT
# ============================================================
@router.put("/{product_id}", response_model=schemas.ProductOut)
async def update_product(
    product_id: int,
    name: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    category: Optional[str] = Form(None),
    condition: Optional[str] = Form(None),
    item_type: Optional[str] = Form(None),
    price: Optional[float] = Form(None),
    quantity: Optional[int] = Form(None),
    images: Optional[List[UploadFile]] = File(None),
    replace_images: Optional[bool] = Form(False),
    video: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if product.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    if name is not None: product.name = name
    if description is not None: product.description = description
    if category is not None: product.category = category
    if condition is not None: product.condition = condition
    if item_type is not None: product.item_type = item_type
    if price is not None: product.price = price
    if quantity is not None: product.quantity = quantity

    existing_images: List[str] = []
    if product.image_url:
        try:
            existing_images = json.loads(product.image_url) if isinstance(product.image_url, str) else product.image_url
        except Exception:
            existing_images = [product.image_url]

    uploaded_images: List[str] = []
    if images:
        for f in images[:10]:
            if UPLOAD_MODE == "cloudinary":
                url = upload_to_cloudinary(f, folder="makeitwhole/products/images")
                if url:
                    uploaded_images.append(url)
            else:
                rel = await save_upload_file(f)
                uploaded_images.append(rel)

    if replace_images:
        product.image_url = json.dumps(_normalize_list_for_storage(uploaded_images)) if uploaded_images else None
    else:
        if uploaded_images:
            new_store = existing_images + uploaded_images
            product.image_url = json.dumps(_normalize_list_for_storage(new_store))

    if video:
        if product.video_url:
            old_rel = to_relative_path(product.video_url)
            if old_rel.startswith("/uploads/") and UPLOAD_MODE != "cloudinary":
                filename = old_rel.split("/uploads/")[-1]
                file_path = os.path.join(UPLOAD_DIR, filename)
                if os.path.exists(file_path):
                    try:
                        os.remove(file_path)
                    except Exception:
                        pass

        if UPLOAD_MODE == "cloudinary":
            url = upload_to_cloudinary(video, folder="makeitwhole/products/videos", resource_type="video")
            if url:
                product.video_url = url
        else:
            rel = await save_upload_file(video)
            product.video_url = rel

    db.commit()
    db.refresh(product)
    _product_response_normalize(product)
    return product


# ============================================================
# DELETE PRODUCT
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
        raise HTTPException(status_code=403, detail="Not authorized")

    if product.image_url:
        try:
            imgs = json.loads(product.image_url)
        except Exception:
            imgs = [product.image_url]
        for img in imgs:
            rel = to_relative_path(img)
            if rel.startswith("/uploads/") and UPLOAD_MODE != "cloudinary":
                filename = rel.split("/uploads/")[-1]
                file_path = os.path.join(UPLOAD_DIR, filename)
                if os.path.exists(file_path):
                    try:
                        os.remove(file_path)
                    except Exception:
                        pass

    if product.video_url:
        rel = to_relative_path(product.video_url)
        if rel.startswith("/uploads/") and UPLOAD_MODE != "cloudinary":
            filename = rel.split("/uploads/")[-1]
            file_path = os.path.join(UPLOAD_DIR, filename)
            if os.path.exists(file_path):
                try:
                    os.remove(file_path)
                except Exception:
                    pass

    db.delete(product)
    db.commit()
    return {"message": "✅ Product deleted successfully"}


# ============================================================
# DELETE SINGLE IMAGE
# ============================================================
@router.delete("/{product_id}/images", status_code=status.HTTP_200_OK)
def delete_product_image(
    product_id: int,
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    image_url = payload.get("image_url")
    if not image_url:
        raise HTTPException(status_code=400, detail="Image URL is required")

    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if product.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    existing_images: List[str] = []
    if product.image_url:
        try:
            existing_images = json.loads(product.image_url)
        except Exception:
            existing_images = [product.image_url]

    provided_rel = to_relative_path(image_url)
    norm_existing = [to_relative_path(img) for img in existing_images]
    updated_storage = [orig for orig, norm in zip(existing_images, norm_existing) if norm != provided_rel]

    if len(updated_storage) == len(existing_images):
        raise HTTPException(status_code=404, detail="Image not found in product")

    removed_set = set(existing_images) - set(updated_storage)
    for removed in removed_set:
        rel = to_relative_path(removed)
        if rel.startswith("/uploads/") and UPLOAD_MODE != "cloudinary":
            filename = rel.split("/uploads/")[-1]
            fpath = os.path.join(UPLOAD_DIR, filename)
            if os.path.exists(fpath):
                try:
                    os.remove(fpath)
                except Exception:
                    pass

    product.image_url = json.dumps(updated_storage) if updated_storage else None
    db.commit()
    db.refresh(product)

    response_images = [make_absolute_url(u) for u in json.loads(product.image_url)] if product.image_url else []
    return {"message": "✅ Image deleted successfully", "images": response_images}


# ============================================================
# REPLACE SINGLE IMAGE
# ============================================================
@router.patch("/{product_id}/replace-image", status_code=status.HTTP_200_OK)
async def replace_product_image(
    product_id: int,
    old_image_url: str = Form(...),
    new_image: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if product.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    existing_images: List[str] = []
    if product.image_url:
        try:
            existing_images = json.loads(product.image_url)
        except Exception:
            existing_images = [product.image_url]

    old_rel = to_relative_path(old_image_url)
    norm_existing = [to_relative_path(img) for img in existing_images]
    if old_rel not in norm_existing:
        raise HTTPException(status_code=404, detail="Old image not found in product")

    if UPLOAD_MODE == "cloudinary":
        new_url = upload_to_cloudinary(new_image, folder="makeitwhole/products/images")
    else:
        saved_rel = await save_upload_file(new_image)
        new_url = saved_rel

    replaced = False
    updated_list = []
    for orig in existing_images:
        if not replaced and to_relative_path(orig) == old_rel:
            updated_list.append(new_url)
            replaced = True
        else:
            updated_list.append(orig)

    if UPLOAD_MODE != "cloudinary" and old_rel.startswith("/uploads/"):
        filename = old_rel.split("/uploads/")[-1]
        file_path = os.path.join(UPLOAD_DIR, filename)
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception:
                pass

    product.image_url = json.dumps(updated_list) if updated_list else None
    db.commit()
    db.refresh(product)

    resp_imgs = [make_absolute_url(u) for u in json.loads(product.image_url)] if product.image_url else []
    return {"message": "✅ Image replaced successfully", "images": resp_imgs}


# ============================================================
# REPLACE PRODUCT VIDEO
# ============================================================
@router.patch("/{product_id}/replace-video", status_code=status.HTTP_200_OK)
async def replace_product_video(
    product_id: int,
    new_video: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if product.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    if product.video_url:
        old_rel = to_relative_path(product.video_url)
        if old_rel.startswith("/uploads/") and UPLOAD_MODE != "cloudinary":
            filename = old_rel.split("/uploads/")[-1]
            file_path = os.path.join(UPLOAD_DIR, filename)
            if os.path.exists(file_path):
                try:
                    os.remove(file_path)
                except Exception:
                    pass

    if UPLOAD_MODE == "cloudinary":
        new_url = upload_to_cloudinary(new_video, folder="makeitwhole/products/videos", resource_type="video")
    else:
        saved_rel = await save_upload_file(new_video)
        new_url = saved_rel

    product.video_url = new_url
    db.commit()
    db.refresh(product)
    return {"message": "✅ Video replaced successfully", "video_url": make_absolute_url(new_url)}





# ============================================================
#                   DELETE PRODUCT VIDEO
# ============================================================
@router.delete("/{product_id}/video", status_code=status.HTTP_200_OK)
def delete_product_video(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if product.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    if not product.video_url:
        raise HTTPException(status_code=404, detail="No video to delete")

    rel_path = to_relative_path(product.video_url)
    if rel_path.startswith("/uploads/") and UPLOAD_MODE != "cloudinary":
        filename = rel_path.split("/uploads/")[-1]
        file_path = os.path.join(UPLOAD_DIR, filename)
        if os.path.exists(file_path):
            os.remove(file_path)

    product.video_url = None
    db.commit()
    db.refresh(product)
    return {"message": "✅ Video deleted successfully"}
