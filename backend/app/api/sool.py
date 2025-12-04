# app/api/sool.py

from fastapi import APIRouter, Depends
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
