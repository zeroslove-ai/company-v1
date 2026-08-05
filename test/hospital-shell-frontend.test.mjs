import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const indexHtml = readFileSync(new URL('../src/frontend/pages/index.html', import.meta.url), 'utf8');
const shellCss = readFileSync(new URL('../src/frontend/pages/hospital-shell.css', import.meta.url), 'utf8');

function rule(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = shellCss.match(new RegExp(`(?:^|\\n)${escaped}\\s*\\{([\\s\\S]*?)\\}`));
  assert.ok(match, `missing CSS rule for ${selector}`);
  return match[1];
}

test('loads the transplanted hospital shell after existing Company styles', () => {
  const stylesIndex = indexHtml.indexOf('./styles.css');
  const shellIndex = indexHtml.indexOf('./hospital-shell.css');
  assert.ok(stylesIndex >= 0);
  assert.ok(shellIndex > stylesIndex);
  assert.match(indexHtml, /src=["']\.\/hospital-scroll\.js["']/);
});

test('uses independent desktop scrolling instead of scrolling the whole document', () => {
  assert.match(shellCss, /body\s*\{\s*margin:\s*0;[\s\S]*?overflow:\s*hidden/);
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

test('preserves the Company engine and Hospital TTS DOM contracts while replacing the shell', () => {
  assert.match(indexHtml, /<aside class=["']status-column["']/);
  for (const id of [
    'story-panel',
    'character-image',
    'tts-toggle',
    'tts-replay',
    'tts-status',
    'audio-player',
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
  assert.match(indexHtml, /src=["']\.\/tts\.js["']/);
  assert.match(indexHtml, /src=["']\.\/relationship-icons\.js["']/);
});
