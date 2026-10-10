# 인프라·개발 환경 방향 (2026-10-09)

## 1. 실측: sool 이 실제로 쓰는 자원 (맥 운영 compose, 대기 상태)
| 컨테이너 | 메모리 | 이미지 |
|---|---|---|
| frontend (Next standalone) | 77 MB | 304 MB |
| backend (uvicorn ×2) | 260 MB | 1.1 GB |
| mariadb (sool 1,250행) | 156 MB | — |
| **합계** | **약 0.5 GB** | |

→ 서비스 운영 자체는 이 서버에서 전혀 문제 없음. **부담은 "실행"이 아니라 "빌드"**.

## 2. 기기별 판단

### 리눅스 서버 (ideapad 320) — 운영 전용
- i5-7200U 2코어/4스레드, RAM 7GB(가용 6.3GB), swap 4GB, 디스크 102GB 여유
- 운영: 여유 충분. 허브 + collector + sool(0.5GB) 합쳐도 RAM 1.5GB 이하로 예상
- 빌드: `next build` 는 2코어에서 수 분, 피크 메모리 1.5~2.5GB → 가능하지만 느리고, 빌드 동안 허브 응답이 느려질 수 있음
- uvicorn `--workers 2` 는 2코어에 맞는 값 (늘리지 말 것)
- GPU(HD 620)는 연산용으로 못 씀 → **로컬 ML 학습·LLM 추론은 이 서버에서 하지 않음**
- 노트북을 서버로 쓸 때 위험 요소
  - 디스크 1개 → 백업은 반드시 외부로 (rclone 구글드라이브, 계획대로)
  - 덮개 닫힘·절전: `HandleLidSwitch=ignore` 확인
  - 정전/재부팅: 컨테이너 `restart: unless-stopped` 있음. 단 `FRONT_BIND=Tailscale IP` 면 tailscale 이 늦게 뜰 때 프론트 시작 실패 가능 → 배포 때 재부팅 테스트 필수
  - 컨테이너 로그가 끝없이 쌓임 → **로그 크기 제한 필요** (아래 4장)
- Ubuntu 26.04 + 커널 7.0 은 매우 최신 → `get.docker.com` 이 26.04 를 아직 지원 안 하면 실패할 수 있음. 실패 시 `apt install docker.io docker-compose-v2` 로 대체

### 맥북 15 (i7 4코어/8스레드, 16GB) — 주 개발 + 빌드 머신
- 3대 중 가장 강함. 부하 평균 3 수준으로 여유
- Docker 개발 환경(dev compose)은 이 기기에서 돌리는 걸 기본으로

### 맥북 13 (i5 2코어, 16GB, 배터리 "Service Recommended") — 가벼운 작업용
- **실측 부하 평균 11~37** (2코어 기준 5~18배 과부하). 원인 1위는 Docker VM(CPU 136%), 그다음 Chrome·IntelliJ
- 지금 이 맥으로 Docker 스택 + 빌드 + IDE + 브라우저를 다 돌리는 건 무리
- 용도: 코드 편집, Claude 세션, 문서. Docker 는 필요할 때만 켜고 끄기
- 배터리 상태가 나빠서 전원 연결 상태로 사용 권장

### 공통 주의: macOS 13.7 + Intel
- Docker Desktop 새 버전은 오래된 macOS 지원을 순차 종료함 → 지금 버전(28.0.1) 유지하거나, 막히면 Colima 로 전환
- 맥(Intel)과 서버 모두 **amd64** → 맥에서 만든 이미지를 서버에서 그대로 실행 가능 (크로스 빌드 불필요)

## 3. 개발 흐름 제안

```
[맥북15/13] 코드 수정 → dev compose 로 확인 → commit/push
        ↓
[서버] ./ops/deploy.sh <브랜치>   (git pull → 빌드 → /api/proxy/ready 확인)
```

- 서버에서는 코드 직접 수정 금지. `.env`·백업 파일만 서버 고유
- 단계별 확장 (필요해질 때만)
  1. 지금: 서버에서 빌드 (`deploy.sh`) — 단순, 몇 분 느린 것은 감수
  2. 빌드가 거슬리면: 맥북15 에서 이미지 빌드 → GHCR(GitHub 이미지 저장소) push → 서버는 pull 만
     (서버 빌드 부하 제거, 롤백은 이미지 태그만 바꾸면 됨)
  3. 다듬기가 길어지면: 서버에 staging 스택 하나 더 (`-p sool-staging`, 포트 3301). 메모리 여유 충분

## 4. 배포 전에 compose 에 넣을 것 (제안)
- 로그 제한: 모든 서비스에 `logging: {driver: json-file, options: {max-size: "10m", max-file: "3"}}`
- 메모리 상한: backend 768m, frontend 512m, db 768m 정도 → 하나가 폭주해도 허브·collector 보호
- MariaDB: 데이터가 작으므로 기본값으로 충분 (`innodb_buffer_pool_size` 튜닝 불필요)

## 5. 기능 개발 방향 (서버 성능 기준)
- 잘 맞는 것: 통계 API, 작은 pandas 분석, 코사인 유사도 추천(1,250개는 즉시 계산), 야간 cron 배치(카테고리 정리, 통계 미리 계산, 백업)
- 피할 것: 서버에서 모델 학습, 로컬 LLM, 무거운 이미지 처리
- category Unknown 1,248건 정리처럼 무거운 작업은 **맥에서 1회 처리 → 결과를 DB 에 반영**하거나, LLM 이 필요하면 외부 API 사용
