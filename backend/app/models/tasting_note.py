from sqlalchemy import Column, Integer, Float, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class TastingNote(Base):
    __tablename__ = "tasting_notes"

    id = Column(Integer, primary_key=True, index=True)

    # ⚠️ 반드시 Sool 모델의 __tablename__ 확인
    # 보통은 "sool" or "sools"
    sool_id = Column(Integer, ForeignKey("sool.id"), nullable=False)

    # -------------------------
    # ⭐ Overall Rating (1~5)
    # -------------------------
    rating = Column(Integer, nullable=False)

    # -------------------------
    # 🔥 Sensory Radar Features (0~5)
    # -------------------------
    aroma = Column(Float, nullable=True)     # 향
    flavor = Column(Float, nullable=True)    # 맛
    body = Column(Float, nullable=True)      # 바디감
    texture = Column(Float, nullable=True)   # 질감
    finish = Column(Float, nullable=True)    # 여운

    # -------------------------
    # 📝 Free Text Note
    # -------------------------
    notes = Column(Text, nullable=True)

    # -------------------------
    # Relation
    # -------------------------
    sool = relationship(
        "Sool",
        backref="tasting_notes",
        lazy="joined"
    )

    # -------------------------
    # 🧠 Flavor Vector (ML / Similarity)
    # -------------------------
    def vector(self):
        """
        ML 기반 추천 / Similarity 계산용 벡터
        None → 0 처리
        """
        return [
            float(self.aroma or 0),
            float(self.flavor or 0),
            float(self.body or 0),
            float(self.texture or 0),
            float(self.finish or 0),
        ]
