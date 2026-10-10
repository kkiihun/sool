"""sool-pipeline 단계. S1~S2 범위: collect → clean → analyze (publish·feedback 은 S4 이후)."""
from __future__ import annotations

import json
import math
import os

import duckdb
import pandas as pd
from sqlalchemy import create_engine, text

import hashlib
from collections import Counter

from .blogs import build_query, kakao_blog_fetcher, pick as pick_blogs
from .categorize import standardize, suggest
from .completeness import card_completeness, summarize
from .geo import clean_address, geocode, kakao_fetcher, short_sido
from .links import check as check_link, classify as classify_link, interpret as interpret_link, normalize_url
from .normalize import is_missing, normalize_name, normalize_producer
from .market import build_market
from .profile import build_profile
from .taste import TASTE_AXES, taste_profile
from .runner import Context, StepResult


def _engine():
    if not os.environ.get("DB_PASSWORD"):
        raise RuntimeError("DB_PASSWORD 비어 있음 — .env 에 PIPELINE_DB_PASSWORD 설정 후 ops/create-pipeline-user.sh")
    url = (
        f"mysql+pymysql://{os.environ['DB_USER']}:{os.environ['DB_PASSWORD']}"
        f"@{os.environ.get('DB_HOST', 'db')}:{os.environ.get('DB_PORT', '3306')}/{os.environ.get('DB_NAME', 'sool')}"
    )
    return create_engine(url, pool_pre_ping=True)


# ① collect — 서비스 DB 스냅샷 (읽기 전용 계정)
def collect(ctx: Context) -> StepResult:
    tables: list[str] = ctx.config["snapshot_tables"]
    counts: dict[str, int] = {}
    with _engine().connect() as conn:
        for t in tables:
            df = pd.read_sql(text(f"SELECT * FROM `{t}`"), conn)
            df.to_parquet(ctx.raw_dir / f"db_{t}.parquet", index=False)
            counts[t] = len(df)

    # 원본 CSV 시드: DB 에 없는 특징·주소·인증·수상·용량
    seed_path = ctx.config.get("seed_csv")
    if seed_path and os.path.exists(seed_path):
        seed = pd.read_csv(seed_path, encoding="utf-8-sig", dtype=str, keep_default_na=False)
        seed.columns = ctx.config["seed_columns"]
        seed["abv"] = pd.to_numeric(seed["abv"], errors="coerce")
        seed.to_parquet(ctx.raw_dir / "seed_sool_basic.parquet", index=False)
        counts["seed_csv"] = len(seed)
    else:
        ctx.warn(f"시드 CSV 없음: {seed_path}")

    ctx.metrics["snapshot"] = counts
    geo = _geocode_new(ctx)
    links = _check_links(ctx)
    blogs = _search_blogs(ctx)
    return StepResult(out=sum(counts.values()), extra={"tables": counts, "geocode": geo, "links": links, "blogs": blogs})


def _search_blogs(ctx: Context) -> dict:
    """제품별 블로그 검색(카카오). 검색어가 바뀌었거나 refresh_days 지난 것만 다시 호출. 원본 응답은 warehouse 에만"""
    cfg = ctx.config.get("blog_search", {})
    sool_src = ctx.raw_dir / "db_sool.parquet"
    if not cfg.get("enabled", True) or not sool_src.exists():
        return {"state": "skipped"}
    api_key = os.environ.get("KAKAO_REST_API_KEY")
    if not api_key:
        ctx.warn("KAKAO_REST_API_KEY 없음 → 블로그 검색 건너뜀")
        return {"state": "skipped"}

    sool = pd.read_parquet(sool_src, columns=["id", "name", "producer"])
    queries = {int(r.id): build_query(r.name, r.producer) for r in sool.itertuples() if (r.name or "").strip()}
    with duckdb.connect(str(ctx.warehouse)) as con:
        con.execute("""CREATE TABLE IF NOT EXISTS blog_cache (
            sool_id INTEGER PRIMARY KEY, query VARCHAR, docs VARCHAR, fetched_at TIMESTAMP)""")
        fresh = {(r[0], r[1]) for r in con.execute(
            f"SELECT sool_id, query FROM blog_cache WHERE fetched_at > now() - INTERVAL {int(cfg.get('refresh_days', 7))} DAY"
        ).fetchall()}
        todo = [(sid, q) for sid, q in queries.items() if (sid, q) not in fresh][: int(cfg.get("max_calls", 1500))]

        fetch = kakao_blog_fetcher(api_key, size=int(cfg.get("fetch_size", 15)))
        done, error = 0, None
        for sid, q in todo:
            try:
                docs = fetch(q)
            except Exception as ex:          # 키 권한·한도 초과 등: 기록하고 이번 실행은 중단
                error = f"{type(ex).__name__}: {ex}"
                ctx.warn(f"블로그 검색 중단: {error}")
                break
            con.execute("INSERT OR REPLACE INTO blog_cache VALUES (?,?,?, now())",
                        [sid, q, json.dumps(docs, ensure_ascii=False)])
            done += 1
        cached = con.execute("SELECT COUNT(*) FROM blog_cache").fetchone()[0]
    ctx.metrics["blog_search"] = {"targets": len(queries), "new_calls": done, "cached": int(cached)}
    return {"state": "error" if error else "ok", "new_calls": done, "cached": int(cached)}


def _check_links(ctx: Context) -> dict:
    """시드 홈페이지 링크 생존 검사. 새 링크 + recheck_days 지난 링크만 (병렬)"""
    from concurrent.futures import ThreadPoolExecutor

    cfg = ctx.config.get("link_check", {})
    seed_src = ctx.raw_dir / "seed_sool_basic.parquet"
    if not cfg.get("enabled", True) or not seed_src.exists():
        return {"state": "skipped"}
    urls = sorted({u for u in map(normalize_url, pd.read_parquet(seed_src)["homepage"]) if u})

    with duckdb.connect(str(ctx.warehouse)) as con:
        con.execute("""CREATE TABLE IF NOT EXISTS link_cache (
            url VARCHAR PRIMARY KEY, state VARCHAR, http_code INTEGER, final_url VARCHAR, checked_at TIMESTAMP)""")
        fresh = {r[0] for r in con.execute(
            f"SELECT url FROM link_cache WHERE checked_at > now() - INTERVAL {int(cfg.get('recheck_days', 7))} DAY").fetchall()}
        todo = [u for u in urls if u not in fresh][: int(cfg.get("max_checks", 2000))]
        with ThreadPoolExecutor(max_workers=int(cfg.get("workers", 8))) as pool:
            results = list(pool.map(lambda u: (u, check_link(u, timeout=float(cfg.get("timeout", 8)))), todo))
        for u, r in results:
            con.execute("INSERT OR REPLACE INTO link_cache VALUES (?,?,?,?, now())",
                        [u, r["state"], r.get("http_code"), r.get("final_url")])
        by_state = dict(con.execute("SELECT state, COUNT(*) FROM link_cache GROUP BY 1").fetchall())
    ctx.metrics["links"] = {"urls": len(urls), "checked": len(todo), "by_state": by_state}
    return {"state": "ok", "checked": len(todo), "by_state": by_state}


def _geo_key(address, producer) -> str:
    """캐시 키: 정리한 주소. 주소가 없으면 양조장 이름"""
    a = clean_address(address)
    return a if a else f"producer:{(producer or '').strip()}"


def _geocode_new(ctx: Context) -> dict:
    """시드의 (주소, 양조장) 중 geo_cache 에 없는 것만 카카오 API 로 좌표 변환"""
    cfg = ctx.config.get("geocode", {})
    seed_src = ctx.raw_dir / "seed_sool_basic.parquet"
    if not cfg.get("enabled", True) or not seed_src.exists():
        return {"state": "skipped"}
    api_key = os.environ.get("KAKAO_REST_API_KEY")
    if not api_key:
        ctx.warn("KAKAO_REST_API_KEY 없음 → 좌표 변환 건너뜀")
        return {"state": "skipped"}

    seed = pd.read_parquet(seed_src)
    targets = {}
    for a, p in zip(seed["address"], seed["producer"]):
        if (a or "").strip() or (p or "").strip():
            targets.setdefault(_geo_key(a, p), (a, p))

    with duckdb.connect(str(ctx.warehouse)) as con:
        con.execute("""CREATE TABLE IF NOT EXISTS geo_cache (
            key VARCHAR PRIMARY KEY, address VARCHAR, producer VARCHAR, lat DOUBLE, lng DOUBLE,
            sido VARCHAR, sigungu VARCHAR, matched VARCHAR, method VARCHAR, fetched_at TIMESTAMP)""")
        # retry_failed: 지난번에 못 찾은 주소(method='none')를 다시 시도
        where = "WHERE method <> 'none'" if cfg.get("retry_failed") else ""
        cached = {r[0] for r in con.execute(f"SELECT key FROM geo_cache {where}").fetchall()}
        todo = [k for k in targets if k not in cached][: int(cfg.get("max_calls", 2000))]

        fetch = kakao_fetcher(api_key)
        done, errors = 0, 0
        for k in todo:
            addr, prod = targets[k]
            try:
                g = geocode(addr if not k.startswith("producer:") else "", prod, fetch)
            except Exception as ex:          # 키 오류·한도 초과 등: 기록하고 이번 실행은 중단
                errors += 1
                ctx.warn(f"좌표 변환 중단: {type(ex).__name__}: {ex}")
                break
            con.execute("INSERT OR REPLACE INTO geo_cache VALUES (?,?,?,?,?,?,?,?,?, now())",
                        [k, addr, prod, g["lat"], g["lng"], g["sido"], g["sigungu"], g["matched"], g["method"]])
            done += 1
        by_method = dict(con.execute("SELECT method, COUNT(*) FROM geo_cache GROUP BY 1").fetchall())
    ctx.metrics["geocode"] = {"targets": len(targets), "new_calls": done, "cache": by_method}
    return {"state": "error" if errors else "ok", "new_calls": done, "cache": by_method}


def match_seed(sool: pd.DataFrame, seed: pd.DataFrame) -> pd.DataFrame:
    """DB 제품 ↔ 시드 행 연결. 엄격한 키부터 순서대로, 시드 쪽 키가 유일할 때만 연결.
    반환: sool_id, seed_idx, match_key"""
    keys = [
        ("name+producer+abv", ["name_norm", "producer_norm", "abv"]),
        ("name+abv", ["name_norm", "abv"]),
        ("name+producer", ["name_norm", "producer_norm"]),
        ("name", ["name_norm"]),
    ]
    seed = seed.reset_index(names="seed_idx")
    remaining = sool[["id", "name_norm", "producer_norm", "abv"]]
    found = []
    for label, cols in keys:
        uniq = seed.drop_duplicates(cols, keep=False)          # 시드에서 키가 겹치면 모호 → 건너뜀
        m = remaining.merge(uniq[cols + ["seed_idx"]], on=cols, how="inner")
        m = m[m["name_norm"] != ""]
        found.append(m.assign(match_key=label)[["id", "seed_idx", "match_key"]])
        remaining = remaining[~remaining["id"].isin(m["id"])]
    return pd.concat(found, ignore_index=True).rename(columns={"id": "sool_id"})


# ② clean — 정규화 + 품질 검사 → warehouse.staged_sool
def clean(ctx: Context) -> StepResult:
    src = ctx.raw_dir / "db_sool.parquet"
    if not src.exists():
        raise FileNotFoundError(f"{src} 없음 — collect 를 먼저 실행하세요")
    df = pd.read_parquet(src)

    df["name_norm"] = df["name"].map(normalize_name)
    df["producer_norm"] = df["producer"].map(normalize_producer)
    for col in ["category", "region", "producer", "ingredients", "description"]:
        df[f"{col}_missing"] = df[col].map(is_missing)
    df["run_date"] = ctx.run_date

    abv_min, abv_max = ctx.config["quality"]["abv_range"]
    # 도수가 다르면 변형 제품(예: 안동소주 22도/45도)이라 중복으로 보지 않음
    dup = df.duplicated(["name_norm", "producer_norm", "abv"], keep=False) & (df["name_norm"] != "")
    quality = {
        "rows": int(len(df)),
        "abv_out_of_range": int((~df["abv"].between(abv_min, abv_max)).sum()),
        "dup_suspect": int(dup.sum()),
        "missing_category": int(df["category_missing"].sum()),
        "missing_region": int(df["region_missing"].sum()),
        "missing_producer": int(df["producer_missing"].sum()),
        "missing_ingredients": int(df["ingredients_missing"].sum()),
        "missing_description": int(df["description_missing"].sum()),
    }
    df["is_dup"] = dup

    with duckdb.connect(str(ctx.warehouse)) as con:
        con.register("df", df)
        con.execute("CREATE OR REPLACE TABLE staged_sool AS SELECT * FROM df")

        seed_src = ctx.raw_dir / "seed_sool_basic.parquet"
        if seed_src.exists():
            seed = pd.read_parquet(seed_src)
            seed["name_norm"] = seed["name"].map(normalize_name)
            seed["producer_norm"] = seed["producer"].map(normalize_producer)
            links = match_seed(df, seed)
            seed = seed.reset_index(names="seed_idx")
            con.register("seed", seed)
            con.register("links", links)
            con.execute("CREATE OR REPLACE TABLE staged_seed AS SELECT * FROM seed")
            con.execute("CREATE OR REPLACE TABLE staged_seed_link AS SELECT * FROM links")
            quality["seed_matched"] = int(links["sool_id"].nunique())
            quality["seed_match_by_key"] = links["match_key"].value_counts().to_dict()
            quality["seed_unmatched_sool"] = int(len(df) - links["sool_id"].nunique())

    ctx.quality.update(quality)
    if quality["abv_out_of_range"]:
        ctx.warn(f"도수 범위 밖 {quality['abv_out_of_range']}건")
    return StepResult(out=len(df), extra={"quality": quality})


# ③ analyze — 규칙 기반 카테고리 제안 → warehouse.mart_category_suggestion + 검토용 CSV
def analyze(ctx: Context) -> StepResult:
    with duckdb.connect(str(ctx.warehouse)) as con:
        df = con.execute(
            "SELECT id, name, producer, abv, ingredients, category, category_missing FROM staged_sool"
        ).df()

        rows = []
        for r in df.itertuples(index=False):
            s = suggest(r.name, r.ingredients, None if pd.isna(r.abv) else float(r.abv))
            rows.append({
                "sool_id": r.id, "name": r.name, "producer": r.producer, "abv": r.abv,
                "current": None if r.category_missing else standardize(r.category),
                "suggested": s.category, "confidence": s.confidence, "rule": s.rule, "reason": s.reason,
                "method": "rule", "run_date": ctx.run_date,
            })
        sug = pd.DataFrame(rows)
        con.register("sug", sug)
        con.execute("CREATE OR REPLACE TABLE mart_category_suggestion AS SELECT * FROM sug")

        by_rule = con.execute(
            "SELECT rule, suggested, COUNT(*) n, ROUND(AVG(confidence), 2) conf "
            "FROM sug GROUP BY 1, 2 ORDER BY n DESC"
        ).df()

    missing = sug[sug["current"].isna()]
    resolved = int(missing["suggested"].notna().sum())
    unresolved = int(len(missing) - resolved)
    dist = missing["suggested"].fillna("미분류").value_counts().to_dict()

    out_csv = ctx.output_dir / f"category_suggestions-{ctx.run_date}.csv"
    sug.sort_values(["suggested", "confidence"], na_position="first").to_csv(out_csv, index=False, encoding="utf-8-sig")
    by_rule.to_csv(ctx.output_dir / f"category_rules-{ctx.run_date}.csv", index=False, encoding="utf-8-sig")

    profiles = _build_profiles(ctx)
    places = _build_places(ctx)
    purchases = _build_purchases(ctx)
    blogs = _build_blogs(ctx)
    _add_completeness(ctx)
    market = _build_market(ctx)

    ctx.metrics.update({
        "profiles": profiles,
        "places": places,
        "purchases": purchases,
        "blog_reviews": blogs,
        "market_metrics": market,
        "card_full_pct": ctx.metrics["card_completeness"]["full_pct"],
        "total_items": int(len(sug)),
        "category_missing": int(len(missing)),
        "category_rule_resolved": resolved,
        "category_unresolved": unresolved,
    })
    return StepResult(
        out=resolved,
        message=f"미분류 {len(missing)} 중 규칙으로 {resolved} 제안, 남은 {unresolved}",
        extra={"distribution": dist, "csv": out_csv.name},
    )


def _build_profiles(ctx: Context) -> int:
    """술 카드: DB 제품 + 연결된 시드 행 → mart_sool_profile (제품당 1행)"""
    with duckdb.connect(str(ctx.warehouse)) as con:
        tables = {r[0] for r in con.execute("SHOW TABLES").fetchall()}
        if "staged_seed_link" not in tables:
            ctx.warn("시드 연결 없음 → 술 카드는 DB 컬럼만으로 생성")
            seed_join = "NULL::VARCHAR AS volume, NULL AS special_notes, NULL AS features, NULL AS address, NULL AS homepage, NULL AS awards, NULL AS match_key"
            join = ""
        else:
            seed_join = "e.volume, e.special_notes, e.features, e.address, e.homepage, e.awards, l.match_key"
            join = "LEFT JOIN staged_seed_link l ON l.sool_id = s.id LEFT JOIN staged_seed e ON e.seed_idx = l.seed_idx"
        base = con.execute(f"""
            SELECT s.id AS sool_id, s.name, s.producer, s.region, s.abv, s.ingredients, s.description,
                   COALESCE(m.current, m.suggested) AS category,
                   CASE WHEN m.current IS NOT NULL THEN 'current' WHEN m.suggested IS NOT NULL THEN 'rule' END AS category_source,
                   CASE WHEN m.current IS NOT NULL THEN 1.0 ELSE m.confidence END AS category_confidence,
                   m.rule AS category_rule,
                   {seed_join}
            FROM staged_sool s
            LEFT JOIN mart_category_suggestion m ON m.sool_id = s.id
            {join}
        """).df()

        recs = base.to_dict("records")
        cards = pd.DataFrame([build_profile(r) for r in recs])
        tastes = pd.DataFrame([taste_profile(r.get("features"), r.get("description")) for r in recs])
        cards = pd.concat([cards, tastes], axis=1)
        out = pd.concat([base, cards], axis=1)
        out["has_features_text"] = out["features"].fillna("").str.strip() != ""
        out["run_date"] = ctx.run_date
        con.register("out", out)
        con.execute("CREATE OR REPLACE TABLE mart_sool_profile AS SELECT * FROM out")

    summary = {
        "with_seed": int(out["match_key"].notna().sum()),
        "with_features_text": int(out["has_features_text"].sum()),
        "with_address": int(out["address"].fillna("").str.strip().ne("").sum()),
        "visit_brewery": int(out["visit_brewery"].sum()),
        "food_master": int(out["food_master"].sum()),
        "awarded": int((out["award_count"] > 0).sum()),
        "sweetener": int(out["has_sweetener"].sum()),
        "raw": int(out["is_raw"].sum()),
        "sparkling": int(out["is_sparkling"].sum()),
        "with_taste": int((out["taste_axes_mentioned"] > 0).sum()),
        "with_pairing": int(out["pairings"].map(len).gt(0).sum()),
    }
    ctx.metrics["profile_summary"] = summary
    out.drop(columns=["description", "features"]).to_csv(
        ctx.output_dir / f"sool_profile-{ctx.run_date}.csv", index=False, encoding="utf-8-sig")
    ctx.metrics["taste_validation"] = _validate_taste(ctx, out)
    return int(len(out))


# 텍스트 맛 점수 ↔ 사람이 매긴 sense 점수 비교. 축이 같은 것만.
_SENSE_AXES = ["sweetness", "acidity", "body", "carbonation", "aroma", "smoothness"]


def _validate_taste(ctx: Context, profile: pd.DataFrame) -> dict:
    src = ctx.raw_dir / "db_sense.parquet"
    if not src.exists():
        return {}
    sense = pd.read_parquet(src).groupby("sool_id")[_SENSE_AXES].mean()
    joined = profile.set_index("sool_id").join(sense, how="inner", rsuffix="_sense")
    rows, result = [], {"products_with_sense": int(len(sense)), "overlap": int(len(joined))}
    for axis in _SENSE_AXES:
        t, h = joined[f"taste_{axis}"], joined[axis]
        hi, lo = h[t == 1].dropna(), h[t == -1].dropna()
        rows.append({"axis": axis, "n_text_high": len(hi), "sense_mean_text_high": round(hi.mean(), 2) if len(hi) else None,
                     "n_text_low": len(lo), "sense_mean_text_low": round(lo.mean(), 2) if len(lo) else None,
                     "n_no_mention": int(t.isna().sum())})
    pd.DataFrame(rows).to_csv(ctx.output_dir / f"taste_validation-{ctx.run_date}.csv", index=False, encoding="utf-8-sig")
    result["axes"] = rows
    return result


# ④ publish — 술 카드를 서비스 DB 의 analytics_sool_profile 로 (통째로 교체, 한 트랜잭션)
_PROFILE_COLS = [
    "sool_id", "run_date", "category", "category_source", "category_confidence", "category_rule",
    "main_ingredient", "special_ingredients", "has_sweetener", "has_preservative", "has_spirit_added",
    "is_raw", "is_pasteurized", "is_sparkling", "aged_years", "volume_ml", "volumes_ml",
    "visit_brewery", "food_master", "intangible_heritage", "award_count", "best_award", "award_years",
    "taste", "pairings", "address", "homepage", "features", "seed_match_key", "card_score", "card_missing",
]
_JSON_COLS = {"special_ingredients", "volumes_ml", "award_years", "taste", "pairings"}


def _clean_value(v):
    """DuckDB/pandas 값 → DB 드라이버가 받는 파이썬 값"""
    if v is None:
        return None
    if hasattr(v, "tolist"):          # numpy 배열·스칼라
        v = v.tolist()
    if isinstance(v, float) and math.isnan(v):
        return None
    return v


def publish(ctx: Context) -> StepResult:
    with duckdb.connect(str(ctx.warehouse), read_only=True) as con:
        df = con.execute("SELECT * FROM mart_sool_profile").df()
    taste_cols = [c for c in df.columns if c.startswith("taste_") and c != "taste_axes_mentioned"]

    rows = []
    for r in df.to_dict("records"):
        r = {k: _clean_value(v) for k, v in r.items()}
        r["taste"] = {c.removeprefix("taste_"): (None if r[c] is None else int(r[c])) for c in taste_cols}
        r["seed_match_key"] = r.get("match_key")
        row = {c: r.get(c) for c in _PROFILE_COLS}
        for c in _JSON_COLS:
            row[c] = json.dumps(row[c] if row[c] is not None else [], ensure_ascii=False)
        for c in ("aged_years", "volume_ml", "award_count", "card_score"):
            row[c] = None if row[c] is None else int(row[c])
        rows.append(row)

    cols = ", ".join(_PROFILE_COLS)
    params = ", ".join(f":{c}" for c in _PROFILE_COLS)
    place_rows = _place_rows(ctx)
    pcols = ", ".join(_PLACE_COLS)
    pparams = ", ".join(f":{c}" for c in _PLACE_COLS)
    with _engine().begin() as conn:      # 실패하면 DELETE 도 롤백 → 화면이 빈 채로 남지 않음
        conn.execute(text("DELETE FROM analytics_sool_profile"))
        conn.execute(text(f"INSERT INTO analytics_sool_profile ({cols}) VALUES ({params})"), rows)
        if place_rows:
            conn.execute(text("DELETE FROM analytics_place"))
            conn.execute(text(f"INSERT INTO analytics_place ({pcols}) VALUES ({pparams})"), place_rows)
        purchase_rows = _mart_rows(ctx, "mart_purchase", _PURCHASE_COLS)
        if purchase_rows:
            conn.execute(text("DELETE FROM analytics_purchase"))
            conn.execute(text(f"INSERT INTO analytics_purchase ({', '.join(_PURCHASE_COLS)}) "
                              f"VALUES ({', '.join(':' + c for c in _PURCHASE_COLS)})"), purchase_rows)
        blog_rows = _mart_rows(ctx, "mart_blog", _BLOG_COLS)
        if blog_rows:
            conn.execute(text("DELETE FROM analytics_blog"))
            conn.execute(text(f"INSERT INTO analytics_blog ({', '.join(f'`{c}`' for c in _BLOG_COLS)}) "
                              f"VALUES ({', '.join(':' + c for c in _BLOG_COLS)})"), blog_rows)
        market_rows = _mart_rows(ctx, "mart_market", ["key", "run_date", "payload"])
        if market_rows:
            conn.execute(text("DELETE FROM analytics_market"))
            conn.execute(text("INSERT INTO analytics_market (`key`, run_date, payload) VALUES (:key, :run_date, :payload)"),
                         market_rows)
    return StepResult(out=len(rows) + len(place_rows) + len(purchase_rows) + len(blog_rows) + len(market_rows),
                      message=f"술 카드 {len(rows)}, 장소 {len(place_rows)}, 구매 경로 {len(purchase_rows)}, "
                              f"블로그 후기 {len(blog_rows)}, 시장 지표 {len(market_rows)}행 교체")


_BLOG_COLS = ["sool_id", "seq", "title", "url", "blogname", "posted_at", "match", "run_date"]


_PURCHASE_COLS = ["sool_id", "run_date", "url", "channel", "online_buy", "link_state", "http_code",
                  "final_url", "checked_at"]


def _mart_rows(ctx: Context, table: str, cols: list[str]) -> list[dict]:
    with duckdb.connect(str(ctx.warehouse), read_only=True) as con:
        if table not in {r[0] for r in con.execute("SHOW TABLES").fetchall()}:
            return []
        df = con.execute(f"SELECT * FROM {table}").df()
    return [{c: _clean_value(r.get(c)) for c in cols} for r in df.to_dict("records")]


_PLACE_COLS = ["place_id", "run_date", "name", "aliases", "address", "homepage", "lat", "lng", "sido", "sigungu",
               "geo_method", "product_count", "categories", "products", "visit_brewery", "food_master",
               "intangible_heritage", "awarded_products"]


def _place_rows(ctx: Context) -> list[dict]:
    return _mart_rows(ctx, "mart_place", _PLACE_COLS)


def record_run(status: dict) -> None:
    """finish hook: 실행 기록을 pipeline_run 에 남김 (웹 관리자 화면이 읽음)"""
    with _engine().begin() as conn:
        conn.execute(
            text("INSERT INTO pipeline_run (job, run_id, ok, duration_sec, status) VALUES (:job, :run_id, :ok, :d, :s)"),
            {"job": status["job"], "run_id": status["run_id"], "ok": status["ok"],
             "d": status["duration_sec"], "s": json.dumps(status, ensure_ascii=False, default=str)},
        )


# 양조장(장소) 단위 집계 → mart_place
#   같은 장소 판단: 좌표가 같거나(소수 4자리 ≈ 10m), 정규화한 양조장 이름이 같고 1km 이내.
#   좌표가 없으면 양조장 이름으로만 묶는다. (주소 표기 차이: 도로명/지번, 전남/전라남도 등을 흡수)
def _haversine_km(a, b) -> float:
    import math
    la1, lo1, la2, lo2 = map(math.radians, (a[0], a[1], b[0], b[1]))
    h = math.sin((la2 - la1) / 2) ** 2 + math.cos(la1) * math.cos(la2) * math.sin((lo2 - lo1) / 2) ** 2
    return 6371 * 2 * math.asin(math.sqrt(h))


def cluster_places(rows: list[dict], same_name_km: float = 1.0) -> list[int]:
    """rows: [{producer_norm, lat, lng}] → 행마다 장소 번호 (union-find)"""
    parent = list(range(len(rows)))

    def find(i):
        while parent[i] != i:
            parent[i] = parent[parent[i]]
            i = parent[i]
        return i

    def union(i, j):
        parent[find(i)] = find(j)

    by_coord, by_name = {}, {}
    for i, r in enumerate(rows):
        has_loc = r["lat"] is not None and not pd.isna(r["lat"])
        if has_loc:
            key = (round(r["lat"], 4), round(r["lng"], 4))
            if key in by_coord:
                union(i, by_coord[key])
            by_coord.setdefault(key, i)
        if r["producer_norm"]:
            by_name.setdefault(r["producer_norm"], []).append(i)
    for idxs in by_name.values():
        for a in range(len(idxs)):
            for b in range(a + 1, len(idxs)):
                ra, rb = rows[idxs[a]], rows[idxs[b]]
                la, lb = ra["lat"] is not None and not pd.isna(ra["lat"]), rb["lat"] is not None and not pd.isna(rb["lat"])
                if (la and lb and _haversine_km((ra["lat"], ra["lng"]), (rb["lat"], rb["lng"])) <= same_name_km) or not (la and lb):
                    union(idxs[a], idxs[b])
    return [find(i) for i in range(len(rows))]


def _build_places(ctx: Context) -> int:
    with duckdb.connect(str(ctx.warehouse)) as con:
        tables = {r[0] for r in con.execute("SHOW TABLES").fetchall()}
        prof = con.execute("""
            SELECT sool_id, name, producer, abv, category, address, homepage, visit_brewery, food_master,
                   intangible_heritage, award_count
            FROM mart_sool_profile""").df()
        geo = (con.execute("SELECT key, lat, lng, sido, sigungu, method FROM geo_cache").df()
               if "geo_cache" in tables else pd.DataFrame(columns=["key", "lat", "lng", "sido", "sigungu", "method"]))

    prof = prof[(prof["address"].fillna("").str.strip() != "") | (prof["producer"].fillna("").str.strip() != "")].copy()
    prof["geo_key"] = [_geo_key(a, p) for a, p in zip(prof["address"], prof["producer"])]
    prof["producer_norm"] = prof["producer"].map(normalize_producer)
    prof = prof.merge(geo.rename(columns={"key": "geo_key", "method": "geo_method"}), on="geo_key", how="left")
    prof["geo_method"] = prof["geo_method"].fillna("pending")
    prof = prof.reset_index(drop=True)
    prof["cluster"] = cluster_places(prof[["producer_norm", "lat", "lng"]].to_dict("records"))

    rows = []
    for _, g in prof.groupby("cluster"):
        located = g[g["lat"].notna()]
        best = located[located["geo_method"] == "address"]
        loc = (best if len(best) else located).iloc[0] if len(located) else None
        producers = Counter(p for p in g["producer"] if p)
        rows.append({
            # 장소 id: 대표 좌표(없으면 양조장 이름) 기준이라 실행마다 같은 값
            "place_id": hashlib.md5(
                (f"{round(loc['lat'], 4)},{round(loc['lng'], 4)}" if loc is not None else g["producer_norm"].iloc[0]).encode()
            ).hexdigest()[:12],
            "name": producers.most_common(1)[0][0] if producers else None,
            "aliases": json.dumps(sorted(producers), ensure_ascii=False),
            "address": (loc["address"] if loc is not None and loc["address"] else next((a for a in g["address"] if a), None)),
            "homepage": next((h for h in g["homepage"] if h), None),
            "lat": None if loc is None else float(loc["lat"]), "lng": None if loc is None else float(loc["lng"]),
            # 캐시에 긴 표기가 남아 있어도 짧은 표기로 통일
            "sido": None if loc is None else short_sido(loc["sido"]),
            "sigungu": None if loc is None else loc["sigungu"],
            "geo_method": "pending" if loc is None and (g["geo_method"] == "pending").all() else (
                "none" if loc is None else loc["geo_method"]),
            "product_count": int(len(g)),
            # dict/list 는 DuckDB 구조 타입 충돌을 피하려고 JSON 문자열로 저장
            "categories": json.dumps(dict(Counter(c for c in g["category"] if c)), ensure_ascii=False),
            "products": json.dumps([{"sool_id": int(r.sool_id), "name": r.name, "category": r.category,
                                     "abv": None if pd.isna(r.abv) else float(r.abv)} for r in g.itertuples()],
                                   ensure_ascii=False),
            "visit_brewery": bool(g["visit_brewery"].any()),
            "food_master": bool(g["food_master"].any()),
            "intangible_heritage": bool(g["intangible_heritage"].any()),
            "awarded_products": int((g["award_count"] > 0).sum()),
            "run_date": ctx.run_date,
        })
    places = pd.DataFrame(rows)
    # place_id 충돌(같은 좌표가 다른 클러스터로 남은 경우)은 번호를 붙여 구분
    places["place_id"] = places["place_id"] + places.groupby("place_id").cumcount().map(lambda n: "" if n == 0 else f"-{n}")
    with duckdb.connect(str(ctx.warehouse)) as con:
        con.register("places", places)
        con.execute("CREATE OR REPLACE TABLE mart_place AS SELECT * FROM places")

    ctx.metrics["place_summary"] = {
        "places": int(len(places)), "located": int(places["lat"].notna().sum()),
        "by_method": places["geo_method"].value_counts().to_dict(),
        "visit_brewery": int(places["visit_brewery"].sum()),
        "merged_rows": int(len(prof)),
    }
    return int(len(places))


# 구매 경로: 제품 홈페이지 → 채널 분류 + 링크 상태 → mart_purchase (제품당 1행, 링크 있는 제품만)
def _build_purchases(ctx: Context) -> int:
    with duckdb.connect(str(ctx.warehouse)) as con:
        tables = {r[0] for r in con.execute("SHOW TABLES").fetchall()}
        prof = con.execute("SELECT sool_id, homepage FROM mart_sool_profile").df()
        cache = (con.execute("SELECT url, state, http_code, final_url, checked_at FROM link_cache").df()
                 if "link_cache" in tables else pd.DataFrame(columns=["url", "state", "http_code", "final_url", "checked_at"]))
        prof["url"] = prof["homepage"].map(normalize_url)
        prof = prof[prof["url"].notna()].copy()
        cls = prof["url"].map(classify_link)
        prof["channel"] = cls.map(lambda c: c[0])
        prof["online_buy"] = cls.map(lambda c: c[1])
        prof = prof.merge(cache.rename(columns={"state": "link_state"}), on="url", how="left")
        prof["link_state"] = [interpret_link(c, st if isinstance(st, str) else None, f if isinstance(f, str) else None)
                              for c, st, f in zip(prof["channel"], prof["link_state"], prof["final_url"])]
        prof["http_code"] = prof["http_code"].astype("Int64")
        prof["run_date"] = ctx.run_date
        out = prof[["sool_id", "run_date", "url", "channel", "online_buy", "link_state", "http_code", "final_url", "checked_at"]]
        con.register("out", out)
        con.execute("CREATE OR REPLACE TABLE mart_purchase AS SELECT * FROM out")

    ctx.metrics["purchase_summary"] = {
        "with_link": int(len(out)),
        "by_channel": out["channel"].value_counts().to_dict(),
        "by_state": out["link_state"].value_counts().to_dict(),
        "online_buy_reachable": int((out["online_buy"] & out["link_state"].isin(["alive", "login", "blocked"])).sum()),
    }
    return int(len(out))


# 블로그 후기: blog_cache 원본 → 술 이름이 나오는 글만 제품당 최대 5개 → mart_blog (제목·블로그명·날짜·링크만)
def _build_blogs(ctx: Context) -> int:
    limit = int(ctx.config.get("blog_search", {}).get("per_product", 5))
    with duckdb.connect(str(ctx.warehouse)) as con:
        tables = {r[0] for r in con.execute("SHOW TABLES").fetchall()}
        if "blog_cache" not in tables:
            return 0
        rows_in = con.execute("""
            SELECT p.sool_id, p.name, p.producer, b.docs
            FROM mart_sool_profile p JOIN blog_cache b ON b.sool_id = p.sool_id""").fetchall()

    rows, by_match = [], Counter()
    for sid, name, producer, docs in rows_in:
        for seq, d in enumerate(pick_blogs(json.loads(docs or "[]"), name, producer, limit), start=1):
            rows.append({"sool_id": int(sid), "seq": seq, **d, "run_date": ctx.run_date})
            by_match[d["match"]] += 1
    blogs = pd.DataFrame(rows, columns=["sool_id", "seq", "title", "url", "blogname", "posted_at", "match", "run_date"])
    with duckdb.connect(str(ctx.warehouse)) as con:
        con.register("blogs", blogs)
        con.execute("CREATE OR REPLACE TABLE mart_blog AS SELECT * FROM blogs")
    with_any = int(blogs["sool_id"].nunique())
    ctx.metrics["blog_summary"] = {
        "searched": len(rows_in), "with_reviews": with_any, "links": int(len(blogs)),
        "by_match": dict(by_match), "none": len(rows_in) - with_any,
    }
    return int(len(blogs))


# 술 카드 충실도 (U1): 장소(좌표)·구매 경로까지 만든 뒤 mart_sool_profile 에 card_score·card_missing 추가
def _add_completeness(ctx: Context) -> None:
    with duckdb.connect(str(ctx.warehouse)) as con:
        prof = con.execute("SELECT * FROM mart_sool_profile").df()
        places = con.execute("SELECT lat, products FROM mart_place").df()
        links = con.execute("SELECT sool_id, link_state FROM mart_purchase").df()

    located = {int(p["sool_id"]) for lat, products in zip(places["lat"], places["products"])
               if pd.notna(lat) for p in json.loads(products)}
    link_state = dict(zip(links["sool_id"].astype(int), links["link_state"]))
    scores, missing = [], []
    for r in prof.itertuples(index=False):
        sid = int(r.sool_id)
        score, miss = card_completeness(
            category=r.category, main_ingredient=r.main_ingredient, taste_axes_mentioned=r.taste_axes_mentioned,
            pairings=r.pairings, description=r.description, located=sid in located, link_state=link_state.get(sid))
        scores.append(score)
        missing.append(miss)
    prof["card_score"] = scores
    prof["card_missing"] = [json.dumps(m) for m in missing]   # 구조 타입 충돌을 피하려고 JSON 문자열
    with duckdb.connect(str(ctx.warehouse)) as con:
        con.register("prof", prof)
        con.execute("CREATE OR REPLACE TABLE mart_sool_profile AS SELECT * FROM prof")

    summary = summarize(scores, missing)
    ctx.metrics["card_completeness"] = summary
    ctx.quality["card_full_pct"] = summary["full_pct"]


# 시장 구조 지표 (P6): 술 카드 + 시도 + 장소 + 구매 경로를 제품 단위로 합쳐 계산 → mart_market (key, payload JSON)
def _build_market(ctx: Context) -> int:
    with duckdb.connect(str(ctx.warehouse)) as con:
        tables = {r[0] for r in con.execute("SHOW TABLES").fetchall()}
        df = con.execute("SELECT * FROM mart_sool_profile").df()
        geo = con.execute("SELECT key, sido FROM geo_cache").df() if "geo_cache" in tables else pd.DataFrame(columns=["key", "sido"])
        places = con.execute("SELECT place_id, products FROM mart_place").df() if "mart_place" in tables else pd.DataFrame(columns=["place_id", "products"])
        purchase = (con.execute("SELECT sool_id, online_buy, link_state FROM mart_purchase").df()
                    if "mart_purchase" in tables else pd.DataFrame(columns=["sool_id", "online_buy", "link_state"]))

    # 시도: 좌표 변환 결과 우선, 없으면 DB 의 region
    df["geo_key"] = [_geo_key(a, p) for a, p in zip(df["address"], df["producer"])]
    df = df.merge(geo.rename(columns={"key": "geo_key", "sido": "geo_sido"}), on="geo_key", how="left")
    df["sido"] = [short_sido(g) if isinstance(g, str) and g else (
        short_sido(r) if isinstance(r, str) and not is_missing(r) else None) for g, r in zip(df["geo_sido"], df["region"])]
    # 장소: mart_place 의 제품 목록에서 sool_id → place_id
    place_of = {p["sool_id"]: pid for pid, prods in zip(places["place_id"], places["products"]) for p in json.loads(prods)}
    df["place_id"] = df["sool_id"].map(place_of)
    # 구매 경로
    df = df.merge(purchase, on="sool_id", how="left")
    df["online_reachable"] = df["online_buy"].fillna(False).astype(bool) & df["link_state"].isin(["alive", "login", "blocked"])
    df["special_ingredients"] = df["special_ingredients"].map(lambda v: list(v) if v is not None and len(v) else [])

    market = build_market(df, list(TASTE_AXES))
    rows = pd.DataFrame([{"key": k, "run_date": ctx.run_date, "payload": json.dumps(v, ensure_ascii=False, default=str)}
                         for k, v in market.items()])
    with duckdb.connect(str(ctx.warehouse)) as con:
        con.register("rows", rows)
        con.execute("CREATE OR REPLACE TABLE mart_market AS SELECT * FROM rows")
    (ctx.output_dir / f"market-{ctx.run_date}.json").write_text(
        json.dumps(market, ensure_ascii=False, indent=2, default=str), encoding="utf-8")

    bs, pa = market["brewery_structure"], market["purchase_access"]
    ctx.metrics["market_summary"] = {
        "top_specialized": [f'{x["sido"]} {x["category"]} LQ {x["lq"]}' for x in market["region_specialization"]["top_specialized"][:3]],
        "breweries": bs["breweries"], "top10_share": bs["top10_share"], "gini": bs["gini"],
        "online_reachable": pa["overall"], "abv_outliers": market["abv_profile"]["outlier_count"],
        "hidden_gems": len(market["hidden_gems"]),
    }
    return len(rows)
