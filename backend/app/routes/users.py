# backend/app/routes/users.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app import models, schemas
from app.database import get_db
from app.auth import (
    get_current_user,
    get_password_hash,
    verify_password,
    create_access_token
)

router = APIRouter(tags=["Users"])


# 🧩 Register new user
@router.post("/register", response_model=schemas.UserOut)
def register(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    exists = db.query(models.User).filter(
        (models.User.username == user_in.username) | (models.User.email == user_in.email)
    ).first()
    if exists:
        raise HTTPException(status_code=400, detail="Username or email already registered")

    hashed = get_password_hash(user_in.password)
    user = models.User(username=user_in.username, email=user_in.email, hashed_password=hashed)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


# 🔐 Login user
@router.post("/login", response_model=schemas.Token)
def login(form_data: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.email).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    access_token = create_access_token(data={"sub": str(user.id)})
    return {"access_token": access_token, "token_type": "bearer"}


# ✅ Protected endpoint — current user profile
@router.get("/me", response_model=schemas.UserOut)
def get_current_user_profile(current_user: models.User = Depends(get_current_user)):
    """Return details of the logged-in user."""
    return current_user
