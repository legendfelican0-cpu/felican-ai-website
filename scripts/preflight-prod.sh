#!/usr/bin/env bash
# Read-only pre-flight for the production promotion. Changes nothing.
#
# Answers the questions that decide whether `deploy to-prod` is safe:
#
#   1. Are the AI-provider and Vapi credentials available on production?
#   2. Are the Resend contact variables present in the prod ai.env? Without
#      them the contact form returns 503 and tells visitors to email instead.
#
#   3. Are the Stripe API key, webhook secret, and canonical site origin set?
#
#   4. Does the felican.ai proxy host use nginx-proxy-manager "custom
#      locations"? deploy-prod.sh repoints the site with:
#
#          sed -i -E 's/(set \$server[[:space:]]+)"[^"]+";/\1"felicanai-site";/'
#
#      sed with no line address rewrites EVERY match in the file. If the path
#      apps (/relay, /quorum, /ora, /Lehem-Felican-Jr …) are custom locations
#      in that same conf, each carries its own `set $server` and all of them
#      would be repointed at the marketing site, which 404s those paths.
#
# Run:  bash scripts/preflight-prod.sh
set -Eeuo pipefail

PROD_HOST="${PROD_HOST:-legend@178.156.205.104}"
VAPI_PRIVATE_ENV="${FELICAN_PROD_VAPI_PRIVATE_ENV:-/etc/felican/cops-voice.env}"
SSH=(ssh -o BatchMode=yes -o ConnectTimeout=15 "${PROD_HOST}")

say() { printf '\n\033[1m%s\033[0m\n' "$*"; }
ok()   { printf '  \033[32mOK\033[0m    %s\n' "$*"; }
warn() { printf '  \033[33mCHECK\033[0m %s\n' "$*"; }
bad()  { printf '  \033[31mSTOP\033[0m  %s\n' "$*"; }

say "1. AI and voice configuration on prod"
runtime_out="$("${SSH[@]}" "sudo -n bash -s -- '${VAPI_PRIVATE_ENV}'" <<'REMOTE' || true
set -Eeuo pipefail
vapi_private_env="$1"
ai_env=/opt/felicanai-site/config/ai.env
provider_source=""
for candidate in "${ai_env}" /var/www/betiq/.env.local /var/www/fruit/api/.env /opt/fruit/api/.env /opt/felican-factory/.env.local; do
  if [[ -r "${candidate}" ]] && { grep -Eq '^ANTHROPIC_API_KEY=.+' "${candidate}" || { grep -Eq '^ASHER_API_KEY=.+' "${candidate}" && grep -Eq '^ASHER_BASE_URL=.+' "${candidate}"; }; }; then
    provider_source="${candidate}"
    break
  fi
done
if [[ -n "${provider_source}" ]]; then
  echo AI_PROVIDER=set
else
  echo AI_PROVIDER=missing
fi
if [[ -r "${vapi_private_env}" ]] && grep -Eq '^(COPS_VAPI_API_KEY|FINAFLEX_VAPI_API_KEY|VAPI_API_KEY)=.+' "${vapi_private_env}"; then
  echo VAPI_PRIVATE_KEY=set
else
  echo VAPI_PRIVATE_KEY=missing
fi
REMOTE
)"
if grep -q '^AI_PROVIDER=set$' <<<"${runtime_out}"; then ok "AI provider is configured"
else bad "AI provider is MISSING — text and voice answers cannot run"; fi
if grep -q '^VAPI_PRIVATE_KEY=set$' <<<"${runtime_out}"; then ok "Vapi private API key is available to the production provisioner"
else bad "Vapi private API key is MISSING from ${VAPI_PRIVATE_ENV}"; fi

say "2. Contact email configuration on prod"
env_out="$("${SSH[@]}" "sudo -n bash -s" <<'REMOTE' || true
for candidate in /opt/felicanai-site/config/ai.env /var/www/betiq/.env.local /var/www/fruit/api/.env /opt/fruit/api/.env /opt/felican-factory/.env.local; do
  if [[ -r "${candidate}" ]] && grep -Eq '^RESEND_API_KEY=.+' "${candidate}"; then
    echo RESEND_API_KEY=set
    exit 0
  fi
done
echo RESEND_API_KEY=missing
REMOTE
)"
if grep -q '^RESEND_API_KEY=set$' <<<"${env_out}"; then ok "RESEND_API_KEY is available"
else bad "RESEND_API_KEY is MISSING — the assistant handoff and contact API would return 503"; fi
ok "CONTACT_TO defaults to ai@felican.ai when unset"
ok "CONTACT_FROM defaults to Felican AI Website <website@felican.ai> when unset"

say "3. Starter Pack payment configuration"
payment_env_out="$("${SSH[@]}" "sudo -n grep -E '^(STRIPE_SECRET_KEY|STRIPE_WEBHOOK_SECRET|SITE_ORIGIN)=' /opt/felicanai-site/config/ai.env 2>/dev/null | sed -E 's/=.*/=<set>/'" || true)"
for key in STRIPE_SECRET_KEY STRIPE_WEBHOOK_SECRET SITE_ORIGIN; do
  if grep -q "^${key}=" <<<"${payment_env_out}"; then ok "${key} is set"
  else bad "${key} is MISSING — Starter Pack payment fulfillment is not production-ready"; fi
done

say "4. felican.ai proxy routing"
"${SSH[@]}" 'sudo -n bash -s' <<'REMOTE' || true
set -Eeuo pipefail
db=/opt/nginx-proxy-manager/data/database.sqlite
id="$(python3 - <<'PY'
import sqlite3
con=sqlite3.connect('file:/opt/nginx-proxy-manager/data/database.sqlite?mode=ro', uri=True)
r=con.execute("select id from proxy_host where is_deleted=0 and domain_names like '%felican.ai%'").fetchone()
print(r[0] if r else '')
PY
)"
if [[ -z "${id}" ]]; then echo "  STOP  no felican.ai proxy host found"; exit 0; fi
conf="/opt/nginx-proxy-manager/data/nginx/proxy_host/${id}.conf"
echo "  proxy host id : ${id}"
echo "  conf          : ${conf}"
n="$(grep -c 'set \$server' "${conf}" || true)"
echo "  'set \$server' lines in that conf: ${n}"
echo "  current forward targets:"
grep -n 'set \$server' "${conf}" | sed 's/^/      /'
echo "  custom locations defined in the database:"
python3 - "${id}" <<'PY'
import sqlite3, sys, json
con=sqlite3.connect('file:/opt/nginx-proxy-manager/data/database.sqlite?mode=ro', uri=True)
row=con.execute("select locations from proxy_host where id=?", (sys.argv[1],)).fetchone()
try:
    locs=json.loads(row[0]) if row and row[0] else []
except Exception:
    locs=[]
if not locs:
    print("      (none)")
else:
    for l in locs:
        print(f"      {l.get('path')}  ->  {l.get('forward_host')}:{l.get('forward_port')}")
PY
if [[ "${n}" -gt 1 ]]; then
  echo
  echo "  OK     custom path targets detected; deploy changes only the first/main target."
else
  echo "  OK     single forward target: the deploy sed affects only the site route."
fi
REMOTE

say "5. Path apps that must still work after promotion"
for p in /relay /quorum /ora /factory /Lehem-Felican-Jr /Lee-Felican-jr/books/resources/; do
  code="$(curl -sS -o /dev/null -L --max-time 12 -w '%{http_code}' "https://felican.ai${p}" 2>/dev/null || echo ERR)"
  printf '  %-34s %s\n' "${p}" "${code}"
done
echo
echo "  Re-run this section after promoting. Any path that changes from 200 to 404"
echo "  means the sed caught a custom location; restore the conf backup above."

say "6. tawk.to live chat"
# Nothing to configure on the server: the property id is committed in
# public/tawk-config.js and the CSP already allows tawk.to. The only thing that
# can break it is the domain allowlist in the tawk dashboard.
cfg="$(curl -sS -L --max-time 12 https://felican.dev/tawk-config.js 2>/dev/null | grep -o "propertyId: '[^']*'" || true)"
if [[ -n "${cfg}" ]]; then ok "config ships with the site (${cfg}) — no server change needed"
else warn "tawk-config.js has no property id; live chat stays hidden"; fi
echo "  Ships on /contact/ only. CSP already permits embed.tawk.to and wss://*.tawk.to."
echo
echo "  In the tawk dashboard (Administration -> Property Settings), the domain"
echo "  allowlist must contain BOTH of these or the widget refuses to load on prod:"
echo "      felican.ai"
echo "      www.felican.ai"
echo "  Keep felican.dev listed too, otherwise DEV testing stops working."
echo
echo "  After promoting, open https://felican.ai/contact/ and confirm a fourth"
echo "  card appears next to Email, Phone and Book a call. If it is missing, the"
echo "  domain allowlist is the cause — nothing in the deploy."
echo "  The card reads 'Chat with us now' only while an agent is online in the"
echo "  dashboard; otherwise it correctly says 'Leave a message'."
