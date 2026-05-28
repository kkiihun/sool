from pydantic import BaseModel
from typing import List, Optional

class TasteProfile(BaseModel):
    aroma: float
    sweetness: float
    acidity: float
    body: float
    finish: float

class ProductPerformance(BaseModel):
    id: int
    name: str
    avg_rating: Optional[float]
    review_count: int
    taste_profile: TasteProfile

class MarketComparison(BaseModel):
    category: str
    producer_avg: TasteProfile
    market_avg: TasteProfile

class ProducerSummary(BaseModel):
    producer_name: str
    total_products: int
    avg_rating: Optional[float]
    total_reviews: int

class B2BDashboardResponse(BaseModel):
    summary: ProducerSummary
    top_products: List[ProductPerformance]
    market_comparison: List[MarketComparison]
