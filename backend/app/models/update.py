# backend/app/models/update.py
from sqlalchemy import Column, Integer, String, DateTime, func
from app.core.database import Base

class Update(Base):
    __tablename__ = "updates"

    id = Column(Integer, primary_key=True, index=True)
    message = Column(String(500), nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    source = Column(String(50), nullable=False, default="ui")
