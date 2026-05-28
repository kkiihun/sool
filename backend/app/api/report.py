# backend/app/api/report.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List

from app.core.database import get_db
from app.models.sool import Sool
from app.models.tasting_note import TastingNote
from app.schemas.report import B2BDashboardResponse, ProducerSummary, ProductPerformance, MarketComparison, TasteProfile
from app.services.report_generator import generate_report_base64

router = APIRouter(prefix="/report", tags=["Report"])

@router.get("/legacy/{name}")
def make_report(name: str):
    """Legacy Matplotlib based image report"""
    try:
        image_data = generate_report_base64(name)
        return {"image": image_data}
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/stats/producer/{producer_name}", response_model=B2BDashboardResponse)
def get_producer_dashboard(producer_name: str, db: Session = Depends(get_db)):
    # 1. Producer's products
    producer_sools = db.query(Sool).filter(Sool.producer == producer_name).all()
    if not producer_sools:
        raise HTTPException(status_code=404, detail="Producer not found")

    sool_ids = [s.id for s in producer_sools]

    # 2. Summary stats
    stats = db.query(
        func.count(TastingNote.id).label("total_reviews"),
        func.avg(TastingNote.rating).label("avg_rating")
    ).filter(TastingNote.sool_id.in_(sool_ids)).first()

    summary = ProducerSummary(
        producer_name=producer_name,
        total_products=len(producer_sools),
        avg_rating=stats.avg_rating or 0.0,
        total_reviews=stats.total_reviews or 0
    )

    # 3. Top Products & Individual Performance
    product_performances = []
    # Join Sool with TastingNote to get averages per product
    product_stats = db.query(
        Sool.id,
        Sool.name,
        func.avg(TastingNote.rating).label("avg_rating"),
        func.count(TastingNote.id).label("review_count"),
        func.avg(TastingNote.aroma).label("avg_aroma"),
        func.avg(TastingNote.sweetness).label("avg_sweetness"),
        func.avg(TastingNote.acidity).label("avg_acidity"),
        func.avg(TastingNote.body).label("avg_body"),
        func.avg(TastingNote.finish).label("avg_finish")
    ).outerjoin(TastingNote, Sool.id == TastingNote.sool_id)\
     .filter(Sool.producer == producer_name)\
     .group_by(Sool.id).all()

    for p in product_stats:
        product_performances.append(ProductPerformance(
            id=p.id,
            name=p.name,
            avg_rating=p.avg_rating,
            review_count=p.review_count,
            taste_profile=TasteProfile(
                aroma=float(p.avg_aroma or 3.0),
                sweetness=float(p.avg_sweetness or 3.0),
                acidity=float(p.avg_acidity or 3.0),
                body=float(p.avg_body or 3.0),
                finish=float(p.avg_finish or 3.0)
            )
        ))
    
    # Sort top products by rating & count
    top_products = sorted(product_performances, key=lambda x: (x.avg_rating or 0, x.review_count), reverse=True)[:5]

    # 4. Market Comparison (by category)
    categories = list(set([s.category for s in producer_sools if s.category]))
    market_comparisons = []

    for cat in categories:
        # Producer avg for this category
        p_avg = db.query(
            func.avg(TastingNote.aroma),
            func.avg(TastingNote.sweetness),
            func.avg(TastingNote.acidity),
            func.avg(TastingNote.body),
            func.avg(TastingNote.finish)
        ).join(Sool, Sool.id == TastingNote.sool_id)\
         .filter(Sool.producer == producer_name, Sool.category == cat).first()

        # Market avg for this category
        m_avg = db.query(
            func.avg(TastingNote.aroma),
            func.avg(TastingNote.sweetness),
            func.avg(TastingNote.acidity),
            func.avg(TastingNote.body),
            func.avg(TastingNote.finish)
        ).join(Sool, Sool.id == TastingNote.sool_id)\
         .filter(Sool.category == cat).first()

        if p_avg and m_avg:
            market_comparisons.append(MarketComparison(
                category=cat,
                producer_avg=TasteProfile(
                    aroma=float(p_avg[0] or 3.0),
                    sweetness=float(p_avg[1] or 3.0),
                    acidity=float(p_avg[2] or 3.0),
                    body=float(p_avg[3] or 3.0),
                    finish=float(p_avg[4] or 3.0)
                ),
                market_avg=TasteProfile(
                    aroma=float(m_avg[0] or 3.0),
                    sweetness=float(m_avg[1] or 3.0),
                    acidity=float(m_avg[2] or 3.0),
                    body=float(m_avg[3] or 3.0),
                    finish=float(m_avg[4] or 3.0)
                )
            ))

    return B2BDashboardResponse(
        summary=summary,
        top_products=top_products,
        market_comparison=market_comparisons
    )
