# 수집 → 분석 → 결과 사이클 모델 기획 (2026-10-10)

> 대상: sool, ICT·블로그 초안(ict-blog-draft), 기존 AI교육 수집기(ai-edu-collector)
> 실행 환경: 리눅스 서버 badakaya (2C/4T, 7GB) · 허브(badakaya-hub)가 상태를 보여줌
> 목표: 작업마다 따로 짜지 말고 **하나의 모델(단계·폴더·상태 계약)** 위에 작업을 얹는다. 포트폴리오에서는 "데이터 파이프라인을 설계·운영했다"를 보여주는 축.

---

## 1. 현재 상태 진단

| 작업 | 수집 | 분석 | 결과 | 상태 보고 | 문제 |
|---|---|---|---|---|---|
| ai-edu-collector | ✅ 매일 07:00, 뉴스·RSS·논문 (오늘 109건 신규) | ❌ 없음 | md 묶음 + index.csv → 드라이브 | ❌ status.json 없음 | 수집만 하고 끝. git 아님, 네이버 키 없음 |
| ict-blog-draft | ❌ | ❌ | ❌ | — | 허브 카드만 "계획" |
| sool | △ 초기 CSV 1회 적재 (1,250건) | △ API 안 즉석 계산(stats·추천·리포트) | 웹 서비스 | ❌ 허브 "연결 예정" | category Unknown 1,248건, 데이터 갱신 경로 없음 |
| badakaya-hub | — | — | 대시보드 | status.json 읽을 준비 됨 | git 아님 |

→ **수집은 있는데 "분석"과 "결과가 다시 수집을 바꾸는 고리"가 없다.** 이걸 공통 모델로 메운다.

---

## 2. 공통 모델: 5단계 + 피드백

```
          ┌──────────────────────── ⑥ feedback (다음 수집 조건 조정) ───────────────────────┐
          ▼                                                                                  │
 ① collect ──▶ ② clean ──▶ ③ analyze ──▶ ④ publish ──▶ ⑤ report(status) ──▶ 허브·알림 ─────┘
   raw/          staged/       marts/         결과물(서비스DB·      status.json
  (Bronze)      (Silver)       (Gold)         md·csv·드라이브)       runs 기록
```

| 단계 | 하는 일 | 원칙 |
|---|---|---|
| ① collect | 외부·내부 소스에서 원본 그대로 저장 | **원본 불변**. 날짜 폴더에 append. 실패해도 다음 소스 계속 |
| ② clean | 중복 제거, 정규화(날짜·언어·카테고리), 스키마 검증 | **멱등** (같은 날 두 번 돌려도 결과 같음). 품질 검사 결과를 기록 |
| ③ analyze | 집계·트렌드·군집·분류·요약(LLM) | 입력=clean 결과만. 산출물은 테이블(Gold) |
| ④ publish | 사람이나 서비스가 쓰는 형태로 내보냄 | 서비스 DB 반영은 **요약 테이블만**, 원본 테이블 직접 수정 금지 |
| ⑤ report | 단계별 상태·건수·시간·경고를 status.json 에 기록 | 허브는 이 파일만 읽음 (작업 코드와 분리) |
| ⑥ feedback | 결과 지표 → 다음 실행의 설정(키워드·수집 우선순위) 갱신 | 자동 적용 말고 **제안 파일** → 사람이 승인 (초기) |

### 2.1 폴더 계약 (모든 작업 동일)
```
<job_dir>/
  config.yaml          소스·키워드·스케줄 (feedback 이 고치는 대상)
  raw/YYYY-MM-DD/      ① 원본 (json/html/csv)
  warehouse.duckdb     ②③ staged_* / mart_* 테이블
  output/              ④ 사람이 보는 결과 (md, csv, png)
  status.json          ⑤ 최신 실행 상태 (허브 계약)
  runs.jsonl           ⑤ 실행 이력 한 줄씩 (추세·실패율 분석용)
  feedback/proposals-YYYY-MM-DD.yaml   ⑥ 설정 변경 제안
```

### 2.2 status.json v2 (허브 기존 계약 확장, 하위 호환)
```json
{
  "ok": true,
  "job": "ict-blog-draft",
  "run_id": "2026-10-11T06:30:00+09:00",
  "last_run": "2026-10-11T06:31:42+09:00",
  "duration_sec": 102,
  "total_items": 1668,
  "steps": {
    "collect": {"state": "ok",   "in": 0,   "out": 640, "sec": 41},
    "clean":   {"state": "ok",   "in": 640, "out": 97,  "dropped_dup": 543},
    "analyze": {"state": "ok",   "out": 12},
    "publish": {"state": "warn", "out": 1, "message": "drive 업로드 재시도 1회"},
    "feedback":{"state": "skipped"}
  },
  "quality": {"null_title": 0, "future_date": 0, "schema_errors": 0},
  "warnings": ["naver: API 키 없음 → 건너뜀"],
  "message": "초안 1건 생성"
}
```
- 기존 허브는 `ok`, `total_items`, `last_run`, `steps.<key>` 를 읽음 → steps 값이 문자열 대신 객체가 되므로 허브 `collector_data` 에 "문자열이면 그대로, 객체면 `.state`" 한 줄 처리 추가

### 2.3 공통 실행기 `jobkit` (작은 파이썬 패키지, 300줄 이내 목표)
```python
from jobkit import Job

job = Job("ict-blog-draft")          # config.yaml 로드, 폴더 준비, run_id 생성

@job.step("collect")
def collect(ctx): ...                # ctx.raw_dir, ctx.config, ctx.log, return 건수

@job.step("clean")
def clean(ctx): ...                  # ctx.db (duckdb 연결)

job.run()                            # 순서대로 실행, 단계별 시간·건수·예외 기록
                                     # → status.json / runs.jsonl 기록, 실패 시 알림
```
- 단계 하나가 실패하면 그 뒤 단계는 `skipped`, 전체 `ok=false` (단 collect 소스 일부 실패는 `warn`)
- `python -m jobkit run <job> [--from analyze] [--date 2026-10-10]` → 특정 단계부터 재실행 / 과거 날짜 재처리(backfill)
- 알림: 실패·경고 시 텔레그램 봇 1개 (가장 간단). 이메일은 나중

### 2.4 기술 선택 (서버 사양 기준)
| 영역 | 선택 | 이유 / 안 쓰는 것 |
|---|---|---|
| 스케줄 | **systemd timer** (지금 cron 에서 이전) | 실패 기록·재시도·`journalctl` 로그. Airflow·Prefect 는 이 서버에 과함 |
| 분석 저장소 | **DuckDB** 파일 1개/작업 | 설치 0, SQL 로 분석, parquet 내보내기. 포트폴리오에 SQL 보여주기 좋음 |
| 서비스 DB | MariaDB (sool 만) | 서비스용. 분석 결과는 `analytics_*` 요약 테이블로만 반영 |
| 분석 | pandas + SQL, scikit-learn (TF-IDF·KMeans 정도) | 서버에서 모델 학습·로컬 LLM 금지 (결정 문서 2026-10-09) |
| 요약·초안 | Claude API (`claude-haiku-5-5` 요약, `claude-sonnet-5-5` 초안) | 외부 API. 월 비용 상한 config 로 관리 |
| 결과 공유 | 구글드라이브(rclone, 기존) + 허브 + sool 웹 | |
| 코드 관리 | 작업별 git repo, 서버는 `git pull` 만 | 지금 hub·collector 가 git 아님 → 1순위 |

---

## 3. 작업별 적용

### 3.1 ICT·블로그 초안 (ai-edu-collector 를 일반화해서 만든다)
AI교육 수집기와 구조가 같으므로 **`collector` 하나를 "주제 설정만 다른 2개 작업"으로** 운영: `ai-edu`, `ict`.

| 단계 | 내용 |
|---|---|
| ① collect | 구글뉴스 RSS·네이버 뉴스 API·기관 RSS(과기정통부, NIA, IITP 등)·arXiv/OpenAlex. 원본 json 저장 |
| ② clean | URL 정규화(구글뉴스 리다이렉트 해제) → link 해시 중복 제거 → 제목 유사도(문자 n-gram) 중복 묶기 → 언어 판별 → 날짜 범위 검사 |
| ③ analyze | 키워드·소스별 일간 건수 / 7일 대비 급상승 키워드 / TF-IDF + KMeans 로 주제 묶음 / 묶음별 대표 기사 3건 → LLM 요약 |
| ④ publish | `output/daily-YYYY-MM-DD.md` (주제별 요약), **주 1회 블로그 초안** `drafts/YYYY-Www.md` (상위 주제 1~2개, 출처 링크 포함) → 드라이브 → 사람이 검토 후 게시 |
| ⑤ report | status.json v2, 허브 카드 지표: 오늘 신규, 주제 수, 생성 초안 수 |
| ⑥ feedback | 키워드별 "신규 건수·중복률·초안 채택률" → 0건 키워드 제거 / 급상승 용어 추가 **제안**. 게시한 초안을 `published.csv` 에 기록하면 채택률 계산 |

### 3.2 sool
sool 은 "외부 수집"보다 **서비스 안에서 생기는 데이터(리뷰·테이스팅·검색)** 가 핵심. 웹 앱과 분리된 배치 작업 `sool-pipeline` 으로 둔다 (sool repo 안 `pipelines/`, 같은 jobkit 사용).

| 단계 | 내용 |
|---|---|
| ① collect | (a) 서비스 DB 스냅샷: sool·reviews·tasting_notes·sense 를 날짜별 parquet 으로 추출 (읽기 전용 계정) (b) 외부: 공공데이터포털 전통주 정보, 더술닷컴 등 제품 메타(카테고리·원료·수상) (c) 이후: 프론트 검색어·조회 로그 |
| ② clean | 제품명 정규화(공백·괄호·용량 표기) → 외부 데이터와 **제품 매칭**(이름+양조장 유사도) → 카테고리 표준 코드(탁주/약주/청주/과실주/증류주/리큐르/기타) → 평점 척도 통일(5점/10점 혼재 정리) |
| ③ analyze | **카테고리 보정** (Unknown 1,248건: 규칙 → 매칭 → 남은 것 LLM 분류 + 신뢰도) / 지역·카테고리·도수 분포 / 풍미 벡터 군집(취향 유형) / 추천 품질 평가(리뷰 있는 사용자 기준 hit rate) / 리뷰·테이스팅 추세 |
| ④ publish | MariaDB `analytics_sool_category`(제안값+신뢰도), `analytics_stats_daily`, `analytics_flavor_cluster` → `/sool/stats` 가 즉석 계산 대신 이 테이블을 읽음. 주간 리포트 md → 드라이브. **원본 `sool.category` 갱신은 관리자 승인 화면에서** |
| ⑤ report | status.json → 허브 sool 카드 "연결 예정 → 운영 중" (지표: 총 제품, 카테고리 미분류 수, 신규 리뷰, 마지막 실행) |
| ⑥ feedback | 조회는 많은데 풍미 데이터 없는 제품 → "테이스팅 우선 목록" / 매칭 실패 제품 → 다음 외부 수집 대상 / 추천 hit rate 추이 → 가중치 조정 |

### 3.3 실행 시간표 (서버)
| 시각 | 작업 | 비고 |
|---|---|---|
| 03:00 | sool DB 백업 (기존) | |
| 03:30 | sool-pipeline (매일, 외부 수집은 주 1회 일요일) | 백업 후 스냅샷 |
| 06:30 | ict | |
| 07:00 | ai-edu (기존) | |
| 일 08:00 | ict 주간 초안 + 전체 주간 리포트 | LLM 호출 몰아서 |
- 동시에 두 개가 돌지 않게 간격 유지 (2코어). 각 작업 메모리 1GB 이하 목표

---

## 4. 구축 순서 (마일스톤)

| 단계 | 내용 | 완료 기준 | 예상 |
|---|---|---|---|
| **M0 기반 정리** | hub·collector git repo 화 + GitHub push, collector 가 status.json(v1) 기록 | 허브 카드에 실제 상태 표시, 알림 "status.json 예정" 해소 | 0.5일 |
| **M1 jobkit** | 단계 실행기·status v2·runs.jsonl·텔레그램 알림·systemd timer 템플릿 + 테스트 | ai-edu 를 jobkit 으로 옮겨 기존과 같은 결과 | 1~1.5일 |
| **M2 ICT 사이클** | ict 설정 추가 → clean·analyze(키워드 추세·주제 묶음)·일간 md → LLM 요약·주간 초안 | 1주 무인 운영, 초안 1건 게시 | 2~3일 |
| **M3 sool 사이클** | 스냅샷 → 카테고리 보정 → analytics_* 테이블 → stats API 전환 → 관리자 승인 화면 | Unknown 1,248 → 목표 100 이하, 허브 sool 카드 운영 중 | 3~4일 |
| **M4 피드백 고리** | 두 작업의 proposals 생성 + 허브에 "제안" 카드 | 제안 → 승인 → 다음 실행 반영 1회 확인 | 1~2일 |
| **M5 포트폴리오화** | 아키텍처 다이어그램, 데이터 품질·실행 이력 지표(runs.jsonl 분석), README·블로그 | 면접에서 5분 설명 가능 | 1일 |

**추천 시작점: M0 → M1 → M3(sool) → M2(ICT)**
- sool 이 포트폴리오 메인이고, 카테고리 Unknown 문제가 눈에 띄는 약점이라 효과가 큼
- 단, ICT 를 블로그 운영 목적으로 빨리 원하면 M2 를 먼저

---

## 5. 결정이 필요한 것
1. 시작 순서: sool 먼저(추천) vs ICT 먼저
2. jobkit 위치: 별도 repo `badakaya-jobkit` (추천, 여러 작업이 pip 로 설치) vs 작업마다 복사
3. ICT 범위: AI교육 수집기와 키워드만 다른 "ICT 전반" 인지, 특정 분야(AI·클라우드·보안 등)인지
4. LLM 비용 상한 (예: 월 $5) 과 사용 모델
5. 알림 채널: 텔레그램(추천) / 이메일 / 허브만
6. sool 외부 데이터 소스: 공공데이터포털 API 키 발급 여부, 크롤링 허용 범위(robots.txt·이용약관 확인 필요)

## 6. 리스크
| 리스크 | 대응 |
|---|---|
| 서버 1대·디스크 1개 | raw 는 30일 후 압축, warehouse·output 은 드라이브 백업 대상에 추가 |
| 외부 소스 구조 변경·차단(arXiv 429 등) | 소스별 실패 격리 + warn, 요청 간격·재시도 config |
| LLM 비용·품질 | 대표 기사만 요약, 캐시(같은 link 재요약 금지), 초안은 반드시 사람 검토 |
| 서비스 DB 오염 | 파이프라인은 읽기 전용 계정 + `analytics_*` 쓰기 권한만. 원본 수정은 승인 화면 경유 |
| 혼자 운영 → 방치 | 허브 + 실패 알림, runs.jsonl 로 주간 성공률 확인 |
