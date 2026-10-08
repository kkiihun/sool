# backend/app/api/report.py

from fastapi import APIRouter, HTTPException
from app.services.report_generator import generate_report_base64

router = APIRouter(prefix="/report", tags=["Report"])

@router.get("/{name}")
def make_report(name: str):
    try:
        img = generate_report_base64(name)
    except LookupError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return {"image": img}
