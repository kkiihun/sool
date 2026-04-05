from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.sense import Sense
from app.models.user import User
from app.models.sool import Sool
from app.core.deps import get_current_user, get_optional_user
from app.schemas.sense_schema import SenseBase as SenseCreate, SenseResponse

router = APIRouter(prefix="/sense", tags=["Sense"])

# 🔹 1. 새로운 테이스팅 노트 등록
@router.post("/", response_model=SenseResponse)
def add_sense(
    payload: SenseCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # payload에서 dictionary를 추출하여 Sense 모델 생성
    data = payload.model_dump(exclude_none=True)
    data["user_id"] = current_user.id
    new_note = Sense(**data)
    db.add(new_note)
    db.commit()
    db.refresh(new_note)
    return new_note

# 🔹 2. 특정 술(sool_id)의 감각 노트 목록 조회 (공개 리뷰용 또는 내 리뷰 필터)
@router.get("/list", response_model=List[SenseResponse])
def get_sense_list(
    sool_id: Optional[int] = Query(None),
    mine: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    query = db.query(Sense)
    if sool_id is not None:
        query = query.filter(Sense.sool_id == sool_id)
    
    if mine and current_user:
        query = query.filter(Sense.user_id == current_user.id)
        
    return query.order_by(Sense.created_at.desc()).all()

# 🔹 3. 내 전체 목록 조회 (Personal Vault 전용)
@router.get("/", response_model=List[dict])
def get_my_senses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    results = db.query(Sense, Sool.name.label("sool_name"))\
        .join(Sool, Sense.sool_id == Sool.id)\
        .filter(Sense.user_id == current_user.id)\
        .order_by(Sense.created_at.desc()).all()
    
    output = []
    for sense, sool_name in results:
        d = {c.name: getattr(sense, c.name) for c in sense.__table__.columns}
        d["sool_name"] = sool_name
        output.append(d)
    return output

# 🔹 4. 상세 조회
@router.get("/{sense_id}", response_model=SenseResponse)
async def get_sense_detail(sense_id: int, db: Session = Depends(get_db)):
    sense = db.query(Sense).filter(Sense.id == sense_id).first()
    if not sense:
        raise HTTPException(status_code=404, detail="Not found")
    return sense
