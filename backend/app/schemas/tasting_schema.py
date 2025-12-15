from pydantic import BaseModel

class TastingCreate(BaseModel):
    sool_id: int
    aroma: float | None = None
    sweetness: float | None = None
    acidity: float | None = None
    body: float | None = None
    finish: float | None = None
    comment: str | None = None

class TastingResponse(TastingCreate):
    id: int

    class Config:
        orm_mode = True
