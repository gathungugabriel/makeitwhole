from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import List
from datetime import datetime
from rapidfuzz import fuzz, process

from app import models, schemas
from app.database import get_db
from app.auth import get_current_user

router = APIRouter(prefix="/matches", tags=["Matches"])

# ==========================================================
# 🧠 HELPER: Calculate similarity between two products
# ==========================================================
def compute_similarity(prod1: models.Product, prod2: models.Product) -> float:
    """
    Compute fuzzy similarity between two products using name, category, and description.
    Weighted more towards the name and description.
    """
    text1 = f"{prod1.name or ''} {prod1.category or ''} {prod1.description or ''}".lower()
    text2 = f"{prod2.name or ''} {prod2.category or ''} {prod2.description or ''}".lower()

    # Give more weight to name & description
    name_score = fuzz.token_set_ratio(prod1.name or "", prod2.name or "")
    desc_score = fuzz.token_set_ratio(prod1.description or "", prod2.description or "")
    cat_score = fuzz.token_set_ratio(prod1.category or "", prod2.category or "")

    # Weighted average
    return round((0.5 * name_score) + (0.4 * desc_score) + (0.1 * cat_score), 2)


# ==========================================================
# 🔍 FIND AND STORE MATCHES (called after create/update)
# ==========================================================
def find_and_store_matches(db: Session, new_product: models.Product):
    """
    Finds opposite-type products that are similar to the new/updated product
    and stores the match + notifications in the database.
    """
    opposite_type = "need" if new_product.item_type == "have" else "have"

    candidates = db.query(models.Product).filter(
        models.Product.item_type == opposite_type,
        models.Product.id != new_product.id
    ).all()

    for candidate in candidates:
        similarity = compute_similarity(new_product, candidate)
        if similarity >= 70:  # threshold for fuzzy match
            existing = db.query(models.Match).filter(
                or_(
                    and_(models.Match.product_a_id == new_product.id, models.Match.product_b_id == candidate.id),
                    and_(models.Match.product_a_id == candidate.id, models.Match.product_b_id == new_product.id),
                )
            ).first()

            if not existing:
                new_match = models.Match(
                    product_a_id=new_product.id,
                    product_b_id=candidate.id,
                    similarity_score=similarity,
                    date_matched=datetime.utcnow()
                )
                db.add(new_match)

                # Notifications for both users
                db.add_all([
                    models.Notification(
                        user_id=candidate.owner_id,
                        product_id=new_product.id,
                        message=f"A new match found for your item: '{candidate.name}'"
                    ),
                    models.Notification(
                        user_id=new_product.owner_id,
                        product_id=candidate.id,
                        message=f"Your item '{new_product.name}' matches with '{candidate.name}'"
                    ),
                ])

    db.commit()


# ==========================================================
# 📋 GET MATCHES FOR CURRENT USER
# ==========================================================
@router.get("/my", response_model=List[schemas.MatchOut])
def get_my_matches(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Fetch all matches where the current user's products are involved.
    Sorted by most recent.
    """
    user_products = db.query(models.Product.id).filter(models.Product.owner_id == current_user.id).subquery()
    matches = db.query(models.Match).filter(
        or_(
            models.Match.product_a_id.in_(user_products),
            models.Match.product_b_id.in_(user_products)
        )
    ).order_by(models.Match.date_matched.desc()).all()
    return matches


# ==========================================================
# 🔔 GET NOTIFICATIONS FOR CURRENT USER
# ==========================================================
@router.get("/notifications/my", response_model=List[schemas.NotificationOut])
def get_my_notifications(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Retrieve all notifications for the current user.
    """
    return db.query(models.Notification).filter(
        models.Notification.user_id == current_user.id
    ).order_by(models.Notification.date_created.desc()).all()


# ==========================================================
# ✅ MARK A NOTIFICATION AS READ
# ==========================================================
@router.patch("/notifications/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    notif = db.query(models.Notification).filter(
        models.Notification.id == notification_id,
        models.Notification.user_id == current_user.id
    ).first()

    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")

    notif.is_read = True
    db.commit()
    db.refresh(notif)
    return {"message": "✅ Notification marked as read"}
