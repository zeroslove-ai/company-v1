#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const gate = path.join(root, 'scripts', 'company-db-contract-gate.mjs');
const gateArgs = ['--stage', process.env.COMPANY_DB_CONTRACT_STAGE ?? 'stage_a'];
const catalogPath = process.env.COMPANY_DB_CATALOG_PATH;
if (catalogPath) gateArgs.push('--catalog', catalogPath);

const gateResult = spawnSync(process.execPath, [gate, ...gateArgs], { cwd: root, stdio: 'inherit', env: process.env });
if (gateResult.status !== 0) {
  process.stderr.write('API_DEPLOY_BLOCKED: database contract gate failed; Wrangler was not started.\n');
  process.exit(gateResult.status ?? 1);
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
