"""구매 경로: 홈페이지 링크 유형 분류 + 생존 검사.

가격은 수집하지 않는다 (네이버 쇼핑 검색 API 2026-07-31 종료, 쇼핑몰 페이지 수집은 약관 위반 소지).
"""
from __future__ import annotations

import re
import unicodedata
import urllib.error
import urllib.request

# (채널, 온라인 구매 가능 여부, 패턴) — 위에서부터 먼저 맞는 것
CHANNELS: list[tuple[str, bool, re.Pattern[str]]] = [
    (name, buy, re.compile(pat, re.I)) for name, buy, pat in [
        ("smartstore", True, r"smartstore\.naver\.com|brand\.naver\.com|shopping\.naver\.com"),
        ("shop_mall", True, r"sooldamhwa|woorisool|sulmarket|thesool|coupang|11st|gmarket|auction|kakao.*gift|/shop|/mall|shop\.|mall\.|store\."),
        ("modoo", False, r"modoo\.at"),                      # 네이버 모두 홈페이지 (서비스 종료)
        ("instagram", False, r"instagram\.com"),
        ("facebook", False, r"facebook\.com|fb\.com"),
        ("blog", False, r"blog\.naver\.com|tistory\.com|blogspot|brunch\.co\.kr|blog\."),
        ("kakao", False, r"kakao|pf\.kakao"),
    ]
]
CHANNEL_LABEL = {
    "smartstore": "스마트스토어", "shop_mall": "판매몰", "own_site": "자체 사이트", "modoo": "모두홈페이지",
    "instagram": "인스타그램", "facebook": "페이스북", "blog": "블로그", "kakao": "카카오", "none": "링크 없음",
}


def normalize_url(url: str | None) -> str | None:
    s = unicodedata.normalize("NFKC", url or "").strip().split()[0] if (url or "").strip() else ""
    if not s or s in {"-", "없음"}:
        return None
    if not re.match(r"^https?://", s, re.I):
        s = "http://" + s
    return s


def classify(url: str | None) -> tuple[str, bool]:
    """→ (채널, 온라인 구매 경로인가)"""
    u = normalize_url(url)
    if not u:
        return "none", False
    for name, buy, pat in CHANNELS:
        if pat.search(u):
            return name, buy
    return "own_site", False


def interpret(channel: str, state: str | None, final_url: str | None) -> str:
    """검사 결과를 채널 특성에 맞게 해석
    - 모두홈페이지: 200 이어도 '서비스 종료' 안내 페이지 → ended
    - 스마트스토어: 주류 스토어는 네이버 로그인(성인 인증)으로 넘어감 → login (스토어는 존재)"""
    if channel == "modoo":
        return "ended"
    if final_url and "nid.naver.com/nidlogin" in final_url:
        return "login"
    return state or "unchecked"


def check(url: str, timeout: float = 8.0) -> dict:
    """HEAD → (거부하면) GET. 반환: state(alive/dead/blocked/error), http_code, final_url
    403·429 는 봇 차단일 수 있어 dead 가 아니라 blocked 로 둔다."""
    if "modoo.at" in url:          # 서비스 종료 — 요청하지 않음
        return {"state": "ended", "http_code": None, "final_url": url}
    headers = {"User-Agent": "Mozilla/5.0 (sool-pipeline link check; +http://100.125.79.96:3300)"}
    last_err = None
    for method in ("HEAD", "GET"):
        req = urllib.request.Request(url, method=method, headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=timeout) as res:
                return {"state": "alive", "http_code": res.status, "final_url": res.geturl()}
        except urllib.error.HTTPError as e:
            if e.code in (405, 501) and method == "HEAD":      # HEAD 미지원 → GET 재시도
                continue
            state = "blocked" if e.code in (401, 403, 429) else "dead"
            return {"state": state, "http_code": e.code, "final_url": url}
        except Exception as e:                                # DNS 실패·타임아웃·SSL 등
            last_err = e
            if method == "HEAD":
                continue
    return {"state": "error", "http_code": None, "final_url": url, "error": type(last_err).__name__ if last_err else None}
