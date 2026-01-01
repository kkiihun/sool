from fastapi import APIRouter, Query, HTTPException
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.sool import Sool

router = APIRouter(
    prefix="/v2/sool",
    tags=["SOOL V2"]
)


# ================================
# 🔥 Search API (검색 + pagination + sorting)
# ================================
@router.get("/search", summary="Search SOOL by name with pagination & sorting", operation_id="search_sool_v2")
def search_sool(
    q: str = Query(..., min_length=1),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page (max 100)"),
    sort: str = Query("name", description="Sorting field (default: name)"),
    order: str = Query("asc", description="Sorting order: asc / desc")
):
    db: Session = SessionLocal()

    # Pagination Offset
    offset = (page - 1) * limit

    # Base Query
    query = db.query(Sool).filter(Sool.name.ilike(f"%{q}%"))

    # ------------------------
    # 🔥 Sorting Logic
    # ------------------------
    valid_fields = {
        "name": Sool.name,
        "adv": Sool.abv,
        "region": Sool.region,
        "producer": Sool.producer
    }

    sort_column = valid_fields.get(sort, Sool.name)

    if order == "desc":
        query = query.order_by(sort_column.desc())
    else:
        query = query.order_by(sort_column.asc())

    total = query.count()
    results = query.offset(offset).limit(limit).all()

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "sort": sort,
        "order": order,
        "pages": (total // limit) + (1 if total % limit > 0 else 0),
        "results": results
    }

# ================================
# 🔥 Suggest API (자동완성)  ⬅⬅⬅ 이 코드 추가!
# ================================
@router.get("/suggest", summary="Autocomplete suggestion for SOOL name")
def suggest_sool(
    q: str = Query(..., min_length=1),
    limit: int = Query(10, ge=1, le=30)
):
    db: Session = SessionLocal()

    results = (
        db.query(Sool.id, Sool.name)
        .filter(Sool.name.ilike(f"%{q}%"))
        .order_by(Sool.name.asc())
        .limit(limit)
        .all()
    )

    return {
        "count": len(results),
        "items": [{"id": r.id, "name": r.name} for r in results]
    }


# ================================
# 🔥 ID 조회 (항상 마지막)
# ================================
@router.get("/{sool_id:int}", summary="Get SOOL by ID", operation_id="get_sool_v2")
def get_sool(sool_id: int):
    db: Session = SessionLocal()
    sool = db.query(Sool).filter(Sool.id == sool_id).first()

    if not sool:
        raise HTTPException(status_code=404, detail="SOOL not found")

    return sool
