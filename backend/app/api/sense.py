from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.sense import Sense
from app.schemas.sense_schema import SenseResponse

router = APIRouter(prefix="/sense", tags=["Sense"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/", response_model=list[SenseResponse])
def get_sense_data(db: Session = Depends(get_db)):
    return db.query(Sense).all()
