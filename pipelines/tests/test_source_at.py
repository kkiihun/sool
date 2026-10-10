import pandas as pd
import pytest

from sool_pipeline.source_at import SchemaError, diff, find_download, product_key, read_csv

HEADER = "제품명,제품소개,알콜도수,용량,성분,특이사항,특징,판매여부,양조장,양조장주소,홈페이지주소,수상경력\n"


def csv_bytes(*rows, enc="utf-8-sig"):
    return (HEADER + "".join(r + "\n" for r in rows)).encode(enc)


def test_find_download_from_page_html():
    html = 'onclick="location.href=\'/cmm/cmm/fileDownload.do?atchFileId=FILE_000000003236989&amp;fileDetailSn=1\'"'
    assert find_download(html) == ("FILE_000000003236989", "1")
    assert find_download("<html>링크 없음</html>") is None


def test_read_csv_maps_columns_and_available():
    df = read_csv(csv_bytes("이동 생 쌀 막걸리,소개,6,750ml,백미,,,Y,이동주조,경기 포천,http://x,",
                            "옛술,소개,13,375ml,찹쌀,,,N,옛양조,충북,,"))
    assert list(df.columns)[:3] == ["name", "description", "abv"]
    assert df["abv"].tolist() == [6.0, 13.0]
    assert df["available"].tolist() == [True, False]


def test_read_csv_cp949_and_schema_error():
    assert len(read_csv(csv_bytes("막걸리,소개,6,750ml,쌀,,,Y,양조장,주소,,", enc="cp949"))) == 1
    with pytest.raises(SchemaError):
        read_csv("제품명,도수\n막걸리,6\n".encode())


def test_product_key_normalizes_and_keeps_abv_variants():
    assert product_key("이동 생 쌀 막걸리", "(주)이동주조", 6) == product_key("이동생쌀막걸리", "이동주조", 6.0)
    assert product_key("안동소주", "명인", 22) != product_key("안동소주", "명인", 45)


def frame(rows):
    cols = ["name", "description", "abv", "volume", "ingredients", "special_notes", "features", "available",
            "producer", "address", "homepage", "awards"]
    return pd.DataFrame([dict(zip(cols, r)) for r in rows])


def test_diff_added_removed_changed_stopped():
    base = ("소개", 6.0, "750ml", "쌀", "", "", True, "양조장", "주소", "", "")
    old = frame([("A술",) + base, ("B술",) + base, ("C술",) + base])
    b_changed = list(("B술",) + base)
    b_changed[7] = False          # 판매 중단
    b_changed[3] = "500ml"        # 용량 변경
    new = frame([("A술",) + base, tuple(b_changed), ("D술",) + base])
    d = diff(old, new)
    assert d["summary"] == {"old_rows": 3, "new_rows": 3, "added": 1, "removed": 1, "changed": 1, "stopped_selling": 1}
    assert d["added"][0]["name"] == "D술" and d["removed"][0]["name"] == "C술"
    assert set(d["changed"][0]["fields"]) == {"volume", "available"}
    assert d["stopped_selling"] == [{"name": "B술", "producer": "양조장"}]


def test_diff_identical_is_empty():
    base = ("소개", 6.0, "750ml", "쌀", "", "", True, "양조장", "주소", "", "")
    f = frame([("A술",) + base, ("A술",) + base])      # 같은 키 2행도 안정적으로 비교
    assert diff(f, f.copy())["summary"]["changed"] == 0
