"""맛·페어링 텍스트 추출 (사전 기반). 원본: CSV '특징' 서술 1,000여 건.

맛 축마다 +1(강함 언급) / -1(약함·없음 언급) / None(언급 없음).
'단맛과 신맛이 적어' 처럼 부정어 하나가 앞의 여러 맛에 걸리므로 절(clause) 단위로 판단한다.
"""
from __future__ import annotations

import re
import unicodedata

# 축 → (강함 표현, 약함 표현). 약함 표현은 부정어 없이도 -1
TASTE_AXES: dict[str, tuple[str, str | None]] = {
    "sweetness":   (r"단맛|달콤|달달|감미|당도|달큰|단\s?향", r"드라이|dry"),
    "acidity":     (r"산미|새콤|상큼|신맛|시큼|산뜻한\s?산", None),
    "body":        (r"묵직|바디감|무게감|진한|진하고|농밀|걸쭉|풀\s?바디", r"가벼운|가볍|라이트"),
    "carbonation": (r"탄산|청량|톡\s?쏘|스파클링|기포", None),
    "smoothness":  (r"부드러|부드럽|목넘김|매끄|순하", r"거친|자극적"),
    "aroma":       (r"향이\s?(?:풍부|진하|좋|강)|향긋|과일향|꽃향|누룩향|곡물향|풍미가\s?풍부", r"향이\s?(?:약|적)"),
    "nutty":       (r"고소", None),
    "bitterness":  (r"쌉쌀|쓴맛|쌉싸름", None),
    "clean":       (r"깔끔|담백|깨끗", None),
}
_AXIS_RE = {k: (re.compile(pos), re.compile(neg) if neg else None) for k, (pos, neg) in TASTE_AXES.items()}

# 부정·약함 표지. '매력적', '적당', '적절' 은 부정이 아님
_NEG_RE = re.compile(r"(?<!매력)(?<!전체)적(?:고|어|으|은|지|다|게)(?!당|절)|없|약하|약한|낮|덜|않")
_CLAUSE_SPLIT = re.compile(r"[.,!?;·\n]|지만|으나|는데|하며|이며")

# 페어링 그룹 → 패턴. '전' 은 '전통·전남·전체' 와 구분하기 위해 음식 이름으로만 잡음
PAIRING_GROUPS: dict[str, str] = {
    "전·부침":    r"파전|김치전|해물전|생선전|육전|부침|전류|녹두전|빈대떡|(?:^|[\s,·])전(?=[\s,·과와이을도]|$)",
    "회·해산물":  r"(?<![사기대협교총])회(?![사의원장복색])|해산물|조개|굴|해물|초밥|스시|게장|문어|오징어|새우|생선",
    "육류":      r"고기|갈비|삼겹|보쌈|수육|족발|스테이크|불고기|육류|소고기|돼지|닭|치킨|바비큐|구이",
    "치즈·양식":  r"치즈|파스타|피자|까나페|브루스케타|샐러드|양식|올리브",
    "디저트·과일": r"디저트|과일|케이크|초콜릿|아이스크림|떡|한과|팬케이크|빵",
    "매운·국물":  r"매운|매콤|찌개|탕|전골|국밥|김치(?!전)|떡볶이",
    "한식 전반":  r"한식",
    "칵테일·하이볼": r"칵테일|하이볼|토닉",
}
_PAIR_RE = {k: re.compile(v) for k, v in PAIRING_GROUPS.items()}


def _n(text) -> str:
    if text is None or (isinstance(text, float) and text != text):
        return ""
    return unicodedata.normalize("NFKC", str(text))


def taste_scores(text) -> dict[str, int | None]:
    """맛 축별 +1 / -1 / None. 한 축에 상반된 언급이 있으면 합의 부호(0 이면 0)."""
    sums: dict[str, int] = {}
    for clause in _CLAUSE_SPLIT.split(_n(text)):
        if not clause.strip():
            continue
        neg = _NEG_RE.search(clause)
        for axis, (pos_re, weak_re) in _AXIS_RE.items():
            m = pos_re.search(clause)
            if m:
                # 부정어가 맛 표현 뒤에 오면 약함 ("단맛이 적고", "단맛과 신맛이 적어")
                val = -1 if (neg and neg.start() > m.start()) else 1
                sums[axis] = sums.get(axis, 0) + val
            elif weak_re and weak_re.search(clause):
                sums[axis] = sums.get(axis, 0) - 1
    return {axis: (None if axis not in sums else (1 if sums[axis] > 0 else -1 if sums[axis] < 0 else 0))
            for axis in TASTE_AXES}


def pairings(text) -> list[str]:
    s = _n(text)
    return [g for g, pat in _PAIR_RE.items() if pat.search(s)]


def taste_profile(features, description=None) -> dict:
    """특징(우선) + 설명 → 맛 축 점수와 페어링 태그"""
    feat, desc = _n(features), _n(description)
    scores = taste_scores(feat) if feat.strip() else {k: None for k in TASTE_AXES}
    # 특징에 없는 축만 설명에서 보충
    if desc.strip():
        for k, v in taste_scores(desc).items():
            if scores[k] is None:
                scores[k] = v
    mentioned = [k for k, v in scores.items() if v is not None]
    return {
        **{f"taste_{k}": v for k, v in scores.items()},
        "taste_axes_mentioned": len(mentioned),
        "pairings": pairings(feat),
    }
