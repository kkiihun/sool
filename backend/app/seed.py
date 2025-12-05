from pathlib import Path
import csv
from sqlalchemy.orm import Session

# 🔹 여기는 main.py 에서 쓰는 거랑 똑같이 맞춰야 함
# main.py 에서 SessionLocal 을 어디서 import 하는지 확인해보면
# 보통 `from app.core.database import SessionLocal` 이런 식일 거야.
from .core.database import SessionLocal
# Sool 모델도 main.py 에서 어떻게 import 하는지 그대로 가져오면 된다.
# 예: from app.models.sool import Sool 이면 아래처럼:
from .models.sool import Sool  # main.py 에 맞게 경로 조정 필요하면 여기만 바꿔

# 🔹 CSV 경로 (backend/data/sool_basic.csv)
BASE_DIR = Path(__file__).resolve().parent.parent  # backend/
CSV_PATH = BASE_DIR / "data" / "sool_basic.csv"


def seed():
    db: Session = SessionLocal()

    print("🗑 기존 데이터 삭제 중...")
    db.query(Sool).delete()
    db.commit()

    print(f"📥 CSV 불러오는 중: {CSV_PATH}")

    with open(CSV_PATH, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)

        inserted = 0
        for row in reader:
            item = Sool(
                name=row.get("name", "").strip(),
                category=row.get("category", "").strip(),
                region=row.get("region", "").strip(),
                abv=float(row.get("abv", 0) or 0),
            )
            db.add(item)
            inserted += 1

        db.commit()

    db.close()
    print(f"🎉 Seed 완료: 총 {inserted}개 항목이 DB에 저장되었습니다.")


if __name__ == "__main__":
    seed()
