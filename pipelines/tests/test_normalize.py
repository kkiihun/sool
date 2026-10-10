import pytest

from sool_pipeline.normalize import is_missing, normalize_name, normalize_producer


@pytest.mark.parametrize("raw, expected", [
    ("이동 생 쌀 막걸리", "이동생쌀막걸리"),
    ("이동 생 쌀 막걸리 (750ml)", "이동생쌀막걸리"),
    ("솔직 25도 10년 숙성", "솔직10년숙성"),
    ("진도홍주 아라리35%, 루비콘40%", "진도홍주아라리루비콘"),
    ("ＡＢＣ 막걸리 1.8L", "abc막걸리"),
    (None, ""),
])
def test_normalize_name(raw, expected):
    assert normalize_name(raw) == expected


@pytest.mark.parametrize("raw, expected", [
    ("농업회사법인 (주)온증류소", "온증류소"),
    ("㈜시트러스", "시트러스"),
    ("(주)1932 포천일동막걸리", "1932포천일동막걸리"),
    ("제이앤제이브루어리유한회사", "제이앤제이브루어리"),
    ("농업회사법인 주식회사 주연향", "주연향"),
    ("", ""),
])
def test_normalize_producer(raw, expected):
    assert normalize_producer(raw) == expected


@pytest.mark.parametrize("value, expected", [
    (None, True), ("", True), ("  ", True), ("미등록", True), ("-", True), ("경기", False),
])
def test_is_missing(value, expected):
    assert is_missing(value) is expected
