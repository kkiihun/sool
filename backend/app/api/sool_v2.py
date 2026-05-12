from fastapi import APIRouter, Query, HTTPException
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.sool import Sool
from sqlalchemy import func
from app.models.tasting_note import TastingNote
from app.api.utils.recommender import flavor_vector
from app.schemas.sool_schema import SoolResponse, FoodTagSchema
from app.models.food_pairing import FoodTag
from typing import List

router = APIRouter(
    prefix="/v2/sool",
    tags=["SOOL V2"]
)

@router.get("/food-tags", summary="Get all available food tags", response_model=List[FoodTagSchema])
def get_food_tags():
    db: Session = SessionLocal()
    tags = db.query(FoodTag).order_by(FoodTag.name).all()
    db.close()
    return tags

# ================================
# 🔥 Search API (검색 + pagination + sorting)
# ================================
@router.get("/search", summary="Search SOOL with pagination, sorting & filters", operation_id="search_sool_v2")
def search_sool(
    q: str = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),

    # 📌 추가된 Multi Filters
    region: str = Query(None, description="ex: 경기, 강원, 서울"),
    producer: str = Query(None, description="양조장명"),
    category: str = Query(None),
    food_tag_id: int = Query(None),
    abv_min: float = Query(None, ge=0),
    abv_max: float = Query(None, ge=0),

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

    if category:
        query = query.filter(Sool.category.ilike(f"%{category}%"))

    if region:
        query = query.filter(Sool.region.ilike(f"%{region}%"))

    if producer:
        query = query.filter(Sool.producer.ilike(f"%{producer}%"))

    if abv_min is not None:
        query = query.filter(Sool.abv >= abv_min)

    if abv_max is not None:
        query = query.filter(Sool.abv <= abv_max)
    
    if food_tag_id:
        query = query.filter(Sool.food_tags.any(id=food_tag_id))

    # 정렬 필드 정의
    valid_fields = {
        "name": Sool.name,
        "abv": Sool.abv,
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
# 🔥 Suggest API (자동완성)
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
# 🔥 Advanced SOOL recommendation
# ================================

@router.get("/recommend/advanced", summary="Advanced SOOL recommendation (TastingNote + scoring)")
def recommend_advanced(
    q: str = Query(None),
    region: str = Query(None),
    limit: int = Query(10, ge=1, le=50)
):
    db: Session = SessionLocal()

    # Sool + TastingNote Join → 평균 평점 & 리뷰수 계산
    data = (
        db.query(
            Sool,
            func.avg(TastingNote.rating).label("avg_rating"),
            func.count(TastingNote.id).label("review_count")
        )
        .outerjoin(TastingNote, TastingNote.sool_id == Sool.id)
        .group_by(Sool.id)
        .all()
    )

    scored = []
    for sool, avg_rating, review_count in data:
        score = 0

        # 기본 매칭 점수
        if q and q in sool.name: score += 3
        if region and region in (sool.region or ""): score += 2

        # 고도화 점수 반영
        if avg_rating:
            score += float(avg_rating) * 1.5    # 평점 가중치
        if review_count:
            score += min(review_count, 20) * 0.2   # 리뷰수 영향 반영

        scored.append((score, sool, avg_rating, review_count))

    scored.sort(key=lambda x: x[0], reverse=True)

    results = [
        {
            "id": s.id,
            "name": s.name,
            "score": score,
            "avg_rating": float(avg_rating) if avg_rating else None,
            "review_count": review_count,
        }
        for score, s, avg_rating, review_count in scored[:limit]
    ]

    return {
        "query": q,
        "region_filter": region,
        "count": len(results),
        "recommendations": results
    }

# ================================
# 🔥 Recommendation similar
# ================================

@router.get("/similar/{sool_id:int}", summary="Similarity based recommendation for SOOL")
def similar_sool(sool_id: int, limit: int = 10):
    db: Session = SessionLocal()

    base = db.query(Sool).filter(Sool.id == sool_id).first()
    if not base:
        raise HTTPException(status_code=404, detail="Base SOOL not found")

    others = db.query(Sool).filter(Sool.id != sool_id).all()

    scored = []
    for item in others:
        score = 0

        # Similarity 계산 로직
        if item.region == base.region:
            score += 3
        if item.producer == base.producer:
            score += 2

        # 도수 차이가 가까우면 + 점수
        if item.abv and base.abv:
            diff = abs(item.abv - base.abv)
            score += max(0, 5 - diff)

        scored.append((score, item))

    scored.sort(key=lambda x: x[0], reverse=True)
    results = [s[1] for s in scored[:limit]]

    return {
        "base": {"id": base.id, "name": base.name, "region": base.region, "abv": base.abv},
        "count": len(results),
        "similar_items": [
            {"id": r.id, "name": r.name, "region": r.region, "abv": r.abv}
            for r in results
        ]
    }

# ================================
# 🔥 Cosine Similarity
# ================================

@router.get("/similar/flavor/{sool_id}", summary="Flavor similarity based recommendation")
def similar_by_flavor(sool_id: int, limit: int = 5):
    db = SessionLocal()

    base_note = db.query(TastingNote).filter(TastingNote.sool_id == sool_id).first()
    if not base_note:
        raise HTTPException(status_code=404, detail="No tasting notes found")

    base_vec = np.array(flavor_vector(base_note))

    results = []
    notes = db.query(TastingNote).filter(TastingNote.sool_id != sool_id).all()

    for note in notes:
        vec = np.array(flavor_vector(note))
        # Zero vector check to avoid division by zero
        norm_base = np.linalg.norm(base_vec)
        norm_vec = np.linalg.norm(vec)
        if norm_base == 0 or norm_vec == 0:
            similarity = 0
        else:
            similarity = np.dot(base_vec, vec) / (norm_base * norm_vec)
        results.append((similarity, note.sool_id))

    results.sort(key=lambda x: x[0], reverse=True)
    top = results[:limit]

    sools = []
    for sim, sid in top:
        sool = db.query(Sool).filter(Sool.id == sid).first()
        if sool:
            sools.append({"id": sid, "name": sool.name, "similarity": float(sim)})

    return {
        "base_sool_id": sool_id,
        "count": len(sools),
        "recommendations": sools
    }


# ================================
# 🔥 ID 조회 (항상 마지막)
# ================================
@router.get("/{sool_id:int}", summary="Get SOOL by ID", response_model=SoolResponse, operation_id="get_sool_v2")
def get_sool(sool_id: int):
    db: Session = SessionLocal()
    sool = db.query(Sool).filter(Sool.id == sool_id).first()

    if not sool:
        db.close()
        raise HTTPException(status_code=404, detail="SOOL not found")

    return sool
