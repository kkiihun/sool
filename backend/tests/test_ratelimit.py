from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.core.ratelimit import CLIENT_IP_HEADER, RateLimitMiddleware, SlidingWindow, matching_rules


def test_sliding_window_blocks_then_recovers():
    w = SlidingWindow()
    assert [w.hit(("ip", "x"), 2, 60, now=t) for t in (0, 1)] == [0, 0]
    assert w.hit(("ip", "x"), 2, 60, now=2) == 59          # 0초 기록이 60초에 빠짐
    assert w.hit(("ip", "x"), 2, 60, now=60.5) == 0
    assert w.hit(("other", "x"), 2, 60, now=2) == 0         # IP 별로 따로


def test_matching_rules():
    names = [r[0] for r in matching_rules("GET", "/explore/restaurant/geocode")]
    assert names == ["geocode", "geocode-day", "all"]
    assert [r[0] for r in matching_rules("POST", "/auth/login")] == ["login", "all"]
    assert [r[0] for r in matching_rules("GET", "/auth/login")] == ["all"]


def _client():
    app = FastAPI()
    app.add_middleware(RateLimitMiddleware, store=SlidingWindow())

    @app.post("/auth/login")
    def login():
        return {"ok": True}

    return TestClient(app)


def test_middleware_limits_only_proxied_requests():
    c = _client()
    h = {CLIENT_IP_HEADER: "1.2.3.4"}
    codes = [c.post("/auth/login", headers=h).status_code for _ in range(11)]
    assert codes[:10] == [200] * 10 and codes[10] == 429
    r = c.post("/auth/login", headers=h)
    assert r.status_code == 429 and int(r.headers["retry-after"]) > 0
    assert c.post("/auth/login", headers={CLIENT_IP_HEADER: "5.6.7.8"}).status_code == 200
    assert c.post("/auth/login").status_code == 200            # 헤더 없음 = 내부 호출
