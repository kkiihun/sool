from sool_pipeline.blogs import build_query, clean_text, match_level, pick, producer_label


def doc(title, contents="", url=None, blogname="블로그", dt="2026-02-21T10:00:00.000+09:00"):
    return {"title": title, "contents": contents, "url": url or f"https://blog/{title}", "blogname": blogname, "datetime": dt}


def test_clean_text_strips_tags_and_entities():
    assert clean_text("<b>국순당</b> &#34;이화주&#34;") == '국순당 "이화주"'


def test_producer_label_and_query():
    assert producer_label("농업회사법인 (주)배혜정도가") == "배혜정도가"
    assert build_query("부자", "농업회사법인 (주)배혜정도가") == "부자 배혜정도가"
    assert build_query("국순당 생막걸리", "국순당") == "국순당 생막걸리"     # 이름에 양조장이 이미 있으면 붙이지 않음


def test_match_level():
    assert match_level(doc("<b>부자</b> 막걸리 후기", "배혜정도가에서 만든"), "부자", "배혜정도가") == 2
    # 짧은 이름은 양조장이 같이 나와야 함
    assert match_level(doc("부자 되는 법"), "부자", "배혜정도가") == 0
    # 충분히 긴 이름은 이름만으로 인정
    assert match_level(doc("하얀연꽃 백련막걸리 마셔봄"), "하얀연꽃 백련막걸리", "신평양조장") == 1
    assert match_level(doc("전혀 다른 글"), "하얀연꽃 백련막걸리", "신평양조장") == 0


def test_pick_orders_by_level_dedupes_and_limits():
    docs = [
        doc("백련막걸리 하얀연꽃 아님"),                                  # 이름 안 맞음 → 제외
        doc("하얀연꽃 백련막걸리 후기", url="u1"),                        # 1
        doc("하얀연꽃 백련막걸리", "신평양조장 방문", url="u2"),           # 2
        doc("하얀연꽃 백련막걸리 다시", url="u1"),                        # 중복 링크
    ] + [doc(f"하얀연꽃 백련막걸리 {i}", url=f"x{i}") for i in range(10)]
    out = pick(docs, "하얀연꽃 백련막걸리", "신평양조장", limit=5)
    assert len(out) == 5
    assert out[0]["url"] == "u2" and out[0]["match"] == "name+producer"
    assert out[1]["url"] == "u1"
    assert out[0]["posted_at"] == "2026-02-21"
    assert "contents" not in out[0]                                       # 본문은 내보내지 않음


def test_title_hit_ranks_above_contents_only():
    docs = [doc("담양 죽력고 후기", "추성고을 대통주도 같이", url="c"),   # 본문에만 이름 (+양조장)
            doc("대통주 시음기", url="t")]                               # 제목에 이름, 양조장 없음 → 이름 3자라 원래 제외
    out = pick(docs, "대통주", "추성고을")
    assert [o["url"] for o in out] == ["c"]
    docs.append(doc("추성고을 대통주 시음기", url="t2"))
    assert [o["url"] for o in pick(docs, "대통주", "추성고을")] == ["t2", "c"]


def test_job_posts_are_noise():
    assert match_level(doc("[국순당] 음료생산직 채용 연봉 총정리", "국순당 생막걸리"), "국순당 생막걸리", "국순당") == 0
