from fastapi import APIRouter, Depends, Body
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_optional_user
from app.models.activity import ActivityLog
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/activity", tags=["Activity"])

class ActivityCreate(BaseModel):
    sool_id: Optional[int] = None
    action: str
    query: Optional[str] = None

@router.post("/log")
def log_activity(
    data: ActivityCreate,
    db: Session = Depends(get_db),
    user = Depends(get_optional_user)
):
    log = ActivityLog(
        user_id=user.id if user else None,
        sool_id=data.sool_id,
        action=data.action,
        query=data.query
    )
    db.add(log)
    db.commit()
    return {"status": "ok"}
