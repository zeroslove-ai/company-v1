import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import edition from '../src/api/edition.js';
import { masterFromEdition, npcIdsFromEdition } from '../src/api/turn-routes.js';
import { buildCharacterCanonSnapshot, buildStoryPrompt } from '../src/engine/story-prompt.js';
import { buildExtractPrompt, buildRegisteredCharacters } from '../src/engine/extract-prompt.js';
import { parseNarrative } from '../src/engine/narrative-parser.js';
import { hydrateGameplayState, migrateCompanySave } from '../src/engine/gameplay-state.js';

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
    assert.deepEqual(c.initial_stats, { affection: 0 });
  }
});

test('required content fields are never null; only voice_id may be null', () => {
  const chars = characters();
  const requiredNonNull = ['name', 'age', 'position', 'role_title', 'gender', 'company_tenure', 'public_role_summary'];
  for (const id of HEROINE_IDS) {
    const c = chars[id];
    for (const field of requiredNonNull) assert.notEqual(c[field], null, `${id}.${field}`);
    assert.equal(c.voice_id, null, `${id}.voice_id`);
    assert.equal(c.mapping_status, 'resolved', `${id}.mapping_status`);
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

test('initial_csa_attitudes is empty for every heroine because no CSA preset items exist yet', () => {
  const presets = readJson('content/csa_presets.json');
  assert.deepEqual(presets.items, []);
  const chars = characters();
  for (const id of HEROINE_IDS) assert.deepEqual(chars[id].initial_csa_attitudes, {}, id);
});

test('every heroine has a distinct csa_response_profile with an integer baseline_resistance in 0..100', () => {
  const chars = characters();
  const resistances = HEROINE_IDS.map(id => {
    const profile = chars[id].csa_response_profile;
    assert.ok(profile && typeof profile === 'object', `${id} csa_response_profile`);
    assert.ok(Number.isInteger(profile.baseline_resistance) && profile.baseline_resistance >= 0 && profile.baseline_resistance <= 100, `${id} baseline_resistance`);
    return profile.baseline_resistance;
  });
  assert.ok(new Set(resistances).size > 1, 'resistances must not all be identical');
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
    assert.deepEqual(hydrated.npc_stats[id], { affection: 0 }, id);
    assert.ok(hydrated.npc_relationship_state[id], id);
    assert.deepEqual(hydrated.csa_attitudes[id], {}, id);
  }

  const existingSave = migrateCompanySave({
    save_schema_version: 1, edition: 'company-v1', world_state: {},
    npc_stats: { heroine1: { affection: 42 } }
  });
  const preserved = hydrateGameplayState(existingSave, master);
  assert.equal(preserved.npc_stats.heroine1.affection, 42);
  assert.deepEqual(preserved.npc_stats.heroine2, { affection: 0 });
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

test('the parser resolves each heroine name to its correct stable ID and never partial-matches', () => {
  const master = masterFromEdition(edition);
  const names = { heroine1: '서원희', heroine2: '윤민아', heroine3: '김제나', heroine4: '한리브', heroine5: '이메이' };
  for (const [id, name] of Object.entries(names)) {
    const text = `[SCENE]\n${name} (담담하게): "확인했습니다."\n[PLAYER_STATUS]\nx\n[PLAYER_INNER_THOUGHT]\nx\n[CHOICES]\n1. a\n2. b\n3. c\n4. d`;
    const parsed = parseNarrative(text, { master });
    assert.equal(parsed.dialogue_lines[0].speaker_id, id, name);
  }
  const partial = `[SCENE]\n김 (담담하게): "확인했습니다."\n[PLAYER_STATUS]\nx\n[PLAYER_INNER_THOUGHT]\nx\n[CHOICES]\n1. a\n2. b\n3. c\n4. d`;
  assert.equal(parseNarrative(partial, { master }).dialogue_lines[0].speaker_id, null);
});

// --- Story canon -----------------------------------------------------------

test('buildCharacterCanonSnapshot exposes exactly the narrative fields and excludes Storage/voice/mapping/internal-stat fields', () => {
  const canon = buildCharacterCanonSnapshot(edition);
  assert.deepEqual(Object.keys(canon).sort(), [...HEROINE_IDS].sort());
  const forbidden = ['storage_bucket', 'storage_prefix', 'primary_image_path', 'adult_image_prefix', 'voice_id', 'mapping_status', 'initial_stats', 'initial_relationship', 'initial_csa_attitudes'];
  for (const id of HEROINE_IDS) {
    const entry = canon[id];
    assert.equal(typeof entry.name, 'string', id);
    assert.ok(Array.isArray(entry.personality) && entry.personality.length > 0, id);
    assert.ok(Array.isArray(entry.speech_style) && entry.speech_style.length > 0, id);
    assert.ok(Array.isArray(entry.addressing_rules) && entry.addressing_rules.length > 0, id);
    for (const field of forbidden) assert.equal(field in entry, false, `${id}.${field}`);
  }
  assert.ok(canon.heroine3.youngest_line);
  assert.ok(canon.heroine5.youngest_line);
  assert.equal('youngest_line' in canon.heroine1, false);
});

test('buildCharacterCanonSnapshot never mutates the edition it reads', () => {
  const before = JSON.stringify(edition);
  buildCharacterCanonSnapshot(edition);
  assert.equal(JSON.stringify(edition), before);
});

test('Story prompt user payload carries character_canon for all five heroines and the system prompt forbids changing canon facts', () => {
  const prompt = buildStoryPrompt({
    edition: { editionId: edition.editionId, characters: edition.characters },
    context: { game: {}, save: {}, recent_turns: [] },
    playerAction: '인사한다.',
    expectedTurn: 1
  });
  const payload = JSON.parse(prompt[1].content);
  assert.deepEqual(Object.keys(payload.character_canon).sort(), [...HEROINE_IDS].sort());
  assert.equal(payload.character_canon.heroine1.name, '서원희');
  const system = prompt[0].content;
  assert.match(system, /character_canon.{0,20}유일한 사실 기준/);
  assert.match(system, /승격.*변경하지 않는다/);
  assert.match(system, /억지로 출연시키지 않는다/);
});

test('no real-world group or model name appears in the built Story prompt', () => {
  const prompt = buildStoryPrompt({
    edition: { editionId: edition.editionId, characters: edition.characters },
    context: { game: {}, save: {}, recent_turns: [] },
    playerAction: 'x',
    expectedTurn: 1
  });
  const combined = prompt.map(m => m.content).join('\n');
  for (const forbidden of ['RESCENE', '리센느', '미나미']) assert.equal(combined.includes(forbidden), false, forbidden);
});

// --- Extract mapping -------------------------------------------------------

test('buildRegisteredCharacters returns only heroine id/name pairs with no Storage fields', () => {
  const registered = buildRegisteredCharacters(edition);
  assert.equal(registered.length, 5);
  for (const entry of registered) {
    assert.deepEqual(Object.keys(entry).sort(), ['character_id', 'name']);
    assert.ok(HEROINE_IDS.includes(entry.character_id));
  }
  assert.deepEqual(registered.find(e => e.character_id === 'heroine1'), { character_id: 'heroine1', name: '서원희' });
});

test('Extract prompt user payload carries registered_characters and the system prompt restricts Extract to those stable ids', () => {
  const prompt = buildExtractPrompt({ context: {}, storyText: 'x', parsedStory: {}, playerAction: 'x', expectedTurn: 1, edition });
  const payload = JSON.parse(prompt[1].content);
  assert.equal(payload.registered_characters.length, 5);
  const system = prompt[0].content;
  assert.match(system, /registered_characters lists the only stable character ids/);
  assert.match(system, /never invent, guess, or reuse an id/);
  assert.match(system, /never copy one into another/);
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
  const storyPrompt = buildStoryPrompt({ edition: { editionId: edition.editionId, characters: edition.characters }, context: { game: {}, save: {}, recent_turns: [] }, playerAction: 'x', expectedTurn: 1 });
  const extractPrompt = buildExtractPrompt({ context: {}, storyText: 'x', parsedStory: {}, playerAction: 'x', expectedTurn: 1, edition });
  const allPromptText = [...storyPrompt, ...extractPrompt].map(m => m.content);
  // real-person names must never appear anywhere, including system instructions
  for (const source of [...contentSources, ...allPromptText]) {
    for (const term of realPersonTokens) assert.equal(source.includes(term), false, term);
  }
  // active_suggestions/personal-suggestion legitimately appear in system instructions as a
  // prohibition; they must not appear in actual content or in the user-facing data payload
  const userPayloads = [storyPrompt[1].content, extractPrompt[1].content];
  for (const source of [...contentSources, ...userPayloads]) {
    for (const term of contentFeatureTokens) assert.equal(source.includes(term), false, term);
  }
});
