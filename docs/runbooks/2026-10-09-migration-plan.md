# 이관 계획: 맥13 → (리눅스 서버 운영 / 맥15 개발) (2026-10-09)

## 역할
| 기기 | 역할 | sool 위치 |
|---|---|---|
| 리눅스 (badakaya) | 운영 | `~/sool` (git clone, 운영 compose) |
| 맥15 (집) | 개발 실행 환경 (Docker, 코드, Claude Code) | `~/Documents/project/sool` (git clone, dev compose) |
| 맥13 | 화면/키보드 — IntelliJ Gateway 로 맥15 에 접속 | 코드 없음 (또는 비상용 clone 만) |

데이터 원본은 지금 **맥13 Docker 볼륨** 하나뿐 → 백업 파일 하나로 서버·맥15 둘 다 복원.

## 0. 맥13 — 기준점 만들기
현재 상태: origin/main 병합이 **staged, 커밋 전** (`.git/MERGE_HEAD` 있음). 상세는 `docs/worklog/2026-10-09-merge-plan.md`.

커밋 전에 결정할 것:
- [ ] compose 에 로그 제한 추가 (`logging: json-file, max-size 10m, max-file 3`) — 추천
- [ ] compose 에 메모리 상한 추가 (backend 768m / frontend 512m / db 768m) — 추천
- [ ] 브라우저 클릭 테스트를 맥에서 할지, 서버 배포 후에 할지 (체크리스트: merge-plan 6장)

```bash
git commit                      # 병합 커밋
git tag v0.1-mvp
git push origin fix/service-ready --tags
./ops/backup.sh                 # → backups/sool-YYYYMMDD-HHMMSS.sql.gz
```

## 1. 리눅스 서버 — 운영
```bash
# (sudo, 직접 실행)
curl -fsSL https://get.docker.com | sudo sh     # 실패 시: sudo apt install -y docker.io docker-compose-v2
sudo usermod -aG docker $USER                   # 후 재로그인
sudo sed -i 's/^#\?HandleLidSwitch=.*/HandleLidSwitch=ignore/' /etc/systemd/logind.conf   # 덮개 닫아도 계속 동작

# (일반 사용자)
git clone -b fix/service-ready https://github.com/kkiihun/sool.git ~/sool && cd ~/sool
cp .env.example .env
#   DB_PASSWORD, MYSQL_ROOT_PASSWORD: 새 값 (openssl rand -hex 16)
#   SECRET_KEY: openssl rand -hex 32
#   FRONT_BIND=100.125.79.96
./ops/deploy.sh fix/service-ready
```
데이터:
```bash
# 맥13
scp backups/sool-*.sql.gz badakaya:~/sool/backups/
# 서버
./ops/restore.sh backups/sool-....sql.gz
```
백업 crontab (`crontab -e`):
```
0 3 * * * cd ~/sool && ./ops/backup.sh >> backups/backup.log 2>&1 && rclone copy ~/sool/backups ggdrive:sool-backup
```
확인: 재부팅 후 `curl http://100.125.79.96:3300/api/proxy/ready` (Tailscale 늦게 뜨는 문제 점검)

## 2. 맥15 — 개발
```bash
# 시스템 설정 > 일반 > 공유 > 원격 로그인 켜기, Tailscale 설치·로그인
sudo pmset -c sleep 0 disksleep 0               # 전원 연결 시 잠자기 안 함
git clone https://github.com/kkiihun/sool.git ~/Documents/project/sool
cp .env.example .env                            # 개발용 값
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
./ops/restore.sh backups/sool-....sql.gz        # 맥13 백업 파일 복사해 와서
```
맥13: IntelliJ → Remote Development → SSH → 맥15 (Tailscale 이름) → 프로젝트 열기.
Claude Code 는 맥13 터미널에서 `ssh 맥15` 후 그 안에서 실행.

## 3. 맥13 정리 (서버·맥15 정상 확인 후)
| 대상 | 크기 | 처리 |
|---|---|---|
| `~/Documents/sool` | 8K (빈 폴더 껍데기) | 삭제 |
| `sool/backend/venv` | 323M | 삭제 (Docker 사용) |
| `sool/backend/sool.db`, `backend/db/sool.db` | 512K / 0 | 삭제 (예전 SQLite) |
| `sool/backend/logs/` (2025-12) | 작음 | 삭제 |
| `sool/frontend/node_modules`, `.next` | 621M | 원격 개발이면 삭제 |
| Docker 볼륨 `sool_sool_mariadb_data` | — | 서버 복원 확인 + 백업 파일 보관 후 `docker compose down -v` |
| `project/sool_data` (CSV, git 없음) | 820K | `sool/data/raw` 로 옮길지 결정 |
| `project/sool-docs` | 별도 repo | 유지 |
