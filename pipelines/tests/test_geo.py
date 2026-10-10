import pytest

from sool_pipeline.geo import clean_address, geocode, short_sido


@pytest.mark.parametrize("raw, expected", [
    ("경기도 포천시 이동면 화동로 2466", "경기도 포천시 이동면 화동로 2466"),
    ("경기도 포천시 이동면 화동로 2466 (도평리)", "경기도 포천시 이동면 화동로 2466"),
    ("서울특별시 마포구 양화로 45, 2층", "서울특별시 마포구 양화로 45"),
    ("부산 해운대구 센텀로 10 3층 301호", "부산 해운대구 센텀로 10"),
    (None, ""),
])
def test_clean_address(raw, expected):
    assert clean_address(raw) == expected


def fake_fetch(responses):
    calls = []

    def fetch(endpoint, query):
        calls.append((endpoint, query))
        return responses.get(endpoint, {"documents": []})
    return fetch, calls


ADDRESS_DOC = {"documents": [{
    "x": "127.3", "y": "38.0", "address_name": "경기 포천시 이동면 화동로 2466",
    "road_address": {"region_1depth_name": "경기", "region_2depth_name": "포천시"},
}]}
KEYWORD_DOC = {"documents": [{
    "x": "126.9", "y": "37.5", "place_name": "어떤양조장",
    "address_name": "서울 마포구 합정동 1", "road_address_name": "서울 마포구 양화로 45",
}]}


def test_geocode_by_address():
    fetch, calls = fake_fetch({"address": ADDRESS_DOC})
    g = geocode("경기도 포천시 이동면 화동로 2466 (도평리)", "이동주조", fetch)
    assert g["method"] == "address" and g["sido"] == "경기" and g["sigungu"] == "포천시"
    assert (g["lat"], g["lng"]) == (38.0, 127.3)
    assert calls == [("address", "경기도 포천시 이동면 화동로 2466")]


def test_geocode_falls_back_to_keyword_with_area():
    fetch, calls = fake_fetch({"keyword": KEYWORD_DOC})
    g = geocode("서울특별시 마포구 없는길 99", "어떤양조장", fetch)
    assert g["method"] == "keyword" and g["sido"] == "서울" and g["sigungu"] == "마포구"
    assert calls[-1] == ("keyword", "서울특별시 마포구 어떤양조장")


def test_geocode_none():
    fetch, _ = fake_fetch({})
    assert geocode("", None, fetch)["method"] == "none"


@pytest.mark.parametrize("raw, expected", [
    ("강원특별자치도", "강원"), ("경기", "경기"), ("전라남도", "전남"), ("전남광주통합특별시", "전남·광주"), (None, None),
])
def test_short_sido(raw, expected):
    assert short_sido(raw) == expected
