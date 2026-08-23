import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import { loadCanonicalCompanyR3Content } from '../runtime-r3/domain/content-loader.js';
import { projectCurrentMedia, selectApprovedImage, resolveCommittedTtsBatch, resolveCommittedTtsVoice } from '../runtime-r3/domain/media.js';
import { createR3Worker } from '../runtime-r3/server/worker.js';
import { InMemoryR3Store } from '../runtime-r3/server/store.js';
import { parseR3DialogueLines, projectR3Media } from '../frontend-r3/media.js';
import { normalizeObserver } from '../runtime-r3/domain/observer-normalizer.js';
import { reduceObservation } from '../runtime-r3/domain/reducer.js';

const content = loadCanonicalCompanyR3Content();
const heroine = content.characters.heroine1;
const secret = 'r3-media-test-secret';

function contextFor({ present = ['heroine1'], story = `${heroine.name}: "Hello"`, sexual = undefined, observerApplied = {} } = {}) {
  const state = { scene: { location_id: 'office_floor_1', present_actor_ids: present, scene_note: 'desk' } };
  if (sexual !== undefined) state.sexual = sexual;
  return { state: { committed_turn: 1, state }, turns: [{ turn_number: 1, revision: 1, story_text: story, observer_applied: observerApplied }] };
}

test('R3 Observer presentation projection is strictly grounded and outside gameplay state', () => {
  const story = '서원희 차장이 고개를 끄덕였다.\n\n“오늘은 제가 먼저 안내할게요.”';
  const observation = normalizeObserver({
    present_actor_ids: ['heroine1', 'heroine2', 'heroine3', 'heroine4', 'heroine5'],
    focal_actor: { actor_id: 'heroine1', quote: '서원희 차장이 고개를 끄덕였다.' },
    dialogue_lines: [{ speaker_id: 'heroine1', text: '오늘은 제가 먼저 안내할게요.', evidence_quote: '서원희 차장이 고개를 끄덕였다.\n\n“오늘은 제가 먼저 안내할게요.”' }]
  }, { storyText: story, content, currentState: { scene: { present_actor_ids: ['heroine1', 'heroine2', 'heroine3', 'heroine4', 'heroine5'] } } });
  assert.deepEqual(observation.focal_actor, { actor_id: 'heroine1', quote: '서원희 차장이 고개를 끄덕였다.' });
  assert.equal(observation.dialogue_lines[0].speaker_id, 'heroine1');
  assert.equal(observation.dialogue_lines[0].text, '오늘은 제가 먼저 안내할게요.');
  const reduced = reduceObservation({ state: { scene: { location_id: 'office_floor_1', present_actor_ids: ['heroine1'] }, time: { day: 1, minute: 1 } }, observation, turnNumber: 1 });
  assert.equal(reduced.state.scene.focal_actor_id, undefined);
  assert.equal(reduced.applied.focal_actor.actor_id, 'heroine1');
  assert.equal(reduced.applied.dialogue_lines.length, 1);
  const invalid = normalizeObserver({ focal_actor: { actor_id: 'heroine2', quote: 'not in Story' }, dialogue_lines: [{ speaker_id: 'heroine2', text: 'invented', evidence_quote: '윤민아가 말했다. invented' }] }, { storyText: story, content, currentState: { scene: { present_actor_ids: ['heroine1', 'heroine2'] } } });
  assert.equal(invalid.focal_actor, null);
  assert.deepEqual(invalid.dialogue_lines, []);
  assert.ok(invalid.warnings.includes('focal_actor_projection_dropped'));
  assert.ok(invalid.warnings.includes('dialogue_projection_dropped'));
});

test('R3 media consumes committed grounded presentation before rejecting ambiguous presence', () => {
  const story = '서원희 차장이 말했다. “오늘은 제가 먼저 안내할게요.”';
  const observerApplied = { focal_actor: { actor_id: 'heroine1', quote: story }, dialogue_lines: [{ speaker_id: 'heroine1', text: '오늘은 제가 먼저 안내할게요.', evidence_quote: story }] };
  assert.equal(projectCurrentMedia({ context: contextFor({ present: ['heroine1', 'heroine2', 'heroine3', 'heroine4', 'heroine5'], story, observerApplied }), content }).character_id, 'heroine1');
  assert.equal(projectCurrentMedia({ context: contextFor({ present: ['heroine1', 'heroine2', 'heroine3', 'heroine4', 'heroine5'], story }), content }).character_id, null);
});

test('R3 media projection requires a present registered heroine and defaults sex requests to general', () => {
  const context = contextFor();
  assert.equal(projectCurrentMedia({ context, content }).character_id, 'heroine1');
  assert.equal(projectCurrentMedia({ context, content, requestedCharacterId: 'heroine2' }).character_id, null);
  assert.equal(projectCurrentMedia({ context, content, requestedPool: 'sex' }).pool, 'general');
  assert.equal(projectCurrentMedia({ context: contextFor({ sexual: { active: true } }), content, requestedPool: 'sex' }).pool, 'sex');
  assert.equal(projectCurrentMedia({ context: contextFor({ present: ['unknown_npc'] }), content }).character_id, null);
});

test('R3 approved image selection is deterministic and bounded to usable candidates', () => {
  const projection = projectCurrentMedia({ context: contextFor(), content });
  const selected = selectApprovedImage({ projection, candidates: [
    { image_id: 'remote', image_url: 'https://approved.test/remote.jpg', curation_rank: 3 },
    { image_id: 'local', image_url: 'data:image/jpeg;base64,dead', curation_rank: 1 },
    { image_id: 'primary', image_url: 'https://approved.test/primary.jpg', curation_rank: 2 }
  ] });
  assert.deepEqual(selected, { image_id: 'primary', image_url: 'https://approved.test/primary.jpg', source: 'primary' });
  assert.equal(selectApprovedImage({ projection, candidates: [] }), null);
});

test('committed dialogue is the only TTS input and canonical voice is exact', () => {
  const context = contextFor({ story: `${heroine.name} (calm): "Exact line"\nNarrator: "Not a character"` });
  const batch = resolveCommittedTtsBatch({ context, content, speakerId: 'heroine1', spokenText: 'Exact line' });
  assert.equal(batch.text, 'Exact line');
  assert.equal(resolveCommittedTtsBatch({ context, content, speakerId: 'heroine1', spokenText: 'Invented line' }), null);
  assert.deepEqual(resolveCommittedTtsVoice({ content, speakerId: 'heroine1', spokenText: batch.text }), { eligible: true, voice_id: heroine.voice_id });
  assert.equal(resolveCommittedTtsVoice({ content, speakerId: 'narrator', spokenText: batch.text }).eligible, false);
  assert.equal(resolveCommittedTtsVoice({ content, speakerId: 'remote', spokenText: batch.text }).eligible, false);
});

test('server authorizes each exact current heroine batch without reselecting frontend primary', () => {
  const heroine2 = content.characters.heroine2;
  const heroine5 = content.characters.heroine5;
  const heroine2Quote = heroine2.name + ' said "Mina exact line".';
  const heroine5Quote = heroine5.name + ' said "May exact line".';
  const context = contextFor({
    present: ['heroine2', 'heroine5'],
    story: heroine2Quote + '\n' + heroine5Quote,
    observerApplied: {
      focal_actor: { actor_id: 'heroine5', quote: heroine5Quote },
      dialogue_lines: [
        { speaker_id: 'heroine2', text: 'Mina exact line', evidence_quote: heroine2Quote },
        { speaker_id: 'heroine5', text: 'May exact line', evidence_quote: heroine5Quote }
      ]
    }
  });
  assert.equal(resolveCommittedTtsBatch({ context, content, speakerId: 'heroine5', spokenText: 'May exact line' })?.text, 'May exact line');
});

test('server TTS authorization keeps exact latest-turn and fail-open boundaries', () => {
  const heroine2 = content.characters.heroine2;
  const heroine5 = content.characters.heroine5;
  const heroine2Quote = heroine2.name + ' said "Mina exact line".';
  const heroine5Quote = heroine5.name + ' said "May exact line".';
  const current = contextFor({
    present: ['heroine2', 'heroine5'],
    story: heroine2Quote + '\n' + heroine5Quote,
    observerApplied: {
      focal_actor: { actor_id: 'heroine5', quote: heroine5Quote },
      dialogue_lines: [
        { speaker_id: 'heroine2', text: 'Mina exact line', evidence_quote: heroine2Quote },
        { speaker_id: 'heroine5', text: 'May exact line', evidence_quote: heroine5Quote }
      ]
    }
  });
  assert.equal(resolveCommittedTtsBatch({ context: current, content, speakerId: 'heroine2', spokenText: 'Mina exact line' })?.text, 'Mina exact line');
  assert.equal(resolveCommittedTtsBatch({ context: current, content, speakerId: 'heroine5', spokenText: 'May exact line' })?.text, 'May exact line');
  assert.deepEqual(resolveCommittedTtsVoice({ content, speakerId: 'heroine5', spokenText: 'May exact line' }), { eligible: true, voice_id: heroine5.voice_id });
  assert.equal(resolveCommittedTtsBatch({ context: current, content, speakerId: 'heroine5', spokenText: 'May exact' }), null);
  assert.equal(resolveCommittedTtsBatch({ context: current, content, speakerId: 'heroine5', spokenText: 'Mina exact line' }), null);

  const stale = { ...current, state: { ...current.state, committed_turn: 2 }, turns: [
    { turn_number: 1, revision: 1, story_text: heroine5Quote, observer_applied: { dialogue_lines: [{ speaker_id: 'heroine5', text: 'May exact line', evidence_quote: heroine5Quote }] } },
    { turn_number: 2, revision: 1, story_text: heroine2Quote, observer_applied: { dialogue_lines: [{ speaker_id: 'heroine2', text: 'Mina exact line', evidence_quote: heroine2Quote }] } }
  ] };
  assert.equal(resolveCommittedTtsBatch({ context: stale, content, speakerId: 'heroine5', spokenText: 'May exact line' }), null);

  const absent = contextFor({ present: ['heroine2'], story: heroine5Quote, observerApplied: { dialogue_lines: [{ speaker_id: 'heroine5', text: 'May exact line', evidence_quote: heroine5Quote }] } });
  assert.equal(resolveCommittedTtsBatch({ context: absent, content, speakerId: 'heroine5', spokenText: 'May exact line' }), null);

  const general = contextFor({ present: ['general_seo_hyejin'], story: '서혜진 said "General line".', observerApplied: { dialogue_lines: [{ speaker_id: 'general_seo_hyejin', text: 'General line', evidence_quote: '서혜진 said "General line".' }] } });
  assert.equal(resolveCommittedTtsBatch({ context: general, content, speakerId: 'general_seo_hyejin', spokenText: 'General line' }), null);
  assert.equal(resolveCommittedTtsBatch({ context: current, content, speakerId: 'narrator', spokenText: 'May exact line' }), null);
  assert.equal(resolveCommittedTtsBatch({ context: current, content, speakerId: 'player', spokenText: 'May exact line' }), null);
  assert.equal(resolveCommittedTtsBatch({ context: current, content, speakerId: 'heroine5', spokenText: 'Mind Monitor line' }), null);

  const observerFailed = contextFor({ present: ['heroine5'], story: heroine5Quote, observerApplied: { warnings: ['observer_failed'], dialogue_lines: [] } });
  assert.equal(resolveCommittedTtsBatch({ context: observerFailed, content, speakerId: 'heroine5', spokenText: 'May exact line' }), null);

  const multiLineQuote = heroine5.name + ' said "First line" and then "Second line".';
  const multiLine = contextFor({ present: ['heroine5'], story: multiLineQuote, observerApplied: { dialogue_lines: [
    { speaker_id: 'heroine5', text: 'First line', evidence_quote: multiLineQuote },
    { speaker_id: 'heroine5', text: 'Second line', evidence_quote: multiLineQuote }
  ] } });
  assert.equal(resolveCommittedTtsBatch({ context: multiLine, content, speakerId: 'heroine5', spokenText: 'First line Second line' })?.text, 'First line Second line');
});

test('media routes read committed state, never call the provider, and use the TTS binding contract', async () => {
  const store = new InMemoryR3Store();
  store.listImageCandidates = async () => [{ image_id: 'heroine1-main', image_url: 'https://approved.test/heroine1.jpg', curation_rank: 1, image_pool: 'general' }];
  let providerCalls = 0; const provider = { story: async function* () { providerCalls += 1; yield 'unused'; }, observe: async () => { providerCalls += 1; return {}; } };
  const bindingCalls = [];
  const env = { TTS_WORKER_URL: 'https://tts.test/', TTS_WORKER: { fetch: async (url, init) => { bindingCalls.push({ url, init }); return new Response(JSON.stringify({ url: 'https://audio.test/line.mp3' }), { headers: { 'content-type': 'application/json' } }); } } };
  const worker = createR3Worker({ store, provider, content, gameAccessSecret: secret, env });
  const setupResponse = await worker.fetch(new Request('https://r3.test/api/r3/games', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ profile: { name: 'Player', department_id: content.departments[0].department_id, position_id: content.positions[0].position_id, age: 29, height_cm: 178, weight_kg: 72, penis_length_cm: 14, body_type_id: content.bodyTypes[0].body_type_id, speech_style_id: content.speechStyles[0].speech_style_id } }) }));
  const setup = (await setupResponse.json()).data; const gameId = setup.game.game_id; const auth = { authorization: `Bearer ${setup.game_capability}` };
  const state = store.states.get(gameId); state.revision = 1; state.committed_turn = 1; state.state.scene.present_actor_ids = ['heroine1']; state.state.scene.scene_note = 'desk';
  store.turns.set(`${gameId}:1`, { game_id: gameId, turn_number: 1, revision: 1, story_text: `${heroine.name}: "Exact line"`, observer_applied: {} });
  const imageResponse = await worker.fetch(new Request(`https://r3.test/api/r3/games/${gameId}/media/image?character_id=heroine1`, { headers: auth }));
  assert.equal((await imageResponse.json()).data.image.image_url, 'https://approved.test/heroine1.jpg');
  const ttsResponse = await worker.fetch(new Request(`https://r3.test/api/r3/games/${gameId}/media/tts?speaker_id=heroine1&text=${encodeURIComponent('Exact line')}`, { headers: auth }));
  assert.equal((await ttsResponse.json()).data.url, 'https://audio.test/line.mp3');
  assert.equal(bindingCalls.length, 1); assert.deepEqual(JSON.parse(bindingCalls[0].init.body), { voice_id: heroine.voice_id, text: 'Exact line', direction: '' });
  assert.equal(providerCalls, 0);
});

test('R3 frontend media uses committed dialogue and no browser speech synthesis', () => {
  const lines = parseR3DialogueLines(`${heroine.name}: "Hello"`, { heroine1: heroine.name });
  assert.equal(lines[0].speaker_id, 'heroine1');
  assert.equal(projectR3Media({ scene: { present_actor_ids: ['heroine1'] }, actorNames: { heroine1: heroine.name }, media: { dialogue_lines: lines } }).image_character_id, 'heroine1');
  assert.doesNotMatch(fs.readFileSync(new URL('../frontend-r3/app.js', import.meta.url), 'utf8'), /speechSynthesis|SpeechSynthesisUtterance/);
});
