from pydantic import BaseModel
from typing import Optional

class SenseBase(BaseModel):
    sool_id: int
    clarity: float
    color: float
    aroma: float
    sweetness: float
    smoothness: float
    rating: Optional[float] = None
    notes: Optional[str] = None
    date: Optional[str] = None   # 👈 여기서 date 타입을 date가 아니라 str 로 유지

class SenseResponse(SenseBase):
    id: int

    class Config:
        from_attributes = True
