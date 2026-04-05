from app.models.sense import Sense
from app.schemas.sool_schema import SoolSummaryResponse, RadarAvg


from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional

from app.core.database import get_db
from app.models.sool import Sool
from app.models.tasting_note import TastingNote
from app.schemas.sool_schema import (
    SoolCreate,
    SoolResponse,
    PaginatedSool,
    SoolWithStats,
)

router = APIRouter(prefix="/sool", tags=["Sool"])


# ------------------------
# 📌 CREATE
# ------------------------
@router.post("/", response_model=SoolResponse)
def create_sool(payload: SoolCreate, db: Session = Depends(get_db)):

    if db.query(Sool).filter(Sool.name == payload.name).first():
        raise HTTPException(status_code=400, detail="이미 등록된 술입니다.")

    new_sool = Sool(**payload.dict())
    db.add(new_sool)
    db.commit()
    db.refresh(new_sool)
    return new_sool


# ------------------------
# 📌 메인 카드 + Radar
# ------------------------
@router.get("/catalog", response_model=list[SoolWithStats])
def list_sool_catalog(db: Session = Depends(get_db)):

    latest_note_subq = (
        db.query(
            TastingNote.sool_id,
            func.max(TastingNote.id).label("latest_id"),
        )
        .group_by(TastingNote.sool_id)
        .subquery()
    )

    count_subq = (
        db.query(
            TastingNote.sool_id,
            func.count(TastingNote.id).label("review_count"),
        )
        .group_by(TastingNote.sool_id)
        .subquery()
    )

    rows = (
        db.query(
            Sool.id,
            Sool.name,
            Sool.category,
            Sool.abv,
            Sool.region,
            func.coalesce(count_subq.c.review_count, 0).label("review_count"),
            TastingNote.aroma,
            TastingNote.sweetness,
            TastingNote.acidity,
            TastingNote.body,
            TastingNote.finish,
        )
        .outerjoin(count_subq, count_subq.c.sool_id == Sool.id)
        .outerjoin(latest_note_subq, latest_note_subq.c.sool_id == Sool.id)
        .outerjoin(TastingNote, TastingNote.id == latest_note_subq.c.latest_id)
        .order_by(Sool.name.asc())
        .all()
    )

    return [
        SoolWithStats(
            id=r.id,
            name=r.name,
            category=r.category,
            abv=r.abv,
            region=r.region,
            review_count=r.review_count,
            sense={
                "aroma": r.aroma,
                "sweetness": r.sweetness,
                "acidity": r.acidity,
                "body": r.body,
                "finish": r.finish,
            } if r.aroma is not None else None,
        )
        for r in rows
    ]


# ------------------------
# 📌 지역 목록
# ------------------------
@router.get("/regions", response_model=list[str])
def get_regions(db: Session = Depends(get_db)):
    regions = db.query(Sool.region).distinct().all()
    cleaned = sorted({r[0] for r in regions if r[0] and r[0] != "미등록"})
    return ["전체"] + cleaned


# ------------------------
# 📌 전체 조회
# ------------------------
@router.get("/all", response_model=list[SoolResponse])
def get_all_sool(db: Session = Depends(get_db)):
    return db.query(Sool).order_by(Sool.name.asc()).all()


# ------------------------
# 📌 검색
# ------------------------
@router.get("/search", response_model=list[SoolResponse])
def search_sool(
    q: str = Query(..., min_length=2),
    db: Session = Depends(get_db),
):
    return db.query(Sool).filter(Sool.name.like(f"%{q}%")).all()


# ------------------------
# 📌 필터 + 페이지네이션
# ------------------------
@router.get("/filter", response_model=PaginatedSool)
def filter_sool(
    q: Optional[str] = None,
    region: Optional[str] = None,
    category: Optional[str] = None,
    order: str = "name",
    page: int = Query(1, ge=1),
    page_size: int = Query(24, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(Sool)

    if q and len(q) >= 2:
        query = query.filter(Sool.name.like(f"%{q}%"))

    if region and region != "전체":
        query = query.filter(Sool.region == region)

    if category and category.strip():
        query = query.filter(Sool.category == category)

    if order == "abv_low":
        query = query.order_by(Sool.abv.asc())
    elif order == "abv_high":
        query = query.order_by(Sool.abv.desc())
    else:
        query = query.order_by(Sool.name.asc())

    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()

    return PaginatedSool(total=total, items=items)

# ------------------------
# 📌 sool_id/summary
# ------------------------
@router.get("/{sool_id}/summary", response_model=SoolSummaryResponse)
def get_sool_summary(sool_id: int, db: Session = Depends(get_db)):
    # 존재 확인(제품 없으면 404)
    exists = db.query(Sool.id).filter(Sool.id == sool_id).first()
    if not exists:
        raise HTTPException(status_code=404, detail="Sool Not Found")

    row = (
        db.query(
            func.count(Sense.id).label("count"),
            func.avg(Sense.rating).label("avg_rating"),
            func.avg(Sense.aroma).label("avg_aroma"),
            func.avg(Sense.sweetness).label("avg_sweetness"),
            func.avg(Sense.acidity).label("avg_acidity"),
            func.avg(Sense.body).label("avg_body"),
            func.avg(Sense.aftertaste).label("avg_aftertaste"),
        )
        .filter(Sense.sool_id == sool_id)
        .one()
    )

    return SoolSummaryResponse(
        sool_id=sool_id,
        avg_rating=float(row.avg_rating) if row.avg_rating is not None else None,
        count=int(row.count or 0),
        radar_avg=RadarAvg(
            aroma=float(row.avg_aroma) if row.avg_aroma is not None else None,
            sweetness=float(row.avg_sweetness) if row.avg_sweetness is not None else None,
            acidity=float(row.avg_acidity) if row.avg_acidity is not None else None,
            body=float(row.avg_body) if row.avg_body is not None else None,
            finish=float(row.avg_aftertaste) if row.avg_aftertaste is not None else None,
        ),
    )


# ------------------------
# 📌 신상 주류 (최근 등록 10개)
# ------------------------
@router.get("/new-arrivals", response_model=list[SoolResponse])
def get_new_arrivals(db: Session = Depends(get_db)):
    return db.query(Sool).order_by(Sool.id.desc()).limit(10).all()


# ------------------------
# 📌 통계 (대시보드용)
# ------------------------
@router.get("/stats")
def get_sool_stats(db: Session = Depends(get_db)):
    try:
        total_count = db.query(Sool).count()
        avg_abv_val = db.query(func.avg(Sool.abv)).scalar()
        avg_abv = round(float(avg_abv_val), 1) if avg_abv_val is not None else 0
        
        # 카테고리 분포
        cat_dist = (
            db.query(Sool.category, func.count(Sool.id))
            .group_by(Sool.category)
            .all()
        )
        category_data = [{"name": c[0] or "Unknown", "value": c[1]} for c in cat_dist]
        
        # 지역 분포 (상위 10개)
        reg_dist = (
            db.query(Sool.region, func.count(Sool.id))
            .group_by(Sool.region)
            .order_by(func.count(Sool.id).desc())
            .limit(10)
            .all()
        )
        region_data = [{"name": r[0] or "Unknown", "value": r[1]} for r in reg_dist]
        
        # 리뷰 총수
        total_reviews = db.query(Sense).count()
        
        return {
            "total_sool": total_count,
            "avg_abv": avg_abv,
            "total_reviews": total_reviews,
            "category_distribution": category_data,
            "region_distribution": region_data,
        }
    except Exception as e:
        print(f"Error in /stats: {e}")
        return {
            "total_sool": 0,
            "avg_abv": 0,
            "total_reviews": 0,
            "category_distribution": [],
            "region_distribution": [],
            "error": str(e)
        }


# ------------------------
# 📌 상세 조회 (충돌 방지)
# ------------------------
@router.get("/by-id/{sool_id}", response_model=SoolResponse)
def get_sool_detail(sool_id: int, db: Session = Depends(get_db)):
    sool = db.query(Sool).filter(Sool.id == sool_id).first()

    if not sool:
        raise HTTPException(status_code=404, detail="Sool Not Found")

    return sool


print("🔥 LOADED NEW SOOL ROUTER (catalog version)")
