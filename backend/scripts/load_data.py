import pandas as pd
import os
import re
from app.core.database import SessionLocal
from app.models.sool import Sool


BASE_PATH = os.path.join(os.path.dirname(__file__), "..", "data")

FILES = [
    "sool_basic_region_added.csv",
    "sense_clean.csv",
]


def clean_abv(value):
    if pd.isna(value) or value == "":
        return None

    value = str(value)

    # 쉼표 제거 → "12,5%" 같은 데이터 방어
    value = value.split(",")[0]

    # 숫자만 추출
    match = re.findall(r"\d+\.?\d*", value)
    return float(match[0]) if match else None


def import_data():
    db = SessionLocal()
    inserted_total = 0

    for filename in FILES:
        csv_path = os.path.join(BASE_PATH, filename)

        print(f"\n📂 Loading: {csv_path}")

        if not os.path.exists(csv_path):
            print(f"❌ 파일 없음: {filename}")
            continue

        df = pd.read_csv(csv_path)

        file_insert_count = 0
        for _, row in df.iterrows():

            name = str(row.get("name", "")).strip()
            if not name:
                continue

            exists = db.query(Sool).filter(Sool.name == name).first()
            if exists:
                continue

            db.add(
                Sool(
                    name=name,
                    abv=clean_abv(row.get("abv")),
                    region=row.get("region") or "미등록",
                    description=row.get("description"),
                    producer=row.get("producer"),
                    ingredients=row.get("ingredients"),
                )
            )

            inserted_total += 1
            file_insert_count += 1

        db.commit()
        print(f"🔥 {filename} → {file_insert_count}개 삽입 완료")

    db.close()
    print(f"\n🎉 총 {inserted_total}개 레코드 DB에 추가 완료!\n")


if __name__ == "__main__":
    import_data()
