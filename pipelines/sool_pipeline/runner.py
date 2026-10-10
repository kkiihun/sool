"""단계 실행기 — 나중에 badakaya-jobkit 으로 분리할 부분.

계약 (docs/decisions/2026-10-10-data-cycle-model.md):
  <data_dir>/status.json   최신 실행 상태 (허브가 읽음, v2)
  <data_dir>/runs.jsonl    실행 이력 한 줄씩
  <data_dir>/raw/<날짜>/   단계가 쓰는 원본
"""
from __future__ import annotations

import json
import os
import time
import traceback
from dataclasses import dataclass, field
from datetime import date, datetime
from pathlib import Path
from typing import Any, Callable

STEP_ORDER = ["collect", "clean", "analyze", "publish", "feedback"]


@dataclass
class StepResult:
    state: str = "ok"            # ok / warn / error / skipped
    out: int | None = None       # 이 단계가 만든 건수
    message: str = ""
    extra: dict[str, Any] = field(default_factory=dict)

    def to_dict(self, sec: float | None = None) -> dict[str, Any]:
        d: dict[str, Any] = {"state": self.state}
        if self.out is not None:
            d["out"] = self.out
        if sec is not None:
            d["sec"] = round(sec, 2)
        if self.message:
            d["message"] = self.message
        d.update(self.extra)
        return d


@dataclass
class Context:
    job: str
    data_dir: Path
    run_date: date
    run_id: str
    config: dict[str, Any]
    warnings: list[str] = field(default_factory=list)
    quality: dict[str, Any] = field(default_factory=dict)
    metrics: dict[str, Any] = field(default_factory=dict)   # 허브 카드 지표

    @property
    def raw_dir(self) -> Path:
        p = self.data_dir / "raw" / self.run_date.isoformat()
        p.mkdir(parents=True, exist_ok=True)
        return p

    @property
    def output_dir(self) -> Path:
        p = self.data_dir / "output"
        p.mkdir(parents=True, exist_ok=True)
        return p

    @property
    def warehouse(self) -> Path:
        return self.data_dir / "warehouse.duckdb"

    def warn(self, msg: str) -> None:
        print(f"⚠️  {msg}")
        self.warnings.append(msg)


StepFn = Callable[[Context], "StepResult | int | None"]


class Job:
    def __init__(self, name: str, data_dir: str | Path, config: dict[str, Any] | None = None):
        self.name = name
        self.data_dir = Path(data_dir)
        self.config = config or {}
        self.steps: dict[str, StepFn] = {}
        # 실행이 끝난 뒤 status 를 받아 처리할 함수들 (예: DB 에 실행 기록). 실패해도 실행 결과는 바뀌지 않음
        self.finish_hooks: list[Callable[[dict[str, Any]], None]] = []

    def step(self, name: str) -> Callable[[StepFn], StepFn]:
        if name not in STEP_ORDER:
            raise ValueError(f"알 수 없는 단계: {name} (가능: {STEP_ORDER})")

        def deco(fn: StepFn) -> StepFn:
            self.steps[name] = fn
            return fn
        return deco

    def run(self, only: list[str] | None = None, start_from: str | None = None,
            run_date: date | None = None) -> dict[str, Any]:
        self.data_dir.mkdir(parents=True, exist_ok=True)
        started = datetime.now().astimezone()
        ctx = Context(
            job=self.name, data_dir=self.data_dir, run_date=run_date or started.date(),
            run_id=started.isoformat(timespec="seconds"), config=self.config,
        )
        selected = self._select(only, start_from)

        steps: dict[str, dict[str, Any]] = {}
        failed = False
        for name in STEP_ORDER:
            if name not in self.steps:
                continue
            if name not in selected:
                steps[name] = {"state": "skipped"}
                continue
            if failed:
                steps[name] = {"state": "skipped", "message": "앞 단계 실패"}
                continue
            print(f"▶ {name}")
            t0 = time.monotonic()
            try:
                res = self.steps[name](ctx)
                if not isinstance(res, StepResult):
                    res = StepResult(out=res)
            except Exception as ex:  # 단계 실패는 기록하고 이후 단계는 건너뜀
                traceback.print_exc()
                res = StepResult(state="error", message=f"{type(ex).__name__}: {ex}")
            sec = time.monotonic() - t0
            steps[name] = res.to_dict(sec)
            print(f"  → {res.state} ({sec:.1f}s) {res.message}")
            if res.state == "error":
                failed = True

        finished = datetime.now().astimezone()
        status = {
            "ok": not failed,
            "job": self.name,
            "run_id": ctx.run_id,
            "run_date": ctx.run_date.isoformat(),
            "last_run": finished.isoformat(timespec="seconds"),
            "duration_sec": round((finished - started).total_seconds(), 2),
            "total_items": ctx.metrics.get("total_items"),
            "steps": steps,
            "quality": ctx.quality,
            "metrics": ctx.metrics,
            "warnings": ctx.warnings,
            "message": "실패한 단계가 있습니다" if failed else "정상 완료",
        }
        self._write_status(status)
        for hook in self.finish_hooks:
            try:
                hook(status)
            except Exception as ex:
                print(f"⚠️  finish hook 실패 ({getattr(hook, '__name__', hook)}): {ex}")
        return status

    def _select(self, only: list[str] | None, start_from: str | None) -> set[str]:
        names = [s for s in STEP_ORDER if s in self.steps]
        if only:
            unknown = set(only) - set(names)
            if unknown:
                raise ValueError(f"등록 안 된 단계: {sorted(unknown)}")
            return set(only)
        if start_from:
            if start_from not in names:
                raise ValueError(f"등록 안 된 단계: {start_from}")
            return set(names[names.index(start_from):])
        return set(names)

    def _write_status(self, status: dict[str, Any]) -> None:
        # 허브가 읽는 도중 반쯤 쓴 파일을 보지 않도록 임시 파일 → rename
        path = self.data_dir / "status.json"
        tmp = path.with_suffix(".json.tmp")
        tmp.write_text(json.dumps(status, ensure_ascii=False, indent=2), encoding="utf-8")
        os.replace(tmp, path)
        with (self.data_dir / "runs.jsonl").open("a", encoding="utf-8") as f:
            f.write(json.dumps(status, ensure_ascii=False) + "\n")
