# backend/app/main.py
from fastapi import FastAPI
from app.database import Base, engine
from app.routes import users
from app import models

# ✅ Create tables on startup (safe and idempotent)
print("🔄 Checking database and creating tables if needed...")
Base.metadata.create_all(bind=engine)
print("✅ Database tables are ready!")

# Initialize FastAPI app
app = FastAPI(title="MakeItWhole API", version="1.0")

# Include your routes
app.include_router(users.router, prefix="/users")

@app.get("/")
def root():
    return {"message": "Welcome to MakeItWhole API"}
