"""실행: python -m sool_pipeline run [--only clean,analyze] [--from analyze] [--date 2026-10-10]"""
from __future__ import annotations

import argparse
import os
import sys
from datetime import date
from pathlib import Path

import yaml

from . import steps
from .runner import Job

HERE = Path(__file__).resolve().parent


def build_job(config_path: Path, data_dir: Path) -> Job:
    config = yaml.safe_load(config_path.read_text(encoding="utf-8"))
    job = Job("sool", data_dir, config)
    job.step("collect")(steps.collect)
    job.step("clean")(steps.clean)
    job.step("analyze")(steps.analyze)
    job.step("publish")(steps.publish)
    if config.get("record_runs", True):
        job.finish_hooks.append(steps.record_run)
    return job


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(prog="sool_pipeline")
    sub = p.add_subparsers(dest="cmd", required=True)
    r = sub.add_parser("run", help="단계 실행")
    r.add_argument("--only", help="쉼표로 구분한 단계만 실행")
    r.add_argument("--from", dest="start_from", help="이 단계부터 끝까지")
    r.add_argument("--date", type=date.fromisoformat, help="처리 기준일 (raw/<날짜> 재처리)")
    r.add_argument("--config", type=Path, default=HERE.parent / "config.yaml")
    r.add_argument("--data-dir", type=Path, default=Path(os.environ.get("PIPELINE_DATA_DIR", "/data")))
    args = p.parse_args(argv)

    job = build_job(args.config, args.data_dir)
    status = job.run(
        only=args.only.split(",") if args.only else None,
        start_from=args.start_from,
        run_date=args.date,
    )
    print(f"{'✅' if status['ok'] else '❌'} {status['message']} → {args.data_dir / 'status.json'}")
    return 0 if status["ok"] else 1


if __name__ == "__main__":
    sys.exit(main())
