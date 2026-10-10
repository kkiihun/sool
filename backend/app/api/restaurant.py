# 식당 사장님용: R1 메뉴 페어링 추천 + R2 가까운 양조장. 공개 데이터 읽기만.
import re
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.analytics import AnalyticsBlog, AnalyticsPlace, AnalyticsPurchase, AnalyticsSoolProfile
from app.models.sool import Sool
from app.services.geo import geocode, haversine_km
from app.services.menu_analysis import abv_band, classify_dish, parse_menu, pick_lineup, score_drink, store_profile

router = APIRouter(prefix="/explore/restaurant", tags=["Restaurant"])

L, P, U, B = AnalyticsPlace, AnalyticsSoolProfile, AnalyticsPurchase, AnalyticsBlog
DEAD = ("dead", "error", "ended")
PAIRINGS = ["전·부침", "회·해산물", "육류", "치즈·양식", "디저트·과일", "매운·국물", "한식 전반", "칵테일·하이볼"]
# 추천 이유 문장 찾기용 음식 낱말 (파이프라인 taste.PAIRING_GROUPS 를 간단히 옮김)
FOOD_WORDS = {
    "전·부침": r"전|부침|빈대떡", "회·해산물": r"회|해산물|해물|조개|굴|생선|초밥|새우",
    "육류": r"고기|갈비|삼겹|보쌈|수육|족발|스테이크|불고기|육류|닭|치킨|구이",
    "치즈·양식": r"치즈|파스타|피자|양식|샐러드", "디저트·과일": r"디저트|과일|케이크|초콜릿|떡|한과",
    "매운·국물": r"매운|매콤|찌개|탕|전골|국밥|김치|떡볶이", "한식 전반": r"한식", "칵테일·하이볼": r"칵테일|하이볼|토닉",
}
_SENT_SPLIT = re.compile(r"(?<=[.!?。])\s+|\n")
FLAGS = {"raw", "no_sweetener", "visit", "online_buy"}


def _reason(features: str | None, groups: list[str]) -> str | None:
    """제품 특징 원문에서 고른 음식이 나오는 문장 하나 (없으면 '어울' 문장)"""
    if not features:
        return None
    sents = [x.strip() for x in _SENT_SPLIT.split(features) if x.strip()]
    pats = [re.compile(FOOD_WORDS[g]) for g in groups if g in FOOD_WORDS]
    for s in sents:
        if any(p.search(s) for p in pats):
            return s[:140]
    return next((s[:140] for s in sents if "어울" in s), None)


@router.get("/geocode")
def restaurant_geocode(q: str = Query(..., min_length=2, max_length=100)):
    """가게 주소(또는 가게·역 이름) → 좌표"""
    try:
        g = geocode(q)
    except Exception as ex:                       # 키 없음·카카오 오류
        raise HTTPException(503, f"주소 변환을 할 수 없습니다: {type(ex).__name__}")
    if g is None:
        raise HTTPException(404, "주소를 찾지 못했습니다")
    return g


@router.get("/recommend")
def recommend(
    pairings: Optional[str] = Query(None, description="쉼표 구분: " + ",".join(PAIRINGS)),
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    radius_km: Optional[float] = Query(None, gt=0, le=500),
    sido: str = Query("서울,경기", description="위치를 안 주면 이 시도의 양조장만"),
    flags: Optional[str] = None,
    category: Optional[str] = None,
    limit: int = Query(30, ge=1, le=100),
    db: Session = Depends(get_db),
):
    groups = [g for g in (pairings or "").split(",") if g]
    if any(g not in PAIRINGS for g in groups):
        raise HTTPException(400, f"pairings 는 {PAIRINGS} 중에서")
    fl = {f for f in (flags or "").split(",") if f}
    if fl - FLAGS:
        raise HTTPException(400, f"flags 는 {sorted(FLAGS)} 중에서")
    here = (lat, lng) if lat is not None and lng is not None else None

    # 1) 대상 양조장: 위치+반경이 있으면 거리로, 아니면 시도로
    places = db.query(L).filter(L.lat.isnot(None)).all()
    sidos = [x for x in sido.split(",") if x]
    cand = []
    for pl in places:
        d = haversine_km(here[0], here[1], pl.lat, pl.lng) if here else None
        if here and radius_km:
            if d > radius_km:
                continue
        elif sidos and pl.sido not in sidos:
            continue
        cand.append((pl, d))
    place_of = {p["sool_id"]: (pl, d) for pl, d in cand for p in (pl.products or [])}

    # 2) 제품: 술 카드 + 구매 경로 + 블로그 수
    ids = list(place_of)
    rows = (db.query(Sool.id, Sool.name, Sool.abv, P.category, P.pairings, P.taste, P.features, P.is_raw,
                     P.has_sweetener, P.main_ingredient, P.award_count, P.best_award, P.card_score, P.on_sale,
                     P.visit_brewery, U.online_buy, U.link_state, U.url, U.channel)
            .join(P, P.sool_id == Sool.id).outerjoin(U, U.sool_id == Sool.id)
            .filter(Sool.id.in_(ids)).all()) if ids else []
    blogs = dict(db.query(B.sool_id, func.count()).filter(B.sool_id.in_(ids)).group_by(B.sool_id).all()) if ids else {}

    items = []
    for r in rows:
        if r.on_sale is False:
            continue
        online = bool(r.online_buy) and r.link_state not in DEAD
        no_sweet = r.has_sweetener is False and r.main_ingredient is not None
        if ("raw" in fl and not r.is_raw) or ("no_sweetener" in fl and not no_sweet) \
                or ("visit" in fl and not r.visit_brewery) or ("online_buy" in fl and not online):
            continue
        if category and r.category != category:
            continue
        matched = [g for g in groups if g in (r.pairings or [])]
        if groups and not matched:
            continue
        pl, dist = place_of[r.id]
        score = 3 * len(matched) + 0.5 * (r.card_score or 0) + (1 if r.award_count else 0) + 0.2 * min(blogs.get(r.id, 0), 5)
        if dist is not None:
            score += max(0.0, 3 - dist / 20)          # 가까울수록 최대 +3 (60km 넘으면 0)
        items.append({
            "sool_id": r.id, "name": r.name, "abv": r.abv, "category": r.category,
            "main_ingredient": r.main_ingredient, "is_raw": bool(r.is_raw), "no_sweetener": no_sweet,
            "tastes": [k for k, v in (r.taste or {}).items() if v and v > 0][:3],
            "pairings": r.pairings or [], "matched": matched, "reason": _reason(r.features, matched or groups),
            "award": r.best_award if r.award_count else None, "blog_count": blogs.get(r.id, 0),
            "online_buy": online, "purchase_url": r.url if r.link_state not in DEAD else None, "channel": r.channel,
            "place_id": pl.place_id, "brewery": pl.name, "sido": pl.sido, "sigungu": pl.sigungu,
            "lat": pl.lat, "lng": pl.lng, "visit_brewery": bool(pl.visit_brewery),
            "distance_km": None if dist is None else round(dist, 1), "score": round(score, 2),
        })
    items.sort(key=lambda x: (-x["score"], x["distance_km"] if x["distance_km"] is not None else 0, x["name"]))

    # 3) 가까운 양조장 (R2): 추천에 걸린 제품 수 포함
    hit = {}
    for it in items:
        hit[it["place_id"]] = hit.get(it["place_id"], 0) + 1
    breweries = [{
        "place_id": pl.place_id, "name": pl.name, "sido": pl.sido, "sigungu": pl.sigungu, "address": pl.address,
        "lat": pl.lat, "lng": pl.lng, "distance_km": None if d is None else round(d, 1),
        "product_count": pl.product_count, "matching": hit.get(pl.place_id, 0), "visit_brewery": bool(pl.visit_brewery),
    } for pl, d in cand]
    breweries.sort(key=lambda b: (b["distance_km"] if b["distance_km"] is not None else 0, -b["matching"]))
    if not here:
        breweries.sort(key=lambda b: -b["matching"])

    return {"total": len(items), "items": items[:limit], "breweries": breweries[:30],
            "candidates": {"breweries": len(cand), "products": len(rows)}}



# ---------------------------------------------------------------------------
# 식당 리포트: 메뉴판 텍스트 → 메뉴 분석 + 메뉴별 추천 + 가게 라인업 + 공급처·우리 동네 술
# ---------------------------------------------------------------------------
class ReportIn(BaseModel):
    menu_text: str = Field(..., min_length=2, max_length=5000)
    store_name: Optional[str] = Field(None, max_length=60)
    lat: Optional[float] = None
    lng: Optional[float] = None
    radius_km: float = Field(50, gt=0, le=200)
    lineup_size: int = Field(4, ge=2, le=6)


def _drinks(db: Session, here, radius_km: float) -> tuple[dict[int, dict], list]:
    """후보 술: 위치가 있으면 반경 안 양조장, 없으면 서울·경기. 판매 중단 제외"""
    cand = []
    for pl in db.query(L).filter(L.lat.isnot(None)).all():
        d = haversine_km(here[0], here[1], pl.lat, pl.lng) if here else None
        if (here and d > radius_km) or (not here and pl.sido not in ("서울", "경기")):
            continue
        cand.append((pl, d))
    place_of = {p["sool_id"]: (pl, d) for pl, d in cand for p in (pl.products or [])}
    if not place_of:
        return {}, cand
    rows = (db.query(Sool.id, Sool.name, Sool.abv, P.category, P.pairings, P.taste, P.features, P.card_score,
                     P.on_sale, P.is_raw, P.award_count, U.online_buy, U.link_state)
            .join(P, P.sool_id == Sool.id).outerjoin(U, U.sool_id == Sool.id)
            .filter(Sool.id.in_(list(place_of))).all())
    blogs = dict(db.query(B.sool_id, func.count()).filter(B.sool_id.in_(list(place_of))).group_by(B.sool_id).all())
    drinks = {}
    for r in rows:
        if r.on_sale is False:
            continue
        pl, dist = place_of[r.id]
        drinks[r.id] = {
            "sool_id": r.id, "name": r.name, "abv": r.abv, "category": r.category, "pairings": r.pairings or [],
            "taste": r.taste or {}, "features": r.features, "is_raw": bool(r.is_raw), "award": bool(r.award_count),
            "online_buy": bool(r.online_buy) and r.link_state not in DEAD, "blog_count": blogs.get(r.id, 0),
            "quality": (r.card_score or 0) + min(blogs.get(r.id, 0), 5) * 0.4 + (1 if r.award_count else 0),
            "place_id": pl.place_id, "brewery": pl.name, "sigungu": pl.sigungu, "sido": pl.sido,
            "lat": pl.lat, "lng": pl.lng, "visit_brewery": bool(pl.visit_brewery),
            "distance_km": None if dist is None else round(dist, 1),
        }
    return drinks, cand


def _public(d: dict) -> dict:
    keep = ("sool_id", "name", "abv", "category", "is_raw", "award", "online_buy", "blog_count", "place_id",
            "brewery", "sigungu", "visit_brewery", "distance_km")
    out = {k: d[k] for k in keep}
    out["tastes"] = [k for k, v in d["taste"].items() if v and v > 0][:3]
    out["abv_band"] = abv_band(d["abv"])
    return out


@router.post("/report")
def restaurant_report(body: ReportIn, db: Session = Depends(get_db)):
    names = parse_menu(body.menu_text)
    if not names:
        raise HTTPException(400, "메뉴를 찾지 못했습니다. 한 줄에 메뉴 하나씩 붙여 넣어 주세요")
    dishes = [classify_dish(n) for n in names]
    known = [d for d in dishes if d["groups"] or d["traits"]]
    here = (body.lat, body.lng) if body.lat is not None and body.lng is not None else None
    drinks, cand = _drinks(db, here, body.radius_km)
    if not drinks:
        raise HTTPException(404, "반경 안에 추천할 술이 없습니다. 반경을 넓혀 보세요")

    def near_bonus(d):                       # 가까울수록 +1 (50km 넘으면 0)
        return 0 if d["distance_km"] is None else max(0.0, 1 - d["distance_km"] / 50)

    per_dish, dish_scores = [], {}
    for dish in known:
        scored = []
        for sid, dk in drinks.items():
            sc, why = score_drink(dish, dk)
            if sc > 0:
                scored.append((sc + 0.1 * dk["quality"] + near_bonus(dk), sid, why))
        scored.sort(key=lambda x: -x[0])
        dish_scores[dish["name"]] = {sid: sc for sc, sid, _ in scored[:30]}
        # 메뉴별 추천 2개: 1위 + 주종이 다른 것 중 최고 (선택지를 넓게)
        picks = scored[:1] + [x for x in scored[1:] if scored and drinks[x[1]]["category"] != drinks[scored[0][1]]["category"]][:1]
        per_dish.append({**dish, "picks": [{**_public(drinks[sid]), "why": why[:2], "score": round(sc, 2)}
                                           for sc, sid, why in picks]})

    lineup_ids = pick_lineup(dish_scores, drinks, body.lineup_size)
    lineup = []
    for sid in lineup_ids:
        covers = [d for d, s in dish_scores.items() if sid in s and s[sid] >= max(s.values()) * 0.7]
        lineup.append({**_public(drinks[sid]), "covers": covers})

    # 우리 동네 술: 같은 시군구(위치 있을 때) 양조장 제품 중 충실한 순
    local = []
    if here:
        nearest = min(cand, key=lambda x: x[1])[0] if cand else None
        local_ids = [sid for sid, d in drinks.items() if nearest and d["sigungu"] == nearest.sigungu and d["distance_km"] <= 15]
        local = [_public(drinks[s]) for s in sorted(local_ids, key=lambda s: -drinks[s]["quality"])[:4]]

    suppliers = sorted({d["place_id"]: d for d in drinks.values()}.values(),
                       key=lambda d: (d["distance_km"] if d["distance_km"] is not None else 0))
    return {
        "store_name": body.store_name,
        "profile": store_profile(known),
        "parsed": len(names), "unrecognized": [d["name"] for d in dishes if d not in known],
        "per_dish": per_dish,
        "lineup": lineup,
        "local": local,
        "suppliers": [{"place_id": d["place_id"], "brewery": d["brewery"], "sigungu": d["sigungu"],
                       "distance_km": d["distance_km"], "visit_brewery": d["visit_brewery"]} for d in suppliers[:6]] if here else [],
        "raw_count": sum(1 for d in drinks.values() if d["is_raw"] and (d["distance_km"] or 999) <= 30),
        "candidates": len(drinks),
    }
