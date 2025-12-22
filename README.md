# 🍶 sool  
## 전통주 데이터 기반 분석 & 추천 시스템 (MVP)

> 한국 전통주 데이터를 구조화하고,  
> **검색 · 조회 · 분석이 가능한 데이터 기반 서비스**로 구현한 MVP 프로젝트

---

## 1. 프로젝트 개요

**sool**은 한국 전통주(탁주, 약주, 증류식 소주 등)를 대상으로  
제품 정보와 감각 데이터를 구조화하여 **검색·조회·분석**이 가능하도록 만든  
데이터 중심 웹 서비스입니다.

단순한 소개 페이지가 아니라,

- 전통주 데이터를 **정형화**
- DB → API → 프론트엔드까지 **엔드투엔드 파이프라인 구축**
- 향후 **추천 / 클러스터링 모델**로 확장 가능한 구조

를 목표로 설계되었습니다.

---

## 2. 기술 스택

| 영역 | 기술 |
|----|----|
| **Backend** | FastAPI, SQLAlchemy |
| **Database** | SQLite (MVP) → MariaDB 확장 고려 |
| **Frontend** | Next.js |
| **UI** | Tailwind CSS |
| **Data** | Pandas (전처리 및 분석) |

---

## 3. 시스템 구성

```text
[CSV / Raw Data]
        ↓
[SQLite / MariaDB]
        ↓
[FastAPI REST API]
        ↓
[Next.js Frontend]
