#!/usr/bin/env bash
# docs/ (작업일지·계획·런북)를 구글드라이브에 올림. 서버에서 실행 (rclone 원격 ggdrive 사용)
#   사용: ./ops/sync-docs.sh          (main 최신 문서를 받아서 업로드)
#   deploy.sh 가 배포 끝에 자동 호출
set -euo pipefail
cd "$(dirname "$0")/.."
REMOTE="${DOCS_REMOTE:-ggdrive:sool-docs}"

command -v rclone >/dev/null || { echo "⚠️  rclone 없음 → 문서 업로드 건너뜀"; exit 0; }
git pull --ff-only -q origin "$(git rev-parse --abbrev-ref HEAD)" || echo "⚠️  git pull 실패 → 현재 문서로 업로드"
# copy: 드라이브에서 직접 추가한 파일은 지우지 않음
rclone copy docs "$REMOTE" --include "*.md"
echo "✅ 문서 업로드: $REMOTE ($(find docs -name '*.md' | wc -l | tr -d ' ')개)"
