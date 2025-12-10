# backend/app/schemas/update_schema.py
from pydantic import BaseModel

class UpdateCreate(BaseModel):
    message: str

class UpdateResponse(BaseModel):
    message: str
    timestamp: str  # "2025-12-10 23:11:22" 형식
