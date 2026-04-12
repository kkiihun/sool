from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), nullable=False)
    hashed_password = Column(String(255), nullable=False)

    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    status = Column(String(20), default="active") # active, suspended, locked

    # 🔹 사용자가 작성한 시음 기록 (Standardized)
    tasting_notes = relationship(
        "TastingNote",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    # 🔹 사용자가 작성한 리뷰 (Review)
    reviews = relationship(
        "Review",
        back_populates="user",
        cascade="all, delete-orphan"
    )
