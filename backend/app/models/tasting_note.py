from sqlalchemy import Column, Integer, Float, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class TastingNote(Base):
    __tablename__ = "tasting_notes"  # 복수형 권장

    id = Column(Integer, primary_key=True, index=True)

    # FK 테이블명 확인 필요 ← 대부분 sools 또는 sool
    # 만약 모델이 Class Sool → __tablename__ = "sools" 라면 아래를 반드시 `"sools.id"`로 변경
    sool_id = Column(Integer, ForeignKey("sool.id"), nullable=False)

    # -------------------------
    # 🔥 Flavor Vector Features
    # -------------------------
    aroma = Column(Float, nullable=True)      # 향
    sweetness = Column(Float, nullable=True)  # 단맛
    acidity = Column(Float, nullable=True)    # 산미
    body = Column(Float, nullable=True)       # 바디감
    finish = Column(Float, nullable=True)     # 마무리감(여운)

    # -------------------------
    # Optional Free Note
    # -------------------------
    comment = Column(Text, nullable=True)

    # Relation
    sool = relationship("Sool", backref="tasting_notes", lazy="joined")

    # -------------------------
    # 🔥 Flavor Vector Extractor
    # -------------------------
    def vector(self):
        """
        ML 기반 추천 및 Similarity 계산에 사용될 벡터 추출 함수
        None -> 0 변환 처리 포함
        """
        return [
            float(self.aroma or 0),
            float(self.sweetness or 0),
            float(self.acidity or 0),
            float(self.body or 0),
            float(self.finish or 0)
        ]
