# Company v1 — CURRENT TASK

Status: WAITING_REVIEW
Task ID: post-cut2-architecture-checkpoint-game-model-recovery
Updated: 2026-08-14
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution queue for Company v1.

## Why this task exists

Cut 2 Scene / Location / Presence Authority is now operator-accepted through TEST Stage B and scoped post-Stage-B Golden Path acceptance.

Accepted Cut 2 facts:

- reviewed/deployed runtime executable: `a919baf87d92e841e64b731576ccb176d5745570`
- Scene Stage A live: `20260814091536 / company_v1_scene_authority_stage_a`
- Scene Stage A ACL closure live: `20260814093123 / company_v1_scene_authority_stage_a_acl_closure`
- Scene Stage B live: `20260814000600 / company_v1_scene_authority_stage_b`
- `validate_company_save_v1(jsonb)` now structurally requires canonical `save.scene`
- legacy scene mirrors are optional typed compatibility fields, not canonical authority
- player navigation and NPC-directed movement authority acceptance passed
- dedicated TEST game is clean at `save_revision=881`, `committed_turn=0`, actions=0, turns=0
- PR #67 remains OPEN / DRAFT / UNMERGED

Do **not** mechanically begin Cut 3 just because the roadmap labels it next. Before another implementation cut, recover the actual current Company v1 game model from source and read-only live evidence, identify what still owns each gameplay fact, and choose the next root-cause architecture cut based on player impact and authority debt.

This is a read/audit/design checkpoint, not an implementation task.

## Binding authority

Read and obey in order:

1. `/CURRENT_TRUTH.md`
2. `/AGENTS.md`
3. `/docs/audit/company-v1-current-truth-2026-08-13/09_CURRENT_TRUTH.md`
4. `/docs/audit/company-v1-current-truth-2026-08-13/10_SOLE_WRITER_DECISION.md`
5. this file
6. Issue #68 persistent comment `SESSION_RECOVERY: CUT3_TO_CUT7_ROADMAP_AND_PLAYTEST_EVIDENCE`
7. operator review for `cut2-scene-stage-b-apply-and-closure`

Current source, Git ancestry, live TEST DB/catalog, exact deployed identity, and immutable evidence outrank completion prose and historical handoffs.

## Repository / branch / PR guard

Repository: `zeroslove-ai/company-v1`
Current branch: `company/scene-location-presence-v1`
Current PR: #67

Before analysis:

1. fetch current remote HEAD and PR #67 state
2. confirm the accepted Cut 2 final HEAD ancestry and distinguish docs-only HEAD from executable `a919baf...`
3. inspect PR #65 / #66 / #67 ancestry and bases
4. inspect current `main` ancestry
5. do not create a branch or PR
6. do not merge, rebase, retarget, or mark any PR Ready

The checkpoint must explicitly answer whether adding another stacked PR would recreate the PR-lineage debt that the current architecture reset was intended to eliminate. If a landing/consolidation decision is required before implementation can safely continue, say so clearly and stop at a recommendation rather than creating PR #68+.

## Goal 1 — Reconstruct the real player/game flow from source

Trace the actual current flow end-to-end from code, not from old design prose:

`player setup -> Opening -> player input/choice -> reserve action -> Story stream -> fresh parser/wire -> Extract observation -> Commit reducers -> commit_company_turn -> context/history -> frontend/session projection -> next turn`

For each stage identify:

- owning module/function/RPC
- inputs
- durable writes, if any
- canonical output
- replay/recovery path
- compatibility/projection path
- what may fail closed
- what must not block ordinary free player flow

Also trace how these gameplay systems enter that turn flow:

- CSA applicability / mandatory enactment / runtime / Commit durability
- Scene/location/presence
- player action fidelity and navigation/target interpretation
- relationship state and relation/event ledgers
- NPC/player physical and sexual state
- story summaries / turn_summary / recent context / overall memory
- choices / THOUGHT / committed parsed_blocks
- setup/opening world/catalog authority
- frontend session/cache/recovery
- TTS/image/media only insofar as they can affect turn flow or steal authority

Do not infer ownership from filenames alone. Follow actual callers and writers.

## Goal 2 — Build a current authority/debt matrix

For every durable or continuity-relevant domain below, inventory all current writers, readers, mirrors/adapters, and gates:

1. turn/action lifecycle
2. scene/location/presence
3. CSA active/rules/runtime
4. active relations
5. relationship summaries/milestones/boundaries
6. event ledger
7. NPC/player posture, clothing, contact, physical relations
8. player sexual state and NPC sexual/relationship consequence state
9. setup/opening/world catalog semantics
10. turn summary / recent summary / overall summary / recent-turn context
11. committed parsed blocks / replay / persisted parser / legacy parser
12. frontend/session projections and recovery caches

For each domain classify current state as one of:

- `SOLE_CANONICAL`
- `CANONICAL_PLUS_DERIVED_PROJECTION`
- `TEMPORARY_COMPATIBILITY_WITH_PROVEN_READER`
- `DUPLICATE_AUTHORITY_DEFECT`
- `MISSING_DURABLE_CONSEQUENCE`
- `UNKNOWN_REQUIRES_EVIDENCE`

For every retained compatibility path, name the actual proven reader/data reason and the deletion criterion. If there is no proven reader, mark it as a deletion candidate; do not justify it with “just in case”.

## Goal 3 — Read-only recovery of the actual 7-turn playtest

Manual playtest game:

`78fb1d94-266f-455a-bda4-7656cc2370c1`

This game is immutable evidence. READ ONLY.

You may query TEST Supabase read-only for this game. Never reset or mutate it.

Reconstruct all committed turns and relevant action rows as far as current retained data allows. Compare, turn by turn where useful:

- player_action / structured_action
- raw Story and committed parsed_blocks
- choices and THOUGHT
- Extract observation
- committed save consequences
- scene/location/presence
- relation/event changes
- physical/sexual state changes
- `turn_summary`
- `story_summary_recent`
- `story_summary_overall`
- context/history continuity

Confirm or correct the persistent roadmap observations rather than repeating them blindly. In particular investigate:

- repeated meaningful relationship/sexual/boundary/apology narrative with little or no durable relation/event consequence
- all/most `game_turns.turn_summary` being empty
- `story_summary_recent` appearing stuck on Opening/raw content
- overall-summary mojibake
- player action fidelity case where `허리를 만진다` became unrelated table-edge touching
- provider choices missing on some turns and deterministic fallback behavior
- whether image/media state is gameplay-authority-relevant or merely missing projection

Do not claim an exact root cause unless source + stored evidence supports it.

## Goal 4 — Decide the next architecture cut by root cause, not roadmap order

Compare at minimum these candidates:

A. Relationship / Event Authority
B. bounded Memory / Summary prerequisite or full Memory/Summary Authority
C. Setup / Opening / World Definition Authority
D. Player/NPC Physical & Sexual State Authority
E. Parser / replay compatibility cleanup that has become immediately removable

Rank them by:

- player-visible continuity damage
- risk of durable fact corruption or loss
- number/severity of duplicate writers/readers
- likelihood that later Cuts would otherwise build on the wrong authority
- ability to remove obsolete code in the same Cut
- ability to preserve ordinary free game flow
- migration/deployment risk

Then recommend **one** next implementation Cut or, if needed, one bounded prerequisite Cut.

The recommendation must include:

- canonical owner to establish
- exact current conflicting/missing authority
- files/modules/RPCs likely affected
- explicit deletion targets in the same Cut
- compatibility paths that must remain and why
- focused invariant tests to KEEP/REWRITE/DELETE
- live TEST acceptance scenario
- whether DB Stage A/B rollout is needed
- whether implementation can safely continue on the current lineage without another PR

## Engineering principles — mandatory

- redesign authority boundaries; do not layer symptom patches
- one durable domain = one canonical writer
- typed intent/observation inputs -> canonical reducer/writer -> derived projections
- ordinary player input must remain free; classification failure must not become an unnecessary Story/turn rejection
- player input is intent/attempt, not automatic durable success
- provider/model/temperature/token changes are not architecture fixes
- no retry/regeneration loop as a structural workaround
- no fuzzy identity repair or synthetic semantic state
- no new semantic hard gate to hide ambiguity
- if prompt/protocol patches are accumulating around the same representation, flag protocol redesign instead of proposing another prose/regex patch
- stale tests do not justify compatibility runtime
- superseded writer/reader/gate/test is deleted in the Cut where proof completes
- historical applied migrations and immutable evidence are never edited
- Cut 7 is residue cleanup, not permission to postpone known removable legacy
- exact reviewed executable SHA and moving docs-only branch HEAD remain separate identities
- do not create a new harness when existing canary/context/history tools can prove the invariant

## Deliverables

Create or update a single docs-only audit artifact under `docs/audit/` named clearly for the post-Cut2 architecture checkpoint. It must contain:

1. current Git/PR/runtime/TEST identities
2. end-to-end current game-flow map
3. authority/debt matrix
4. read-only 7-turn playtest reconstruction and evidence corrections
5. remaining legacy/compatibility inventory with deletion criteria
6. ranked next-Cut decision
7. recommended PR/landing strategy without performing it
8. exact proposed next implementation task scope and stop boundaries

Update `09_CURRENT_TRUTH.md` only for facts that are newly verified and truly current, especially Cut 2 Stage B live closure. Do not turn recommendations into deployed facts.

## Allowed

- Git/GitHub/source read-only inspection
- PR/ancestry read-only inspection
- TEST Supabase read-only queries, including manual playtest game
- docs-only audit/current-truth/CURRENT_TASK edits on current branch
- focused local static analysis/tests only when needed to understand current behavior; no runtime behavior changes
- Issue #68 lease and terminal report

## Forbidden

- runtime/source/test/config behavior edits
- DB write/migration/reset
- dedicated TEST gameplay writes for this checkpoint
- manual playtest mutation/reset
- API/frontend deploy
- Production access
- provider/model/config change
- retry/regeneration implementation
- parser/wire relaxation or fuzzy repair
- new semantic hard gate
- branch creation
- new PR creation
- merge / rebase / PR Ready / retarget
- Cut 3+ implementation

## Success criteria

Success means the project can answer, from current evidence rather than memory:

1. how a Company v1 turn actually flows end to end
2. which module/RPC owns every major durable gameplay fact
3. which duplicate/legacy paths still exist and why
4. what the preserved 7-turn game proves about current product failures
5. what next architecture Cut removes the highest-priority root conflict without harming player freedom
6. which obsolete paths that Cut must delete
7. whether PR lineage should be consolidated before implementation continues

On success:

- set `Status: WAITING_REVIEW`
- post COMPLETE terminal report to Issue #68 with exact final SHA and audit artifact path
- state the recommended next Cut and PR/landing recommendation
- do not start implementation
- STOP

Success phrase:

`POST-CUT2 GAME MODEL RECOVERED — NEXT ARCHITECTURE CUT RECOMMENDED, AWAITING OPERATOR REVIEW`
