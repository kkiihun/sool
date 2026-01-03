from pydantic import BaseModel
from typing import Optional, List

# 기본 구조 유지
class SoolBase(BaseModel):
    name: str
    category: Optional[str] = None
    abv: Optional[float] = None
    region: Optional[str] = None

    class Config:
        from_attributes = True   # Pydantic v2 대응


class SoolCreate(SoolBase):
    pass


class SoolResponse(SoolBase):
    id: int

    class Config:
        from_attributes = True


# ⭐ 여기 아래 추가!
class SoolWithStats(SoolResponse):
    review_count: int
    avg_rating: Optional[float] = None


class PaginatedSool(BaseModel):
    total: int
    items: List[SoolResponse]

class SenseProfile(BaseModel):
    aroma: float | None
    sweetness: float | None
    acidity: float | None
    body: float | None
    finish: float | None


class SoolWithStats(BaseModel):
    id: int
    name: str
    category: str | None
    abv: float | None
    region: str | None

    review_count: int
    sense: SenseProfile | None

class RadarAvg(BaseModel):
    aroma: float | None = None
    sweetness: float | None = None
    acidity: float | None = None
    body: float | None = None
    finish: float | None = None  # = aftertaste 평균을 finish로 내려줌(프론트 표준화)

class SoolSummaryResponse(BaseModel):
    sool_id: int
    avg_rating: float | None = None
    count: int
    radar_avg: RadarAvg
