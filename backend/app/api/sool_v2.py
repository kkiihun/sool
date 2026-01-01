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
@router.get("/search", summary="Search SOOL with pagination, sorting & filters", operation_id="search_sool_v2")
def search_sool(
    q: str = Query(None),  # ← 검색어 없어도 목록 필터 조회 가능하게 변경
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),

    # 📌 추가된 Multi Filters
    region: str = Query(None, description="ex: 경기, 강원, 서울"),
    producer: str = Query(None, description="양조장명"),
    abv_min: float = Query(None, ge=0, description="최소 도수"),
    abv_max: float = Query(None, ge=0, description="최대 도수"),

    # 정렬
    sort: str = Query("name"),
    order: str = Query("asc")
):
    db: Session = SessionLocal()
    offset = (page - 1) * limit

    # ⚡ base query
    query = db.query(Sool)

    # ------------------------
    # 🔍 필터 적용 (조건 있을 때만)
    # ------------------------
    if q:
        query = query.filter(Sool.name.ilike(f"%{q}%"))

    if region:
        query = query.filter(Sool.region.ilike(f"%{region}%"))

    if producer:
        query = query.filter(Sool.producer.ilike(f"%{producer}%"))

    if abv_min is not None:
        query = query.filter(Sool.abv >= abv_min)

    if abv_max is not None:
        query = query.filter(Sool.abv <= abv_max)

    # 정렬 필드 정의
    valid_fields = {
        "name": Sool.name,
        "adv": Sool.abv,
        "region": Sool.region,
        "producer": Sool.producer
    }
    sort_column = valid_fields.get(sort, Sool.name)

    query = query.order_by(sort_column.desc() if order == "desc" else sort_column.asc())

    total = query.count()
    results = query.offset(offset).limit(limit).all()

    return {
        "filters": {
            "q": q, "region": region, "producer": producer,
            "abv_min": abv_min, "abv_max": abv_max
        },
        "page": page,
        "limit": limit,
        "total": total,
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
# 🔥 Basic recommendation engine
# ================================

@router.get("/recommend", summary="Basic recommendation engine for SOOL")
def recommend_sool(
    q: str = Query(None),
    region: str = Query(None),
    abv_min: float = Query(None),
    abv_max: float = Query(None),
    limit: int = Query(10, ge=1, le=50)
):
    db: Session = SessionLocal()

    # 우선 전체 불러오고 조건별 scoring
    sools = db.query(Sool).all()

    scored = []
    for s in sools:
        score = 0

        # 🔥 점수 기반 추천 로직
        if q and q in s.name:
            score += 3

        if region and region in (s.region or ""):
            score += 2

        if abv_min and s.abv and s.abv >= abv_min:
            score += 1

        if abv_max and s.abv and s.abv <= abv_max:
            score += 1

        # 추후 확장 포인트
        # review_count, tasting_score, similarity_model ...

        scored.append((score, s))

    # Score 높은 순으로 추천 정렬
    scored.sort(key=lambda x: x[0], reverse=True)

    results = [s[1] for s in scored[:limit]]

    return {
        "query": q,
        "filters": {"region": region, "abv_min": abv_min, "abv_max": abv_max},
        "recommended_count": len(results),
        "items": results
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
