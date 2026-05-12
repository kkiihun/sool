import os
import sys

# 프로젝트 루트를 path에 추가
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.models.user import User
from app.core.security import hash_password

def create_admin(email, username, password):
    db = SessionLocal()
    user = db.query(User).filter(User.email == email).first()
    if user:
        user.is_admin = True
        user.hashed_password = hash_password(password)
        print(f"User {email} updated to admin.")
    else:
        new_user = User(
            email=email,
            username=username,
            hashed_password=hash_password(password),
            is_admin=True
        )
        db.add(new_user)
        print(f"Admin user {email} created.")
    
    db.commit()
    db.close()

if __name__ == "__main__":
    create_admin("admin@sool.com", "GrandMaster", "admin1234")
