import os
import sys

from sqlalchemy import text

# Add project root to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import Base, engine
from app.models.review import Review  # noqa: F401
from app.models.sool import Sool  # noqa: F401
from app.models.tasting_note import TastingNote  # noqa: F401
from app.models.user import User  # noqa: F401
from app.models.sool_v2 import SoolV2, Category, Region, Producer, TastingNoteV2, ReviewV2, Tag, SoolTag  # noqa: F401
from app.models.food_pairing import FoodTag  # noqa: F401


def apply_alter(conn, sql: str, success_message: str, exists_message: str):
    try:
        conn.execute(text(sql))
        print(f"➕ {success_message}")
    except Exception:
        if exists_message:
            print(f"ℹ️ {exists_message}")


def sync_db():
    print("🚀 Database Schema Sync Start (Standardized)...")
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ All tables created or already exist.")

        with engine.connect() as conn:
            apply_alter(
                conn,
                "ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE",
                "Added 'is_admin' column to 'users' table.",
                "'is_admin' column already exists in 'users'.",
            )
            apply_alter(
                conn,
                "ALTER TABLE users ADD COLUMN status VARCHAR(20) DEFAULT 'active'",
                "Added 'status' column to 'users' table.",
                "'status' column already exists in 'users'.",
            )
            apply_alter(
                conn,
                "ALTER TABLE reviews ADD COLUMN user_id INTEGER REFERENCES users(id)",
                "Added 'user_id' column to 'reviews' table.",
                "'user_id' column already exists in 'reviews'.",
            )
            apply_alter(
                conn,
                "ALTER TABLE reviews ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP",
                "Added 'created_at' column to 'reviews' table.",
                "'created_at' column already exists in 'reviews'.",
            )
            apply_alter(
                conn,
                "ALTER TABLE sool ADD COLUMN image_url VARCHAR(500)",
                "Added 'image_url' column to 'sool' table.",
                "'image_url' column already exists in 'sool'.",
            )
            apply_alter(
                conn,
                "ALTER TABLE tasting_notes ADD COLUMN user_id INTEGER REFERENCES users(id)",
                "Added 'user_id' column to 'tasting_notes' table.",
                "'user_id' column already exists in 'tasting_notes'.",
            )
            apply_alter(
                conn,
                "ALTER TABLE tasting_notes ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP",
                "Added 'created_at' column to 'tasting_notes' table.",
                "'created_at' column already exists in 'tasting_notes'.",
            )
            conn.commit()

        print("✨ Database Sync Completed Successfully!")
    except Exception as exc:
        print(f"❌ Error during sync: {exc}")


if __name__ == "__main__":
    sync_db()
