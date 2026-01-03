from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.models.tasting_note import TastingNote
from app.models.sool import Sool
from app.schemas.tasting_schema import TastingCreate, TastingResponse

router = APIRouter(prefix="/tasting", tags=["Tasting"])


# -------------------------------------------------
# 📌 GET: 테이스팅 노트 조회 (sool_id 선택 필터)
# -------------------------------------------------
@router.get("/", response_model=list[TastingResponse])
def get_tasting_notes(
    sool_id: int | None = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(TastingNote)

    if sool_id:
        q = q.filter(TastingNote.sool_id == sool_id)

    return q.order_by(TastingNote.id.desc()).all()


# -------------------------------------------------
# 📌 POST: 테이스팅 노트 생성
# -------------------------------------------------
@router.post("/", response_model=TastingResponse, status_code=201)
def create_tasting(note: TastingCreate, db: Session = Depends(get_db)):

    sool_exists = db.query(Sool).filter(Sool.id == note.sool_id).first()
    if not sool_exists:
        raise HTTPException(
            status_code=404,
            detail=f"Sool ID {note.sool_id} not found"
        )

    new_note = TastingNote(**note.dict())
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

    if not result or all(v is None for v in result):
        return None

    return {
        "aroma": round(result.aroma or 0, 2),
        "sweetness": round(result.sweetness or 0, 2),
        "acidity": round(result.acidity or 0, 2),
        "body": round(result.body or 0, 2),
        "finish": round(result.finish or 0, 2),
    }



# -------------------------------------------------
# ⭐ GET: 평균 별점 요약 (프론트 핵심)
# -------------------------------------------------
@router.get("/summary/{sool_id}")
def tasting_summary(sool_id: int, db: Session = Depends(get_db)):

    result = (
        db.query(
            func.count(TastingNote.id).label("count"),
            func.avg(TastingNote.rating).label("avg")
        )
        .filter(TastingNote.sool_id == sool_id)
        .first()
    )

    return {
        "count": result.count,
        "avg": round(result.avg, 2) if result.avg else 0,
    }
