import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  SmokeFailure,
  extractRelativeModuleImports,
  runSmoke
} from '../scripts/smoke-frontend-worker.mjs';

const baseUrl = 'https://frontend.test';
const html = `<!doctype html>
<html data-edition-id="company-v1" data-phase="phase-4-frontend-loop">
  <main id="game-main"><section id="story-history"><article id="current-story"></article></section>
    <div id="choice-list"></div><input id="player-action"><button id="submit-action"></button>
  </main>
  <link rel="stylesheet" href="./styles.css">
  <script type="module" src="./app.js"></script>
</html>`;

function response(body, contentType = 'text/javascript', status = 200) {
  return new Response(body, { status, headers: { 'content-type': contentType } });
}

function frontendFetch(files) {
  const calls = [];
  const fetchImpl = async url => {
    const parsed = new URL(url);
    calls.push(parsed.pathname);
    const file = files[parsed.pathname];
    return file instanceof Response ? file : response(file ?? '', parsed.pathname === '/' ? 'text/html' : 'text/javascript', file === undefined ? 404 : 200);
  };
  return { calls, fetchImpl };
}

function validFiles(overrides = {}) {
  return {
    '/': response(html, 'text/html'),
    '/styles.css': response('body {}', 'text/css'),
    '/app.js': response("import './config.js'; import './loop.js';", 'text/javascript'),
    '/loop.js': response("import './app.js'; export { value } from './config.js';", 'text/javascript'),
    '/config.js': response("export const edition='company-v1'; export const api='https://game-proxy-company-v1.zeroslove.workers.dev';", 'text/javascript'),
    ...overrides
  };
}

test('current HTML direct assets and transitive module graph pass without stale narrative asset', async () => {
  const mock = frontendFetch(validFiles());
  const summary = await runSmoke(baseUrl, { fetchImpl: mock.fetchImpl, log: () => {} });
  assert.deepEqual(summary.directAssets, ['/styles.css', '/app.js']);
  assert.deepEqual(summary.reachableModules, ['/app.js', '/config.js', '/loop.js']);
  assert.equal(mock.calls.includes('/narrative.js'), false);
});

test('missing HTML-declared direct asset fails with endpoint and status', async () => {
  const mock = frontendFetch(validFiles({ '/styles.css': response('missing', 'text/css', 404) }));
  await assert.rejects(() => runSmoke(baseUrl, { fetchImpl: mock.fetchImpl, log: () => {} }), error =>
    error instanceof SmokeFailure && error.endpoint === `${baseUrl}/styles.css` && error.status === 404 && error.code === 'unexpected_status'
  );
});

test('missing relative module dependency fails and imports are deduplicated through a cycle', async () => {
  const missing = frontendFetch(validFiles({ '/app.js': response("import './missing.js';", 'text/javascript') }));
  await assert.rejects(() => runSmoke(baseUrl, { fetchImpl: missing.fetchImpl, log: () => {} }), error =>
    error instanceof SmokeFailure && error.endpoint === `${baseUrl}/missing.js` && error.status === 404 && error.code === 'unexpected_status'
  );

  const cycle = frontendFetch(validFiles({
    '/app.js': response("import './loop.js';", 'text/javascript'),
    '/loop.js': response("import './app.js'; import './config.js';", 'text/javascript')
  }));
  const summary = await runSmoke(baseUrl, { fetchImpl: cycle.fetchImpl, log: () => {} });
  assert.deepEqual(summary.reachableModules, ['/app.js', '/loop.js', '/config.js']);
  assert.equal(cycle.calls.filter(path => path === '/app.js').length, 1);
  assert.equal(cycle.calls.filter(path => path === '/loop.js').length, 1);
});

test('bare and external imports are not treated as same-origin static assets', () => {
  assert.deepEqual(extractRelativeModuleImports("import 'package'; import 'https://cdn.example/x.js'; import './local.js';"), ['./local.js']);
});

test('required HTML markers, API binding, and credential checks remain fail-closed', async t => {
  await t.test('missing HTML marker', async () => {
    const mock = frontendFetch(validFiles({ '/': response(html.replace('id="submit-action"', 'id="missing-action"'), 'text/html') }));
    await assert.rejects(() => runSmoke(baseUrl, { fetchImpl: mock.fetchImpl, log: () => {} }), error => error.code === 'missing_html_marker');
  });
  await t.test('wrong API binding', async () => {
    const mock = frontendFetch(validFiles({ '/config.js': response("export const edition='company-v1'; export const api='https://wrong.example';", 'text/javascript') }));
    await assert.rejects(() => runSmoke(baseUrl, { fetchImpl: mock.fetchImpl, log: () => {} }), error => error.code === 'missing_public_config');
  });
  await t.test('credential marker', async () => {
    const mock = frontendFetch(validFiles({ '/config.js': response("export const edition='company-v1'; export const api='https://game-proxy-company-v1.zeroslove.workers.dev'; export const key='SUPABASE_SERVICE_ROLE_KEY';", 'text/javascript') }));
    await assert.rejects(() => runSmoke(baseUrl, { fetchImpl: mock.fetchImpl, log: () => {} }), error => error.code === 'credential_marker_detected');
  });
});

test('smoke source has no stale narrative.js fixture', async () => {
  const source = await import('node:fs/promises').then(fs => fs.readFile(new URL('../scripts/smoke-frontend-worker.mjs', import.meta.url), 'utf8'));
  assert.equal(source.includes('/narrative.js'), false);
});
