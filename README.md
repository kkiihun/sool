# 🍶 sool
## 전통주 데이터 기반 분석 & 추천 시스템 (MVP)

전통주 데이터를 구조화하고  
**검색 · 조회 · 분석이 가능한 데이터 중심 서비스**로 구현한 MVP 프로젝트입니다.

---

## 프로젝트 개요
- 전통주 정형 데이터 모델링
- DB → API → Frontend 엔드투엔드 파이프라인 구축
- 분석 기반 추천 시스템 확장 가능 구조

---

## 기술 스택
- Backend: FastAPI, SQLAlchemy
- Database: SQLite (MVP)
- Frontend: Next.js, Tailwind CSS
- Data Analysis: Pandas

---

## 문서
- [주요 기능](docs/FEATURES.md)
- [데이터 분석 결과](docs/ANALYSIS.md)
- [실행 방법](docs/RUN.md)
- [로드맵 & 목적](docs/ROADMAP.md)

---

> 🍶 Data before recommendation.  
> Structure first, intelligence later.


# 4. 주요 기능

## 전통주 검색
- 이름 / 지역 / 주종 기반 검색
- DB 쿼리 기반 빠른 조회

## 상세 페이지
- 전통주 기본 정보
- 도수, 용량, 제조사 등 정형 데이터 제공

## 리뷰 저장 구조
- 사용자 리뷰 저장 가능한 테이블 설계
- 평점 및 취향 데이터 확장 가능

## 데이터 기반 통계
- 도수 평균
- 지역별 분포
- 주종별 개수 통계


# 5. 데이터 분석 결과

현재는 **기초 통계 분석 중심의 MVP 단계**입니다.  
데이터 구조 검증 및 분석 파이프라인 구축을 목적으로 합니다.

---

## 전통주 도수 분포
![ABV Distribution](images/abv_distribution.png)

---

## 지역별 전통주 분포
![Region Distribution](images/region_distribution.png)

---

## 주종별 전통주 비율
![Type Ratio](images/type_ratio.png)


# 6. 실행 방법

## Backend

```bash
source venv/bin/activate
uvicorn app.main:app --reload
PYTHONPATH=. python scripts/import_sool_basic.py
deactivate


npm install
npm run dev



---

# 5️⃣ docs/ROADMAP.md (❗ 7, 8번)

```md
# 7. 향후 확장 계획

- 사용자 취향 기반 추천 시스템
- 전통주 클러스터링 (도수 / 지역 / 주종)
- MariaDB 기반 운영 DB 전환
- 분석 결과 대시보드 고도화

---

# 8. 프로젝트 목적

본 프로젝트는  
**데이터 분석가 / 백엔드 포지션 지원을 위한 포트폴리오**로,

- 데이터 모델링
- API 설계
- 분석 파이프라인 구축
- 서비스 구조 설계

역량을 **실제 구현 결과물**로 증명하는 것을 목표로 합니다.
