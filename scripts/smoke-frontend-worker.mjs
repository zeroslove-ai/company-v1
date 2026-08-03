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

const assetPaths = [
  '/styles.css',
  '/app.js',
  '/config.js',
  '/api.js',
  '/sse.js',
  '/narrative.js',
  '/state.js',
  '/render.js'
];

class SmokeFailure extends Error {
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

function normalizeBaseUrl(value) {
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

async function fetchRequired(url) {
  try {
    return await fetch(url);
  } catch {
    fail(url, 0, 'network_error');
  }
}

async function main() {
  const baseUrl = normalizeBaseUrl(process.argv[2]);
  const htmlUrl = `${baseUrl}/`;
  const htmlResponse = await fetchRequired(htmlUrl);

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

  let configSource = '';
  for (const path of assetPaths) {
    const assetUrl = `${baseUrl}${path}`;
    const response = await fetchRequired(assetUrl);
    if (response.status !== 200) {
      fail(assetUrl, response.status, 'unexpected_status');
    }
    if (path === '/config.js') {
      configSource = await response.text();
    }
  }

  for (const marker of [
    'company-v1',
    'game-proxy-company-v1.zeroslove.workers.dev',
    '11111111-1111-4111-8111-111111111111'
  ]) {
    if (!configSource.includes(marker)) {
      fail(`${baseUrl}/config.js`, 200, 'missing_public_config');
    }
  }

  if (/SUPABASE_SERVICE_ROLE_KEY|LLM_API_KEY|Bearer/.test(configSource)) {
    fail(`${baseUrl}/config.js`, 200, 'credential_marker_detected');
  }

  console.log('REMOTE FRONTEND ASSET SMOKE PASSED');
}

main().catch((error) => {
  if (error instanceof SmokeFailure) {
    console.error(
      `REMOTE FRONTEND ASSET SMOKE FAILED endpoint=${error.endpoint} status=${error.status} error_code=${error.code}`
    );
  } else {
    console.error('REMOTE FRONTEND ASSET SMOKE FAILED endpoint=unknown status=0 error_code=unexpected_error');
  }
  process.exitCode = 1;
});
