# scripts/migrate_sqlite_to_mariadb.py

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.database import Base
from app.models.sool import Sool
from app.models.review import Review
from app.models.sense import Sense

# -------------------------
# DB URLs
# -------------------------
SQLITE_DB_URL = "sqlite:////Users/kimkihun/Documents/sool/backend/sool.db"
MARIADB_URL = "mysql+pymysql://sooluser:soolpass@127.0.0.1:3306/sool"

# -------------------------
# Engines & Sessions
# -------------------------
sqlite_engine = create_engine(SQLITE_DB_URL)
mariadb_engine = create_engine(MARIADB_URL)

SQLiteSession = sessionmaker(bind=sqlite_engine)
MariaDBSession = sessionmaker(bind=mariadb_engine)

sqlite_db = SQLiteSession()
mariadb_db = MariaDBSession()

# -------------------------
# Migration Helpers
# -------------------------
def migrate_sool():
    print("🚚 Migrating sool...")
    records = sqlite_db.query(Sool).all()
    for r in records:
        mariadb_db.merge(Sool(
            id=r.id,
            name=r.name,
            category=r.category,
            abv=r.abv,
            region=r.region,
            description=r.description,
            producer=r.producer,
            ingredients=r.ingredients
        ))
    mariadb_db.commit()
    print(f"✅ sool: {len(records)} rows migrated")

def migrate_sense():
    print("🚚 Migrating sense...")
    records = sqlite_db.query(Sense).all()
    for r in records:
        mariadb_db.merge(Sense(
            id=r.id,
            sool_id=r.sool_id,
            clarity=r.clarity,
            color=r.color,
            smoothness=r.smoothness,
            aftertaste=r.aftertaste,
            aroma=r.aroma,
            sweetness=r.sweetness,
            body=r.body,
            acidity=r.acidity,
            carbonation=r.carbonation,
            complexity=r.complexity,
            rating=r.rating,
            notes=r.notes,
            date=r.date
        ))
    mariadb_db.commit()
    print(f"✅ sense: {len(records)} rows migrated")

def migrate_reviews():
    print("🚚 Migrating reviews...")
    records = sqlite_db.query(Review).all()
    for r in records:
        mariadb_db.merge(Review(
            id=r.id,
            sool_id=r.sool_id,
            rating=r.rating,
            notes=r.notes,
            created_at=r.created_at
        ))
    mariadb_db.commit()
    print(f"✅ reviews: {len(records)} rows migrated")

# -------------------------
# Run Migration
# -------------------------
if __name__ == "__main__":
    try:
        print("🔄 Starting SQLite → MariaDB migration")
        migrate_sool()
        migrate_sense()
        migrate_reviews()
        print("🎉 Migration completed successfully!")
    except Exception as e:
        mariadb_db.rollback()
        raise e
    finally:
        sqlite_db.close()
        mariadb_db.close()
