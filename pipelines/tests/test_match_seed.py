import pandas as pd

from sool_pipeline.steps import match_seed


def test_match_seed_strict_then_loose_and_skips_ambiguous():
    sool = pd.DataFrame([
        {"id": 1, "name_norm": "a", "producer_norm": "p", "abv": 6.0},    # 엄격 키
        {"id": 2, "name_norm": "b", "producer_norm": "", "abv": 12.0},    # 양조장 없음 → name+abv
        {"id": 3, "name_norm": "c", "producer_norm": "q", "abv": 40.0},   # 시드에 c 가 2개(도수 다름) → name 모호
        {"id": 4, "name_norm": "z", "producer_norm": "q", "abv": 5.0},    # 시드에 없음
    ])
    seed = pd.DataFrame([
        {"name_norm": "a", "producer_norm": "p", "abv": 6.0},
        {"name_norm": "b", "producer_norm": "r", "abv": 12.0},
        {"name_norm": "c", "producer_norm": "x", "abv": 22.0},
        {"name_norm": "c", "producer_norm": "y", "abv": 45.0},
    ])
    m = match_seed(sool, seed).set_index("sool_id")
    assert m.loc[1, "match_key"] == "name+producer+abv" and m.loc[1, "seed_idx"] == 0
    assert m.loc[2, "match_key"] == "name+abv" and m.loc[2, "seed_idx"] == 1
    assert 3 not in m.index and 4 not in m.index
