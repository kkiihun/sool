from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from app.core.database import SessionLocal, Base, engine
from app.api.sool import router as sool_router
from app.api.tasting import router as tasting_router
from app.api.review import router as review_router
from app.api.sense import router as sense_router
from app.api import sool, sense, review, update_log
from app.api import auth
from app.api import users

# --- 반드시 추가해야 하는 모델 import ---
from app.models.sool import Sool
from app.models.review import Review
from app.models.sense import Sense
from app.models.tasting import Tasting
from app.models.tasting_note import TastingNote

from app.api import update_log


app = FastAPI(title="SOOL API MVP")


# 🚀 정답: DB 테이블 생성은 startup 이벤트에서 실행해야 함
@app.on_event("startup")
def startup():
    print("📌 Creating tables...")
    Base.metadata.create_all(bind=engine)


# CORS 설정
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(sool_router)
app.include_router(tasting_router)
app.include_router(review_router)
app.include_router(sense_router)
app.include_router(update_log.router)
app.include_router(auth.router)
app.include_router(users.router)

@app.get("/")
def root():
    return {"message": "SOOL MVP API is running 🚀"}


@app.get("/sool/search")
def search_sool(q: str = Query(..., min_length=1)):
    db = SessionLocal()
    results = db.query(Sool).filter(Sool.name.ilike(f"%{q}%")).all()
    return results
