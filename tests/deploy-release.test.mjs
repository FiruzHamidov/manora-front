import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const source = readFileSync(new URL('../deploy/server-deploy.sh', import.meta.url), 'utf8');
const startRelease = source.slice(source.indexOf('start_release() {'), source.indexOf('\nfinish() {'));

function runRelease(mode) {
  const directory = mkdtempSync(path.join(tmpdir(), 'manora-deploy-test-'));
  const target = path.join(directory, 'release');
  mkdirSync(path.join(target, 'deploy'), { recursive: true });
  writeFileSync(path.join(target, 'deploy', 'ecosystem.config.cjs'), 'module.exports = {};');
  const callsFile = path.join(directory, 'calls');
  const script = `
set -euo pipefail
pm2() {
  printf '%s\\n' "$*" >> "$TEST_CALLS"
  case "$1" in
    describe|delete|start) return 0 ;;
    jlist)
      node -e 'const target=process.env.TEST_TARGET; const mode=process.env.TEST_MODE;
        console.log(JSON.stringify([{name:"manora-front",pm2_env:{
          status:"online",pm_cwd:mode==="stale-cwd"?"/old/release":target,
          pm_exec_path:(mode==="stale-script"?"/old/release":target)+"/node_modules/next/dist/bin/next"
        }}]));'
      ;;
    *) return 99 ;;
  esac
}
${startRelease}
start_release "$TEST_TARGET"
`;
  try {
    const result = spawnSync('bash', ['-c', script], {
      encoding: 'utf8',
      env: { ...process.env, TEST_TARGET: target, TEST_CALLS: callsFile, TEST_MODE: mode },
    });
    return { ...result, calls: readFileSync(callsFile, 'utf8').trim().split('\n') };
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

test('deployment replaces the existing PM2 app before starting the new release', () => {
  const result = runRelease('current');
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(result.calls.map(call => call.split(' ')[0]), ['describe', 'delete', 'start', 'jlist']);
});

for (const mode of ['stale-cwd', 'stale-script']) {
  test(`deployment rejects a PM2 process with ${mode}`, () => {
    const result = runRelease(mode);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /PM2 is not running the expected release/);
  });
}
