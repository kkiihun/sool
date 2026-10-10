# 양조장 대표님용 (B1 진단 리포트). 공개 데이터만 묶어 보여주고 쓰기는 없음.
from collections import Counter, defaultdict
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.analytics import (AnalyticsBlog, AnalyticsIngredient, AnalyticsPlace, AnalyticsPurchase,
                                  AnalyticsSoolIngredient, AnalyticsSoolProfile)
from app.models.sool import Sool
from app.services.brewery_report import DEAD, build_issues, percentile_rank, strengths, summarize

router = APIRouter(prefix="/explore/breweries", tags=["Brewery Report"])

FOCUS_SIDO = ["서울", "경기"]
L, P, U, B = AnalyticsPlace, AnalyticsSoolProfile, AnalyticsPurchase, AnalyticsBlog


def _product_rows(db: Session, ids: list[int]) -> dict[int, dict]:
    """제품별 진단에 필요한 값: 술 카드 + 구매 경로 + 블로그 수"""
    if not ids:
        return {}
    rows = (db.query(Sool.id, Sool.name, Sool.abv, P.category, P.card_score, P.card_missing, P.on_sale,
                     P.pairings, P.visit_brewery, P.award_count, U.channel, U.online_buy, U.link_state, U.url)
            .join(P, P.sool_id == Sool.id).outerjoin(U, U.sool_id == Sool.id)
            .filter(Sool.id.in_(ids)).all())
    blogs = dict(db.query(B.sool_id, func.count()).filter(B.sool_id.in_(ids)).group_by(B.sool_id).all())
    latest = dict(db.query(B.sool_id, func.max(B.posted_at)).filter(B.sool_id.in_(ids)).group_by(B.sool_id).all())
    out = {}
    for r in rows:
        out[r.id] = {
            "sool_id": r.id, "name": r.name, "abv": r.abv, "category": r.category,
            "card_score": r.card_score, "card_missing": r.card_missing or [], "on_sale": r.on_sale,
            "pairings": r.pairings or [], "award_count": r.award_count or 0,
            "channel": r.channel, "link_state": r.link_state,
            "online_buy": bool(r.online_buy) and r.link_state not in DEAD,
            "url": r.url, "blog_count": blogs.get(r.id, 0), "blog_latest": latest.get(r.id),
        }
    return out


@router.get("")
def list_breweries(
    sido: Optional[str] = Query(",".join(FOCUS_SIDO), description="쉼표 구분. 빈 값이면 전국"),
    q: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """양조장 찾기: 이름·주소 검색 + 요약 점수"""
    qry = db.query(L)
    sidos = [x for x in (sido or "").split(",") if x]
    if sidos:
        qry = qry.filter(L.sido.in_(sidos))
    if q:
        like = f"%{q.strip()}%"
        qry = qry.filter(L.name.like(like) | L.address.like(like))
    places = qry.order_by(L.sido, L.name).all()
    ids = [p["sool_id"] for pl in places for p in (pl.products or [])]
    prods = _product_rows(db, ids)
    items = []
    for pl in places:
        ps = [prods[p["sool_id"]] for p in (pl.products or []) if p["sool_id"] in prods]
        s = summarize(ps)
        issues = [i for i in build_issues(s, {"geo_method": pl.geo_method}) if i["level"] == "high"]
        items.append({
            "place_id": pl.place_id, "name": pl.name, "sido": pl.sido, "sigungu": pl.sigungu,
            "products": s["products"], "avg_card_score": s["avg_card_score"], "visit_brewery": pl.visit_brewery,
            "high_issues": len(issues), "blog_total": s["blog_total"],
        })
    return {"total": len(items), "items": items}


@router.get("/{place_id}/report")
def brewery_report(place_id: str, db: Session = Depends(get_db)):
    pl = db.get(L, place_id)
    if pl is None:
        raise HTTPException(404, "양조장 정보 없음")
    my_ids = [p["sool_id"] for p in (pl.products or [])]
    products = list(_product_rows(db, my_ids).values())
    s = summarize(products)
    place = {c.name: getattr(pl, c.name) for c in L.__table__.columns if c.name not in ("run_date",)}

    # 같은 시도 비교: 양조장 단위 블로그 후기 수·평균 충실도, 제품 단위 주종별 순위
    peers = db.query(L).filter(L.sido == pl.sido).all() if pl.sido else []
    peer_ids = [p["sool_id"] for x in peers for p in (x.products or [])]
    peer_prods = _product_rows(db, peer_ids)
    by_place_blog, by_place_score = [], []
    for x in peers:
        ps = [peer_prods[p["sool_id"]] for p in (x.products or []) if p["sool_id"] in peer_prods]
        if ps:
            by_place_blog.append(sum(p["blog_count"] for p in ps))
            by_place_score.append(sum(p["card_score"] or 0 for p in ps) / len(ps))
    ranks = {
        "sido": pl.sido, "peer_breweries": len(by_place_blog),
        "blog_pct": percentile_rank(s["blog_total"], by_place_blog) if products else None,
        "score_pct": percentile_rank(s["avg_card_score"], by_place_score) if products else None,
    }
    cat_peers: dict[str, list[dict]] = defaultdict(list)
    for p in peer_prods.values():
        if p["category"]:
            cat_peers[p["category"]].append(p)
    for p in products:
        group = cat_peers.get(p["category"] or "", [])
        p["peer_count"] = len(group)
        p["blog_pct"] = percentile_rank(p["blog_count"], [g["blog_count"] for g in group]) if group else None

    # 페어링 포지션: 내 제품 vs 같은 시도 전체
    mine = Counter(g for p in products for g in p["pairings"])
    region = Counter(g for p in peer_prods.values() for g in p["pairings"])
    region_n = len(peer_prods) or 1
    pairing = [{"group": g, "mine": mine.get(g, 0), "region_pct": round(100 * region.get(g, 0) / region_n)}
               for g in sorted(set(mine) | set(region), key=lambda g: -region.get(g, 0))]

    # 주원료 시세: 내 제품 원재료에 나오는 원료의 최근 가격·전년 대비·출하기
    links = db.query(AnalyticsSoolIngredient).filter(AnalyticsSoolIngredient.sool_id.in_(my_ids)).all() if my_ids else []
    used = Counter(x.ingredient for x in links)
    ing_rows = {r.ingredient: r for r in db.query(AnalyticsIngredient).filter(AnalyticsIngredient.ingredient.in_(list(used))).all()} if used else {}
    ingredients = [{
        "ingredient": name, "my_products": n, "latest_ym": r.latest_ym, "latest_kg": r.latest_kg, "yoy_pct": r.yoy_pct,
        "trend_3m_pct": r.trend_3m_pct, "cheapest_months": r.cheapest_months or [],
        "on_market_months": r.on_market_months or [], "variety": r.variety, "monthly": (r.monthly or [])[-24:],
    } for name, n in used.most_common() if (r := ing_rows.get(name)) is not None and r.latest_kg]

    return {
        "place": place,
        "summary": s,
        "ingredients": ingredients,
        "ranks": ranks,
        "issues": build_issues(s, place),
        "strengths": strengths(s, place, ranks),
        "products": sorted(products, key=lambda p: (p["card_score"] or 0, p["name"])),
        "pairing": pairing,
        "run_date": pl.run_date,
    }
