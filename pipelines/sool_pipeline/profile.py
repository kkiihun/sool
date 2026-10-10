"""술 카드(제품 프로파일) 추출 — 원료·제조 특성·인증·수상·용량. 모두 순수 함수."""
from __future__ import annotations

import re
import unicodedata

from .categorize import FRUIT_RE, first_ingredient


def _n(text: str | None) -> str:
    if text is None or (isinstance(text, float) and text != text):  # NaN
        return ""
    return unicodedata.normalize("NFKC", str(text)).strip()


# ---------- 원료 ----------
SWEETENER_RE = re.compile(r"아스파|수크랄|스크랄|스테비|감미료|사카린|아세설팜|자일리톨|에리스리톨")
PRESERVATIVE_RE = re.compile(r"소브산|소르빈산|보존료|안식향산|아황산|메타중아황산|무수아황산")
SPIRIT_RE = re.compile(r"주정")
# 특산 원료: 지역성·탐색 필터에 쓰는 대표 원료 (표시 이름, 패턴)
SPECIAL_INGREDIENTS: list[tuple[str, re.Pattern[str]]] = [
    (name, re.compile(pat)) for name, pat in [
        ("감귤", r"감귤|귤|한라봉|천혜향"), ("복분자", r"복분자"), ("오미자", r"오미자"),
        ("사과", r"사과"), ("포도", r"포도|머루|캠벨|샤인\s*머스[켓캣]"), ("배", r"배즙|배\(|\b배\b"),
        ("매실", r"매실"), ("유자", r"유자"), ("딸기", r"딸기"), ("블루베리", r"블루베리"),
        ("고구마", r"고구마"), ("밤", r"알밤|\b밤\b"), ("꿀", r"벌꿀|꿀"), ("인삼", r"인삼|홍삼|산삼|산양삼"),
        ("국화", r"국화"), ("솔", r"솔잎|송순|솔"), ("쑥", r"쑥"), ("연", r"연잎|연꽃|백련"),
        ("흑미", r"흑미"), ("찹쌀", r"찹쌀"), ("보리", r"보리"), ("옥수수", r"옥수수"),
    ]
]


def ingredient_profile(ingredients: str | None) -> dict:
    s = _n(ingredients)
    return {
        "main_ingredient": first_ingredient(s) or None,
        "special_ingredients": [name for name, pat in SPECIAL_INGREDIENTS if pat.search(s)],
        "has_fruit": bool(FRUIT_RE.search(s)),
        "has_sweetener": bool(SWEETENER_RE.search(s)),
        "has_preservative": bool(PRESERVATIVE_RE.search(s)),
        "has_spirit_added": bool(SPIRIT_RE.search(s)),
        "ingredient_count": len([t for t in re.split(r"[,，·/]", s) if t.strip()]) if s else 0,
    }


# ---------- 제조 특성 ----------
_RAW_RE = re.compile(r"생막걸리|생탁|생주|(?:^|\s)생(?:\s|$)|살균하지\s*않|비살균|효모가\s*살아")
_PASTEURIZED_RE = re.compile(r"(?<!비)살균")
_SPARKLING_RE = re.compile(r"스파클링|탄산|sparkling|이산화탄소", re.I)
_AGED_RE = re.compile(r"(\d{1,2})\s*년\s*(?:숙성|산)")


def production_profile(name: str | None, ingredients: str | None, description: str | None) -> dict:
    nm, ing, desc = _n(name), _n(ingredients), _n(description)
    text = f"{nm} {desc}"
    raw = bool(_RAW_RE.search(text))
    aged = _AGED_RE.search(f"{nm} {desc}")
    return {
        "is_raw": raw,                                           # 생(비살균)
        "is_pasteurized": (not raw) and bool(_PASTEURIZED_RE.search(text)),
        "is_sparkling": bool(_SPARKLING_RE.search(f"{nm} {ing}")),
        "aged_years": int(aged.group(1)) if aged else None,
    }


# ---------- 인증·수상 ----------
def certifications(special_notes: str | None) -> dict:
    s = _n(special_notes)
    return {
        "visit_brewery": "찾아가는" in s,      # 찾아가는 양조장 (방문·체험 가능)
        "food_master": "명인" in s,            # 대한민국 식품명인
        "intangible_heritage": "무형문화재" in s,
    }


_AWARD_LEVELS = ["대상", "최우수상", "금상", "은상", "동상", "우수상", "장려상", "특별상", "본상"]
_AWARD_RANK = {lv: i for i, lv in enumerate(_AWARD_LEVELS)}   # 작을수록 높음
_LEVEL_RE = re.compile("|".join(_AWARD_LEVELS) + r"|1위|gold|silver|bronze", re.I)
_YEAR_RE = re.compile(r"(20\d\d|19\d\d)")


def parse_awards(awards: str | None) -> dict:
    """'2016 대한민국 우리술품평회 살균막걸리 우수상, 2018 ... 대상' → 건수·최고 등급·연도"""
    s = _n(awards)
    if not s:
        return {"award_count": 0, "best_award": None, "award_years": []}
    # 연도로 시작하는 단위로 나눔 (구분자가 제각각이라)
    parts = [p.strip(" ,/·") for p in re.split(r"(?=(?:19|20)\d\d)", s) if p.strip(" ,/·")]
    levels = []
    for p in parts:
        found = _LEVEL_RE.findall(p)
        if found:
            # '대한민국주류대상 대상' 처럼 대회 이름에 '대상'이 섞이므로 마지막 등급을 씀
            lv = found[-1].lower()
            lv = {"1위": "대상", "gold": "금상", "silver": "은상", "bronze": "동상"}.get(lv, lv)
            levels.append(lv)
    best = min(levels, key=lambda lv: _AWARD_RANK.get(lv, 99)) if levels else None
    years = sorted({int(y) for y in _YEAR_RE.findall(s)})
    return {"award_count": max(len(parts), 1), "best_award": best, "award_years": years}


# ---------- 용량 ----------
_VOL_RE = re.compile(r"(\d+(?:\.\d+)?)\s*(ml|mℓ|nl|l|ℓ|리터)?", re.I)


def parse_volumes(volume: str | None) -> list[int]:
    """'375ml, 750ml' → [375, 750]. 단위 없는 숫자는 100 이상이면 ml 로 본다."""
    out = []
    text = re.sub(r"(\d),(\d{3})(?!\d)", r"\1\2", _n(volume))   # 천 단위 콤마 '1,000ml'
    for num, unit in _VOL_RE.findall(text):
        v = float(num)
        unit = (unit or "").lower()
        if unit in ("l", "ℓ", "리터"):
            v *= 1000
        elif not unit and v < 100:
            continue        # 'N-Nml' 같은 범위 표기의 앞 숫자 등
        out.append(int(round(v)))
    return sorted(set(out))


def build_profile(row: dict) -> dict:
    """seed 행(이름·성분·설명·특이사항·수상·용량) → 술 카드 한 행"""
    vols = parse_volumes(row.get("volume"))
    return {
        **ingredient_profile(row.get("ingredients")),
        **production_profile(row.get("name"), row.get("ingredients"), row.get("description")),
        **certifications(row.get("special_notes")),
        **parse_awards(row.get("awards")),
        "volumes_ml": vols,
        # 용량이 여러 개면 가격과 짝을 알 수 없으므로 대표값을 두지 않음
        "volume_ml": vols[0] if len(vols) == 1 else None,
    }
