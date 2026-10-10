"""제품명·양조장명 정규화 (외부 데이터 매칭과 중복 검사의 키)."""
from __future__ import annotations

import re
import unicodedata

# 양조장 법인 표기: 매칭에 방해만 되므로 제거
_CORP_PATTERNS = [
    r"농업회사법인", r"영농조합법인", r"영농조합", r"농업법인", r"주식회사", r"유한회사",
    r"\(주\)", r"\(유\)", r"\(합\)", r"㈜", r"㈔", r"\(사\)",
]
_CORP_RE = re.compile("|".join(_CORP_PATTERNS))

# 이름 안의 용량·도수 표기: "750ml", "1.8L", "25도", "40%"
_VOLUME_RE = re.compile(r"\d+(?:\.\d+)?\s*(?:ml|mL|ML|l|L|리터)\b")
_ABV_RE = re.compile(r"\d+(?:\.\d+)?\s*(?:도|%)")
_BRACKET_RE = re.compile(r"[\(\[\{（【].*?[\)\]\}）】]")
_NON_WORD_RE = re.compile(r"[^0-9a-z가-힣]+")


def _base(text: str | None) -> str:
    if not text:
        return ""
    # NFKC: 전각 → 반각, ㈜ 같은 호환 문자 분해
    return unicodedata.normalize("NFKC", str(text)).strip()


def normalize_name(name: str | None) -> str:
    """'이동 생 쌀 막걸리 (750ml)' → '이동생쌀막걸리'"""
    s = _base(name).lower()
    s = _BRACKET_RE.sub(" ", s)
    s = _VOLUME_RE.sub(" ", s)
    s = _ABV_RE.sub(" ", s)
    return _NON_WORD_RE.sub("", s)


def normalize_producer(producer: str | None) -> str:
    """'농업회사법인 (주)온증류소' → '온증류소'"""
    s = _base(producer)
    s = _CORP_RE.sub(" ", s).lower()
    # NFKC 후 ㈜ 는 '(주)' 로 바뀌므로 한 번 더
    s = _CORP_RE.sub(" ", s)
    return _NON_WORD_RE.sub("", s)


def is_missing(value: str | None) -> bool:
    return value is None or str(value).strip() in {"", "-", "미등록", "NULL", "null", "None"}
