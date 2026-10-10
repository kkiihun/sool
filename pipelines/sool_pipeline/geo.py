"""양조장 주소 → 좌표 (카카오 로컬 API). 결과는 warehouse 의 geo_cache 에 저장해 한 번만 호출한다.

https://developers.kakao.com/docs/latest/ko/local/dev-guide
  주소 검색:   GET /v2/local/search/address.json?query=
  키워드 검색: GET /v2/local/search/keyword.json?query=   (주소로 못 찾을 때 양조장 이름으로)
"""
from __future__ import annotations

import json
import re
import time
import unicodedata
import urllib.parse
import urllib.request
from typing import Callable

API = "https://dapi.kakao.com/v2/local/search"

Fetcher = Callable[[str, str], dict]   # (endpoint, query) → 응답 JSON

# 카카오 응답의 시도 표기가 섞여 있어(경기 / 강원특별자치도 / 전남광주통합특별시) 짧은 표기로 통일
_SIDO_SHORT = {
    "서울특별시": "서울", "부산광역시": "부산", "대구광역시": "대구", "인천광역시": "인천", "광주광역시": "광주",
    "대전광역시": "대전", "울산광역시": "울산", "세종특별자치시": "세종", "경기도": "경기",
    "강원도": "강원", "강원특별자치도": "강원", "충청북도": "충북", "충청남도": "충남",
    "전라북도": "전북", "전북특별자치도": "전북", "전라남도": "전남", "경상북도": "경북", "경상남도": "경남",
    "제주특별자치도": "제주", "제주도": "제주", "전남광주통합특별시": "전남·광주",
}


def short_sido(name: str | None) -> str | None:
    if not name:
        return None
    return _SIDO_SHORT.get(name, name)


def clean_address(address: str | None) -> str:
    """'경기도 포천시 이동면 화동로 2466 (도평리)' → 괄호·층·호 제거. 비어 있으면 ''"""
    s = unicodedata.normalize("NFKC", address or "").strip()
    s = re.sub(r"\(.*?\)", " ", s)
    s = re.sub(r"\s\d+\s*층.*$|\s\d+\s*호.*$", " ", s)
    s = re.sub(r"[,，].*$", "", s)                 # 콤마 뒤 상세주소
    return re.sub(r"\s+", " ", s).strip()


def kakao_fetcher(api_key: str, min_interval: float = 0.05) -> Fetcher:
    last = [0.0]

    def fetch(endpoint: str, query: str) -> dict:
        wait = min_interval - (time.monotonic() - last[0])
        if wait > 0:
            time.sleep(wait)
        url = f"{API}/{endpoint}.json?" + urllib.parse.urlencode({"query": query, "size": 3})
        req = urllib.request.Request(url, headers={"Authorization": f"KakaoAK {api_key}"})
        try:
            with urllib.request.urlopen(req, timeout=10) as res:
                return json.loads(res.read().decode("utf-8"))
        finally:
            last[0] = time.monotonic()
    return fetch


def geocode(address: str, producer: str | None, fetch: Fetcher) -> dict:
    """주소 검색 → 실패하면 '양조장 이름 + 시군구' 키워드 검색.
    반환: lat, lng, sido, sigungu, matched, method(address/keyword/none)"""
    addr = clean_address(address)
    if addr:
        docs = fetch("address", addr).get("documents", [])
        if docs:
            d = docs[0]
            a = d.get("road_address") or d.get("address") or {}
            return {"lat": float(d["y"]), "lng": float(d["x"]), "sido": short_sido(a.get("region_1depth_name")),
                    "sigungu": a.get("region_2depth_name"), "matched": d.get("address_name"), "method": "address"}

    if producer:
        area = " ".join(addr.split()[:2]) if addr else ""
        docs = fetch("keyword", f"{area} {producer}".strip()).get("documents", [])
        if docs:
            d = docs[0]
            parts = (d.get("road_address_name") or d.get("address_name") or "").split()
            return {"lat": float(d["y"]), "lng": float(d["x"]), "sido": short_sido(parts[0]) if parts else None,
                    "sigungu": parts[1] if len(parts) > 1 else None,
                    "matched": f'{d.get("place_name")} · {d.get("address_name")}', "method": "keyword"}

    return {"lat": None, "lng": None, "sido": None, "sigungu": None, "matched": None, "method": "none"}
