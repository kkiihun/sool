from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.tasting_note import TastingNote
from app.schemas.tasting_note import TastingNoteCreate, TastingNoteResponse

router = APIRouter(prefix="/v2/tasting", tags=["Tasting"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# -------------------------------
# 1) Create Tasting Note (등록)
# -------------------------------
@router.post("/note", response_model=TastingNoteResponse)
def create_note(data: TastingNoteCreate, db: Session = Depends(get_db)):
    note = TastingNote(**data.dict())
    db.add(note)
    db.commit()
    db.refresh(note)
    return note

# -------------------------------
# 2) Get All Notes (조회) ← 새로 추가!
# -------------------------------
@router.get("/note/all")
def list_notes(db: Session = Depends(get_db)):
    return db.query(TastingNote).all()
