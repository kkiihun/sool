# backend/app/schemas/tasting_schema.py
from pydantic import BaseModel, Field

class TastingCreate(BaseModel):
    sool_id: int

    aroma: float | None = Field(None, ge=0, le=5)
    sweetness: float | None = Field(None, ge=0, le=5)
    acidity: float | None = Field(None, ge=0, le=5)
    body: float | None = Field(None, ge=0, le=5)
    finish: float | None = Field(None, ge=0, le=5)

    comment: str | None = None

class TastingResponse(TastingCreate):
    id: int

    model_config = {"from_attributes": True}
