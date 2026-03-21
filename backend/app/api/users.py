from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from typing import List

router = APIRouter(prefix="/users", tags=["users"])


from pydantic import BaseModel, Field
from app.core.security import hash_password

class UserUpdate(BaseModel):
    username: str | None = None
    password: str | None = Field(None, min_length=6)

@router.get("/me")
def read_users_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "username": current_user.username,
        "is_admin": current_user.is_admin,
    }

@router.patch("/me")
def update_user_me(
    payload: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if payload.username:
        current_user.username = payload.username
    
    if payload.password:
        current_user.hashed_password = hash_password(payload.password)
    
    db.commit()
    db.refresh(current_user)
    return {"message": "Profile updated successfully", "username": current_user.username}

@router.put("/{user_id}/status")
def update_user_status(
    user_id: int,
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    new_status = payload.get("status")
    if new_status not in ["active", "suspended", "locked"]:
        raise HTTPException(status_code=400, detail="Invalid status")
        
    user.status = new_status
    db.commit()
    return {"message": f"User status updated to {new_status}"}

@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
        
    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully"}

@router.get("/all")
def get_all_users(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized. Admin only.")
    
    users = db.query(User).all()
    return [
        {
            "id": u.id,
            "email": u.email,
            "username": u.username,
            "is_admin": u.is_admin,
            "is_active": u.is_active,
            "status": u.status or "active"
        } for u in users
    ]

@router.put("/{user_id}/toggle-admin")
def toggle_admin(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.is_admin = not user.is_admin
    db.commit()
    return {"message": f"User {user.username} admin status updated to {user.is_admin}"}
