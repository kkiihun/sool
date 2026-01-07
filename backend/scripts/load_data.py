import os
import re
import pandas as pd
from sqlalchemy.exc import SQLAlchemyError

from app.core.database import SessionLocal
from app.models.sool import Sool
from app.models.user import User   # noqa: F401  (모델 등록용)
from app.models.sense import Sense # noqa: F401  (모델 등록용)

BASE_PATH = os.path.join(os.path.dirname(__file__), "..", "data")

# ✅ sool 기본 데이터만 넣는 게 안전함 (sense는 별도 load_sense.py에서)
FILES = [
    "sool_basic_region_added.csv",
    # "sense_clean.csv",  # ❌ 여기서 넣지 말자. 구조도 다르고 불필요
]


def clean_abv(value):
    """abv 문자열/숫자 혼합 -> float or None"""
    if value is None or pd.isna(value) or value == "":
        return None

    value = str(value).strip()
    if value.lower() in ("nan", "none", "null"):
        return None

    # "12,5%" 같은 데이터 방어: 콤마/퍼센트 처리
    value = value.replace("%", "").replace(",", ".")
    match = re.findall(r"\d+\.?\d*", value)
    return float(match[0]) if match else None


def clean_str(value, default=None, max_len=None):
    """NaN/빈값 -> None 또는 default로 정리"""
    if value is None or pd.isna(value):
        return default
    s = str(value).strip()
    if s == "" or s.lower() in ("nan", "none", "null"):
        return default
    if max_len:
        s = s[:max_len]
    return s


def import_data():
    db = SessionLocal()
    inserted_total = 0
    skipped_exists = 0
    skipped_no_name = 0
    errors = 0

    for filename in FILES:
        csv_path = os.path.join(BASE_PATH, filename)
        print(f"\n📂 Loading: {csv_path}")

        if not os.path.exists(csv_path):
            print(f"❌ 파일 없음: {filename}")
            continue

        df = pd.read_csv(csv_path)
        # ✅ 핵심: pandas NaN -> None
        df = df.where(pd.notnull(df), None)

        print(f"✅ rows={len(df)} cols={len(df.columns)}")

        file_insert_count = 0

        for idx, row in df.iterrows():
            name = clean_str(row.get("name"))
            if not name:
                skipped_no_name += 1
                continue

            exists = db.query(Sool).filter(Sool.name == name).first()
            if exists:
                skipped_exists += 1
                continue

            # ✅ CSV 헤더에 맞춰 안전하게 매핑
            abv = clean_abv(row.get("abv"))
            region = clean_str(row.get("region"), default="미등록")  # ✅ NaN 방지
            description = clean_str(row.get("description"), default=None, max_len=200)
            producer = clean_str(row.get("producer"), default=None)
            ingredients = clean_str(row.get("ingredients"), default=None)

            # ✅ 한 row 에러가 전체 롤백시키지 않게 SAVEPOINT 사용
            try:
                with db.begin_nested():
                    db.add(
                        Sool(
                            name=name,
                            abv=abv,
                            region=region,
                            description=description,
                            producer=producer,
                            ingredients=ingredients,
                            # category 컬럼이 모델에 필수면 여기서 기본값 넣어야 함
                            # category="미분류",
                        )
                    )
                    db.flush()  # 여기서 실제 INSERT 시도 → 에러 즉시 감지
                inserted_total += 1
                file_insert_count += 1

                if inserted_total % 200 == 0:
                    db.commit()
                    print(f"💾 committed {inserted_total} rows...")

            except SQLAlchemyError as e:
                errors += 1
                print(f"❌ row error at {filename}:{idx} name='{name}' => {e}")

        db.commit()
        print(f"🔥 {filename} → {file_insert_count}개 삽입 완료")

    db.close()
    print("\n==================== 📊 Import Summary ====================")
    print(f"✅ Inserted           : {inserted_total}")
    print(f"↩️  Skipped (exists)   : {skipped_exists}")
    print(f"⚠️  Skipped (no name)  : {skipped_no_name}")
    print(f"❌ Errors             : {errors}")
    print("==========================================================\n")


if __name__ == "__main__":
    import_data()
