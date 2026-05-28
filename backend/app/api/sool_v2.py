from fastapi import APIRouter, Query, HTTPException
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.sool import Sool
from sqlalchemy import func
import numpy as np
from app.models.tasting_note import TastingNote
from app.api.utils.recommender import flavor_vector
from app.schemas.sool_schema import SoolResponse, FoodTagSchema
from app.models.food_pairing import FoodTag
from app.models.activity import ActivityLog
from app.core.deps import get_optional_user
from fastapi import Depends
from typing import List

from app.services.recommender import RecommenderService

router = APIRouter(
    prefix="/v2/sool",
    tags=["SOOL V2"]
)

@router.get("/recommend/personalized", summary="Get personalized recommendations based on activity")
def recommend_personalized(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(SessionLocal),
    user = Depends(get_optional_user)
):
    if not user:
        # 로그인하지 않은 경우 인기 제품 추천
        return {
            "type": "popular",
            "recommendations": RecommenderService.get_popular_sools(db, limit)
        }
    
    recs = RecommenderService.recommend_personalized(db, user.id, limit)
    return {
        "type": "personalized",
        "user_id": user.id,
        "recommendations": recs
    }

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
# 🔥 Wizard Recommendation (취향 맞춤 추천)
# ================================

@router.get("/recommend/wizard", summary="Wizard-based personalized recommendation")
def recommend_by_wizard(
    sweetness: float = Query(3.0, ge=1, le=5),
    acidity: float = Query(3.0, ge=1, le=5),
    body: float = Query(3.0, ge=1, le=5),
    abv_type: str = Query("all", description="low, medium, high, all"),
    category: str = Query(None),
    limit: int = Query(5, ge=1, le=20)
):
    db: Session = SessionLocal()
    
    # 기본 쿼리: 술과 평균 맛 지표 가져오기
    query = db.query(
        Sool,
        func.avg(TastingNote.sweetness).label("avg_sweetness"),
        func.avg(TastingNote.acidity).label("avg_acidity"),
        func.avg(TastingNote.body).label("avg_body")
    ).outerjoin(TastingNote, TastingNote.sool_id == Sool.id)
    
    # 필터 적용
    if category:
        query = query.filter(Sool.category == category)
    
    if abv_type == "low":
        query = query.filter(Sool.abv < 10)
    elif abv_type == "medium":
        query = query.filter(Sool.abv >= 10, Sool.abv < 20)
    elif abv_type == "high":
        query = query.filter(Sool.abv >= 20)

    data = query.group_by(Sool.id).all()
    
    scored = []
    for sool, s, a, b in data:
        # 데이터가 없는 경우 기본값 3.0 가정 (중립)
        s_val = float(s) if s is not None else 3.0
        a_val = float(a) if a is not None else 3.0
        b_val = float(b) if b is not None else 3.0
        
        # 유클리드 거리 기반 점수 (낮을수록 좋음 -> 10에서 빼서 높은 점수로 변환)
        distance = (
            (s_val - sweetness) ** 2 +
            (a_val - acidity) ** 2 +
            (b_val - body) ** 2
        ) ** 0.5
        
        score = max(0, 10 - distance)
        scored.append((score, sool))

    scored.sort(key=lambda x: x[0], reverse=True)
    
    results = []
    for score, s in scored[:limit]:
        results.append({
            "id": s.id,
            "name": s.name,
            "category": s.category,
            "abv": s.abv,
            "image_url": s.image_url,
            "score": round(score, 2)
        })

    return {
        "params": {"sweetness": sweetness, "acidity": acidity, "body": body, "abv_type": abv_type},
        "count": len(results),
        "recommendations": results
    }


# ================================
# 🔥 ID 조회 (항상 마지막)
# ================================
@router.get("/{sool_id:int}", summary="Get SOOL by ID", response_model=SoolResponse, operation_id="get_sool_v2")
def get_sool(
    sool_id: int,
    db: Session = Depends(SessionLocal),
    user = Depends(get_optional_user)
):
    sool = db.query(Sool).filter(Sool.id == sool_id).first()

    if not sool:
        raise HTTPException(status_code=404, detail="SOOL not found")

    # 📈 활동 로그 기록 (View)
    try:
        log = ActivityLog(
            user_id=user.id if user else None,
            sool_id=sool_id,
            action="view"
        )
        db.add(log)
        db.commit()
    except Exception as e:
        print(f"Failed to log activity: {e}")
        db.rollback()

    return sool
