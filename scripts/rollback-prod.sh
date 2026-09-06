#!/usr/bin/env bash
set -Eeuo pipefail

readonly PROD_HOST="legend@178.156.205.104"
readonly REMOTE_ROOT="/opt/felicanai-site"

[[ "${FELICAN_CANONICAL_DEPLOY:-}" == "1" ]] || { printf '[felicanai-prod] ERROR: run through the canonical deploy CLI\n' >&2; exit 1; }

ssh -o BatchMode=yes -o ConnectTimeout=15 "${PROD_HOST}" \
  "sudo -n bash -s -- '${REMOTE_ROOT}'" <<'REMOTE'
set -Eeuo pipefail
remote_root="$1"; state_dir="${remote_root}/state"
release_dir="${remote_root}/releases/$(cat "${state_dir}/last_release")"
site_container="$(python3 "${release_dir}/scripts/npm-route.py" current)"
previous_route="$(cat "${state_dir}/previous_route" 2>/dev/null || true)"
backup_container="$(cat "${state_dir}/last_backup_container" 2>/dev/null || true)"

if [[ -n "${previous_route}" && "${previous_route}" != "${site_container}" ]]; then
  proxy_id="$(python3 "${release_dir}/scripts/npm-route.py" id)"
  proxy_conf="/opt/nginx-proxy-manager/data/nginx/proxy_host/${proxy_id}.conf"
  python3 "${release_dir}/scripts/npm-route.py" set "${previous_route}" >/dev/null
  sed -i -E '0,/(set \$server[[:space:]]+)"[^"]+";/s//\1"'"${previous_route}"'";/' "${proxy_conf}"
  docker exec nginx-proxy-manager nginx -t
  docker exec nginx-proxy-manager nginx -s reload
fi

if docker inspect "${site_container}" >/dev/null 2>&1; then
  docker stop "${site_container}" >/dev/null
  docker rename "${site_container}" "${site_container}-failed-$(date -u +%Y%m%dT%H%M%SZ)"
fi
if [[ -n "${backup_container}" ]] && docker inspect "${backup_container}" >/dev/null 2>&1; then
  docker rename "${backup_container}" "${site_container}"
  docker start "${site_container}" >/dev/null
fi
printf '[felicanai-prod] rollback restored route %s\n' "${previous_route:-unchanged}"
REMOTE
