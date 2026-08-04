import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const indexHtml = readFileSync(new URL('../src/frontend/pages/index.html', import.meta.url), 'utf8');
const shellCss = readFileSync(new URL('../src/frontend/pages/hospital-shell.css', import.meta.url), 'utf8');

function rule(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = shellCss.match(new RegExp(`${escaped}\\s*\\{([\\s\\S]*?)\\}`));
  assert.ok(match, `missing CSS rule for ${selector}`);
  return match[1];
}

test('loads the transplanted hospital shell after existing Company styles', () => {
  const stylesIndex = indexHtml.indexOf('./styles.css');
  const shellIndex = indexHtml.indexOf('./hospital-shell.css');
  assert.ok(stylesIndex >= 0);
  assert.ok(shellIndex > stylesIndex);
});

test('uses independent desktop scrolling instead of scrolling the whole document', () => {
  assert.match(rule('body'), /overflow:\s*hidden/);
  assert.match(rule('.game-shell'), /height:\s*100dvh/);
  assert.match(rule('.game-shell'), /overflow:\s*hidden/);
  assert.match(rule('.game-layout'), /grid-template-columns:\s*minmax\(0,\s*1fr\)\s+320px/);
  assert.match(rule('.game-layout'), /overflow:\s*hidden/);
  assert.match(rule('.story-panel'), /overflow-y:\s*auto/);
  assert.match(rule('.status-column'), /overflow-y:\s*auto/);
  assert.match(rule('.status-column'), /height:\s*100%/);
});

test('keeps the action controls in the viewport shell', () => {
  assert.match(rule('.action-panel'), /max-height:\s*44dvh/);
  assert.match(rule('.action-panel'), /overflow-y:\s*auto/);
  assert.match(rule('.choice-list'), /grid-template-columns:\s*1fr/);
});

test('preserves the Company engine DOM contracts while replacing the shell', () => {
  for (const id of [
    'story-panel',
    'status-column',
    'character-image',
    'tts-enabled',
    'play-tts',
    'open-apps',
    'resume-play',
    'choice-list',
    'player-action',
    'submit-action',
    'open-history',
    'send-feedback',
    'find-npc',
    'reset-game',
    'csa-app-overlay',
  ]) {
    assert.match(indexHtml, new RegExp(`id=["']${id}["']`));
  }
});
