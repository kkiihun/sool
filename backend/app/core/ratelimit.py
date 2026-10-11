# 공개 API 호출 제한 (IP 당). 브라우저 → frontend(/api/proxy) → backend 구조라서
# 프록시가 붙여 주는 x-sool-client-ip 가 있을 때만 제한한다 (서버 렌더링의 내부 호출은 제외).
# 메모리 기반이라 uvicorn 워커(2개)마다 따로 센다 → 실제 허용량은 최대 2배.
import re
import threading
import time
from collections import deque

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

CLIENT_IP_HEADER = "x-sool-client-ip"

# (이름, 메서드, 경로 정규식, 횟수, 초) — 위에서부터 처음 맞는 규칙 하나 + 전체 규칙을 함께 적용
RULES = [
    ("login", "POST", re.compile(r"^/auth/login/?$"), 10, 60),
    ("signup", "POST", re.compile(r"^/auth/signup/?$"), 5, 3600),
    ("geocode", "GET", re.compile(r"^/explore/restaurant/geocode/?$"), 10, 60),       # 카카오 키 사용량
    ("geocode-day", "GET", re.compile(r"^/explore/restaurant/geocode/?$"), 200, 86400),
    ("restaurant-report", "POST", re.compile(r"^/explore/restaurant/report/?$"), 10, 60),
    ("brewery-report", "GET", re.compile(r"^/explore/breweries/[^/]+/report/?$"), 30, 60),
]
GLOBAL_RULE = ("all", 240, 60)


class SlidingWindow:
    def __init__(self):
        self._hits: dict[tuple, deque] = {}
        self._lock = threading.Lock()
        self._last_sweep = time.monotonic()

    def hit(self, key: tuple, limit: int, window: int, now: float | None = None) -> int:
        """기록 후 초과면 다시 시도까지 남은 초, 아니면 0"""
        now = time.monotonic() if now is None else now
        with self._lock:
            q = self._hits.setdefault(key, deque())
            while q and q[0] <= now - window:
                q.popleft()
            if len(q) >= limit:
                return max(1, int(q[0] + window - now) + 1)
            q.append(now)
            if now - self._last_sweep > 300:
                self._sweep(now)
            return 0

    def _sweep(self, now: float):
        self._last_sweep = now
        longest = max([r[4] for r in RULES] + [GLOBAL_RULE[2]])
        for k in [k for k, q in self._hits.items() if not q or q[-1] <= now - longest]:
            del self._hits[k]


def matching_rules(method: str, path: str) -> list[tuple[str, int, int]]:
    out = [(name, n, sec) for name, m, pat, n, sec in RULES if m == method and pat.match(path)]
    return out + [GLOBAL_RULE]


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, store: SlidingWindow | None = None):
        super().__init__(app)
        self.store = store or SlidingWindow()

    async def dispatch(self, request, call_next):
        ip = request.headers.get(CLIENT_IP_HEADER)
        if ip:
            for name, n, sec in matching_rules(request.method, request.url.path):
                wait = self.store.hit((ip, name), n, sec)
                if wait:
                    return JSONResponse(
                        {"detail": "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요."},
                        status_code=429, headers={"Retry-After": str(wait)},
                    )
        return await call_next(request)
