"""실제 DB 제품으로 만든 규칙 회귀 테스트. (이름, 원료, 도수) → 기대 카테고리"""
import pytest

from sool_pipeline.categorize import CATEGORIES, first_ingredient, standardize, suggest

CASES = [
    # 이름에 주종
    ("생딸기 막걸리", "햅쌀(국내산 신동진품종),쌀,국내산 딸기,효모", 6, "탁주", "name_takju"),
    ("지란지교 무화과 탁주", "찹쌀, 멥쌀(국내산), 전통누룩, 무화과청", 12, "탁주", "name_takju"),
    ("세종대왕어주 약주", "쌀, 누룩 정제수", 15, "약주", "name_yakju"),
    ("코이버펑크, 카베르네 소비뇽 2019", "카베르네 소비뇽 포도품종 100%", 12.5, "과실주", "fruit_first"),
    ("산머루와인 깊은맛 드라이", "산머루", 12, "과실주", "name_wine"),
    ("로제사이더 오미한잔", "사과즙(국내산),건조오미자(국내산), 이산화탄소, 효모", 4.5, "과실주", "name_wine"),
    # 고도수
    ("남한산성소주", "쌀, 엿, 누룩", 40, "증류주", "abv_high"),
    ("야수 S 53", "고구마 증류주원액(강화섬쌀, 강화 고구마 100%)", 53, "증류주", "abv_high"),
    ("솔직 25도 10년 숙성", "증류 원액, 쌀(국산), 송순, 정제수, 설탕, 정제소금", 25, "증류주", "abv_high"),
    # 증류원액 + 향미 / 주정
    ("술숲", "정제수, 감귤(제주산)증류원액, 알로에(제주산)농축액, 곡물주정", 19, "리큐르", "distilled_flavored"),
    ("홍시", "정제수,감[홍시]30.8%(국내산),액상과당,주정,설탕,DL-사과산,효모", 12, "리큐르", "spirit_added"),
    # 주원료 과실
    ("혼디주", "제주산감귤, 백설탕, 구연산, 무수아황산", 12, "과실주", "fruit_first"),
    ("복분자음", "복분자(국내산), 정제수", 12, "과실주", "fruit_first"),
    # 곡물 발효주
    ("매실탁테일", "국내산 백미, 매실천연과즙", 7, "탁주", "grain_low_abv"),
    ("인천 소성주 플러스", "정제수, 쌀(국내산), 국(밀함유), 팽화미(국내산), 올리고당, 효모", 6, "탁주", "grain_low_abv"),
    ("별바랑", "국내산 찹쌀, 국내산 멥쌀, 누룩, 정제수", 17.5, "약주", "grain_mid_abv"),
    ("천안연미주", "국내산 쌀", 13, "약주", "grain_mid_abv"),
]


@pytest.mark.parametrize("name, ing, abv, expected, rule", CASES)
def test_suggest(name, ing, abv, expected, rule):
    s = suggest(name, ing, abv)
    assert (s.category, s.rule) == (expected, rule), s.reason
    assert s.category in CATEGORIES
    assert 0 < s.confidence <= 1


def test_unresolved_returns_none():
    s = suggest("미르아토 샤인머스켓 화이트 스파클링", None, 5)
    assert s.category is None and s.confidence == 0


def test_first_ingredient_skips_water():
    assert first_ingredient("정제수, 찹쌀(국내산), 누룩") == "찹쌀(국내산)"
    assert first_ingredient("지하정제수, 9분도쌀") == "9분도쌀"
    assert first_ingredient(None) == ""


def test_standardize_aliases():
    assert standardize("막걸리") == "탁주"
    assert standardize(" 탁주 ") == "탁주"
    assert standardize(None) is None
