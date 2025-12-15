from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class TastingNote(Base):
    __tablename__ = "tasting_note"

    id = Column(Integer, primary_key=True, index=True)
    sool_id = Column(Integer, ForeignKey("sool.id"), nullable=False)

    aroma = Column(Float, nullable=True)
    sweetness = Column(Float, nullable=True)
    acidity = Column(Float, nullable=True)
    body = Column(Float, nullable=True)
    finish = Column(Float, nullable=True)

    comment = Column(String, nullable=True)

    sool = relationship("Sool")  # relation back to Sool table
