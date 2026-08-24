#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const gate = path.join(root, 'scripts', 'company-db-contract-gate.mjs');
const catalogPath = process.env.COMPANY_DB_CATALOG_PATH;

const TARGETS = new Map([
  ['wrangler.api.jsonc', 'game-proxy-company-v1'],
  ['wrangler.r3.api.jsonc', 'game-proxy-company-r3']
]);

function parseArgs(args) {
  const options = { config: 'wrangler.api.jsonc', expectedWorker: null, dryRun: false };
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === '--dry-run') {
      options.dryRun = true;
      continue;
    }
    const [name, inlineValue] = argument.split('=', 2);
    if (name === '--config' || name === '--expect-worker') {
      const value = inlineValue ?? args[++index];
      if (!value) throw new Error(`DEPLOY_TARGET_INVALID: ${name} requires a value`);
      options[name === '--config' ? 'config' : 'expectedWorker'] = value;
      continue;
    }
    throw new Error(`DEPLOY_TARGET_INVALID: unsupported argument ${argument}`);
  }
  return options;
}

function stripJsonComments(source) {
  let output = '';
  let inString = false;
  let escaped = false;
  let inLineComment = false;
  let inBlockComment = false;
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    const next = source[index + 1];
    if (inLineComment) {
      if (character === '\n') {
        inLineComment = false;
        output += character;
      }
      continue;
    }
    if (inBlockComment) {
      if (character === '*' && next === '/') {
        inBlockComment = false;
        index += 1;
      } else if (character === '\n') {
        output += character;
      }
      continue;
    }
    if (!inString && character === '/' && next === '/') {
      inLineComment = true;
      index += 1;
      continue;
    }
    if (!inString && character === '/' && next === '*') {
      inBlockComment = true;
      index += 1;
      continue;
    }
    output += character;
    if (character === '"' && !escaped) inString = !inString;
    escaped = character === '\\' && !escaped;
    if (character !== '\\') escaped = false;
  }
  return output;
}

export async function resolveDeployPlan({ args = [], rootDir = root } = {}) {
  const options = parseArgs(args);
  const configName = path.basename(options.config);
  const expectedPath = path.resolve(rootDir, configName);
  const selectedPath = path.resolve(rootDir, options.config);
  if (!TARGETS.has(configName) || selectedPath !== expectedPath) {
    throw new Error(`DEPLOY_TARGET_INVALID: config must be one of ${[...TARGETS.keys()].join(', ')}`);
  }
  const config = JSON.parse(stripJsonComments(await readFile(selectedPath, 'utf8')));
  const workerName = config?.name;
  const expectedFromTarget = TARGETS.get(configName);
  if (workerName !== expectedFromTarget) {
    throw new Error(`DEPLOY_TARGET_INVALID: ${configName} declares ${workerName ?? '<missing>'}, expected ${expectedFromTarget}`);
  }
  if (configName === 'wrangler.r3.api.jsonc' && options.expectedWorker !== expectedFromTarget) {
    throw new Error(`DEPLOY_TARGET_MISMATCH: R3 requires --expect-worker ${expectedFromTarget}`);
  }
  if (options.expectedWorker && options.expectedWorker !== workerName) {
    throw new Error(`DEPLOY_TARGET_MISMATCH: expected ${options.expectedWorker}, config declares ${workerName}`);
  }
  return {
    configPath: configName,
    configName,
    workerName,
    expectedWorker: options.expectedWorker,
    dryRun: options.dryRun
  };
}

export function buildWranglerArgs(plan) {
  const args = ['--yes', 'wrangler', 'deploy'];
  if (plan.dryRun) args.push('--dry-run');
  args.push('--config', plan.configPath);
  return args;
}

function runGate(args) {
  const result = spawnSync(process.execPath, [gate, ...args], { cwd: root, stdio: 'inherit', env: process.env });
  if (result.status !== 0) {
    throw new Error('API_DEPLOY_BLOCKED: database contract gate failed; Wrangler was not started.');
  }
}

export async function runDeploy({ args = process.argv.slice(2) } = {}) {
  const plan = await resolveDeployPlan({ args });

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
  const deployResult = spawnSync(npx, buildWranglerArgs(plan), {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
    shell: process.platform === 'win32'
  });
  if (deployResult.error) throw new Error(`API_DEPLOY_FAILED_TO_START_WRANGLER: ${deployResult.error.message}`);
  return deployResult.status ?? 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  runDeploy().then((status) => {
    process.exitCode = status;
  }).catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
