import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildPlayerSexualDisplay } from '../src/api/character-display.js';
import { buildStoryPrompt } from '../src/engine/story-prompt.js';
import { createUtilityUi } from '../src/frontend/pages/utility-ui.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const gameId = '11111111-1111-4111-8111-111111111111';
const edition = {
  editionId: 'company-v1',
  characters: {
    characters: {
      heroine1: {
        character_id: 'heroine1', name: '서원희', age: 33, department: '브랜드전략팀', position: '차장', role_title: '팀장', company_tenure: '9년 차',
        prompt_card: { appearance: '단정한 정장' },
        body: { height_cm: 168, weight_kg: 55, body_type: '균형 잡힌 체형', cup: 'C컵' },
        private_info: {
          nipple: '분홍빛', areola_size: '보통', areola_color: '옅은 갈색', pubic_hair: '정리됨',
          past_partner_count: 2, past_orgasm_count: 7, relationship: '현재 연인 없음', intimate_notes: '명확한 합의를 중요하게 여긴다.'
        }
      }
    }
  },
  generalNpcs: { profiles: {} },
  organization: { departments: [] }
};

class FakeNode {
  constructor() {
    this.children = [];
    this.listeners = new Map();
    this.hidden = false;
    this.disabled = false;
    this.checked = false;
    this.value = '';
    this.textContent = '';
    this.dataset = {};
    this.title = '';
  }
  addEventListener(type, listener) { this.listeners.set(type, listener); }
  replaceChildren(...children) { this.children = children; }
  append(...children) { this.children.push(...children); }
  focus() {}
}

class FakeAudio {
  constructor() { this.playCalls = 0; this.pauseCalls = 0; this.muted = false; this.src = ''; this.currentTime = 0; }
  play() { this.playCalls += 1; return Promise.resolve(); }
  pause() { this.pauseCalls += 1; }
}

function fakeDocument(ids) {
  const nodes = Object.fromEntries(ids.map(id => [id, new FakeNode()]));
  return {
    nodes,
    documentRef: {
      querySelector: selector => nodes[selector.slice(1)] ?? null,
      createElement: () => new FakeNode()
    }
  };
}

test('Story prompt exposes the structural dialogue identity contract', () => {
  const messages = buildStoryPrompt({
    edition,
    context: { game: {}, save: { edition: 'company-v1', save_schema_version: 1, scene: { version: 1, scene_id: null, location_id: null, beat: 0, goal: null, focus_thread: null, present_npc_ids: ['heroine1'], focal_character_id: null, last_speaker_id: null, updated_turn: 0 }, scene_state: { participants: ['heroine1'] }, world_state: {} }, recent_turns: [] },
    playerAction: 'review the report',
    expectedTurn: 1
  });
  const payload = JSON.parse(messages[1].content);
  assert.deepEqual(payload.context.scene.present_npc_ids, ['heroine1']);
  assert.equal('scene_actors' in payload, true);
});

test('player sexual display derives only the retained player mechanic', () => {
  const save = {
    npc_stats: { heroine1: { affinity: 4, resistance: 40, csa_acceptance: 12, sexual_arousal: 3 } },
    npc_relationship_state: { heroine1: { relationship_summary: '서로의 경계를 확인한 관계다.', milestones: { sexual_relationship_started_turn: 4 } } },
    sexual_event_ledger: [
      { turn: 4, actor_id: 'player', target_id: 'heroine1', action_type: 'ejaculation', completed: true, interrupted: false, evidence: '합의된 장면이 완료되었다.' }
    ],
    player_sexual_state: { arousal: 22, ejaculation_progress: 60, ejaculation_count: 1 }
  };
  save.player_sexual_state.total_sexual_events = 2;
  save.player_sexual_state.last_sexual_event = { turn: 5, type: 'mechanic', completed: true };
  const player = buildPlayerSexualDisplay(save);
  assert.equal(player.ejaculation_progress, 60);
  assert.equal(player.ejaculation_count, 1);
  assert.equal(player.total_sexual_events, 2);
  assert.equal(player.last_sexual_event.type, 'mechanic');
});
