#!/usr/bin/env bash
set -Eeuo pipefail

readonly APP_NAME="felicanai"
readonly DEV_HOST="legend@ssh.felican.dev"
readonly REMOTE_ROOT="/opt/felicanai-site"
readonly PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
readonly RELEASE_ID="$(date -u +%Y%m%dT%H%M%SZ)"
readonly RELEASE_DIR="${REMOTE_ROOT}/releases/${RELEASE_ID}"
readonly IMAGE="felicanai-dev-site:${RELEASE_ID}"
readonly BACKUP_CONTAINER="${APP_NAME}-backup-${RELEASE_ID}"

log() {
  printf '[felicanai-dev] %s\n' "$*"
}

fail() {
  printf '[felicanai-dev] ERROR: %s\n' "$*" >&2
  exit 1
}

on_error() {
  local exit_code=$?
  printf '[felicanai-dev] ERROR: deploy failed on line %s (exit %s)\n' "${BASH_LINENO[0]}" "${exit_code}" >&2
  exit "${exit_code}"
}
trap on_error ERR

[[ -f "${PROJECT_ROOT}/dist/client/index.html" ]] || fail "dist/client is missing; run npm run build first"
[[ -f "${PROJECT_ROOT}/deploy/Dockerfile.dev" ]] || fail "deploy/Dockerfile.dev is missing"
[[ -f "${PROJECT_ROOT}/deploy/nginx.dev.conf" ]] || fail "deploy/nginx.dev.conf is missing"

log "creating immutable DEV release ${RELEASE_ID}"
ssh -o BatchMode=yes -o ConnectTimeout=15 "${DEV_HOST}" \
  "sudo -n install -d -m 0755 '${RELEASE_DIR}/dist/client' '${RELEASE_DIR}/deploy'"

rsync -az --rsync-path="sudo -n rsync" \
  -e "ssh -o BatchMode=yes -o ConnectTimeout=15" \
  "${PROJECT_ROOT}/dist/client/" "${DEV_HOST}:${RELEASE_DIR}/dist/client/"

rsync -az --rsync-path="sudo -n rsync" \
  -e "ssh -o BatchMode=yes -o ConnectTimeout=15" \
  "${PROJECT_ROOT}/deploy/Dockerfile.dev" "${PROJECT_ROOT}/deploy/nginx.dev.conf" \
  "${DEV_HOST}:${RELEASE_DIR}/deploy/"

log "building ${IMAGE} and replacing only the DEV container"
ssh -o BatchMode=yes -o ConnectTimeout=15 "${DEV_HOST}" \
  "sudo -n bash -s -- '${RELEASE_DIR}' '${IMAGE}' '${APP_NAME}' '${BACKUP_CONTAINER}'" <<'REMOTE'
set -Eeuo pipefail
release_dir="$1"
image="$2"
app_name="$3"
backup_container="$4"
old_saved=0

rollback() {
  rc=$?
  echo "[felicanai-dev] remote failure (exit ${rc}); rolling back DEV container" >&2
  if docker inspect "${app_name}" >/dev/null 2>&1; then
    docker stop "${app_name}" >/dev/null 2>&1 || true
    docker rename "${app_name}" "${app_name}-failed-$(date -u +%Y%m%dT%H%M%SZ)" >/dev/null 2>&1 || true
  fi
  if [[ "${old_saved}" == "1" ]] && docker inspect "${backup_container}" >/dev/null 2>&1; then
    docker rename "${backup_container}" "${app_name}"
    docker start "${app_name}"
    echo "[felicanai-dev] previous DEV container restored" >&2
  fi
  exit "${rc}"
}
trap rollback ERR

docker build --pull -f "${release_dir}/deploy/Dockerfile.dev" -t "${image}" "${release_dir}"

if docker inspect "${app_name}" >/dev/null 2>&1; then
  docker stop "${app_name}"
  docker rename "${app_name}" "${backup_container}"
  old_saved=1
fi

docker run -d \
  --name "${app_name}" \
  --restart unless-stopped \
  --label felican.environment=dev \
  --label felican.release="${image}" \
  -p 127.0.0.1:8080:80 \
  "${image}"

for attempt in 1 2 3 4 5 6; do
  if docker exec "${app_name}" wget -q -O /dev/null http://127.0.0.1/; then
    trap - ERR
    echo "[felicanai-dev] container healthy on attempt ${attempt}; rollback container retained as ${backup_container}"
    exit 0
  fi
  sleep 2
done

echo "new container never became healthy" >&2
false
REMOTE

log "DEV release ${RELEASE_ID} is running"
