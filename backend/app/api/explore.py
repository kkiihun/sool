# 공개 탐색 API (P7): 파이프라인 결과(analytics_*)를 읽기만 해서 서비스 화면에 보여준다.
# 관리자 전용 정보(규칙 이름·신뢰도·HTTP 코드·시드 매칭 키 등)는 내보내지 않는다.
import re
from typing import Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.analytics import AnalyticsBlog, AnalyticsPlace, AnalyticsPurchase, AnalyticsSoolProfile
from app.models.sool import Sool

router = APIRouter(prefix="/explore", tags=["Explore"])

P, U, L = AnalyticsSoolProfile, AnalyticsPurchase, AnalyticsPlace

DEAD_STATES = ("dead", "error", "ended")
PAIRINGS = ["전·부침", "회·해산물", "육류", "치즈·양식", "디저트·과일", "매운·국물", "한식 전반", "칵테일·하이볼"]
# 화면 필터 이름 → 조건
FLAG_FILTERS = {
    # 원료 정보가 없는 제품(47건)은 '무감미료' 로 단정하지 않는다
    "no_sweetener": lambda: P.has_sweetener.is_(False) & P.main_ingredient.isnot(None),
    "raw": lambda: P.is_raw.is_(True),
    "visit": lambda: P.visit_brewery.is_(True),
    "online_buy": lambda: U.online_buy.is_(True) & func.coalesce(U.link_state, "").notin_(DEAD_STATES),
    "awarded": lambda: P.award_count > 0,
}
PROFILE_PUBLIC = [
    "category", "main_ingredient", "special_ingredients", "has_sweetener", "has_preservative", "has_spirit_added",
    "is_raw", "is_pasteurized", "is_sparkling", "aged_years", "volume_ml", "volumes_ml",
    "visit_brewery", "food_master", "intangible_heritage", "award_count", "best_award", "award_years",
    "taste", "pairings", "address", "card_score", "card_missing", "on_sale",
]
PLACE_PUBLIC = [
    "place_id", "name", "address", "homepage", "lat", "lng", "sido", "sigungu", "geo_method",
    "product_count", "categories", "products", "visit_brewery", "food_master", "intangible_heritage",
]

# 제품 → 장소 색인. 파이프라인이 하루 한 번 교체하므로 run_date 가 바뀔 때만 다시 만든다.
_place_index: dict = {"run_date": None, "by_sool": {}}


def _place_of(db: Session, sool_id: int) -> Optional[AnalyticsPlace]:
    run_date = db.query(func.max(L.run_date)).scalar()
    if run_date is None:
        return None
    if _place_index["run_date"] != run_date:
        by_sool = {}
        for place_id, products in db.query(L.place_id, L.products).all():
            for p in products or []:
                by_sool[p["sool_id"]] = place_id
        _place_index.update(run_date=run_date, by_sool=by_sool)
    place_id = _place_index["by_sool"].get(sool_id)
    return db.get(L, place_id) if place_id else None


def _purchase_public(u: Optional[AnalyticsPurchase]) -> Optional[dict]:
    """죽은 링크는 주소를 숨기고 상태만 알린다."""
    if u is None or not u.url:
        return None
    alive = u.link_state not in DEAD_STATES
    return {
        "channel": u.channel,
        "online_buy": bool(u.online_buy) and alive,
        "link_state": u.link_state,
        "url": u.url if alive else None,
        "checked_at": u.checked_at,
    }


@router.get("/sool/{sool_id}")
def sool_card(sool_id: int, db: Session = Depends(get_db)):
    """상세 페이지용 술 카드 + 어디서 맛보나 (양조장 위치·구매 경로)"""
    if db.get(Sool, sool_id) is None:
        raise HTTPException(404, "술 정보 없음")
    p = db.get(P, sool_id)
    place = _place_of(db, sool_id)
    profile = None
    if p is not None:
        profile = {c: getattr(p, c) for c in PROFILE_PUBLIC}
        # 원래 주종이 비어 있어 규칙으로 채운 값이면 화면에 '자동 분류' 로 표시
        profile["category_auto"] = p.category_source == "rule"
        profile["run_date"] = p.run_date
    return {
        "sool_id": sool_id,
        "profile": profile,
        "purchase": _purchase_public(db.get(U, sool_id)),
        "place": {c: getattr(place, c) for c in PLACE_PUBLIC} if place else None,
        "blogs": [{"title": b.title, "url": b.url, "blogname": b.blogname, "posted_at": b.posted_at}
                  for b in db.query(AnalyticsBlog).filter(AnalyticsBlog.sool_id == sool_id).order_by(AnalyticsBlog.seq)],
    }


@router.get("/places")
def places(db: Session = Depends(get_db)):
    """공개 양조장 지도: 좌표가 있는 장소만 (관리자 지도와 같은 모양, 좌표 진단 정보는 뺌)"""
    items = db.query(L).filter(L.lat.isnot(None)).all()
    by_sido: dict[str, int] = {}
    for x in items:
        if x.sido:
            by_sido[x.sido] = by_sido.get(x.sido, 0) + 1
    return {
        "total": len(items), "located": len(items), "by_method": {}, "by_sido": by_sido, "unlocated": [],
        "items": [{c: getattr(x, c) for c in PLACE_PUBLIC} for x in items],
    }


@router.get("/sool")
def explore_sool(
    q: Optional[str] = None,
    region: Optional[str] = None,
    category: Optional[str] = None,
    flags: Optional[str] = Query(None, description="쉼표 구분: " + ",".join(FLAG_FILTERS)),
    pairing: Optional[str] = None,
    order: Literal["recommended", "name", "abv_low", "abv_high"] = "recommended",
    page: int = Query(1, ge=1),
    page_size: int = Query(24, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """공개 탐색 목록: 기존 필터(검색·지역·주종·정렬) + 술 카드 필터.
    주종은 원래 값이 없으면 파이프라인 제안값으로 보여주고 거른다."""
    category_col = func.coalesce(func.nullif(Sool.category, ""), P.category)
    qry = (db.query(Sool, P.category, P.category_source, P.visit_brewery, P.is_raw, P.has_sweetener,
                    P.main_ingredient, P.award_count, P.card_score, P.taste, P.pairings, P.best_award, P.on_sale,
                    U.online_buy, U.link_state)
           .outerjoin(P, P.sool_id == Sool.id)
           .outerjoin(U, U.sool_id == Sool.id))

    if q and len(q) >= 2:
        like = f"%{q}%"
        qry = qry.filter(Sool.name.like(like) | Sool.producer.like(like))
    if region and region not in ("전체", "전체 지역"):
        qry = qry.filter(Sool.region == region)
    if category and category.strip():
        cats = ["탁주", "막걸리"] if category == "탁주" else [category]
        qry = qry.filter(category_col.in_(cats))
    for f in filter(None, (flags or "").split(",")):
        if f not in FLAG_FILTERS:
            raise HTTPException(400, f"flags 는 {sorted(FLAG_FILTERS)} 중에서")
        qry = qry.filter(FLAG_FILTERS[f]())
    if pairing:
        if pairing not in PAIRINGS:
            raise HTTPException(400, f"pairing 은 {PAIRINGS} 중 하나")
        qry = qry.filter(func.json_contains(P.pairings, f'"{pairing}"'))

    # 추천순: 판매 중단(aT) 은 뒤로 → 술 카드가 충실한 술 → 수상 → 찾아가는 양조장 → 이름
    order_by = {
        "recommended": [func.coalesce(P.on_sale, True).desc(), func.coalesce(P.card_score, 0).desc(), func.coalesce(P.award_count, 0).desc(),
                        func.coalesce(P.visit_brewery, False).desc(), Sool.name.asc()],
        "abv_low": [Sool.abv.asc()], "abv_high": [Sool.abv.desc()],
    }.get(order, [Sool.name.asc()])
    total = qry.count()
    rows = qry.order_by(*order_by, Sool.id).offset((page - 1) * page_size).limit(page_size).all()

    items = []
    for s, p_cat, p_src, visit, raw, sweet, main_ing, awards, score, taste, pairings, best_award, on_sale, online, state in rows:
        own = s.category if s.category else None
        items.append({
            "id": s.id, "name": s.name, "abv": s.abv, "region": s.region, "producer": s.producer,
            "image_url": s.image_url,
            "category": own or p_cat,
            "category_auto": own is None and p_cat is not None and p_src == "rule",
            "visit_brewery": bool(visit), "is_raw": bool(raw), "no_sweetener": sweet is False and main_ing is not None,
            "awarded": bool(awards), "online_buy": bool(online) and state not in DEAD_STATES,
            "card_score": score,
            # 카드 요약: 원료 · 강하게 언급된 맛 3개 · 페어링 2개
            "main_ingredient": main_ing,
            "tastes": [k for k, v in (taste or {}).items() if v and v > 0][:3],
            "pairings": (pairings or [])[:2],
            "best_award": best_award,
            "on_sale": on_sale,
        })
    return {"total": total, "items": items}


@router.get("/meta")
def explore_meta(db: Session = Depends(get_db)):
    """필터 선택지와 각 개수"""
    counts = {}
    for name, cond in FLAG_FILTERS.items():
        counts[name] = (db.query(func.count()).select_from(Sool)
                        .join(P, P.sool_id == Sool.id).outerjoin(U, U.sool_id == Sool.id)
                        .filter(cond()).scalar())
    pairing = {g: 0 for g in PAIRINGS}
    for (pr,) in db.query(P.pairings).all():
        for g in pr or []:
            if g in pairing:
                pairing[g] += 1
    return {"flags": counts, "pairings": pairing}


def _first_sentence(text: str | None, limit: int = 70) -> str | None:
    """메뉴판 기본 소개: 설명의 첫 문장 (길면 자름)"""
    if not text:
        return None
    s = re.split(r"(?<=[.!?。])\s+", text.strip())[0]
    return s if len(s) <= limit else s[: limit - 1].rstrip() + "…"


@router.get("/cards")
def sool_cards(ids: str = Query(..., description="쉼표 구분 sool_id, 최대 40개"), db: Session = Depends(get_db)):
    """메뉴판(R3)용: 고른 술들의 요약을 한 번에. 요청한 순서대로 돌려줌"""
    try:
        want = [int(x) for x in ids.split(",") if x.strip()][:40]
    except ValueError:
        raise HTTPException(400, "ids 는 숫자")
    rows = (db.query(Sool, P.category, P.main_ingredient, P.taste, P.pairings, P.on_sale)
            .outerjoin(P, P.sool_id == Sool.id).filter(Sool.id.in_(want)).all())
    by_id = {}
    for s, cat, ing, taste, pairings, on_sale in rows:
        place = _place_of(db, s.id)
        by_id[s.id] = {
            "sool_id": s.id, "name": s.name, "abv": s.abv, "category": s.category or cat,
            "producer": place.name if place else s.producer, "region": (place.sigungu if place else None) or s.region,
            "main_ingredient": ing, "tastes": [k for k, v in (taste or {}).items() if v and v > 0][:3],
            "pairings": pairings or [], "intro": _first_sentence(s.description), "on_sale": on_sale,
        }
    return {"items": [by_id[i] for i in want if i in by_id]}
