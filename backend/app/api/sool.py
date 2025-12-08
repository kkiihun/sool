from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.models.sool import Sool
from app.schemas.sool_schema import SoolCreate, SoolResponse, PaginatedSool

router = APIRouter(prefix="/sool", tags=["Sool"])


# ------------------------
# 📌 CREATE (Insert new sool)
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
# 📌 필터 옵션: 지역 목록
# ------------------------
@router.get("/regions", response_model=list[str])
def get_regions(db: Session = Depends(get_db)):
    regions = db.query(Sool.region).distinct().all()
    cleaned = sorted({r[0] for r in regions if r[0] and r[0] != "미등록"})
    return ["전체"] + cleaned


# ------------------------
# 📌 전체 조회 (페이징 X) → 관리자/백업용
# ------------------------
@router.get("/all", response_model=list[SoolResponse])
def get_all_sool(db: Session = Depends(get_db)):
    return db.query(Sool).order_by(Sool.name.asc()).all()


# ------------------------
# 📌 검색 (2글자 이상)
# ------------------------
@router.get("/search", response_model=list[SoolResponse])
def search_sool(q: str = Query(min_length=2), db: Session = Depends(get_db)):
    return db.query(Sool).filter(Sool.name.like(f"%{q}%")).all()


# ------------------------
# 📌 필터 + 정렬 + 페이지네이션 통합 API
# ------------------------
@router.get("/filter", response_model=PaginatedSool)
def filter_sool(
    q: Optional[str] = None,
    region: Optional[str] = None,
    category: Optional[str] = None,
    order: Optional[str] = "name",
    page: int = 1,
    page_size: int = 24,
    db: Session = Depends(get_db),
):
    query = db.query(Sool)

    if q and len(q) >= 2:
        query = query.filter(Sool.name.like(f"%{q}%"))

    if region and region != "전체":
        query = query.filter(Sool.region == region)

    if category and category != "":
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
# 📌 상세 조회
# ------------------------
@router.get("/{sool_id}", response_model=SoolResponse)
def get_sool_detail(sool_id: int, db: Session = Depends(get_db)):
    sool = db.query(Sool).filter(Sool.id == sool_id).first()

    if not sool:
        raise HTTPException(status_code=404, detail="Sool Not Found")

    return sool
