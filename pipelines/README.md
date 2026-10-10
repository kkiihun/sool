# sool-pipeline

서비스 DB 를 매일 스냅샷해서 정제·분석하는 배치 작업. 설계: `docs/decisions/2026-10-10-pipeline-master-plan.md` (Part 2)

```
① collect  서비스 테이블 + 원본 CSV 시드 → raw/<날짜>/*.parquet     (SELECT 전용 계정, CSV 는 /seed 읽기 전용)
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
