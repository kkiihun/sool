from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.models.review import Review
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.review import ReviewCreate, ReviewResponse

router = APIRouter(prefix="/review", tags=["Review"])


@router.post("/", response_model=ReviewResponse)
def create_review(
    review: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    new_review = Review(
        rating=review.rating,
        notes=review.notes,
        sool_id=review.sool_id,
        user_id=current_user.id,
    )
    db.add(new_review)
    db.commit()
    db.refresh(new_review)
    return new_review

# 🔹 리뷰 요약 데이터
@router.get("/summary/{sool_id}")
def get_review_summary(sool_id: int, db: Session = Depends(get_db)):
    reviews = db.query(Review).filter(Review.sool_id == sool_id).all()

    if not reviews:
        return {"avg": None, "count": 0}

    avg = sum([r.rating for r in reviews]) / len(reviews)
    return {"avg": round(avg, 1), "count": len(reviews)}

# 최신 리뷰 기능
@router.get("/latest", response_model=list[ReviewResponse])
def get_latest_reviews(db: Session = Depends(get_db)):
    reviews = (
        db.query(Review)
        .order_by(Review.created_at.desc())
        .limit(10)
        .all()
    )
    return reviews

# 리뷰 목록 가져오기 (/{sool_id} 는 /latest 보다 뒤에 선언해야 함)
@router.get("/{sool_id}", response_model=list[ReviewResponse])
def get_reviews(sool_id: int, db: Session = Depends(get_db)):
    return db.query(Review).filter(Review.sool_id == sool_id).all()
