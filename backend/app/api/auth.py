from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.config import settings
from app.core.security import hash_password, verify_password, create_access_token
from app.models.user import User
from app.schemas.auth import UserCreate, UserLogin, Token

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

@router.post("/login", response_model=Token)
def login(user: UserLogin, response: Response, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if db_user.status == "suspended":
        raise HTTPException(status_code=403, detail="Account suspended. Contact support.")
    if db_user.status == "locked":
        raise HTTPException(status_code=403, detail="Account locked for security.")

    token = create_access_token({"sub": str(db_user.id)})

    # ??HttpOnly Ïø†ÌÇ§ ?¨Í∏∞ (C???µÏã¨)
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        samesite="lax",
        secure=settings.SESSION_COOKIE_SECURE,
        path="/",
        max_age=60 * 60 * 24 * 7,  # 7??
    )

    # ÏßÄÍ∏àÏ? ?ÑÎ°†???∏Ìôò ?ÑÌï¥ ?†ÌÅ∞??Í∞ôÏù¥ Î∞òÌôò (?òÏ§ë???úÍ±∞ Í∞Ä??
    return {"access_token": token, "token_type": "bearer"}

@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(key="access_token", path="/")
    return {"ok": True}
