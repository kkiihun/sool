# 데이터 파이프라인 결과 조회 (관리자 전용, 읽기만)
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_admin
from app.models.analytics import AnalyticsSoolProfile, PipelineRun
from app.models.sool import Sool

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

    return {
        "total": sum(r.n for r in rows),
        "by_category": [dict(r._mapping) for r in rows],
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
    P = AnalyticsSoolProfile
    qry = db.query(P, Sool.name, Sool.producer, Sool.region, Sool.abv).join(Sool, Sool.id == P.sool_id)
    if category:
        qry = qry.filter(P.category == category)
    if unclassified:
        qry = qry.filter(P.category.is_(None))
    if flag:
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
    for p, name, producer, region, abv in qry.order_by(P.sool_id).offset((page - 1) * size).limit(size).all():
        d = {c.name: getattr(p, c.name) for c in P.__table__.columns}
        d.update(name=name, producer=producer, region=region, abv=abv)
        items.append(d)
    return {"total": total, "page": page, "size": size, "items": items}
