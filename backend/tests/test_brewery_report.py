from app.services.brewery_report import build_issues, percentile_rank, summarize


def test_percentile_rank():
    assert percentile_rank(10, [10, 5, 1]) == 33
    assert percentile_rank(1, [10, 5, 1]) == 100
    assert percentile_rank(3, []) is None


def test_issues_order_and_modoo():
    products = [{"card_score": 5, "card_missing": ["taste", "pairing"], "channel": "modoo", "link_state": "ended",
                 "online_buy": False, "blog_count": 0, "on_sale": False}]
    s = summarize(products)
    issues = build_issues(s, {"geo_method": "address"})
    levels = [i["level"] for i in issues]
    assert levels == sorted(levels, key=["high", "mid", "low", "ok"].index)
    assert issues[0]["title"].startswith("홈페이지가 서비스 종료")


def test_fruit_price_swing_issue_only_for_fruits():
    s = summarize([{"card_score": 7, "card_missing": [], "channel": "smartstore", "link_state": "alive",
                    "online_buy": True, "blog_count": 3, "on_sale": True}])
    ings = [{"ingredient": "감귤", "yoy_pct": 46.3, "latest_ym": "202610", "my_products": 2},
            {"ingredient": "쌀", "yoy_pct": -20.0, "latest_ym": "202610", "my_products": 3},     # 곡물은 제외
            {"ingredient": "사과", "yoy_pct": -8.0, "latest_ym": "202610", "my_products": 1}]   # 15% 미만
    titles = [i["title"] for i in build_issues(s, {}, ings)]
    assert titles == ["원료 가격 급등: 감귤 +46.3%"]


def test_own_site_softens_online_issue():
    products = [{"card_score": 7, "card_missing": [], "channel": "own_site", "link_state": "alive",
                 "online_buy": False, "blog_count": 3, "on_sale": True}]
    titles = [i["title"] for i in build_issues(summarize(products), {})]
    assert "온라인 구매 경로 확인 필요" in titles and "온라인 구매 경로 없음" not in titles
