# Company v1 — CURRENT TASK

Status: WAITING_REVIEW
Task ID: extract-scene-evidence-roundtrip-reconciliation-v1
Updated: 2026-08-18
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

## Purpose

Repair only the deterministic Extract→persisted-read→Commit round-trip defect exposed by the first real TEST live acceptance. The live session proved that fresh Extract can accept and persist a current V2 scene observation with canonical `location_id` plus exact `kind:"scene"` evidence, but Commit immediately re-reads that same persisted V2 row through the historical compatibility normalizer and rejects it because the compatibility path still requires obsolete `scene_id` for `kind:"scene"` evidence. Reconcile the current-fresh persisted read path with the owner canon that removed `scene_id`, preserve historical compatibility deliberately, add exact round-trip regression coverage for the live failure shape, and STOP for review. Do not deploy or resume gameplay in this task.

## 0. Frozen authority

- Repository: `zeroslove-ai/company-v1`
- Expected `origin/main`: `8f3c5326e483650211fbc6c9f54a7527d2278d4e`
- Previous task: `test-runtime-live-acceptance-v4`
- Previous STARTED: Issue #68 comment `5319966625`
- Previous terminal: Issue #68 comment `5320067594`
- Previous classification: `BLOCKED_TEST_RUNTIME_LIVE_ACCEPTANCE_V4`
- Previous final SHA: `f426a77b64a56d4cbca9c18e9c605b0753324f54`
- Previous final CURRENT_TASK blob: `4defca25a436920c8367370e0dd0b0aec5b10af0`
- This branch must be: `company/extract-scene-evidence-roundtrip-reconciliation-v1`
- TEST Supabase: `fmcrspgxstsmxxsmkeee`
- API Worker: `game-proxy-company-v1`
- Accepted currently deployed API version: `2a976491-451d-4fc8-8808-65353cad137b`
- Frontend Worker: `gamebuilder-company-v1`
- Accepted currently deployed frontend version: `d3c1bb47-e779-431e-a0ac-98eb513561c6`
- Disposable TEST game: `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`
- Preserved/manual game — do not touch: `78fb1d94-266f-455a-bda4-7656cc2370c1`
- QA game — do not touch: `f31b6c1b-0b27-4a4e-8c9d-7a238360891f`
- Protected sentinel — do not touch: `11111111-1111-4111-8111-111111111111`
- Production and hospital/v2: forbidden

Current TEST post-failure safety snapshot independently re-read by operator:
- migration rows `27`;
- target migration `20260817000200` absent;
- disposable: save `1`, turns `5`, actions `6`, committed_turn `5`;
- preserved/manual: `1 / 7 / 9 / 7`;
- QA: `1 / 7 / 7 / 7`;
- protected sentinel: `1 / 18 / 18 / 18`.

The failed disposable action is preserved and must not be retried or repaired in-place:
- action_id `72cc2486-cc80-408c-9d86-8196cab7b6ad`
- expected_turn `6`
- processing_status `committing`
- exact player input: `윤민아와 서원희에게 각자 맡은 업무를 확인하고 팀의 일정과 우선순위를 자연스럽게 조율한다.`
- Story completed and Extract succeeded;
- Commit returned HTTP 422 `invalid_extract_observation`, message `scene evidence requires scene_id`;
- no durable turn 6 exists.

Operator-verified persisted Extract evidence from that exact action:
- `scene_observation.location_id = "brand_strategy_office"`;
- `scene_observation` has no `scene_id`;
- evidence contains `{kind:"scene", location_id:"brand_strategy_office", quote:"오전 11시 54분, 브랜드전략팀 사무실."}`;
- that quote is an exact substring of persisted Story;
- presence evidence for registered NPCs is also exact-quote grounded.

Binding owner canon (`docs/COMPANY_V1_POST_MERGE_GAMEPLAY_SIMPLIFICATION_CANON_2026-08-17.md`): canonical scene is exactly
`{version, location_id, present_npc_ids, focal_character_id, last_speaker_id, updated_turn}`;
`scene_id` was explicitly removed because it duplicated/contradicted location authority. Do not reintroduce it into fresh scene, fresh Extract, prompts, save, or runtime semantics.

## 1. Mandatory preflight

Before editing:
1. fresh-fetch `origin/main` and require exact SHA above;
2. require this branch to descend directly from previous final `f426a77b64a56d4cbca9c18e9c605b0753324f54` with only the registration commit before execution;
3. re-read terminal `5320067594` and the preserved TEST action row read-only;
4. inspect, at minimum:
   - `src/engine/runtime-core/extract-observation.js`
   - `src/engine/runtime-core/persisted-extract-observation.js`
   - `src/api/turn-routes.js`
   - `src/engine/runtime-core/scene-reducer.js`
   - `src/engine/extract-prompt.js`
   - `test/extract-observation-contract.test.mjs`;
5. prove the exact current flow:
   - fresh provider result → `normalizeFreshExtractObservationV2()` at Extract;
   - normalized result persisted as `game_actions.extract_delta`;
   - Commit re-reads V2 through `normalizePersistedExtractObservation()`;
   - current V2 branch presently delegates to historical `normalizeExtractObservationV2()`;
6. prove the contract mismatch before modifying code:
   - fresh scene fields do not allow `scene_id`;
   - prompt does not request `scene_id` and explicitly uses `location_id` for scene evidence;
   - canonical scene reducer has no `scene_id` consumer;
   - historical compatibility normalizer still has obsolete `scene_id` handling and `kind:"scene"` evidence requirement;
7. deterministically reproduce the failure locally using a minimal fixture shaped like the preserved turn-6 Extract delta and exact Story quote. No live API/provider call is needed for reproduction;
8. read TEST only to confirm the failed action and protected-game counts remain unchanged. No DB write.

If the evidence does not reproduce coherently, or if the actual failing path differs materially, STOP `EXTRACT_SCENE_EVIDENCE_ROUNDTRIP_RECONCILIATION_BLOCKED` without speculative patching.

## 2. Architecture decision

The repair must follow these constraints:

### 2.1 Current fresh V2 vocabulary stays current

Fresh Extract remains narrow and must not gain:
- `scene_id`;
- `presence_is_final`;
- old semantic event/relation fields;
- save-patch vocabulary;
- a new parser/adapter/gateway.

Do not alter the Extract prompt to ask the provider for `scene_id`.

### 2.2 `location_id` is scene-location provenance

For current fresh V2 scene observations:
- `scene_observation.location_id` is the only scene-location identifier;
- `kind:"scene"` evidence must remain an exact Story quote and location-grounded;
- a current `kind:"scene"` evidence item must not need an independent `scene_id`;
- malformed/unknown location evidence must not become authority merely to make Commit pass.

Prefer a precise current contract such as requiring the scene evidence location to be non-empty/registered-consistent with the observation location where the current runtime has that information. Do not weaken exact quote provenance.

### 2.3 Historical compatibility stays historical

`normalizePersistedExtractObservation()` is the historical read boundary. Existing historical V1/V2 rows that actually carry legacy fields must remain readable where already supported.

The target is not to delete legacy compatibility blindly. The target is to ensure **current fresh V2 persisted rows round-trip through Commit using current vocabulary**, while true legacy rows still use the compatibility path.

Do not use exception-driven "try fresh then silently fall back to legacy" dispatch if that can reinterpret malformed current data as historical data. Prefer an explicit, deterministic shape boundary or a simpler proven equivalent.

### 2.4 Commit remains structural/provenance authority

Do not bypass `normalizePersistedExtractObservation()` at Commit simply to avoid validation. Commit must still re-read persisted Extract and validate:
- registered IDs;
- exact evidence quote provenance;
- allowed narrow current fields;
- scene location/presence structure.

The repair must remove the obsolete semantic contradiction, not skip persisted validation.

## 3. Allowed repository scope

After registration, only these files may change unless the root-cause proof demonstrates one additional directly required caller test file:
- `src/engine/runtime-core/extract-observation.js`
- `src/engine/runtime-core/persisted-extract-observation.js`
- `test/extract-observation-contract.test.mjs`
- optionally one existing narrowly-related Commit/turn test file if needed to prove the actual API caller path
- `docs/ops/CURRENT_TASK.md`

Do not modify:
- Story prompt/runtime behavior;
- scene reducer semantics except if a direct compile-only adjustment is strictly required and justified (default: no change);
- frontend;
- content/catalog;
- Wrangler configs;
- DB gates/smoke repairs;
- migrations/schema/RPCs;
- package/lock/workflows;
- provider/model/TTS/bindings;
- unrelated tests/docs.

## 4. Required regression proof

Add behavior-level tests proving at least:

1. **Exact live failure round-trip**
   - fresh V2 input with `location_id="brand_strategy_office"`;
   - `kind:"scene"` evidence with matching location and exact Story quote;
   - fresh normalization succeeds;
   - persisted normalization of that fresh normalized result also succeeds;
   - no `scene_id` is required or manufactured as current semantic authority.

2. **Commit-reader parity**
   - the normalized current persisted result consumed by the Commit path preserves the same current scene location/evidence facts required by the reducer;
   - it does not reinterpret the action as legacy semantic scene identity.

3. **Exact-quote fail closed**
   - `kind:"scene"` quote not present in Story still fails/drops according to the existing intended strictness; do not weaken to arbitrary location text.

4. **Location provenance fail closed**
   - malformed/empty/contradictory scene location evidence does not become accepted authority simply because `scene_id` was removed.

5. **Presence evidence remains intact**
   - registered presence/entrance/exit exact-quote behavior remains unchanged.

6. **Historical V2 compatibility remains readable**
   - an actual legacy-shaped V2 fixture with the old fields already supported by the reader still passes through the historical path.

7. **Fresh vocabulary rejects legacy authority**
   - direct fresh provider input containing `scene_id` remains rejected as unknown fresh vocabulary.

8. **No accidental semantic widening**
   - retired relationship/events/work/CSA semantic fields stay rejected or inert exactly as current canon requires.

Run focused tests, then full `npm.cmd test`; require zero failures. Run `node --check` on every changed JS/MJS file and `git diff --check`.

## 5. Deterministic failure-fixture proof

Before terminal success, replay the preserved turn-6 shape **locally only** through the same normalization sequence used by Extract then Commit. It must prove:
- fresh normalize PASS;
- persisted re-read PASS;
- exact scene quote still verified against Story;
- location remains `brand_strategy_office`;
- no provider call, DB mutation, reset, gameplay turn, or Worker deploy occurs.

Do not attempt to commit the already-stuck live action. Do not alter its DB row. That action is forensic evidence for the later live-acceptance rerun.

## 6. Safety / forbidden operations

Forbidden in this task:
- API deploy/redeploy;
- frontend deploy/redeploy;
- TEST reset or gameplay/provider turn;
- retry/repair/complete of stuck action `72cc2486-...`;
- direct gameplay DML;
- DB/schema/DDL/migration/history write;
- migration apply/push/repair;
- Production infrastructure access/change;
- hospital/v2 access;
- provider/model/TTS/binding changes;
- protected/preserved/QA mutation;
- Cut 3;
- PR/merge unless a later owner task explicitly authorizes it.

Read-only TEST queries are allowed only for pre/post evidence.

## 7. Terminal classification

Choose exactly one:

### `EXTRACT_SCENE_EVIDENCE_ROUNDTRIP_RECONCILED`
Only if:
- the preserved failure is reproduced deterministically;
- current fresh V2 persisted observations round-trip through the Commit reader without `scene_id`;
- exact Story/location provenance remains fail-closed;
- historical compatibility remains intentionally supported;
- focused/full tests and syntax/diff checks pass;
- TEST rows/counts remain unchanged;
- deploy/reset/gameplay/DB-write/Production counts remain zero.

### `EXTRACT_SCENE_EVIDENCE_ROUNDTRIP_RECONCILIATION_BLOCKED`
Use if root cause differs, current-vs-legacy shape cannot be separated safely, provenance would need weakening, tests fail, unrelated scope is required, or any safety invariant drifts.

At terminal:
1. set CURRENT_TASK `WAITING_REVIEW`;
2. post exactly one Issue #68 terminal with registration/final SHA/blob, exact root cause, changed files, before/after current-vs-legacy contract, exact failure-fixture proof, focused/full test counts, TEST pre/post counts, and all safety counts;
3. STOP. Do not deploy, resume live acceptance, merge, or start Cut 3.

## 8. Execution terminal evidence

- Classification: `EXTRACT_SCENE_EVIDENCE_ROUNDTRIP_RECONCILED`.
- Starting HEAD: `f218ba01a026bfe6a674cdd28c432222e564526b`.
- Root cause reproduced before repair: `normalizeFreshExtractObservationV2()` accepted the current fresh scene vocabulary (`location_id` plus exact `kind:"scene"` evidence), while `normalizePersistedExtractObservation()` sent that same current result through the historical V2 path, which required obsolete `scene_id` and rejected the Commit readback.
- Changed files only: `src/engine/runtime-core/extract-observation.js`, `src/engine/runtime-core/persisted-extract-observation.js`, `test/extract-observation-contract.test.mjs`, and this lifecycle evidence.
- Contract before/after: current fresh/persisted V2 now has an explicit shape boundary with no `scene_id`; current scene evidence requires a non-empty location matching `scene_observation.location_id` and an exact Story quote. Historical V2 rows with legacy shape remain on the historical `scene_id` path. No scene_id was added to fresh output or manufactured by current persisted normalization.
- Exact preserved failure fixture: the turn-6 shape with action `72cc2486-cc80-408c-9d86-8196cab7b6ad`, `location_id="brand_strategy_office"`, and quote `오전 11시 54분, 브랜드전략팀 사무실.` reproduced fresh PASS then persisted failure before repair; after repair it produces fresh PASS, persisted PASS, unchanged exact quote/location, and no `scene_id` in either current result.
- Regression coverage: current round-trip parity, exact quote fail-closed, matching location provenance, registered presence evidence, historical V2 readability, fresh `scene_id` rejection, and retired semantic-field rejection. Focused Extract contract tests `8/8 PASS`; full `npm.cmd test` `342/342 PASS`; changed-file `node --check` and `git diff --check` PASS.
- TEST read-only evidence before and after source-only work: migrations `27`, target `20260817000200` absent; disposable `save/turns/actions/committed_turn=1/5/6/5`; preserved/manual `1/7/9/7`; QA `1/7/7/7`; protected sentinel `1/18/18/18`; failed action remains `processing_status=committing`, `expected_turn=6`, with no durable turn 6.
- Safety counts: API/frontend deploy `0`; TEST reset/gameplay/provider turn `0`; DB schema/migration/history writes `0`; migration apply/push/repair `0`; Production/hospital/v2 access `0`; provider/model/TTS/binding changes `0`; protected/preserved/QA mutation `0`; PR/merge/Cut3 `0`.
- STOP: review required. Do not deploy, reset, resume or repair the stuck action, run live gameplay, merge, generate the next task, or start Cut 3.
