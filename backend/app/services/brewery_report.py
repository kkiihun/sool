# 양조장 진단 리포트 (B1): 파이프라인 결과(술 카드·구매 경로·블로그)를 양조장 단위로 묶어
# "지금 온라인에서 어떻게 보이는지 + 무엇을 고치면 좋은지"를 만든다. DB 접근 없는 순수 함수만.
from collections import Counter

DEAD = {"dead", "error", "ended"}
ITEM_LABEL = {
    "category": "주종", "ingredient": "원료", "taste": "맛 설명", "pairing": "어울리는 음식",
    "description": "제품 소개", "location": "지도 위치", "purchase": "구매 링크",
}


def percentile_rank(value: float, population: list[float]) -> int | None:
    """상위 몇 % 인지 (작을수록 좋음). 1 = 최상위"""
    if not population:
        return None
    better = sum(1 for v in population if v > value)
    return max(1, round(100 * (better + 1) / len(population)))


def summarize(products: list[dict]) -> dict:
    n = len(products) or 1
    missing = Counter(m for p in products for m in (p.get("card_missing") or []))
    return {
        "products": len(products),
        "avg_card_score": round(sum(p.get("card_score") or 0 for p in products) / n, 1),
        "full_cards": sum(1 for p in products if p.get("card_score") == 7),
        "missing": {k: missing.get(k, 0) for k in ITEM_LABEL},
        "dead_links": sum(1 for p in products if p.get("link_state") in DEAD),
        "modoo_ended": sum(1 for p in products if p.get("channel") == "modoo" and p.get("link_state") in DEAD),
        "online_buy": sum(1 for p in products if p.get("online_buy")),
        # 자체 사이트는 쇼핑 기능이 있는지 아직 판별 못 함 → '구매 경로 없음'을 단정하지 않는 근거
        "own_site_alive": sum(1 for p in products if p.get("channel") == "own_site" and p.get("link_state") not in DEAD
                              and p.get("link_state")),
        "with_blogs": sum(1 for p in products if p.get("blog_count")),
        "blog_total": sum(p.get("blog_count") or 0 for p in products),
        "not_on_sale": sum(1 for p in products if p.get("on_sale") is False),
        "no_link": sum(1 for p in products if not p.get("link_state")),
    }


def build_issues(s: dict, place: dict) -> list[dict]:
    """개선할 점: (심각도 high/mid/low, 제목, 설명, 해당 제품 수). 심각도 → 영향 큰 순"""
    out = []

    def add(level, title, detail, count=None):
        out.append({"level": level, "title": title, "detail": detail, "count": count})

    n = s["products"]
    if s["modoo_ended"]:
        add("high", "홈페이지가 서비스 종료됨 (네이버 모두홈페이지)",
            "모두홈페이지는 서비스가 종료되어 링크를 누르면 종료 안내만 나옵니다. 스마트스토어나 새 홈페이지 주소로 바꾸세요.",
            s["modoo_ended"])
    elif s["dead_links"]:
        add("high", "등록된 홈페이지 링크가 열리지 않음",
            "공공 데이터(더술닷컴)에 등록된 주소가 접속되지 않습니다. 소비자·업소가 구매처를 못 찾습니다.", s["dead_links"])
    if s["not_on_sale"]:
        add("high", "더술닷컴(aT)에 '판매 중단'으로 표시된 제품",
            "실제로 판매 중이라면 더술닷컴에 정보 수정을 요청하세요. 판매 중단 제품은 검색 결과 뒤로 밀립니다.", s["not_on_sale"])
    if s["online_buy"] == 0 and s.get("own_site_alive"):
        add("low", "온라인 구매 경로 확인 필요",
            "자체 홈페이지는 열리지만 쇼핑 기능이 있는지는 확인하지 못했습니다. 판매 중이라면 스마트스토어 등 구매 링크를 함께 등록하면 찾기 쉽습니다.")
    elif s["online_buy"] == 0:
        add("mid", "온라인 구매 경로 없음",
            "스마트스토어·판매몰 링크가 있는 제품이 없습니다. 전통주는 온라인 판매가 허용되므로 판로를 넓힐 수 있습니다.")
    if s["missing"]["taste"]:
        add("mid", "맛 설명이 없는 제품",
            "단맛·산미·바디·탄산 같은 표현이 제품 설명에 없으면 업소가 메뉴와 맞춰 보기 어렵습니다.", s["missing"]["taste"])
    if s["missing"]["pairing"]:
        add("mid", "어울리는 음식 정보가 없는 제품",
            "식당 사장님은 메뉴(고기·전·회…)와 어울리는 술을 찾습니다. 제품 특징에 어울리는 음식을 적어 주세요.",
            s["missing"]["pairing"])
    if s["with_blogs"] == 0:
        add("mid", "블로그 후기를 찾지 못함",
            "검색되는 후기가 없습니다. 시음 행사·체험단 등으로 온라인 언급을 늘리면 신뢰도가 올라갑니다.")
    if s["missing"]["description"]:
        add("low", "제품 소개 글이 없는 제품", "한두 문장의 소개(원료·만드는 방식·이야기)를 넣어 주세요.", s["missing"]["description"])
    if s["missing"]["category"]:
        add("low", "주종이 확인되지 않는 제품", "주종(탁주·약주·증류주…)을 정확히 등록해 주세요.", s["missing"]["category"])
    if place.get("geo_method") and place["geo_method"] != "address":
        add("low", "지도 위치가 추정값", "등록 주소로 위치를 찾지 못해 양조장 이름으로 찾은 위치입니다. 주소를 확인해 주세요.")
    if not out and n:
        add("ok", "큰 문제 없음", "기본 정보가 잘 갖춰져 있습니다. 사진·체험 정보를 더하면 좋습니다.")
    order = {"high": 0, "mid": 1, "low": 2, "ok": 3}
    return sorted(out, key=lambda i: order[i["level"]])   # 같은 등급 안에서는 위에 적은 순서 유지


def strengths(s: dict, place: dict, ranks: dict) -> list[str]:
    out = []
    if place.get("visit_brewery"):
        out.append("찾아가는 양조장 지정 — 견학·시음 체험 가능")
    if place.get("food_master") or place.get("intangible_heritage"):
        out.append("식품명인·무형문화재 보유")
    if place.get("awarded_products"):
        out.append(f"수상 제품 {place['awarded_products']}개")
    if s["products"] and s["full_cards"] == s["products"]:
        out.append("모든 제품 정보가 완벽")
    if ranks.get("blog_pct") and ranks["blog_pct"] <= 20:
        out.append(f"블로그 후기 수 지역 상위 {ranks['blog_pct']}%")
    if s["online_buy"]:
        out.append(f"온라인 구매 가능 제품 {s['online_buy']}개")
    return out
