# Company v2 — CURRENT TASK

Status: WAITING_REVIEW
Task ID: company-v2-phase1-clean-vertical-slice-v1
Updated: 2026-08-19
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole execution authority for this task branch.

## 0. Owner decision / supersession

Binding canon:

`docs/COMPANY_V2_CLEAN_RUNTIME_CANON_2026-08-19.md`

This task supersedes the old-runtime repair task `live-7turn-runtime-collapse-v1` after owner abort comment `5338511826`.

The old failed owner game `df3045fd-c359-4cdc-8783-357ddfebe398` and every prior manual/QA/evidence game are READ-ONLY. Never mutate/reset/reseed/replay/revise them.

Old PR #82 is closed and historical. Do not reopen or merge it.

## 1. Frozen branch identity

Repository: `zeroslove-ai/company-v1`

Required base main:

`be9b76d097e8f4e4286194610e3f94f431d2a3c7`

Expected branch:

`company-v2/phase1-clean-vertical-slice-v1`

Before implementation:

1. fresh-fetch `main` and require exact base above;
2. verify this branch is exactly one docs-only CURRENT_TASK registration commit ahead of that base;
3. read `CURRENT_TRUTH.md` and the 2026-08-19 Clean Runtime Canon;
4. verify no old-runtime repair lease/branch is being merged into this branch;
5. if main/source drifts materially, STOP `BLOCKED_COMPANY_V2_PHASE1_BASE_DRIFT` rather than rebasing or importing old repair work.

## 2. Clean-room import boundary

Create a physically separate implementation tree. Preferred shape:

```text
runtime-v2/
  server/
  domain/
  prompts/
  db/
  tests/
frontend-v2/
```

Exact internal names may be adjusted once if repository tooling requires it.

Hard rule:

- new v2 gameplay runtime MUST NOT import `src/engine`, old `runtime-core`, old Extract normalizers/adapters, old reducers, or old frontend turn orchestration;
- it MAY read/copy static Company content/catalog definitions through a deliberately small content adapter;
- it MAY use proven generic infrastructure utilities only if they carry no gameplay semantics or old workflow state;
- add an automated import-boundary test/grep proving the v2 tree is isolated from old gameplay-engine modules.

Do not begin by copying the old runtime and deleting pieces.

## 3. Phase 1 product goal

Build only enough for the owner to play **five natural turns** in a separate v2 TEST runtime after the next rollout task.

Phase 1 includes:

1. new v2 game/state/turn-job/turn-history persistence source;
2. minimal v2 setup/fixture creation path;
3. minimal v2 opening that produces a playable opening plus exactly four literal choices;
4. one server-owned streaming turn operation;
5. literal action round-trip;
6. one Story call;
7. one small typed post-Story observation call;
8. minimal scene/time state;
9. durable non-empty summary;
10. relevant-only Mind Monitor in the same observation call;
11. committed choices/history/readback;
12. refresh/reconnect to the SAME server turn job;
13. no automatic LLM retry/regeneration.

Do NOT add Phase 2/3 mechanics just because old code already has them.

Deferred in this task:

- CSA apply behavior;
- four-slot clothing;
- player sexual meter;
- feedback revision;
- image/TTS integration;
- relationship/event/emotion/open-fact state;
- generalized physical state;
- v1 game/save/history migration;
- old replay compatibility.

## 4. New mutable persistence source

Create additive migration SOURCE only for isolated v2 tables/RPCs. Do not apply it live in this task.

Target semantics:

### `company_v2_games`

At minimum:

- `game_id uuid primary key`
- content/static identity/version
- created timestamp

### `company_v2_state`

Exactly one mutable state row per v2 game:

- `game_id`
- `revision`
- `committed_turn`
- `state jsonb`
- timestamps

Initial state must stay minimal:

```json
{
  "player":{"id":"player-1","name":"...","level":7,"exp":0},
  "time":{"day":1,"minute":540},
  "scene":{"location_id":"...","present_npc_ids":[]}
}
```

No relationship/event/emotion/physical ledgers in Phase 1.

### `company_v2_turn_jobs`

One canonical row per `game_id + turn_number`.

Required semantics:

- unique game + turn;
- `action_id`;
- literal action;
- `status=processing|committed|failed`;
- accumulated Story text as needed for reconnect;
- error code;
- attempt counter/identity only if needed for EXPLICIT resubmission after terminal failure;
- timestamps.

A concurrent request for the same in-flight turn MUST reconnect/return the same job or deterministic conflict. It must never create a second non-terminal row.

No automatic retry. After terminal failed state, a new explicit owner submission may begin a new attempt only through one explicit v2 rule.

### `company_v2_turns`

One committed row per turn:

- literal action;
- canonical Story text/blocks;
- exactly four choices;
- summary;
- Mind Monitor;
- committed timestamp;
- minimal state result/delta only as needed.

No old revision compatibility in Phase 1.

### Security

Any privileged RPC must be structural only, fixed `search_path`, least privilege/service role as appropriate, and validate expected revision/turn identity. Do not duplicate Company semantic catalogs into SQL.

## 5. One server-owned fresh turn operation

Implement a new v2 route/operation, preferably `/api/v2/turn`.

It owns this sequence server-side:

1. load committed v2 state;
2. verify expected turn;
3. reserve/reconnect unique turn job;
4. build minimal Story context;
5. call Story exactly once;
6. stream Story deltas to client while accumulating server-side;
7. canonicalize structural Story blocks;
8. call one small post-Story observation exactly once;
9. reduce minimal scene/time state;
10. persist v2 state + v2 committed turn + terminal job state through one authoritative commit boundary;
11. return terminal committed state.

The browser must NOT call Story/Extract/Commit as separate authoritative stages.

Story failure -> job terminal `failed`; no observation and no commit.

Optional observation failure -> valid Story may still commit with safe minimal state and deterministic summary fallback.

## 6. Minimal Story contract

Reuse Company character/location content through a clean static-content adapter only.

Story receives:

- exact literal action;
- current time;
- current location;
- current present actors;
- relevant compact character canon;
- recent committed Story;
- older summaries.

It does not receive old workflow/semantic state.

Use minimal control syntax. Do not expose scene IDs as marker attributes. Unsupported OOC/self-repair/control chatter must not become canonical display blocks.

Exactly four provider-authored choices are required for a committed playable turn/opening. Do not add semantic server-authored fallback choices in v2 Phase 1; if provider output cannot produce a valid playable turn, terminalize the job as failed and preserve literal input for explicit retry.

## 7. Typed observation — no save paths

Create a new v2 observation contract. Do not reuse the old Extract V2 schema.

Phase 1 observation should contain only:

```json
{
  "elapsed_minutes":3,
  "scene":{
    "location_id":null,
    "entered":[],
    "exited":[]
  },
  "turn_summary":"...",
  "mind_monitor":{}
}
```

For scene actor changes, use typed `{actor_id, quote}` evidence objects, not string save paths.

Player and NPC ID sets are disjoint. Exact registered IDs only. No fuzzy aliases.

Mind Monitor:

- same observation call;
- presentation only;
- relevant targets only: direct interaction/actual local speakers/exact structurally known target;
- no evidence quote requirement;
- missing MM is fail-open.

## 8. Summary guarantee

A non-empty committed Story MUST persist a non-empty `turn_summary`.

If observation returns blank/missing summary, persist a deterministic bounded excerpt from canonical Story as the summary in the same commit.

No second summarizer and no retry for summary.

## 9. Frontend v2 — no old turn state machine

Create a minimal separate `frontend-v2` path/shell sufficient for Phase 1 manual play.

It may reuse presentation components/styles if they do not import old gameplay orchestration.

Fresh v2 client responsibilities only:

- display committed context/history;
- submit literal action to ONE v2 turn endpoint;
- render streamed Story deltas;
- render terminal choices/summary/MM;
- remember minimal reconnect identity if needed;
- on refresh, ask server for v2 context/job status and reconnect/readback the same job.

Forbidden:

- client `step=story|extract|commit` authority;
- client calls to old `/api/story`, `/api/extract`, `/api/commit` for v2 play;
- automatic retry/regeneration;
- client-created replacement action for same turn;
- full-screen blocking loader over Story streaming.

## 10. Required tests — small invariant suite

Do not port the old full gameplay suite.

Add compact v2 tests proving at minimum:

1. v2 tree cannot import old gameplay engine modules;
2. fixture/opening is playable and stores exactly four literal choices;
3. one client submission reaches one server-owned turn operation;
4. literal input arrives unchanged at Story and committed history;
5. Story streams before terminal commit;
6. two concurrent same-turn requests cannot create two jobs;
7. reconnect returns/observes the same in-flight job;
8. Story failure terminalizes without auto retry;
9. optional observation failure can still commit valid Story with safe state;
10. non-empty Story commits non-empty summary via provider or bounded fallback;
11. Mind Monitor targets only relevant actors and failure is fail-open;
12. player ID cannot be interpreted as an NPC ID;
13. malformed/OOC control garbage is absent from canonical display blocks;
14. committed readback/history survives a simulated refresh;
15. no Phase 2/3 state fields or old compatibility dependencies are introduced.

Run the v2 focused suite plus only repository-global tests necessary to prove the new isolated code does not break build/tooling. Do not modify v2 architecture merely to satisfy stale old-runtime behavior tests.

## 11. Allowed change scope

Expected additions/changes:

- new `runtime-v2/**`;
- new `frontend-v2/**`;
- one additive v2 migration source under existing migration conventions;
- minimal package/build/CI/wrangler wiring needed for isolated v2 source/test build;
- static content adapter that reads existing Company content without importing old gameplay engine;
- `docs/ops/CURRENT_TASK.md` lifecycle update.

Old gameplay runtime source under `src/engine/**` should remain untouched unless a tiny non-semantic static-content export is absolutely required. Prefer a new adapter over editing old engine files.

If implementation requires modifying old gameplay semantics, STOP `BLOCKED_COMPANY_V2_CLEAN_BOUNDARY`.

## 12. No live rollout in this source task

This task is source/test/PR only.

Do NOT:

- apply v2 migration to TEST;
- deploy v2 Workers;
- create v2 live games;
- perform gameplay calls;
- mutate any v1 game/table/data;
- access Production/hospital-v2;
- change provider/model;
- merge the PR.

## 13. Terminal

When Phase 1 source implementation is coherent:

1. open exactly one Draft PR to `main`;
2. require exact-head CI for the new v2 focused/build suite;
3. record exact changed paths and migration source;
4. prove import isolation and no old-runtime semantic edits;
5. set branch CURRENT_TASK to `WAITING_REVIEW`;
6. post one Issue #68 terminal `COMPANY_V2_PHASE1_VERTICAL_SLICE_READY_FOR_REVIEW`;
7. STOP.

The next owner-reviewed task will decide merge + TEST migration/deploy + one fresh v2 game handoff for **user 5-turn manual acceptance**. No automated long gameplay before that.

## 14. Implementation handoff

Implementation source is complete at:

`f49098efdf0bdf9abfe77a39d6807a4542437f0f`

Workflow HEAD will be a docs-only descendant after this lifecycle update.

Changed source paths:

- `runtime-v2/domain/content.js`
- `runtime-v2/domain/contracts.js`
- `runtime-v2/domain/story.js`
- `runtime-v2/server/http.js`
- `runtime-v2/server/index.js`
- `runtime-v2/server/provider.js`
- `runtime-v2/server/store.js`
- `runtime-v2/server/worker.js`
- `frontend-v2/index.html`
- `frontend-v2/app.js`
- `frontend-v2/styles.css`
- `supabase/migrations/20260819000200_company_v2_phase1_vertical_slice.sql` (source only; not applied)
- `test/company-v2-phase1.test.mjs`

Validation before review:

- v2 focused suite: 18 passed / 0 failed
- full `npm.cmd test`: 387 passed / 0 failed / 0 skipped
- every new JavaScript file passed `node --check`
- `git diff --check`: passed
- import-boundary and v2 persistence/frontend contract assertions: passed
- no TEST migration, deployment, live v2 game, Production access, provider/model change, preserved-game mutation, or merge

Required next step: exact-head CI for the implementation source, then owner review. This branch is not merged and must not be deployed by this task.
