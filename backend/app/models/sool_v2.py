from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
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


class SoolV2(Base):  # 🔥 여기 이름이 핵심!
    __tablename__ = "sool_v2"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)

    category_id = Column(Integer, ForeignKey("category_v2.id"))
    region_id = Column(Integer, ForeignKey("region_v2.id"))
    producer_id = Column(Integer, ForeignKey("producer_v2.id"))

    abv = Column(Float)
    description = Column(Text)

    # 관계
    category = relationship("Category", backref="sools_v2")
    region = relationship("Region", backref="sools_v2")
    producer = relationship("Producer", backref="sools_v2")


class TastingSession(Base):
    __tablename__ = "tasting_session_v2"

    id = Column(Integer, primary_key=True, index=True)
    sool_id = Column(Integer, ForeignKey("sool_v2.id"))
    user_id = Column(Integer, ForeignKey("users.id"))

    aroma = Column(Float)
    sweetness = Column(Float)
    acidity = Column(Float)
    body = Column(Float)
    carbonation = Column(Float)
    clarity = Column(Float)
    color = Column(Float)
    smoothness = Column(Float)
    complexity = Column(Float)
    rating = Column(Float)
    notes = Column(Text)
    created_at = Column(DateTime)

    # 나중에 필요하면 이렇게도 가능 (지금은 굳이 안 써도 됨)
    # sool = relationship("SoolV2", backref="tasting_sessions")


class Tag(Base):
    __tablename__ = "tag_v2"
    id = Column(Integer, primary_key=True)
    name = Column(String(100), unique=True)


class SoolTag(Base):
    __tablename__ = "sool_tag_v2"

    sool_id = Column(Integer, ForeignKey("sool_v2.id"), primary_key=True)
    tag_id = Column(Integer, ForeignKey("tag_v2.id"), primary_key=True)

    # sool = relationship("SoolV2", backref="tags")
    # tag = relationship("Tag", backref="sools")
