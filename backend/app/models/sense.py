# backend/app/models/sense.py

from sqlalchemy import Column, Integer, Float, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Sense(Base):
    __tablename__ = "sense"

    id = Column(Integer, primary_key=True, index=True)
    sool_id = Column(Integer, ForeignKey("sool.id"), nullable=False)

    clarity = Column(Float, nullable=True)
    color = Column(Float, nullable=True)
    smoothness = Column(Float, nullable=True)
    aftertaste = Column(Float, nullable=True)
    aroma = Column(Float, nullable=True)
    sweetness = Column(Float, nullable=True)
    body = Column(Float, nullable=True)
    acidity = Column(Float, nullable=True)
    carbonation = Column(Float, nullable=True)
    complexity = Column(Float, nullable=True)

    rating = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)

    # ✅ MariaDB 대응 (VARCHAR 길이 필수)
    date = Column(String(10), nullable=True)

    sool = relationship("Sool", back_populates="sense_notes")
