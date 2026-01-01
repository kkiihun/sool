from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# =====================#
#   DB + ORM
# =====================#
from app.core.database import SessionLocal, Base, engine

# =====================#
#   APP 생성
# =====================#
app = FastAPI(title="SOOL API V2")

# =====================#
#   Model Import
# =====================#
from app.models.sool import Sool
from app.models.review import Review
from app.models.sense import Sense
from app.models.tasting import Tasting
from app.models.tasting_note import TastingNote

# =====================#
#   Router Import
# =====================#
from app.api.sool import router as sool_router
from app.api.tasting import router as tasting_router
from app.api.review import router as review_router
from app.api.sense import router as sense_router
from app.api import update_log, auth, users
from app.api import report
from app.api.sool_v2 import router as sool_v2_router   # ⭐ 핵심 최신 라우터


# =====================#
#   Router 등록
# =====================#
app.include_router(sool_router)       # 구버전 sool API
app.include_router(tasting_router)
app.include_router(review_router)
app.include_router(sense_router)
app.include_router(update_log.router)
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(report.router)
app.include_router(sool_v2_router)    # ⭐ 반드시 마지막에 등록, prefix 포함됨


# =====================#
#   DB Table 생성
# =====================#
@app.on_event("startup")
def startup():
    print("📌 Creating tables...")
    Base.metadata.create_all(bind=engine)


# =====================#
#   CORS 설정
# =====================#
origins = ["http://localhost:3000", "http://127.0.0.1:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =====================#
#   Static 경로
# =====================#
app.mount("/static", StaticFiles(directory="app/static"), name="static")

# =====================#
#   API ROOT
# =====================#
@app.get("/")
def root():
    return {"message": "SOOL API V2 is running 🚀"}


# ❗ 기존 /sool/search 는 삭제(중복 & 충돌 위험)
# 필요하다면 /v1 경로로 별도 운영 추천
