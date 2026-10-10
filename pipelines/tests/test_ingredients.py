import pandas as pd

from sool_pipeline.ingredients import match_ingredients, monthly_series, summarize


def test_match_ingredients_avoids_false_friends():
    assert match_ingredients("정제수, 쌀(국내산), 입국, 효모") == ["쌀"]
    assert match_ingredients("찹쌀, 누룩") == ["찹쌀"]                    # 찹쌀은 쌀로 세지 않음
    assert match_ingredients("정제수, 백미, 포도당, 아스파탐") == ["쌀"]    # 포도당 ≠ 포도
    assert match_ingredients("배합주정, 정제수") == []                    # 배합 ≠ 배
    assert set(match_ingredients("배(국산), 사과농축액, 땅콩")) == {"배", "사과", "땅콩"}
    assert match_ingredients("복분자, 오미자") == []                      # 시세 API 에 없는 원료


def raw(rows):
    return pd.DataFrame([r + ("품종",) if len(r) == 3 else r for r in rows], columns=["exmn_ymd", "grd_cd", "kg_prc", "vrty_nm"])


def test_monthly_series_uses_top_grade_and_daily_median():
    df = raw([("20260901", "04", 3000), ("20260901", "04", 3200), ("20260901", "05", 1000),
              ("20260902", "04", 3400), ("20261001", "04", 3500)])
    s = monthly_series(df)
    assert s.to_dict("records") == [{"ym": "202609", "kg": 3250.0}, {"ym": "202610", "kg": 3500.0}]


def test_monthly_series_size_grade_and_variety():
    df = raw([("20260901", "24", 9000, "거봉"), ("20260901", "24", 6000, "캠벨얼리"), ("20260901", "25", 5000, "캠벨얼리")])
    assert monthly_series(df, "캠벨얼리").to_dict("records") == [{"ym": "202609", "kg": 6000.0}]   # L과(24)=최상위, 대표 품종
    assert monthly_series(df).to_dict("records") == [{"ym": "202609", "kg": 7500.0}]


def test_summarize_yoy_trend_and_cheapest_months():
    rows = []
    for y in (2024, 2025):
        for m in range(1, 13):
            price = 3000 + (500 if m in (6, 7, 8) else 0) - (400 if m in (10, 11) else 0) + (y - 2024) * 300
            rows.append({"ym": f"{y}{m:02d}", "kg": float(price)})
    rows.append({"ym": "202601", "kg": 3600.0})
    s = summarize(pd.DataFrame(rows), "202601")
    assert s["latest_ym"] == "202601" and s["latest_kg"] == 3600.0
    assert s["yoy_pct"] == round(100 * (3600 / 3300 - 1), 1)
    assert set(s["cheapest_months"][:2]) == {10, 11}
    assert len(s["monthly"]) == 25 if len(rows) < 36 else 36
