from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class Category(Base):
    __tablename__ = "category_v2"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)


class Region(Base):
    __tablename__ = "region_v2"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)


class Producer(Base):
    __tablename__ = "producer_v2"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    region_id = Column(Integer, ForeignKey("region_v2.id"))

    region = relationship("Region", backref="producers")


class SoolV2(Base):
    __tablename__ = "sool_v2"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)

    category_id = Column(Integer, ForeignKey("category_v2.id"))
    region_id = Column(Integer, ForeignKey("region_v2.id"))
    producer_id = Column(Integer, ForeignKey("producer_v2.id"))

    abv = Column(Float)
    description = Column(Text)
    ingredients = Column(String(500))
    image_url = Column(String(500))

    # 관계
    category = relationship("Category", backref="sools_v2")
    region = relationship("Region", backref="sools_v2")
    producer = relationship("Producer", backref="sools_v2")

    tasting_notes = relationship("TastingNoteV2", back_populates="sool", cascade="all, delete-orphan")
    reviews = relationship("ReviewV2", back_populates="sool", cascade="all, delete-orphan")


class TastingNoteV2(Base):
    __tablename__ = "tasting_note_v2"

    id = Column(Integer, primary_key=True, index=True)
    sool_id = Column(Integer, ForeignKey("sool_v2.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # 🧠 감각 지표 (Sensory Indicators)
    aroma = Column(Float, default=0.0)
    sweetness = Column(Float, default=0.0)
    acidity = Column(Float, default=0.0)
    body = Column(Float, default=0.0)
    carbonation = Column(Float, default=0.0)
    clarity = Column(Float, default=0.0)
    color = Column(Float, default=0.0)
    smoothness = Column(Float, default=0.0)
    complexity = Column(Float, default=0.0)
    aftertaste = Column(Float, default=0.0)

    rating = Column(Float, default=0.0)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    sool = relationship("SoolV2", back_populates="tasting_notes")
    user = relationship("User", backref="tasting_notes_v2")


class ReviewV2(Base):
    __tablename__ = "review_v2"

    id = Column(Integer, primary_key=True, index=True)
    sool_id = Column(Integer, ForeignKey("sool_v2.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    rating = Column(Float, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    sool = relationship("SoolV2", back_populates="reviews")
    user = relationship("User", backref="reviews_v2")


class Tag(Base):
    __tablename__ = "tag_v2"
    id = Column(Integer, primary_key=True)
    name = Column(String(100), unique=True)


class SoolTag(Base):
    __tablename__ = "sool_tag_v2"

    sool_id = Column(Integer, ForeignKey("sool_v2.id"), primary_key=True)
    tag_id = Column(Integer, ForeignKey("tag_v2.id"), primary_key=True)
