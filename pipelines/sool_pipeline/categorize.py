"""규칙 기반 카테고리 제안 (보정 1단계).

분류 체계: 주세법 주종을 서비스용으로 묶은 7개
  탁주 / 약주 / 청주 / 과실주 / 증류주 / 리큐르 / 기타주류
  - 증류주 = 증류식소주 + 일반증류주 (서비스 필터에서 구분할 필요가 적어서 묶음)
  - 막걸리는 탁주의 별칭 (표시용)

규칙으로 확신이 없는 제품은 None 을 돌려주고, 뒤 단계(외부 매칭 → LLM)가 처리한다.
각 제안에는 rule id 와 근거를 남겨 관리자 승인 화면·정확도 측정에 쓴다.
"""
from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass

CATEGORIES = ["탁주", "약주", "청주", "과실주", "증류주", "리큐르", "기타주류"]
# 기존 데이터의 표기 → 표준 코드
CATEGORY_ALIASES = {"막걸리": "탁주", "소주": "증류주", "증류식소주": "증류주", "일반증류주": "증류주", "와인": "과실주"}


def standardize(category: str | None) -> str | None:
    if category is None:
        return None
    c = unicodedata.normalize("NFKC", str(category)).strip()
    return CATEGORY_ALIASES.get(c, c) or None

NAME_RULES: list[tuple[str, str, float, re.Pattern[str]]] = [
    # (rule_id, category, confidence, 이름 패턴)
    ("name_takju", "탁주", 0.95, re.compile(r"막걸리|탁주|동동주|탁배기")),
    ("name_liqueur", "리큐르", 0.9, re.compile(r"리큐르|리큐어")),
    ("name_cheongju", "청주", 0.9, re.compile(r"청주|사케")),
    ("name_yakju", "약주", 0.9, re.compile(r"약주|소곡주|법주")),
    ("name_wine", "과실주", 0.85, re.compile(r"와인|사이더|시드르|cider|wine", re.I)),
]

DISTILL_NAME_RE = re.compile(r"소주|증류|브랜디|brandy|위스키|whisky|고량|보드카|vodka|\bgin\b|진$", re.I)
DISTILL_ING_RE = re.compile(r"증류\s*원액|증류주\s*원액|증류액|원액")
SPIRIT_ADD_RE = re.compile(r"주정")
SUGAR_RE = re.compile(r"설탕|과당|올리고당|물엿|스테비아|수크랄로스|스크랄로스|아스파|자일리톨|감미료")
FRUIT_RE = re.compile(
    r"포도|사과|복분자|머루|감귤|귤|오미자|블루베리|딸기|매실|홍시|오디|다래|키위|자두|복숭아|"
    r"레몬|유자|석류|아로니아|샤인\s*머스[켓캣]|캠벨|무화과|체리|배즙|배\(|한라봉|천혜향|과즙|과일"
)
GRAIN_RE = re.compile(r"쌀|백미|찹쌀|멥쌀|현미|흑미|보리|밀|좁쌀|차조|수수|옥수수|고구마|감자|누룩|입국|곡자|\b국\b")
WATER_RE = re.compile(r"^(정제수|지하수|지하정제수|물|암반수)")


@dataclass(frozen=True)
class Suggestion:
    category: str | None
    confidence: float
    rule: str
    reason: str


def _norm(text: str | None) -> str:
    return unicodedata.normalize("NFKC", text or "").strip()


def first_ingredient(ingredients: str | None) -> str:
    """물 종류를 건너뛴 첫 원료. 원료 표기는 함량 순이라 주원료 판단에 쓴다."""
    for tok in re.split(r"[,，.·/]", _norm(ingredients)):
        tok = tok.strip()
        if tok and not WATER_RE.match(tok):
            return tok
    return ""


def suggest(name: str | None, ingredients: str | None, abv: float | None) -> Suggestion:
    name_s, ing_s = _norm(name), _norm(ingredients)
    text = f"{name_s} {ing_s}"

    # 1) 이름에 주종이 직접 들어간 경우
    for rule, cat, conf, pat in NAME_RULES:
        m = pat.search(name_s)
        if m:
            return Suggestion(cat, conf, rule, f"이름에 '{m.group(0)}'")

    has_spirit_add = bool(SPIRIT_ADD_RE.search(ing_s))
    has_sugar = bool(SUGAR_RE.search(ing_s))
    has_fruit = bool(FRUIT_RE.search(text))
    distilled = bool(DISTILL_NAME_RE.search(name_s) or DISTILL_ING_RE.search(ing_s))
    first = first_ingredient(ing_s)

    # 2) 도수가 높으면 증류주 계열. 주정 + 과실/당이면 리큐르
    if abv is not None and abv >= 20:
        if has_spirit_add and (has_fruit or has_sugar):
            return Suggestion("리큐르", 0.7, "abv20_spirit_flavored", f"{abv}% · 주정+과실/당 첨가")
        conf = 0.95 if abv >= 25 else 0.85
        return Suggestion("증류주", conf, "abv_high", f"{abv}%")

    # 3) 증류 단서가 있는 중간 도수
    if distilled and abv is not None and abv >= 13:
        if has_fruit or has_sugar or has_spirit_add:
            return Suggestion("리큐르", 0.65, "distilled_flavored", f"{abv}% · 증류원액+과실/당")
        return Suggestion("증류주", 0.75, "distilled_mid_abv", f"{abv}% · 증류 단서")

    # 4) 주정을 섞은 낮은 도수 술
    if has_spirit_add:
        return Suggestion("리큐르", 0.6, "spirit_added", "원료에 주정")

    # 5) 주원료가 과실
    if first and FRUIT_RE.search(first):
        return Suggestion("과실주", 0.8, "fruit_first", f"주원료 '{first}'")

    # 6) 곡물·누룩 발효주: 도수로 탁주/약주 구분
    if (first and GRAIN_RE.search(first)) or (not first and GRAIN_RE.search(ing_s)):
        if abv is None:
            return Suggestion(None, 0.0, "grain_no_abv", "곡물 발효주지만 도수 없음")
        if abv < 9.5:
            return Suggestion("탁주", 0.7, "grain_low_abv", f"곡물 · {abv}%")
        if abv <= 18:
            return Suggestion("약주", 0.6, "grain_mid_abv", f"곡물 · {abv}%")

    # 7) 과실이 들어갔지만 주원료는 아닌 경우 등 → 다음 단계로
    return Suggestion(None, 0.0, "unresolved", "규칙으로 판단 불가")
