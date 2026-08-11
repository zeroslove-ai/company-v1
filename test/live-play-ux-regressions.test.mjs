import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('loading is nonblocking and NPC finder is not loaded', () => {
  const css = fs.readFileSync(path.join(root, 'src/frontend/pages/runtime-hotfix.css'), 'utf8');
  const html = fs.readFileSync(path.join(root, 'src/frontend/pages/index.html'), 'utf8');
  assert.match(css, /\.turn-loading-overlay[\s\S]*pointer-events:\s*none/);
  assert.doesNotMatch(css, /backdrop-filter:\s*blur/);
  assert.doesNotMatch(html, /find-npc|npc-finder/);
  assert.match(html, /runtime-hotfix\.css/);
});
