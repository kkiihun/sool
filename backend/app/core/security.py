import os
import warnings
from datetime import datetime, timedelta, timezone
from jose import jwt
from passlib.context import CryptContext

# =========================
# 설정 (환경변수)
# =========================
_DEV_SECRET = "dev-secret-key-change-this"
SECRET_KEY = os.getenv("SECRET_KEY", _DEV_SECRET)
if SECRET_KEY == _DEV_SECRET:
    warnings.warn("SECRET_KEY 가 설정되지 않아 개발용 키를 사용합니다. 서버에서는 .env 에 꼭 설정하세요.")

ALGORITHM = "HS256"
# 토큰 만료 = 쿠키 만료 (기본 7일)
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60 * 24 * 7))
# https 로 공개할 때 true 로 변경
COOKIE_SECURE = os.getenv("COOKIE_SECURE", "false").lower() == "true"
COOKIE_NAME = "access_token"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
