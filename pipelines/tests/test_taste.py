import pytest

from sool_pipeline.taste import pairings, taste_profile, taste_scores


def test_positive_mentions():
    s = taste_scores("단맛이 강하고 부드러운 목넘김, 은은한 누룩향이 좋다")
    assert s["sweetness"] == 1 and s["smoothness"] == 1 and s["aroma"] == 1


def test_negation_applies_to_coordinated_axes():
    s = taste_scores("단맛과 신맛이 적어 술이 매우 담백하다")
    assert s["sweetness"] == -1 and s["acidity"] == -1
    assert s["clean"] == 1          # '담백' 은 다른 절


@pytest.mark.parametrize("text", ["산미가 매력적이다", "단맛이 적당하다", "적절한 산미가 음식맛을 살린다"])
def test_false_negations(text):
    s = taste_scores(text)
    assert 1 in (s["sweetness"], s["acidity"])


def test_negation_before_keyword_is_not_applied():
    # '않은' 이 맛 표현보다 앞에 있으면 그 맛을 부정하지 않음
    s = taste_scores("첨가물을 넣지 않은 고유의 부드러운 맛")
    assert s["smoothness"] == 1


def test_weak_expressions():
    s = taste_scores("드라이하고 가벼운 바디")
    assert s["sweetness"] == -1


def test_no_mention_is_none():
    s = taste_scores("한식과 잘 어울린다")
    assert all(v is None for v in s.values())


@pytest.mark.parametrize("text, expected", [
    ("파전, 김치전 등 한식과 두루 잘 어울린다", ["전·부침", "한식 전반"]),
    ("전통 방식으로 빚은 술", []),                       # '전통' 은 전이 아님
    ("생선회, 초밥", ["회·해산물"]),
    ("사회적 기업 대회 수상", []),                       # '사회·대회' 는 회가 아님
    ("족발, 보쌈, 매운 음식과 잘 어울린다", ["육류", "매운·국물"]),
    ("치즈,과일,야채,파스타", ["치즈·양식", "디저트·과일"]),
    ("하이볼 및 칵테일로도 즐길 수 있다", ["칵테일·하이볼"]),
])
def test_pairings(text, expected):
    assert pairings(text) == expected


def test_profile_fills_from_description_only_missing_axes():
    p = taste_profile("단맛이 적고 깔끔하다", "달콤하고 탄산이 있다")
    assert p["taste_sweetness"] == -1          # 특징 우선
    assert p["taste_carbonation"] == 1         # 설명에서 보충
    assert p["taste_axes_mentioned"] == 3
