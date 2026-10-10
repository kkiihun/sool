# 주소 → 좌표 (카카오 로컬). 식당 사장님이 입력한 가게 주소용. 결과는 프로세스 메모리에 캐시.
import json
import math
import os
import urllib.parse
import urllib.request
from functools import lru_cache

API = "https://dapi.kakao.com/v2/local/search"


def _kakao(endpoint: str, query: str) -> list[dict]:
    key = os.environ.get("KAKAO_REST_API_KEY")
    if not key:
        raise RuntimeError("KAKAO_REST_API_KEY 없음")
    url = f"{API}/{endpoint}.json?" + urllib.parse.urlencode({"query": query, "size": 1})
    req = urllib.request.Request(url, headers={"Authorization": f"KakaoAK {key}"})
    with urllib.request.urlopen(req, timeout=5) as res:
        return json.loads(res.read().decode("utf-8")).get("documents", [])


@lru_cache(maxsize=2000)
def geocode(query: str) -> dict | None:
    """주소 검색 → 없으면 키워드(가게 이름·역 이름 등) 검색. 반환 {lat, lng, label} 또는 None"""
    q = query.strip()
    if not q:
        return None
    for endpoint in ("address", "keyword"):
        docs = _kakao(endpoint, q)
        if docs:
            d = docs[0]
            label = d.get("road_address_name") or d.get("address_name") or d.get("place_name") or q
            if endpoint == "keyword" and d.get("place_name"):
                label = f"{d['place_name']} ({d.get('road_address_name') or d.get('address_name')})"
            return {"lat": float(d["y"]), "lng": float(d["x"]), "label": label}
    return None


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp, dl = p2 - p1, math.radians(lng2 - lng1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))
