import os
from datetime import datetime

import pandas as pd

from app.models.user import User  # noqa: F401 (모델 등록용)
from app.core.database import SessionLocal
from app.models.sense import Sense
from app.models.sool import Sool

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSV_PATH = os.path.abspath(os.path.join(BASE_DIR, "../data/sense_clean.csv"))


def to_float(x):
    try:
        if x is None or pd.isna(x):
            return None
        s = str(x).strip()
        if s == "" or s.lower() in ("nan", "none", "null"):
            return None
        return float(s.replace(",", "."))
    except Exception:
        return None


def clean_str(x, default=None):
    if x is None or pd.isna(x):
        return default
    s = str(x).strip()
    if s == "" or s.lower() in ("nan", "none", "null"):
        return default
    return s


def parse_date(x):
    s = clean_str(x)
    if not s:
        return None
    for fmt in ("%Y-%m-%d", "%Y.%m.%d", "%Y/%m/%d", "%Y-%m-%d %H:%M:%S"):
        try:
            return datetime.strptime(s, fmt)
        except Exception:
            pass
    try:
        return datetime.fromisoformat(s)
    except Exception:
        return None


def set_sense_date_like(obj, dt):
    """Sense 모델에 date가 있으면 date에, 없으면 created_at에 저장(있을 때만)."""
    if hasattr(obj, "date"):
        # 컬럼 타입이 문자열일 수도 있어서 ISO 문자열로 저장
        setattr(obj, "date", dt.isoformat(sep=" ") if dt else None)
        return
    if hasattr(obj, "created_at") and dt:
        setattr(obj, "created_at", dt)


def main():
    print(f"\n📂 Loading CSV → {CSV_PATH}")

    df = pd.read_csv(CSV_PATH)
    # ✅ 핵심: pandas NaN -> None
    df = df.where(pd.notnull(df), None)

    db = SessionLocal()

    inserted_sense = 0
    created_sool = 0
    updated_sense = 0

    for _, row in df.iterrows():
        name = clean_str(row.get("name"))
        if not name:
            continue

        category = clean_str(row.get("category"), "")
        abv = to_float(row.get("abv"))
        region = clean_str(row.get("region"), "")
        notes = clean_str(row.get("notes"))
        producer = clean_str(row.get("양조장/제조"))
        dt = parse_date(row.get("date"))

        # 1) sool 존재 여부
        sool = db.query(Sool).filter(Sool.name == name).first()

        # 2) 없으면 신규 생성
        if not sool:
            sool = Sool(
                name=name,
                category=category,
                abv=abv if abv is not None else 0,
                region=region if region else "미등록",
                description=notes[:200] if notes else None,
                producer=producer,  # ✅ NaN이면 None
            )
            db.add(sool)

            # ✅ commit 대신 flush로 id 확보 (중간 rollback 리스크/성능 개선)
            db.flush()
            db.refresh(sool)

            created_sool += 1
            print(f"🆕 New SOOL Created → {sool.id}: {name}")

        # 3) sense upsert
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
            sense.notes = notes

            # ✅ date 컬럼 유무 자동 대응
            set_sense_date_like(sense, dt)

            updated_sense += 1
        else:
            sense_kwargs = dict(
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
                notes=notes,
            )

            new_sense = Sense(**sense_kwargs)
            set_sense_date_like(new_sense, dt)

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
