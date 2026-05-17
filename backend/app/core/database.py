import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv
from app.core.config import settings

load_dotenv()  # ← 이 한 줄이 .env 불러오는 핵심


# =========================
# Database configuration
# =========================
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    DB_HOST = os.getenv("DB_HOST", "db")          # docker-compose service name
    DB_PORT = os.getenv("DB_PORT", "3306")
    DB_USER = os.getenv("DB_USER", "sool")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "soolpass")
    DB_NAME = os.getenv("DB_NAME", "sool")

    # 만약 DB_HOST가 localhost이고 DB_PORT가 3306인데 접속이 안될 것 같으면 
    # 혹은 특정 환경변수가 있으면 SQLite로 대체하는 로직을 넣을 수 있습니다.
    DATABASE_URL = (
        f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}"
        f"@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    )

# SQLite 사용 시 check_same_thread 옵션 필요
connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

# =========================
# SQLAlchemy engine
# =========================
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    echo=settings.ENVIRONMENT == "development",
    connect_args=connect_args
)

# =========================
# Session / Base
# =========================
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

Base = declarative_base()

# =========================
# FastAPI dependency
# =========================
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
