from pydantic import BaseModel, Field

class TastingNoteCreate(BaseModel):
    sool_id: int
    aroma: float | None = Field(None, ge=0, le=5)
    sweetness: float | None = Field(None, ge=0, le=5)
    acidity: float | None = Field(None, ge=0, le=5)
    body: float | None = Field(None, ge=0, le=5)
    finish: float | None = Field(None, ge=0, le=5)
    comment: str | None = None

class TastingNoteResponse(TastingNoteCreate):
    id: int

    model_config = {"from_attributes": True}
