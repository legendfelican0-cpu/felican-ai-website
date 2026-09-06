import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// The prod route swap once rewrote every host that merely *contained*
// "felican.ai" and committed before checking. This pins the exact-match,
// check-before-commit contract of scripts/npm-route.py against a real sqlite
// file shaped like NPM's proxy_host table.
const SCRIPT = join(process.cwd(), 'scripts', 'npm-route.py'); // jsdom env: import.meta.url is not a file URL

function seedDb() {
  const dir = mkdtempSync(join(tmpdir(), 'npm-route-'));
  const db = join(dir, 'database.sqlite');
  const sql = `
    create table proxy_host (id integer primary key, domain_names text, forward_host text, is_deleted integer default 0, modified_on text);
    insert into proxy_host values (4, '["felican.ai"]', 'felicanai-site', 0, null);
    insert into proxy_host values (6, '["fighter-jet-game.felican.ai"]', 'fighter-jet-game', 0, null);
    insert into proxy_host values (8, '["candyshop.felican.ai"]', 'shop-web', 0, null);
    insert into proxy_host values (9, '["chawnkz.felican.ai"]', 'chawnkz-web', 0, null);
    insert into proxy_host values (10, '["cadence.felican.ai"]', 'cadence', 0, null);
    insert into proxy_host values (11, '["felican.ai"]', 'deleted-old', 1, null);
  `;
  writeFileSync(join(dir, 'seed.sql'), sql);
  execFileSync('python3', ['-c', `import sqlite3,sys; c=sqlite3.connect(sys.argv[1]); c.executescript(open(sys.argv[2]).read()); c.commit()`, db, join(dir, 'seed.sql')]);
  return db;
}
const run = (db, ...args) => execFileSync('python3', [SCRIPT, ...args], { env: { ...process.env, NPM_DB: db } }).toString().trim();
const rows = db => JSON.parse(execFileSync('python3', ['-c', `import sqlite3,json,sys; c=sqlite3.connect(sys.argv[1]); print(json.dumps(c.execute("select id, forward_host from proxy_host order by id").fetchall()))`, db]).toString());

describe('npm-route.py', () => {
  it('reads the root host only', () => {
    const db = seedDb();
    expect(run(db, 'current')).toBe('felicanai-site');
    expect(run(db, 'id')).toBe('4');
  });

  it('retargets exactly the root host and nothing that merely contains felican.ai', () => {
    const db = seedDb();
    expect(run(db, 'set', 'felicanai')).toBe('felicanai');
    expect(rows(db)).toEqual([[4, 'felicanai'], [6, 'fighter-jet-game'], [8, 'shop-web'], [9, 'chawnkz-web'], [10, 'cadence'], [11, 'deleted-old']]);
  });

  it('refuses when the root host is missing or ambiguous, without writing', () => {
    const db = seedDb();
    execFileSync('python3', ['-c', `import sqlite3,sys; c=sqlite3.connect(sys.argv[1]); c.execute("update proxy_host set is_deleted=1 where id=4"); c.commit()`, db]);
    expect(() => run(db, 'set', 'felicanai')).toThrow(/found 0/);
    expect(rows(db).find(r => r[0] === 6)[1]).toBe('fighter-jet-game');
  });
});
