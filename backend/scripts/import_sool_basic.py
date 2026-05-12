# backend/scripts/import_sool_basic.py

import pandas as pd
import re
import os
import sys

# 프로젝트 루트를 path에 추가하여 app 모듈을 찾을 수 있게 함
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.models.sool import Sool

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
