from sqlalchemy import Column, Integer, Float, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class TastingNote(Base):
    __tablename__ = "tasting_notes"  # (선택) 복수형 권장

    id = Column(Integer, primary_key=True, index=True)
    sool_id = Column(Integer, ForeignKey("sool.id"), nullable=False)

    aroma = Column(Float, nullable=True)
    sweetness = Column(Float, nullable=True)
    acidity = Column(Float, nullable=True)
    body = Column(Float, nullable=True)
    finish = Column(Float, nullable=True)

    comment = Column(Text, nullable=True)  # ✅ 핵심 수정

    sool = relationship("Sool")
