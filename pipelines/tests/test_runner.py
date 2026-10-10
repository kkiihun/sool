import json

import pytest

from sool_pipeline.runner import Job, StepResult


def make_job(tmp_path, calls, fail_on=None):
    job = Job("t", tmp_path)

    def mk(name):
        def fn(ctx):
            calls.append(name)
            if name == fail_on:
                raise RuntimeError("boom")
            ctx.metrics["total_items"] = 3
            return StepResult(out=1)
        return fn

    for n in ["collect", "clean", "analyze"]:
        job.step(n)(mk(n))
    return job


def test_runs_all_and_writes_status(tmp_path):
    calls = []
    status = make_job(tmp_path, calls).run()
    assert calls == ["collect", "clean", "analyze"]
    assert status["ok"] is True and status["total_items"] == 3
    saved = json.loads((tmp_path / "status.json").read_text())
    assert saved["steps"]["clean"]["state"] == "ok"
    assert len((tmp_path / "runs.jsonl").read_text().splitlines()) == 1


def test_failure_skips_later_steps(tmp_path):
    calls = []
    status = make_job(tmp_path, calls, fail_on="clean").run()
    assert calls == ["collect", "clean"]
    assert status["ok"] is False
    assert status["steps"]["clean"]["state"] == "error"
    assert status["steps"]["analyze"]["state"] == "skipped"


def test_start_from_and_only(tmp_path):
    calls = []
    make_job(tmp_path, calls).run(start_from="clean")
    assert calls == ["clean", "analyze"]
    calls.clear()
    make_job(tmp_path, calls).run(only=["analyze"])
    assert calls == ["analyze"]


def test_unknown_step_rejected(tmp_path):
    with pytest.raises(ValueError):
        Job("t", tmp_path).step("deploy")
    with pytest.raises(ValueError):
        make_job(tmp_path, []).run(only=["publish"])


def test_finish_hook_receives_status_and_failure_is_isolated(tmp_path):
    got = []
    job = make_job(tmp_path, [])
    job.finish_hooks.append(lambda st: got.append(st["ok"]))
    job.finish_hooks.append(lambda st: 1 / 0)          # 훅 실패는 실행 결과에 영향 없음
    status = job.run()
    assert got == [True] and status["ok"] is True
