from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import SessionLocal
from app.models.sense import Sense
from app.schemas.sense_schema import SenseBase as SenseCreate, SenseResponse

router = APIRouter(prefix="/sense", tags=["Sense"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 🔹 1. 새로운 테이스팅 노트 등록
@router.post("/", response_model=SenseResponse)
def add_sense(payload: SenseCreate, db: Session = Depends(get_db)):
    # payload에서 dictionary를 추출하여 Sense 모델 생성
    new_note = Sense(**payload.model_dump(exclude_none=True))
    db.add(new_note)
    db.commit()
    db.refresh(new_note)
    return new_note

# 🔹 2. 특정 술(sool_id)의 감각 노트 목록 조회
@router.get("/list", response_model=List[SenseResponse])
def get_sense_list(
    sool_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Sense)
    if sool_id is not None:
        query = query.filter(Sense.sool_id == sool_id)
    return query.order_by(Sense.created_at.desc()).all()

# 🔹 3. 전체 목록 조회 (기존 유지)
@router.get("/", response_model=List[SenseResponse])
def get_all_senses(db: Session = Depends(get_db)):
    return db.query(Sense).all()

# 🔹 4. 상세 조회
@router.get("/{sense_id}", response_model=SenseResponse)
async def get_sense_detail(sense_id: int, db: Session = Depends(get_db)):
    sense = db.query(Sense).filter(Sense.id == sense_id).first()
    if not sense:
        raise HTTPException(status_code=404, detail="Not found")
    return sense
