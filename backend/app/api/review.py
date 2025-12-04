from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.models.review import Review
from app.core.database import SessionLocal
from app.schemas.review_schema import ReviewCreate, ReviewResponse

router = APIRouter(prefix="/review", tags=["Review"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/", response_model=ReviewResponse)
def create_review(review: ReviewCreate, db: Session = Depends(get_db)):
    new_review = Review(
        rating=review.rating,
        notes=review.notes,
        sool_id=review.sool_id
    )
    db.add(new_review)
    db.commit()
    db.refresh(new_review)
    return new_review


@router.get("/{sool_id}", response_model=list[ReviewResponse])
def get_reviews(sool_id: int, db: Session = Depends(get_db)):
    return db.query(Review).filter(Review.sool_id == sool_id).all()
