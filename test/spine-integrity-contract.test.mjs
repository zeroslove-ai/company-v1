import test from 'node:test';
import assert from 'node:assert/strict';
import { selectImage } from '../src/engine/media/image-selector.js';
import { deriveCommittedMediaHint, buildCompanyGameViewModel } from '../src/frontend/pages/view-model.js';

test('committed media hint is presentation-only and ignores stale Extract media fields', () => {
  const hint = deriveCommittedMediaHint({
    story_text: 'The requested missionary act reaches a clear consequence.',
    turn_summary: 'The office turn resolves the request.',
    extract_delta: { image_selection: { pool: 'general', tags: [] } }
  }, { location_id: 'brand_strategy_office' });
  assert.equal(hint.pool, 'sex');
  assert.ok(hint.tags.includes('missionary'));
});

test('Korean committed penetration wording reaches the heroine penetration family', () => {
  const hint = deriveCommittedMediaHint({ story_text: '상대와 삽입을 시작하고 같은 장면에서 반응이 이어진다.' }, { location_id: 'brand_strategy_office' });
  assert.ok(hint.tags.includes('penetration'));
  const result = selectImage([
    { image_id: 'heroine3-office', image_url: 'https://img/office', image_pool: 'sex', curation_rank: 1, tags: ['office_desk'] },
    { image_id: 'heroine3-missionary', image_url: 'https://img/missionary', image_pool: 'sex', curation_rank: 5, tags: ['missionary'] }
  ], { pool: 'sex', tags: hint.tags });
  assert.equal(result.image_id, 'heroine3-missionary');
  assert.equal(result.source, 'family_match');
});

test('image selector does not pre-prune an exact catalog candidate', () => {
  const candidates = Array.from({ length: 8 }, (_, index) => ({ image_id: `general-${index}`, image_url: `https://img/${index}`, image_pool: 'sex', curation_rank: index }));
  candidates.push({ image_id: 'exact-low-rank', image_url: 'https://img/exact', image_pool: 'sex', curation_rank: 99, tags: ['missionary'] });
  const result = selectImage(candidates, { pool: 'sex', tags: ['missionary'] });
  assert.equal(result.image_id, 'exact-low-rank');
});

test('frontend Mind Monitor reads committed turn data rather than Extract delta', () => {
  const model = buildCompanyGameViewModel({
    save: {
      data: {
        player: { player_id: 'player', name: 'Player' },
        scene: { version: 1, location_id: 'office', present_npc_ids: ['heroine1'], focal_character_id: 'heroine1', last_speaker_id: 'heroine1', updated_turn: 1 },
        player_scene_state: {},
        player_sexual_state: {},
        world_state: { game_time: { day: 1, minute_of_day: 540 } }
      },
      committed_turn: 1
    },
    recent_turns: [{
      turn_number: 1,
      story_text: 'Story',
      parsed_blocks: { dialogue_lines: [] },
      mind_monitor: { heroine1: { surface: 'committed', subconscious: 'committed latent' } },
      extract_delta: { mind_monitor: { heroine1: { surface: 'stale', subconscious: 'stale' } } },
      turn_summary: 'summary'
    }],
    display: { npc_directory: { heroine1: { name: 'Heroine' } }, map_locations: [{ location_id: 'office', name: 'Office' }] }
  });
  assert.equal(model.media.mind_monitor.heroine1.surface, 'committed');
  assert.equal(model.media.mind_monitor.heroine1.subconscious, 'committed latent');
});
