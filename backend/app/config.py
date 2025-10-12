# backend/app/config.py
import os

# Default to local storage; switch to "cloudinary" later
UPLOAD_MODE = os.getenv("UPLOAD_MODE", "local")  # "local" or "cloudinary"

# Cloudinary credentials (leave blank for now)
CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME", "")
CLOUDINARY_API_KEY = os.getenv("CLOUDINARY_API_KEY", "")
CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET", "")
