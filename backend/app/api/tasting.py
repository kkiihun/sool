from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.tasting_note import TastingNote
from app.models.sool import Sool
from app.schemas.tasting_schema import TastingCreate, TastingResponse

router = APIRouter(prefix="/tasting", tags=["Tasting"])


# DB dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# GET: fetch all tasting notes
@router.get("/", response_model=list[TastingResponse])
def get_tasting_notes(db: Session = Depends(get_db)):
    return db.query(TastingNote).all()


# POST: create a new tasting note
@router.post("/", response_model=TastingResponse, status_code=201)
def create_tasting(note: TastingCreate, db: Session = Depends(get_db)):

    # ❗ Validation: referenced Sool must exist
    sool_exists = db.query(Sool).filter(Sool.id == note.sool_id).first()
    if not sool_exists:
        raise HTTPException(status_code=404, detail=f"Sool ID {note.sool_id} not found")

    new_note = TastingNote(**note.dict())
    db.add(new_note)
    db.commit()
    db.refresh(new_note)

    return new_note
