from pydantic import BaseModel

class TastingNoteCreate(BaseModel):
    sool_id: int
    aroma: float | None = None
    sweetness: float | None = None
    acidity: float | None = None
    body: float | None = None
    finish: float | None = None
    comment: str | None = None

class TastingNoteResponse(TastingNoteCreate):
    id: int

    class Config:
        from_attributes = True  # orm_mode(v1) 대체
