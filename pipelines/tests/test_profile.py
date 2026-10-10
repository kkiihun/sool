import pytest

from sool_pipeline.profile import (
    build_profile, certifications, ingredient_profile, parse_awards, parse_volumes, production_profile,
)


@pytest.mark.parametrize("raw, expected", [
    ("750ml", [750]),
    ("375ml, 750ml", [375, 750]),
    ("750ml, 1,500ml", [750, 1500]),     # 천 단위 콤마
    ("19-375ml, 38-750ml", [375, 750]),  # '도수-용량' 표기: 앞 숫자(100 미만)는 버림
    ("340nl", [340]),                     # 오타 nl
    ("1.8L", [1800]),
    ("750", [750]),
    ("750mL", [750]),
    ("", []),
    (None, []),
])
def test_parse_volumes(raw, expected):
    assert parse_volumes(raw) == expected


def test_parse_awards_best_level_and_years():
    a = parse_awards("2016 대한민국 우리술품평회 살균막걸리 우수상, 2018 대한민국 우리술품평회 탁주부문 대상")
    assert a == {"award_count": 2, "best_award": "대상", "award_years": [2016, 2018]}


def test_parse_awards_competition_name_contains_daesang():
    # 대회 이름 '주류대상' 에 '대상' 이 들어 있어도 실제 등급(은상)을 잡아야 함
    assert parse_awards("2021 대한민국주류대상 은상")["best_award"] == "은상"


def test_parse_awards_empty():
    assert parse_awards("") == {"award_count": 0, "best_award": None, "award_years": []}


def test_certifications():
    c = certifications("대한민국 식품명인 제6호 박재서찾아가는 양조장")
    assert c == {"visit_brewery": True, "food_master": True, "intangible_heritage": False}


def test_ingredient_profile():
    p = ingredient_profile("정제수, 쌀(국내산), 국(밀함유), 아스파탐(감미료), 구연산")
    assert p["main_ingredient"] == "쌀(국내산)"
    assert p["has_sweetener"] and not p["has_spirit_added"] and not p["has_fruit"]
    p = ingredient_profile("제주산감귤, 백설탕, 구연산, 무수아황산")
    assert p["special_ingredients"] == ["감귤"] and p["has_preservative"]


@pytest.mark.parametrize("name, desc, raw, pasteurized", [
    ("이동 생 쌀 막걸리", "", True, False),
    ("우곡생주", "", True, False),
    ("생딸기 막걸리", "", False, False),           # '생딸기' 는 생막걸리가 아님
    ("국순당 막걸리", "살균 처리하여 유통기한이 길다", False, True),
    ("어떤 술", "살균하지 않아 효모가 살아있다", True, False),
])
def test_production_raw_vs_pasteurized(name, desc, raw, pasteurized):
    p = production_profile(name, "", desc)
    assert (p["is_raw"], p["is_pasteurized"]) == (raw, pasteurized)


def test_production_sparkling_and_aged():
    assert production_profile("미르아토 스파클링", "", "")["is_sparkling"]
    assert production_profile("오늘", "정제수, 이산화탄소", "")["is_sparkling"]
    assert production_profile("솔직 25도 10년 숙성", "", "")["aged_years"] == 10


def test_build_profile_single_vs_multi_volume():
    assert build_profile({"volume": "750ml"})["volume_ml"] == 750
    assert build_profile({"volume": "375ml, 750ml"})["volume_ml"] is None
