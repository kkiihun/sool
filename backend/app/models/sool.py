from sqlalchemy import Column, Integer, String, Float
from sqlalchemy.orm import relationship
from app.core.database import Base

class Sool(Base):
    __tablename__ = "sool"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    category = Column(String)
    abv = Column(Float)
    region = Column(String)

    description = Column(String, nullable=True)
    producer = Column(String, nullable=True)
    ingredients = Column(String, nullable=True)

    # 🔥 FIXED: relationship 충돌 해결
    reviews = relationship("Review", back_populates="sool", cascade="all, delete")

    sense_notes = relationship("Sense", back_populates="sool", cascade="all, delete")
