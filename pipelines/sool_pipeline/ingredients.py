# 양조 원료 시세: aT '일별 도·소매 가격정보' (공공데이터포털 B552845/perDay, 중도매 가격) → 월별 원료 가격·전년 대비·출하기.
# 매실·유자·오미자·복분자 등은 이 API 에 없어 다루지 않는다.
from __future__ import annotations

import json
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from statistics import median

import pandas as pd

API = "https://apis.data.go.kr/B552845/perDay/price"

# 원료 이름 → (부류코드, 품목코드, 제품 원재료 문구에서 찾을 패턴)
# 쓰는 술이 없거나(기장·참깨) 시세가 없거나(블루베리) 1~2종뿐인(현미·팥·녹두) 원료는 뺐다 (2026-10-10)
# 패턴은 '포도당'(포도 아님)·'배합'(배 아님)·'찹쌀'(쌀과 따로) 같은 오인을 피하도록 좁게
INGREDIENTS: dict[str, tuple[str, str, str]] = {
    "쌀":    ("100", "111", r"(?<![찹현흑])(?:쌀|백미|멥쌀)"),   # 현미·흑미는 쌀로 세지 않음
    "찹쌀":  ("100", "112", r"찹쌀"),
    "보리쌀": ("100", "121", r"보리(?!차)"),
    "콩":    ("100", "141", r"(?<![땅강완])콩(?!나물)"),
    "메밀":  ("100", "144", r"메밀"),
    "고구마": ("100", "151", r"고구마"),
    "감자":  ("100", "152", r"감자(?!전분)"),
    "사과":  ("400", "411", r"사과(?!산)"),
    "배":    ("400", "412", r"(?:^|[\s,(·/])배(?:즙|과즙|농축)?(?=$|[\s,)·/(])"),
    "복숭아": ("400", "413", r"복숭아"),
    "포도":  ("400", "414", r"포도(?!당)|캠벨|머루"),
    "감귤":  ("400", "415", r"감귤|귤|한라봉|천혜향"),
    "단감":  ("400", "416", r"단감|대봉|홍시|곶감"),
    "참다래": ("400", "419", r"참다래|키위"),
    "땅콩":  ("300", "314", r"땅콩"),
}
_COMPILED = {k: re.compile(v[2]) for k, v in INGREDIENTS.items()}
# 가격 급변 경고를 보낼 과일 원료 (곡물은 정부 수매·비축으로 안정적이라 제외)
FRUITS = {"포도", "사과", "감귤", "복숭아", "배", "단감", "참다래"}
SWING_PCT = 15

# 품종이 섞이면 값이 크게 흔들리는 원료는 대표 품종으로 고정 (포도: 과실주에 가장 많이 쓰는 캠벨얼리)
VARIETY = {"포도": "캠벨얼리"}
# 최상위 등급: 04 상품 (곡물·사과 등) / 24 L과 (포도 등 크기 등급)
TOP_GRADES = {"04", "24"}


def match_ingredients(text: str | None) -> list[str]:
    """제품 원재료 문구 → 시세를 볼 수 있는 원료 목록"""
    t = text or ""
    return [k for k, p in _COMPILED.items() if p.search(t)]


def _get_json(url: str, tries: int = 3) -> dict:
    """일시 오류(5xx·연결 끊김)는 잠깐 쉬고 다시. 4xx(키·파라미터 오류)는 바로 실패"""
    for n in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url), timeout=30) as res:
                return json.loads(res.read().decode("utf-8"))
        except urllib.error.HTTPError as ex:
            if ex.code < 500 or n == tries - 1:
                raise
        except (urllib.error.URLError, TimeoutError):
            if n == tries - 1:
                raise
        time.sleep(2 + 3 * n)
    raise RuntimeError("unreachable")


def fetch_month(service_key: str, ctgry: str, item: str, ym: str, se_cd: str = "02",
                page_size: int = 1000, min_interval: float = 0.1) -> list[dict]:
    """한 품목·한 달치 중도매 가격 (여러 쪽이면 모두). ym = 'YYYYMM'"""
    first, last = f"{ym}01", f"{ym}31"
    rows, page = [], 1
    while True:
        q = {"serviceKey": service_key, "pageNo": page, "numOfRows": page_size, "returnType": "JSON",
             "cond[exmn_ymd::GTE]": first, "cond[exmn_ymd::LTE]": last,
             "cond[ctgry_cd::EQ]": ctgry, "cond[item_cd::EQ]": item, "cond[se_cd::EQ]": se_cd}
        payload = _get_json(f"{API}?{urllib.parse.urlencode(q)}")
        body = payload.get("response", {}).get("body")
        if body is None:                          # 오류 응답 (키·한도 등)
            raise RuntimeError(str(payload)[:200])
        items = (body.get("items") or {}).get("item") or []
        rows += items
        if page * page_size >= int(body.get("totalCount") or 0) or not items:
            return rows
        page += 1
        time.sleep(min_interval)


def monthly_series(df: pd.DataFrame, variety: str | None = None) -> pd.DataFrame:
    """원시 행(exmn_ymd, grd_cd, vrty_nm, kg_prc) → 월별 kg 가격.
    최상위 등급만(없으면 전체), 대표 품종이 있으면 그 품종만, 날마다 시장 간 중앙값 → 그 달 평균"""
    d = df[df["kg_prc"] > 0]
    if variety and "vrty_nm" in d and (d["vrty_nm"] == variety).any():
        d = d[d["vrty_nm"] == variety]
    top = d[d["grd_cd"].isin(TOP_GRADES)]
    d = top if len(top) else d
    if d.empty:
        return pd.DataFrame(columns=["ym", "kg"])
    daily = d.groupby("exmn_ymd")["kg_prc"].median().reset_index()
    daily["ym"] = daily["exmn_ymd"].str[:6]
    return daily.groupby("ym")["kg_prc"].mean().round(0).reset_index().rename(columns={"kg_prc": "kg"})


def summarize(series: pd.DataFrame, today_ym: str) -> dict:
    """월별 가격 → 최근 값·전년 동월 대비·3개월 추세·출하기(가장 싼 달)·변동성"""
    if series.empty:
        return {}
    s = series.sort_values("ym")
    s = s[s["ym"] <= today_ym]
    by = dict(zip(s["ym"], s["kg"]))
    latest_ym = s["ym"].iloc[-1]
    latest = float(by[latest_ym])
    prev_year = f"{int(latest_ym[:4]) - 1}{latest_ym[4:]}"
    yoy = round(100 * (latest / by[prev_year] - 1), 1) if by.get(prev_year) else None
    three = s.tail(4)
    trend = round(100 * (three["kg"].iloc[-1] / three["kg"].iloc[0] - 1), 1) if len(three) == 4 else None
    # 계절성: 연도별 평균 대비 각 달 비율의 달별 중앙값 (완전한 해만)
    s2 = s.assign(y=s["ym"].str[:4], m=s["ym"].str[4:].astype(int))
    full = s2.groupby("y").filter(lambda g: len(g) >= 10)
    season = {}
    if not full.empty:
        full = full.assign(idx=full["kg"] / full.groupby("y")["kg"].transform("mean"))
        season = {int(m): round(float(median(g["idx"])), 3) for m, g in full.groupby("m")}
    cheapest = sorted(season, key=season.get)[:3] if len(season) >= 10 else []
    # 출하 시기: 절반 이상의 해에 가격이 있는 달 (포도·복숭아처럼 일부 달만 유통되는 원료)
    years = s2["y"].nunique()
    month_years = s2.groupby("m")["y"].nunique()
    on_market = sorted(int(m) for m, n in month_years.items() if n >= max(1, years / 2)) if years >= 2 else []   # 2년 미만이면 판단 보류
    recent = s.tail(24)["kg"]
    return {
        "latest_ym": latest_ym, "latest_kg": latest, "yoy_pct": yoy, "trend_3m_pct": trend,
        "season": season, "cheapest_months": cheapest, "on_market_months": on_market,
        "volatility": round(float(recent.std() / recent.mean()), 3) if len(recent) > 2 else None,
        "monthly": [{"ym": ym, "kg": float(kg)} for ym, kg in zip(s["ym"].tail(36), s["kg"].tail(36))],
    }
