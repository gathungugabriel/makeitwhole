from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def get_matches():
    return {"message": "Matching results will appear here"}
  
