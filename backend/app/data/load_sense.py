import os
from datetime import datetime

import pandas as pd

from app.models.user import User  # noqa: F401 (모델 등록용)
from app.core.database import SessionLocal
from app.models.tasting_note import TastingNote
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


def set_note_date_like(obj, dt):
    """TastingNote 모델에 date가 있으면 date에, 없으면 created_at에 저장(있을 때만)."""
    if hasattr(obj, "date"):
        setattr(obj, "date", dt.isoformat(sep=" ") if dt else None)
        return
    if hasattr(obj, "created_at") and dt:
        setattr(obj, "created_at", dt)


def main():
    print(f"\n📂 Loading CSV → {CSV_PATH}")

    df = pd.read_csv(CSV_PATH)
    df = df.where(pd.notnull(df), None)

    db = SessionLocal()

    inserted_note = 0
    created_sool = 0
    updated_note = 0

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
                producer=producer,
            )
            db.add(sool)
            db.flush()
            db.refresh(sool)

            created_sool += 1
            print(f"🆕 New SOOL Created → {sool.id}: {name}")

        # 3) TastingNote upsert
        note = db.query(TastingNote).filter(TastingNote.sool_id == sool.id).first()

        if note:
            note.clarity = to_float(row.get("clarity"))
            note.color = to_float(row.get("color"))
            note.smoothness = to_float(row.get("smoothness"))
            # aftertaste (CSV) -> finish (TastingNote)
            note.finish = to_float(row.get("aftertaste")) or to_float(row.get("finish"))
            note.aroma = to_float(row.get("aroma"))
            note.sweetness = to_float(row.get("sweetness"))
            note.body = to_float(row.get("body"))
            note.acidity = to_float(row.get("acidity"))
            note.carbonation = to_float(row.get("carbonation"))
            note.complexity = to_float(row.get("complexity"))
            note.rating = to_float(row.get("overall_score")) or 3.0
            note.notes = notes

            set_note_date_like(note, dt)
            updated_note += 1
        else:
            note_kwargs = dict(
                sool_id=sool.id,
                clarity=to_float(row.get("clarity")),
                color=to_float(row.get("color")),
                smoothness=to_float(row.get("smoothness")),
                finish=to_float(row.get("aftertaste")) or to_float(row.get("finish")),
                aroma=to_float(row.get("aroma")),
                sweetness=to_float(row.get("sweetness")),
                body=to_float(row.get("body")),
                acidity=to_float(row.get("acidity")),
                carbonation=to_float(row.get("carbonation")),
                complexity=to_float(row.get("complexity")),
                rating=to_float(row.get("overall_score")) or 3.0,
                notes=notes,
            )

            new_note = TastingNote(**note_kwargs)
            set_note_date_like(new_note, dt)

            db.add(new_note)
            inserted_note += 1

    db.commit()
    db.close()

    print("\n==================== 📊 Import Summary ====================")
    print(f"🍶 신규 SOOL 생성       : {created_sool}")
    print(f"🧪 새로운 Note 삽입     : {inserted_note}")
    print(f"♻ 기존 Note 업데이트    : {updated_note}")
    print("==========================================================\n")


if __name__ == "__main__":
    main()
