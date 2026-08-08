import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { buildCsaCurrentRulesSection } from '../src/engine/csa/prompt-sections.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('story prompt retains general scene-flow guidance after legacy matcher removal', () => {
  const storyPrompt = fs.readFileSync(path.join(root, 'src/engine/story-prompt.js'), 'utf8');
  assert.match(storyPrompt, /장면 흐름|scene flow|장면 연속성/);
});

test('extract prompt does not infer affection or obedience from CSA compliance', () => {
  const prompt = fs.readFileSync(path.join(root, 'src/engine/extract-prompt.js'), 'utf8');
  assert.match(prompt, /never raises affinity/);
  assert.match(prompt, /compliance pressure\/self-rationalization, not affection/);
});

test('CURRENT CSA RULES includes activation provenance and history boundary', () => {
  const csa = {
    id: 'csa_60',
    active: true,
    content: '업무 중 적용되는 규칙',
    created_turn: 60,
    updated_turn: 60,
    activated_game_time: { day: 1, minute_of_day: 1058 },
    preset: {
      actor_group: 'female_employee',
      target_group: 'male_employee',
      trigger: 'during_work',
      duration: 'until_work_ends',
      required_action: 'resolve_patient_erection'
    }
  };
  const section = buildCsaCurrentRulesSection([csa], 86);
  assert.match(section, /activated_turn=60/);
  assert.match(section, /activated_game_time=Day 1 17:38/);
  assert.match(section, /history_before_activation=none_from_this_rule/);
});

test('CURRENT CSA RULES blocks unsupported pre-activation history', () => {
  const section = buildCsaCurrentRulesSection([
    { id: 'csa_60', active: true, content: 'x', created_turn: 60, preset: {} }
  ], 86);
  assert.match(section, /activated_turn/);
  assert.match(section, /이 규정이 생기기 전|이전/);
  assert.match(section, /근거가 없으면/);
});
