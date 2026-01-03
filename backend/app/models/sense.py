# backend/app/models/sense.py

from sqlalchemy import Column, Integer, Float, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class Sense(Base):
    __tablename__ = "sense"

    id = Column(Integer, primary_key=True, index=True)

    # 🔑 평가 대상
    sool_id = Column(Integer, ForeignKey("sool.id"), nullable=False)

    # 🔑 평가 주체 (v1 핵심 추가)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    # 👉 v1에서는 nullable 허용 (기존 데이터 보호)
    # 👉 로그인 붙이면 nullable=False 로 강화

    # 🧠 감각 지표
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

    # ⭐ 종합 평점
    rating = Column(Float, nullable=True)

    # 📝 유저 노트
    notes = Column(Text, nullable=True)

    # ⏱️ 생성 시각 (date 대체)
    created_at = Column(DateTime, default=datetime.utcnow)

    # 관계
    sool = relationship("Sool", back_populates="sense_notes")
    user = relationship("User", back_populates="sense_notes")
