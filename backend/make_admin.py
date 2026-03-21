from app.core.database import SessionLocal
from app.models.user import User

def make_admin(email):
    db = SessionLocal()
    user = db.query(User).filter(User.email == email).first()
    if user:
        user.is_admin = True
        db.commit()
        print(f"User {user.username} ({user.email}) is now an admin.")
    else:
        print(f"User with email {email} not found.")
    db.close()

if __name__ == "__main__":
    import sys
    email = sys.argv[1] if len(sys.argv) > 1 else "test@gmail.com"
    make_admin(email)
