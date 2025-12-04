from sqlalchemy import Column, Integer, Float, ForeignKey
from app.core.database import Base

class Tasting(Base):
    __tablename__ = "tasting"

    id = Column(Integer, primary_key=True, index=True)
    sool_id = Column(Integer, ForeignKey("sool.id"))
    sweetness = Column(Float)
    acidity = Column(Float)
    body = Column(Float)
    aroma = Column(Float)
    aftertaste = Column(Float)
