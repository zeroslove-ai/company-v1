import test from 'node:test';
import assert from 'node:assert/strict';
import {
  csaDraftOperation,
  committedCsaRules,
  createCsaDraft,
  isCsaDraftDirty,
  stageCsaOperation
} from '../frontend-r3/csa-draft.js';
import { replacementOperation, replacementPresetItems } from '../frontend-r3/csa.js';

function context({ revision = 4, active = true } = {}) {
  return {
    state: {
      revision,
      committed_turn: revision,
      state: {
        csa_active: active ? ['r3_csa_1'] : [],
        csa_rules: active ? { r3_csa_1: { id: 'r3_csa_1', active: true, template_id: 'work_nude', subject_scope: 'female_employee' } } : {}
      }
    }
  };
}

test('committed R3 rules are read-only draft input and inactive rules are omitted', () => {
  assert.deepEqual(committedCsaRules(context()), [{ id: 'r3_csa_1', active: true, template_id: 'work_nude', subject_scope: 'female_employee' }]);
  assert.deepEqual(committedCsaRules(context({ active: false })), []);
});

test('activate draft is local and has no operation until explicitly staged', () => {
  const draft = createCsaDraft(context({ active: false }));
  assert.equal(isCsaDraftDirty(draft), false);
  const staged = stageCsaOperation(draft, { operation: 'activate', template_id: 'work_nude', subject_scope: 'player', counterparty_scope: null });
  assert.equal(staged.blocked, false);
  assert.equal(isCsaDraftDirty(staged.draft), true);
  assert.deepEqual(csaDraftOperation(staged.draft), { operation: 'activate', template_id: 'work_nude', subject_scope: 'player', counterparty_scope: null });
});

test('one active-rule update can change scope locally before Apply', () => {
  const draft = createCsaDraft(context());
  const staged = stageCsaOperation(draft, { operation: 'update', id: 'r3_csa_1', template_id: 'work_nude', subject_scope: 'company_employee', counterparty_scope: null });
  const adjusted = stageCsaOperation(staged.draft, { operation: 'update', id: 'r3_csa_1', template_id: 'work_nude', subject_scope: 'player', counterparty_scope: null });
  assert.equal(adjusted.blocked, false);
  assert.equal(csaDraftOperation(adjusted.draft).subject_scope, 'player');
});

test('active rule replacement is bounded to unused catalog presets and preserves the rule id', () => {
  const rule = { id: 'r3_csa_1', template_id: 'work_nude', subject_scope: 'female_employee' };
  const otherRule = { id: 'r3_csa_2', template_id: 'no_bra_under_work_clothes' };
  const catalog = [
    { id: 'work_nude', label: 'Current', subject_scopes: ['female_employee'], default_subject_scope: 'female_employee', counterparty_scopes: [], default_counterparty_scope: null },
    { id: 'no_panties_under_work_clothes', label: 'Replacement', subject_scopes: ['female_employee'], default_subject_scope: 'female_employee', counterparty_scopes: [], default_counterparty_scope: null },
    { id: otherRule.template_id, label: 'Already active', subject_scopes: ['female_employee'], default_subject_scope: 'female_employee', counterparty_scopes: [], default_counterparty_scope: null }
  ];
  const candidates = replacementPresetItems({ activeRules: [rule, otherRule], catalogItems: catalog, rule });
  assert.deepEqual(candidates.map(item => item.id), ['no_panties_under_work_clothes']);
  assert.deepEqual(replacementOperation(rule, candidates[0]), {
    operation: 'update',
    id: 'r3_csa_1',
    template_id: 'no_panties_under_work_clothes',
    subject_scope: 'female_employee',
    counterparty_scope: null
  });
});

test('remove draft is local and retains the exact deactivate operation', () => {
  const result = stageCsaOperation(createCsaDraft(context()), { operation: 'deactivate', id: 'r3_csa_1', template_id: 'work_nude', subject_scope: 'female_employee' });
  assert.equal(result.blocked, false);
  assert.deepEqual(csaDraftOperation(result.draft), { operation: 'deactivate', id: 'r3_csa_1', template_id: 'work_nude', subject_scope: 'female_employee' });
});

test('a second distinct edit is blocked instead of silently batching or replacing the first', () => {
  const first = stageCsaOperation(createCsaDraft(context({ active: false })), { operation: 'activate', template_id: 'work_nude', subject_scope: 'player', counterparty_scope: null });
  const second = stageCsaOperation(first.draft, { operation: 'activate', template_id: 'work_in_underwear_only', subject_scope: 'female_employee', counterparty_scope: null });
  assert.equal(second.blocked, true);
  assert.match(second.notice, /적용하거나 되돌려/);
  assert.equal(csaDraftOperation(second.draft).template_id, 'work_nude');
});
