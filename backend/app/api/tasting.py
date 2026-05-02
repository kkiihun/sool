from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.sool import Sool
from app.models.tasting_note import TastingNote
from app.schemas.tasting_schema import TastingCreate, TastingResponse

router = APIRouter(prefix="/tasting", tags=["Tasting"])


@router.get("/", response_model=list[TastingResponse])
def get_tasting_notes(
    sool_id: int | None = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(TastingNote)
    if sool_id is not None:
        query = query.filter(TastingNote.sool_id == sool_id)
    return query.order_by(TastingNote.id.desc()).all()


@router.post("/", response_model=TastingResponse, status_code=201)
def create_tasting(note: TastingCreate, db: Session = Depends(get_db)):
    sool_exists = db.query(Sool).filter(Sool.id == note.sool_id).first()
    if not sool_exists:
        raise HTTPException(status_code=404, detail=f"Sool ID {note.sool_id} not found")

    payload = note.model_dump(exclude_unset=True) if hasattr(note, "model_dump") else note.dict(exclude_unset=True)
    allowed = {"sool_id", "aroma", "sweetness", "acidity", "body", "finish", "comment", "rating"}
    data = {key: value for key, value in payload.items() if key in allowed}

    new_note = TastingNote(**data)
    db.add(new_note)
    db.commit()
    db.refresh(new_note)
    return new_note


@router.get("/profile/{sool_id}")
def tasting_profile(sool_id: int, db: Session = Depends(get_db)):
    result = (
        db.query(
            func.avg(TastingNote.aroma).label("aroma"),
            func.avg(TastingNote.sweetness).label("sweetness"),
            func.avg(TastingNote.acidity).label("acidity"),
            func.avg(TastingNote.body).label("body"),
            func.avg(TastingNote.finish).label("finish"),
        )
        .filter(TastingNote.sool_id == sool_id)
        .first()
    )

    if not result or all(value is None for value in result):
        return None

    return {
        "aroma": round(result.aroma or 0, 2),
        "sweetness": round(result.sweetness or 0, 2),
        "acidity": round(result.acidity or 0, 2),
        "body": round(result.body or 0, 2),
        "finish": round(result.finish or 0, 2),
    }


@router.get("/summary/{sool_id}")
def tasting_summary(sool_id: int, db: Session = Depends(get_db)):
    result = (
        db.query(
            func.count(TastingNote.id).label("count"),
            func.avg(TastingNote.rating).label("avg"),
        )
        .filter(TastingNote.sool_id == sool_id)
        .first()
    )

    return {
        "count": result.count,
        "avg": round(result.avg, 2) if result.avg is not None else None,
    }
