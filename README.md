# sool
# 전통주 데이터 기반 추천 시스템 (MVP)

## 1. 프로젝트 개요
- 한국 전통주 데이터를 기반으로 검색, 상세조회, 리뷰 기능을 제공
- 감각 데이터 + 사용자 취향 기반 확장 예정

## 2. 기술 스택
- FastAPI (백엔드)
- SQLite + SQLAlchemy (DB)
- Next.js (프론트)
- Tailwind (UI)

## 3. 기능 목록
- 검색 기능
- 상세페이지 + 리뷰 저장
- 데이터 기반 통계 제공 (도수 평균, 지역 분포 등)

## 4. 데이터 분석 결과
(그래프 캡처 삽입)

## 5. 실행 방법
```bash
# Backend
(사전 가상환경 셋팅 필요)
source venv/bin/activate (가상환경 실행)
deactivate (가상환경 종료)
python -m uvicorn app.main:app --reload (서버 실행) / uvicorn app.main:app --reload
PYTHONPATH=. python scripts/import_sool_basic.py



# Frontend
npm run dev
