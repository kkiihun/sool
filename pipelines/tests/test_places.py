from sool_pipeline.steps import cluster_places


def r(name, lat, lng):
    return {"producer_norm": name, "lat": lat, "lng": lng}


def test_same_coordinates_merge_even_with_different_names():
    rows = [r("두루", 37.81401, 128.05861), r("두루양조", 37.81402, 128.05859), r("다른곳", 35.0, 127.0)]
    c = cluster_places(rows)
    assert c[0] == c[1] != c[2]


def test_same_name_within_1km_merge_but_far_apart_do_not():
    rows = [r("백운주가", 35.0000, 127.0000), r("백운주가", 35.0050, 127.0000),   # 약 0.55km
            r("동강주조", 37.18, 128.46), r("동강주조", 37.36, 127.11)]          # 영월 vs 성남
    c = cluster_places(rows)
    assert c[0] == c[1]
    assert c[2] != c[3]


def test_unlocated_rows_merge_by_name():
    rows = [r("영덕주조", None, None), r("영덕주조", 36.3, 129.3), r("", None, None)]
    c = cluster_places(rows)
    assert c[0] == c[1] and c[2] not in (c[0],)
