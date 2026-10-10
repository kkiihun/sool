# 리눅스 서버 배포 계획 (2026-10-10)

> 기준 문서: `docs/runbooks/2026-10-09-migration-plan.md` (1장), `docs/decisions/2026-10-09-infra-and-dev-workflow.md`
> 이 문서는 위 계획을 코드 분석으로 다시 검토하고, **배포 전에 고쳐야 할 것**과 **단계별 실행 순서·검증 기준**을 정리한 것.

---

## 0. 현재 상태 요약

| 항목 | 상태 |
|---|---|
| 브랜치 | `fix/service-ready`, origin/main 병합 **staged·미커밋** (`.git/MERGE_HEAD` 있음) |
| 미추적 문서 | `docs/decisions/2026-10-09-*`, `docs/runbooks/2026-10-09-*`, `docs/worklog/2026-10-09*` → 병합 커밋에 함께 넣을지 결정 |
| 데이터 원본 | 맥13 Docker 볼륨 `sool_sool_mariadb_data` 하나뿐 |
| 서버 | Ubuntu 26.04, i5-7200U 2C/4T, RAM 7GB, Tailscale IP `100.125.79.96`, 사용자 `badakaya` |

## 1. 아키텍처 (배포 후)

```
[tailnet 기기 브라우저]
      │ http://100.125.79.96:3300
      ▼
 sool-frontend (Next standalone, :3000)   ← 유일하게 호스트에 노출된 포트
      │  /api/proxy/*  → http://backend:8000  (쿠키 전달, same-origin)
      ▼
 sool-backend (uvicorn ×2, :8000)          ← 외부 미노출
      │
      ▼
 sool-mariadb (10.11, volume sool_mariadb_data)  ← 외부 미노출
```

- same-origin 구조라 CORS·쿠키 도메인 문제 없음. `COOKIE_SECURE=false` 유지 (HTTP·tailnet 전용)
- 허브 계약: `/api/proxy/ready`, `/api/build`, `/api/proxy/sool/stats`, `backups/sool-YYYYMMDD-HHMMSS.sql.gz`

## 2. 코드 분석 결과 — 배포 전에 고칠 것

### 🔴 필수 (안 고치면 배포가 실패하거나 재부팅 후 죽음)

**B1. `ops/deploy.sh` 헬스체크가 항상 실패함**
- `curl http://localhost:${FRONT_PORT}/api/proxy/ready` 로 확인하는데, 운영은 `FRONT_BIND=100.125.79.96` 이라 **localhost 에는 포트가 안 열림** → 30회 재시도 후 `exit 1`
- 또 스크립트가 `.env` 를 읽지 않아 `FRONT_PORT` 를 바꿔도 반영 안 됨
- 수정안:
  ```bash
  set -a; source .env; set +a
  HOST="${FRONT_BIND:-127.0.0.1}"; [ "$HOST" = "0.0.0.0" ] && HOST=127.0.0.1
  curl -sf "http://${HOST}:${FRONT_PORT:-3300}/api/proxy/ready"
  ```
- 같은 이유로 허브/collector 가 서버 내부에서 sool 을 찌를 때도 `localhost` 가 아니라 Tailscale IP 를 써야 함 → 허브 설정 확인

**B2. 재부팅 시 Tailscale IP 바인딩 실패**
- 부팅 순서상 docker 가 tailscaled 보다 먼저 컨테이너를 올리면 `100.125.79.96` 이 아직 없어 frontend 포트 바인딩 실패 → 컨테이너가 안 뜸 (restart 정책으로도 복구 안 되는 경우 있음)
- 수정안 (택1, **추천: ①**)
  1. 커널 옵션으로 "아직 없는 IP 에도 바인드 허용"
     ```bash
     echo 'net.ipv4.ip_nonlocal_bind=1' | sudo tee /etc/sysctl.d/99-sool.conf && sudo sysctl --system
     ```
  2. docker 를 tailscale 뒤에 띄우기: `sudo systemctl edit docker` →
     `[Unit]\nAfter=tailscaled.service\nWants=tailscaled.service` (단, tailscaled 기동 ≠ IP 할당 완료라 100% 보장은 아님)
- 어느 쪽이든 **재부팅 테스트로 검증** (5단계)

### 🟡 권장 (배포 커밋에 같이 넣기)

**R1. 로그 크기 제한·메모리 상한** (2026-10-09 결정 문서 4장 그대로)
```yaml
x-logging: &logging
  driver: json-file
  options: { max-size: "10m", max-file: "3" }

services:
  db:       { logging: *logging, mem_limit: 768m }
  backend:  { logging: *logging, mem_limit: 768m }
  frontend: { logging: *logging, mem_limit: 512m }
```
- 대안: `/etc/docker/daemon.json` 에 전역 로그 제한 (서버의 다른 컨테이너 — 허브·collector — 도 같이 보호). **둘 다 하는 걸 추천**

**R2. `.env` 권한** — 서버에서 `chmod 600 .env`

**R3. backend 이미지 슬림화 (나중에 해도 됨)**
- `build-essential` 설치 → 1.1GB. pymysql·bcrypt·pandas 는 wheel 이 있어 컴파일러 불필요할 가능성 높음 → 제거 후 빌드 확인하면 서버 빌드 시간·디스크 절약
- `matplotlib`·`seaborn` 은 report 기능에서만 사용. 유지

### 🟢 확인만 (문제 없음)
- 런타임에 파일을 쓰는 곳: `report_generator.py` 는 메모리 버퍼(BytesIO), `update_logger.py` 는 **어디서도 호출 안 됨** → 컨테이너 재생성해도 잃는 파일 없음. 백업 대상은 DB 하나뿐
- 테이블 생성: startup 의 `create_all` (Alembic 은 사실상 미사용). 복원 순서상 **빈 테이블 생성 → restore 덮어쓰기**라 문제 없음 (덤프에 `DROP TABLE IF EXISTS` 포함)
- 프론트에 `localhost:8000` 하드코딩 없음 (전부 `/api/proxy` 경유)
- `ops/*.sh` 실행 권한(755) git 에 기록돼 있음
- amd64 ↔ amd64 라 이미지 호환 문제 없음

## 3. 실행 순서

### 1단계 — 맥13: 기준점 만들기 (약 20분)
1. B1 수정 + R1 compose 반영
2. 맥에서 운영 compose 재검증
   ```bash
   docker compose up -d --build && ./ops/deploy.sh   # 로컬은 FRONT_BIND=127.0.0.1
   docker stats --no-stream                          # mem_limit 적용 확인
   docker inspect sool-backend --format '{{.HostConfig.LogConfig}}'
   ```
3. 미추적 docs 포함 여부 결정 → 병합 커밋 → `git tag v0.1-mvp` → `git push origin fix/service-ready --tags`
4. `./ops/backup.sh` → 파일 크기·`zcat | head` 로 내용 확인 (sool 1,250행 포함 여부: `zcat … | grep -c 'INSERT INTO \`sool\`'`)

### 2단계 — 서버: 기반 설치 (sudo, 사용자 직접, 약 15분)
```bash
# Docker (26.04 미지원으로 실패 시 두 번째 줄)
curl -fsSL https://get.docker.com | sudo sh
# sudo apt install -y docker.io docker-compose-v2
sudo usermod -aG docker $USER            # → 재로그인
docker compose version                   # v2 확인

# 전역 로그 제한 (R1 대안/보강)
echo '{"log-driver":"json-file","log-opts":{"max-size":"10m","max-file":"3"}}' | sudo tee /etc/docker/daemon.json
sudo systemctl restart docker

# B2 — 없는 IP 바인드 허용
echo 'net.ipv4.ip_nonlocal_bind=1' | sudo tee /etc/sysctl.d/99-sool.conf && sudo sysctl --system

# 덮개 닫아도 동작
sudo sed -i 's/^#\?HandleLidSwitch=.*/HandleLidSwitch=ignore/' /etc/systemd/logind.conf
sudo sed -i 's/^#\?HandleLidSwitchExternalPower=.*/HandleLidSwitchExternalPower=ignore/' /etc/systemd/logind.conf
sudo systemctl restart systemd-logind     # (SSH 세션 끊길 수 있음)

sudo systemctl enable docker tailscaled
```

### 3단계 — 서버: 앱 배포 (약 15~25분, 대부분 빌드)
```bash
git clone -b fix/service-ready https://github.com/kkiihun/sool.git ~/sool && cd ~/sool
cp .env.example .env && chmod 600 .env
#   DB_PASSWORD / MYSQL_ROOT_PASSWORD : openssl rand -hex 16  (맥 값 재사용 금지)
#   SECRET_KEY                        : openssl rand -hex 32
#   FRONT_BIND=100.125.79.96
./ops/deploy.sh fix/service-ready
```
- 빌드 중 `htop` 으로 메모리 관찰 (`next build` 피크 1.5~2.5GB 예상, swap 4GB 있음)
- 빌드가 OOM 으로 죽으면 → 맥15 에서 이미지 빌드 후 GHCR pull 방식(결정 문서 3장 2단계)으로 전환

### 4단계 — 데이터 복원 + 검증 (약 10분)
```bash
# 맥13
scp backups/sool-YYYYMMDD-HHMMSS.sql.gz badakaya:~/sool/backups/
# 서버
./ops/restore.sh backups/sool-YYYYMMDD-HHMMSS.sql.gz
```
검증 체크리스트 (tailnet 기기에서):
- [ ] `curl http://100.125.79.96:3300/api/proxy/ready` → `{"ok":true,"db":"ok"}`
- [ ] `curl …/api/build` → branch `fix/service-ready`, sha 가 `v0.1-mvp` 커밋과 일치
- [ ] `curl …/api/proxy/sool/stats` → 총 건수 맥과 동일
- [ ] 서버 외부(LAN 다른 기기, tailnet 아님)에서 `:3300`·`:8000`·`:3306` 접속 **안 됨** 확인
- [ ] 브라우저 클릭 테스트: merge-plan 6장 체크리스트 (로그인·쿠키, 관리자 403, 시음 CRUD, sense, 대시보드)
- [ ] 테스트로 만든 데이터 삭제

### 5단계 — 운영 자동화 + 재부팅 테스트 (약 20분)
1. rclone 설정 (`rclone config` → `ggdrive` 리모트, 사용자 직접 브라우저 인증)
2. crontab (`crontab -e`) — 절대경로 사용:
   ```
   0 3 * * * /home/badakaya/sool/ops/backup.sh >> /home/badakaya/sool/backups/backup.log 2>&1 && rclone copy /home/badakaya/sool/backups ggdrive:sool-backup --include 'sool-*.sql.gz'
   ```
   - 먼저 `mkdir -p ~/sool/backups` (없으면 `>> backups/backup.log` 리다이렉트가 스크립트 실행 전에 실패)
   - 즉시 1회 수동 실행해서 구글드라이브에 파일 올라가는지 확인
   - 주의: `backup.sh` 는 14일 지난 로컬 파일만 지움. 드라이브 쪽은 `rclone copy` 라 계속 쌓임 (용량 작아서 당분간 OK)
3. **재부팅 테스트**: `sudo reboot` → 2~3분 후 tailnet 기기에서 `/api/proxy/ready` 200 확인, `docker compose ps` 3개 모두 Up
4. **복원 리허설** (권장): 백업 파일로 `-p sool-restore-test` 스택에 복원해 보고 삭제 → "백업이 실제로 복원되는지" 증명 (포트폴리오 문서 소재로도 좋음)

### 6단계 — 마무리
- `docs/worklog/2026-10-10.md` 작성
- 메모리/문서 갱신: 배포 완료, 서버 경로 `~/sool`, 배포 명령

## 4. 롤백
| 상황 | 조치 |
|---|---|
| 새 배포가 헬스체크 실패 | `git checkout v0.1-mvp && docker compose up -d --build` |
| 데이터 손상 | `./ops/restore.sh backups/<직전 백업>` (복원 전 현재 상태도 `backup.sh` 로 한 번 떠두기) |
| 서버 자체 고장 | 구글드라이브 백업 + git clone 으로 맥15 에서 동일 절차 |

## 5. 배포 이후 (이번 범위 밖)
1. `main` 으로 병합하고 서버도 `main` 추적으로 전환 (`deploy.sh` 기본값이 main)
2. GHCR 이미지 배포 전환 (서버 빌드 부하 제거)
3. 공개 단계: 도메인 + Caddy(자동 HTTPS) 또는 Cloudflare Tunnel, `COOKIE_SECURE=true`, `FRONT_BIND=127.0.0.1` + 프록시
4. 간단 모니터링: 허브에서 `/api/proxy/ready` 주기 체크 + 백업 실패 알림

## 6. 시간 추정
1~4단계 약 1.5시간 (빌드 시간 변동 큼), 5단계 20~30분. sudo·rclone 인증·브라우저 테스트는 사용자 직접.
