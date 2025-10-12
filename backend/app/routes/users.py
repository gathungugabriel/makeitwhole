# backend/app/routes/users.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app import models, schemas, database
from app.database import get_db
from fastapi import Form
from app.auth import (
    get_current_user,
    get_password_hash,
    verify_password,
    create_access_token,
)
from jose import jwt
import os

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
def login(
    username: str = Form(...),  # Can be email or username
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(
        (models.User.email == username) | (models.User.username == username)
    ).first()

    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    access_token = create_access_token(data={"sub": str(user.id)})

    # Debug: Print the token and decode to verify 'exp'
    print(f"Generated token: {access_token}")
    try:
        payload = jwt.decode(
            access_token,
            os.getenv("SECRET_KEY"),
            algorithms=[os.getenv("ALGORITHM", "HS256")]
        )
        print(f"Token payload after encoding: {payload}")
    except Exception as e:
        print(f"Error decoding token immediately after creation: {e}")

    return {"access_token": access_token, "token_type": "bearer"}

# ✅ Get all users (admin-level — for testing)
@router.get("/", response_model=list[schemas.UserOut])
def get_users(db: Session = Depends(get_db)):
    users = db.query(models.User).all()
    return users


# 👤 Get currently logged-in user
@router.get("/me", response_model=schemas.UserOut)
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user


# ✏️ Update current user — refreshes `date_updated`
@router.put("/me", response_model=schemas.UserOut)
def update_user_me(
    payload: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    for key, value in payload.dict(exclude_unset=True).items():
        setattr(current_user, key, value)

    db.commit()
    db.refresh(current_user)
    return current_user
