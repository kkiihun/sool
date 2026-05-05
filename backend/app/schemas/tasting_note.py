from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class TastingNoteBase(BaseModel):
    sool_id: int
    user_id: Optional[int] = None
    
    # 🧠 감각 지표 (Standardized)
    # Core 5
    aroma: Optional[float] = 3.0
    sweetness: Optional[float] = 3.0
    acidity: Optional[float] = 3.0
    body: Optional[float] = 3.0
    finish: Optional[float] = 3.0
    
    # Extra 5
    clarity: Optional[float] = None
    color: Optional[float] = None
    smoothness: Optional[float] = None
    carbonation: Optional[float] = None
    complexity: Optional[float] = None

    # Legacy compatibility
    texture: Optional[float] = None
    flavor: Optional[float] = None

    # ⭐ 평점 및 메모
    rating: float = 3.0
    notes: Optional[str] = None

class TastingNoteCreate(TastingNoteBase):
    pass

class TastingNoteUpdate(BaseModel):
    aroma: Optional[float] = None
    sweetness: Optional[float] = None
    acidity: Optional[float] = None
    body: Optional[float] = None
    finish: Optional[float] = None
    clarity: Optional[float] = None
    color: Optional[float] = None
    smoothness: Optional[float] = None
    carbonation: Optional[float] = None
    complexity: Optional[float] = None
    rating: Optional[float] = None
    notes: Optional[str] = None

class TastingNoteResponse(TastingNoteBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
