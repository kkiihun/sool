#!/usr/bin/env bash
# 서버 배포: 최신 코드 받아서 다시 빌드/기동
#   사용: ./ops/deploy.sh [브랜치]   (기본 main)
set -euo pipefail
cd "$(dirname "$0")/.."

BRANCH="${1:-main}"
[ -f .env ] || { echo "❌ .env 가 없습니다. cp .env.example .env 후 값을 채우세요."; exit 1; }
set -a; source .env; set +a

# 헬스체크 주소: 프론트가 바인딩된 IP (운영은 Tailscale IP 라 localhost 로는 안 열림)
HOST="${FRONT_BIND:-127.0.0.1}"
[ "$HOST" = "0.0.0.0" ] && HOST=127.0.0.1

git fetch origin
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"

export GIT_BRANCH="$BRANCH"
export GIT_SHA="$(git rev-parse --short HEAD)"

docker compose up -d --build --remove-orphans
docker image prune -f >/dev/null

echo "⏳ 기동 확인 중..."
for i in $(seq 1 30); do
  if curl -sf "http://${HOST}:${FRONT_PORT:-3300}/api/proxy/ready" >/dev/null; then
    echo "✅ 배포 완료: ${GIT_BRANCH}@${GIT_SHA}"
    docker compose ps
    ./ops/sync-docs.sh || echo "⚠️  문서 업로드 실패 (배포는 정상)"
    exit 0
  fi
  sleep 2
done
echo "❌ 헬스체크 실패. 로그: docker compose logs --tail=100 backend frontend"
exit 1
