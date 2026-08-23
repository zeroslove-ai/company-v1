# Company — CURRENT TASK

Status: READY
Task ID: company-r3-csa-active-rule-preset-change-v1
Mode: FREEZE R3 CSA CHRONOLOGY -> RESTORE ACTIVE-RULE PRESET CHANGE UX -> FRONTEND TEST DEPLOY -> BARE-PUBLIC APPLY/CHANGE/REMOVE ACCEPTANCE
Updated: 2026-08-24 02:15 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`
Previous terminal: Issue #68 comment `5387276200`
Operator review: Issue #68 comment `5387302655`
Owner manual-play authority: Issue #68 comment `5384780073`

Reuse this exact existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK path. Do not create a new ops/recovery branch. Work on `main` only.

## 0. Accepted baseline and failure fixture

Current main before registration:
- `99296e1b742e935c3f673014d41a16801a7957b5`

Accepted executable/source before this repair:
- `79a9921b0248912bd8453a26c83443f8da481cb4`

`99296e1...` is a docs-only descendant of the accepted executable. There is no later executable drift.

Accepted TEST artifacts before this repair:
- API `game-proxy-company-r3` version `82be1bb0-34f6-4c0d-87a8-5db34fdb288b`
- Frontend `gamebuilder-company-r3` version `cac2033d-aa56-4a99-aa02-92c8087222d3`
- bare public frontend: `https://gamebuilder-company-r3.zeroslove.workers.dev`

Preserved final-holistic failure fixture — READ ONLY, never reset/revise/retry/mutate:
- `f84aa0f0-6658-41a2-8fed-c307d4d2e219`
- stopped at committed Turn 10 after chronological CSA APPLY at Turn 9 plus one unrelated ordinary Turn 10.

Owner game — READ ONLY:
- `9fcd5ab5-eb13-4971-8fca-9fec20a1d531`

## 1. Exact proven product defect

Final holistic acceptance `company-r3-final-holistic-owner-style-long-play-v1` stopped `FAILED_PRODUCT` at the first decisive boundary.

Observed live behavior after APPLY:
- active CSA rule card exposed only one visible action: `해제`;
- its `대상 범위` select exposed exactly one selected option, `여성 직원`;
- there was no visible CHANGE/EDIT/preset-replacement path;
- no-op re-selection was correctly not counted as CHANGE;
- no hidden writer, direct API, DOM mutation, retry, or bypass was used.

Source boundary at accepted executable:
- `runtime-r3/domain/csa.js::applyR3Csa()` already supports `operation: 'update'` with an existing rule `id` and a different valid `template_id`;
- update preserves the same rule id and rewrites its template/content/strength/scopes in one canonical CSA operation;
- `frontend-r3/csa.js::activeCard()` exposes `update` only through subject/counterparty scope changes;
- when a preset has only one allowed scope, there is no meaningful user-visible CHANGE affordance.

Therefore this is a frontend product/UX defect, not a missing CSA runtime capability.

## 2. Frozen contracts — do not reopen

Freeze all previously accepted behavior:
- every APPLY/CHANGE/REMOVE is one chronological normal Story turn;
- local draft changes perform zero gameplay requests/writes before explicit Apply;
- exactly one pending CSA operation at a time;
- `frontend-r3/app.js -> submit() -> client.turn() -> SSE -> commit/reconciliation` remains the sole CSA gameplay transport;
- no direct legacy `/csa`, `/api/app-state`, `/api/app-validate`, or batch transaction;
- ordinary later turns carry no stale `csa_operation`;
- CSA compliance cannot manufacture affection/comfort/consent/desire/romance/trust/personality obedience;
- current nine-preset R3 catalog only; no custom/freeform authoring;
- all accepted agency/navigation/choice/time/thought/MM/reset/media/TTS/timeline behavior remains frozen.

Do not change:
- `runtime-r3/**` unless pre-edit inspection unexpectedly proves the existing update contract is not actually sufficient. If that happens, STOP for operator review before broadening scope.
- API route/turn semantics;
- `content/csa_presets.json` semantics;
- DB/schema/RPC/migration/RLS/grants;
- provider/model/config/secrets;
- Production;
- preserved fixtures/owner game.

Expected implementation boundary is frontend-only.

## 3. Mandatory pre-edit trace

Before editing:
1. inspect `frontend-r3/csa.js`, `frontend-r3/csa-draft.js`, relevant CSA frontend tests, and `runtime-r3/domain/csa.js` read-only;
2. prove the existing update operation accepts a replacement `template_id` on the same active rule id;
3. prove `stageCsaOperation()` treats repeated edits to the same `update:<rule id>` as one pending operation rather than a second distinct draft;
4. inspect the nine catalog items and active rule rendering behavior;
5. record why the failing fixture's exercised rule had no meaningful scope-only change.

Do not mutate the preserved fixture during this trace.

## 4. Product correction — active rule preset replacement

Add a bounded, visible CHANGE path to each active CSA rule.

The user must be able to replace an active rule's preset with another allowed R3 preset while retaining the existing active rule id.

### Required UX

For an active rule card, expose an explicit control labeled naturally in Korean, e.g. `규칙 변경` / `변경할 프리셋`.

The replacement choices must:
- come only from the existing nine R3 catalog presets;
- exclude the current rule's current `template_id`;
- exclude any template already active under a different active rule id, so CHANGE cannot accidentally create duplicate active presets;
- show catalog labels rather than raw IDs;
- never expose custom/freeform input.

Do not auto-stage a replacement merely by opening the UI.

A user selection/explicit change action must stage exactly one local operation shaped as:

```js
{
  operation: 'update',
  id: existingRuleId,
  template_id: replacementTemplateId,
  subject_scope: replacementSubjectScope,
  counterparty_scope: replacementCounterpartyScope
}
```

Use the replacement preset's own allowed/default scopes. Do not carry an invalid scope from the old preset into the replacement.

### Pending replacement presentation

Once staged:
- draft bar shows `미적용 변경 1건`;
- active card clearly shows current -> pending replacement state, e.g. `변경 예정: <label>`;
- preview/content/strength/category where currently displayed must correspond to the pending replacement, not lie about the committed rule;
- scope controls must be based on the pending replacement preset;
- subsequent subject/counterparty edits update the same `update:<rule id>` draft operation, not create a second pending operation;
- Revert restores the exact committed original rule/preset/scopes with zero gameplay request;
- trying to edit another distinct rule/preset while this draft is dirty must continue to be blocked by the existing one-pending-operation contract.

Do not claim the committed server rule changed until Apply succeeds.

### Apply behavior

On explicit Apply:
- close/yield overlay before Story dispatch as currently designed;
- call `onOperation` exactly once;
- emit one existing R3 `update` csa_operation using the same active rule id and replacement template/scopes;
- emit deterministic natural Korean literal beginning/meaning `상식개변 변경`, using catalog labels and selected scopes rather than raw IDs where possible;
- use the existing `submit()` / `client.turn()` / SSE / reconciliation path only;
- exactly one Story turn commits;
- after success draft clears/rebases from committed context;
- reopening CSA shows the replacement preset as the active committed rule and the old template no longer active for that rule;
- after failure/not-sent, do not claim success or auto-resubmit; preserve truthful draft/error behavior.

REMOVE remains a separate distinct pending operation. Do not combine CHANGE+REMOVE or auto-remove/activate in two turns.

## 5. No-op and duplicate protections

Add deterministic protections:
- selecting the same current template is impossible or produces no dirty draft;
- replacement with a template already active under another rule is unavailable/blocked;
- an update that results in exactly the same template + same scopes as committed state must not be presented as a meaningful CHANGE;
- no sequential deactivate+activate implementation; CHANGE must be one `update` operation and one turn;
- rule id must remain identical across committed CHANGE.

## 6. Deterministic tests

Add/adjust focused tests proving at minimum:
1. active fixed-scope rule visibly exposes a meaningful preset CHANGE path;
2. replacement list excludes current template;
3. replacement list excludes templates active in other rule ids;
4. staging replacement performs zero `onOperation` / zero gameplay dispatch;
5. dirty bar = exactly one pending change;
6. staged replacement uses existing rule id + replacement template id;
7. replacement defaults to valid scopes from the replacement preset;
8. changing replacement scopes rewrites the same pending update operation;
9. Revert restores original committed rule and zero dispatch;
10. second distinct edit remains blocked, no batch/silent replacement;
11. Apply emits exactly one `update` operation and one Korean literal;
12. no deactivate+activate sequence is emitted for CHANGE;
13. successful reconciliation/reopen reflects replacement committed rule with same rule id;
14. failure does not claim applied/auto-resubmit;
15. REMOVE after committed CHANGE still emits exactly one deactivate;
16. legacy/direct/batch/custom paths remain absent;
17. old CSA chronology/atomicity/duplicate/post-CSA contracts remain GREEN;
18. frozen agency/navigation/choice/reset/media/timeline frontend regressions remain GREEN.

Run:
- focused CSA draft/UI tests;
- full `npm.cmd test`;
- changed JS/MJS `node --check`;
- `git diff --check`.

Do not weaken tests that encode one-operation chronology or truthful local-draft behavior.

## 7. TEST deployment

Expected deployment: frontend only.

If only frontend/test code changes:
- keep API exactly at `game-proxy-company-r3` version `82be1bb0-34f6-4c0d-87a8-5db34fdb288b`;
- deploy exact source to TEST `gamebuilder-company-r3`;
- record new frontend Worker version.

Do not redeploy API merely for symmetry.
No Production.
No migration.
No provider/model/config/secret changes.

## 8. Mandatory bare-public acceptance

Use only:
`https://gamebuilder-company-r3.zeroslove.workers.dev`

No `?api=` override.
No storage preseed.
No direct gameplay API substitute.
Fresh disposable TEST game only.
Do not mutate `f84aa0f0-6658-41a2-8fed-c307d4d2e219` or owner game.

Run one coherent visible sequence:

1. Setup -> Opening -> enough ordinary play to open CSA naturally.
2. APPLY one preset through visible draft/apply UX.
   - prove exactly one `/turn` POST;
   - exactly one csa_operation activate;
   - exactly one committed chronological turn.
3. Submit one unrelated ordinary Korean action.
   - prove no stale csa_operation;
   - literal-action-first Story;
   - one ordinary committed turn.
4. Open CSA active rule.
   - visible meaningful CHANGE/preset replacement path must exist even if current rule scopes are fixed;
   - stage replacement;
   - before Apply: zero gameplay POST, committed rule unchanged, `미적용 변경 1건` visible;
   - Revert once and prove committed rule unchanged;
   - stage replacement again.
5. Apply CHANGE once.
   - exactly one `/turn` POST;
   - exactly one `operation:'update'`;
   - same rule id;
   - different replacement template_id;
   - one chronological Story turn;
   - reopen/refresh shows replacement committed and original replaced.
6. Submit another unrelated ordinary Korean action.
   - zero stale csa_operation;
   - exact ordinary literal remains central.
7. REMOVE the changed rule through visible UI.
   - exactly one `/turn` POST;
   - exactly one deactivate;
   - one chronological Story turn;
   - reopen/refresh shows rule inactive.
8. Submit one final ordinary action.
   - removed rule does not hijack the turn without independent cause.

Also inspect approximately 390x844:
- replacement selector/control, pending preview, Revert, Apply, Remove reachable;
- no horizontal overflow/blocking overlay;
- after Apply/close normal Story/choices/input remain usable.

No forced failure testing required live; deterministic tests cover failure path.

## 9. GREEN definition

GREEN only if:
- a fixed-scope active rule has a real visible CHANGE affordance;
- CHANGE can replace that active rule with another bounded preset;
- CHANGE remains one local draft + one chronological `update` Story turn;
- same active rule id persists across CHANGE;
- no duplicate template/no-op/batch/deactivate+activate workaround;
- Revert and one-pending-operation rules remain truthful;
- APPLY -> unrelated -> CHANGE -> unrelated -> REMOVE -> unrelated sequence is clean with no stale csa_operation;
- frontend-only tests/full suite/mobile/live acceptance pass;
- accepted API/runtime semantics remain unchanged.

Do NOT claim owner-ready on completion.

If GREEN, stop at WAITING_REVIEW. The next operator task will restart the holistic owner-style long-play from a NEW clean campaign; do not resume the preserved failed holistic fixture.

If the pre-edit trace proves frontend-only replacement cannot be expressed with the existing canonical `update` contract, STOP `BLOCKED_CONTRACT` before changing runtime/API and report the exact mismatch.

## 10. Terminal protocol

At completion:
- record source SHA and exact changed files;
- record focused/full/syntax/diff results;
- record TEST frontend version and frozen API version;
- record fresh disposable fixture only;
- record APPLY/CHANGE/REMOVE committed turn numbers, operation payload identity, rule id/template transitions, network counts, Revert/no-network evidence, post-CSA ordinary no-stale evidence, and mobile evidence;
- overwrite this SAME `docs/ops/CURRENT_TASK.md` to `Status: WAITING_REVIEW` in place;
- post terminal report to Issue #68;
- stop.

Do not create/start the next task.
