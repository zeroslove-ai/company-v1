import test from 'node:test';
import assert from 'node:assert/strict';

import edition from '../src/api/edition.js';
import { buildStoryPrompt } from '../src/engine/story-prompt.js';
import { parseNarrative } from '../src/engine/narrative-parser.js';
import { reduceStoryChoiceProjection } from '../src/engine/runtime-core/observation-reducers.js';
import { reduceNpcStatObservation } from '../src/engine/runtime-core/observation-reducers.js';
import { assertRuleDefinitionAuthority } from '../src/engine/runtime-core/action-authority.js';

test('null structured action cannot mutate active rules', () => {
  const currentSave = {
    csa_active: ['csa-1'],
    csa_rules: { 'csa-1': { active: true, content: 'active rule' } }
  };
  const nextSave = structuredClone(currentSave);
  assertRuleDefinitionAuthority({ currentSave, nextSave, structuredAction: null, stage: 'commit' });
  nextSave.csa_active = [];
  assert.throws(
    () => assertRuleDefinitionAuthority({ currentSave, nextSave, structuredAction: null, stage: 'commit' }),
    error => error.code === 'unauthorized_rule_definition_mutation'
  );
});

test('active rule projection remains stable across expected turns', () => {
  const save = {
    csa_active: ['csa-1'],
    csa_rules: {
      'csa-1': {
        active: true,
        content: 'Company employees follow the saved rule.',
        strength: 'medium',
        created_turn: 1,
        preset: { authority_tier: 'medium', affected_group: 'company_employee', mode: 'continuous' }
      }
    },
    scene_state: { participants: [] },
    world_state: { game_time: { day: 1, minute_of_day: 600 } }
  };
  const project = expectedTurn => JSON.parse(buildStoryPrompt({
    edition,
    context: { game: {}, save, recent_turns: [] },
    playerAction: 'continue the current scene',
    expectedTurn,
    npcIds: new Set()
  })[1].content).world_rules[0];
  const first = project(2);
  const later = project(3);
  assert.deepEqual(
    { id: later.id, content: later.content, authority: later.authority, subject_scope: later.subject_scope, mode: later.mode },
    { id: first.id, content: first.content, authority: first.authority, subject_scope: first.subject_scope, mode: first.mode }
  );
});

test('Story prompt projects only saved rule content and injects no legal clause numbering', () => {
  const content = 'Company employees follow the saved rule.';
  const messages = buildStoryPrompt({
    edition,
    context: {
      game: {},
      save: {
        csa_active: ['csa-1'],
        csa_rules: { 'csa-1': { active: true, content, strength: 'medium', created_turn: 1 } },
        scene_state: { participants: [] }
      },
      recent_turns: []
    },
    playerAction: 'continue the current scene',
    expectedTurn: 2,
    npcIds: new Set()
  });
  const payload = JSON.parse(messages[1].content);
  assert.equal(payload.world_rules[0].content, content);
  assert.equal(messages.map(message => message.content).join('\n').includes('제6조'), false);
});

test('missing Story choices remain empty through Commit projection', () => {
  const parsed = parseNarrative('[SCENE]\nA scene without a choices section.', { master: { characters: [] } });
  assert.ok(parsed.warnings.includes('choices_not_exactly_four'));
  const projected = reduceStoryChoiceProjection({ save: { last_choices: [] }, parsedStory: parsed, focalName: '' });
  assert.equal(projected.state.length, 0);
  assert.deepEqual(projected.warnings, []);
  assert.deepEqual(projected.state, []);
});

test('player utterance is never assigned to NPC', () => {
  const parsed = parseNarrative(
    '[SCENE]\n[DIALOGUE speaker_id="player" acting_direction="calm"]\nI asked to move.',
    { master: { characters: [{ character_id: 'heroine1', name: 'Alice' }] } }
  );
  assert.equal(parsed.dialogue_lines.length, 1);
  assert.equal(parsed.dialogue_lines[0].speaker_name, 'player');
  assert.equal(parsed.dialogue_lines[0].speaker_id, null);
  assert.notEqual(parsed.dialogue_lines[0].speaker_id, 'heroine1');
});

test('fear evidence cannot be reused as arousal or acceptance stat evidence', () => {
  const save = { npc_stats: { heroine1: { sexual_arousal: 0, csa_acceptance: 0 } } };
  const result = reduceNpcStatObservation({
    save,
    npcId: 'heroine1',
    npcIds: new Set(['heroine1']),
    stats: { sexual_arousal_delta: 1, csa_acceptance_delta: 2 },
    evidence: { emotion: { heroine1: { quote: 'heroine1 trembles and looks away' } } },
    storyText: 'heroine1 trembles and looks away'
  });
  assert.deepEqual(result.state, save.npc_stats.heroine1);
  assert.ok(result.warnings.includes('stat_evidence_missing:heroine1:sexual_arousal_delta'));
  assert.ok(result.warnings.includes('stat_evidence_missing:heroine1:csa_acceptance_delta'));
});
