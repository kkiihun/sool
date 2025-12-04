from pydantic import BaseModel

class ReviewCreate(BaseModel):
    rating: float
    notes: str | None = None
    sool_id: int

class ReviewResponse(BaseModel):
    id: int
    rating: float
    notes: str | None

    class Config:
        orm_mode = True
