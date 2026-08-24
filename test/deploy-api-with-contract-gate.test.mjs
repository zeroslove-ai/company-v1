import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  buildWranglerArgs,
  resolveDeployPlan
} from '../scripts/deploy-api-with-contract-gate.mjs';

test('default deploy plan stays on the legacy v1 target', async () => {
  const plan = await resolveDeployPlan();
  assert.deepEqual(plan, {
    configPath: 'wrangler.api.jsonc',
    configName: 'wrangler.api.jsonc',
    workerName: 'game-proxy-company-v1',
    expectedWorker: null,
    dryRun: false
  });
  assert.deepEqual(buildWranglerArgs(plan), ['--yes', 'wrangler', 'deploy', '--config', 'wrangler.api.jsonc']);
});

test('explicit R3 plan requires and selects the R3 target identity', async () => {
  const plan = await resolveDeployPlan({ args: ['--config', 'wrangler.r3.api.jsonc', '--expect-worker', 'game-proxy-company-r3'] });
  assert.equal(plan.configPath, 'wrangler.r3.api.jsonc');
  assert.equal(plan.workerName, 'game-proxy-company-r3');
  assert.deepEqual(buildWranglerArgs({ ...plan, dryRun: true }), ['--yes', 'wrangler', 'deploy', '--dry-run', '--config', 'wrangler.r3.api.jsonc']);
});

test('legacy and R3 identities cannot be crossed or omitted', async () => {
  await assert.rejects(
    resolveDeployPlan({ args: ['--config', 'wrangler.r3.api.jsonc'] }),
    /R3 requires --expect-worker game-proxy-company-r3/
  );
  await assert.rejects(
    resolveDeployPlan({ args: ['--config', 'wrangler.api.jsonc', '--expect-worker', 'game-proxy-company-r3'] }),
    /DEPLOY_TARGET_MISMATCH/
  );
  await assert.rejects(
    resolveDeployPlan({ args: ['--config', 'wrangler.r3.api.jsonc', '--expect-worker', 'not-a-worker'] }),
    /DEPLOY_TARGET_MISMATCH/
  );
  await assert.rejects(
    resolveDeployPlan({ args: ['--config', 'arbitrary.jsonc', '--expect-worker', 'game-proxy-company-r3'] }),
    /DEPLOY_TARGET_INVALID/
  );
});

test('the database gate remains before Wrangler spawn', async () => {
  const source = await readFile(new URL('../scripts/deploy-api-with-contract-gate.mjs', import.meta.url), 'utf8');
  assert.ok(source.indexOf('runGate(actionGateArgs)') < source.indexOf('spawnSync(npx'));
  assert.ok(source.includes('API_DEPLOY_BLOCKED: database contract gate failed; Wrangler was not started.'));
});
