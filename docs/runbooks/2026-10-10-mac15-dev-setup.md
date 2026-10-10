# 맥15 개발 환경 세팅 (2026-10-10)

## 기기 역할
| 기기 | 역할 | sool 위치 |
|---|---|---|
| 리눅스 `badakaya` | 운영 | `~/sool` (main 추적, `./ops/deploy.sh main`) |
| 맥15 `mac15` (100.99.74.76) | 개발 실행 (Docker dev 스택, 코드) | **`~/sool`** (계획의 `~/Documents/project/sool` 대신 기존 clone 재사용) |
| 맥13 | IntelliJ/터미널로 맥15 SSH 접속 + 비상용 clone | `~/Documents/project/sool` |

SSH 가 안 될 때: 맥13 clone 에서 `git pull` → 수정 → push. 그래서 맥15 작업은 **WIP 라도 자주 push**.

## 맥15 현재 상태
- 접속: 맥13 `ssh mac15` (`~/.ssh/config` 별칭, 백업 `~/.ssh/config.bak-20261010`)
- 코드: `~/sool` = `main@f671ef7` + 미커밋 dev compose 변경(아래)
- `.env`: 비밀값 새로 생성, `COMPOSE_PROJECT_NAME=sool-dev`, `DB_HOST_PORT=3307`
  - 프로젝트명을 바꾼 이유: 예전 볼륨 `sool_sool_mariadb_data`(구 계정·구 DB 설정)와 섞이지 않게
  - 3307 인 이유: Homebrew MySQL 이 3306 사용 중 (`brew services` 로 자동 시작)
- 실행: `docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build`
  - 프론트 http://127.0.0.1:3300 (핫리로드), 백엔드 127.0.0.1:8000, DB 127.0.0.1:3307
  - dev 프론트 메모리 약 1.2GB → dev compose 에서 `mem_limit: 2g`
- 데이터: 맥13 백업 `sool-20261010-114052.sql.gz` 복원 (sool 1,250 / 리뷰 40)

## 예전 맥15 자료 보관 (`~/sool-archive-20261010/`)
| 파일 | 내용 |
|---|---|
| `old-mac15-db.sql.gz` | 4월 볼륨 전체 덤프 (sool 1,215 / tasting_notes 38 / users 0) |
| `old.env` | 예전 `.env` (MYSQL_* 형식) |
| `local-changes.patch` | 예전 미커밋 수정 (import 2줄 삭제). `git stash` 에도 있음 |
- 예전 컨테이너: `sool-*-old-20261010` 로 이름만 변경 (중지 상태). 볼륨 `sool_sool_mariadb_data`, `db-server-mariadb_sool_mariadb_data` 유지
- 정리(삭제)는 확인 후 사용자 결정: `docker rm sool-{mariadb,backend,frontend}-old-20261010` / `docker volume rm sool_sool_mariadb_data`

## 사용자가 직접 할 것
1. GitHub 에 맥15 SSH 키 등록 (Settings → SSH and GPG keys → New SSH key)
   ```
   ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIPffRK0HzTaKJf6rWhHGof6Sjyxhol8SdLC9Ne+vZAvO mac15-github
   ```
   확인: `ssh mac15 'ssh -T git@github.com'` → "Hi kkiihun!" (원격은 이미 `git@github.com:kkiihun/sool.git` 로 변경)
2. 잠자기 방지 (맥15에서): `sudo pmset -c sleep 0 disksleep 0`
3. Docker Desktop: 설정 → General → "Start Docker Desktop when you sign in" 켜기
4. IntelliJ 원격 개발 (맥13): Welcome → Remote Development → SSH → New connection
   `badakaya@100.99.74.76` (키: `~/.ssh/id_ed25519`) → 프로젝트 `/Users/badakaya/sool` → IDE 백엔드는 맥15 에 자동 설치
5. (선택) 맥15 에 Claude Code 설치 → 맥13 에서 `ssh mac15` 후 `cd ~/sool && claude`

## 개발 → 운영 흐름
```
맥15: 브랜치 생성 → 수정 → dev 스택 확인 → push → (PR) → main
서버: ssh badakaya 'cd ~/sool && ./ops/deploy.sh main'
```
