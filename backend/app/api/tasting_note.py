from fastapi import APIRouter, Depends, HTTPException
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


@router.post("/note", response_model=TastingNoteResponse)
def create_note(data: TastingNoteCreate, db: Session = Depends(get_db)):
    payload = data.model_dump() if hasattr(data, "model_dump") else data.dict()
    note = TastingNote(**payload)
    db.add(note)
    db.commit()
    db.refresh(note)
    return note


@router.get("/note/all", response_model=list[TastingNoteResponse])
def list_notes(db: Session = Depends(get_db)):
    return db.query(TastingNote).order_by(TastingNote.id.desc()).all()


@router.get("/note/{note_id}", response_model=TastingNoteResponse)
def get_note(note_id: int, db: Session = Depends(get_db)):
    note = db.query(TastingNote).filter(TastingNote.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return note


@router.put("/note/{note_id}", response_model=TastingNoteResponse)
def update_note(note_id: int, data: TastingNoteCreate, db: Session = Depends(get_db)):
    note = db.query(TastingNote).filter(TastingNote.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    payload = data.model_dump() if hasattr(data, "model_dump") else data.dict()
    for key, value in payload.items():
        setattr(note, key, value)

    db.commit()
    db.refresh(note)
    return note


@router.delete("/note/{note_id}")
def delete_note(note_id: int, db: Session = Depends(get_db)):
    note = db.query(TastingNote).filter(TastingNote.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    db.delete(note)
    db.commit()
    return {"status": "deleted", "id": note_id}
