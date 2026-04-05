# backend/scripts/import_sool_basic.py

import pandas as pd
import re
from app.core.database import SessionLocal, Base, engine
# 모든 모델을 임포트하여 SQLAlchemy가 관계를 해석할 수 있게 합니다.
from app.models.sool import Sool
from app.models.user import User
from app.models.sense import Sense
from app.models.review import Review
from app.models.tasting import Tasting
from app.models.tasting_note import TastingNote

CSV_PATH = "data/sool_basic_clean.csv"


def clean_abv(value):
    if pd.isna(value) or value == "":
        return None

    value = str(value)

    # 1) 콤마 있을 경우 → 첫 번째 숫자만 사용
    if "," in value:
        value = value.split(",")[0]

    # 2) 숫자만 추출 (정규식)
    match = re.findall(r"\d+\.?\d*", value)
    if match:
        return float(match[0])

    return None


def import_sool_data():
    db = SessionLocal()
    df = pd.read_csv(CSV_PATH)

    imported_count = 0

    for _, row in df.iterrows():

        exists = db.query(Sool).filter(Sool.name == row["name"]).first()
        if exists:
            continue

        new_item = Sool(
            name=row["name"],
            abv=clean_abv(row["abv"]),
            category=row.get("category"),
            region=row.get("region")
        )

        db.add(new_item)
        imported_count += 1

    db.commit()
    db.close()

    print(f"🔥 Imported {imported_count} items into SOOL")


if __name__ == "__main__":
    import_sool_data()
