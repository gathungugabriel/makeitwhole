# backend/app/__init__.py

"""
App package initializer.

✅ Health check:
- This file marks the 'app' folder as a Python package.
- Do NOT import internal modules here (e.g., models, routes, etc.)
  to avoid circular imports during startup.
- Keep this file lightweight and import-free unless absolutely necessary.
"""

# Optional diagnostic check (safe to keep or remove)
def health_check() -> str:
    return "App package initialized successfully"
  
