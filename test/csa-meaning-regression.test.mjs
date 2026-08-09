import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('story prompt retains general scene-flow guidance after CSA projection simplification', () => {
  const storyPrompt = fs.readFileSync(path.join(root, 'src/engine/story-prompt.js'), 'utf8');
  assert.match(storyPrompt, /scene flow|장면 연속성|NPC 자율성/);
});

test('extract prompt does not infer affection or obedience from CSA compliance', () => {
  const prompt = fs.readFileSync(path.join(root, 'src/engine/extract-prompt.js'), 'utf8');
  assert.match(prompt, /never raises affinity/);
  assert.match(prompt, /csa_acceptance records acceptance or resistance to that rule only/);
  assert.doesNotMatch(prompt, /changed common sense feels/);
});
