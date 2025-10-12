# backend/app/main.py
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
import os
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine
from app.routes import users, products
from app import models

# ✅ Ensure tables exist
print("🔄 Checking database and creating tables if needed...")
Base.metadata.create_all(bind=engine)
print("✅ Database tables are ready!")

# Initialize FastAPI
app = FastAPI(title="MakeItWhole API", version="1.0")

# # ✅ CORS setup — allow frontend (Next.js) requests
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=[
#         "http://127.0.0.1:3000",
#         "http://localhost:3000",
#         "http://192.168.0.106:3000",
#     ],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )
# Only activated during development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ✅ Prepare uploads folder (absolute path)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # backend/app/ -> backend
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# ✅ Serve static files
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Include routes
app.include_router(users.router, prefix="/users")
app.include_router(products.router, prefix="/products")

@app.get("/")
def root():
    return {"message": "Welcome to MakeItWhole API"}
