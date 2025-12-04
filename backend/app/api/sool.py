# app/api/sool.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.sool import Sool
from app.schemas.sool_schema import SoolCreate, SoolResponse

router = APIRouter(prefix="/sool", tags=["Sool"])


# DB 세션 주입 함수
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ------------------------
# 📌 CREATE Sool (POST)
# ------------------------
@router.post("/", response_model=SoolResponse)
def create_sool(payload: SoolCreate, db: Session = Depends(get_db)):
    # 🔍 중복 검사
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
# 📌 GET All Sool
# ------------------------
@router.get("/", response_model=list[SoolResponse])
def get_sool_list(db: Session = Depends(get_db)):
    return db.query(Sool).all()


# 🚨 여기 추가된 상세 조회 API
@router.get("/{sool_id}", response_model=SoolResponse)
def get_sool_detail(sool_id: int, db: Session = Depends(get_db)):
    sool = db.query(Sool).filter(Sool.id == sool_id).first()

    if not sool:
        raise HTTPException(status_code=404, detail="Sool Not Found")

    return sool
