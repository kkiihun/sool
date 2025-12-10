from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    sool_id = Column(Integer, ForeignKey("sool.id"), nullable=False)
    rating = Column(Float, nullable=False)
    notes = Column(String, nullable=True)   # ← comment 대신 notes 사용
    created_at = Column(DateTime, default=datetime.utcnow)

    sool = relationship("Sool", back_populates="reviews")

