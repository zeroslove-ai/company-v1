# Company v1 — CURRENT TASK

Status: READY
Task ID: csa-natural-rule-authority-reset-v1
Updated: 2026-08-15
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Accepted starting point

Repository: `zeroslove-ai/company-v1`
Branch: `company/scene-location-presence-v1`
Canonical PR: #67, base `main`, must remain OPEN / DRAFT / UNMERGED.
Accepted executable immediately before this task: `efd4f167a837a9e31982b974704d9f8c9af9e4a4` (`open-observation-authority-core-v1`). A docs-only registration descendant is allowed as START_SHA.
TEST Supabase: `fmcrspgxstsmxxsmkeee`.
Preserved manual game `78fb1d94-266f-455a-bda4-7656cc2370c1` is READ ONLY forever.

The accepted open-observation cut established the intended main loop:
`player input -> Story authors narrative -> Extract observes arbitrary exact-evidence facts -> Commit structurally persists -> context/history/next Story read committed facts`.

CSA must now become a narrow institutional rule/context system feeding that loop, not a second physical-story engine.

## Architecture target

CSA owns only what must be deterministic for the app/system:
- stable rule/preset identity;
- active/inactive lifecycle and slot/level capability;
- rule strength/authority where it is a product capability;
- subject/counterparty applicability/scope where the product actually needs it;
- transaction/idempotence/activation timestamps;
- human-readable rule content/context supplied to Story;
- narrow product projections only when a real UI/mechanical caller proves them.

CSA must NOT define a finite universe of physical/narrative execution. Story receives the active institutional rule plus applicable actors/context and authors the natural observable HOW. Extract observes what actually happened through open facts and proven narrow projections. Commit persists those observations. Institutional compliance never implies consent, comfort, affection, trust, emotion, romance, or sexual willingness.

## Mandatory Phase 0 — caller/data proof before deletion

Inventory exact current callers/readers/writers for at least:
- `src/engine/csa/execution-policy.js`: `EXECUTION_KINDS`, `EXECUTION_ACTIONS`, `EXECUTION_TRIGGER_KINDS`, `RELATION_KINDS`, execution metadata derivation/validation;
- `src/engine/csa/story-projection.js`: `execution_contract`, `resolved_facts`, posture readiness, interaction-target resolution, `scene_obligations`, `mandatory_execution`;
- `src/engine/csa/authority-policy.js` and any enactment/phase policy;
- Story prompt `engine_canonical_segments`, `[ACTING enactment_id]`, `posture_after`, mandatory/direct-coverage instructions;
- Story parser/protocol validation for enactment IDs and posture tokens;
- Commit/reducer paths that consume Engine/CSA enactments, relation kinds, physical transitions, CSA runtime execution state;
- tests and content rows carrying `execution` metadata;
- frontend/app callers of CSA fields;
- persisted historical readers that would break if old fields disappear.

For every finite CSA physical mechanic classify: DELETE NOW, LEGACY READ-ONLY, or PROVEN NARROW PRODUCT/INTEGRITY MECHANIC. REMOVE is the default unless a current deterministic consumer is demonstrated.

Do not keep runtime solely because content rows or stale tests contain the field. Content may be migrated in repository source if needed; historical applied DB migrations remain immutable.

## Required implementation

### 1. Remove CSA as a physical execution grammar

Delete or remove from the fresh Story/Extract/Commit path the machinery whose purpose is to prescribe a finite physical HOW, including where caller proof permits:
- `EXECUTION_ACTIONS` physical action vocabulary such as `sit_on_lap`, `stand_between_knees`, `press_body_against`, etc.;
- `RELATION_KINDS` as CSA physical/narrative authority;
- `execution_action` / `execution_contract.action` as required physical Story token;
- `posture_after` as mandatory CSA enactment output;
- `engine_canonical_segments` physical action contracts;
- mandatory enactment IDs and direct-coverage validation;
- `scene_obligations` / `mandatory_execution` for physical HOW;
- deterministic physical relation creation from CSA execution tokens;
- CSA runtime `execution_state` if it exists only to prove a physical token was enacted.

Do not replace these with a new action enum, generic `other`, regex/keyword classifier, another parser generation, or another LLM call.

### 2. Story gets natural institutional rule context

For each active/applicable CSA rule, Story should receive compact structured identity/context sufficient to know:
- rule id and human-readable content;
- strength/authority if product-visible and still meaningful;
- active/applicable status;
- subject/counterparty scope and resolved applicable registered actors where needed;
- mode/trigger only if a real product behavior requires it.

Story then narrates natural Korean fiction consistent with the rule and current scene. No exact action token or exact posture token is required. A rule may result in arbitrary physical, conversational, clothing, intimate, or sexual behavior when contextually appropriate; the existence of that behavior is not limited by a CSA action catalog.

For request-triggered rules, player input remains intent/request context; do not store success directly from the input. Story determines observable outcome, Extract observes it.

### 3. Preserve reaction/agency separation

CSA institutional authority can make a workplace rule effective, but it does not write NPC emotion/relationship/consent state. Story may portray compliance, refusal where rules permit, discomfort, anger, embarrassment, indifference, enthusiasm, negotiation, or other reaction naturally. Extract open facts persist what Story actually shows.

Do not infer affinity, romance, trust, sexual willingness, comfort, or emotional acceptance from CSA activation/compliance.

### 4. Preserve narrow product functions

Do NOT regress:
- CSA app create/activate/deactivate/edit/lifecycle and level/slot restrictions;
- Production progression logic;
- setup catalogs and stable registered IDs;
- canonical scene/location/presence integrity;
- compact clothing UI continuity projection when actually observed/needed;
- image/media catalogs, sex/general pools, image action/tag families, deterministic image selection;
- open facts and exact Story evidence/provenance;
- literal provider-authored choice path;
- action/turn transactionality/replay/idempotence.

Image taxonomy is presentation-only. Failure to match an image must never mean the Story action/fact did not occur.

If clothing CSA currently depends on deterministic required-state metadata, preserve only the minimum rule/UI state that is actually required; do not use that exception to retain the general physical execution grammar. Prefer Story -> Extract -> compact clothing projection for observed continuity where architecture permits.

### 5. Delete superseded fresh writers/readers/tests in this cut

Once the natural-rule path is proven, delete dead physical-enactment builders, validators, adapters, and tests rather than leaving both systems active. Historical persisted readers may remain only with an exact current reader/data justification and a stated deletion criterion.

Do not add compatibility runtime to keep stale tests green. Rewrite/delete stale tests to assert the new authority boundary.

### 6. TEST Level 7 seam: source design only unless clearly isolated

Future live acceptance must use a dedicated TEST-only Level 7 acceleration seam because strong CSA unlocks at Lv7. Production progression must not change.

In this source cut, identify the safest single harness/seed/override seam. You MAY implement it only if it is test-harness-only, impossible to activate in Production through normal runtime configuration, does not become a second gameplay writer, and requires no live DB mutation/deploy to validate. Otherwise document the exact next-task implementation plan.

No live gameplay is authorized in this task.

## Required tests

At minimum prove:
1. An active applicable CSA rule reaches Story as natural rule/context without a required physical action enum/token.
2. A physical outcome not present in old `EXECUTION_ACTIONS` is valid Story and can survive Extract as an open fact.
3. A posture/contact/intimate/sexual outcome outside old CSA vocabularies is not rejected by CSA validation.
4. No mandatory enactment/direct-coverage/posture token is required for an otherwise valid Story.
5. Request-triggered CSA does not convert player request text directly into successful durable fact/state.
6. CSA compliance does not mechanically mutate affinity/romance/trust/emotion/consent/sexual willingness.
7. CSA app lifecycle, level/slot capability and applicable registered identity behavior still work.
8. Compact clothing continuity still works through its proven narrow path.
9. Image/media selection tests including sexual image families still work and remain presentation-only.
10. Open observations still persist/read back/replay idempotently.
11. Literal four provider choices/free text behavior remains unchanged.
12. Any retained legacy CSA execution reader is proven read-only and absent from fresh writes.

Run focused tests plus full suite. Test-count reduction is acceptable when obsolete execution-grammar tests are deleted; explain meaningful reductions. Run syntax checks for modified JS/MJS and `git diff --check`.

## Forbidden

- Production access/mutation.
- TEST live gameplay/LLM calls, DB writes/resets, DDL/migration apply, deploy.
- Mutation/reset of preserved manual game.
- New PR/branch, merge, Ready, rebase, squash.
- Editing historical applied migrations.
- Provider/model/temperature/token changes.
- Retry/regeneration loops.
- Fuzzy semantic repair, regex semantic inference, parser relaxation/new parser.
- New finite physical/sexual/posture/relation taxonomy replacing the old one.
- Direct player-input success inference.
- Arbitrary LLM save patches.
- Removing/degrading image/sexual-image functionality because its catalog is finite.

## Terminal report

Before COMPLETE:
- report START_SHA and executable FINAL_SHA;
- list runtime files modified/deleted;
- list every CSA physical authority deleted or removed from fresh path;
- list every retained finite CSA field with its proven current consumer;
- list any LEGACY_READ_ONLY residue with exact caller and deletion criterion;
- report Level 7 test-seam disposition;
- focused + full test results, syntax checks, `git diff --check`;
- verify PR #67 remains base `main`, OPEN / DRAFT / UNMERGED;
- verify migration apply/DB write/reset/deploy/Production/manual-game mutation are all 0.

Then set CURRENT_TASK to `WAITING_REVIEW`, commit/push on the same branch, post one immutable terminal report to Issue #68, and STOP.