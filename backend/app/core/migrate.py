# create_all 은 이미 있는 테이블에 컬럼을 추가하지 않는다.
# 나중에 모델에 추가한 컬럼만 여기 적어 두면 백엔드 시작 때 없는 것만 ALTER 로 보강한다 (여러 번 실행해도 안전).
from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine

ADDED_COLUMNS: dict[str, dict[str, str]] = {
    # U1 술 카드 충실도 (2026-10-10)
    "analytics_sool_profile": {"card_score": "INT NULL", "card_missing": "JSON NULL"},
}


def add_missing_columns(engine: Engine) -> list[str]:
    insp = inspect(engine)
    added = []
    with engine.begin() as conn:
        for table, cols in ADDED_COLUMNS.items():
            if not insp.has_table(table):
                continue
            have = {c["name"] for c in insp.get_columns(table)}
            for name, ddl in cols.items():
                if name not in have:
                    conn.execute(text(f"ALTER TABLE `{table}` ADD COLUMN `{name}` {ddl}"))
                    added.append(f"{table}.{name}")
    return added
