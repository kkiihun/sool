from sqlalchemy import Column, Integer, Float, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class TastingNote(Base):
    __tablename__ = "tasting_notes"

    id = Column(Integer, primary_key=True, index=True)
    sool_id = Column(Integer, ForeignKey("sool.id"), nullable=False)

    # -------------------------
    # 🔥 Sensory Radar Features (0~5)
    # -------------------------
    aroma = Column(Float, nullable=True)      # 향
    sweetness = Column(Float, nullable=True)  # 단맛
    acidity = Column(Float, nullable=True)    # 산미
    body = Column(Float, nullable=True)       # 바디감
    finish = Column(Float, nullable=True)     # 여운

    # -------------------------
    # 📝 Free Text Note
    # -------------------------
    comment = Column(Text, nullable=True)

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
        None → 0 처리, 순서는 recommender.flavor_vector 와 동일
        """
        return [
            float(self.aroma or 0),
            float(self.sweetness or 0),
            float(self.acidity or 0),
            float(self.body or 0),
            float(self.finish or 0),
        ]
