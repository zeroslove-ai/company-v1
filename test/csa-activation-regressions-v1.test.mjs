import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  applyPresetDefaults,
  createDraft,
  isPresetPayloadComplete,
  operations
} from '../src/frontend/pages/csa-app-state.js';
import {
  getActiveCsaEntries,
  getApplicableCsaEntries
} from '../src/engine/csa/applicability.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'content/csa_presets.json'), 'utf8'));

function appState() {
  return {
    csa_presets: {
      actor_options: catalog.actor_options,
      target_options: catalog.target_options,
      trigger_options: catalog.trigger_options,
      duration_options: catalog.duration_options,
      categories: catalog.categories,
      items: catalog.items
    },
    common_sense: []
  };
}

test('preset activation synchronizes flat draft fields into item.preset before apply validation', () => {
  const state = appState();
  const draft = createDraft(state, 'csa');
  const preset = catalog.items.find(item => item.minimum_strength === 'weak' || item.strength === 'weak');
  assert.ok(preset, 'a weak preset must exist');

  const item = {
    _new: true,
    client_id: 'draft-csa-1',
    source_type: 'preset',
    strength: null,
    content: '',
    modifier: ''
  };
  draft.csa.push(item);
  applyPresetDefaults(item, preset);
  if (preset.allowed_counterparty_scopes?.length) item.counterparty_scope = preset.allowed_counterparty_scopes[0];

  const result = operations(state, draft);
  assert.equal(result.length, 1);
  assert.equal(result[0].source_type, 'preset');
  assert.deepEqual(item.preset, result[0].preset);
  assert.equal(isPresetPayloadComplete(state, item.preset, item.strength), true);
});

test('legacy csa_active ids without active/content/source_type remain usable by the app and runtime', () => {
  const save = {
    csa_active: ['legacy-rule'],
    csa_rules: {
      'legacy-rule': {
        strength: 1,
        execution_mode: 'normative',
        required_action: 'give a status update'
      }
    }
  };

  const active = getActiveCsaEntries(save);
  assert.equal(active.length, 1);
  assert.equal(active[0].active, true);
  assert.equal(active[0].content, 'give a status update');
  assert.equal(active[0].source_type, 'custom');
  assert.equal(getApplicableCsaEntries(save).length, 1);
});

test('an explicit active false flag remains authoritative even when an id is stale in csa_active', () => {
  const save = {
    csa_active: ['legacy-rule'],
    csa_rules: {
      'legacy-rule': {
        active: false,
        content: 'inactive rule'
      }
    }
  };

  const active = getActiveCsaEntries(save);
  assert.equal(active[0].active, false);
  assert.equal(getApplicableCsaEntries(save).length, 0);
});
