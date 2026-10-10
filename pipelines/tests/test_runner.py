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
