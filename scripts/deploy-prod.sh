#!/usr/bin/env bash
set -Eeuo pipefail

readonly PROD_HOST="legend@178.156.205.104"
readonly DEV_HOST="legend@ssh.felican.dev"
readonly DEV_CONTAINER="felicanai"
# The container name is whatever the root route forwards to, read on the box
# at deploy time (it was "felicanai-site" on prod while this said "felicanai";
# the script then rebuilt an unrouted container and swapped nothing).
readonly PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
readonly SOURCE_COMMIT="$(git -C "${PROJECT_ROOT}" rev-parse HEAD)"
readonly RELEASE_ID="$(date -u +%Y%m%dT%H%M%SZ)"
readonly RELEASE_IMAGE="felicanai-site:${RELEASE_ID}"
readonly CURRENT_IMAGE="felicanai-site:latest"
readonly REMOTE_ROOT="/opt/felicanai-site"
readonly RELEASE_DIR="${REMOTE_ROOT}/releases/${RELEASE_ID}"
readonly PROD_VAPI_PRIVATE_ENV="${FELICAN_PROD_VAPI_PRIVATE_ENV:-/etc/felican/cops-voice.env}"
readonly PROD_VAPI_ASSISTANT_NAME="Felican AI Website Voice (PROD)"

log() { printf '[felicanai-prod] %s\n' "$*"; }
fail() { printf '[felicanai-prod] ERROR: %s\n' "$*" >&2; exit 1; }
on_error() { local code=$?; printf '[felicanai-prod] ERROR: failed on line %s (exit %s); canonical rollback will run\n' "${BASH_LINENO[0]}" "${code}" >&2; exit "${code}"; }
trap on_error ERR

[[ "${FELICAN_CANONICAL_DEPLOY:-}" == "1" ]] || fail "run through the canonical deploy CLI"

dev_commit="$(ssh -o BatchMode=yes -o ConnectTimeout=15 "${DEV_HOST}" "sudo -n docker inspect -f '{{ index .Config.Labels \"felican.commit\" }}' '${DEV_CONTAINER}'")"
[[ -n "${dev_commit}" && "${dev_commit}" == "${SOURCE_COMMIT}" ]] || fail "DEV is not running the exact local commit ${SOURCE_COMMIT}"

dev_image="$(ssh -o BatchMode=yes -o ConnectTimeout=15 "${DEV_HOST}" "sudo -n docker inspect -f '{{.Config.Image}}' '${DEV_CONTAINER}'")"
[[ -n "${dev_image}" ]] || fail "could not resolve the verified DEV image"

log "staging the production Vapi provisioner"
ssh -o BatchMode=yes -o ConnectTimeout=15 "${PROD_HOST}" \
  "sudo -n install -d -m 0755 '${RELEASE_DIR}/scripts'"
rsync -az --rsync-path="sudo -n rsync" \
  -e "ssh -o BatchMode=yes -o ConnectTimeout=15" \
  "${PROJECT_ROOT}/scripts/provision-felican-vapi.py" "${PROJECT_ROOT}/scripts/npm-route.py" \
  "${PROD_HOST}:${RELEASE_DIR}/scripts/"

log "promoting verified DEV image for commit ${SOURCE_COMMIT}"
ssh -o BatchMode=yes -o ConnectTimeout=15 "${DEV_HOST}" "sudo -n docker save '${dev_image}'" \
  | ssh -o BatchMode=yes -o ConnectTimeout=15 "${PROD_HOST}" "sudo -n docker load >/dev/null"

ssh -o BatchMode=yes -o ConnectTimeout=15 "${PROD_HOST}" \
  "sudo -n bash -s -- '${dev_image}' '${RELEASE_IMAGE}' '${CURRENT_IMAGE}' '${REMOTE_ROOT}' '${SOURCE_COMMIT}' '${RELEASE_ID}' '${RELEASE_DIR}' '${PROD_VAPI_PRIVATE_ENV}' '${PROD_VAPI_ASSISTANT_NAME}'" <<'REMOTE'
set -Eeuo pipefail
dev_image="$1"; release_image="$2"; current_image="$3"; remote_root="$4"; source_commit="$5"; release_id="$6"; release_dir="$7"; vapi_private_env="$8"; vapi_assistant_name="$9"
site_container="$(python3 "${release_dir}/scripts/npm-route.py" current)"
[[ -n "${site_container}" ]] || { echo "could not read the felican.ai route target" >&2; exit 1; }
state_dir="${remote_root}/state"
config_dir="${remote_root}/config"
orders_dir="${remote_root}/orders"
install -d -m 0700 "${state_dir}" "${config_dir}"
install -d -m 0700 -o 1000 -g 1000 "${orders_dir}"

docker tag "${dev_image}" "${release_image}"
docker tag "${release_image}" "${current_image}"

ai_env="${config_dir}/ai.env"
merge_env_keys() {
  local source_file="$1" pattern="$2" target_file="$3" line key
  touch "${target_file}"
  while IFS= read -r line; do
    key="${line%%=*}"
    sed -i -E "/^${key}=/d" "${target_file}"
    printf '%s\n' "${line}" >> "${target_file}"
  done < <(grep -E "${pattern}" "${source_file}" || true)
  chmod 0600 "${target_file}"
}

if ! grep -Eq '^ANTHROPIC_API_KEY=.+' "${ai_env}" 2>/dev/null && ! { grep -Eq '^ASHER_API_KEY=.+' "${ai_env}" 2>/dev/null && grep -Eq '^ASHER_BASE_URL=.+' "${ai_env}" 2>/dev/null; }; then
  for candidate in /var/www/betiq/.env.local /var/www/fruit/api/.env /opt/fruit/api/.env /opt/felican-factory/.env.local; do
    if [[ -r "${candidate}" ]] && grep -Eq '^(ASHER_API_KEY|ANTHROPIC_API_KEY)=.+' "${candidate}"; then
      merge_env_keys "${candidate}" '^(ASHER_API_KEY|ASHER_BASE_URL|ASHER_MODEL|ANTHROPIC_API_KEY|ANTHROPIC_MODEL|RESEND_API_KEY)=' "${ai_env}"
      break
    fi
  done
fi
if ! grep -Eq '^ANTHROPIC_API_KEY=.+' "${ai_env}" && ! { grep -Eq '^ASHER_API_KEY=.+' "${ai_env}" && grep -Eq '^ASHER_BASE_URL=.+' "${ai_env}"; }; then
  echo "production AI provider configuration is unavailable" >&2
  exit 1
fi

if ! grep -Eq '^RESEND_API_KEY=.+' "${ai_env}" 2>/dev/null; then
  for candidate in /var/www/betiq/.env.local /var/www/fruit/api/.env /opt/fruit/api/.env /opt/felican-factory/.env.local; do
    if [[ -r "${candidate}" ]] && grep -Eq '^RESEND_API_KEY=.+' "${candidate}"; then
      merge_env_keys "${candidate}" '^RESEND_API_KEY=' "${ai_env}"
      break
    fi
  done
fi

if [[ ! -r "${vapi_private_env}" ]] || ! grep -Eq '^(COPS_VAPI_API_KEY|FINAFLEX_VAPI_API_KEY|VAPI_API_KEY)=.+' "${vapi_private_env}"; then
  echo "production Vapi private API configuration is unavailable" >&2
  exit 1
fi
if ! grep -Eq '^GENERATOR_HANDOFF_SECRET=.{32,}$' "${ai_env}"; then
  echo "production GENERATOR_HANDOFF_SECRET is missing or too short; refusing to break direct post-payment setup" >&2
  exit 1
fi

# Provision a production-only assistant before the existing site is stopped.
# DEV uses a different assistant name, so neither environment can redirect the
# other's voice traffic during a later deployment.
python3 "${release_dir}/scripts/provision-felican-vapi.py" \
  --private-env "${vapi_private_env}" \
  --site-env "${ai_env}" \
  --public-url https://felican.ai \
  --assistant-name "${vapi_assistant_name}"
for key in FELICAN_VAPI_PUBLIC_KEY FELICAN_VAPI_ASSISTANT_ID FELICAN_VAPI_WEBHOOK_SECRET; do
  grep -Eq "^${key}=.+" "${ai_env}" || { echo "production voice configuration is missing ${key}" >&2; exit 1; }
done

# From here on production is being changed. The marker lets rollback-prod.sh
# tell "a deploy got this far" apart from "a gate refused before touching
# anything" — rolling back the latter once stopped the live site (2026-09-08).
printf '%s\n' "${release_id}" > "${state_dir}/in_progress"
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
  --env ORDER_STORE_PATH=/data/starter-pack-orders.json \
  --mount type=bind,src="${orders_dir}",dst=/data \
  "${current_image}"

for attempt in 1 2 3 4 5 6; do
  if docker exec "${site_container}" wget -q -O /dev/null http://127.0.0.1:8080/api/ready; then break; fi
  [[ "${attempt}" != "6" ]] || exit 1
  sleep 2
done

npm_db="/opt/nginx-proxy-manager/data/database.sqlite"
proxy_id="$(python3 "${release_dir}/scripts/npm-route.py" id)"
proxy_conf="/opt/nginx-proxy-manager/data/nginx/proxy_host/${proxy_id}.conf"
previous_route="$(python3 "${release_dir}/scripts/npm-route.py" current)"
printf '%s\n' "${previous_route}" > "${state_dir}/previous_route"

# Recreating under the route's own name means nginx resolves it to the new
# container by itself; the swap below only runs if the names ever differ.
if [[ "${previous_route}" != "${site_container}" ]]; then
  cp -p "${npm_db}" "${state_dir}/npm-database-${release_id}.sqlite"
  cp -p "${proxy_conf}" "${state_dir}/proxy-${proxy_id}-${release_id}.conf"
  python3 "${release_dir}/scripts/npm-route.py" set "${site_container}" >/dev/null
  # Nginx Proxy Manager may emit additional `set $server` lines for custom
  # path applications. Change only the first/main host target.
  sed -i -E '0,/(set \$server[[:space:]]+)"[^"]+";/s//\1"'"${site_container}"'";/' "${proxy_conf}"
  docker exec nginx-proxy-manager nginx -t
  docker exec nginx-proxy-manager nginx -s reload
fi

printf '%s\n' "${release_id}" > "${state_dir}/last_release"
rm -f "${state_dir}/in_progress"
REMOTE

node "${PROJECT_ROOT}/scripts/smoke.mjs" https://felican.ai/ --chat
legacy_status="$(/usr/bin/curl -sS -o /dev/null -w '%{http_code}' https://felican.ai/Lee-Felican-jr/books/resources/)"
[[ "${legacy_status}" == "200" ]] || fail "legacy book resources returned HTTP ${legacy_status}"
log "production site release ${RELEASE_ID} verified; existing OpenWebUI container remains untouched"
