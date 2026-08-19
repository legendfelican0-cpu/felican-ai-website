import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = path.resolve(import.meta.dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

describe('assistant deployment safeguards', () => {
  it('keeps DEV and PROD on separate Vapi assistants', () => {
    const dev = read('scripts/deploy-dev.sh');
    const prod = read('scripts/deploy-prod.sh');
    expect(dev).toContain('--assistant-name "Felican AI Website Voice (DEV)"');
    expect(prod).toContain('PROD_VAPI_ASSISTANT_NAME="Felican AI Website Voice (PROD)"');
    expect(prod).toContain('--public-url https://felican.ai');
  });

  it('provisions and validates production voice before stopping the old site', () => {
    const prod = read('scripts/deploy-prod.sh');
    const provision = prod.indexOf('python3 "${release_dir}/scripts/provision-felican-vapi.py"');
    const stopOldSite = prod.indexOf('docker stop "${site_container}"');
    expect(provision).toBeGreaterThan(-1);
    expect(stopOldSite).toBeGreaterThan(provision);
    for (const key of [
      'FELICAN_VAPI_PUBLIC_KEY',
      'FELICAN_VAPI_ASSISTANT_ID',
      'FELICAN_VAPI_WEBHOOK_SECRET',
    ]) expect(prod).toContain(key);
  });

  it('changes only the main proxy target during deploy and rollback', () => {
    expect(read('scripts/deploy-prod.sh')).toContain("sed -i -E '0,/");
    expect(read('scripts/rollback-prod.sh')).toContain("sed -i -E '0,/");
  });

  it('requires voice configuration and the verified client in smoke tests', () => {
    const smoke = read('scripts/smoke.mjs');
    expect(smoke).toContain("request('/api/voice-config')");
    expect(smoke).toContain("request('/voice-client.bundle.js', { method: 'HEAD' })");
    expect(smoke).toContain("payload.enabled === true");
  });

  it('preflights both AI and Vapi credentials without printing their values', () => {
    const preflight = read('scripts/preflight-prod.sh');
    expect(preflight).toContain('AI_PROVIDER=set');
    expect(preflight).toContain('VAPI_PRIVATE_KEY=set');
    expect(preflight).not.toContain('cat "${vapi_private_env}"');
  });
});
