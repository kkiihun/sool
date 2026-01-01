# backend/app/api/report.py

from fastapi import APIRouter
from app.services.report_generator import generate_report_base64

router = APIRouter(prefix="/report", tags=["Report"])

@router.get("/{name}")
def make_report(name: str):
    file = generate_report_base64(name)
    return {"image": img}
