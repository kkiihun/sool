from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import (
    hash_password, verify_password, create_access_token,
    ACCESS_TOKEN_EXPIRE_MINUTES, COOKIE_SECURE, COOKIE_NAME,
)
from app.models.user import User
from app.schemas.auth import UserCreate, UserLogin

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/signup")
def signup(user: UserCreate, db: Session = Depends(get_db)):
    exists = db.query(User).filter(User.email == user.email).first()
    if exists:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = User(
        email=user.email,
        username=user.username,
        hashed_password=hash_password(user.password)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "User created successfully"}

@router.post("/login")
def login(user: UserLogin, response: Response, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if db_user.status == "suspended":
        raise HTTPException(status_code=403, detail="Account suspended. Contact support.")
    if db_user.status == "locked":
        raise HTTPException(status_code=403, detail="Account locked for security.")

    token = create_access_token({"sub": str(db_user.id)})

    # ✅ HttpOnly 쿠키로만 전달 (JS 에서 토큰 접근 불가)
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        samesite="lax",
        secure=COOKIE_SECURE,
        path="/",
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )

    return {
        "id": db_user.id,
        "email": db_user.email,
        "username": db_user.username,
        "is_admin": db_user.is_admin,
    }

@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(key=COOKIE_NAME, path="/")
    return {"ok": True}
