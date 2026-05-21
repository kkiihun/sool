from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class ActivityLog(Base):
    """
    사용자의 활동을 기록하는 모델 (추천 엔진 고도화용)
    """
    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True) # 비로그인 사용자 가능성
    sool_id = Column(Integer, ForeignKey("sool.id"), nullable=True)
    action = Column(String(50), nullable=False) # view, click, like, search
    query = Column(String(255), nullable=True) # 검색어인 경우 기록
    
    created_at = Column(DateTime, default=datetime.utcnow)

    # 관계 설정
    user = relationship("User", backref="activity_logs")
    sool = relationship("Sool", backref="activity_logs")
