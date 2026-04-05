# backend/scripts/migrate_updates_from_logs.py
import os
import re
from datetime import datetime
from pathlib import Path

from sqlalchemy import create_engine, text

# 환경변수 기반(백엔드와 동일하게)
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_USER = os.getenv("DB_USER", "sool")
DB_PASSWORD = os.getenv("DB_PASSWORD", "soolpass")
DB_NAME = os.getenv("DB_NAME", "sool")

DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}?charset=utf8mb4"

LOG_DIR = Path("/app/logs")  # 컨테이너 기준

# 포맷1: "2026-01-15 05:45:51 | message"
re_pipe = re.compile(r"^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}) \| (.+)$")

# 포맷2: "[2026-01-15 05:45:51] message"
re_bracket = re.compile(r"^\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\] (.+)$")

def parse_line(line: str):
    line = line.strip()
    if not line:
        return None
    m = re_pipe.match(line)
    if m:
        ts, msg = m.group(1), m.group(2).strip()
        dt = datetime.strptime(ts, "%Y-%m-%d %H:%M:%S")
        return dt, msg

    m = re_bracket.match(line)
    if m:
        ts, msg = m.group(1), m.group(2).strip()
        dt = datetime.strptime(ts, "%Y-%m-%d %H:%M:%S")
        return dt, msg

    return None

def main():
    engine = create_engine(DATABASE_URL, pool_pre_ping=True, future=True)

    # 테이블 없으면 종료
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
        conn.commit()

    files = sorted(LOG_DIR.glob("*.log"))
    if not files:
        print("No log files found:", LOG_DIR)
        return

    inserted = 0
    skipped = 0

    with engine.begin() as conn:
        for fp in files:
            for raw in fp.read_text(encoding="utf-8", errors="ignore").splitlines():
                parsed = parse_line(raw)
                if not parsed:
                    continue
                dt, msg = parsed

                # 중복 방지(간단 버전): 같은 created_at + message 있으면 skip
                exists = conn.execute(
                    text("SELECT id FROM updates WHERE created_at=:dt AND message=:msg LIMIT 1"),
                    {"dt": dt, "msg": msg},
                ).fetchone()

                if exists:
                    skipped += 1
                    continue

                conn.execute(
                    text("INSERT INTO updates (message, created_at, source) VALUES (:msg, :dt, :src)"),
                    {"msg": msg, "dt": dt, "src": "file-migrated"},
                )
                inserted += 1

    print(f"Done. inserted={inserted}, skipped={skipped}, files={len(files)}")

if __name__ == "__main__":
    main()
