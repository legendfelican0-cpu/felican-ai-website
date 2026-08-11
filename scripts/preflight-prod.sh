#!/usr/bin/env bash
# Read-only pre-flight for the production promotion. Changes nothing.
#
# Answers the two questions that decide whether `deploy to-prod` is safe:
#
#   1. Are the Resend contact variables present in the prod ai.env? Without
#      them the contact form returns 503 and tells visitors to email instead.
#
#   2. Does the felican.ai proxy host use nginx-proxy-manager "custom
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
SSH=(ssh -o BatchMode=yes -o ConnectTimeout=15 "${PROD_HOST}")

say() { printf '\n\033[1m%s\033[0m\n' "$*"; }
ok()   { printf '  \033[32mOK\033[0m    %s\n' "$*"; }
warn() { printf '  \033[33mCHECK\033[0m %s\n' "$*"; }
bad()  { printf '  \033[31mSTOP\033[0m  %s\n' "$*"; }

say "1. Contact email configuration on prod"
env_out="$("${SSH[@]}" "sudo -n grep -E '^(RESEND_API_KEY|CONTACT_TO|CONTACT_FROM)=' /opt/felicanai-site/config/ai.env 2>/dev/null | sed -E 's/=.*/=<set>/'" || true)"
for key in RESEND_API_KEY CONTACT_TO CONTACT_FROM; do
  if grep -q "^${key}=" <<<"${env_out}"; then ok "${key} is set"
  else bad "${key} is MISSING — add it before promoting, or the contact form returns 503"; fi
done

say "2. felican.ai proxy routing"
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
  echo "  CHECK  more than one 'set \$server' line: the deploy sed would rewrite them all."
  echo "         Back up the conf first:"
  echo "           sudo cp -p ${conf} ${conf}.before-promotion"
  echo "         If path apps break afterwards, restore with:"
  echo "           sudo cp -p ${conf}.before-promotion ${conf} && sudo docker exec nginx-proxy-manager nginx -s reload"
else
  echo "  OK     single forward target: the deploy sed affects only the site route."
fi
REMOTE

say "3. Path apps that must still work after promotion"
for p in /relay /quorum /ora /factory /Lehem-Felican-Jr /Lee-Felican-jr/books/resources/; do
  code="$(curl -sS -o /dev/null -L --max-time 12 -w '%{http_code}' "https://felican.ai${p}" 2>/dev/null || echo ERR)"
  printf '  %-34s %s\n' "${p}" "${code}"
done
echo
echo "  Re-run this section after promoting. Any path that changes from 200 to 404"
echo "  means the sed caught a custom location; restore the conf backup above."

say "4. tawk.to live chat"
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
