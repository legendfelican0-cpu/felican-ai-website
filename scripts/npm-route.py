#!/usr/bin/env python3
"""The felican.ai root route in Nginx Proxy Manager — read or set its target.

Runs ON the production box. Matches the root host EXACTLY
(domain_names == '["felican.ai"]'): a LIKE '%felican.ai%' here once rewrote
fighter-jet-game, candyshop, chawnkz and cadence too, and committed before
anyone checked the rowcount. Every write here checks the rowcount BEFORE
committing and refuses on anything but exactly one row.

  npm-route.py current                 -> prints the container the route forwards to
  npm-route.py set <container>         -> retargets the DB row (conf + reload stay in bash)
  npm-route.py id                      -> prints the proxy_host id (for its .conf path)
Environment: NPM_DB (default /opt/nginx-proxy-manager/data/database.sqlite).
"""
import os
import sqlite3
import sys

DB = os.environ.get("NPM_DB", "/opt/nginx-proxy-manager/data/database.sqlite")
ROOT = '["felican.ai"]'
WHERE = "is_deleted=0 and domain_names = ?"


def _row(con):
    rows = con.execute(f"select id, forward_host from proxy_host where {WHERE}", (ROOT,)).fetchall()
    if len(rows) != 1:
        raise SystemExit(f"expected exactly one root proxy host for {ROOT}, found {len(rows)}")
    return rows[0]


def main(argv):
    if len(argv) < 2 or argv[1] not in ("current", "set", "id"):
        print(__doc__, file=sys.stderr); return 2
    if argv[1] == "set":
        if len(argv) != 3 or not argv[2].strip():
            print("set needs a container name", file=sys.stderr); return 2
        con = sqlite3.connect(DB)
        _row(con)
        cur = con.execute(f"update proxy_host set forward_host=?, modified_on=datetime('now') where {WHERE}", (argv[2], ROOT))
        if cur.rowcount != 1:
            con.rollback()
            raise SystemExit(f"refusing: update would change {cur.rowcount} rows, not 1")
        con.commit()
        print(argv[2]); return 0
    con = sqlite3.connect(f"file:{DB}?mode=ro", uri=True)
    pid, target = _row(con)
    print(pid if argv[1] == "id" else target); return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
