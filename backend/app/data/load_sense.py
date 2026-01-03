import os
import pandas as pd

from app.core.database import SessionLocal
from app.models.sense import Sense
from app.models.sool import Sool  # 신규 데이터 자동 생성 지원

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSV_PATH = os.path.abspath(os.path.join(BASE_DIR, "../data/sense_clean.csv"))



def to_float(x):
    try:
        if pd.isna(x) or x == "":
            return None
        return float(str(x).replace(",", "."))
    except:
        return None


def main():
    print(f"\n📂 Loading CSV → {CSV_PATH}")

    df = pd.read_csv(CSV_PATH)
    db = SessionLocal()

    inserted_sense = 0
    created_sool = 0
    updated_sense = 0

    for _, row in df.iterrows():

        name = str(row["name"]).strip()
        category = str(row.get("category") or "").strip()
        abv = to_float(row.get("abv"))
        region = str(row.get("region") or "").strip()

        # 1) sool 존재 여부 확인
        sool = db.query(Sool).filter(Sool.name == name).first()

        # 2) 없으면 신규 생성 🔥
        if not sool:
            sool = Sool(
                name=name,
                category=category,
                abv=abv if abv is not None else 0,
                region=region if region else "미등록",
                description=row.get("notes", "")[:200] if row.get("notes") else None,
                producer=row.get("양조장/제조"),
            )
            db.add(sool)
            db.commit()       # sool.id가 필요하므로 commit
            db.refresh(sool)
            created_sool += 1
            print(f"🆕 New SOOL Created → {sool.id}: {name}")

        # 3) sense 테이블에 기존 데이터 있으면 update 로직도 추가
        sense = db.query(Sense).filter(Sense.sool_id == sool.id).first()

        if sense:
            sense.clarity = to_float(row.get("clarity"))
            sense.color = to_float(row.get("color"))
            sense.smoothness = to_float(row.get("smoothness"))
            sense.aftertaste = to_float(row.get("aftertaste"))
            sense.aroma = to_float(row.get("aroma"))
            sense.sweetness = to_float(row.get("sweetness"))
            sense.body = to_float(row.get("body"))
            sense.acidity = to_float(row.get("acidity"))
            sense.carbonation = to_float(row.get("carbonation"))
            sense.complexity = to_float(row.get("complexity"))
            sense.rating = to_float(row.get("overall_score"))
            sense.notes = row.get("notes")
            sense.date = str(row.get("date")) if not pd.isna(row.get("date")) else None

            updated_sense += 1

        else:
            new_sense = Sense(
                sool_id=sool.id,
                clarity=to_float(row.get("clarity")),
                color=to_float(row.get("color")),
                smoothness=to_float(row.get("smoothness")),
                aftertaste=to_float(row.get("aftertaste")),
                aroma=to_float(row.get("aroma")),
                sweetness=to_float(row.get("sweetness")),
                body=to_float(row.get("body")),
                acidity=to_float(row.get("acidity")),
                carbonation=to_float(row.get("carbonation")),
                complexity=to_float(row.get("complexity")),
                rating=to_float(row.get("overall_score")),
                notes=row.get("notes"),
                date=str(row.get("date")) if not pd.isna(row.get("date")) else None,
            )
            db.add(new_sense)
            inserted_sense += 1

    db.commit()
    db.close()

    print("\n==================== 📊 Import Summary ====================")
    print(f"🍶 신규 SOOL 생성       : {created_sool}")
    print(f"🧪 새로운 Sense 삽입    : {inserted_sense}")
    print(f"♻ 기존 Sense 업데이트   : {updated_sense}")
    print("==========================================================\n")


if __name__ == "__main__":
    main()
