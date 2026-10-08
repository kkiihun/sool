from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import require_admin
from app.models.user import User
from app.models.sool import Sool
from app.models.tasting_note import TastingNote
from app.schemas.tasting_note import TastingNoteCreate, TastingNoteResponse

router = APIRouter(prefix="/v2/tasting", tags=["Tasting"])


def _get_note_or_404(db: Session, note_id: int) -> TastingNote:
    note = db.query(TastingNote).filter(TastingNote.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return note


def _ensure_sool_exists(db: Session, sool_id: int) -> None:
    if not db.query(Sool.id).filter(Sool.id == sool_id).first():
        raise HTTPException(status_code=404, detail=f"Sool ID {sool_id} not found")


# -------------------------------
# 1) Create Tasting Note (등록)
# -------------------------------
@router.post("/note", response_model=TastingNoteResponse)
def create_note(data: TastingNoteCreate, db: Session = Depends(get_db), _admin: User = Depends(require_admin)):
    _ensure_sool_exists(db, data.sool_id)
    note = TastingNote(**data.model_dump())
    db.add(note)
    db.commit()
    db.refresh(note)
    return note

# -------------------------------
# 2) Get All Notes (조회)
# -------------------------------
@router.get("/note/all", response_model=list[TastingNoteResponse])
def list_notes(db: Session = Depends(get_db)):
    return db.query(TastingNote).order_by(TastingNote.id.desc()).all()

# -------------------------------
# 3) 단건 조회
# -------------------------------
@router.get("/note/{note_id}", response_model=TastingNoteResponse)
def get_note(note_id: int, db: Session = Depends(get_db)):
    return _get_note_or_404(db, note_id)


# UPDATE
@router.put("/note/{note_id}", response_model=TastingNoteResponse)
def update_note(note_id: int, data: TastingNoteCreate, db: Session = Depends(get_db), _admin: User = Depends(require_admin)):
    note = _get_note_or_404(db, note_id)
    _ensure_sool_exists(db, data.sool_id)

    for key, value in data.model_dump().items():
        setattr(note, key, value)

    db.commit()
    db.refresh(note)
    return note


# DELETE
@router.delete("/note/{note_id}")
def delete_note(note_id: int, db: Session = Depends(get_db), _admin: User = Depends(require_admin)):
    note = _get_note_or_404(db, note_id)
    db.delete(note)
    db.commit()
    return {"status": "deleted", "id": note_id}
