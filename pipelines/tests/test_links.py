import pytest

from sool_pipeline.links import check, classify, interpret, normalize_url


@pytest.mark.parametrize("raw, expected", [
    ("http://edongricewine.modoo.at/", "http://edongricewine.modoo.at/"),
    ("www.sool.co.kr", "http://www.sool.co.kr"),
    ("  https://a.com  추가설명", "https://a.com"),
    ("-", None), ("", None), (None, None),
])
def test_normalize_url(raw, expected):
    assert normalize_url(raw) == expected


@pytest.mark.parametrize("url, channel, buy", [
    ("https://smartstore.naver.com/somebrewery", "smartstore", True),
    ("https://brand.naver.com/kooksoondang", "smartstore", True),
    ("http://edongricewine.modoo.at/", "modoo", False),
    ("https://www.instagram.com/brewery", "instagram", False),
    ("https://blog.naver.com/brewery", "blog", False),
    ("https://shop.brewery.co.kr", "shop_mall", True),
    ("http://www.brewery.co.kr", "own_site", False),
    (None, "none", False),
])
def test_classify(url, channel, buy):
    assert classify(url) == (channel, buy)


@pytest.mark.parametrize("channel, state, final_url, expected", [
    ("modoo", "alive", "http://a.modoo.at", "ended"),
    ("smartstore", "alive", "https://nid.naver.com/nidlogin.login?url=x", "login"),
    ("smartstore", "blocked", "https://smartstore.naver.com/x", "blocked"),
    ("own_site", None, None, "unchecked"),
])
def test_interpret(channel, state, final_url, expected):
    assert interpret(channel, state, final_url) == expected


def test_check_skips_modoo_without_network():
    assert check("http://edongricewine.modoo.at/")["state"] == "ended"
