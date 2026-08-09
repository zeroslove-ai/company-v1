import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseNarrative as parseServerNarrative } from '../src/engine/narrative-parser.js';
import { parseNarrative as parseFrontendNarrative } from '../src/frontend/pages/narrative.js';
import { createDraft, operations } from '../src/frontend/pages/csa-app-state.js';
import { fallbackDialogueLines } from '../src/frontend/pages/utility-ui.js';
import { buildCharacterDisplayDetails } from '../src/api/character-display.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const master = { characters: [{ character_id: 'heroine1', name: '서원희', voice_id: 'voice-1' }] };
const speakerDirectory = { heroine1: { name: '서원희' } };

const productionStyleStory = [
  '[1. 서사 및 행동]',
  '서원희가 사내 메신저 알림을 확인한 뒤 플레이어를 바라보며 입을 열었다.',
  '“인사팀에서 공지가 왔네요. 우선 범위를 확인하죠.”',
  '그녀는 잠시 화면을 내려다봤다.',
  '“(도대체 왜 이런 규정이 생긴 거지...)”',
  '[2. 플레이어 속마음]',
  '공지 반응을 더 살펴보자.',
  '[3. 플레이어 상황판]',
  '사무실에서 공지를 확인하는 중.',
  '[4. 선택지]',
  '1. [범위확인] 적용 범위를 묻는다.',
  '2. [의견질문] 솔직한 의견을 묻는다.',
  '3. [업무계속] 보고서 검토를 계속한다.',
  '4. [잠시관찰] 반응을 더 지켜본다.'
].join('\n');

test('server parser recovers registered quote-only dialogue observed in production rows', () => {
  const parsed = parseServerNarrative(productionStyleStory, { master });
  assert.equal(parsed.dialogue_lines.length, 1);
  assert.equal(parsed.dialogue_lines[0].speaker_id, 'heroine1');
  assert.equal(parsed.dialogue_lines[0].speaker_name, '서원희');
  assert.equal(parsed.dialogue_lines[0].direction, '자연스럽게');
  assert.equal(parsed.dialogue_lines[0].text, '인사팀에서 공지가 왔네요. 우선 범위를 확인하죠.');
  assert.match(parsed.normalized_raw, /서원희 \(자연스럽게\): “인사팀에서 공지가 왔네요/);
  assert.doesNotMatch(parsed.normalized_raw, /서원희 \(자연스럽게\): “\(도대체/);
});

test('frontend streaming parser renders the same quote-only line as dialogue card data', () => {
  const parsed = parseFrontendNarrative(productionStyleStory, { speakerDirectory });
  assert.equal(parsed.dialogue_lines.length, 1);
  assert.deepEqual(parsed.dialogue_lines[0], {
    speaker_id: 'heroine1',
    speaker_name: '서원희',
    direction: '자연스럽게',
    text: '인사팀에서 공지가 왔네요. 우선 범위를 확인하죠.',
    order: 0
  });
  assert.ok(parsed.blocks.some(block => block.type === 'dialogue' && block.speaker_id === 'heroine1'));
});

test('manual TTS fallback recovers existing committed quote-only Story', () => {
  const context = {
    master: { data: { characters: { characters: { heroine1: { name: '서원희' } } } } },
    display: { npc_directory: { heroine1: { name: '서원희' } } },
    save: { data: { focal_character_id: 'heroine1', last_speaker_id: 'heroine1', last_npcs_present: ['heroine1'] } }
  };
  const lines = fallbackDialogueLines(context, { story: { story_text: productionStyleStory } });
  assert.equal(lines.length, 1);
  assert.equal(lines[0].speaker_id, 'heroine1');
  assert.equal(lines[0].text, '인사팀에서 공지가 왔네요. 우선 범위를 확인하죠.');
});

test('persisted preset payload reopens with category and remains clean until edited', () => {
  const appState = {
    common_sense: [{
      id: 'csa_8',
      source_type: 'preset',
      strength: 'medium',
      content: '저장된 규정',
      preset: {
        template_id: 'office_notice_1',
        authority_tier: 'medium',
        affected_group: 'company_employee'
      }
    }],
    csa_presets: {
      selector_options: [{ id: 'company_employee', label: '회사 직원 전체' }],
      items: [{
        id: 'office_notice_1',
        label: '전사 공지 규정',
        category: 'workplace',
        strength: 'medium',
        mode: 'continuous',
        affected_group: 'company_employee',
        content_template: '회사 직원은 해당 상식을 따른다.'
      }]
    }
  };
  const draft = createDraft(appState, 'csa');
  assert.equal(draft.csa[0].category, 'workplace');
  assert.equal(draft.csa[0].template_id, 'office_notice_1');
  assert.deepEqual(draft.csa[0].roles, {});
  assert.deepEqual(operations(appState, draft), []);
});

test('NPC stat changes are derived from the real pre_save/post_save shape', () => {
  const edition = {
    characters: { characters: { heroine1: { character_id: 'heroine1', name: '서원희', age: 33, prompt_card: {} } } }
  };
  const save = {
    npc_stats: { heroine1: { affection: 0, resistance: 40, csa_acceptance: 0, sexual_arousal: 6 } },
    npc_relationship_state: { heroine1: { relationship_summary: '업무 관계를 유지한다.', milestones: {} } }
  };
  const latestTurn = {
    pre_save: { npc_stats: { heroine1: { affection: 0, resistance: 40, csa_acceptance: 0, sexual_arousal: 3 } } },
    post_save: { npc_stats: { heroine1: { affection: 0, resistance: 40, csa_acceptance: 0, sexual_arousal: 6 } } }
  };
  const details = buildCharacterDisplayDetails(save, edition, latestTurn);
  // resistance는 고정값이라 stat_changes에 포함되지 않는다 (변화 없음)
  assert.equal(details.heroine1.stat_changes.resistance, undefined);
  assert.deepEqual(details.heroine1.stat_changes.sexual_arousal, { from: 3, to: 6, delta: 3 });
  assert.equal(details.heroine1.relationship_record.total_events, 0);
  assert.deepEqual(details.heroine1.private_info, { unlocked: false });
});

test('UI source always shows stored summaries, records, and staged loading labels', () => {
  const render = fs.readFileSync(path.join(root, 'src/frontend/pages/render.js'), 'utf8');
  const loading = fs.readFileSync(path.join(root, 'src/frontend/pages/loading-overlay.js'), 'utf8');
  const state = fs.readFileSync(path.join(root, 'src/frontend/pages/state.js'), 'utf8');
  assert.match(render, /showSummary = true/);
  assert.match(render, /요약 기록 ·/);
  assert.match(render, /heading: '요약 기록'/);
  assert.match(render, /관계·사정 기록/);
  assert.match(render, /은밀정보/);
  assert.match(render, /characterPanel\.open = true/);
  assert.match(loading, /서사 진행 중/);
  assert.match(loading, /상태 추출 중/);
  assert.match(loading, /상태 저장 중/);
  assert.match(state, /company:pending-step/);
});
