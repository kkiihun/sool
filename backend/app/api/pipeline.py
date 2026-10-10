# 데이터 파이프라인 결과 조회 (관리자 전용, 읽기만)
import hashlib
from typing import Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_admin
from app.models.analytics import AnalyticsPlace, AnalyticsPurchase, AnalyticsSoolProfile, CategoryReview, PipelineRun
from app.models.sool import Sool
from app.models.user import User

router = APIRouter(prefix="/admin/pipeline", tags=["Admin Pipeline"], dependencies=[Depends(require_admin)])

# 필터로 쓸 수 있는 불리언 플래그
FLAGS = {
    "visit_brewery", "food_master", "intangible_heritage", "has_sweetener", "has_preservative",
    "has_spirit_added", "is_raw", "is_pasteurized", "is_sparkling",
}


@router.get("/status")
def pipeline_status(job: str = "sool", limit: int = Query(10, le=50), db: Session = Depends(get_db)):
    """최근 실행 기록. 첫 항목이 최신."""
    runs = (db.query(PipelineRun).filter(PipelineRun.job == job)
            .order_by(PipelineRun.id.desc()).limit(limit).all())
    return {
        "latest": runs[0].status if runs else None,
        "history": [{"run_id": r.run_id, "ok": r.ok, "duration_sec": r.duration_sec} for r in runs],
    }


@router.get("/summary")
def pipeline_summary(db: Session = Depends(get_db)):
    """주종별 술 카드 요약 + 페어링·맛 분포"""
    P = AnalyticsSoolProfile
    pct = lambda col: func.round(100 * func.avg(func.coalesce(col, 0)), 0)  # noqa: E731
    rows = (db.query(
        P.category, func.count().label("n"),
        pct(P.visit_brewery).label("visit_pct"),
        func.round(100 * func.avg(func.if_(P.award_count > 0, 1, 0)), 0).label("award_pct"),
        pct(P.has_sweetener).label("sweetener_pct"),
        pct(P.is_raw).label("raw_pct"),
        pct(P.is_sparkling).label("sparkling_pct"),
        func.round(func.avg(P.category_confidence), 2).label("avg_confidence"),
    ).group_by(P.category).order_by(func.count().desc()).all())

    pairing, taste, special = {}, {}, {}
    for pr, ts, sp in db.query(P.pairings, P.taste, P.special_ingredients).all():
        for g in pr or []:
            pairing[g] = pairing.get(g, 0) + 1
        for axis, v in (ts or {}).items():
            if v is not None:
                t = taste.setdefault(axis, {"high": 0, "low": 0, "mixed": 0})
                t["high" if v > 0 else "low" if v < 0 else "mixed"] += 1
        for s in sp or []:
            special[s] = special.get(s, 0) + 1

    U = AnalyticsPurchase
    channels = [
        {"channel": ch, "n": n, "alive": int(alive or 0), "dead": int(dead or 0)}
        for ch, n, alive, dead in db.query(
            U.channel, func.count(),
            func.sum(func.if_(U.link_state.in_(["alive", "login", "blocked"]), 1, 0)),
            func.sum(func.if_(U.link_state.in_(["dead", "error", "ended"]), 1, 0)),
        ).group_by(U.channel).order_by(func.count().desc()).all()
    ]
    return {
        "total": sum(r.n for r in rows),
        "by_category": [dict(r._mapping) for r in rows],
        "purchase_channels": channels,
        "pairings": sorted(pairing.items(), key=lambda x: -x[1]),
        "taste": taste,
        "special_ingredients": sorted(special.items(), key=lambda x: -x[1])[:20],
    }


@router.get("/profiles")
def pipeline_profiles(
    category: Optional[str] = None,
    flag: Optional[str] = None,
    q: Optional[str] = None,
    unclassified: bool = False,
    max_confidence: Optional[float] = None,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """술 카드 목록 (sool 기본 정보와 합쳐서)"""
    P, U = AnalyticsSoolProfile, AnalyticsPurchase
    qry = (db.query(P, Sool.name, Sool.producer, Sool.region, Sool.abv, U.channel, U.online_buy, U.link_state, U.url)
           .join(Sool, Sool.id == P.sool_id)
           .outerjoin(U, U.sool_id == P.sool_id))
    if category:
        qry = qry.filter(P.category == category)
    if unclassified:
        qry = qry.filter(P.category.is_(None))
    if flag == "online_buy":       # 온라인 구매 경로가 있고 링크가 죽지 않은 제품
        qry = qry.filter(U.online_buy.is_(True), U.link_state.notin_(["dead", "error", "ended"]))
    elif flag:
        if flag not in FLAGS:
            raise HTTPException(400, f"flag 는 {sorted(FLAGS)} 중 하나")
        qry = qry.filter(getattr(P, flag).is_(True))
    if max_confidence is not None:
        qry = qry.filter(P.category_confidence <= max_confidence)
    if q:
        like = f"%{q}%"
        qry = qry.filter((Sool.name.like(like)) | (Sool.producer.like(like)))

    total = qry.count()
    items = []
    rows = qry.order_by(P.sool_id).offset((page - 1) * size).limit(size).all()
    for p, name, producer, region, abv, channel, online_buy, link_state, url in rows:
        d = {c.name: getattr(p, c.name) for c in P.__table__.columns}
        d.update(name=name, producer=producer, region=region, abv=abv,
                 purchase_channel=channel, online_buy=online_buy, link_state=link_state, purchase_url=url)
        items.append(d)
    return {"total": total, "page": page, "size": size, "items": items}


@router.get("/places")
def pipeline_places(visit_only: bool = False, sido: Optional[str] = None, db: Session = Depends(get_db)):
    """양조장 지도용: 좌표가 있는 장소 전체 + 좌표 변환 현황"""
    P = AnalyticsPlace
    qry = db.query(P)
    if visit_only:
        qry = qry.filter(P.visit_brewery.is_(True))
    if sido:
        qry = qry.filter(P.sido == sido)
    places = qry.all()
    cols = [c.name for c in P.__table__.columns]
    return {
        "total": len(places),
        "located": sum(1 for p in places if p.lat is not None),
        "by_method": dict(db.query(P.geo_method, func.count()).group_by(P.geo_method).all()),
        "by_sido": dict(db.query(P.sido, func.count()).filter(P.sido.isnot(None)).group_by(P.sido).all()),
        "items": [{c: getattr(p, c) for c in cols} for p in places if p.lat is not None],
        "unlocated": [{"name": p.name, "address": p.address} for p in places if p.lat is None][:50],
    }


# ---------------------------------------------------------------------------
# 주종 제안 검증 (P3): 규칙별 층화 표본 → 관리자 라벨 → 규칙별·전체 추정 정확도
# ---------------------------------------------------------------------------
CATEGORIES = ["탁주", "약주", "청주", "과실주", "증류주", "리큐르", "기타주류"]
SAMPLE_SIZE = 100
MIN_PER_RULE = 5
SAMPLE_SEED = "review-v1"      # 바꾸면 새 표본


def _sample_ids(db: Session) -> list[int]:
    """규칙 크기에 비례(최소 5건, 규칙 수 때문에 합계는 100 을 조금 넘음)하는 층화 표본.
    해시 순서라 매번 같은 표본이 나온다."""
    P = AnalyticsSoolProfile
    sizes = dict(db.query(P.category_rule, func.count()).filter(func.coalesce(P.category_source, "") != "current")
                 .group_by(P.category_rule).all())
    total = sum(sizes.values()) or 1
    ids: list[int] = []
    for rule, size in sizes.items():
        k = min(size, max(MIN_PER_RULE, round(SAMPLE_SIZE * size / total)))
        rows = (db.query(P.sool_id).filter(P.category_rule == rule, func.coalesce(P.category_source, "") != "current")
                .order_by(func.md5(func.concat(P.sool_id, SAMPLE_SEED))).limit(k).all())
        ids += [r[0] for r in rows]
    # 규칙이 섞여 나오도록 정렬 → 중간에 멈춰도 모든 규칙에 라벨이 고르게 쌓임
    return sorted(ids, key=lambda i: hashlib.md5(f"{i}{SAMPLE_SEED}".encode()).hexdigest())


@router.get("/review/next")
def review_next(db: Session = Depends(get_db)):
    """표본 중 아직 라벨이 없는 다음 제품 1건 + 진행 상황"""
    ids = _sample_ids(db)
    done = {r[0] for r in db.query(CategoryReview.sool_id).filter(CategoryReview.sool_id.in_(ids)).all()}
    todo = [i for i in ids if i not in done]
    item = None
    if todo:
        p = db.get(AnalyticsSoolProfile, todo[0])
        s = db.get(Sool, todo[0])
        item = {
            "sool_id": s.id, "name": s.name, "producer": s.producer, "region": s.region, "abv": s.abv,
            "ingredients": s.ingredients, "description": s.description, "features": p.features,
            "suggested": p.category, "rule": p.category_rule, "confidence": p.category_confidence,
        }
    return {"total": len(ids), "done": len(ids) - len(todo), "item": item, "categories": CATEGORIES}


class ReviewIn(BaseModel):
    sool_id: int
    verdict: Literal["correct", "wrong", "unsure"]
    correct_category: Optional[str] = None


@router.post("/review")
def review_submit(body: ReviewIn, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    p = db.get(AnalyticsSoolProfile, body.sool_id)
    if p is None:
        raise HTTPException(404, "술 카드 없음")
    correct = body.correct_category
    if body.verdict == "correct":
        if not p.category:
            raise HTTPException(400, "제안값이 없는 제품은 정답 주종을 골라야 합니다")
        correct = p.category
    elif body.verdict == "wrong" and correct not in CATEGORIES:
        raise HTTPException(400, f"correct_category 는 {CATEGORIES} 중 하나")
    elif body.verdict == "unsure":
        correct = None

    r = db.get(CategoryReview, body.sool_id) or CategoryReview(sool_id=body.sool_id)
    r.suggested, r.rule, r.confidence = p.category, p.category_rule, p.category_confidence
    r.verdict, r.correct_category, r.reviewer_id = body.verdict, correct, admin.id
    db.merge(r)
    db.commit()
    return {"ok": True}


@router.get("/review/stats")
def review_stats(db: Session = Depends(get_db)):
    """규칙별 정확도 + 규칙 크기로 가중한 전체 추정 정확도 (unsure 제외)"""
    P, R = AnalyticsSoolProfile, CategoryReview
    sizes = dict(db.query(P.category_rule, func.count()).filter(func.coalesce(P.category_source, "") != "current")
                 .group_by(P.category_rule).all())
    rows = db.query(R.rule, R.verdict, R.suggested, R.correct_category).all()

    by_rule: dict[str, dict] = {}
    confusion: dict[str, int] = {}
    for rule, verdict, suggested, correct in rows:
        d = by_rule.setdefault(rule or "(none)", {"labeled": 0, "correct": 0, "unsure": 0})
        if verdict == "unsure":
            d["unsure"] += 1
            continue
        d["labeled"] += 1
        hit = suggested is not None and suggested == correct
        d["correct"] += int(hit)
        if not hit:
            key = f"{suggested or '미분류'} → {correct}"
            confusion[key] = confusion.get(key, 0) + 1

    table, weighted, covered = [], 0.0, 0
    for rule, size in sorted(sizes.items(), key=lambda x: -x[1]):
        d = by_rule.get(rule or "(none)", {"labeled": 0, "correct": 0, "unsure": 0})
        acc = d["correct"] / d["labeled"] if d["labeled"] else None
        table.append({"rule": rule, "size": size, **d, "accuracy": None if acc is None else round(acc, 3)})
        if acc is not None and rule != "unresolved":
            weighted += acc * size
            covered += size
    return {
        "labeled": sum(d["labeled"] for d in by_rule.values()),
        "estimated_accuracy": round(weighted / covered, 3) if covered else None,   # 제안이 있는 제품 기준
        "by_rule": table,
        "confusion": sorted(confusion.items(), key=lambda x: -x[1])[:15],
    }
