from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import SessionLocal
from app.models import Sool
from app.api.sool import router as sool_router
from app.api.tasting import router as tasting_router
from app.core.database import Base, engine
from app.api.review import router as review_router


# Create DB tables at startup (important)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="SOOL API MVP")

# CORS 설정
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,   # "*" 가능하지만 지금은 안전하게
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# 👉 prefix/tags는 라우터 파일에서 정의, 여기선 include만 한다
app.include_router(sool_router)
app.include_router(tasting_router)
app.include_router(review_router)

@app.get("/")
def root():
    return {"message": "SOOL MVP API is running 🚀"}

@app.get("/sool/search")
def search_sool(q: str = Query(..., min_length=1)):
    db = SessionLocal()
    results = db.query(Sool).filter(Sool.name.ilike(f"%{q}%")).all()
    return results

