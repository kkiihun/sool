# 블로그 후기: 카카오(다음) 블로그 검색 → 술 이름이 실제로 나오는 글만 골라 제품당 최대 5개.
# 본문은 저장·표시하지 않고 제목·블로그 이름·날짜·링크만 쓴다.
from __future__ import annotations

import html
import json
import re
import time
import urllib.parse
import urllib.request
from typing import Callable

from .normalize import normalize_producer

API = "https://dapi.kakao.com/v2/search/blog"
BlogFetcher = Callable[[str], list[dict]]   # query → documents

_TAG_RE = re.compile(r"<[^>]+>")
_SPACE_RE = re.compile(r"\s+")
_NON_WORD_RE = re.compile(r"[^0-9a-z가-힣]")
_CORP_RE = re.compile(r"농업회사법인|영농조합법인|주식회사|유한회사|\(주\)|㈜|\(유\)|\(농\)|\(영\)|\(합\)")
# 후기가 아닌 글(채용·주식 등)은 제목으로 거름
_NOISE_RE = re.compile(r"채용|연봉|면접|자소서|주가|주식|공시|입찰|구인")
# 이름이 짧거나 흔한 낱말이면 양조장 이름까지 같이 나와야 인정
MIN_NAME_ALONE = 4


def clean_text(s: str | None) -> str:
    """검색 결과의 <b> 태그·HTML 엔티티 제거"""
    return _SPACE_RE.sub(" ", html.unescape(_TAG_RE.sub("", s or ""))).strip()


def _norm(s: str | None) -> str:
    return _NON_WORD_RE.sub("", clean_text(s).lower())


def producer_label(producer: str | None) -> str:
    """검색어용 양조장 이름: '농업회사법인 (주)배혜정도가' → '배혜정도가'"""
    return _SPACE_RE.sub(" ", _CORP_RE.sub(" ", producer or "")).strip()


def build_query(name: str, producer: str | None) -> str:
    p = producer_label(producer)
    return f"{name} {p}".strip() if p and p not in name else name.strip()


def match_level(doc: dict, name: str, producer: str | None) -> int:
    """2: 술 이름 + 양조장 / 1: 술 이름만(이름이 충분히 길 때) / 0: 관련 없음"""
    if _NOISE_RE.search(clean_text(doc.get("title"))):
        return 0
    text = _norm(doc.get("title")) + _norm(doc.get("contents"))
    n = _norm(name)
    if not n or n not in text:
        return 0
    p = normalize_producer(producer)
    if p and p in text:
        return 2
    return 1 if len(n) >= MIN_NAME_ALONE else 0


def pick(docs: list[dict], name: str, producer: str | None, limit: int = 5) -> list[dict]:
    """관련 있는 글만. 술 이름이 제목에 있는 글 → 양조장까지 맞는 글 → 검색 순서. 같은 링크는 한 번"""
    scored, seen = [], set()
    n = _norm(name)
    for i, d in enumerate(docs):
        url = d.get("url")
        level = match_level(d, name, producer)
        if not url or url in seen or level == 0:
            continue
        seen.add(url)
        in_title = n in _norm(d.get("title"))
        scored.append((not in_title, -level, i, d, level))
    scored.sort(key=lambda x: x[:3])
    return [{
        "title": clean_text(d.get("title")),
        "url": d.get("url"),
        "blogname": clean_text(d.get("blogname")),
        "posted_at": (d.get("datetime") or "")[:10] or None,
        "match": "name+producer" if level == 2 else "name",
    } for _, _, _, d, level in scored[:limit]]


def kakao_blog_fetcher(api_key: str, size: int = 15, min_interval: float = 0.05) -> BlogFetcher:
    last = [0.0]

    def fetch(query: str) -> list[dict]:
        wait = min_interval - (time.monotonic() - last[0])
        if wait > 0:
            time.sleep(wait)
        url = f"{API}?" + urllib.parse.urlencode({"query": query, "size": size, "sort": "accuracy"})
        req = urllib.request.Request(url, headers={"Authorization": f"KakaoAK {api_key}"})
        try:
            with urllib.request.urlopen(req, timeout=10) as res:
                return json.loads(res.read().decode("utf-8")).get("documents", [])
        finally:
            last[0] = time.monotonic()
    return fetch
