from pydantic import BaseModel

class SenseResponse(BaseModel):
    id: int
    name: str
    sweetness: float | None = None
    aroma: float | None = None
    body: float | None = None
    acidity: float | None = None

    class Config:
        orm_mode = True
