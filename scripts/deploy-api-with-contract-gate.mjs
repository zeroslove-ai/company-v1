#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const gate = path.join(root, 'scripts', 'company-db-contract-gate.mjs');
const catalogPath = process.env.COMPANY_DB_CATALOG_PATH;
function runGate(args) {
  const result = spawnSync(process.execPath, [gate, ...args], { cwd: root, stdio: 'inherit', env: process.env });
  if (result.status !== 0) {
    process.stderr.write('API_DEPLOY_BLOCKED: database contract gate failed; Wrangler was not started.\n');
    process.exit(result.status ?? 1);
  }
}

const actionGateArgs = ['--stage', process.env.COMPANY_DB_CONTRACT_STAGE ?? 'stage_a'];
if (catalogPath) actionGateArgs.push('--catalog', catalogPath);
runGate(actionGateArgs);

// Cut 2 deployments opt into a second, additive scene contract gate. Cut 1
// callers remain unchanged unless the scene stage is explicitly configured.
const sceneStage = process.env.COMPANY_SCENE_DB_CONTRACT_STAGE;
if (sceneStage) {
  const sceneGateArgs = ['--scene-stage', sceneStage, '--scene-manifest', 'config/company-v1-scene-db-contract.json'];
  const sceneCatalogPath = process.env.COMPANY_SCENE_DB_CATALOG_PATH ?? catalogPath;
  if (sceneCatalogPath) sceneGateArgs.push('--catalog', sceneCatalogPath);
  runGate(sceneGateArgs);
}

const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const wranglerArgs = ['--yes', 'wrangler', 'deploy', '--config', 'wrangler.api.jsonc'];
if (process.argv.includes('--dry-run')) wranglerArgs.splice(3, 0, '--dry-run');
const deployResult = spawnSync(npx, wranglerArgs, {
  cwd: root,
  stdio: 'inherit',
  env: process.env,
  shell: process.platform === 'win32'
});
if (deployResult.error) {
  process.stderr.write(`API_DEPLOY_FAILED_TO_START_WRANGLER: ${deployResult.error.message}\n`);
  process.exit(1);
}
process.exit(deployResult.status ?? 1);
