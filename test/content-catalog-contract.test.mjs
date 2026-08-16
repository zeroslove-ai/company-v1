import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import edition from '../src/api/edition.js';
import { masterFromEdition, npcIdsFromEdition } from '../src/api/turn-routes.js';
import { buildStoryPrompt } from '../src/engine/story-prompt.js';
import { buildExtractPrompt, buildRegisteredCharacters, buildRegisteredLocations } from '../src/engine/extract-prompt.js';
import { buildActiveCharacterCanon, hydrateGameplayState, migrateCompanySave, selectActiveCharacterIds } from '../src/engine/gameplay-state.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const readJson = file => JSON.parse(read(file));

const HEROINE_IDS = ['heroine1', 'heroine2', 'heroine3', 'heroine4', 'heroine5'];
const STORAGE_MAP = {
  heroine1: { storage_prefix: 'Heroine1', primary_image_path: 'Heroine1/one_main.jpg', adult_image_prefix: 'Heroine1/adult/' },
  heroine2: { storage_prefix: 'Heroine2', primary_image_path: 'Heroine2/minami_main.jpg', adult_image_prefix: 'Heroine2/adult/' },
  heroine3: { storage_prefix: 'Heroine3', primary_image_path: 'Heroine3/jena_main.jpg', adult_image_prefix: 'Heroine3/adult/' },
  heroine4: { storage_prefix: 'Heroine4', primary_image_path: 'Heroine4/live_main.jpg', adult_image_prefix: 'Heroine4/adult/' },
  heroine5: { storage_prefix: 'Heroine5', primary_image_path: 'Heroine5/may_main.jpg', adult_image_prefix: 'Heroine5/adult/' }
};

function characters() {
  return readJson('content/characters.json').characters;
}

function charactersMap() {
  return edition.characters.characters;
}

function saveWithParticipants(ids) {
  return {
    save_schema_version: 1, edition: 'company-v1', world_state: {},
    scene: { version: 1, scene_id: null, location_id: null, beat: 0, goal: null, focus_thread: null, present_npc_ids: ids, focal_character_id: null, last_speaker_id: null, updated_turn: 0 },
    scene_state: { participants: ids }, focal_character_id: null, last_speaker_id: null
  };
}

// --- Content shape ---------------------------------------------------------

test('content/characters.json registers exactly heroine1-5 with matching map keys and character_id', () => {
  const chars = characters();
  assert.deepEqual(Object.keys(chars).sort(), [...HEROINE_IDS].sort());
  for (const id of HEROINE_IDS) assert.equal(chars[id].character_id, id);
});

test('stable IDs and names are unique across the five heroines', () => {
  const chars = characters();
  const ids = Object.values(chars).map(c => c.character_id);
  const names = Object.values(chars).map(c => c.name);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(new Set(names).size, names.length);
});

test('every heroine is an adult in 브랜드전략팀 with no invented unsupported stats', () => {
  const chars = characters();
  for (const id of HEROINE_IDS) {
    const c = chars[id];
    assert.ok(Number.isInteger(c.age) && c.age >= 20, `${id} age`);
    assert.equal(c.department, '브랜드전략팀');
    assert.deepEqual(
      c.initial_stats,
      { affinity: c.initial_stats.affinity, resistance: c.initial_stats.resistance, csa_acceptance: c.initial_stats.csa_acceptance }
    );
    assert.ok(c.initial_stats.affinity >= 1 && c.initial_stats.affinity <= 20, `${id} affinity 1~20`);
    assert.ok(c.initial_stats.resistance >= 0 && c.initial_stats.resistance <= 100, `${id} resistance 0~100`);
  }
});

test('required content fields and configured voice IDs are never null; the compact field list has no detailed-doc-only fields', () => {
  const chars = characters();
  const requiredNonNull = ['name', 'age', 'position', 'role_title', 'gender', 'company_tenure'];
  const detailedDocOnlyFields = ['public_role_summary', 'appearance', 'personality', 'speech_style', 'addressing_rules', 'habits', 'work_profile', 'relationship_hooks', 'csa_response_profile', 'youngest_line'];
  for (const id of HEROINE_IDS) {
    const c = chars[id];
    for (const field of requiredNonNull) assert.notEqual(c[field], null, `${id}.${field}`);
    assert.match(c.voice_id, /^[0-9a-f]{32}$/i, `${id}.voice_id`);
    assert.equal(c.mapping_status, 'resolved', `${id}.mapping_status`);
    for (const field of detailedDocOnlyFields) assert.equal(field in c, false, `${id} must not carry ${field}`);
  }
});

test('prompt_card has the canonical shape, stays within budget, and never repeats dialogue examples', () => {
  const chars = characters();
  for (const id of HEROINE_IDS) {
    const card = chars[id].prompt_card;
    for (const field of ['identity', 'appearance', 'personality', 'speech', 'addressing', 'distinctive_traits', 'csa_style']) {
      assert.ok(Object.hasOwn(card, field), `${id}.prompt_card.${field}`);
    }
    for (const field of ['identity', 'appearance', 'personality', 'speech', 'addressing', 'csa_style']) {
      assert.equal(typeof card[field], 'string', `${id}.prompt_card.${field}`);
      assert.equal(card[field].includes('"'), false, `${id}.prompt_card.${field} must not contain a quoted dialogue example`);
    }
    assert.ok(Array.isArray(card.distinctive_traits) && card.distinctive_traits.length <= 4, `${id} distinctive_traits`);
    const cardChars = JSON.stringify(card).length;
    assert.ok(cardChars <= 600, `${id} prompt_card chars: ${cardChars}`);
  }
});

// --- Storage -----------------------------------------------------------

test('Storage bindings match the resolved bucket/prefix/path/adult-prefix exactly, without inventing a URL or file-move info', () => {
  const chars = characters();
  for (const id of HEROINE_IDS) {
    const c = chars[id];
    assert.equal(c.storage_bucket, 'Image', `${id}.storage_bucket`);
    assert.equal(c.storage_prefix, STORAGE_MAP[id].storage_prefix, `${id}.storage_prefix`);
    assert.equal(c.primary_image_path, STORAGE_MAP[id].primary_image_path, `${id}.primary_image_path`);
    assert.equal(c.adult_image_prefix, STORAGE_MAP[id].adult_image_prefix, `${id}.adult_image_prefix`);
    assert.ok(c.adult_image_prefix.endsWith('/'), `${id} adult prefix trailing slash`);
    assert.equal(c.primary_image_path.includes('/adult/'), false, `${id} primary path is not under adult/`);
    const keys = Object.keys(c);
    for (const forbidden of ['storage_url', 'public_url', 'signed_url', 'moved_from', 'reuploaded', 'renamed_from']) {
      assert.equal(keys.includes(forbidden), false, `${id} must not have ${forbidden}`);
    }
  }
});

// --- CSA ---------------------------------------------------------------

test('no active_suggestions, personal suggestion, or per-NPC active-CSA list exists on any heroine', () => {
  const chars = characters();
  for (const id of HEROINE_IDS) {
    const keys = Object.keys(chars[id]);
    for (const forbidden of ['active_suggestions', 'personal_suggestion', 'active_csa_ids', 'csa_active', 'player_only_csa']) {
      assert.equal(keys.includes(forbidden), false, `${id} must not have ${forbidden}`);
    }
  }
});

test('initial_csa_attitudes is empty for every heroine regardless of the CSA preset catalog', () => {
  // The CSA-app port (company/csa-app-port-v1) populated content/csa_presets.json with the
  // real preset catalog; per-heroine initial_csa_attitudes stays {} independently of that —
  // attitude tracking is runtime state, never seeded from the catalog itself.
  const chars = characters();
  for (const id of HEROINE_IDS) assert.deepEqual(chars[id].initial_csa_attitudes, {}, id);
});

test('every heroine has a distinct one-line csa_style narrative disposition', () => {
  const chars = characters();
  const styles = HEROINE_IDS.map(id => {
    const style = chars[id].prompt_card.csa_style;
    assert.equal(typeof style, 'string', `${id} csa_style`);
    assert.ok(style.length > 0, `${id} csa_style not empty`);
    return style;
  });
  assert.equal(new Set(styles).size, styles.length, 'csa_style must not be identical across heroines');
});

// --- Relationship --------------------------------------------------------

test('initial_relationship has the canonical shape, romance_status none, and null sexual milestones for every heroine', () => {
  const chars = characters();
  for (const id of HEROINE_IDS) {
    const relationship = chars[id].initial_relationship;
    for (const field of ['closeness', 'romance_status', 'current_boundary', 'milestones', 'relationship_summary']) {
      assert.ok(Object.hasOwn(relationship, field), `${id}.initial_relationship.${field}`);
    }
    assert.equal(relationship.romance_status, 'none', id);
    assert.equal(relationship.milestones.first_kiss_turn, null, id);
    assert.equal(relationship.milestones.sexual_relationship_started_turn, null, id);
  }
});

test('hydration fills all five heroines into a save that has none of them, without overwriting an existing one', () => {
  const bareSave = migrateCompanySave({ save_schema_version: 1, edition: 'company-v1', world_state: {} });
  const master = masterFromEdition(edition);
  const hydrated = hydrateGameplayState(bareSave, master);
  for (const id of HEROINE_IDS) {
    assert.ok(hydrated.npc_stats[id].affinity >= 1 && hydrated.npc_stats[id].affinity <= 20, id);
    assert.ok(hydrated.npc_relationship_state[id], id);
    assert.deepEqual(hydrated.csa_attitudes[id], {}, id);
  }

  const existingSave = migrateCompanySave({
    save_schema_version: 1, edition: 'company-v1', world_state: {},
    npc_stats: { heroine1: { affinity: 42 } }
  });
  const preserved = hydrateGameplayState(existingSave, master);
  assert.equal(preserved.npc_stats.heroine1.affinity, 42);
  assert.ok(preserved.npc_stats.heroine2.affinity >= 1 && preserved.npc_stats.heroine2.affinity <= 20);
});

// --- Stable IDs ----------------------------------------------------------

test('masterFromEdition and npcIdsFromEdition resolve exactly the five registered heroines from real content', () => {
  const master = masterFromEdition(edition);
  assert.equal(master.characters.length, 5);
  assert.deepEqual(master.characters.map(c => c.character_id).sort(), [...HEROINE_IDS].sort());
  const npcIds = npcIdsFromEdition(edition);
  for (const id of HEROINE_IDS) assert.equal(npcIds.has(id), true, id);
  assert.equal(npcIds.has('heroine6'), false);
});

// --- Active character selection ---------------------------------------------

test('selectActiveCharacterIds excludes characters not in the scene, includes exact full-name mentions first, and never partial-matches', () => {
  const map = charactersMap();
  const npcIds = npcIdsFromEdition(edition);
  const emptyScene = selectActiveCharacterIds({ charactersMap: map, npcIds, save: saveWithParticipants([]), playerAction: '보고서를 작성한다.' });
  assert.deepEqual(emptyScene, []);

  const mentioned = selectActiveCharacterIds({ charactersMap: map, npcIds, save: saveWithParticipants(['heroine2']), playerAction: '서원희에게 인사한다.' });
  assert.deepEqual(mentioned, ['heroine1', 'heroine2']);

  const partialMention = selectActiveCharacterIds({ charactersMap: map, npcIds, save: saveWithParticipants([]), playerAction: '서 팀장에게 말을 건다.' });
  assert.deepEqual(partialMention, []);
});

test('selectActiveCharacterIds does not revive a legacy-only participant when canonical scene exists', () => {
  const map = charactersMap();
  const npcIds = npcIdsFromEdition(edition);
  const save = saveWithParticipants(['heroine2']);
  save.scene = {
    version: 1,
    scene_id: 'canonical',
    location_id: 'office',
    beat: 0,
    goal: null,
    focus_thread: null,
    present_npc_ids: ['heroine1'],
    focal_character_id: null,
    last_speaker_id: null,
    updated_turn: 1
  };
  assert.deepEqual(selectActiveCharacterIds({ charactersMap: map, npcIds, save, playerAction: '' }), ['heroine1']);
});

test('active_character_canon includes at most 3 full prompt_card entries; the 4th and beyond are identity-only', () => {
  const map = charactersMap();
  const oneActive = buildActiveCharacterCanon(map, ['heroine1']);
  assert.deepEqual(Object.keys(oneActive), ['heroine1']);
  assert.ok(oneActive.heroine1.prompt_card);

  const threeActive = buildActiveCharacterCanon(map, ['heroine1', 'heroine2', 'heroine3']);
  assert.equal(Object.keys(threeActive).length, 3);
  for (const id of Object.keys(threeActive)) assert.ok(threeActive[id].prompt_card, id);

  const fiveActive = buildActiveCharacterCanon(map, [...HEROINE_IDS]);
  assert.equal(Object.keys(fiveActive).length, 5);
  const withCard = Object.values(fiveActive).filter(entry => 'prompt_card' in entry);
  const identityOnly = Object.values(fiveActive).filter(entry => !('prompt_card' in entry));
  assert.equal(withCard.length, 3);
  assert.equal(identityOnly.length, 2);
  for (const entry of identityOnly) {
    assert.deepEqual(Object.keys(entry).sort(), ['character_id', 'name', 'position', 'role_title'].sort());
  }
});

test('a character absent from the current scene is never sent at all', () => {
  const map = charactersMap();
  const canon = buildActiveCharacterCanon(map, ['heroine1']);
  assert.equal('heroine2' in canon, false);
  assert.equal('heroine3' in canon, false);
});

// --- Story canon -----------------------------------------------------------

test('Story prompt scene_actors scales 1/3/5 participants correctly, excludes Storage/voice fields, and never mutates edition or context', () => {
  const buildFor = ids => buildStoryPrompt({ edition, context: { game: {}, save: saveWithParticipants(ids), recent_turns: [] }, playerAction: 'x', expectedTurn: 1 });

  const one = JSON.parse(buildFor(['heroine1'])[1].content);
  assert.equal(Object.keys(one.scene_actors).length, 1);

  const three = JSON.parse(buildFor(['heroine1', 'heroine2', 'heroine3'])[1].content);
  assert.equal(Object.keys(three.scene_actors).length, 3);
  for (const entry of Object.values(three.scene_actors)) assert.ok(entry.prompt_card);

  const five = JSON.parse(buildFor([...HEROINE_IDS])[1].content);
  const entries = Object.values(five.scene_actors);
  assert.equal(entries.filter(e => 'prompt_card' in e).length, 3);
  assert.equal(entries.filter(e => !('prompt_card' in e)).length, 2);

  for (const entry of Object.values(five.scene_actors)) {
    for (const forbidden of ['storage_bucket', 'storage_prefix', 'primary_image_path', 'adult_image_prefix', 'voice_id', 'mapping_status', 'initial_stats', 'initial_relationship', 'initial_csa_attitudes']) {
      assert.equal(forbidden in entry, false, `${entry.character_id}.${forbidden}`);
    }
  }

  const editionBefore = JSON.stringify(edition);
  const contextInput = { game: {}, save: saveWithParticipants([...HEROINE_IDS]), recent_turns: [] };
  const contextBefore = JSON.stringify(contextInput);
  buildStoryPrompt({ edition, context: contextInput, playerAction: 'x', expectedTurn: 1 });
  assert.equal(JSON.stringify(edition), editionBefore);
  assert.equal(JSON.stringify(contextInput), contextBefore);
});

test('Story prompt exposes actor and reference identity sections', () => {
  const prompt = buildStoryPrompt({ edition, context: { game: {}, save: saveWithParticipants(['heroine1']), recent_turns: [] }, playerAction: 'x', expectedTurn: 1 });
  const system = prompt[0].content;
  assert.ok(system.includes('scene_actors'));
  assert.ok(system.includes('reference_characters'));
});

test('no real-world group or model name appears in the built Story prompt', () => {
  const prompt = buildStoryPrompt({ edition, context: { game: {}, save: saveWithParticipants([...HEROINE_IDS]), recent_turns: [] }, playerAction: 'x', expectedTurn: 1 });
  const combined = prompt.map(m => m.content).join('\n');
  for (const forbidden of ['RESCENE', '리센느', '미나미']) assert.equal(combined.includes(forbidden), false, forbidden);
});

// --- Extract mapping and payload deduplication ------------------------------

test('buildRegisteredCharacters returns only heroine id/name pairs with no Storage fields', () => {
  const registered = buildRegisteredCharacters(edition);
  assert.equal(registered.length, 5);
  for (const entry of registered) {
    assert.deepEqual(Object.keys(entry).sort(), ['character_id', 'name']);
    assert.ok(HEROINE_IDS.includes(entry.character_id));
  }
  assert.deepEqual(registered.find(e => e.character_id === 'heroine1'), { character_id: 'heroine1', name: '서원희' });
});

test('Extract receives a compact registered location ID dictionary for grounded movement', () => {
  const locations = buildRegisteredLocations(edition);
  const office = locations.find(location => location.location_id === 'brand_strategy_office');
  assert.deepEqual(office, {
    location_id: 'brand_strategy_office',
    name: '브랜드전략팀 사무실',
    aliases: ['브랜드전략팀', '브랜드팀', '브랜드 사무실'],
    floor: 3,
    department_id: 'brand_strategy'
  });
  assert.equal(Object.hasOwn(office, 'description'), false);
  const payload = JSON.parse(buildExtractPrompt({ edition, context: { save: { scene: { version: 1, scene_id: null, location_id: null, beat: 0, goal: null, focus_thread: null, present_npc_ids: [], focal_character_id: null, last_speaker_id: null, updated_turn: 0 } } }, storyText: 'x', playerAction: '브랜드전략팀 사무실로 이동한다', expectedTurn: 2 })[1].content);
  assert.deepEqual(payload.registered_locations.find(location => location.location_id === office.location_id), office);
});

test('Extract prompt user payload carries one registered identity registry and stable-id rules', () => {
  const prompt = buildExtractPrompt({ context: { save: { scene: { version: 1, scene_id: null, location_id: null, beat: 0, goal: null, focus_thread: null, present_npc_ids: [], focal_character_id: null, last_speaker_id: null, updated_turn: 0 } } }, storyText: 'x', parsedStory: {}, expectedTurn: 1, edition });
  const payload = JSON.parse(prompt[1].content);
  assert.equal(payload.registered_identities.length, 13);
  assert.equal('registered_characters' in payload, false);
  assert.equal('registered_general_npcs' in payload, false);
  assert.equal('player_action' in payload, false);
  const system = prompt[0].content;
  assert.match(system, /registered identities list the only stable NPC ids/);
  assert.match(system, /never invent, guess, or reuse an id/);
  assert.match(system, /never copy one into another/);
});

test('Extract payload carries raw Story and strips parser-memory internals', () => {
  const parsedStory = {
    raw: '[1. 서사 및 행동]\n전체 원문 그대로.',
    scene_text: '전체 원문 그대로.',
    blocks: [{ type: 'scene', text: '전체 원문 그대로.' }],
    player_inner_thought: '생각.',
    player_status: '상태.',
    choices: ['a', 'b', 'c', 'd'],
    dialogue_lines: [],
    warnings: []
  };
  const prompt = buildExtractPrompt({ context: { save: { scene: { version: 1, scene_id: null, location_id: null, beat: 0, goal: null, focus_thread: null, present_npc_ids: [], focal_character_id: null, last_speaker_id: null, updated_turn: 0 } } }, storyText: '[1. 서사 및 행동]\n전체 원문 그대로.', parsedStory, playerAction: 'x', expectedTurn: 1, edition });
  const payload = JSON.parse(prompt[1].content);
  assert.equal(payload.story_text, '[1. 서사 및 행동]\n전체 원문 그대로.');
  assert.equal(payload.extract_version, 2);
  assert.equal('parsed_story' in payload, false);
  assert.equal('parser_projection' in payload, false);
  assert.equal('story_observation_blocks' in payload, false);
  const occurrences = prompt[1].content.split('전체 원문 그대로').length - 1;
  assert.equal(occurrences, 1, 'Only the raw Story is supplied to Extract');
});

test('Extract context has no full save, no character prompt_card/personality/appearance, and only the active NPCs\' mutable state', () => {
  const save = { ...saveWithParticipants(['heroine1']), npc_stats: { heroine1: { affinity: 3 }, heroine2: { affinity: 9 } } };
  const prompt = buildExtractPrompt({ context: { game: {}, save, recent_turns: [] }, storyText: 'x', parsedStory: {}, playerAction: 'x', expectedTurn: 1, edition });
  const payload = JSON.parse(prompt[1].content);
  assert.equal('save' in payload.context, false);
  assert.equal('prompt_card' in payload.context, false);
  assert.equal('personality' in payload.context, false);
  assert.equal('appearance' in payload.context, false);
  assert.deepEqual(Object.keys(payload.context.active_npc_state.npc_stats), ['heroine1']);
});

// --- Title -----------------------------------------------------------------

test('edition title and content_version are updated with no stale product naming', () => {
  const editionContent = readJson('content/edition.json');
  assert.equal(editionContent.title, '상식개변: 회사편');
  assert.equal(editionContent.content_version, '0.1.0-heroines-v1');
  for (const forbidden of ['게임빌더', 'COMPANY V1', 'Phase', 'v1']) {
    assert.equal(editionContent.title.includes(forbidden), false, forbidden);
  }
});

// --- Forbidden word scan ----------------------------------------------------

test('content files, the heroines doc, and built prompt payloads contain none of the forbidden real-person tokens', () => {
  const realPersonTokens = ['리센느', 'RESCENE', '미나미'];
  const contentFeatureTokens = ['active_suggestions', 'personal suggestion', '개인 암시'];
  const contentSources = [
    read('content/characters.json'), read('content/edition.json'), read('content/general_npcs.json'), read('content/csa_presets.json'),
    read('fixtures/gameplay-state-v1/five-character-master-v1.json'), read('docs/COMPANY_HEROINES_V1.md')
  ];
  const save = saveWithParticipants([...HEROINE_IDS]);
  const storyPrompt = buildStoryPrompt({ edition, context: { game: {}, save, recent_turns: [] }, playerAction: 'x', expectedTurn: 1 });
  const extractPrompt = buildExtractPrompt({ context: { game: {}, save, recent_turns: [] }, storyText: 'x', parsedStory: {}, playerAction: 'x', expectedTurn: 1, edition });
  const allPromptText = [...storyPrompt, ...extractPrompt].map(m => m.content);
  for (const source of [...contentSources, ...allPromptText]) {
    for (const term of realPersonTokens) assert.equal(source.includes(term), false, term);
  }
  const userPayloads = [storyPrompt[1].content, extractPrompt[1].content];
  for (const source of [...contentSources, ...userPayloads]) {
    for (const term of contentFeatureTokens) assert.equal(source.includes(term), false, term);
  }
});

// --- Size budgets ------------------------------------------------------------

test('Story request size budgets: system <=11000, 3-character scene actors <=1800, 5-participant scene still caps at 3 full cards', () => {
  const prompt = buildStoryPrompt({ edition, context: { game: {}, save: saveWithParticipants([...HEROINE_IDS]), recent_turns: [] }, playerAction: 'x', expectedTurn: 1 });
  const systemChars = prompt[0].content.length;
  const payload = JSON.parse(prompt[1].content);
  const canonChars = JSON.stringify(payload.scene_actors).length;
  assert.ok(systemChars <= 11000, `story system chars: ${systemChars}`);
  assert.ok(canonChars <= 1800, `scene_actors chars: ${canonChars}`);
  assert.equal(Object.values(payload.scene_actors).filter(e => 'prompt_card' in e).length, 3);
});

test('Extract request system budget remains within 9000 characters', () => {
  // Raised from 3300 to 5000: UI 개선(표면의식·잠재의식 대화체 혼잣말 지시문 추가) 반영.
  // 실측 floor ~3.4K — 5000은 충분한 여유.
  const prompt = buildExtractPrompt({ context: { game: {}, save: saveWithParticipants([...HEROINE_IDS]), recent_turns: [] }, storyText: 'x', parsedStory: {}, playerAction: 'x', expectedTurn: 1, edition });
  assert.ok(prompt[0].content.length <= 9000, `extract system chars: ${prompt[0].content.length}`); // 예산 7000 (image_selection 지시 반영)
});
