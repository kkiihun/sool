from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.tasting_note import TastingNote
from app.models.user import User
from app.models.sool import Sool
from app.core.deps import get_current_user, get_optional_user
from app.schemas.tasting_note import TastingNoteCreate, TastingNoteResponse

router = APIRouter(prefix="/sense", tags=["Sense (Legacy Redirect)"])

# 🔹 1. 새로운 테이스팅 노트 등록
@router.post("/", response_model=TastingNoteResponse)
def add_sense(
    payload: TastingNoteCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    data = payload.model_dump(exclude_none=True)
    data["user_id"] = current_user.id
    
    # field mapping if necessary (e.g. aftertaste -> finish)
    if "aftertaste" in data:
        data["finish"] = data.pop("aftertaste")
        
    new_note = TastingNote(**data)
    db.add(new_note)
    db.commit()
    db.refresh(new_note)
    return new_note

# 🔹 2. 특정 술(sool_id)의 감각 노트 목록 조회
@router.get("/list", response_model=List[TastingNoteResponse])
def get_sense_list(
    sool_id: Optional[int] = Query(None),
    mine: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    query = db.query(TastingNote)
    if sool_id is not None:
        query = query.filter(TastingNote.sool_id == sool_id)
    
    if mine and current_user:
        query = query.filter(TastingNote.user_id == current_user.id)
        
    return query.order_by(TastingNote.created_at.desc()).all()

# 🔹 3. 내 전체 목록 조회
@router.get("/", response_model=List[dict])
def get_my_senses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    results = db.query(TastingNote, Sool.name.label("sool_name"))\
        .join(Sool, TastingNote.sool_id == Sool.id)\
        .filter(TastingNote.user_id == current_user.id)\
        .order_by(TastingNote.created_at.desc()).all()
    
    output = []
    for note, sool_name in results:
        d = {c.name: getattr(note, c.name) for c in note.__table__.columns}
        d["sool_name"] = sool_name
        output.append(d)
    return output

# 🔹 4. 상세 조회
@router.get("/{sense_id}", response_model=TastingNoteResponse)
async def get_sense_detail(sense_id: int, db: Session = Depends(get_db)):
    note = db.query(TastingNote).filter(TastingNote.id == sense_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Not found")
    return note
