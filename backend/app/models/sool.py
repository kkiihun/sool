from sqlalchemy import Column, Integer, String, Float
from sqlalchemy.orm import relationship
from app.core.database import Base

from app.models.food_pairing import sool_food_tags

class Sool(Base):
    __tablename__ = "sool"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String(100), nullable=False, index=True)
    category = Column(String(50))
    abv = Column(Float)
    region = Column(String(50))

    description = Column(String(500))
    producer = Column(String(100))
    ingredients = Column(String(255))
    image_url = Column(String(500)) # 이미지 URL 저장을 위한 필드 추가

    # 🔹 감각 노트 (Standardized)
    tasting_notes = relationship(
        "TastingNote",
        back_populates="sool",
        cascade="all, delete-orphan"
    )

    # 🔹 리뷰 (🔥 이게 빠져 있었음)
    reviews = relationship(
        "Review",
        back_populates="sool",
        cascade="all, delete-orphan"
    )

    # 🔹 음식 매칭 (Food Pairing Tags)
    food_tags = relationship(
        "FoodTag",
        secondary=sool_food_tags,
        back_populates="sools"
    )
