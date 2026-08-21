# Company — CURRENT TASK

Status: READY
Task ID: company-full-redesign-milestone0-v1
Mode: SOURCE IMPLEMENTATION — A′ MILESTONE 0 VERTICAL SLICE
Updated: 2026-08-21
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Reuse this existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK file or an ops/task-registration branch.

## 0. Owner authorization / supersession

The previous task `company-redesign-runtime-kernel-bounded-audit-v1` is complete and terminalized in Issue #68 comment `5366175311` with `RECOMMEND_A` evidence.

The owner has now explicitly selected the A′ direction and authorized implementation of Milestone 0.

This CURRENT_TASK supersedes the prior design-only stop. Product decisions already locked in Issue #68 comment `5364770509` must not be reopened for implementation convenience.

This is the first executable Full Redesign source task.

## 1. Binding design authority

Use the following as read-only design authority. Do not require these Draft PRs to be merged before implementation.

### Product / UI canon — PR #95

PR #95 current reviewed design head at registration:

`9d9aec5a198d8673eb37aba8a0541adbd6c84627`

Binding product documents are the `docs/redesign/*` product-first authority set on that head, including:

- `00_AUTHORITY_AND_CHANGE_CONTROL.md`
- `01_PRODUCT_CONSTITUTION.md`
- `02_EXECUTABLE_ACCEPTANCE_SCENARIOS.md`
- `03_GOLDEN_UI_CONTENT_MASTER.md`
- `04_GAMEPLAY_STATE_MEMORY_MODEL.md`
- `05_ARCHITECTURE_DECISION_FRAMEWORK.md`
- `06_DESIGN_REVIEW_AND_IMPLEMENTATION_GATES.md`
- `07_CSA_MVP_CATALOG.md`
- `08_COMPANY_V1_SALVAGE_MATRIX.md`
- `09_RUNTIME_KERNEL_SOURCE_AUDIT.md`
- `README.md`

### Engine / acceptance / target matrix — PR #96

PR #96 design head at registration:

`9d44c4719fa6b098d53cac5cf946b93fafa6786b`

Binding A′ documents:

- `09_ENGINE_ARCHITECTURE_DECISION_A_PRIME.md`
- `10_TEST_AND_LIVE_ACCEPTANCE_POLICY.md`
- `11_TARGET_GAP_MATRIX_A_PRIME.md`

For product/UI/content behavior, PR #95 + latest explicit owner decisions control. For engine/testing/implementation architecture, PR #96 A′ documents control. If a real conflict is found, STOP and report the exact conflicting clauses rather than silently inventing a third design.

## 2. Product/UI donor is frozen

The forward presentation donor is the complete Company v1 snapshot:

`5ec1a76ac782d3a4fc8042f3d6a62854204b1c84`

Especially:

`src/frontend/pages/*`

Milestone 0 must transplant this presentation at high parity. The reduced `frontend-v2/` shell is explicitly NOT the forward UI target.

Binding presentation rules:

- Story is the dominant surface.
- Streaming remains visible while generation is in progress.
- No blocking loading overlay may cover the narrative.
- Keep the accepted Setup experience and canonical Company look/layout.
- Keep four natural Story-authored choices plus free-form input.
- Choice click submits the full literal action text.
- Company map presentation is retained; a map click may prefill literal input but must not become a second navigation/state writer.
- Mind Monitor presentation is retained and fed only by new observer data.
- Old browser-owned Story → Extract/Observer → Commit coordinator authority must NOT be transplanted.

## 3. Milestone 0 target composition

Build exactly this first vertical slice:

```text
Company v1 high-parity UI/content donor
+ new thin frontend controller
+ new minimal Company view model/domain
+ trimmed A′ server-owned turn kernel
+ Story LLM
+ one small post-Story Observer
+ pure minimal reducer
+ one atomic Commit
+ isolated company_r3_* persistence
```

A′ is not “continue v2”. Reuse only proven product-neutral v2 infrastructure ideas/implementation where they fit behind a small clean interface.

## 4. New isolated implementation boundary

Create new redesign implementation roots rather than mutating the old v1/v2 product layers in place.

Preferred binding roots:

- `runtime-r3/` — A′ server/domain/runtime
- `frontend-r3/` — transplanted Company presentation + thin controller

Small shared build/config helpers may live outside these roots only when necessary and must be listed in the terminal report.

Do not make `runtime-v2/` or `frontend-v2/` the product implementation target.

Historical v1/v2 source may be read/copied selectively as donor evidence, but old product/domain/orchestration authority must not leak into R3.

## 5. Canonical content and Setup

Use repository `content/*.json` as semantic authority. No shadow/demo lists.

Milestone 0 must support the accepted Company Setup/profile fields from the product canon and v1 donor, including the complete approved profile contract.

Server-side validation must be authoritative; frontend values are not trusted merely because they came from the transplanted form.

Persist canonical catalog IDs rather than duplicating labels when appropriate.

No fabricated actor/location identity and no fuzzy character substitution.

## 6. Opening

Implement a real Company Opening, not a generic work-assistant greeting.

Opening must:

- follow the accepted Product Constitution / acceptance scenarios;
- use canonical Company location and registered actors;
- establish the private `상식개변` app premise correctly;
- not imply NPCs know about the app unless the player reveals it;
- not invent an unrequested player action;
- return agency to the player;
- expose free-form input plus four natural Story-authored next actions when Story supplies them;
- remain valid even if optional observer projection is imperfect.

Opening may use the same Story → Observer pattern in opening mode.

## 7. Ordinary turn — A′ server-owned lifecycle

One player action equals one server-owned operation:

```text
literal action + action_id + expected_turn
→ load committed context
→ reserve one (game, turn) job
→ Story once, streamed immediately
→ bounded progress persistence
→ Story complete
→ Observer once
→ normalize Observer fail-open
→ pure minimal reducer
→ atomic state + turn commit
→ terminal committed context
```

The browser must not call separate Story/Observer/Commit stages.

Preserve proven infrastructure properties from the audited v2 kernel where useful:

- one job per `(game_id, turn_number)`;
- action identity;
- attempt fencing;
- stale attempt cannot commit;
- bounded Story progress snapshots, not one DB write per token;
- reconnect/readback to the same job;
- explicit retry only;
- no hidden retry-until-lucky;
- one atomic Commit boundary.

Provider/model configuration must remain the existing approved values unless a separate owner decision changes them.

## 8. Story contract

Story is the only narrative author.

Story context must include only the bounded accepted inputs needed for play:

- literal player action verbatim;
- validated player profile projection;
- current time;
- canonical current location;
- present registered actors;
- bounded `scene_note`;
- relevant actor canon/prompt cards;
- recent raw turns;
- older chronological turn summaries under a token budget.

Milestone 0 normal Story output is natural Korean player-visible narrative plus exactly four natural full next-action suggestions.

No separate choice LLM. No separate Mind Monitor LLM. No action classifier/outcome engine. No generic relationship/event/physical ontology. No automatic Story repair/regeneration loop.

If choice extraction/projection fails, valid Story remains valid; free input remains available and stale prior choices must not reappear.

## 9. One small post-Story Observer

Observer is a projection tool, never a second narrative author.

Milestone 0 observer scope is limited to the A′ accepted structural projection:

- elapsed time;
- location evidence;
- entered/exited/present registered actors;
- bounded replaceable `scene_note`;
- four choices copied/structured from completed Story when valid;
- turn summary;
- relevant Mind Monitor `{surface, subconscious}`;
- warnings;
- only the minimal clothing evidence/state required by the accepted A′ core, without implementing CSA.

High-risk mutations require finite IDs and Story evidence where specified by the A′ design.

Observer failure is fail-open:

- valid Story still commits;
- literal action still commits;
- prior structural state remains when optional projection is unavailable;
- summary may use bounded Story fallback;
- MM/choices may be absent for that turn;
- no stale choices;
- no second Story generation.

## 10. Minimal state / no speculative ontology

Initial mutable gameplay state is intentionally small:

```text
time
scene.location_id
scene.present_actor_ids
scene.scene_note
active_rules   # empty / inactive in Milestone 0
clothing       # only minimal retained structure if required by A′ core
```

Do not add in Milestone 0:

- generic posture/contact ontology;
- relationship meters/relationship engine;
- generic event ledger;
- generic action success/risk system;
- dynamic player arousal/erection/ejaculation gauge;
- supporting sexual-event-ledger gameplay state;
- generic CSA execution DSL;
- speculative memory/vector system;
- compatibility mirrors for old saves.

Memory for the first live build is only recent raw turns + older stored summaries + current `scene_note` as specified by A′.

## 11. New isolated persistence namespace

Author an additive migration for the new R3 namespace only:

- `company_r3_games`
- `company_r3_state`
- `company_r3_turn_jobs`
- `company_r3_turns`
- `company_r3_system_events`

Required ownership follows the A′ architecture:

- games: game identity, content version, validated static profile;
- state: committed turn, revision, minimal mutable state;
- turn_jobs: reservation, action/attempt fencing, progress, stage/error metadata;
- turns: literal action, raw Story, choices, summary, Mind Monitor, observer raw/applied/warnings, state_after, committed timestamp;
- system_events: reserved audit boundary for later non-Story transactions; no CSA implementation in Milestone 0.

Opening is chronological turn 0.

Historical v1/v2 tables and all existing games/data are immutable evidence. Do not backfill, migrate, reset, delete, repair or rewrite them.

This source task may AUTHOR the new migration/RPC SQL but MUST NOT APPLY it to any Supabase project.

Use least-privilege/service-role-only mutation boundaries consistent with the accepted A′ security direction.

## 12. Frontend Milestone 0

Transplant presentation from exact snapshot `5ec1a76...` at high parity, then replace authority behind it.

Required now:

- real Company shell/layout/responsive behavior;
- full accepted Setup UI;
- Story/history/current-stream presentation needed for core play;
- four-choice presentation;
- free input and submit;
- current scene/character presentation;
- Mind Monitor presentation;
- player profile/state presentation;
- Company map presentation/prefill behavior;
- non-blocking connection/stream status;
- one rebuilt tiny view model;
- one thin R3 client that loads context, submits one turn, consumes Story SSE, and renders committed context.

Do not transplant old `createTurnCoordinator()` or any browser-owned gameplay stage machine.

Excluded sidecars may retain donor presentation assets only when that preserves layout, but they must not claim working functionality.

## 13. Explicit Milestone 0 exclusions

Do NOT implement in this task:

- active CSA apply/change/remove transaction or 9-rule mechanics;
- TTS runtime/API/service binding;
- Image generation/selection/runtime;
- Feedback revision runtime/API;
- standalone NPC search;
- dynamic sexual gauges/progression;
- relationship/event engine;
- generic physical execution system;
- old 44-rule CSA semantics;
- Production routing;
- old-game compatibility/migration.

History/export polish and other sidecars are not acceptance blockers for Milestone 0 unless required for the core visible shell to remain coherent.

## 14. Tests / proof — small forward suite only

Do not spend time making the historical broad v1/v2 suite green when it protects obsolete architecture.

Create/retain only small forward-facing structural proof for Milestone 0, aligned with PR #96 `10_TEST_AND_LIVE_ACCEPTANCE_POLICY.md`:

1. canonical content + Setup validation/profile round-trip;
2. literal action + one-job/attempt fencing + atomic Commit;
3. Story streaming + bounded progress + reconnect/readback;
4. Observer fail-open + finite actor/location mutation + `scene_note` replacement + no stale choices;
5. tiny frontend proof that free input/choice click sends exact literal action and no browser Story→Observer→Commit coordinator exists.

CSA transaction test belongs to the later CSA milestone, not this task.

No raw test-count target. Old failing tests are not a reason to reintroduce obsolete architecture.

Run focused R3 tests, syntax checks, diff checks and build/dry-run checks needed to prove the source candidate is reviewable.

## 15. Source-task operational boundary

Create one implementation branch from exact current `main` at lease time.

Recommended branch:

`company-redesign/milestone0-v1`

Open one Draft PR and stop at source review.

Allowed:

- new R3 runtime/frontend source;
- small selective donor copies/ports required by this task;
- additive R3 migration/RPC source;
- minimal new R3 tests/config/build wiring;
- narrow docs needed to explain the implementation boundary.

Forbidden until a later reviewed rollout task:

- migration apply;
- TEST/Production DB write;
- Worker deploy;
- game creation/reset/gameplay;
- mutation of preserved evidence games;
- Production/hospital access;
- provider/model/config/secret change;
- merge;
- auto-merge.

PR #95 and PR #96 remain design authority/evidence; do not merge or rewrite them from this implementation task.

## 16. Review acceptance gate

Before source acceptance, operator must directly verify more than test counts:

- donor UI parity against snapshot `5ec1a76...`;
- reduced `frontend-v2/` was not used as the product shell;
- canonical Company content only, no demo/shadow semantic lists;
- full accepted Setup/profile path exists;
- real Company Opening premise;
- literal action preserved end to end;
- Story is visibly streamed and never covered by a blocking loader;
- four Story-authored choices + free input behave literally;
- one Observer only and fail-open behavior;
- one server-owned turn lifecycle;
- no browser stage coordinator;
- minimal state contains no banned speculative domains;
- `company_r3_*` is isolated and old v1/v2 data is untouched;
- excluded CSA/TTS/Image/Feedback runtime is absent.

## 17. Completion / stop boundary

Post one terminal report to Issue #68:

`COMPANY_FULL_REDESIGN_MILESTONE0_READY_FOR_SOURCE_REVIEW`

Include at minimum:

- `TASK_ID: company-full-redesign-milestone0-v1`;
- starting main SHA;
- final source SHA;
- Draft PR number;
- exact changed paths;
- exact PR #95 / PR #96 design heads consumed;
- donor snapshot SHA and transplanted frontend modules;
- R3 runtime/module inventory;
- `company_r3_*` migration/RPC inventory;
- Story/Observer/reducer/commit flow summary;
- excluded feature confirmation;
- focused test/build results;
- confirmation: migrations applied 0, DB writes 0, deploys 0, gameplay 0, preserved games mutated 0.

Then STOP at `WAITING_REVIEW`.

Do not merge, deploy, apply migration, create a game, or automatically register the rollout task.