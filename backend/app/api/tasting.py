from fastapi import APIRouter

router = APIRouter(
    prefix="/tasting",
    tags=["tasting"],
)

@router.get("/")
async def list_tasting():
    return [
        {"id": 1, "note": "부드럽고 달다"},
        {"id": 2, "note": "깔끔하고 드라이하다"},
    ]
