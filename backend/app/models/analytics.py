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

    # 충실도: 주종·원료·맛·페어링·설명·지도 위치·구매 링크 중 채워진 수 (0~7) + 빠진 항목
    # 기존 DB 에는 app/core/migrate.py 가 컬럼을 추가한다
    card_score = Column(Integer)
    card_missing = Column(JSON)


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


class CategoryReview(Base):
    """주종 제안 검증 라벨 (관리자가 화면에서 표시). 규칙 정확도 측정 + 이후 승인 반영의 근거."""
    __tablename__ = "category_review"

    sool_id = Column(Integer, primary_key=True)
    suggested = Column(String(20))                  # 검증 당시 제안값 (미분류면 NULL)
    rule = Column(String(40), index=True)
    confidence = Column(Float)
    verdict = Column(String(10), nullable=False)    # correct / wrong / unsure
    correct_category = Column(String(20))           # 사람이 정한 정답 (unsure 면 NULL)
    reviewer_id = Column(Integer)
    reviewed_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)


class AnalyticsPlace(Base):
    """양조장(장소): 같은 양조장·주소의 제품 묶음 + 좌표. 파이프라인이 매 실행마다 교체."""
    __tablename__ = "analytics_place"

    place_id = Column(String(12), primary_key=True)
    run_date = Column(Date, nullable=False)
    name = Column(String(100))
    aliases = Column(JSON)                          # 같은 장소로 묶인 양조장 이름 표기들
    address = Column(String(255))
    homepage = Column(String(500))
    lat = Column(Float)
    lng = Column(Float)
    sido = Column(String(20), index=True)
    sigungu = Column(String(30))
    geo_method = Column(String(10))                 # address / keyword / none / pending
    product_count = Column(Integer)
    categories = Column(JSON)                       # {"탁주": 3, ...}
    products = Column(JSON)                         # [{sool_id, name, category, abv}]
    visit_brewery = Column(Boolean, index=True)
    food_master = Column(Boolean)
    intangible_heritage = Column(Boolean)
    awarded_products = Column(Integer)


class AnalyticsPurchase(Base):
    """구매 경로: 제품 홈페이지 링크의 채널(스마트스토어·자체 사이트…)과 생존 여부. 가격은 없음."""
    __tablename__ = "analytics_purchase"

    sool_id = Column(Integer, primary_key=True)
    run_date = Column(Date, nullable=False)
    url = Column(String(500))
    channel = Column(String(20), index=True)         # smartstore / shop_mall / own_site / modoo / instagram / ...
    online_buy = Column(Boolean, index=True)        # 온라인 구매 경로 (스마트스토어·판매몰)
    link_state = Column(String(10))                 # alive / dead / blocked / error / unchecked
    http_code = Column(Integer)
    final_url = Column(String(500))
    checked_at = Column(DateTime)


class AnalyticsMarket(Base):
    """시장 구조 지표 (P6): 지표 이름 → 화면용 JSON. 파이프라인이 매 실행마다 교체."""
    __tablename__ = "analytics_market"

    key = Column(String(40), primary_key=True)
    run_date = Column(Date, nullable=False)
    payload = Column(JSON, nullable=False)
