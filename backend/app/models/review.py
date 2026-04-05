from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from sqlalchemy import Text
from app.core.database import Base

class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    sool_id = Column(Integer, ForeignKey("sool.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # 🔹 작성자 ID 추가
    rating = Column(Float, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # 관계 설정
    sool = relationship(
        "Sool",
        back_populates="reviews"
    )

    user = relationship(
        "User",
        back_populates="reviews"
    )
