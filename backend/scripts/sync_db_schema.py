import sys
import os

# 프로젝트 루트 경로 추가
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import engine, Base
from app.models.user import User
from app.models.sool import Sool
from app.models.sense import Sense
from app.models.review import Review
from app.models.tasting_note import TastingNote

def sync_db():
    print("🚀 Database Schema Sync Start...")
    try:
        # 모든 모델의 테이블 생성 (이미 있으면 무시)
        Base.metadata.create_all(bind=engine)
        print("✅ All tables created or already exist.")
        
        # ❗ 만약 특정 컬럼(is_admin)이 없는 경우를 대비해 수동 SQL 실행 (MariaDB 전용)
        from sqlalchemy import text
        with engine.connect() as conn:
            # users 테이블에 is_admin 컬럼이 있는지 확인 후 추가
            try:
                conn.execute(text("ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE"))
                print("➕ Added 'is_admin' column to 'users' table.")
            except Exception:
                print("ℹ️ 'is_admin' column already exists in 'users'.")

            # sense 테이블에 user_id 컬럼이 있는지 확인 후 추가
            try:
                conn.execute(text("ALTER TABLE sense ADD COLUMN user_id INTEGER REFERENCES users(id)"))
                print("➕ Added 'user_id' column to 'sense' table.")
            except Exception:
                print("ℹ️ 'user_id' column already exists in 'sense'.")

            # sense 테이블에 created_at 컬럼이 있는지 확인 후 추가
            try:
                conn.execute(text("ALTER TABLE sense ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP"))
                print("➕ Added 'created_at' column to 'sense' table.")
            except Exception:
                print("ℹ️ 'created_at' column already exists in 'sense'.")

            # reviews 테이블에 user_id 컬럼이 있는지 확인 후 추가
            try:
                conn.execute(text("ALTER TABLE reviews ADD COLUMN user_id INTEGER REFERENCES users(id)"))
                print("➕ Added 'user_id' column to 'reviews' table.")
            except Exception:
                print("ℹ️ 'user_id' column already exists in 'reviews'.")
            
            # reviews 테이블에 created_at 컬럼이 있는지 확인 후 추가
            try:
                conn.execute(text("ALTER TABLE reviews ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP"))
                print("➕ Added 'created_at' column to 'reviews' table.")
            except Exception:
                print("ℹ️ 'created_at' column already exists in 'reviews'.")
            
            conn.commit()
            
        print("✨ Database Sync Completed Successfully!")
    except Exception as e:
        print(f"❌ Error during sync: {e}")

if __name__ == "__main__":
    sync_db()
