import os
import re
import sys
from collections import Counter

import pandas as pd
from sqlalchemy.exc import SQLAlchemyError

# 프로젝트 루트를 path에 추가하여 app 모듈을 찾을 수 있게 함
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.models.tasting_note import TastingNote
from app.models.sool import Sool
from app.models.user import User  # noqa: F401

BASE_PATH = os.path.dirname(__file__)
PROJECT_ROOT = os.path.dirname(BASE_PATH)

DEFAULT_SENSE_FILE = os.path.join(PROJECT_ROOT, "data", "sense_clean.csv")
LEGACY_SENSE_FILE = os.path.join(BASE_PATH, "sense_clean.csv")

MIN_SOOL_COUNT = int(os.getenv("MIN_SOOL_COUNT", "1000"))
COMMIT_EVERY = int(os.getenv("COMMIT_EVERY", "200"))

CANDIDATE_NUM_FIELDS = [
    "aroma",
    "sweetness",
    "acidity",
    "body",
    "finish",
    "rating",
    "color",
    "carbonation",
    "smoothness",
    "clarity",
    "aftertaste",
]
CANDIDATE_STR_FIELDS = ["notes"]


def clean_int(value, default=None):
    if value is None or pd.isna(value) or value == "":
        return default
    s = str(value).strip()
    if s.lower() in ("nan", "none", "null"):
        return default
    match = re.findall(r"-?\d+", s)
    return int(match[0]) if match else default


def clean_float(value, default=None):
    if value is None or pd.isna(value) or value == "":
        return default
    s = str(value).strip()
    if s.lower() in ("nan", "none", "null"):
        return default
    s = s.replace("%", "").replace(",", ".")
    match = re.findall(r"-?\d+\.?\d*", s)
    return float(match[0]) if match else default


def clean_str(value, default=None, max_len=None):
    if value is None or pd.isna(value):
        return default
    s = str(value).strip()
    if s == "" or s.lower() in ("nan", "none", "null"):
        return default
    if max_len:
        s = s[:max_len]
    return s


def resolve_csv_path():
    if os.path.exists(DEFAULT_SENSE_FILE):
        return DEFAULT_SENSE_FILE
    if os.path.exists(LEGACY_SENSE_FILE):
        return LEGACY_SENSE_FILE
    return DEFAULT_SENSE_FILE


def import_sense():
    db = SessionLocal()

    inserted_total = 0
    skipped_exists = 0
    skipped_missing_sool = 0
    skipped_bad_row = 0
    errors = 0
    missing_sool_ids = []

    csv_path = resolve_csv_path()
    print(f"\nLoading: {csv_path}")

    if not os.path.exists(csv_path):
        print("sense_clean.csv not found in backend/data or backend/scripts")
        db.close()
        return

    sool_count = db.query(Sool).count()
    if sool_count < MIN_SOOL_COUNT:
        db.close()
        raise RuntimeError(
            f"sool count too low ({sool_count}). "
            "Run scripts/import_sool_basic.py first. "
            "If you really want to bypass, set MIN_SOOL_COUNT=0."
        )

    df = pd.read_csv(csv_path)
    df = df.where(pd.notnull(df), None)

    print(f"rows={len(df)} cols={len(df.columns)} (sool_cnt={sool_count})")

    sense_cols = set(TastingNote.__table__.columns.keys())

    for idx, row in df.iterrows():
        sool_id = clean_int(row.get("sool_id"))
        sool_name = clean_str(row.get("name"))

        sool = None
        if sool_id:
            sool = db.query(Sool).filter(Sool.id == sool_id).first()
        elif sool_name:
            sool = db.query(Sool).filter(Sool.name == sool_name).first()

        if not sool:
            if not sool_id and not sool_name:
                skipped_bad_row += 1
                continue
            skipped_missing_sool += 1
            if sool_id:
                missing_sool_ids.append(sool_id)
            continue

        sool_id = sool.id

        exists = db.query(TastingNote).filter(TastingNote.sool_id == sool_id).first()
        if exists:
            skipped_exists += 1
            continue

        payload = {}

        if "sool_id" in sense_cols:
            payload["sool_id"] = sool_id

        for field in CANDIDATE_NUM_FIELDS:
            if field in sense_cols and field in df.columns:
                payload[field] = clean_float(row.get(field), default=0.0)

        if "rating" in sense_cols and "overall_score" in df.columns:
            payload["rating"] = clean_float(row.get("overall_score"), default=0.0)

        for field in CANDIDATE_STR_FIELDS:
            if field in sense_cols and field in df.columns:
                payload[field] = clean_str(row.get(field), default="", max_len=1000)

        if "user_id" in sense_cols and "user_id" not in payload:
            default_user_id = os.getenv("DEFAULT_USER_ID")
            if default_user_id:
                payload["user_id"] = int(default_user_id)

        try:
            with db.begin_nested():
                db.add(TastingNote(**payload))
                db.flush()
            inserted_total += 1

            if inserted_total % COMMIT_EVERY == 0:
                db.commit()
                print(f"committed {inserted_total} rows...")

        except SQLAlchemyError as exc:
            errors += 1
            print(f"row error at {os.path.basename(csv_path)}:{idx} sool_id={sool_id} => {exc}")

    db.commit()
    db.close()

    print("\n==================== Sense Import Summary ====================")
    print(f"Inserted                 : {inserted_total}")
    print(f"Skipped (sense exists)   : {skipped_exists}")
    print(f"Skipped (missing sool)   : {skipped_missing_sool}")
    print(f"Skipped (bad row)        : {skipped_bad_row}")
    print(f"Errors                   : {errors}")

    if missing_sool_ids:
        top = Counter(missing_sool_ids).most_common(10)
        print(f"Top missing sool_id (top10): {top}")

    print("=============================================================\n")


if __name__ == "__main__":
    import_sense()
