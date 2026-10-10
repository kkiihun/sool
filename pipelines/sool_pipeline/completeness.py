# 술 카드 충실도 (U1): 화면에 보여줄 핵심 7개 항목 중 몇 개가 채워졌나.
# 메인 화면 '추천순' 정렬과 데이터 품질 지표(완벽 카드 비율)에 쓴다.
from collections import Counter

# 항목 이름 → 화면 이름. 순서 = 관리자 화면 표시 순서
CARD_ITEMS: dict[str, str] = {
    "category": "주종",
    "ingredient": "원료",
    "taste": "맛",
    "pairing": "페어링",
    "description": "설명",
    "location": "지도 위치",
    "purchase": "구매 링크",
}
CARD_MAX = len(CARD_ITEMS)
DEAD_LINK_STATES = {"dead", "error", "ended"}


def _filled(v) -> bool:
    if v is None:
        return False
    if isinstance(v, float) and v != v:       # NaN
        return False
    if isinstance(v, str):
        return v.strip() != ""
    return True


def card_completeness(*, category, main_ingredient, taste_axes_mentioned, pairings, description,
                      located: bool, link_state) -> tuple[int, list[str]]:
    """(점수 0~7, 빠진 항목 이름 목록). link_state 가 None 이면 링크 없음."""
    ok = {
        "category": _filled(category),
        "ingredient": _filled(main_ingredient),
        "taste": _filled(taste_axes_mentioned) and taste_axes_mentioned > 0,
        "pairing": pairings is not None and len(pairings) > 0,
        "description": _filled(description),
        "location": bool(located),
        # 미검사(unchecked)·요청 제한·로그인 필요는 '있음'으로 본다. 확인된 죽은 링크만 빠짐
        "purchase": _filled(link_state) and link_state not in DEAD_LINK_STATES,
    }
    missing = [k for k in CARD_ITEMS if not ok[k]]
    return CARD_MAX - len(missing), missing


def summarize(scores: list[int], missing: list[list[str]]) -> dict:
    """품질 지표: 점수 분포·완벽 카드 비율·항목별 빈칸 수"""
    n = len(scores) or 1
    dist = Counter(scores)
    gaps = Counter(m for ms in missing for m in ms)
    return {
        "max": CARD_MAX,
        "full": dist.get(CARD_MAX, 0),
        "full_pct": round(100 * dist.get(CARD_MAX, 0) / n, 1),
        "ge6_pct": round(100 * sum(c for s, c in dist.items() if s >= CARD_MAX - 1) / n, 1),
        "avg": round(sum(scores) / n, 2),
        "distribution": {str(s): dist.get(s, 0) for s in range(CARD_MAX, -1, -1)},
        "missing": {k: gaps.get(k, 0) for k in CARD_ITEMS},
    }
