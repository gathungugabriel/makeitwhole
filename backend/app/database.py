# backend/app/database.py
import os
import pathlib
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Ensure .env in backend/ — load it explicitly
BASE_DIR = pathlib.Path(__file__).resolve().parent.parent  # backend/
load_dotenv(dotenv_path=BASE_DIR / ".env")

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL not set. Create backend/.env with DATABASE_URL")

# create SQLAlchemy engine
engine = create_engine(DATABASE_URL, echo=False)

# session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# base class
Base = declarative_base()

# dependency for FastAPI
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
