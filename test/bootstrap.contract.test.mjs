import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const resolve = (...parts) => path.join(root, ...parts);
const read = (...parts) => fs.readFileSync(resolve(...parts), 'utf8');
const readJson = (...parts) => JSON.parse(read(...parts));
const importFile = filePath => import(pathToFileURL(filePath).href);

const requiredFiles = [
  'src/api/index.js',
  'src/api/edition.js',
  'src/engine/index.js',
  'src/engine/edition.js',
  'src/engine/errors.js',
  'src/frontend/pages/index.html',
  'src/frontend/pages/app.js',
  'content/edition.json',
  'content/organization.json',
  'content/map.json',
  'content/characters.json',
  'content/general_npcs.json',
  'content/csa_presets.json',
  'docs/INDEPENDENT_RUNTIME_DECISION.md',
  'package.json',
  'wrangler.api.jsonc',
  'wrangler.frontend.jsonc',
  '.gitignore'
];

test('independent bootstrap files exist', () => {
  for (const file of requiredFiles) {
    assert.equal(fs.existsSync(resolve(file)), true, file);
  }
});

test('runtime identifiers and relocated entries are fixed', () => {
  assert.equal(readJson('wrangler.api.jsonc').name, 'game-proxy-company-v1');
  assert.equal(readJson('wrangler.api.jsonc').main, 'src/api/index.js');
  assert.equal(readJson('wrangler.frontend.jsonc').name, 'gamebuilder-company-v1');
  assert.equal(readJson('wrangler.frontend.jsonc').assets.directory, 'src/frontend/pages');
  assert.equal(readJson('package.json').name, 'company-v1');
  assert.match(read('src/api/edition.js'), /\.\.\/engine\/index\.js/);
});

test('content remains the company edition skeleton', () => {
  const edition = readJson('content/edition.json');
  const organization = readJson('content/organization.json');
  assert.equal(edition.edition_id, 'company-v1');
  assert.equal(edition.content_version, '0.0.1-skeleton');
  assert.equal(organization.company.company_id, 'luminous_brand_group');
});

test('engine validates edition adapters without runtime dependencies', async () => {
  const { createEditionAdapter, GameCoreError } = await importFile(resolve('src/engine/index.js'));
  const valid = createEditionAdapter({
    editionId: 'company-v1', contentVersion: '0.0.1-skeleton', organization: {}, map: {},
    characters: {}, generalNpcs: {}, csaPresets: {}
  });
  assert.equal(valid.editionId, 'company-v1');
  assert.throws(() => createEditionAdapter({ editionId: '' }), GameCoreError);
});

test('API exposes static health and version responses without outbound calls', async () => {
  const source = read('src/api/index.js');
  assert.match(source, /async fetch\(request\)/);
  assert.doesNotMatch(source, /await fetch\(|globalThis\.fetch\(|fetch\(["']http/);
  const { default: worker } = await importFile(resolve('src/api/index.js'));
  const response = await worker.fetch(new Request('https://example.test/health'));
  assert.equal(response.status, 200);
  assert.equal((await response.json()).edition_id, 'company-v1');
});

test('bootstrap has no legacy runtime dependency or deployment scripts', () => {
  const implementation = ['src/api/index.js', 'src/api/edition.js', 'src/engine/index.js', 'src/engine/edition.js', 'src/engine/errors.js'];
  const forbidden = ['game-proxy-v2', 'gamebuilder-v2', 'game-builder-v2', 'ovltkzwddxsekcfeskds', 'packages/game-core', 'apps/company-v1', 'replaceOnce', 'replaceRegex'];
  for (const file of implementation) {
    const source = read(file);
    for (const token of forbidden) assert.equal(source.includes(token), false, `${file} contains ${token}`);
  }
  const scripts = readJson('package.json').scripts;
  assert.deepEqual(scripts, { test: 'node --test test/*.test.mjs', verify: 'npm test' });
});
