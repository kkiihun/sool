# 백엔드 순수 함수 테스트 (DB 없음). 실행: 파이프라인 이미지로 — README 참고
from app.services.menu_analysis import classify_dish, parse_menu, pick_lineup, score_drink, store_profile


def test_parse_menu_strips_prices_sizes_and_dedupes():
    text = "삼겹살 (200g) 15,000원\n해물파전 18000\n된장찌개 - 8,000\n삼겹살 15,000\n소 / 중 / 대\n공기밥 1,000"
    assert parse_menu(text) == ["삼겹살", "해물파전", "된장찌개", "공기밥"]
    assert parse_menu("생삼겹살 200g 16,000원\n수육 1kg") == ["생삼겹살", "수육"]


def test_classify_dish_groups_and_traits():
    d = classify_dish("해물파전")
    assert "전·부침" in d["groups"] and "회·해산물" in d["groups"]
    assert "기름진" in d["traits"]
    assert classify_dish("불고기")["traits"] == ["달콤한 양념"]       # '불' 만으로 매운 음식이 되지 않음
    assert "매운·국물" in classify_dish("김치찌개")["groups"] and "매운" in classify_dish("김치찌개")["traits"]
    assert classify_dish("공기밥") == {"name": "공기밥", "groups": [], "traits": []}


def test_score_drink_pairing_and_traits():
    dish = classify_dish("삼겹살")
    fizzy = {"pairings": ["육류"], "taste": {"carbonation": 1, "acidity": 1}, "abv": 6}
    plain = {"pairings": [], "taste": {}, "abv": 6}
    s1, why = score_drink(dish, fizzy)
    assert s1 > score_drink(dish, plain)[0] and any("기름" in w for w in why)


def test_spicy_food_penalizes_strong_spirits():
    dish = classify_dish("매운 닭발")
    soft = {"pairings": [], "taste": {"sweetness": 1}, "abv": 7}
    strong = {"pairings": [], "taste": {"sweetness": 1}, "abv": 40}
    assert score_drink(dish, soft)[0] > score_drink(dish, strong)[0]


def test_store_profile_pct():
    p = store_profile([classify_dish("삼겹살"), classify_dish("항정살"), classify_dish("물회")])
    assert p["groups"][0] == {"name": "육류", "count": 2, "pct": 67}


def test_pick_lineup_covers_and_diversifies():
    drinks = {1: {"category": "탁주", "abv": 6, "quality": 5}, 2: {"category": "탁주", "abv": 6, "quality": 5},
              3: {"category": "약주", "abv": 13, "quality": 5}}
    scores = {"삼겹살": {1: 5, 2: 4.9}, "물회": {3: 4}}
    picked = pick_lineup(scores, drinks, size=2)
    assert picked == [1, 3]          # 같은 탁주 두 병보다 물회를 덮는 약주
