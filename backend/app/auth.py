from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt, ExpiredSignatureError
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status, Request, APIRouter
from fastapi.responses import RedirectResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from dotenv import load_dotenv
import os

from app import models
from app.database import get_db

# ---------------------------------------------------------
# Load environment variables
# ---------------------------------------------------------
load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key")
REFRESH_SECRET_KEY = os.getenv("REFRESH_SECRET_KEY", "your-refresh-secret-key")
ALGORITHM = os.getenv("ALGORITHM", "HS256")

ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "15"))   # short lifespan
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))        # long lifespan

# ---------------------------------------------------------
# Password hashing setup
# ---------------------------------------------------------
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = HTTPBearer(auto_error=False)

# ---------------------------------------------------------
# Password Utilities
# ---------------------------------------------------------
def get_password_hash(password: str) -> str:
    """Hash plain password"""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify plain password against hashed password"""
    return pwd_context.verify(plain_password, hashed_password)

# ---------------------------------------------------------
# Token Creation Utilities
# ---------------------------------------------------------
def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """Generate a short-lived access token"""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def create_refresh_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """Generate a long-lived refresh token"""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, REFRESH_SECRET_KEY, algorithm=ALGORITHM)

# ---------------------------------------------------------
# Token Verification
# ---------------------------------------------------------
def verify_token(token: str, key: str, error_message: str):
    """Decode and verify token validity"""
    try:
        payload = jwt.decode(token, key, algorithms=[ALGORITHM])
        return payload
    except ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=error_message,
            headers={"WWW-Authenticate": "Bearer"},
        )

# ---------------------------------------------------------
# Retrieve Current User
# ---------------------------------------------------------
def get_current_user(
    token: HTTPAuthorizationCredentials = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    """Decode JWT and return the corresponding user"""
    if token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization token missing.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token_str = token.credentials
    payload = verify_token(token_str, SECRET_KEY, "Invalid or expired access token.")
    user_id = payload.get("sub")

    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")

    user = db.query(models.User).filter(models.User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    return user

# ---------------------------------------------------------
# Refresh Token Flow
# ---------------------------------------------------------
def refresh_access_token(refresh_token: str):
    """Validate refresh token and issue a new access token"""
    payload = verify_token(refresh_token, REFRESH_SECRET_KEY, "Invalid or expired refresh token.")
    user_id = payload.get("sub")

    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token payload")

    new_access_token = create_access_token({"sub": user_id})
    return {"access_token": new_access_token, "token_type": "bearer"}


# ==================================================================
# 🔐 GOOGLE OAUTH2 INTEGRATION (ADDED SECTION)
# ==================================================================
from authlib.integrations.starlette_client import OAuth
from starlette.config import Config

oauth_router = APIRouter(prefix="/auth", tags=["OAuth"])

# Initialize Authlib
config = Config(".env")
oauth = OAuth(config)

oauth.register(
    name='google',
    client_id=os.getenv("GOOGLE_CLIENT_ID"),
    client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={'scope': 'openid email profile'},
)

@oauth_router.get("/google")
async def login_via_google(request: Request):
    redirect_uri = request.url_for("google_callback")
    return await oauth.google.authorize_redirect(request, redirect_uri)

@oauth_router.get("/google/callback")
async def google_callback(request: Request, db: Session = Depends(get_db)):
    token = await oauth.google.authorize_access_token(request)
    user_info = token.get('userinfo')

    if not user_info:
        return RedirectResponse(url="http://localhost:3000/login?error=google_auth_failed")

    email = user_info["email"]
    username = user_info.get("name", email.split("@")[0])

    # Check if user exists, else create
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        user = models.User(
            username=username,
            email=email,
            hashed_password="google_oauth_user",
            date_created=datetime.now(timezone.utc),
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # Generate access + refresh tokens
    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})

    # Redirect to frontend dashboard
    redirect_url = f"http://localhost:3000/dashboard?access_token={access_token}&refresh_token={refresh_token}"
    return RedirectResponse(url=redirect_url)
