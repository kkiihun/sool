# origin/main 병합 분석 (2026-10-09)

현재: `git merge --no-commit origin/main` 진행 중, **충돌 38개**, 커밋 안 함.
(취소하려면 `git merge --abort`)

## 1. 분석 문서와 대조 결과
- 2커밋 앞 / 6커밋 뒤, 프론트 UI 전면 개편 → **맞음**
- 추가로 발견: origin/main 은 **프론트뿐 아니라 백엔드도 크게 바꿈** (아래)

## 2. origin/main 백엔드 변경 — 그대로 받으면 깨지는 것
| 변경 | 문제 |
|---|---|
| `Sense` 모델·`sense` 테이블 폐기, `/sense` API 가 `tasting_notes` 사용 | 실제 sense 40건이 화면에서 사라짐. 데이터 이전 스크립트 없음 |
| `TastingNote` 에 rating(NOT NULL), notes, clarity, color… 컬럼 추가 | 실제 DB 에 그 컬럼 없음 (sync 스크립트도 안 만듦) → `/sense`, `/sool/:id/summary` 500 |
| `main.py` 에서 `/health`, `/ready` 삭제 | **허브 계약 `GET /api/proxy/ready` 깨짐** |
| sool POST/PUT/DELETE 에서 `require_admin` 제거 | 누구나 술 데이터 수정·삭제 가능 |
| CORS `allow_origins=["*"]` + credentials, `create_all` 을 import 시 실행 | 보안/운영 |
| `core/config.py`(pydantic_settings) 부활 | 패키지 미설치 문제 재발 가능 |

## 3. origin/main 에서 가져올 만한 것
- 프론트 전체 UI 개편 (페이지 디자인)
- `/sool/filter`: "탁주" 선택 시 막걸리 포함, "전체 지역" 처리
- `/sool/stats` 에 `flavor_stats`(카테고리별 맛 평균) 추가 — 기존 키는 유지되므로 허브 계약 안 깨짐
- 새 파일: `backend/enrich_sool_data.py` (category Unknown 정리에 참고), `create_admin_direct.py`, `docs/runbooks/*`, `RUN_GUIDE.md`
- 버려야 할 것: `.docker_tmp/`, `temp_docker_config/` (도커 캐시가 커밋됨), `test_db_conn.py`

## 4. 제안하는 병합 방식
1. **백엔드 / 인프라 = 우리 쪽 유지** (DB 실제 스키마, 쿠키 인증, require_admin, /ready, compose, Dockerfile, next.config, proxy route)
   - 위 3장의 filter·stats 개선만 손으로 이식
2. **프론트 페이지 = 저쪽 UI 채택 후 우리 API 방식 다시 적용**
   - 각 페이지를 origin 버전으로 가져온 뒤 `API_URL`/`/proxy/`/localStorage 토큰/Authorization 헤더 → `API_BASE` + 쿠키 + `useAuth()` 로 교체
   - 저쪽 페이지가 TastingNote 새 필드(rating, notes 등)를 쓰면 우리 sense 스키마 필드로 맞춤
   - `lib/auth.ts` 는 계속 삭제 (AppShellProvider 는 5장 참고)
3. 도커 캐시 폴더·`test_db_conn.py` 삭제, `.gitignore` 에 추가
4. `next build` + 운영 compose 로 검증 → 브라우저 클릭 테스트 요청

## 5. 실제 처리 결과 (병합 staged, 커밋 전)
- 백엔드/인프라: 우리 쪽 유지. `api/sool.py` 에만 이식 → filter(탁주=탁주+막걸리, "전체 지역"), stats `flavor_stats`
  - `flavor_stats` 는 sense(사용자 노트) 기준. **현재 빈 배열** — sense 가 달린 술이 전부 category NULL 이라서 (데이터 품질 과제와 연결)
- 프론트: 저쪽 UI 22개 파일 채택 후 `API_BASE`/쿠키/`useAuth()` 로 교체
  - `AppShellProvider` 는 검색어·사이드바 상태만 남기고 복원 (인증 코드 제거)
  - `/Tasting` 은 `v2/tasting/note/all`(관리자 노트) → `/sense/`(내 노트) 로 수정 (표시 필드가 sense 필드)
  - `/sense/new` 술 검색: 미등록 `/v2/sool/suggest` → `/sool/filter?q=`
  - 이미지: `assetUrl()` 사용, antd v6 타입 오류 3건 수정, 헤더 드롭다운 메뉴(Profile/Analytics/Admin) 이동 연결
- 버림: `.docker_tmp/`, `temp_docker_config/`, `test_db_conn.py`, `backend/create_admin_direct.py`(admin 비번 admin1234 하드코딩),
  README 의 관리자 계정/비번 공개 부분
- compose: 프론트 포트 `${FRONT_BIND:-127.0.0.1}:${FRONT_PORT:-3300}:3000`, `.env.example` 설명 추가
- 검증 (운영 compose, 맥): tsc 통과·이미지 빌드 성공 / 외부 포트는 127.0.0.1:3300 만 / 페이지 14개 200 /
  ready·build·stats 200 / signup→login(쿠키)→me→sense 작성→일반유저 sool 생성·users/all 403→logout→401 /
  테스트 계정·노트 삭제 (users 2, sense 40, tasting_notes 6, sool 1,250 원상태)

## 6. 브라우저 클릭 테스트 체크리스트 (http://localhost:3300)
- [ ] 홈: 목록·이미지·검색(헤더 검색창)·카테고리 "탁주"·지역 필터·정렬·페이지 이동
- [ ] 술 상세 `/sool/<id>`: 정보·레이더·노트 목록, 로그인 후 노트 작성
- [ ] 로그인 / 로그아웃, 헤더에 사용자명, 드롭다운 메뉴 이동
- [ ] `/sense/new`: 술 검색 → 저장 → `/Tasting` 에 내 노트 표시
- [ ] `/dashboard`, `/updates`, `/community`, `/profile`
- [ ] 관리자(admin@sool.com): 사이드바 Admin Console, 사용자 관리, 술 추가/수정/삭제, `/admin/tasting/*`
- 테스트로 만든 데이터는 알려주면 지움
