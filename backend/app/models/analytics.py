# 데이터 파이프라인(pipelines/)이 쓰는 결과 테이블. 서비스는 읽기만 한다.
# 파이프라인 계정 권한: 이 테이블들만 SELECT/INSERT/DELETE (ops/create-pipeline-user.sh)
from sqlalchemy import JSON, Boolean, Column, Date, DateTime, Float, Integer, String, Text, func

from app.core.database import Base


class AnalyticsSoolProfile(Base):
    """술 카드: 제품당 1행. 매 실행마다 통째로 교체된다."""
    __tablename__ = "analytics_sool_profile"

    sool_id = Column(Integer, primary_key=True)
    run_date = Column(Date, nullable=False)

    # 주종 (기존 값이 없으면 규칙 제안값)
    category = Column(String(20), index=True)
    category_source = Column(String(20))            # current / rule
    category_confidence = Column(Float)
    category_rule = Column(String(40))

    # 원료
    main_ingredient = Column(String(100))
    special_ingredients = Column(JSON)
    has_sweetener = Column(Boolean)
    has_preservative = Column(Boolean)
    has_spirit_added = Column(Boolean)

    # 제조
    is_raw = Column(Boolean)
    is_pasteurized = Column(Boolean)
    is_sparkling = Column(Boolean)
    aged_years = Column(Integer)
    volume_ml = Column(Integer)
    volumes_ml = Column(JSON)

    # 인증·수상
    visit_brewery = Column(Boolean, index=True)
    food_master = Column(Boolean)
    intangible_heritage = Column(Boolean)
    award_count = Column(Integer)
    best_award = Column(String(20))
    award_years = Column(JSON)

    # 맛 (텍스트 추출: 1 강함 / -1 약함 / 0 상반 / NULL 언급 없음)
    taste = Column(JSON)
    pairings = Column(JSON)

    # 어디서 (원본 CSV)
    address = Column(String(255))
    homepage = Column(String(500))
    features = Column(Text)                         # 맛·페어링 원문 (근거 표시용)
    seed_match_key = Column(String(30))


class PipelineRun(Base):
    """파이프라인 실행 기록 (status.json 과 같은 내용)"""
    __tablename__ = "pipeline_run"

    id = Column(Integer, primary_key=True, autoincrement=True)
    job = Column(String(50), nullable=False, index=True)
    run_id = Column(String(40), nullable=False)
    ok = Column(Boolean, nullable=False)
    duration_sec = Column(Float)
    status = Column(JSON, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
