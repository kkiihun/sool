# aT(한국농수산식품유통공사) '전통주정보' (공공데이터포털 15048755, 더술닷컴 원천, 연 1회 갱신) 자동 수집.
# 데이터셋 페이지에서 내려받기 링크를 찾아 파일을 받고, 내용(sha256)이 바뀌었을 때만 새 판으로 저장 + 이전 판과 비교.
# 포털 화면 구조가 바뀌면 링크를 못 찾을 수 있다 → 그때는 경고만 남기고 마지막으로 받은 판을 계속 쓴다.
from __future__ import annotations

import csv
import hashlib
import io
import re
import urllib.request

import pandas as pd

from .normalize import normalize_name, normalize_producer

PAGE_URL = "https://www.data.go.kr/data/15048755/fileData.do"
DOWNLOAD_URL = "https://www.data.go.kr/cmm/cmm/fileDownload.do?atchFileId={atch}&fileDetailSn={sn}&insertDataPrcus=N"
UA = {"User-Agent": "Mozilla/5.0 (sool-pipeline; +https://github.com/kkiihun/sool)"}

# aT 머리글 → 파이프라인 시드 열 이름 (config.seed_columns 와 같은 이름)
COLUMNS = {
    "제품명": "name", "제품소개": "description", "알콜도수": "abv", "용량": "volume", "성분": "ingredients",
    "특이사항": "special_notes", "특징": "features", "판매여부": "available", "양조장": "producer",
    "양조장주소": "address", "홈페이지주소": "homepage", "수상경력": "awards",
}
# 비교할 때 '바뀜'으로 보는 열 (설명·특징 문구 수정도 포함)
COMPARE = ["abv", "volume", "ingredients", "available", "address", "homepage", "awards", "description", "features"]

_DOWNLOAD_RE = re.compile(r"fileDownload\.do\?atchFileId=(FILE_\d+)&(?:amp;)?fileDetailSn=(\d+)")
_FILENAME_RE = re.compile(r'filename\*?=(?:UTF-8\'\')?"?([^";]+)"?', re.I)


class SchemaError(ValueError):
    """머리글이 예상과 다름 (aT 가 열을 바꿈)"""


def find_download(page_html: str) -> tuple[str, str] | None:
    m = _DOWNLOAD_RE.search(page_html)
    return (m.group(1), m.group(2)) if m else None


def _get(url: str, timeout: float = 30) -> tuple[bytes, dict]:
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=timeout) as res:
        return res.read(), dict(res.headers)


def download_latest(page_url: str = PAGE_URL) -> dict:
    """반환: {content(bytes), sha256, atch_file_id, file_name}. 링크를 못 찾으면 LookupError"""
    page, _ = _get(page_url)
    found = find_download(page.decode("utf-8", errors="replace"))
    if not found:
        raise LookupError("데이터셋 페이지에서 내려받기 링크를 찾지 못함 (포털 화면 변경?)")
    atch, sn = found
    content, headers = _get(DOWNLOAD_URL.format(atch=atch, sn=sn))
    m = _FILENAME_RE.search(headers.get("Content-Disposition", ""))
    name = m.group(1) if m else None
    if name:
        try:                                   # 서버가 UTF-8 이름을 latin-1 헤더로 보냄
            name = name.encode("latin-1").decode("utf-8")
        except (UnicodeEncodeError, UnicodeDecodeError):
            pass
    return {"content": content, "sha256": hashlib.sha256(content).hexdigest(), "atch_file_id": atch, "file_name": name}


def read_csv(content: bytes) -> pd.DataFrame:
    """aT CSV → 시드 열 이름. 판매여부는 bool(Y/True → True)"""
    for enc in ("utf-8-sig", "cp949"):
        try:
            text = content.decode(enc)
            break
        except UnicodeDecodeError:
            continue
    else:
        raise SchemaError("인코딩을 알 수 없음")
    df = pd.read_csv(io.StringIO(text), dtype=str, keep_default_na=False, quoting=csv.QUOTE_MINIMAL)
    missing = [k for k in COLUMNS if k not in df.columns]
    if missing:
        raise SchemaError(f"aT 파일에 없는 열: {missing} (있는 열: {list(df.columns)})")
    df = df[list(COLUMNS)].rename(columns=COLUMNS)
    df["abv"] = pd.to_numeric(df["abv"], errors="coerce")
    df["available"] = df["available"].str.strip().str.upper().isin(["Y", "TRUE"])
    return df


def product_key(name, producer, abv) -> str:
    """판 사이 같은 제품을 찾는 키: 정규화 이름 + 양조장 + 도수 (도수 다른 변형은 다른 제품)"""
    a = "" if abv is None or pd.isna(abv) else f"{float(abv):g}"
    return f"{normalize_name(name)}|{normalize_producer(producer)}|{a}"


def _keyed(df: pd.DataFrame) -> dict[str, dict]:
    out: dict[str, dict] = {}
    for r in df.to_dict("records"):
        k = product_key(r["name"], r["producer"], r["abv"])
        if k.startswith("|"):
            continue
        # 같은 키가 여러 행이면 뒤에 #2, #3 을 붙여 개수 변화도 잡음
        n, kk = 1, k
        while kk in out:
            n += 1
            kk = f"{k}#{n}"
        out[kk] = r
    return out


def _same(a, b) -> bool:
    if isinstance(a, float) and isinstance(b, float) and pd.isna(a) and pd.isna(b):
        return True
    return a == b


def diff(old: pd.DataFrame, new: pd.DataFrame) -> dict:
    """두 판 비교 → added / removed / changed(열별) / stopped_selling (판매여부 Y→N)"""
    o, n = _keyed(old), _keyed(new)
    added = [n[k] for k in n.keys() - o.keys()]
    removed = [o[k] for k in o.keys() - n.keys()]
    changed = []
    for k in o.keys() & n.keys():
        fields = [c for c in COMPARE if not _same(o[k].get(c), n[k].get(c))]
        if fields:
            changed.append({"name": n[k]["name"], "producer": n[k]["producer"], "fields": fields,
                            "before": {c: o[k].get(c) for c in fields}, "after": {c: n[k].get(c) for c in fields}})
    stopped = [c for c in changed if "available" in c["fields"] and c["before"]["available"] and not c["after"]["available"]]
    return {
        "added": [{"name": r["name"], "producer": r["producer"], "abv": r["abv"]} for r in added],
        "removed": [{"name": r["name"], "producer": r["producer"], "abv": r["abv"]} for r in removed],
        "changed": changed,
        "stopped_selling": [{"name": c["name"], "producer": c["producer"]} for c in stopped],
        "summary": {"old_rows": len(old), "new_rows": len(new), "added": len(added), "removed": len(removed),
                    "changed": len(changed), "stopped_selling": len(stopped)},
    }
