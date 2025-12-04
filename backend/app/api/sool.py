# app/api/sool.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.sool import Sool
from app.schemas.sool_schema import SoolResponse

router = APIRouter(prefix="/sool", tags=["Sool"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/", response_model=list[SoolResponse])
def get_sool_list(db: Session = Depends(get_db)):
    return db.query(Sool).all()


# 🚨 여기 추가된 상세 조회 API
@router.get("/{sool_id}", response_model=SoolResponse)
def get_sool_detail(sool_id: int, db: Session = Depends(get_db)):
    sool = db.query(Sool).filter(Sool.id == sool_id).first()

    if not sool:
        raise HTTPException(status_code=404, detail="Sool Not Found")

    return sool
