from sqlalchemy import Column, Integer, String, Float
from app.core.database import Base

class Sool(Base):
    __tablename__ = "sool"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    category = Column(String)
    abv = Column(Float)
    region = Column(String)
