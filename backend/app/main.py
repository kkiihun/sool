from fastapi import FastAPI
from app.api.sool import router as sool_router
from app.api.tasting import router as tasting_router
from app.core.database import Base, engine

# Create DB tables at startup (important)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="SOOL API MVP")

# 👉 prefix/tags는 라우터 파일에서 정의, 여기선 include만 한다
app.include_router(sool_router)
app.include_router(tasting_router)

@app.get("/")
def root():
    return {"message": "SOOL MVP API is running 🚀"}
