import os
import re
from collections import Counter

import pandas as pd
from sqlalchemy.exc import SQLAlchemyError

from app.core.database import SessionLocal
from app.models.sool import Sool
from app.models.user import User   # noqa: F401  (모델 등록용)
from app.models.sense import Sense # noqa: F401  (모델 등록용)

# load_sense.py 위치 기준으로 CSV가 같은 폴더(app/data)에 있다고 가정
BASE_PATH = os.path.dirname(__file__)

SENSE_FILE = "sense_clean.csv"

# ✅ 사고 방지 가드: sool이 너무 적으면 sense를 돌리지 말고 즉시 중단
MIN_SOOL_COUNT = int(os.getenv("MIN_SOOL_COUNT", "1000"))
COMMIT_EVERY = int(os.getenv("COMMIT_EVERY", "200"))

# ✅ 모델에 존재할 때만 주입(프로젝트마다 Sense 컬럼이 다를 수 있어서 안전하게)
CANDIDATE_NUM_FIELDS = [
    "aroma", "sweetness", "acidity", "body", "finish",
    "rating", "color", "carbonation", "smoothness", "clarity", "aftertaste"
]
CANDIDATE_STR_FIELDS = ["notes"]


def clean_int(value, default=None):
    if value is None or pd.isna(value) or value == "":
        return default
    s = str(value).strip()
    if s.lower() in ("nan", "none", "null"):
        return default
    m = re.findall(r"-?\d+", s)
    return int(m[0]) if m else default


def clean_float(value, default=None):
    if value is None or pd.isna(value) or value == "":
        return default
    s = str(value).strip()
    if s.lower() in ("nan", "none", "null"):
        return default
    # "12,5" / "12.5%" 방어
    s = s.replace("%", "").replace(",", ".")
    m = re.findall(r"-?\d+\.?\d*", s)
    return float(m[0]) if m else default


def clean_str(value, default=None, max_len=None):
    if value is None or pd.isna(value):
        return default
    s = str(value).strip()
    if s == "" or s.lower() in ("nan", "none", "null"):
        return default
    if max_len:
        s = s[:max_len]
    return s


def import_sense():
    db = SessionLocal()

    inserted_total = 0
    skipped_exists = 0
    skipped_missing_sool = 0
    skipped_bad_row = 0
    errors = 0

    missing_sool_ids = []

    csv_path = os.path.join(BASE_PATH, SENSE_FILE)
    print(f"\n📂 Loading: {csv_path}")

    if not os.path.exists(csv_path):
        print(f"❌ 파일 없음: {SENSE_FILE}")
        db.close()
        return

    # ✅ sool 카운트 가드
    sool_cnt = db.query(Sool).count()
    if sool_cnt < MIN_SOOL_COUNT:
        db.close()
        raise RuntimeError(
            f"sool count too low ({sool_cnt}). "
            f"Run scripts/load_data.py first (expect ~1192). "
            f"If you really want to bypass, set MIN_SOOL_COUNT=0."
        )

    df = pd.read_csv(csv_path)
    df = df.where(pd.notnull(df), None)

    print(f"✅ rows={len(df)} cols={len(df.columns)} (sool_cnt={sool_cnt})")

    # ✅ Sense 모델 컬럼 키 목록 (존재하는 컬럼만 넣기)
    sense_cols = set(Sense.__table__.columns.keys())

    for idx, row in df.iterrows():
        sool_id = clean_int(row.get("sool_id"))
        if not sool_id:
            skipped_bad_row += 1
            continue

        # ✅ sool 존재 확인 (절대 생성하지 않음)
        sool = db.query(Sool).filter(Sool.id == sool_id).first()
        if not sool:
            skipped_missing_sool += 1
            missing_sool_ids.append(sool_id)
            continue

        # ✅ 중복 방지: (데이터셋 특성상) sool_id당 1개만 들어가게
        exists = db.query(Sense).filter(Sense.sool_id == sool_id).first()
        if exists:
            skipped_exists += 1
            continue

        payload = {}

        # FK
        if "sool_id" in sense_cols:
            payload["sool_id"] = sool_id

        # ✅ 숫자 필드: 모델에 존재 + CSV 컬럼 존재 시만
        for f in CANDIDATE_NUM_FIELDS:
            if f in sense_cols and f in df.columns:
                payload[f] = clean_float(row.get(f), default=0.0)

        # ✅ 문자열 필드
        for f in CANDIDATE_STR_FIELDS:
            if f in sense_cols and f in df.columns:
                payload[f] = clean_str(row.get(f), default="", max_len=1000)

        # ✅ (옵션) Sense 모델에 user_id가 필수인데 CSV에 없다면 환경변수로 주입 가능
        # 예: DEFAULT_USER_ID=1
        if "user_id" in sense_cols and "user_id" not in payload:
            default_user_id = os.getenv("DEFAULT_USER_ID")
            if default_user_id:
                payload["user_id"] = int(default_user_id)

        try:
            with db.begin_nested():
                db.add(Sense(**payload))
                db.flush()
            inserted_total += 1

            if inserted_total % COMMIT_EVERY == 0:
                db.commit()
                print(f"💾 committed {inserted_total} rows...")

        except SQLAlchemyError as e:
            errors += 1
            print(f"❌ row error at {SENSE_FILE}:{idx} sool_id={sool_id} => {e}")

    db.commit()
    db.close()

    print("\n==================== 📊 Sense Import Summary ====================")
    print(f"✅ Inserted                 : {inserted_total}")
    print(f"↩️  Skipped (sense exists)   : {skipped_exists}")
    print(f"⚠️  Skipped (missing sool)   : {skipped_missing_sool}")
    print(f"⚠️  Skipped (bad row)        : {skipped_bad_row}")
    print(f"❌ Errors                   : {errors}")

    if missing_sool_ids:
        top = Counter(missing_sool_ids).most_common(10)
        print(f"🔎 Top missing sool_id (top10): {top}")

    print("===============================================================\n")


if __name__ == "__main__":
    import_sense()
