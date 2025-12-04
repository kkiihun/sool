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

    # ↙ MUST be inside class
    reviews = relationship("Review", backref="sool", cascade="all, delete")

    # ↙ THIS MUST BE HERE
    sense_notes = relationship("Sense", back_populates="sool", cascade="all, delete")
