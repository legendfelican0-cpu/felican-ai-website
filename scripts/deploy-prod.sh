#!/usr/bin/env bash
set -Eeuo pipefail

readonly PROD_HOST="legend@178.156.205.104"
readonly DEV_HOST="legend@ssh.felican.dev"
readonly DEV_CONTAINER="felicanai"
readonly SITE_CONTAINER="felicanai-site"
readonly PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
readonly SOURCE_COMMIT="$(git -C "${PROJECT_ROOT}" rev-parse HEAD)"
readonly RELEASE_ID="$(date -u +%Y%m%dT%H%M%SZ)"
readonly RELEASE_IMAGE="felicanai-site:${RELEASE_ID}"
readonly CURRENT_IMAGE="felicanai-site:latest"
readonly REMOTE_ROOT="/opt/felicanai-site"

log() { printf '[felicanai-prod] %s\n' "$*"; }
fail() { printf '[felicanai-prod] ERROR: %s\n' "$*" >&2; exit 1; }
on_error() { local code=$?; printf '[felicanai-prod] ERROR: failed on line %s (exit %s); canonical rollback will run\n' "${BASH_LINENO[0]}" "${code}" >&2; exit "${code}"; }
trap on_error ERR

[[ "${FELICAN_CANONICAL_DEPLOY:-}" == "1" ]] || fail "run through the canonical deploy CLI"

dev_commit="$(ssh -o BatchMode=yes -o ConnectTimeout=15 "${DEV_HOST}" "sudo -n docker inspect -f '{{ index .Config.Labels \"felican.commit\" }}' '${DEV_CONTAINER}'")"
[[ -n "${dev_commit}" && "${dev_commit}" == "${SOURCE_COMMIT}" ]] || fail "DEV is not running the exact local commit ${SOURCE_COMMIT}"

dev_image="$(ssh -o BatchMode=yes -o ConnectTimeout=15 "${DEV_HOST}" "sudo -n docker inspect -f '{{.Config.Image}}' '${DEV_CONTAINER}'")"
[[ -n "${dev_image}" ]] || fail "could not resolve the verified DEV image"

log "promoting verified DEV image for commit ${SOURCE_COMMIT}"
ssh -o BatchMode=yes -o ConnectTimeout=15 "${DEV_HOST}" "sudo -n docker save '${dev_image}'" \
  | ssh -o BatchMode=yes -o ConnectTimeout=15 "${PROD_HOST}" "sudo -n docker load >/dev/null"

ssh -o BatchMode=yes -o ConnectTimeout=15 "${PROD_HOST}" \
  "sudo -n bash -s -- '${dev_image}' '${RELEASE_IMAGE}' '${CURRENT_IMAGE}' '${SITE_CONTAINER}' '${REMOTE_ROOT}' '${SOURCE_COMMIT}' '${RELEASE_ID}'" <<'REMOTE'
set -Eeuo pipefail
dev_image="$1"; release_image="$2"; current_image="$3"; site_container="$4"; remote_root="$5"; source_commit="$6"; release_id="$7"
state_dir="${remote_root}/state"
config_dir="${remote_root}/config"
install -d -m 0700 "${state_dir}" "${config_dir}"

docker tag "${dev_image}" "${release_image}"
docker tag "${release_image}" "${current_image}"

ai_env="${config_dir}/ai.env"
if [[ ! -s "${ai_env}" ]]; then
  for candidate in /var/www/betiq/.env.local /var/www/fruit/api/.env /opt/fruit/api/.env /opt/felican-factory/.env.local; do
    if [[ -r "${candidate}" ]] && grep -Eq '^(ASHER_API_KEY|ANTHROPIC_API_KEY)=.+' "${candidate}"; then
      grep -E '^(ASHER_API_KEY|ASHER_BASE_URL|ASHER_MODEL|ANTHROPIC_API_KEY|ANTHROPIC_MODEL)=' "${candidate}" > "${ai_env}"
      chmod 0600 "${ai_env}"
      break
    fi
  done
fi
if ! grep -Eq '^ANTHROPIC_API_KEY=.+' "${ai_env}" && ! { grep -Eq '^ASHER_API_KEY=.+' "${ai_env}" && grep -Eq '^ASHER_BASE_URL=.+' "${ai_env}"; }; then
  echo "production AI provider configuration is unavailable" >&2
  exit 1
fi

backup_container=""
if docker inspect "${site_container}" >/dev/null 2>&1; then
  backup_container="${site_container}-backup-${release_id}"
  docker stop "${site_container}" >/dev/null
  docker rename "${site_container}" "${backup_container}"
fi
printf '%s\n' "${backup_container}" > "${state_dir}/last_backup_container"

docker run -d \
  --name "${site_container}" \
  --restart unless-stopped \
  --read-only \
  --tmpfs /tmp:rw,noexec,nosuid,size=64m \
  --cap-drop ALL \
  --security-opt no-new-privileges:true \
  --memory 768m \
  --cpus 1.5 \
  --pids-limit 128 \
  --log-opt max-size=10m \
  --log-opt max-file=5 \
  --network proxy-network \
  --label felican.environment=prod \
  --label felican.release="${release_image}" \
  --label felican.commit="${source_commit}" \
  --env-file "${ai_env}" \
  "${current_image}"

for attempt in 1 2 3 4 5 6; do
  if docker exec "${site_container}" wget -q -O /dev/null http://127.0.0.1:8080/api/ready; then break; fi
  [[ "${attempt}" != "6" ]] || exit 1
  sleep 2
done

npm_db="/opt/nginx-proxy-manager/data/database.sqlite"
proxy_id="$(python3 - <<'PY'
import sqlite3
con=sqlite3.connect('file:/opt/nginx-proxy-manager/data/database.sqlite?mode=ro', uri=True)
row=con.execute("select id from proxy_host where is_deleted=0 and domain_names like '%felican.ai%'").fetchone()
if not row: raise SystemExit('felican.ai proxy host not found')
print(row[0])
PY
)"
proxy_conf="/opt/nginx-proxy-manager/data/nginx/proxy_host/${proxy_id}.conf"
previous_route="$(python3 - <<'PY'
import sqlite3
con=sqlite3.connect('file:/opt/nginx-proxy-manager/data/database.sqlite?mode=ro', uri=True)
row=con.execute("select forward_host from proxy_host where is_deleted=0 and domain_names like '%felican.ai%'").fetchone()
print(row[0])
PY
)"
printf '%s\n' "${previous_route}" > "${state_dir}/previous_route"

if [[ "${previous_route}" != "${site_container}" ]]; then
  cp -p "${npm_db}" "${state_dir}/npm-database-${release_id}.sqlite"
  cp -p "${proxy_conf}" "${state_dir}/proxy-${proxy_id}-${release_id}.conf"
  python3 - "${site_container}" <<'PY'
import sqlite3, sys
target=sys.argv[1]
con=sqlite3.connect('/opt/nginx-proxy-manager/data/database.sqlite')
with con:
    changed=con.execute("update proxy_host set forward_host=?, modified_on=datetime('now') where is_deleted=0 and domain_names like '%felican.ai%'", (target,)).rowcount
if changed != 1: raise SystemExit(f'unexpected proxy rows changed: {changed}')
PY
  sed -i -E 's/(set \$server[[:space:]]+)"[^"]+";/\1"'"${site_container}"'";/' "${proxy_conf}"
  docker exec nginx-proxy-manager nginx -t
  docker exec nginx-proxy-manager nginx -s reload
fi

printf '%s\n' "${release_id}" > "${state_dir}/last_release"
REMOTE

node "${PROJECT_ROOT}/scripts/smoke.mjs" https://felican.ai/ --chat
legacy_status="$(/usr/bin/curl -sS -o /dev/null -w '%{http_code}' https://felican.ai/Lee-Felican-jr/books/resources/)"
[[ "${legacy_status}" == "200" ]] || fail "legacy book resources returned HTTP ${legacy_status}"
log "production site release ${RELEASE_ID} verified; existing OpenWebUI container remains untouched"
