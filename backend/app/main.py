# backend/app/main.py

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import os

from app.database import Base, engine
from app import models
from app.routes import users, products
from app import routes_auth

# ✅ Initialize FastAPI
app = FastAPI(title="MakeItWhole API", version="1.0")

# ✅ Initialize database
print("🔄 Checking database and creating tables if needed...")
Base.metadata.create_all(bind=engine)
print("✅ Database tables are ready!")

# ✅ CORS (for Next.js frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://192.168.0.106:3000",  # optional local network access
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Prepare uploads folder (ensure it matches where products.py saves files)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # go up one level
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# ✅ Serve static files (images/videos)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# ✅ Include routers
app.include_router(routes_auth.router, prefix="/auth", tags=["Auth"])
app.include_router(users.router, prefix="/users", tags=["Users"])
app.include_router(products.router, prefix="/products", tags=["Products"])

# ✅ Root route
@app.get("/")
def root():
    return {"message": "Welcome to MakeItWhole API 🚀"}
