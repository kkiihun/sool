import sys
import os

# 프로젝트 루트 경로 추가
# sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))) # 루트가 backend라고 가정
sys.path.append(os.getcwd()) # backend 폴더에서 실행한다고 가정

from app.core.database import engine, Base
from app.models.user import User
from app.models.sool import Sool
from app.models.review import Review
from app.models.tasting_note import TastingNote

def sync_db():
    print("🚀 Database Schema Sync Start (Standardized)...")
    try:
        # 모든 모델의 테이블 생성 (이미 있으면 무시)
        Base.metadata.create_all(bind=engine)
        print("✅ All tables (including tasting_notes) created or already exist.")
        
        from sqlalchemy import text
        with engine.connect() as conn:
            # users 테이블에 is_admin 컬럼이 있는지 확인 후 추가
            try:
                conn.execute(text("ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE"))
                print("➕ Added 'is_admin' column to 'users' table.")
            except Exception:
                pass

            # tasting_notes 테이블은 Base.metadata.create_all로 생성되지만,
            # 기존 sense 테이블의 데이터를 옮겨야 한다면 별도 마이그레이션 스크립트가 필요합니다.
            
            # reviews 테이블에 user_id 컬럼이 있는지 확인 후 추가
            try:
                conn.execute(text("ALTER TABLE reviews ADD COLUMN user_id INTEGER REFERENCES users(id)"))
                print("➕ Added 'user_id' column to 'reviews' table.")
            except Exception:
                pass
            
            conn.commit()
            
        print("✨ Database Sync Completed Successfully!")
    except Exception as e:
        print(f"❌ Error during sync: {e}")

if __name__ == "__main__":
    sync_db()
