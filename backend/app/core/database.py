from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = "mysql+pymysql://sooluser:soolpass@127.0.0.1:3306/sool"

# ✅ MariaDB 엔진 생성 (SQLite 옵션 제거)
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    echo=True   # 추가
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()

# FastAPI Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
