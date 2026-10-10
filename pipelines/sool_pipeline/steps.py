"""sool-pipeline 단계. S1~S2 범위: collect → clean → analyze (publish·feedback 은 S4 이후)."""
from __future__ import annotations

import os

import duckdb
import pandas as pd
from sqlalchemy import create_engine, text

from .categorize import standardize, suggest
from .normalize import is_missing, normalize_name, normalize_producer
from .profile import build_profile
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
    return StepResult(out=sum(counts.values()), extra={"tables": counts})


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

    ctx.metrics.update({
        "profiles": profiles,
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
                   COALESCE(m.current, m.suggested) AS category, m.confidence AS category_confidence,
                   {seed_join}
            FROM staged_sool s
            LEFT JOIN mart_category_suggestion m ON m.sool_id = s.id
            {join}
        """).df()

        cards = pd.DataFrame([build_profile(r) for r in base.to_dict("records")])
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
    }
    ctx.metrics["profile_summary"] = summary
    out.drop(columns=["description", "features"]).to_csv(
        ctx.output_dir / f"sool_profile-{ctx.run_date}.csv", index=False, encoding="utf-8-sig")
    return int(len(out))
