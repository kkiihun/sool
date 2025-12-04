from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.sense import Sense
from app.schemas.sense_schema import SenseBase as SenseCreate, SenseResponse


router = APIRouter(prefix="/sense", tags=["Sense"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=SenseResponse)
def add_sense(payload: SenseCreate, db: Session = Depends(get_db)):
    new_note = Sense(**payload.dict())
    db.add(new_note)
    db.commit()
    db.refresh(new_note)
    return new_note


@router.get("/", response_model=list[SenseResponse])
def get_sense(db: Session = Depends(get_db)):
    return db.query(Sense).all()
