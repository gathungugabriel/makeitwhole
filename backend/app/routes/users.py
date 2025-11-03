from fastapi import APIRouter, Depends, HTTPException, status, Form
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional
import os

from app import models, schemas
from app.database import get_db
from app.auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    refresh_access_token,
    get_current_user,
)

router = APIRouter()

# Environment / config
SECRET_KEY = os.getenv("SECRET_KEY", "supersecretkey")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_HOURS = 12
REFRESH_TOKEN_EXPIRE_DAYS = 7


# 🧩 Register user (local or Google)
@router.post("/register", response_model=schemas.UserOut)
def register(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user (local or Google).
    For Google, skip password.
    """
    existing_user = db.query(models.User).filter(
        (models.User.username == user_in.username)
        | (models.User.email == user_in.email)
    ).first()

    if existing_user:
        raise HTTPException(status_code=400, detail="Username or email already registered")

    # Handle Google provider users
    if user_in.provider == "google":
        hashed_password = None
    else:
        if not user_in.password:
            raise HTTPException(
                status_code=400, detail="Password is required for local registration"
            )
        hashed_password = get_password_hash(user_in.password)

    user = models.User(
        username=user_in.username,
        email=user_in.email,
        hashed_password=hashed_password,
        provider=user_in.provider or "local",
        provider_id=user_in.provider_id,
        # profile_pic=user_in.profile_pic,
        date_created=datetime.utcnow(),
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user


# 🔐 Login user (local or Google)
@router.post("/login", response_model=schemas.Token)
def login(
    username: str = Form(...),
    password: Optional[str] = Form(None),
    provider: Optional[str] = Form("local"),
    provider_id: Optional[str] = Form(None),
    db: Session = Depends(get_db),
):
    """
    Login route for both local and Google users.
    - For local: requires username/email + password
    - For Google: uses email + provider_id (auto-registers if new)
    """
    # Try to find existing user
    user = db.query(models.User).filter(
        (models.User.email == username) | (models.User.username == username)
    ).first()

    # --- If user does not exist ---
    if not user:
        if provider == "google":
            # Auto-register Google users
            new_user = models.User(
                username=username.split("@")[0],
                email=username,
                provider="google",
                provider_id=provider_id,
                # profile_pic=None,
                date_created=datetime.utcnow(),
            )
            db.add(new_user)
            db.commit()
            db.refresh(new_user)
            user = new_user
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found. Please register first.",
            )

    # --- Local login ---
    if provider == "local":
        if not password:
            raise HTTPException(status_code=400, detail="Password is required for local login")
        if not user.hashed_password or not verify_password(password, user.hashed_password):
            raise HTTPException(status_code=401, detail="Invalid username/email or password")

    # --- Google login ---
    elif provider == "google":
        if user.provider != "google":
            raise HTTPException(status_code=400, detail="Use email/password login for this account")
        if provider_id and user.provider_id and provider_id != user.provider_id:
            raise HTTPException(status_code=401, detail="Google account mismatch")

    # Generate tokens
    access_expires = timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    refresh_expires = timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)

    access_token = create_access_token(data={"sub": str(user.id)}, expires_delta=access_expires)
    refresh_token = create_access_token(data={"sub": str(user.id)}, expires_delta=refresh_expires)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user_id": user.id,
        "username": user.username,
        "email": user.email,
        "provider": user.provider,
        # "profile_pic": user.profile_pic,
    }


# 🔁 Refresh token
@router.post("/refresh")
def refresh_token(refresh_token: str = Form(...)):
    """
    Refresh access token using a valid refresh token.
    """
    try:
        new_token = refresh_access_token(refresh_token)
        return new_token
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )


# 👥 Get all users (admin/testing)
@router.get("/", response_model=list[schemas.UserOut])
def get_users(db: Session = Depends(get_db)):
    return db.query(models.User).all()


# 👤 Get current logged-in user
@router.get("/me", response_model=schemas.UserOut)
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user


# ✏️ Update current user profile
@router.put("/me", response_model=schemas.UserOut)
def update_user_me(
    payload: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    for key, value in payload.dict(exclude_unset=True).items():
        setattr(current_user, key, value)

    current_user.date_updated = datetime.utcnow()
    db.commit()
    db.refresh(current_user)
    return current_user
