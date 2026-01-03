import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

load_dotenv()  # ← 이 한 줄이 .env 불러오는 핵심


# =========================
# Database configuration
# =========================
DB_HOST = os.getenv("DB_HOST", "db")          # docker-compose service name
DB_PORT = os.getenv("DB_PORT", "3306")
DB_USER = os.getenv("DB_USER", "sool")
DB_PASSWORD = os.getenv("DB_PASSWORD", "soolpass")
DB_NAME = os.getenv("DB_NAME", "sool")

DATABASE_URL = (
    f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}"
    f"@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)

# =========================
# SQLAlchemy engine
# =========================
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    echo=True,          # 개발 단계에서 SQL 로그 확인용
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
