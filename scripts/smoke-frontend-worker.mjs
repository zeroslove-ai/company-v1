import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const requiredHtmlMarkers = [
  'data-edition-id="company-v1"',
  'data-phase="phase-4-frontend-loop"',
  'id="game-main"',
  'id="story-history"',
  'id="current-story"',
  'id="choice-list"',
  'id="player-action"',
  'id="submit-action"'
];

const publicConfigMarkers = [
  'company-v1',
  'game-proxy-company-v1.zeroslove.workers.dev'
];

export class SmokeFailure extends Error {
  constructor(endpoint, status, code) {
    super(code);
    this.endpoint = endpoint;
    this.status = status;
    this.code = code;
  }
}

function fail(endpoint, status, code) {
  throw new SmokeFailure(endpoint, status, code);
}

export function normalizeBaseUrl(value) {
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error('unsupported_protocol');
    }
    return url.origin;
  } catch {
    fail('argument', 0, 'invalid_base_url');
  }
}

function parseAttributes(tag) {
  const attributes = {};
  for (const match of tag.matchAll(/([:\w-]+)\s*=\s*(["'])(.*?)\2/gs)) {
    attributes[match[1].toLowerCase()] = match[3];
  }
  return attributes;
}

export function extractDirectAssetReferences(html) {
  const references = [];
  for (const match of html.matchAll(/<link\b[^>]*>/gi)) {
    const attributes = parseAttributes(match[0]);
    if (attributes.rel?.split(/\s+/).includes('stylesheet') && attributes.href) {
      references.push({ kind: 'stylesheet', rawPath: attributes.href });
    }
  }
  for (const match of html.matchAll(/<script\b[^>]*>/gi)) {
    const attributes = parseAttributes(match[0]);
    if (attributes.type?.toLowerCase() === 'module' && attributes.src) {
      references.push({ kind: 'module', rawPath: attributes.src });
    }
  }
  return references;
}

function resolveSameOriginAsset(baseUrl, rawPath, endpoint, relativeBase = `${baseUrl}/`) {
  try {
    const url = new URL(rawPath, relativeBase);
    if (!['http:', 'https:'].includes(url.protocol) || url.origin !== baseUrl || url.username || url.password) {
      fail(endpoint, 200, 'unsupported_asset_reference');
    }
    if (url.hash) {
      fail(endpoint, 200, 'unsupported_asset_reference');
    }
    url.hash = '';
    return url.href;
  } catch (error) {
    if (error instanceof SmokeFailure) throw error;
    fail(endpoint, 200, 'malformed_asset_reference');
  }
}

export function extractRelativeModuleImports(source) {
  const imports = new Set();
  const staticImportPattern = /\b(?:import|export)\s+(?:(?:[^;\n]*?)\sfrom\s+)?["'](\.{1,2}\/[^"']+)["']/g;
  const dynamicImportPattern = /\bimport\s*\(\s*["'](\.{1,2}\/[^"']+)["']\s*\)/g;
  for (const pattern of [staticImportPattern, dynamicImportPattern]) {
    for (const match of source.matchAll(pattern)) imports.add(match[1]);
  }
  return [...imports];
}

async function fetchRequired(url, fetchImpl) {
  try {
    return await fetchImpl(url);
  } catch {
    fail(url, 0, 'network_error');
  }
}

function pathForLog(url) {
  const parsed = new URL(url);
  return `${parsed.pathname}${parsed.search}`;
}

export async function runSmoke(baseUrlValue, { fetchImpl = globalThis.fetch, log = console.log } = {}) {
  const baseUrl = normalizeBaseUrl(baseUrlValue);
  const htmlUrl = `${baseUrl}/`;
  const htmlResponse = await fetchRequired(htmlUrl, fetchImpl);

  if (htmlResponse.status !== 200) {
    fail(htmlUrl, htmlResponse.status, 'unexpected_status');
  }
  if (!(htmlResponse.headers.get('content-type') ?? '').includes('text/html')) {
    fail(htmlUrl, htmlResponse.status, 'unexpected_content_type');
  }

  const html = await htmlResponse.text();
  for (const marker of requiredHtmlMarkers) {
    if (!html.includes(marker)) {
      fail(htmlUrl, htmlResponse.status, 'missing_html_marker');
    }
  }

  const directAssets = extractDirectAssetReferences(html).map(({ kind, rawPath }) => ({
    kind,
    rawPath,
    url: resolveSameOriginAsset(baseUrl, rawPath, htmlUrl)
  }));
  const directByUrl = new Map(directAssets.map(asset => [asset.url, asset]));
  const fetched = new Map();
  const moduleQueue = directAssets.filter(asset => asset.kind === 'module').map(asset => asset.url);

  for (const asset of directByUrl.values()) {
    const response = await fetchRequired(asset.url, fetchImpl);
    if (response.status !== 200) {
      fail(asset.url, response.status, 'unexpected_status');
    }
    fetched.set(asset.url, { response, source: asset.kind === 'module' ? await response.text() : null });
  }

  const visitedModules = new Set();
  const queuedModules = new Set(moduleQueue);
  while (moduleQueue.length) {
    const moduleUrl = moduleQueue.shift();
    if (visitedModules.has(moduleUrl)) continue;
    visitedModules.add(moduleUrl);

    let module = fetched.get(moduleUrl);
    if (!module) {
      const response = await fetchRequired(moduleUrl, fetchImpl);
      if (response.status !== 200) {
        fail(moduleUrl, response.status, 'unexpected_status');
      }
      module = { response, source: await response.text() };
      fetched.set(moduleUrl, module);
    }

    for (const rawImport of extractRelativeModuleImports(module.source ?? '')) {
      const importedUrl = resolveSameOriginAsset(baseUrl, rawImport, moduleUrl, moduleUrl);
      if (!queuedModules.has(importedUrl)) {
        queuedModules.add(importedUrl);
        moduleQueue.push(importedUrl);
      }
    }
  }

  const configUrl = [...fetched.keys()].find(url => new URL(url).pathname === '/config.js');
  const configSource = configUrl ? fetched.get(configUrl)?.source ?? '' : '';
  for (const marker of publicConfigMarkers) {
    if (!configSource.includes(marker)) {
      fail(configUrl ?? `${baseUrl}/config.js`, 200, 'missing_public_config');
    }
  }
  if (/SUPABASE_SERVICE_ROLE_KEY|LLM_API_KEY|SERVICE_ROLE|API_KEY|Bearer/.test(configSource)) {
    fail(configUrl, 200, 'credential_marker_detected');
  }

  const summary = {
    directAssets: directAssets.map(asset => pathForLog(asset.url)),
    reachableModules: [...visitedModules].map(pathForLog)
  };
  log(`REMOTE FRONTEND ASSET SMOKE PASSED direct_assets=${summary.directAssets.length} reachable_modules=${summary.reachableModules.length} direct_paths=${summary.directAssets.join(',')} module_paths=${summary.reachableModules.join(',')}`);
  return summary;
}

export async function main() {
  try {
    await runSmoke(process.argv[2]);
  } catch (error) {
    if (error instanceof SmokeFailure) {
      console.error(
        `REMOTE FRONTEND ASSET SMOKE FAILED endpoint=${error.endpoint} status=${error.status} error_code=${error.code}`
      );
    } else {
      console.error('REMOTE FRONTEND ASSET SMOKE FAILED endpoint=unknown status=0 error_code=unexpected_error');
    }
    process.exitCode = 1;
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  await main();
}
