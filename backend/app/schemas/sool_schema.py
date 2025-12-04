# app/schemas/sool_schema.py

from pydantic import BaseModel
from typing import Optional


class SoolBase(BaseModel):
    name: str
    category: Optional[str] = None
    abv: Optional[float] = None
    region: Optional[str] = None


class SoolResponse(SoolBase):
    id: int
    name: str
    abv: float | None = None
    category: str | None = None
    region: str | None = None

    class Config:
        orm_mode = True
