# app/api/sool.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from app.core.database import SessionLocal
from app.models.sool import Sool
from app.schemas.sool_schema import SoolCreate, SoolResponse

router = APIRouter(prefix="/sool", tags=["Sool"])


# DB 세션 함수
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ------------------------
# 📌 CREATE Sool
# ------------------------
@router.post("/", response_model=SoolResponse)
def create_sool(payload: SoolCreate, db: Session = Depends(get_db)):
    existing = db.query(Sool).filter(Sool.name == payload.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="이미 등록된 술입니다.")

    new_sool = Sool(
        name=payload.name,
        category=payload.category,
        abv=payload.abv,
        region=payload.region,
    )

    db.add(new_sool)
    db.commit()
    db.refresh(new_sool)
    return new_sool


# ------------------------
# 📌 GET Regions (필터 옵션용)
# ------------------------
@router.get("/regions")
def get_regions(db: Session = Depends(get_db)):
    regions = db.query(Sool.region).distinct().all()
    cleaned = sorted(set([r[0] for r in regions if r[0] and r[0] != "미등록"]))
    return ["전체"] + cleaned


# ------------------------
# 📌 GET All
# ------------------------
@router.get("/", response_model=list[SoolResponse])
def get_sool_list(db: Session = Depends(get_db)):
    return db.query(Sool).all()


# ------------------------
# 📌 Search (2글자 이상)
# ------------------------
@router.get("/search", response_model=list[SoolResponse])
def search_sool(q: str, db: Session = Depends(get_db)):
    if len(q) < 2:
        return []

    return db.query(Sool).filter(Sool.name.like(f"%{q}%")).all()


# ------------------------
# 📌 Filter + Sorting (Frontend 통합 API)
# ------------------------
@router.get("/filter", response_model=list[SoolResponse])
def filter_sool(
    q: Optional[str] = None,
    region: Optional[str] = None,
    category: Optional[str] = None,
    order: Optional[str] = "name",
    db: Session = Depends(get_db),
):
    query = db.query(Sool)

    # 검색
    if q and len(q) >= 2:
        query = query.filter(Sool.name.like(f"%{q}%"))

    # 지역 필터링
    if region and region != "전체":
        query = query.filter(Sool.region == region)

    # 카테고리 필터링
    if category and category != "":
        query = query.filter(Sool.category == category)

    # 정렬
    if order == "abv_low":
        query = query.order_by(Sool.abv.asc())
    elif order == "abv_high":
        query = query.order_by(Sool.abv.desc())
    else:  # default: name
        query = query.order_by(Sool.name.asc())

    return query.all()


# ------------------------
# 📌 상세 조회
# ------------------------
@router.get("/{sool_id}", response_model=SoolResponse)
def get_sool_detail(sool_id: int, db: Session = Depends(get_db)):
    sool = db.query(Sool).filter(Sool.id == sool_id).first()

    if not sool:
        raise HTTPException(status_code=404, detail="Sool Not Found")

    return sool
