from sool_pipeline.completeness import CARD_MAX, card_completeness, summarize

FULL = dict(category="탁주", main_ingredient="쌀", taste_axes_mentioned=2, pairings=["육류"],
            description="부드러운 막걸리", located=True, link_state="alive")


def test_full_card():
    assert card_completeness(**FULL) == (CARD_MAX, [])


def test_missing_items_are_named_in_order():
    score, missing = card_completeness(**{**FULL, "pairings": [], "description": "  ", "link_state": None})
    assert score == CARD_MAX - 3
    assert missing == ["pairing", "description", "purchase"]


def test_dead_link_counts_as_missing_but_unchecked_or_login_does_not():
    assert "purchase" in card_completeness(**{**FULL, "link_state": "ended"})[1]
    assert card_completeness(**{**FULL, "link_state": "unchecked"})[0] == CARD_MAX
    assert card_completeness(**{**FULL, "link_state": "login"})[0] == CARD_MAX


def test_nan_and_zero_taste_are_missing():
    assert "taste" in card_completeness(**{**FULL, "taste_axes_mentioned": 0})[1]
    assert "ingredient" in card_completeness(**{**FULL, "main_ingredient": float("nan")})[1]


def test_summarize():
    s = summarize([7, 7, 6, 3], [[], [], ["taste"], ["taste", "pairing", "purchase", "location"]])
    assert s["full"] == 2 and s["full_pct"] == 50.0 and s["ge6_pct"] == 75.0
    assert s["missing"]["taste"] == 2 and s["missing"]["category"] == 0
    assert s["distribution"]["7"] == 2 and s["distribution"]["0"] == 0
