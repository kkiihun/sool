from fastapi import APIRouter, Query, HTTPException
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.sool import Sool

router = APIRouter(
    prefix="/v2/sool",
    tags=["SOOL V2"]
)


# ================================
# 🔥 Search API (문자열 우선 매칭)
# ================================
@router.get("/search", summary="Search SOOL by name", operation_id="search_sool_v2")
def search_sool(q: str = Query(..., min_length=1)):
    db: Session = SessionLocal()
    results = db.query(Sool).filter(Sool.name.ilike(f"%{q}%")).all()

    if not results:
        return {"message": "No results", "count": 0}

    return {"count": len(results), "results": results}


# ================================
# 🔥 ID 조회 (search 아래에 위치해야함)
# ================================
@router.get("/{sool_id:int}", summary="Get SOOL by ID", operation_id="get_sool_v2")
def get_sool(sool_id: int):
    db: Session = SessionLocal()
    sool = db.query(Sool).filter(Sool.id == sool_id).first()

    if not sool:
        raise HTTPException(status_code=404, detail="SOOL not found")

    return sool
