# backend/app/schemas/tasting_schema.py
from pydantic import BaseModel

class TastingCreate(BaseModel):
    sool_id: int
    rating: int  # ✅ 필수 (DB nullable=False)

    aroma: float | None = None
    flavor: float | None = None
    body: float | None = None
    texture: float | None = None
    finish: float | None = None

    notes: str | None = None  # ✅ comment -> notes로 통일

class TastingResponse(TastingCreate):
    id: int

    class Config:
        orm_mode = True
