# Company Redesign — A′ Target Gap Matrix

Status: ARCHITECTURE-TO-IMPLEMENTATION DRAFT  
Date: 2026-08-21  
Depends on: `09_ENGINE_ARCHITECTURE_DECISION_A_PRIME.md`, `10_TEST_AND_LIVE_ACCEPTANCE_POLICY.md`

This matrix is design/planning only. It does not authorize source, SQL, deploy, DB or gameplay mutations.

## 1. Classification

- `KEEP`: retain substantially as-is.
- `PORT_SMALL`: reuse a small product-neutral implementation/idea.
- `TRANSPLANT`: preserve presentation/behavior, rewire dependencies.
- `REWRITE`: replace implementation behind retained concept.
- `DELETE`: do not carry into A′.
- `DEFER_KEEP`: donor retained for later phase.

## 2. Runtime kernel

| Area | Current evidence | A′ decision | Target |
|---|---|---|---|
| Server-owned turn lifecycle | `runtime-v2/server/worker.js` | PORT_SMALL | one `/turn` request owns reserve → Story → observer → commit |
| Job reservation | v2 store/RPC | PORT_SMALL | one `(game,turn)` job |
| Attempt fencing | v2 `action_id + attempt_no` | KEEP IDEA | stale attempt cannot commit |
| Explicit retry | v2 failed-job retry | REWRITE SMALL | server stage-aware retry; no auto regeneration |
| Story progress | v2 bounded progress snapshots | KEEP IDEA | a handful of reconnect snapshots only |
| Atomic commit | v2 commit RPC | KEEP IDEA | one state+turn transaction |
| Context readback | v2 multiple REST/RPC reads | REWRITE | one bounded context/readback owner |
| v2 domain/content | demo/static product | DELETE | canonical Company content compiler |
| v2 Opening | demo/generic | DELETE | Company opening Story path |
| v2 provider prompt | demo + old semantic wire | DELETE | natural Company Story + 4 choices |
| v2 observer | minimal old shape | REWRITE | scene_note/choices/MM/summary/evidence only |
| v2 `frontend-v2` | reduced shell | DELETE AS TARGET | Company v1 UI transplant |

## 3. New persistence

| Item | Decision |
|---|---|
| historical v1 tables/data | READ-ONLY evidence |
| historical v2 tables/data | READ-ONLY evidence |
| `company_r3_games` | NEW |
| `company_r3_state` | NEW |
| `company_r3_turn_jobs` | NEW |
| `company_r3_turns` | NEW |
| `company_r3_system_events` | NEW |

No migration rewrites historical evidence games.

## 4. New state model

### Static game/profile

Keep only accepted Setup profile fields and content version.

### Mutable state

```text
time
scene.location_id
scene.present_actor_ids
scene.scene_note
active_rules
clothing
```

DELETE from new state:

- level/EXP unless separately re-approved as a real mechanic;
- dynamic erection/arousal/ejaculation fields;
- generic relation/event ledgers;
- posture/contact ontology;
- generic action outcome/risk state;
- compatibility mirrors of old saves.

## 5. Company v1 frontend salvage

| Module/surface | A′ decision | Notes |
|---|---|---|
| `src/frontend/pages/index.html` | TRANSPLANT HIGH PARITY | update obsolete CSA copy only |
| shell/panel/mobile CSS | KEEP/TRANSPLANT | remove selectors only for removed mechanics |
| `render.js` | TRANSPLANT | keep Story/dialogue/history/choice rendering; rewire data |
| Setup DOM + `setup.js` | KEEP | submit to new game API |
| `company-map.js/css` | KEEP/LIGHT REWIRE | click only prefills literal action |
| Mind Monitor presentation | TRANSPLANT | observer supplies surface/subconscious |
| `view-model.js` | REWRITE | keep one-view-model architecture, new tiny fields |
| `app.js` | DELETE CONTROLLER / SALVAGE HELPERS | no browser turn coordinator |
| `api.js` | REWRITE SMALL | one turn endpoint + context/system endpoints |
| `sse.js` | PORT_SMALL | `meta/story_delta/terminal/error` only |
| `csa-app.js` shell | TRANSPLANT | modal/tabs/forms/draft UX |
| `csa-app-state.js` | REWRITE | 9 rules, finite scope, no level/unlock |
| history/download | KEEP/LIGHT REWIRE | same product surface |
| feedback UI | DEFER_KEEP | new revision API later |
| image UI | DEFER_KEEP | sidecar later |
| `tts.js` | DEFER_KEEP/LIGHT REWIRE | speaker projection later |

## 6. Company v1 engine salvage

| Module/idea | A′ decision | Reason |
|---|---|---|
| `content/*.json` | KEEP AUTHORITY | canonical product semantics |
| `player-setup.js` validation | PORT_SMALL / near-verbatim | finite, pure, matches Setup |
| `edition.js` adapter validation | PORT_SMALL | small content boundary |
| `npc/catalog.js` | PORT_SMALL | finite catalog lookup |
| exact-name registered actor helpers | PORT_SMALL | identity safety, no fuzzy inference |
| `csa/clothing-state-mechanic.js` | PORT_SMALL | narrow exact four-slot mechanic |
| `fresh-narrative-parser.js` | DELETE | old control-marker protocol |
| `extract-prompt.js` | DELETE/REFERENCE ONLY | old broad Extract contract |
| `runtime-core/extract-observation.js` | DELETE | over-broad taxonomy/compatibility |
| `runtime-core/scene-reducer.js` | DELETE | compatibility-heavy scene model |
| old generic commit reducers | DELETE | new minimal reducer |
| old CSA planner/validator/execution stack | DELETE | 9-rule transaction replaces it |
| old gameplay-state bulk model | DELETE | new minimal state |

## 7. New core modules

Exact filenames remain implementation choice, but target responsibilities are fixed.

### `content`

Loads/validates canonical Company catalogs and active 9-rule catalog.

### `profile`

Validates Setup and builds prompt/display profile projection.

### `context`

Builds bounded Story context from profile, state, current content, recent raw turns and older summaries.

### `story-provider`

Owns one streaming Story request.

### `observer-provider`

Owns one JSON observer request after Story.

### `observer-normalizer`

Validates only finite IDs/evidence/choices/clothing and drops invalid optional projection.

### `reducer`

Purely applies time, location/presence evidence, scene_note, ordinary clothing changes and deterministic system mechanics.

### `turn-service`

Owns reserve/stream/observe/reduce/commit/retry.

### `rule-service`

Owns 9-rule non-turn apply/change/remove.

### `view-model`

Produces exactly the data needed by transplanted Company v1 UI.

No generic orchestration framework is required around these modules.

## 8. Ordinary-turn target sequence

```text
POST /game/:id/turn
  validate literal action
  read context
  reserve job
  stream Story
  persist bounded progress
  persist/mark Story complete
  observe once
  normalize fail-open
  reduce minimal state
  atomic commit
  SSE terminal with context
```

Frontend makes no `/extract` or `/commit` calls.

## 9. System API target

Initial surface should stay small:

```text
POST /games                    create/Setup
POST /games/:id/opening        Opening if not created with setup
GET  /games/:id/context        committed readback + current job
POST /games/:id/turn           ordinary turn SSE
POST /games/:id/rules          apply/change rule transaction
DELETE /games/:id/rules/:id    remove rule transaction
POST /games/:id/reset          safe new/reset behavior if retained
```

Feedback/image/TTS/history pagination endpoints are added only in their phase.

Endpoint naming may change; ownership may not.

## 10. Story/observer call budget

Normal ordinary turn:

```text
1 Story call
1 Observer call
```

Opening may use the same pair in opening mode.

No separate calls for:

- choices;
- Mind Monitor;
- turn summary;
- action classification;
- relation scoring;
- physical execution;
- memory every turn.

## 11. Memory target for first live build

No new persistence table initially.

Story context uses:

- recent 6–8 raw turns;
- older chronological stored `turn_summary` values under a token budget;
- current `scene_note`.

If long live play fails, add a periodic compactor later.

## 12. Tests to retain/create

The new required suite is the small set from `10_TEST_AND_LIVE_ACCEPTANCE_POLICY.md`:

- content/setup;
- turn fencing/atomicity;
- stream/recovery;
- observer fail-open/minimal reducer;
- CSA transaction;
- optionally one tiny frontend submission contract.

## 13. Tests to remove from forward CI

Treat the old broad suite as deletion candidates by default.

Delete/stop running tests whose purpose is old:

- orchestration stages;
- old Story wire;
- old save compatibility;
- removed mechanics;
- old 44-rule semantics;
- old v2 choice/demo contracts;
- source-text/migration regex checks;
- exact prompt snapshots;
- redundant helper coverage.

Do not preserve the prior raw test count.

## 14. Implementation order

### Cut 1 — Engine skeleton + transplanted visible shell

- create isolated A′ source directories/persistence migration;
- transplant Company v1 shell/render/setup/map at high parity;
- create thin context/turn client;
- canonical content/profile;
- server Setup + Opening;
- ordinary turn Story stream + fail-open observer + atomic Commit;
- minimal state/scene_note;
- 4 choices + free input + Mind Monitor.

Then deploy to TEST immediately and run owner Opening + 3–5 turns.

### Cut 2 — Continuity hardening from live failures

Only after Cut 1 owner acceptance:

- fix real identity/scene_note/memory/reconnect failures;
- add only the regression tests justified by those failures;
- run 10–20 turn owner play.

### Cut 3 — 9-rule CSA

- transplant/rewrite CSA app internals;
- non-turn rule transactions;
- exact 9-rule catalog + finite scope;
- four-slot clothing mechanic;
- owner tests all nine in live narrative.

### Cut 4 — Secondary sidecars

- feedback revision;
- image;
- TTS;
- history/export polish.

## 15. Explicit non-goals for first implementation

Do not implement:

- generic physical ontology;
- relationship meters;
- player sexual gauge;
- generic action success/risk system;
- generic CSA execution DSL;
- all historical CSA rules;
- standalone NPC search;
- speculative memory vector DB;
- separate choice/MM agents;
- auto-retry/repair loops;
- compatibility migration for preserved old games.

## 16. First live success definition

The first implementation is successful when the owner can open the real Company-looking UI, complete Setup, recognize the Opening, play 3–5 turns with natural streamed Story, use four choices or free text, see relevant Mind Monitor, refresh safely, and not encounter actor substitution or immediate scene reset.

That milestone outranks total automated test count.
