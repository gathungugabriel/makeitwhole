# backend/app/routes_auth.py

from fastapi import APIRouter, Depends, HTTPException, status, Form
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session
from app import models, schemas
from app.database import get_db
from app.auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    refresh_access_token,
    get_current_user,
)
from datetime import timedelta

router = APIRouter(tags=["Auth"])
oauth2_scheme = HTTPBearer(auto_error=False)


# ✅ 1. Register a new user
@router.post("/register", response_model=schemas.UserOut)
def register_user(
    username: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db),
):
    """Register a new user"""
    existing_user = db.query(models.User).filter(models.User.email == email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered.")

    hashed_pw = get_password_hash(password)
    user = models.User(username=username, email=email, hashed_password=hashed_pw)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


# ✅ 2. Login user and return access + refresh tokens
@router.post("/login")
def login_user(
    email: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db),
):
    """Authenticate user and return JWT tokens"""
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(data={"sub": str(user.id)}, expires_delta=access_token_expires)

    # Optional: Create refresh token with longer expiry
    refresh_token_expires = timedelta(days=7)
    refresh_token = create_access_token(data={"sub": str(user.id)}, expires_delta=refresh_token_expires)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {"id": user.id, "email": user.email, "username": user.username},
    }


# ✅ 3. Refresh access token
@router.post("/refresh")
def refresh_token(token: HTTPAuthorizationCredentials = Depends(oauth2_scheme)):
    """Refresh expired access token"""
    if token is None:
        raise HTTPException(status_code=401, detail="No refresh token provided.")
    return refresh_access_token(token.credentials)


# ✅ 4. Logout user (client-side token deletion)
@router.post("/logout")
def logout_user():
    """
    Logout endpoint — clears local tokens on the client.
    No server state because JWTs are stateless.
    """
    return {"message": "Successfully logged out. Please clear tokens from client."}


# ✅ 5. Get current user info
@router.get("/me", response_model=schemas.UserOut)
def get_me(current_user: models.User = Depends(get_current_user)):
    """Return profile of currently authenticated user"""
    return current_user
