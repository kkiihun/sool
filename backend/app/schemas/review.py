from pydantic import BaseModel, Field
from datetime import datetime


# ⭐ 공통 필드
class ReviewBase(BaseModel):
    rating: float = Field(..., ge=1, le=5)  # ⭐ 1~5 범위 강제
    notes: str | None = None


# ⭐ 리뷰 생성할 때 받는 데이터
class ReviewCreate(ReviewBase):
    sool_id: int


# ⭐ 응답 형태
class ReviewResponse(ReviewBase):
    id: int
    sool_id: int
    created_at: datetime

    model_config = {
        "from_attributes": True
    }
