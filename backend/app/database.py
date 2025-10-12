# backend/app/database.py
import os
import pathlib
import urllib.parse
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Optional: import psycopg2 only when we need to create a postgres DB
try:
    import psycopg2
    from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
except Exception:
    psycopg2 = None  # not required for sqlite or when psycopg2 not installed

# Load environment variables from backend/.env
BASE_DIR = pathlib.Path(__file__).resolve().parent.parent
load_dotenv(dotenv_path=BASE_DIR / ".env")

# Raw URL from .env
raw_url = os.getenv("DATABASE_URL")
if not raw_url:
    raise RuntimeError("DATABASE_URL not set. Create backend/.env with DATABASE_URL")

# Parse the URL
parsed = urllib.parse.urlparse(raw_url)
scheme = parsed.scheme or ""

# Only attempt DB-creation logic for PostgreSQL (scheme startswith "postgres")
def create_database_if_not_exists():
    if not scheme.startswith("postgres"):
        # Not postgres — nothing to do
        return

    if psycopg2 is None:
        raise RuntimeError(
            "psycopg2 is required to auto-create a Postgres database. "
            "Install it or create the database manually."
        )

    db_name = parsed.path.lstrip("/")
    user = parsed.username
    # decode password in case it was URL-encoded in .env
    password = urllib.parse.unquote(parsed.password or "")
    host = parsed.hostname or "localhost"
    port = parsed.port or 5432

    try:
        # Connect to default 'postgres' DB to check/create new DB
        default_conn = psycopg2.connect(
            dbname="postgres",
            user=user,
            password=password,
            host=host,
            port=port
        )
        default_conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = default_conn.cursor()

        cursor.execute("SELECT 1 FROM pg_database WHERE datname = %s", (db_name,))
        exists = cursor.fetchone()

        if not exists:
            print(f"🔄 Creating missing database '{db_name}'...")
            # Quote identifier safely
            cursor.execute(f'CREATE DATABASE "{db_name}"')
            print(f"✅ Created database '{db_name}'.")
        else:
            print(f"✅ Database '{db_name}' already exists.")

        cursor.close()
        default_conn.close()

    except psycopg2.OperationalError as e:
        # Provide actionable message
        print("❌ Failed to connect to PostgreSQL while trying to ensure database exists.")
        print("   Make sure Postgres is running and DATABASE_URL is correct.")
        raise

# Try to create DB if postgres
create_database_if_not_exists()

# Rebuild a safe SQLAlchemy URL: keep the original scheme, but ensure password is quoted
# If the .env already contains a properly formatted URL this will be equivalent
username = parsed.username or ""
password = parsed.password or ""
host = parsed.hostname or ""
port = parsed.port or ""
db_name = parsed.path.lstrip("/") if parsed.path else ""

# Quote password for SQLAlchemy URI
safe_password = urllib.parse.quote_plus(urllib.parse.unquote(password))

# prefer using raw_url for sqlite or if scheme isn't standard, otherwise rebuild
if scheme.startswith("postgres"):
    sqlalchemy_url = f"{parsed.scheme}://{username}:{safe_password}@{host}:{port}/{db_name}"
else:
    # For sqlite, raw_url is usually fine (e.g. sqlite:///./file.db)
    sqlalchemy_url = raw_url

# Create SQLAlchemy engine
engine = create_engine(sqlalchemy_url, echo=False)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class
Base = declarative_base()

# FastAPI DB dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
