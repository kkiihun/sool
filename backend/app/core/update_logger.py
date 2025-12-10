from pathlib import Path
from datetime import datetime

# logs 디렉토리 위치: backend/app/ 기준으로 한 단계 위에 logs 폴더 생성
LOG_DIR = Path(__file__).resolve().parents[2] / "logs"
LOG_DIR.mkdir(exist_ok=True)

def write_update_log(message: str) -> None:
    """
    업데이트 텍스트를 일자별 로그파일에 한 줄씩 기록.
    파일 이름: updates-YYYY-MM-DD.log
    """
    now = datetime.now()
    filename = LOG_DIR / f"updates-{now:%Y-%m-%d}.log"

    line = f"[{now:%Y-%m-%d %H:%M:%S}] {message}\n"

    with filename.open("a", encoding="utf-8") as f:
        f.write(line)
