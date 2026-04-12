from sqlalchemy import Column, Integer, Float, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class TastingNote(Base):
    """
    [Standardized] 통합 시음 노트 모델
    Sense 모델의 10개 지표와 TastingNote의 finish 등을 통합
    """
    __tablename__ = "tasting_notes"

    id = Column(Integer, primary_key=True, index=True)
    sool_id = Column(Integer, ForeignKey("sool.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # 🧠 감각 지표 (Core 5 + Extra 5)
    # Core 5 (Recommender & Radar main)
    aroma = Column(Float, nullable=True, default=3.0)      # 향
    sweetness = Column(Float, nullable=True, default=3.0)  # 단맛
    acidity = Column(Float, nullable=True, default=3.0)    # 신맛
    body = Column(Float, nullable=True, default=3.0)       # 바디감
    finish = Column(Float, nullable=True, default=3.0)     # 여운 (aftertaste와 통합 권장)

    # Extra 5 (Detailed Analysis)
    clarity = Column(Float, nullable=True)                 # 청명도
    color = Column(Float, nullable=True)                   # 색택
    smoothness = Column(Float, nullable=True)              # 목넘김
    carbonation = Column(Float, nullable=True)             # 탄산감
    complexity = Column(Float, nullable=True)              # 복합미

    # Legacy compatibility fields
    texture = Column(Float, nullable=True)                 # 질감 (body와 유사하나 별도 유지 가능)
    flavor = Column(Float, nullable=True)                  # 맛 (종합적인 맛)

    # ⭐ 종합 평점 및 메모
    rating = Column(Float, nullable=False, default=3.0)
    notes = Column(Text, nullable=True)

    # ⏱️ 생성 시각
    created_at = Column(DateTime, default=datetime.utcnow)

    # 관계 설정
    sool = relationship("Sool", back_populates="tasting_notes")
    user = relationship("User", back_populates="tasting_notes")

    def vector(self):
        """
        ML 기반 추천 / Similarity 계산용 벡터 (Core 5)
        """
        return [
            float(self.aroma or 0),
            float(self.sweetness or 0),
            float(self.acidity or 0),
            float(self.body or 0),
            float(self.finish or 0),
        ]
