import test from 'node:test';
import assert from 'node:assert/strict';

import { loadCanonicalCompanyR3Content } from '../runtime-r3/domain/content-loader.js';
import { createInitialState } from '../runtime-r3/domain/contracts.js';
import { validateProfile } from '../runtime-r3/domain/profile.js';

test('R3 uses canonical Company content and round-trips the accepted profile', () => {
  const content = loadCanonicalCompanyR3Content();
  assert.equal(content.edition.edition_id, 'company-v1');
  assert.equal(Object.keys(content.characters).length, 5);
  assert.ok(content.locations.length > 0);
  const profile = {
    name: 'R3 Player', department_id: content.departments[0].department_id, position_id: content.positions[0].position_id,
    age: 28, height_cm: 178, weight_kg: 72, penis_length_cm: 16,
    body_type_id: content.bodyTypes[0].body_type_id, speech_style_id: content.speechStyles[0].speech_style_id
  };
  const result = validateProfile(profile, content);
  assert.equal(result.valid, true);
  assert.deepEqual(result.profile, profile);
  const state = createInitialState(result.profile, content.locations[0].location_id);
  assert.equal(state.profile.penis_length_cm, 16);
  assert.deepEqual(state.active_rules, []);
  assert.deepEqual(state.clothing, {});
  assert.equal('player_sexual_state' in state, false);
  assert.equal('relationships' in state, false);
});
