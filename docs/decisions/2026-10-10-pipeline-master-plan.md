# 데이터 사이클 마스터 플랜 — sool → ICT (2026-10-10)

> 선행 문서: `2026-10-10-data-cycle-model.md` (공통 모델·status.json v2·jobkit 개념)
> 결정: **sool 먼저, 그다음 ICT.** 이 문서는 큰 틀 → 세부 설계 → 목표·이점·수익 순서.

---

# Part 1. 큰 틀

## 1.1 한 장 구조

```
                         ┌────────────────── badakaya-hub (상태·제안·알림) ──────────────────┐
                         │   status.json / runs.jsonl / proposals 만 읽음 (작업 코드와 분리)      │
                         └───────────────▲────────────────────────────▲──────────────────────┘
                                         │                            │
 ┌──────────── sool-pipeline (매일 03:30) ┴──────┐      ┌──── collector: ict / ai-edu (매일 06:30·07:00) ┴───┐
 │ ① collect  서비스DB 스냅샷 + 외부 제품정보       │      │ ① collect  뉴스·RSS·기관·논문                       │
 │ ② clean    제품명 정규화·매칭·카테고리 표준화     │      │ ② clean    URL정규화·중복묶기·언어·날짜검사           │
 │ ③ analyze  카테고리보정·군집·추천평가·추세        │      │ ③ analyze  키워드추세·주제군집·LLM요약               │
 │ ④ publish  MariaDB analytics_* + 주간리포트      │      │ ④ publish  일간 다이제스트·주간 블로그 초안            │
 │ ⑤ report   status.json                          │      │ ⑤ report   status.json                              │
 │ ⑥ feedback 테이스팅 우선목록·수집대상 제안        │      │ ⑥ feedback 키워드 추가/삭제 제안                      │
 └──────┬──────────────────────────────────┬───┘      └────────────┬───────────────────────────┬────────┘
        │ 읽기전용 / analytics_* 쓰기        │ 드라이브                  │ Claude API                 │ 드라이브
        ▼                                  ▼                         ▼                            ▼
   sool 웹 서비스 (MariaDB)            sool-report/              요약·초안                     ict-blog/
   /sool/stats · 추천 · 관리자 승인화면                                                         → 사람 검토 → 블로그 게시
                                  공통 엔진: badakaya-jobkit (단계 실행·기록·알림·재처리)
                                  스케줄: systemd timer · 서버: badakaya (2C/7GB)
```

## 1.2 저장소(repo) 구성
| repo | 내용 | 상태 |
|---|---|---|
| `kkiihun/sool` | 웹 서비스 + **`pipelines/`** (sool-pipeline) | 있음 |
| `kkiihun/badakaya-jobkit` (신규, 비공개→공개) | 공통 실행기 | 신규 |
| `kkiihun/badakaya-collector` (신규) | ai-edu-collector 를 일반화. `topics/ai-edu.yaml`, `topics/ict.yaml` | 서버 폴더 → repo 화 |
| `kkiihun/badakaya-hub` (신규) | 대시보드 | 서버 폴더 → repo 화 |

## 1.3 일정 한눈에 (주 단위, 하루 3~4시간 기준)
| 주차 | 마일스톤 | 산출물 |
|---|---|---|
| 1주 | **M0 기반** + **M1 jobkit** | hub·collector repo, collector status.json, jobkit v0.1 + 테스트, systemd timer |
| 2주 | **S1~S3 sool 수집·정제·카테고리 보정** | 스냅샷, 외부 매칭, Unknown 1,248 → 제안값 |
| 3주 | **S4~S6 sool 분석·발행·피드백** | analytics_* 테이블, stats API 전환, 승인 화면, 주간 리포트, 허브 카드 |
| 4주 | **I1~I4 ICT** | ict 토픽, 정제·분석, 일간 다이제스트, 주간 초안 |
| 5주 | **M5 운영 안정화·포트폴리오** | 4주 운영 지표, README·아키텍처 그림, 블로그 글 |

---

# Part 2. sool 세부 설계

## 2.1 sool 이 풀 문제
| 지금 | 문제 | 사이클 후 |
|---|---|---|
| 1,250개 중 category Unknown 1,248 | 필터·통계·추천이 사실상 무력 | 규칙→매칭→LLM 3단 보정 + 관리자 승인 |
| stats 를 요청마다 즉석 계산 | 데이터 늘면 느려짐, 이력 없음 | 일 단위 집계 테이블, 추세 그래프 가능 |
| 데이터가 초기 CSV 1회 적재로 멈춤 | 신제품·정보 변경 반영 경로 없음 | 주 1회 외부 수집 + 매칭 |
| 추천 품질을 모름 | 개선 근거 없음 | hit@10·coverage 를 매주 측정 |
| 사용자 행동 기록 없음 | 피드백 불가 | 조회·검색·추천클릭 이벤트 로그 |

## 2.2 실행 형태
- 위치: `sool/pipelines/` (같은 repo → 포트폴리오에서 서비스+파이프라인을 한 번에 보여줌)
- 실행: compose 의 **one-shot 서비스** (상시 실행 X)
  ```yaml
  pipeline:
    build: ./pipelines
    profiles: ["pipeline"]          # up 에 포함 안 됨
    environment: { DB_HOST: db, DB_USER: sool_pipeline, ... }
    volumes: [ "./data/pipeline:/data" ]   # raw/, warehouse.duckdb, output/, status.json
    mem_limit: 1g
  ```
  `docker compose --profile pipeline run --rm pipeline run --all` ← systemd timer 가 매일 03:30 호출
- DB 계정 분리: `sool_pipeline` = 서비스 테이블 **SELECT 만** + `analytics_*`·`sool_category_suggestion`·`external_*` 쓰기

```
pipelines/
  Dockerfile
  config.yaml              소스·스케줄·임계값
  sool_pipeline/
    steps/collect.py       snapshot(), fetch_external()
    steps/clean.py         normalize_name(), match_products(), standardize_category()
    steps/analyze.py       suggest_category(), flavor_clusters(), eval_recommender(), daily_stats()
    steps/publish.py       write_analytics(), weekly_report()
    steps/feedback.py      tasting_priority(), collect_targets()
    sql/                   DuckDB 변환 SQL (staged_*, mart_*)
  tests/                   정규화·매칭·카테고리 규칙 단위테스트 + 소형 fixture
```

## 2.3 단계별 세부

### ① collect
| 소스 | 방법 | 주기 | 저장 |
|---|---|---|---|
| 서비스 DB (sool, reviews, tasting_notes, sense, users 집계만) | SELECT → parquet | 매일 | `raw/YYYY-MM-DD/db_*.parquet` |
| 이벤트 로그 (신규 테이블 `event_log`) | 전일분 SELECT | 매일 | 같은 폴더 |
| 외부 제품 정보 — 공공데이터포털/더술닷컴 계열 전통주 정보 | API 우선, 없으면 허용 범위 내 수집 (robots·약관 확인 후) | 주 1회(일) | `raw/.../ext_<source>.json` |
| 기존 CSV (`sool_basic_region_added.csv`, `sense_traditional.csv`, `tastenote.csv`) | 1회 시드 | 최초 | `raw/seed/` |
- **사람 개인정보는 수집하지 않음** (users 는 건수·가입일 집계만)

### ② clean (DuckDB SQL + pandas)
1. 제품명 정규화: 전각/반각, 공백, 괄호 내용·용량(750ml)·도수 표기 분리 → `name_norm`
2. 양조장명 정규화: (주)/농업회사법인/영농조합 제거 → `producer_norm`
3. 외부↔내부 매칭: `name_norm`+`producer_norm` 문자 3-gram 유사도, 도수 ±0.5 보너스 → `product_match(score)`; 0.9↑ 자동, 0.75~0.9 검토, 미만 버림
4. 카테고리 표준 코드: 주세법 기준 `탁주 / 약주 / 청주 / 과실주 / 증류식소주 / 일반증류주 / 리큐르 / 기타주류` (+ 표시용 "막걸리"는 탁주의 별칭)
5. 평점 척도 통일: reviews(5점?)·sense(1~5)·tasting_notes 를 0~1 정규화 컬럼 추가 (원본 유지)
6. 품질 검사 → status.json `quality`: 도수 0~60 범위, 이름 중복, 필수값 결측, 매칭 충돌(1 외부 → 2 내부)

### ③ analyze
| 분석 | 방법 | 결과 테이블 |
|---|---|---|
| **카테고리 보정** | (a) 규칙: 이름·원료 키워드(막걸리/탁→탁주, 소주·증류→증류식, 와인·사과·오미자→과실주 …) (b) 외부 매칭 카테고리 (c) 남은 것 LLM 분류(이름+설명+원료+도수 → 코드+근거) / 최종 신뢰도 | `sool_category_suggestion` |
| 일간 지표 | 제품 수, 카테고리·지역 분포, 신규 리뷰·테이스팅, 평균 평점 | `analytics_stats_daily` |
| 풍미 군집 | sense·tasting 평균 벡터(단맛·산미·바디·향·여운·탄산) 표준화 → KMeans(k=4~6, 실루엣으로 선택) → 군집 이름(예: "달고 가벼운", "산미 강한 드라이") | `analytics_flavor_cluster` |
| 추천 평가 | 리뷰 2건↑ 사용자: 1건 숨기고 recommender 상위 10에 있는지 (hit@10), 추천된 제품 다양성(coverage) | `analytics_reco_eval` |
| 데이터 충실도 | 제품별 풍미 데이터 유무, 설명·이미지 결측 | `analytics_data_coverage` |

### ④ publish
- MariaDB 쓰기는 **트랜잭션 + 날짜 키 upsert** (재실행 안전)
- 백엔드 변경
  - `/sool/stats` → `analytics_stats_daily` 최신일 읽기 (없으면 기존 즉석 계산으로 폴백)
  - `/sool/stats/trend?metric=&days=` 신규 (대시보드 추세 차트)
  - `/admin/category-suggestions` 목록·승인·거절 (require_admin) → 승인 시 `sool.category` 갱신 + 이력
  - `event_log` 기록: 상세 조회·검색·추천 클릭 (프록시에서 비동기 1줄 insert, 실패 무시)
- 프론트: 관리자 "카테고리 검토" 화면 (신뢰도순, 일괄 승인), 대시보드 추세 차트·풍미 군집 뷰
- 주간 리포트 `output/weekly-YYYY-Www.md` (+png) → `ggdrive:sool-report`

### ⑤ report
- `data/pipeline/status.json` (v2) → 허브 `jobs.yaml` 의 sool 을 `운영 중`으로, 지표: 총 제품 / 미분류 수 / 이번 주 신규 리뷰 / 추천 hit@10 / 마지막 실행

### ⑥ feedback (제안 파일 → 사람 승인)
- **테이스팅 우선 목록**: 조회 많음 × 풍미 데이터 없음 상위 20 → 관리자 화면·주간 리포트
- **수집 대상**: 매칭 실패 제품명 → 다음 외부 수집 검색어
- **규칙 개선**: 관리자가 거절한 제안 → 규칙 키워드 수정 후보

## 2.4 DB 추가 스키마 (Alembic 마이그레이션으로 — 지금의 create_all 의존도 함께 정리)
```sql
event_log(id, ts, user_id NULL, session_id, type ENUM('view','search','reco_click'), sool_id NULL, query NULL)
external_product(id, source, source_id, name, producer, category_raw, abv, payload JSON, fetched_at, UNIQUE(source, source_id))
product_match(sool_id, external_id, score, status ENUM('auto','review','rejected'), matched_at)
sool_category_suggestion(sool_id, suggested, method ENUM('rule','match','llm'), confidence, reason,
                         status ENUM('pending','approved','rejected'), reviewed_by, reviewed_at, run_id)
analytics_stats_daily(date, metric, dim, dim_value, value, PRIMARY KEY(date, metric, dim, dim_value))
analytics_flavor_cluster(run_date, sool_id, cluster_id, cluster_label, distance)
analytics_reco_eval(run_date, k, hit_rate, coverage, n_users)
analytics_data_coverage(run_date, sool_id, has_flavor, has_description, has_image, views_30d)
```

## 2.5 sool 단계별 작업 목록
| ID | 작업 | 완료 기준 |
|---|---|---|
| S1 | pipelines 골격·compose profile·DB 계정·timer, 스냅샷 | 매일 parquet 생성, status.json ok |
| S2 | 정규화·카테고리 규칙·품질검사 (+단위테스트) | 규칙만으로 Unknown 몇 건 줄었는지 수치 |
| S3 | 외부 수집·매칭 | 매칭률 산출, 검토 대상 목록 |
| S4 | LLM 분류 + suggestion 테이블 + 관리자 승인 화면 | Unknown → **100 이하** (승인 기준) |
| S5 | 일간 지표·추세 API·대시보드 차트, event_log | stats 응답이 집계 테이블 기반 |
| S6 | 풍미 군집·추천 평가·주간 리포트·허브 연결·feedback | 허브 sool 카드 운영 중, 리포트 드라이브 업로드 |

---

# Part 3. ICT 세부 설계

## 3.1 방향
- 기존 `ai-edu-collector` 를 **`badakaya-collector` (토픽 설정형)** 로 일반화 → `ai-edu`, `ict` 두 토픽이 같은 코드로 돎
- ICT 범위(초안): AI·클라우드·보안·반도체·정책(과기정통부·NIA·IITP)·국내 IT 기업 동향. 블로그 독자 = 직장인/취준생 IT 트렌드 관심층 → 확정 필요

```
badakaya-collector/
  topics/ai-edu.yaml  topics/ict.yaml     키워드·소스·LLM 프롬프트·발행 설정
  collector/sources/  google_news.py naver_news.py rss.py arxiv.py openalex.py
  collector/steps/    collect.py clean.py analyze.py publish.py feedback.py
  data/<topic>/       raw/ warehouse.duckdb output/ drafts/ status.json runs.jsonl
```

## 3.2 단계별 세부
| 단계 | 내용 |
|---|---|
| ① collect | 구글뉴스 RSS(ko/en), 네이버 뉴스 API(키 발급 필요), 기관 RSS, (ICT 는 논문 비중 낮게) |
| ② clean | 구글뉴스 링크 → 원문 URL, URL 해시 중복, 제목 3-gram 유사도 0.8↑ 같은 사건 묶기(`story_id`), 언어 판별, 날짜 범위·광고성 제목 필터 |
| ③ analyze | 키워드·소스 일간 건수, 7일 이동평균 대비 급상승, 사건(story) 크기 순위, TF-IDF+KMeans 주제 묶음, 상위 주제별 대표기사 3건 **Claude haiku 요약** (link 단위 캐시) |
| ④ publish | 일간: `daily-YYYY-MM-DD.md` (주제 5개 × 3줄 요약 + 출처) / 주간(일 08:00): **블로그 초안** `drafts/YYYY-Www.md` — Claude sonnet, 상위 주제 1~2개, 1,500~2,500자, 출처 링크, "검토 필요" 체크리스트 포함 → 드라이브 |
| ⑤ report | status.json v2 → 허브 카드(오늘 신규, 사건 수, 초안 수, 이번 달 LLM 비용) |
| ⑥ feedback | 키워드별 신규·중복률·초안 채택률 → 제안. `published.csv`(게시 URL·날짜) 기록 → 채택률·(나중에) 조회수 연결 |

## 3.3 ICT 작업 목록
| ID | 작업 | 완료 기준 |
|---|---|---|
| I1 | collector 일반화(토픽 설정), ai-edu 회귀 확인 | ai-edu 결과 기존과 동일 |
| I2 | ict 토픽 + clean(중복·사건 묶기) | 중복률·사건 수 지표 |
| I3 | analyze + 일간 다이제스트 (LLM 요약, 비용 상한) | 7일 연속 무인 생성 |
| I4 | 주간 블로그 초안 + feedback + 허브 | 초안 1건 실제 게시 |

---

# Part 4. 목표

## 4.1 정량 목표 (5주 후)
| 영역 | 지표 | 목표 |
|---|---|---|
| sool 데이터 품질 | 카테고리 Unknown | 1,248 → **≤100** |
| | 외부 매칭률 | 측정 후 기준선 설정 (목표 ≥60%) |
| sool 서비스 | stats 응답 | 집계 테이블 기반, p95 < 200ms |
| | 추천 | hit@10 **측정 시작** + 주간 추이 |
| 파이프라인 운영 | 4주 성공률 | sool·ict 각 **≥95%** (runs.jsonl 기준) |
| | 실패 인지 시간 | 알림으로 **당일** |
| ICT | 일간 다이제스트 | 28일 중 ≥26일 생성 |
| | 블로그 | 주 1편 × 4주 게시 |
| | LLM 비용 | 월 상한 이내 (제안: $5) |

## 4.2 정성 목표
- 면접에서 "수집→정제→분석→발행→모니터링→피드백" 전 과정을 **내 서버에서 실제로 운영한 데이터**로 설명
- 데이터 분석가 포지션: 카테고리 보정 정확도, 군집 해석, 추천 평가 지표
- 백엔드 포지션: 파이프라인 설계(멱등·재처리·권한 분리), API 성능 개선, 운영(타이머·백업·알림)

---

# Part 5. 예상 이점

| 대상 | 이점 |
|---|---|
| **포트폴리오/취업** (가장 큼) | 토이 프로젝트가 아닌 "매일 돌아가는 서비스 + 파이프라인 + 운영 지표". 이력서 한 줄: *"전통주 1,250종 카테고리 미분류 99.8% → 8% 이하로 개선하는 보정 파이프라인 설계·운영"* 같은 수치형 성과 |
| sool 서비스 | 필터·통계·추천이 실제로 의미 있어짐, 데이터가 계속 갱신됨, 관리자가 근거 보고 승인 |
| ICT | 매일 30분 이상 걸릴 동향 정리를 자동화, 블로그 글감이 주 1회 자동 확보 |
| 재사용 | jobkit + 허브로 다음 작업(수익형 프로그램 등)을 **설정 파일 + 단계 함수**만으로 추가 |
| 학습 | DuckDB·SQL 변환, 엔티티 매칭, 군집·평가, LLM 비용 관리, systemd 운영 |

---

# Part 6. 수익 가능성 (현실적으로)

> 전제: 지금은 **수익보다 포트폴리오가 1순위**. 아래는 경로와 규모 감각이며, 숫자는 검증 안 된 가정치.

## 6.1 ICT 블로그 — 가장 빨리 시작 가능
| 경로 | 조건 | 기대 규모(가정) |
|---|---|---|
| 애드센스(티스토리/개인 도메인) 또는 네이버 애드포스트 | 승인 필요, 꾸준한 발행 | 초기 6개월 월 0~수만 원. 일 방문 1,000명 수준 넘어야 의미 |
| 뉴스레터(무료 → 유료) | 구독자 확보 | 무료로 시작, 구독자 수백 명 이후 유료·스폰서 검토 |
| 기업·기관 맞춤 동향 리포트 (예: AI교육 동향 — 교육기관 대상) | 레퍼런스 | 건당 계약형. ai-edu 데이터가 그대로 재료 |
- 주의: 기사 본문 전재 금지(요약+출처 링크), LLM 초안은 반드시 사람 검수 → 저품질 자동생성 글은 애드센스 승인·검색 노출에 불리

## 6.2 sool — 시간이 걸리지만 단가가 높음
| 경로 | 대상 | 비고 |
|---|---|---|
| 제품 포지셔닝 리포트 (기존 `report_generator` 확장) | 양조장 | 카테고리·풍미 군집 내 위치, 경쟁 제품 비교. 건당 유료 or 구독 |
| 큐레이션 데이터·위젯 | 보틀샵·주점 | 풍미 기반 추천을 매장 메뉴/QR 로 |
| 제휴 링크 | 소비자 | 전통주는 온라인 판매 허용 품목 → 판매처 제휴 수수료 (제휴 프로그램 존재 여부 확인 필요) |
| 공공 지원사업 | — | 농식품부·aT 전통주 진흥 사업, 데이터바우처 공급기업 등 (공고 시기·자격 확인 필요) |
- 선결 조건: 도메인·HTTPS 공개, 이용약관·개인정보처리방침, 외부 데이터 이용 허락 범위 확인

## 6.3 수익화 단계
1. (지금~5주) 사이클 구축·운영 지표 확보 — 수익 0, 포트폴리오 완성
2. (2~3개월) ICT 블로그 주 1~2편 + 광고 신청, sool 도메인 공개
3. (3~6개월) 반응 보고 하나에 집중: 블로그 트래픽이 붙으면 뉴스레터, 양조장 반응이 있으면 리포트 상품화

---

# Part 7. 결정·준비 필요 (사용자)
| # | 항목 | 언제까지 |
|---|---|---|
| 1 | 공공데이터포털 가입·전통주 관련 API 활용신청 | S3 전 (2주차) |
| 2 | Claude API 키 + 월 비용 상한 | S4 전 |
| 3 | 알림 채널 (텔레그램 봇 추천) | M1 |
| 4 | ICT 범위·블로그 플랫폼(티스토리/네이버/개인도메인) | I3 전 |
| 5 | 네이버 검색 API 키 (ai-edu 에도 필요) | I1 |
| 6 | hub·collector·jobkit GitHub repo 생성 (공개/비공개) | M0 |

# Part 8. 바로 다음 할 일 (M0)
1. 서버 `badakaya-hub`, `ai-edu-collector` → git init, `.gitignore`(.venv, data, output, .env) → GitHub push
2. collector 에 status.json(v1) 기록 추가 → 허브 카드 실제 상태 확인
3. cron(07:00) → systemd timer 이전 + 실패 알림
4. jobkit 설계 문서 → 구현 착수
