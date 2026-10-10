"""시장 구조 지표 (P6). 입력: 제품 단위 DataFrame (술 카드 + 시도 + 장소 + 구매 경로).
각 함수는 화면에 그대로 쓰는 JSON 직렬화 가능한 dict/list 를 돌려준다.

필요 컬럼: sool_id, name, producer, category, sido, place_id, abv, has_sweetener, visit_brewery,
           food_master, award_count, special_ingredients(list), online_reachable(bool), link_state, taste_*
"""
from __future__ import annotations

import pandas as pd

MIN_REGION_PRODUCTS = 20      # 지역 특화 계산에 넣을 최소 제품 수 (작은 지역은 비율이 흔들림)


def _r(x, n=3):
    return None if x is None or pd.isna(x) else round(float(x), n)


def region_specialization(df: pd.DataFrame) -> dict:
    """지역×주종 입지계수(LQ) = (지역 내 주종 비중) / (전국 주종 비중). LQ>1.5 면 특화."""
    d = df.dropna(subset=["sido", "category"])
    big = d.groupby("sido").size()
    d = d[d["sido"].isin(big[big >= MIN_REGION_PRODUCTS].index)]
    ct = pd.crosstab(d["sido"], d["category"])
    share = ct.div(ct.sum(axis=1), axis=0)
    national = ct.sum() / ct.values.sum()
    lq = share / national
    cells = [
        {"sido": s, "category": c, "n": int(ct.loc[s, c]), "share": _r(share.loc[s, c]), "lq": _r(lq.loc[s, c], 2)}
        for s in ct.index for c in ct.columns
    ]
    top = sorted((x for x in cells if x["n"] >= 5), key=lambda x: -x["lq"])[:10]
    return {"regions": ct.sum(axis=1).sort_values(ascending=False).index.tolist(),
            "categories": national.sort_values(ascending=False).index.tolist(),
            "national_share": {c: _r(v) for c, v in national.items()}, "cells": cells, "top_specialized": top}


def ingredient_regions(df: pd.DataFrame, top_n: int = 15) -> list[dict]:
    """특산 원료별: 제품 수, 가장 많이 쓰는 지역과 그 비중 (집중도)"""
    rows = df[["sido", "special_ingredients"]].explode("special_ingredients").dropna()
    out = []
    for ing, g in rows.groupby("special_ingredients"):
        by = g["sido"].value_counts()
        out.append({"ingredient": ing, "n": int(len(g)), "top_sido": by.index[0], "top_n": int(by.iloc[0]),
                    "concentration": _r(by.iloc[0] / len(g)), "regions": {k: int(v) for k, v in by.head(4).items()}})
    return sorted(out, key=lambda x: -x["n"])[:top_n]


def _size_bucket(n: int) -> str:
    return "1종" if n == 1 else "2~4종" if n <= 4 else "5~9종" if n <= 9 else "10종+"


def sweetener_segments(df: pd.DataFrame) -> dict:
    """감미료 사용률: 주종별 / 양조장 규모별 / 인증·수상 여부별"""
    d = df.copy()
    sizes = d.groupby("place_id")["sool_id"].transform("count")
    d["size_bucket"] = sizes.map(_size_bucket)
    d["awarded"] = d["award_count"].fillna(0) > 0

    def rate(g):
        return [{"key": k, "n": int(len(x)), "rate": _r(x["has_sweetener"].mean())} for k, x in g]

    return {
        "by_category": rate(d.dropna(subset=["category"]).groupby("category")),
        "by_brewery_size": rate(d.dropna(subset=["place_id"]).groupby("size_bucket")),
        "by_visit_brewery": rate(d.groupby(d["visit_brewery"].map({True: "찾아가는 양조장", False: "그 외"}))),
        "by_awarded": rate(d.groupby(d["awarded"].map({True: "수상 제품", False: "그 외"}))),
    }


def brewery_structure(df: pd.DataFrame) -> dict:
    """양조장(장소) 단위: 제품 수 분포, 상위 10곳 점유율, HHI, 지니계수, 주종 다각화"""
    g = df.dropna(subset=["place_id"]).groupby("place_id")
    counts = g.size().sort_values(ascending=False)
    total = counts.sum()
    shares = counts / total
    x = counts.sort_values().values
    n = len(x)
    gini = (2 * sum((i + 1) * v for i, v in enumerate(x)) / (n * x.sum()) - (n + 1) / n) if n else None
    cats = g["category"].nunique()
    names = g["producer"].agg(lambda s: s.dropna().mode().iloc[0] if s.notna().any() else None)
    return {
        "breweries": int(n), "products": int(total),
        "distribution": counts.map(_size_bucket).value_counts().reindex(["1종", "2~4종", "5~9종", "10종+"]).fillna(0).astype(int).to_dict(),
        "top10_share": _r(shares.head(10).sum()), "hhi": _r((shares ** 2).sum() * 10000, 1), "gini": _r(gini),
        "multi_category_rate": _r((cats >= 2).mean()),
        "top": [{"name": names[p], "products": int(c), "categories": int(cats[p])} for p, c in counts.head(10).items()],
    }


def abv_profile(df: pd.DataFrame, outlier_limit: int = 20) -> dict:
    """주종별 도수 사분위 + 이상치(주종 기준 IQR 밖) — 분류 오류 후보"""
    d = df.dropna(subset=["category", "abv"])
    stats, outliers = [], []
    for c, g in d.groupby("category"):
        q1, q2, q3 = g["abv"].quantile([0.25, 0.5, 0.75])
        iqr = q3 - q1
        lo, hi = q1 - 1.5 * iqr, q3 + 1.5 * iqr
        stats.append({"category": c, "n": int(len(g)), "min": _r(g["abv"].min(), 1), "q1": _r(q1, 1),
                      "median": _r(q2, 1), "q3": _r(q3, 1), "max": _r(g["abv"].max(), 1)})
        for r in g[(g["abv"] < lo) | (g["abv"] > hi)].itertuples():
            outliers.append({"sool_id": int(r.sool_id), "name": r.name, "category": c, "abv": _r(r.abv, 1),
                             "range": [_r(lo, 1), _r(hi, 1)]})
    stats.sort(key=lambda x: -x["n"])
    return {"by_category": stats, "outliers": sorted(outliers, key=lambda x: x["category"])[:outlier_limit],
            "outlier_count": len(outliers)}


def purchase_access(df: pd.DataFrame) -> dict:
    """온라인 구매 경로가 살아 있는 비율: 전체 / 주종별 / 시도별 / 양조장 규모별"""
    d = df.copy()
    d["size_bucket"] = d.groupby("place_id")["sool_id"].transform("count").map(
        lambda n: None if pd.isna(n) else _size_bucket(int(n)))

    def rate(col, min_n=1):
        out = [{"key": k, "n": int(len(g)), "rate": _r(g["online_reachable"].mean())}
               for k, g in d.dropna(subset=[col]).groupby(col) if len(g) >= min_n]
        return sorted(out, key=lambda x: -x["rate"])

    link = d["link_state"].fillna("none")
    return {
        "overall": _r(d["online_reachable"].mean()),
        "by_category": rate("category"), "by_sido": rate("sido", min_n=10), "by_brewery_size": rate("size_bucket"),
        "link_health": link.value_counts().to_dict(),
    }


def hidden_gems(df: pd.DataFrame, limit: int = 20) -> list[dict]:
    """품질 신호(수상·식품명인·무형문화재)는 있는데 온라인 구매 경로가 없는 제품"""
    d = df.copy()
    d["signal"] = (d["award_count"].fillna(0) > 0).astype(int) * 2 + d["food_master"].fillna(False).astype(int) \
        + d.get("intangible_heritage", pd.Series(False, index=d.index)).fillna(False).astype(int)
    g = d[(d["signal"] > 0) & (~d["online_reachable"])].sort_values(["signal", "award_count"], ascending=False)
    return [{"sool_id": int(r.sool_id), "name": r.name, "producer": r.producer, "category": r.category,
             "sido": r.sido, "award_count": int(r.award_count or 0), "food_master": bool(r.food_master),
             "visit_brewery": bool(r.visit_brewery)} for r in g.head(limit).itertuples()]


def taste_by_category(df: pd.DataFrame, axes: list[str], min_text: int = 10) -> list[dict]:
    """주종별 '이 맛을 강조한 비율' = 맛 설명이 있는 제품 중 그 축이 +1 인 비율.
    (언급된 것 중 강함 비율은 서술이 대체로 긍정적이라 모두 0.9 근처로 나와 구분력이 없음)"""
    out = []
    for c, g in df.dropna(subset=["category"]).groupby("category"):
        cols = [f"taste_{a}" for a in axes]
        with_text = g[g[cols].notna().any(axis=1)]
        row = {"category": c, "n": int(len(g)), "with_text": int(len(with_text))}
        for a in axes:
            row[a] = _r((with_text[f"taste_{a}"] == 1).mean()) if len(with_text) >= min_text else None
        out.append(row)
    return sorted(out, key=lambda x: -x["n"])


def build_market(df: pd.DataFrame, taste_axes: list[str]) -> dict[str, object]:
    return {
        "region_specialization": region_specialization(df),
        "ingredient_regions": ingredient_regions(df),
        "sweetener_segments": sweetener_segments(df),
        "brewery_structure": brewery_structure(df),
        "abv_profile": abv_profile(df),
        "purchase_access": purchase_access(df),
        "hidden_gems": hidden_gems(df),
        "taste_by_category": taste_by_category(df, taste_axes),
    }
