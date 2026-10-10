# sool-pipeline

서비스 DB 를 매일 스냅샷해서 정제·분석하는 배치 작업. 설계: `docs/decisions/2026-10-10-pipeline-master-plan.md` (Part 2)

```
① collect  서비스 테이블 + 시드(aT 전통주정보 최신판) + 좌표·링크·블로그 → raw/<날짜>/*.parquet
           (SELECT 전용 계정. aT 를 못 받으면 마지막 판, 그것도 없으면 /seed 의 repo CSV)
② clean    이름·양조장 정규화, 품질 검사, DB↔시드 연결             → staged_sool, staged_seed, staged_seed_link
③ analyze  카테고리 제안 + 술 카드(원료·제조·인증·수상·용량)       → mart_category_suggestion, mart_sool_profile, output/*.csv
④ publish / ⑤ feedback                                           (S4 이후)
상태: data/pipeline/status.json (허브 계약 v2), 이력: runs.jsonl
```

## 실행
```bash
# 최초 1회: .env 에 PIPELINE_DB_PASSWORD 넣고
./ops/create-pipeline-user.sh

docker compose --profile pipeline build pipeline
docker compose --profile pipeline run --rm pipeline run                 # 전체
docker compose --profile pipeline run --rm pipeline run --from analyze  # 특정 단계부터
docker compose --profile pipeline run --rm pipeline run --date 2026-10-10 --only clean,analyze  # 재처리
```

## 원천 데이터: aT 전통주정보 (`sool_pipeline/source_at.py`)
- 공공데이터포털 15048755 (더술닷컴 원천, 연 1회 갱신, 이용 제한 없음). `config.yaml` → `at_source.check_days` 마다 확인
- 데이터셋 페이지에서 내려받기 링크를 찾아 파일을 받고, **내용 해시가 바뀌었을 때만** 새 판으로 저장
  → `data/pipeline/sources/at/at_<날짜>_<해시>.csv`, 목록 `versions.json`
- 새 판은 이전 판(처음이면 repo 시드)과 비교: 추가·삭제·변경(열별)·판매 중단 → `output/at_changes-<날짜>.json`, 경고, 관리자 개요
- 같은 제품 판별: 정규화 이름 + 양조장 + 도수. `판매여부=N` → 술 카드 `on_sale=false` (화면 '판매 중단', 추천순 맨 뒤)
- 포털 화면·열 구성이 바뀌면 경고만 남기고 마지막 판을 계속 사용
- aT 에만 있고 서비스 DB 에 없는 신제품은 화면에 자동으로 넣지 않음 (파이프라인은 서비스 테이블에 쓰지 않음) → 변경 파일로 확인 후 반영

## 테스트
```bash
cd pipelines && pip install -r requirements.txt && pytest
```

## 카테고리 규칙 (`sool_pipeline/categorize.py`)
분류: 탁주 / 약주 / 청주 / 과실주 / 증류주 / 리큐르 / 기타주류. 위에서부터 먼저 맞는 규칙 적용.

| 순서 | 규칙 | 결과 | 신뢰도 |
|---|---|---|---|
| 1 | 이름에 막걸리·탁주 / 리큐르 / 청주 / 약주·소곡주 / 와인·사이더 | 해당 주종 | 0.85~0.95 |
| 2 | 도수 ≥20 (주정+과실/당이면 리큐르) | 증류주 | 0.85~0.95 |
| 3 | 증류 단서 + 도수 ≥13 (과실/당/주정 있으면 리큐르) | 증류주 | 0.65~0.75 |
| 4 | 원료에 주정 | 리큐르 | 0.6 |
| 5 | 첫 원료(물 제외)가 과실 | 과실주 | 0.8 |
| 6 | 첫 원료가 곡물: <9.5% 탁주, ≤18% 약주 | 탁주/약주 | 0.7 / 0.6 |
| - | 그 외 | 미분류 → 외부 매칭·LLM | 0 |
