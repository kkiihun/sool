import json

import pandas as pd

from sool_pipeline.market import (
    abv_profile, brewery_structure, build_market, hidden_gems, purchase_access, region_specialization,
)


def make_df():
    rows = []
    i = 0
    # 경기: 탁주 위주 20개, 충북: 과실주 위주 20개, 제주: 5개(작은 지역)
    for sido, mix in [("경기", {"탁주": 16, "과실주": 4}), ("충북", {"탁주": 4, "과실주": 16}), ("제주", {"증류주": 5})]:
        for cat, n in mix.items():
            for _ in range(n):
                i += 1
                rows.append({
                    "sool_id": i, "name": f"술{i}", "producer": f"양조장{i % 7}", "category": cat, "sido": sido,
                    "place_id": f"p{i % 7}", "abv": {"탁주": 6.0, "과실주": 12.0, "증류주": 40.0}[cat],
                    "has_sweetener": cat == "탁주" and i % 2 == 0, "visit_brewery": i % 5 == 0,
                    "food_master": i == 3, "intangible_heritage": False, "award_count": 1 if i in (3, 4) else 0,
                    "special_ingredients": ["포도"] if cat == "과실주" else [], "online_reachable": i % 3 == 0,
                    "link_state": "alive", "taste_sweetness": 1 if cat == "과실주" else None,
                })
    rows.append({**rows[0], "sool_id": 999, "name": "이상한탁주", "abv": 40.0})   # 도수 이상치
    return pd.DataFrame(rows)


def test_region_specialization_lq_and_small_region_excluded():
    r = region_specialization(make_df())
    assert "제주" not in r["regions"]                          # 20개 미만 지역 제외
    cell = next(c for c in r["cells"] if c["sido"] == "충북" and c["category"] == "과실주")
    assert cell["lq"] > 1.5
    assert r["top_specialized"][0]["lq"] >= r["top_specialized"][-1]["lq"]


def test_abv_outlier_detected():
    a = abv_profile(make_df())
    assert any(o["sool_id"] == 999 for o in a["outliers"])


def test_brewery_structure_basic():
    b = brewery_structure(make_df())
    assert b["breweries"] == 7 and b["products"] == 46
    assert 0 <= b["gini"] <= 1 and sum(b["distribution"].values()) == 7


def test_hidden_gems_excludes_online():
    g = hidden_gems(make_df())
    ids = {x["sool_id"] for x in g}
    assert 3 not in ids          # 3 은 온라인 구매 가능(3 % 3 == 0)
    assert 4 in ids


def test_purchase_access_overall():
    p = purchase_access(make_df())
    assert 0 < p["overall"] < 1


def test_build_market_is_json_serializable():
    m = build_market(make_df(), ["sweetness"])
    json.dumps(m, ensure_ascii=False)
