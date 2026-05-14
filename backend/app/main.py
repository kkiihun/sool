from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware
from fastapi import HTTPException
from app.core.config import settings
from sqlalchemy import text

# =====================#
#   DB + ORM
# =====================#
from app.core.database import SessionLocal, Base, engine

# =====================#
#   APP 생성
# =====================#
app = FastAPI(
    title="SOOL API V2",
    description="Korean Traditional Spirits Database API",
    version="0.1.0"
)

# =====================#
#   Model Import
# =====================#
from app.models.sool import Sool
from app.models.review import Review
from app.models.tasting_note import TastingNote

# =====================#
#   Router Import
# =====================#
from app.api.sool import router as sool_router
from app.api.review import router as review_router
from app.api.sense import router as sense_router
from app.api import update_log, auth, users
from app.api import report
from app.api.utils.recommender import flavor_vector
from app.api.tasting_note import router as tasting_note_router
from app.api.social_auth import router as social_auth_router

# =====================#
#   Router 등록
# =====================#
app.include_router(sool_router)       # 구버전 sool API (TastingNote 사용하도록 내부 수정 예정)
app.include_router(review_router)
app.include_router(sense_router)      # Legacy Redirect (TastingNote 사용)
app.include_router(update_log.router)
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(report.router)
app.include_router(tasting_note_router) # 신규 표준 API
app.include_router(social_auth_router)

# =====================#
#   DB Table 생성
# =====================#
Base.metadata.create_all(bind=engine)

# =====================#
#   Middleware
# =====================#
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(SessionMiddleware, secret_key=settings.SESSION_SECRET_KEY)

# =====================#
#   Static Files
# =====================#
app.mount("/static", StaticFiles(directory="app/static"), name="static")

@app.get("/")
def read_root():
    return {"message": "Welcome to SOOL API V2"}

# V2용 별도 sool 라우터가 있다면 등록 (현재는 sool_v2.py 확인 필요)
from app.api.sool_v2 import router as sool_v2_router
app.include_router(sool_v2_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
