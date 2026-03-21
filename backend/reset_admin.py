from app.core.database import SessionLocal
from app.models.user import User
from app.core.security import hash_password

def reset_admin_account(email, username, password):
    db = SessionLocal()
    user = db.query(User).filter(User.email == email).first()
    
    hashed_pwd = hash_password(password)
    
    if user:
        user.username = username
        user.hashed_password = hashed_pwd
        user.is_admin = True
        print(f"Updated existing user: {email}")
    else:
        user = User(
            email=email,
            username=username,
            hashed_password=hashed_pwd,
            is_admin=True
        )
        db.add(user)
        print(f"Created new admin user: {email}")
        
    db.commit()
    db.close()
    print(f"Admin account ready. ID: {email}, PW: {password}")

if __name__ == "__main__":
    import sys
    # Default values if not provided
    email = sys.argv[1] if len(sys.argv) > 1 else "admin@sool.com"
    pwd = sys.argv[2] if len(sys.argv) > 2 else "admin1234"
    reset_admin_account(email, "SuperAdmin", pwd)
