import test from 'node:test';
import assert from 'node:assert/strict';

import { loadCanonicalCompanyR3Content } from '../runtime-r3/domain/content-loader.js';
import { createInitialState } from '../runtime-r3/domain/contracts.js';
import { normalizeObserver } from '../runtime-r3/domain/observer-normalizer.js';
import { reduceObservation } from '../runtime-r3/domain/reducer.js';
import { projectCurrentMedia } from '../runtime-r3/domain/media.js';
import { applyR3Csa, createR3CsaCatalog } from '../runtime-r3/domain/csa.js';

const content = loadCanonicalCompanyR3Content();

test('R3 canon exposes bounded dramatization for every heroine without hidden private fields', () => {
  const actors = Object.values(content.characters);
  assert.equal(actors.length, 5);
  for (const actor of actors) {
    const card = actor.prompt_card;
    assert.ok(card.dramatization.ordinary_initiative);
    assert.ok(card.dramatization.csa_first_reaction);
    assert.ok(card.dramatization.csa_adaptation);
    assert.ok(card.dramatization.dialogue_examples.length >= 2);
    assert.equal(card.private_info, undefined);
  }
});

test('R3 player thought is fail-open unless literal input explicitly establishes a perspective', () => {
  const state = createInitialState({ name: 'R3 player' }, 'brand_strategy_office', ['heroine1']);
  const story = '서원희가 회의실 문을 닫는다.\n1. 말을 건다\n2. 기다린다\n3. 나간다\n4. 메모한다';
  const inferred = normalizeObserver({ player_inner_thought: '나는 불안하다.' }, { storyText: story, literalAction: '서원희에게 고개를 끄덕인다.', content, currentState: state });
  assert.equal(inferred.player_inner_thought, '');
  assert.ok(inferred.warnings.includes('player_inner_thought_projection_dropped'));
  const explicit = normalizeObserver({ player_inner_thought: '나는 먼저 상황을 파악하고 싶다.' }, { storyText: story, literalAction: '나는 먼저 상황을 파악하고 싶다고 생각하며 서원희를 바라본다.', content, currentState: state });
  assert.equal(explicit.player_inner_thought, '나는 먼저 상황을 파악하고 싶다.');
});

test('R3 malformed mind monitor fields do not become empty committed projections', () => {
  const state = createInitialState({ name: 'R3 player' }, 'brand_strategy_office', ['heroine1']);
  const normalized = normalizeObserver({ mind_monitor: { heroine1: { surface: '', subconscious: 'latent' } } }, { storyText: '서원희가 자리에 앉는다.', content, currentState: state });
  assert.deepEqual(normalized.mind_monitor, {});
  assert.ok(normalized.warnings.includes('mind_monitor_projection_dropped'));
});

test('R3 media hint reaches sex presentation only from committed exact evidence and refuses stale/refused sex routing', () => {
  const name = content.characters.heroine1.name;
  const state = createInitialState({ name: 'R3 player' }, 'brand_strategy_office', ['heroine1']);
  const quote = `${name}는 옷을 벗고 삽입을 받아들인다.`;
  const story = `${quote}\n1. 계속한다\n2. 멈춘다\n3. 말을 건다\n4. 자리를 뜬다`;
  const normalized = normalizeObserver({ media_hint: { actor_id: 'heroine1', pool: 'sex', quote, tags: ['adult'] } }, { storyText: story, content, currentState: state });
  const reduced = reduceObservation({ state, observation: normalized, turnNumber: 1 });
  const context = { state: { state: reduced.state, committed_turn: 1 }, turns: [{ turn_number: 1, story_text: story, observer_applied: reduced.applied }] };
  assert.equal(projectCurrentMedia({ context, content }).pool, 'sex');
  assert.equal(projectCurrentMedia({ context, content }).character_id, 'heroine1');

  const refusedQuote = `${name}는 싫다고 말하며 멈춰 달라고 거절한다.`;
  const refusedStory = `${refusedQuote}\n1. 사과한다\n2. 물러난다\n3. 업무로 돌아간다\n4. 혼자 있는다`;
  const refused = normalizeObserver({ media_hint: { actor_id: 'heroine1', pool: 'sex', quote: refusedQuote } }, { storyText: refusedStory, content, currentState: state });
  assert.equal(refused.media_hint, null);
  assert.ok(refused.warnings.includes('media_hint_projection_dropped'));
});

test('R3 clothing CSA applies only to current-scene subjects and clears deactivated residue', () => {
  const catalog = createR3CsaCatalog(content.csaPresets);
  const state = createInitialState({ name: 'R3 player' }, 'brand_strategy_office', ['heroine1', 'heroine2']);
  const activated = applyR3Csa({ state, content, catalog, rawOperations: [{ operation: 'activate', template_id: 'no_panties_under_work_clothes', subject_scope: 'female_employee' }] });
  assert.equal(activated.clothing.heroine1.underwear_bottom, 'removed');
  assert.equal(activated.clothing.heroine2.underwear_bottom, 'removed');
  assert.equal(activated.clothing.heroine3, undefined);
  const deactivated = applyR3Csa({ state: activated, content, catalog, rawOperations: [{ operation: 'deactivate', id: 'r3_csa_1' }] });
  assert.equal(deactivated.clothing.heroine1.underwear_bottom, 'unknown');
  assert.equal(deactivated.clothing.heroine2.underwear_bottom, 'unknown');
});
