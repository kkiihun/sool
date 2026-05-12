from sqlalchemy import Column, Integer, String, ForeignKey, Table
from sqlalchemy.orm import relationship
from app.core.database import Base

# Junction table for Many-to-Many relationship between Sool and FoodTag
sool_food_tags = Table(
    "sool_food_tags",
    Base.metadata,
    Column("sool_id", Integer, ForeignKey("sool.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", Integer, ForeignKey("food_tags.id", ondelete="CASCADE"), primary_key=True),
)

class FoodTag(Base):
    __tablename__ = "food_tags"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, index=True, nullable=False)
    icon = Column(String(20), nullable=True)  # Emoji or icon identifier (e.g., "🥩")

    # Relationship back to Sool
    sools = relationship("Sool", secondary=sool_food_tags, back_populates="food_tags")
