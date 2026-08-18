# Company v1 — CURRENT TASK

Status: READY
Task ID: clothing-csa-npc-state-bootstrap-repair-v1
Updated: 2026-08-18
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## 0. Accepted predecessor / live evidence

Previous task: `test-integrated-main-utf8-safe-live-acceptance-v1`
Accepted terminal candidate: Issue #68 comment `5322507579`
Classification: `LIVE_ACCEPTANCE_PRODUCT_DEFECT_FOUND`
Previous final branch SHA: `9bca5cef4c75521c2223d41865bdd1c0f6d43b5c`
Previous final CURRENT_TASK blob: `653100695f36f626d1d1740a85e2207befc17d9e`
Accepted base/main: `43aa03cf645a2e1a2cae3e0283d2e485170db021`

Independent TEST DB readback of disposable game `16184902-7415-468b-a276-dae291c6c74c` confirms:
- one coherent 20-turn session committed successfully;
- Korean free-text `player_action` values are real UTF-8, not the prior `?` harness corruption;
- turn 16 movement to `employee_lounge` persisted with current-V2 exact scene evidence;
- turn 17 activated canonical `csa_17` with `subject_scope=female_employee` and structured clothing mechanic `required_state.underwear_bottom=removed`;
- turn 19 brought registered `heroine3` back into the canonical scene (`present_npc_ids=[heroine3]`), yet post-save `npc_scene_state` remained `{}`;
- turn 20 still had `npc_scene_state={}` and Story continued without the required clothing premise.

Current main source independently exposes the deterministic root seam in `src/engine/runtime-core/csa-commit-reducer.js`: `applyClothingContinuity()` applies an active clothing CSA to a present matching NPC only when `nextSave.npc_scene_state[actorId]` already exists; if it is absent, the reducer executes `continue`. Therefore a fresh registered NPC with no prior physical observation can never receive its first durable clothing-state record from the one retained structured clothing CSA mechanic.

This task repairs only that bootstrap seam. Do not broaden into general physical-state, relationship/event, consent, provider, or Cut3 work.

## 1. Frozen lineage

Repository: `zeroslove-ai/company-v1`
Required base main: `43aa03cf645a2e1a2cae3e0283d2e485170db021`
Expected branch: `company/clothing-csa-npc-state-bootstrap-repair-v1`

Before editing:
1. fresh-fetch `main` and require exact base above;
2. verify this branch is exactly one docs-only registration commit ahead of base;
3. re-read terminal `5322507579` and this exact CURRENT_TASK blob;
4. inspect the preserved TEST game read-only, especially turns 17, 19, 20;
5. inspect current `csa-commit-reducer.js`, `clothing-state-mechanic.js`, `state/clothing.js`, `observation-reducers.js`, Story context projection, and relevant tests before choosing the minimal patch.

If current main or evidence differs materially, STOP `BLOCKED_CLOTHING_CSA_NPC_BOOTSTRAP_DRIFT` rather than guessing.

## 2. Exact repair objective

Keep Commit as the sole durable writer for the retained structured clothing CSA mechanic.

For an active clothing-state CSA and a canonical-scene actor whose registered profile exactly matches the rule subject scope:
- player behavior remains as currently accepted;
- a present matching NPC must receive the rule's exact `required_state` even when `npc_scene_state[npc_id]` did not previously exist;
- the new NPC record must use the existing canonical physical-state shape and exact four clothing slots;
- absent/unobserved slots must be structural `unknown`, not inferred `worn` or invented garment facts;
- overlay only the exact required slots from the structured CSA mechanic;
- preserve any pre-existing evidenced NPC physical/clothing fields;
- record a current `updated_turn` consistent with the Commit turn when a new/changed clothing state is written.

The expected structural bootstrap for the live defect is therefore equivalent in meaning to:
- `uniform_top: unknown`
- `uniform_bottom: unknown`
- `underwear_top: unknown`
- `underwear_bottom: removed`

Do not infer ordinary work clothes, posture, location mirrors, sexual state, emotion, consent, compliance preference, relation, or historical events from the rule.

## 3. Scope / authority rules

Preserve all existing boundaries:
- only canonical scene participants are candidates;
- exact registered actor identity and existing `matchesCsaSubjectScope()` policy remain authoritative;
- female-only rule must not affect male NPC/player;
- off-scene NPCs must not be seeded;
- inactive/deactivated/non-clothing CSA must not create clothing state;
- no target fuzziness/name search;
- no generic CSA execution DSL;
- no semantic parser/router/verifier;
- no Story-text regex used to force compliance;
- ordinary Extract physical/clothing observations remain exact-Story-evidence gated;
- this narrow structured CSA mechanic remains the only rule-driven exception already sanctioned by canon.

Do not change the meaning of `state/clothing.js` ordinary observation path merely to make the test pass. If comments there conflict with the already-retained structured CSA exception, clarify comments only if necessary; do not weaken evidence gating for ordinary observations.

## 4. Required regression proof

Add focused behavior tests proving at minimum:
1. present female registered NPC + active `female_employee` clothing CSA + no prior `npc_scene_state` => canonical NPC state is created with four slots, unknown defaults, exact required slot applied;
2. same case with an existing evidenced NPC state preserves unrelated slots/physical fields and overlays only exact required slots;
3. present male NPC is not affected by `female_employee` scope;
4. matching NPC not present in canonical scene is not created/mutated;
5. inactive/deactivated/non-clothing rule does not bootstrap state;
6. repeated Commit is idempotent for unchanged required state;
7. player clothing behavior remains unchanged;
8. Story context projection on the following turn can read the newly bootstrapped `npc_scene_state` clothing state for the active NPC;
9. the preserved live-defect shape (turn-19 style: newly present heroine3, active csa_17, no prior npc_scene_state) reproduces FAIL before fix and PASS after fix.

Prefer extending the existing closest CSA/Commit/gameplay contract test files. Do not create a new test architecture.

## 5. Allowed changed files

Expected minimal executable scope:
- `src/engine/runtime-core/csa-commit-reducer.js`
- closest existing CSA/Commit/gameplay contract test file(s)
- optionally one existing clothing/state helper only if required to centralize the canonical four-slot unknown bootstrap without duplicating constants
- `docs/ops/CURRENT_TASK.md`

Any unrelated runtime/prompt/provider/frontend/DB/config/migration file requires STOP `BLOCKED_CLOTHING_CSA_NPC_BOOTSTRAP_DRIFT` unless independently proven indispensable to this exact writer seam.

## 6. Verification

Run:
- focused CSA clothing/Commit tests;
- focused Story context projection tests if touched/needed;
- full `npm test` with zero failures;
- `node --check` for all changed JS/MJS;
- `git diff --check`;
- inspect final diff for accidental generic physical/CSA authority expansion.

No live TEST gameplay is authorized in this repair task. TEST DB may be queried read-only only to preserve/compare the existing evidence.

## 7. PR / merge boundary

After implementation and local validation:
1. commit one coherent source/test repair;
2. open one PR against `main`;
3. require exact-head CI SUCCESS;
4. self-review exact diff against the live evidence and the authority boundaries above;
5. do NOT merge in this task; stop for operator review with the PR open and unmerged.

The next operator-reviewed task will decide merge + exact-main TEST redeploy + a narrow live reproduction/acceptance.

## 8. Hard prohibitions

- Production/hospital-v2 access or mutation
- Worker deploy
- TEST game reset/new gameplay/session
- migration/DDL/schema/history write or repair
- `supabase db push`
- provider/model/TTS/binding change
- Story/Extract prompt change
- general physical/sexual-state redesign
- relationship/event/Cut3 implementation
- new consent or compliance semantic layer
- retry/regenerate-until-pass

## 9. Terminal

Success terminal:
`CLOTHING_CSA_NPC_STATE_BOOTSTRAP_REPAIR_READY`

Blocked terminal:
`BLOCKED_CLOTHING_CSA_NPC_BOOTSTRAP_DRIFT`

At terminal:
- set CURRENT_TASK `WAITING_REVIEW`;
- post exactly one Issue #68 terminal with registration SHA/blob, source/test commit SHA, PR number/head, changed paths, focused/full test results, syntax/diff checks, exact regression proof, and safety-operation counts;
- STOP with PR unmerged and no TEST deploy/gameplay.
