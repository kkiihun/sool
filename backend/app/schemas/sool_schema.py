from pydantic import BaseModel

class SoolBase(BaseModel):
    name: str
    category: str | None = None
    abv: float | None = None
    region: str | None = None


class SoolCreate(SoolBase):
    pass


class SoolResponse(SoolBase):
    id: int

    class Config:
        from_attributes = True  # ← pydantic v2 대응(orm_mode 대체)


class PaginatedSool(BaseModel):
    total: int
    items: list[SoolResponse]
