# init_db.py — place this inside backend/

from app.database import Base, engine
# Import models so SQLAlchemy knows about them
from app import models

def init_db():
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✅ Done!")

if __name__ == "__main__":
    init_db()
