from fastapi import APIRouter, Depends, HTTPException, status, Form
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
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

SECRET_KEY = os.getenv("SECRET_KEY", "supersecretkey")
ALGORITHM = os.getenv("ALGORITHM", "HS256")

ACCESS_TOKEN_EXPIRE_HOURS = 12
REFRESH_TOKEN_EXPIRE_DAYS = 7


# 🧩 Register new user
@router.post("/register", response_model=schemas.UserOut)
def register(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(
        (models.User.username == user_in.username) | (models.User.email == user_in.email)
    ).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username or email already registered")

    hashed_password = get_password_hash(user_in.password)
    user = models.User(
        username=user_in.username,
        email=user_in.email,
        hashed_password=hashed_password,
        date_created=datetime.utcnow(),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


# 🔐 Login user
@router.post("/login", response_model=schemas.Token)
def login(
    username: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db),
):
    user = db.query(models.User).filter(
        (models.User.email == username) | (models.User.username == username)
    ).first()

    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username/email or password",
        )

    # Access + Refresh tokens
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
    }


# ✅ Refresh token route
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


# ✅ Get all users (for testing/admin)
@router.get("/", response_model=list[schemas.UserOut])
def get_users(db: Session = Depends(get_db)):
    return db.query(models.User).all()


# 👤 Get currently logged-in user
@router.get("/me", response_model=schemas.UserOut)
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user


# ✏️ Update current user
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
