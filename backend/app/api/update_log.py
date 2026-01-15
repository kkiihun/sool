# backend/app/api/update_log.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc  # ✅ 추가

from app.core.database import get_db
from app.schemas.update_schema import UpdateCreate, UpdateResponse
from app.models.update import Update

router = APIRouter(prefix="/updates", tags=["Updates"])


@router.post("/", response_model=UpdateResponse)
def create_update(payload: UpdateCreate, db: Session = Depends(get_db)):
    row = Update(message=payload.message, source="ui")
    db.add(row)
    db.commit()
    db.refresh(row)

    # 프론트가 기대하는 timestamp 이름 유지
    return UpdateResponse(message=row.message, timestamp=row.created_at.strftime("%Y-%m-%d %H:%M:%S"))


@router.get("/", response_model=list[UpdateResponse])
def list_updates(db: Session = Depends(get_db)):
    rows = (
        db.query(Update)
        # ✅ 최신 날짜(created_at) 기준 정렬 + 동시간대는 id로 안정 정렬
        .order_by(desc(Update.created_at), desc(Update.id))
        .limit(200)
        .all()
    )
    return [
        UpdateResponse(
            message=r.message,
            timestamp=r.created_at.strftime("%Y-%m-%d %H:%M:%S"),
        )
        for r in rows
    ]
