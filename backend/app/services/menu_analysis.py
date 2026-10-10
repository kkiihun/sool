# 식당 메뉴 분석 (식당 리포트): 사장님이 붙여 넣은 메뉴판 → 메뉴별 음식 그룹·맛 특성 → 어울리는 술 점수.
# 규칙은 설명 가능한 키워드 사전 (DB 접근 없는 순수 함수). 페어링 그룹 이름은 파이프라인 taste.PAIRING_GROUPS 와 같다.
import re

# 음식 그룹 (위에서부터 먼저 맞는 것 1개 + 추가로 맞는 것 모두)
GROUP_WORDS: dict[str, str] = {
    "육류": r"삼겹|목살|항정|갈비|갈매기|불고기|제육|보쌈|수육|족발|편육|돼지|소고기|한우|우삼겹|차돌|등심|안심|"
           r"닭|치킨|백숙|오리|곱창|막창|대창|양곱|순대|떡갈비|스테이크|바비큐|bbq|육회|고기",
    "전·부침": r"(?<![가-힣])전$|파전|김치전|해물전|모둠전|육전|동태전|녹두전|빈대떡|부침|동그랑땡|감자전|전병",
    "회·해산물": r"회$|(?<![사기대교])회(?![사의장색원])|물회|초밥|스시|사시미|조개|굴|낙지|쭈꾸미|주꾸미|오징어|문어|해물|"
              r"새우|게장|꽃게|대게|킹크랩|전복|장어|생선|고등어|갈치|조기|아귀|홍어|과메기|멍게|해삼|가리비",
    "매운·국물": r"찌개|탕$|탕(?![수])|전골|국밥|해장국|곰탕|설렁탕|칼국수|수제비|국수|짬뽕|라면|우동|떡볶이|닭발|"
              r"매운|얼큰|마라|불닭|김치찜|닭볶음|쭈꾸미볶음|낙지볶음|냉면|막국수|밀면",
    "치즈·양식": r"치즈|파스타|피자|리조또|샐러드|감바스|플래터|카나페|버거|양식",
    "디저트·과일": r"디저트|빙수|과일|아이스크림|케이크|떡$|약과|한과|티라미수|푸딩",
    "한식 전반": r"한정식|백반|정식|비빔밥|쌈밥|나물|두부|묵|된장|청국장|김치|잡채|보리밥|쌈",
}
# 맛 특성 → 술에서 찾을 성질
TRAIT_WORDS: dict[str, str] = {
    "기름진": r"삼겹|항정|곱창|막창|대창|튀김|치킨|전$|파전|부침|빈대떡|족발|갈비|돈까스|탕수|크림|버터|감바스",
    "매운": r"매운|얼큰|불닭|불맛|마라|짬뽕|떡볶이|닭발|김치찌개|낙지볶음|쭈꾸미|제육|고추|칼칼",
    "짭짤·감칠": r"젓갈|게장|조림|장아찌|명란|간장|된장|청국장|과메기|홍어|순대",
    "담백": r"수육|보쌈|백숙|회$|사시미|두부|숙회|편육|곰탕|설렁탕|물회|찜$|샤브",
    "달콤한 양념": r"불고기|떡갈비|양념|데리야끼|강정|간장치킨|찜닭|갈비찜",
    "해산물": r"회|초밥|조개|굴|낙지|오징어|문어|해물|새우|게|전복|장어|생선|멍게|해삼|가리비|홍어|과메기",
}
# 맛 특성별로 어울리는 술 성질 (taste 축 이름: 1 이면 가점) + 설명
TRAIT_RULES: dict[str, tuple[dict[str, float], str]] = {
    "기름진": ({"acidity": 1.5, "carbonation": 1.5, "clean": 1.0}, "산미·탄산·깔끔함이 기름기를 씻어 줌"),
    "매운": ({"sweetness": 1.5, "smoothness": 1.5, "carbonation": 0.5}, "단맛·부드러움이 매운맛을 달래 줌"),
    "짭짤·감칠": ({"sweetness": 1.0, "body": 1.0, "aroma": 0.5}, "단맛·묵직함이 짠맛과 균형"),
    "담백": ({"clean": 1.5, "aroma": 1.0, "smoothness": 0.5}, "깔끔하고 향이 좋은 술이 재료 맛을 살림"),
    "달콤한 양념": ({"acidity": 1.5, "clean": 0.5}, "산미가 단 양념을 정리해 줌"),
    "해산물": ({"clean": 1.5, "acidity": 1.0}, "깔끔·산뜻한 술이 비린 맛을 잡아 줌"),
}
_PRICE_RE = re.compile(r"\d[\d,.]*\s*(원|₩|만원|kg|g|ml|L|개|pcs|인분|인)?|₩", re.I)
_NOISE_RE = re.compile(r"\(.*?\)|\[.*?\]|[*·•\-–—|/]+|(소|중|대|1인|2인|3인|인분|사이즈|S|M|L)(?=\s|$)")
_SPLIT_RE = re.compile(r"[\n,;]+")
_COMPILED_G = {k: re.compile(v, re.I) for k, v in GROUP_WORDS.items()}
_COMPILED_T = {k: re.compile(v, re.I) for k, v in TRAIT_WORDS.items()}


def parse_menu(text: str, limit: int = 60) -> list[str]:
    """붙여 넣은 메뉴판 → 메뉴 이름 목록 (가격·사이즈·괄호 제거, 중복 제거)"""
    out, seen = [], set()
    for raw in _SPLIT_RE.split(text or ""):
        s = _PRICE_RE.sub(" ", raw)
        s = _NOISE_RE.sub(" ", s)
        s = re.sub(r"\s+", " ", s).strip()
        if len(s) < 2 or s in seen or not re.search(r"[가-힣a-zA-Z]", s):
            continue
        seen.add(s)
        out.append(s)
        if len(out) >= limit:
            break
    return out


def classify_dish(name: str) -> dict:
    """메뉴 하나 → 음식 그룹(여러 개 가능)·맛 특성"""
    key = name.replace(" ", "")
    groups = [g for g, p in _COMPILED_G.items() if p.search(key)]
    traits = [t for t, p in _COMPILED_T.items() if p.search(key)]
    return {"name": name, "groups": groups, "traits": traits}


def score_drink(dish: dict, drink: dict) -> tuple[float, list[str]]:
    """메뉴 ↔ 술 점수 + 이유. drink: pairings(list), taste(dict 축→1/-1/0/None), abv"""
    score, why = 0.0, []
    shared = [g for g in dish["groups"] if g in (drink.get("pairings") or [])]
    if shared:
        score += 3.0
        why.append(f"제품 설명에 '{shared[0]}'과 어울린다고 나옴")
    taste = drink.get("taste") or {}
    for t in dish["traits"]:
        rule, text = TRAIT_RULES[t]
        hit = sum(w for axis, w in rule.items() if taste.get(axis) == 1)
        if hit:
            score += hit
            why.append(f"{t} 메뉴 → {text}")
    abv = drink.get("abv")
    if "매운" in dish["traits"] and abv and abv >= 25:
        score -= 1.5                      # 매운 음식 + 독한 술은 자극이 겹침
    return score, why


def store_profile(dishes: list[dict]) -> dict:
    """가게 메뉴 구성: 그룹·특성 비율(%) — 분류된 메뉴 기준"""
    n = len(dishes) or 1
    groups, traits = {}, {}
    for d in dishes:
        for g in d["groups"]:
            groups[g] = groups.get(g, 0) + 1
        for t in d["traits"]:
            traits[t] = traits.get(t, 0) + 1
    pct = lambda c: sorted(({"name": k, "count": v, "pct": round(100 * v / n)} for k, v in c.items()), key=lambda x: -x["count"])  # noqa: E731
    return {"dishes": len(dishes), "groups": pct(groups), "traits": pct(traits)}


def abv_band(abv: float | None) -> str:
    if abv is None:
        return "?"
    return "가벼움(~8%)" if abv < 8 else "중간(8~16%)" if abv < 16 else "강함(16%~)"


def pick_lineup(dish_scores: dict[str, dict[int, float]], drinks: dict[int, dict], size: int = 4) -> list[int]:
    """가게 라인업: 메뉴를 가장 넓게 덮는 술을 하나씩 고르되 주종·도수대가 겹치지 않게 (탐욕 선택).
    dish_scores: 메뉴 → {술 id: 점수}. 이미 잘 맞는 술이 있는 메뉴는 덜 반영"""
    chosen: list[int] = []
    best_for = {d: 0.0 for d in dish_scores}
    while len(chosen) < size:
        cand = None
        for sid in drinks:
            if sid in chosen:
                continue
            gain = sum(max(0.0, s.get(sid, 0) - best_for[d]) for d, s in dish_scores.items())
            dk = drinks[sid]
            same_cat = sum(1 for c in chosen if drinks[c].get("category") == dk.get("category"))
            same_band = sum(1 for c in chosen if abv_band(drinks[c].get("abv")) == abv_band(dk.get("abv")))
            gain *= 0.6 ** same_cat * 0.8 ** same_band
            gain += 0.05 * (dk.get("quality") or 0)            # 동점이면 정보 충실·후기 많은 술
            if cand is None or gain > cand[0]:
                cand = (gain, sid)
        if cand is None or cand[0] <= 0.05:
            break
        chosen.append(cand[1])
        for d, s in dish_scores.items():
            best_for[d] = max(best_for[d], s.get(cand[1], 0))
    return chosen
