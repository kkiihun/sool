from fastapi import FastAPI
from app.api.sool import router as sool_router
from app.api.tasting import router as tasting_router

app = FastAPI(title="SOOL API MVP")

app.include_router(sool_router, prefix="/sool", tags=["Sool"])
app.include_router(tasting_router, prefix="/tasting", tags=["Tasting"])

@app.get("/")
def root():
    return {"message": "SOOL MVP API is running 🚀"}
