from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.tasting_note import TastingNote
from app.schemas.tasting_note import TastingNoteCreate, TastingNoteResponse, TastingNoteUpdate

router = APIRouter(prefix="/v2/tasting", tags=["Tasting"])

# -------------------------------
# 1) Create Tasting Note (등록)
# -------------------------------
@router.post("/note", response_model=TastingNoteResponse)
def create_note(data: TastingNoteCreate, db: Session = Depends(get_db)):
    note = TastingNote(**data.model_dump(exclude_none=True))
    db.add(note)
    db.commit()
    db.refresh(note)
    return note

# -------------------------------
# 2) Get All Notes (조회)
# -------------------------------
@router.get("/note/all", response_model=List[TastingNoteResponse])
def list_notes(db: Session = Depends(get_db)):
    return db.query(TastingNote).order_by(TastingNote.id.desc()).all()

# -------------------------------
# 3) Get Note by ID
# -------------------------------
@router.get("/note/{note_id}", response_model=TastingNoteResponse)
def get_note(note_id: int, db: Session = Depends(get_db)):
    note = db.query(TastingNote).filter(TastingNote.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return note


@router.put("/note/{note_id}", response_model=TastingNoteResponse)
def update_note(note_id: int, data: TastingNoteUpdate, db: Session = Depends(get_db)):
    note = db.query(TastingNote).filter(TastingNote.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
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
