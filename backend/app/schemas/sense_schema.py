from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class SenseBase(BaseModel):
    sool_id: int
    user_id: Optional[int] = None
    
    # 감각 지표 (0.5 단위 슬라이더 지원을 위해 float)
    aroma: Optional[float] = 3.0
    sweetness: Optional[float] = 3.0
    acidity: Optional[float] = 3.0
    body: Optional[float] = 3.0
    aftertaste: Optional[float] = 3.0
    
    # 기타 지표 (필요시 사용)
    clarity: Optional[float] = None
    color: Optional[float] = None
    smoothness: Optional[float] = None
    carbonation: Optional[float] = None
    complexity: Optional[float] = None

    # 평점 및 메모
    rating: float
    notes: Optional[str] = None
    
    created_at: Optional[datetime] = None

class SenseResponse(SenseBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
