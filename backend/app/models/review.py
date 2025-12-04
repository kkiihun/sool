from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    rating = Column(Float, nullable=False)
    notes = Column(String, nullable=True)

    sool_id = Column(Integer, ForeignKey("sool.id"))
