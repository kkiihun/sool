from app.core.database import SessionLocal
from app.models.user import User

def check_users():
    db = SessionLocal()
    users = db.query(User).all()
    print(f"Total users: {len(users)}")
    for u in users:
        print(f"ID: {u.id}, Email: {u.email}, Username: {u.username}, Admin: {u.is_admin}")
    db.close()

if __name__ == "__main__":
    check_users()
