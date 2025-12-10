# backend/app/api/update_log.py
from fastapi import APIRouter
from datetime import datetime
from pathlib import Path

from app.schemas.update_schema import UpdateCreate, UpdateResponse

router = APIRouter(prefix="/updates", tags=["Updates"])

LOG_DIR = Path("logs")
LOG_DIR.mkdir(exist_ok=True)

def _log_file_for_today() -> Path:
    # logs/update-2025-12-10.log
    return LOG_DIR / f"update-{datetime.now().strftime('%Y-%m-%d')}.log"


@router.post("/", response_model=UpdateResponse)
def create_update(update: UpdateCreate):
    """업데이트를 로그파일에 한 줄 추가 + 프론트에 바로 돌려주기"""
    now = datetime.now()
    ts = now.strftime("%Y-%m-%d %H:%M:%S")

    line = f"{ts} | {update.message}\n"
    log_path = _log_file_for_today()
    with log_path.open("a", encoding="utf-8") as f:
        f.write(line)

    return UpdateResponse(message=update.message, timestamp=ts)


@router.get("/", response_model=list[UpdateResponse])
def list_updates():
    """logs 폴더의 모든 update-*.log 를 읽어서 리스트로 반환"""
    updates: list[UpdateResponse] = []

    for path in sorted(LOG_DIR.glob("update-*.log")):
        with path.open(encoding="utf-8") as f:
            for raw in f:
                line = raw.strip()
                if not line:
                    continue
                # "2025-12-10 23:11:22 | 내용" 형식
                if " | " not in line:
                    continue
                ts, msg = line.split(" | ", 1)
                updates.append(UpdateResponse(message=msg, timestamp=ts))

    # 최신 순 정렬
    updates.sort(key=lambda u: u.timestamp, reverse=True)
    return updates
