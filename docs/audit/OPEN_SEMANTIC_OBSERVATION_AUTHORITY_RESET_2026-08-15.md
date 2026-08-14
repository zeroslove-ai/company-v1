# Company v1 Open Semantic Observation Authority Reset Audit

Date: 2026-08-15
Task: `open-semantic-observation-authority-reset-audit`
Audit registration SHA: `6e2963285d91f3bb3d0c096a2cb3ac4f02e9c51c`
Branch: `company/scene-location-presence-v1`
Accepted gameplay executable: `1a5c5540a0235fb2e53b2452516897af7664eba1`
Current docs-only HEAD at audit start: `6e2963285d91f3bb3d0c096a2cb3ac4f02e9c51c`

This is an architecture audit only. No runtime, test, content, migration,
database, deployment, or provider change is included.

## Decision rule

Story is the narrative author. Extract is an evidence-backed observer. The
server owns identity, exact evidence, provenance, transactionality,
idempotence, replay, structural integrity, and narrow deterministic mechanics.
The server must not enumerate the universe of possible emotions, events,
relationships, physical actions, or consequences.

The four dispositions used below are exclusive:

- `STRUCTURAL_KEEP`: preserves wire/data integrity without deciding what a
  narrative fact means.
- `MECHANICAL_ISOLATE`: a finite value is retained only for a deterministic
  machine rule or presentation projection; it cannot gate open facts.
- `SEMANTIC_REMOVE`: must stop governing new semantic writes because it
  restricts narrative meaning or authors meaning on the server.
- `LEGACY_READ_ONLY`: retained only for historical rows/replay until a stated
  deletion proof exists; it cannot validate or shape new writes.

## Evidence and limits

The inventory used current Git source, all relevant tests, migration source,
the current audit/current-truth documents, and the operator's stored TEST
catalog/readback facts. The local environment has no `psql` binary or Supabase
CLI, so no new live catalog query was attempted and no credentials were
printed or altered. Live DB statements below are explicitly identified as
operator-verified records from `09_CURRENT_TRUTH.md` and
`POST_CUT2_GAME_MODEL_RECOVERY_2026-08-14.md`; migration bodies are source
evidence, not a claim that an unapplied migration is live.

The accepted executable has no source drift for this audit. The branch's
known executable delta relative to that executable is the previously reviewed
canary/test harness work in `scripts/live-playtest-canary.mjs` and
`test/live-canary-contract.test.mjs`.

## 1. Current authority trace

```text
Story prompt/provider
  -> streaming decoder
  -> fresh-narrative-parser.js / story-wire-protocol.js
  -> persisted story_text + parsed_blocks
  -> Extract prompt (fixed V2 semantic envelope)
  -> provider JSON
  -> extract-observation.js normalizer
  -> optional observation reducers
       scene-reducer
       observation-reducers
       relation-event-reducer
       sexual ledger / physical / stats / CSA reducers
  -> commit-reducer.js
  -> commit_company_turn RPC
  -> game_save / game_turns / game_actions
  -> get_company_context and history readers
  -> Story context projection / frontend view model / replay
```

Important current boundaries:

| Boundary | Current owner | Current issue |
|---|---|---|
| Story narrative | Story provider plus fresh parser | Parser framing is useful, but downstream semantic assumptions are not open. |
| Extract observation | `extract-prompt.js` plus `extract-observation.js` | The prompt and normalizer expose a closed domain/field/type envelope. |
| Scene | `save.scene` reducer/validator, with legacy mirrors | This is a legitimate routing projection; mirrors must not become a second authority. |
| Relation/Event | `relation-event-reducer.js` and event/sexual ledgers | Evidence checks are valuable, but finite meaning vocabularies decide whether facts exist. |
| Durable turn | `commit_company_turn` | Correct sole normal-turn durable boundary; it must persist open facts as well as projections. |
| Replay | persisted `story_text`, `parsed_blocks`, `extract_delta`, `game_turns` | Legacy adapters remain necessary for old rows but must not govern new writes. |
| Client | server context/history, then frontend view model | Client is a projection/cache and must never manufacture durable semantic success. |

## 2. Complete semantic-gate inventory

The table is grouped by gate family. A family row includes every literal set or
field allowlist named in the row; grouping avoids pretending that a second
spelling of the same gate is a separate authority.

| # | File/function or DB surface | Live callers/readers | Current purpose | Concrete loss or rewrite mode | Disposition |
|---:|---|---|---|---|---|
| 1 | `fresh-narrative-parser.js`, `story-wire-protocol.js` block markers | Story routes, persisted blocks, history, frontend narrative renderer | Frames scene/dialogue/thought/choice/acting blocks | Malformed framing can drop a block, but this is a wire integrity problem, not semantic vocabulary | `STRUCTURAL_KEEP` |
| 2 | Fresh dialogue `speaker_id` registration | Story route, parser, renderers | Binds visible dialogue to registered identities | Unknown speaker cannot be safely attributed | `STRUCTURAL_KEEP` |
| 3 | Exact Story quote checks in `extract-observation.js`, reducers, ledgers | Extract route and commit reducers | Proves an observed fact came from the current Story | Prevents ungrounded durable state; must not require a semantic type | `STRUCTURAL_KEEP` |
| 4 | Registered actor/target/NPC/location IDs | Extract, scene reducer, context, frontend | Identity and routing integrity | Unknown identity is rejected or ignored; this is safe and necessary | `STRUCTURAL_KEEP` |
| 5 | `scene_observation` shape and entrance/exit/presence evidence | Scene reducer and context | Maintains canonical scene/location/presence routing | A malformed scene projection may fail open or preserve prior scene | `STRUCTURAL_KEEP` |
| 6 | `readCanonicalSceneV1`, scene membership uniqueness and focal membership | Story/Extract context, workplace context, frontend | Single structured scene authority | A duplicate/missing participant can corrupt routing, not narrative meaning | `STRUCTURAL_KEEP` |
| 7 | Action identity, expected turn, owner fencing and replay CAS | Turn routes and lifecycle RPCs | Concurrency, provenance, idempotence | Stale writers or duplicate commits must fail | `STRUCTURAL_KEEP` |
| 8 | Extract top-level keys, JSON object/array/string shape, forbidden `save` patch fields | Extract route and normalizer | Keeps the LLM from directly patching durable save state | Unknown semantic fields are currently discarded because no open fact channel exists | `STRUCTURAL_KEEP` for envelope; open fact payload must be added separately |
| 9 | `commit_company_opening` four non-empty choice strings | Opening route, frontend choice UI, DB RPC | Presentation shape and stable input count | Current reducer can replace malformed provider choices with server prose | `STRUCTURAL_KEEP` for shape; fallback is row 25 |
| 10 | `commit_company_turn` structured save validation and expected-turn checks | Commit route and DB | Atomic normal-turn durable writer | Invalid save shape is rejected; semantic content should not be rejected merely for being unfamiliar | `STRUCTURAL_KEEP` |
| 11 | Event/ledger IDs, dedupe hashes, action/turn provenance | Relation/event reducer, sexual ledger, replay | Idempotence and audit identity | Duplicate facts collapse; this is safe if content is retained | `STRUCTURAL_KEEP` |
| 12 | `validate_company_save_v1`, `company_validate_scene_v1` required keys and object/array checks | Setup/opening/commit/reset DB functions | Structural save and scene integrity | Required legacy projection keys can make new facts impossible if treated as meaning authority | `STRUCTURAL_KEEP`, with semantic fields demoted to projections |
| 13 | `scene` version/location/presence fields | Scene reducer, API context, frontend map | Routing and current-scene mechanics require finite structure | An unknown narrative location must not be silently converted to a known one | `MECHANICAL_ISOLATE` |
| 14 | `csa/semantic-contract.js` action, direction, actor/target group grammar | CSA planner/validator/transaction routes | Deterministic institutional rule mechanics | Valid CSA operations need finite commands; these cannot describe all personal consequences | `MECHANICAL_ISOLATE` |
| 15 | CSA applicability/lifecycle/execution status sets | CSA reducer, context, UI | Deterministic rule state machine | Unknown state cannot safely drive the machine | `MECHANICAL_ISOLATE` |
| 16 | Mandatory enactment IDs, target scope, clothing transition metadata | Story ACTING binding, CSA commit reducer | Verifies a required mechanical action was enacted | It must not be used to reject unrelated narrative facts | `MECHANICAL_ISOLATE` |
| 17 | `csa_active` maximum slots and rule identity uniqueness | Save validator and CSA planner | Storage/resource integrity for active institutional rules | Exceeding machine capacity is a mechanic constraint | `MECHANICAL_ISOLATE` |
| 18 | Four clothing slots and states in `state/clothing.js`, Extract normalization, SQL bootstrap | Physical reducer, CSA clothing mechanics, frontend | Current machine clothing projection | Uncommon garments, accessories, partial descriptions, or unknown states disappear | `MECHANICAL_ISOLATE` for projection; remove as sole clothing memory |
| 19 | Sexual counters, deltas, ejaculation progress, erection states | Physical/sexual reducers, frontend, CSA mechanics | Bounded physiological/UI projections | Arbitrary sexual/physical facts are rejected unless mapped to a finite action/counter | `MECHANICAL_ISOLATE` |
| 20 | `sexual-state/ledger.js` action types/directions and bounded ledger length | Commit reducer and sexual presentation | Mechanical/audit projection and dedupe | A sexual fact outside the list is silently not recorded | `MECHANICAL_ISOLATE`; open fact must survive |
| 21 | Numeric stats deltas and per-turn ranges | `relationship/reducer.js`, observation reducers, UI | Optional bounded mechanics such as affinity or acceptance | A relationship consequence that is not numeric is lost if this is the only read model | `MECHANICAL_ISOLATE` |
| 22 | Elapsed-minute range and `time_advance` exception | Extract normalizer and time reducer | Clock arithmetic integrity | Unbounded provider time would corrupt turn mechanics | `MECHANICAL_ISOLATE` |
| 23 | Image selection tag allowlists and image family maps | `turn-routes.js`, image selector, frontend/media | Presentation asset matching | Unknown tag means no matching image; it must never mean the Story fact did not happen | `MECHANICAL_ISOLATE` |
| 24 | `NPC_DOMAINS` and domain field sets (`physical`, `emotion`, `relationship`, `stats`, `work`, `csa_attitude`) | Extract normalizer, observation reducers, context/UI | Defines every semantic thing Extract is allowed to observe | Unknown domain/field is dropped or hard-fails optional data | `SEMANTIC_REMOVE` |
| 25 | `PHYSICAL`, posture prompt tokens `sitting|standing`, position field shape | Extract prompt/normalizer and physical reducers | Restricts physical meaning to a few fields/tokens | Open posture/contact/body descriptions are omitted or rejected | `SEMANTIC_REMOVE` |
| 26 | Clothing slot/state allowlist as durable semantic authority | Extract prompt/normalizer and SQL bootstrap | Converts clothing meaning into four slots | Uncommon garment or nuanced state cannot persist | `SEMANTIC_REMOVE` as authority; retain row 18 projection |
| 27 | `EMOTION = {mood}` and one-string mood field | Extract prompt, reducer, frontend | Compresses emotion into one provider field | Mixed emotion, ambiguity, resentment, awkwardness, and change over time are lost | `SEMANTIC_REMOVE` |
| 28 | `RELATIONSHIP = {closeness, romance_status, current_boundary}` | Extract normalizer, relation reducer, frontend | Finite relationship memory fields | Trust repair, betrayal, uncertainty, and arbitrary interpersonal facts are not representable | `SEMANTIC_REMOVE` |
| 29 | `WORK = {task}` and fixed work semantic field | Extract normalizer, workplace context | Reduces work continuity to one task string | Workplace consequences outside task text disappear | `SEMANTIC_REMOVE` as semantic authority; keep task projection if consumed |
| 30 | `GENERAL_EVENT_TYPES` (`promise`, `refusal`, `conflict`, `intimacy`, `csa_event`, `work_event`, `secret`) | Extract normalizer, relation/event reducer, event ledger | Closed event taxonomy | A valid event not in the list is rejected or omitted before the reducer | `SEMANTIC_REMOVE` |
| 31 | `SEXUAL_ACTION_TYPES` and `STRUCTURED_SEXUAL_ACTIONS` when used to gate Extract meaning | Extract normalizer, sexual ledger, prompts | Closed sexual action taxonomy | An arbitrary observed interaction is dropped instead of remembered | `SEMANTIC_REMOVE` from open observation; retain CSA/mechanical projection |
| 32 | `RELATION_KINDS` imported from `csa/execution-policy.js` into Extract | Extract normalizer and relation-event reducer | Reuses CSA verbs as narrative relation lifecycle vocabulary | Personal relationship facts must use CSA action names or disappear | `SEMANTIC_REMOVE` from Extract authority |
| 33 | `RELATION_STATES = started|ended` as complete relation lifecycle | Extract normalizer/reducer and frontend | Only two relation transitions can be represented | Gradual, ambiguous, repaired, conflicted, or unresolved relations disappear | `SEMANTIC_REMOVE` |
| 34 | `sexual-state/validator.js` intimacy stage ladder | Sexual reducer, relationship presentation, tests | Advances a finite relationship stage from sexual events | Personal consent, affection, trust, and intimacy are conflated with a mechanical ladder | `SEMANTIC_REMOVE` as narrative authority |
| 35 | Relationship guard regexes in `relationship/guards.js` and prompt-only meaning rules | Tests and historical semantic checks; current server path does not call the regex helpers | Classifies reasons such as CSA-only or work cooperation | Meaning depends on regex vocabulary and becomes stale; no live writer authority proven | `LEGACY_READ_ONLY` until caller/dead-code proof, then delete |
| 36 | `reduceStoryChoiceProjection` deterministic fallback strings | Opening/turn routes, DB choice persistence, frontend | Invents choices when provider output is malformed | Server becomes a second narrative/decision author and can change player options | `SEMANTIC_REMOVE` |
| 37 | `scene-cast.js` regex intent classifier and high-impact intent policy | Story route before provider call | Converts free player text to a limited intent policy | Player language outside patterns can be constrained; intent is not outcome evidence | `SEMANTIC_REMOVE` as semantic authority; keep identity/safety checks |
| 38 | `extract-prompt.js` instructions to emit only canonical types/fields | Extract provider | Tells the provider to omit facts that do not fit boxes | Loss occurs before normalization and is invisible to reducers | `SEMANTIC_REMOVE` |
| 39 | `dropOptional`/soft normalization of unknown semantic observations | Extract route and degraded commit path | Keeps ordinary turns moving by dropping malformed optional domains | Fail-open is good for availability but currently destroys the fact rather than preserving it | `SEMANTIC_REMOVE` for semantic drop; retain structural fail-open behavior |
| 40 | `legacy-extract-adapter.js` finite legacy event filter | Persisted old Extract rows/history/replay | Reads old rows into current shape | It may drop fields from old data if used for new writes | `LEGACY_READ_ONLY` |
| 41 | `persisted-narrative-parser.js` and legacy narrative adapters | History/replay of old rows | Keeps historical rows renderable | Must never parse new provider output or become a second writer | `LEGACY_READ_ONLY` |
| 42 | Summary fallback/truncation and `turn_summary` compatibility behavior | Commit route, Story context, frontend | Produces/reuses short semantic memory fields | Empty or corrupted summaries create continuity loss and can overwrite richer facts | `SEMANTIC_REMOVE` as authority; raw story/facts remain authoritative |
| 43 | SQL setup catalog arrays for department, position, body type, speech style | `reserve_company_player_setup` RPC called by player setup | Validates and defines catalog membership in DB | Source catalog changes can diverge from SQL; valid setup is rejected or hardcoded IDs are accepted | `SEMANTIC_REMOVE` from DB authority |
| 44 | SQL opening arrays for heroine IDs and supporting-character limit | `company_apply_opening_scene_v1`, setup RPC | Repeats character universe in DB bootstrap | New catalog characters cannot enter opening without SQL edits | `SEMANTIC_REMOVE` from semantic authority; registered identity check remains |
| 45 | SQL initial clothing defaults | `company_apply_initial_clothing_v2`, setup/opening wrappers | Establishes turn-zero machine projection | Default slots are useful mechanics but cannot erase custom/open clothing facts | `MECHANICAL_ISOLATE` |
| 46 | Frontend display labels and sexual/image tag maps | View model/rendering only | Presentation translation and asset choice | Unknown label/tag can be visually omitted but cannot alter save | `MECHANICAL_ISOLATE` |
| 47 | Content catalogs and NPC resolver registered identities | Setup, prompt context, scene cast, display | Canonical identity/catalog membership | Duplicate IDs or unknown actors are unsafe | `STRUCTURAL_KEEP` |
| 48 | CSA transaction planner operation verbs and duplicate-target checks | App transaction route and CSA reducer | Deterministic configured rule transaction | Invalid operation could mutate the wrong rule | `MECHANICAL_ISOLATE` |
| 49 | DB `event_ledger`/`sexual_event_ledger` array shape and action identity | Save validator, context/history, replay | Storage shape and historical projection | Array shape is structural; semantic list inside it is the problem | `STRUCTURAL_KEEP` for container; remove closed content gate |
| 50 | DB role/ownership/permission and action lifecycle functions | All runtime writes | Ensures only approved RPC/commit boundaries write state | Permission failure is a safety issue, not narrative classification | `STRUCTURAL_KEEP` |

Grouped inventory totals: 15 `STRUCTURAL_KEEP` rows, 14
`MECHANICAL_ISOLATE` rows, 18 `SEMANTIC_REMOVE` rows, and 3
`LEGACY_READ_ONLY` rows. These are 50 gate families, not a test-count
target.

## 3. DB semantic-duplication table

The following is the source-to-live map. The live status comes only from the
operator-verified current-truth/audit records; the SQL body is inspected from
the repository migration package.

| DB function/constraint | Current source behavior | Current live/caller evidence | Future disposition |
|---|---|---|---|
| `reserve_company_player_setup(uuid,uuid,jsonb,jsonb)` | Validates hardcoded department, position, body type, speech style, heroine IDs, measurements, weekday, and opening plan; writes setup/player/scene projections | Called by `/api/player-setup`; live Stage B retains the named setup RPC | Keep structural/range/identity checks in RPC, remove duplicated catalog membership and consume server edition catalog through a verified contract |
| `company_apply_opening_scene_v1(jsonb)` | Hardcodes `heroine1` through `heroine5`, supporting count, opening scene structure and clothing bootstrap | Called by setup/opening wrappers; live scene Stage B behavior was operator-verified | Keep structural scene projection; remove hardcoded semantic universe after catalog-reader proof |
| `company_apply_initial_clothing_v2(jsonb)` | Fills four clothing slots while preserving existing/custom keys | Called by setup/opening wrappers and used by CSA clothing mechanics | Keep as a narrow initial/mechanical projection; never use it to discard open clothing facts |
| `commit_company_opening(uuid,uuid,text,text,jsonb)` | Requires non-empty story and exactly four non-empty choice strings | Called by `/api/opening`; Stage B named RPC remains the opening writer | Keep presentation shape and identity/idempotence checks; delete any server-authored choice fallback before this boundary |
| `commit_company_turn(uuid,uuid,int,jsonb,text,jsonb,jsonb)` | Atomic normal-turn save/turn commit, expected-turn guard, structured payload and save validation | `commit_company_turn` is the sole normal durable writer according to current truth; live Cut 1 acceptance passed | Keep as durable transaction boundary; extend/additive fact persistence only after review |
| `validate_company_save_v1(jsonb)` | Required keys, save version/edition, object/array shape, CSA capacity, choices and scene shape | Operator current truth records structural validator live; historical validator had legacy scene requirements, later scene Stage B added canonical scene | Keep structural validation; do not make fixed semantic projections a reason to reject an otherwise valid open fact |
| `company_validate_scene_v1(jsonb, boolean)` | Validates canonical scene key set, location/presence structure and nullable keys | Scene Stage A/B behavior probes and ACL facts are recorded in current truth | Keep routing integrity; no narrative event/relationship semantics here |
| `reset_company_game(uuid,text)` | Transactional reset via approved RPC | Used by operator canaries; preserved evidence is immutable | Keep structural reset and readback contract |
| `game_save` JSON keys `npc_emotion`, `npc_relationship_state`, `npc_work_state`, `npc_stats` | Fixed projection containers required by save validator and read by context/UI | Current source and live acceptance read them | Retain as projections/legacy reads; add open fact source before relaxing/removing requirements |
| `game_save` `event_ledger` and `sexual_event_ledger` | Array containers with typed entries and capped/deduped projections | Current context/history/readers consume these; previous live evidence found empty consequences | Retain as projections/read compatibility; open fact persistence must be independent |
| `game_actions` status/owner/error fields | Lifecycle status, fencing, replay and failure diagnostics | Cut 1 Stage A/B is live and independently verified | Structural keep; no semantic taxonomy belongs in action lifecycle |
| Table RLS/direct DML grants | Stage B revoked service-role raw gameplay DML and retained approved RPC execution | Operator confirmed raw UPDATE `42501`, approved RPC success, legacy duplicate writers removed | Structural keep; do not weaken to support semantic redesign |

No historical migration is edited in this audit. Any catalog/fact schema
change is a future additive migration only.

## 4. Choice path audit

The current choice path has one intended author and one unintended author:

1. `story-prompt.js` and `opening-prompt.js` request four literal provider
   choices.
2. `fresh-narrative-parser.js` extracts `[CHOICE]` blocks and preserves source
   order. It does not need to understand what a choice means.
3. `turn-routes.js` calls `reduceStoryChoiceProjection` for opening and turn
   persistence.
4. `reduceStoryChoiceProjection(... allowDeterministicFallback: true)` can
   append `DETERMINISTIC_CHOICE_FALLBACKS` and return four server-authored
   strings when provider choices are absent, duplicated, or malformed.
5. `commit_company_opening` and turn commit validate the resulting array shape.
6. Frontend `app.js` renders the persisted choices and submits the exact
   selected string; free text remains available.

Target: retain exactly four literal provider strings as a presentation shape,
remove server-authored alternatives, and treat a malformed footer as a
presentation warning rather than an excuse to invent a new player decision.
The DB should preserve the raw Story and parsed choice blocks; no choice type,
semantic metadata, or choice-derived outcome should be added.

## 5. Before/after authority map

| Domain | Current authority | Current secondary/closed semantic surface | Target authority |
|---|---|---|---|
| Open event/fact | Typed `events.general/sexual` and ledgers | Fixed event/action type sets | Extract-authored exact-evidence open observations; optional mechanics are projections |
| Relation | Relation reducer using CSA `RELATION_KINDS` | Engine enactments and fixed lifecycle states | Open relationship facts plus narrow numeric/mechanical projections; one reducer/writer |
| Emotion | `npc_emotion.mood` | One mood field and prompt rules | Open evidence-backed emotional facts and summaries; mood is optional projection |
| Work | `npc_work_state.task` | Fixed task-shaped observation | Open work facts plus task projection where consumed |
| Physical | Physical reducer and `player/npc_scene_state` | Posture token, four clothing slots, evidence paths | Open physical facts with exact quotes; scene/routing and CSA projections remain structured |
| Clothing | Four-slot projection and SQL bootstrap | Four slots treated as complete representation | Preserve arbitrary clothing facts; four slots only for mechanics/UI |
| Sexual/physiological | Counters, erection, sexual ledger | Closed action list and intimacy stage ladder | Open physical/sexual facts; bounded counters only where deterministic mechanics consume them |
| Choices | Provider/parser plus server fallback | `DETERMINISTIC_CHOICE_FALLBACKS` | Story provider is sole choice-text author; four literal strings |
| Summary/memory | `turn_summary`, recent/overall strings, raw recent turns | Empty/stale/corrupted summary behavior | Durable open facts feed recent context and rolling semantic summaries |
| CSA mechanics | Edition/catalog/planner/enactment/commit | Relation vocabulary reused by Extract | Finite CSA command grammar isolated from personal narrative semantics |
| Media | Image/TTS selectors | Tag allowlists | Presentation-only projections; failure cannot erase facts |
| Scene/location/presence | `save.scene` and scene validator | Legacy mirrors | Keep canonical structured routing state; mirrors read-only then delete after proof |

## 6. Proposed open observation schema

This is a design proposal, not a schema change in this task. It deliberately
has no required semantic `type` enum and no `other` enum value.

```json
{
  "fact_id": "server-generated stable id",
  "action_id": "uuid",
  "turn": 8,
  "subject_id": "heroine4",
  "participant_ids": ["player-1", "heroine4"],
  "fact_text": "한리브는 사과를 받아들이면서도 다음 회의 준비를 함께하자는 제안을 아직 확정하지 않았다.",
  "evidence_quotes": ["exact contiguous Story substring"],
  "status": "active",
  "supersedes_fact_id": null,
  "resolved_by_fact_id": null,
  "labels": ["provider-authored optional labels"],
  "provenance": { "source": "extract", "story_hash": "..." }
}
```

`status`, linkage, identity, action/turn, quote containment, and source are
structural/provenance fields. `fact_text` is free semantic text authored by
Extract from Story evidence. `labels` are optional and never gate persistence,
routing, or durability. Subject and participants are registered IDs where an
identity is asserted; an observation may still be a global/story fact without
forcing an invented participant.

Examples the current boxes lose but the proposal preserves:

| Narrative fact | Required evidence-backed `fact_text` example |
|---|---|
| Apology accepted/rejected ambiguously | `상대는 사과를 들었지만 받아들였는지 거절했는지는 아직 분명하지 않다.` |
| Promise | `두 사람은 다음 회의 준비를 함께하기로 약속하는 방향으로 대화를 마쳤다.` |
| Betrayal | `그녀는 약속된 자료가 공유되었다는 사실을 알고 신뢰가 깨졌다고 느꼈다.` |
| Trust repair | `플레이어가 누락을 인정하고 수정 계획을 설명하자 관계의 긴장이 일부 풀렸다.` |
| Resentment | `그녀는 겉으로는 업무를 이어갔지만 이전 일에 대한 서운함을 남겼다.` |
| Awkwardness / mixed emotion | `고마움과 불편함이 동시에 드러나 대화가 잠시 어색해졌다.` |
| Arbitrary posture/contact | `그녀는 창가에 기대 팔짱을 낀 채 플레이어와 거리를 유지했다.` |
| Uncommon clothing/accessory | `그녀는 사원증 고리에 작은 은색 장식을 달고 있었다.` |
| Unlisted sexual/physical interaction | `그녀가 플레이어의 손을 잠시 잡았다가 조심스럽게 놓았다.` |

These examples are not automatic state changes. The quote must be contiguous in
Story, identities must be registered when asserted, and the server records the
observation as an observation. A narrow mechanical projection may be absent
without deleting the open fact.

## 7. Persistence and read model

The open fact model must be consumed, not become a write-only ledger.

1. Story persists raw text and parsed blocks before Extract.
2. Extract returns a list of exact-evidence observations. Normalization checks
   object shape, identity, quote containment, action/turn provenance, and
   dedupe identity. It does not check whether the fact belongs to an enum.
3. Commit writes the observation list atomically with the turn through the
   sole durable commit boundary. A future additive `open_observations` field
   or table may coexist with old projections during rollout.
4. `get_company_context` returns a bounded recent fact window plus deterministic
   mechanical projections. History/replay reads the persisted fact list and
   the raw Story; it does not reconstruct facts from current prompt wording.
5. Story context assembly consumes recent open facts for the relevant
   participants and scene, followed by a rolling semantic summary generated
   from persisted facts/Story. The summary is a projection/cache, never the
   sole authority.
6. A compaction job or commit-time summarizer may create a new summary only
   with server provenance and source fact IDs. A failed summary leaves facts
   intact and does not fail the ordinary turn.
7. Frontend displays facts/projections but cannot create durable observations.

Acceptance must demonstrate: a fact that has no mechanical projection is
present after commit, is present after context refresh, is present in history
replay, and is included in the next Story context or its source-linked summary.

## 8. Migration and compatibility strategy

- Historical applied migrations remain immutable.
- First implementation should add an additive fact container or table and a
  named commit payload, without removing old JSON projection fields.
- During a bounded compatibility window, old projections may be dual-written
  only when a proven mechanical projection applies. The open fact remains the
  source of meaning; a failed projection never deletes it.
- Old `event_ledger`, relation, sexual, emotion, clothing, and summary fields
  remain readable for historical rows. `legacy-extract-adapter.js` and
  `persisted-narrative-parser.js` remain read-only adapters.
- New Extract output must not pass through legacy adapters or old semantic
  filters.
- Delete `GENERAL_EVENT_TYPES`, `SEXUAL_ACTION_TYPES` as open-observation
  gates, the Extract import of CSA `RELATION_KINDS`, and deterministic choice
  fallback only after the new open observation writer and readback canary pass.
- Delete SQL catalog duplication only after setup/opening caller inventory,
  edition-catalog parity tests, and a TEST setup/opening canary prove the
  source catalog is authoritative.
- Delete legacy projection fields only after no current context/history/UI
  reader consumes them and a historical replay sample remains readable.

## 9. Implementation sequence after review

### Cut A — open observation envelope (recommended first)

`KEEP`: exact Story quote, registered IDs, action/turn provenance,
commit/replay CAS, scene structural contract, `commit_company_turn`.

`REWRITE`: `extract-observation.js`, `extract-prompt.js`,
`extract-observation-contract.test.mjs`, relation/event contract tests, and
turn replay tests to accept evidence-backed free semantic text without a type
enum.

`DELETE`: new-write dependence on `GENERAL_EVENT_TYPES`,
`SEXUAL_ACTION_TYPES`, `RELATION_KINDS`, and semantic field allowlists that
discard unknown meaning. Do not delete old readers yet.

Migration boundary: one additive fact storage field/table plus owned commit
payload. Live acceptance must prove a non-projectable fact survives commit,
refresh, history, and next Story context. No deployment is part of this audit.

### Cut B — one open-fact durable writer and context reader

`KEEP`: `commit_company_turn`, action fencing, exact evidence, scene and CSA
mechanical reducers.

`REWRITE`: `observation-reducers.js`, `commit-reducer.js`, context projection,
history and Story context assembly.

`DELETE`: duplicate relation/event semantic writers and any reducer that
silently drops a valid open fact because no projection exists.

Migration boundary: additive writer/read model. Acceptance includes replay,
duplicate idempotence, old-owner fencing, and no fact loss when a projection is
unknown.

### Cut C — isolate mechanical projections

`KEEP`: scene routing, CSA enactment grammar, bounded counters, image/TTS
selection, clothing/sexual machine slots where a current product rule uses
them.

`REWRITE`: physical, clothing, sexual, relationship, emotion, and work
reducers so they emit optional projections from open facts rather than gate
the fact.

`DELETE`: intimacy-stage advancement as the narrative relationship authority,
regex semantic guards in the new write path, and Extract use of CSA action
names as personal relation types.

Migration boundary: additive projection provenance/backfill only if required;
no historical migration edits. Acceptance must show uncommon physical,
clothing, sexual, emotional, and relationship facts remain readable without a
matching machine projection.

### Cut D — choice and parser authority cleanup

`KEEP`: one fresh parser, block framing, speaker identity, four literal choice
shape, raw Story preservation.

`REWRITE`: choice tests and opening/turn projection to preserve provider text
and fail open without inventing alternatives.

`DELETE`: deterministic server-authored choice fallback and stale semantic
choice metadata. Keep free typed input.

Migration boundary: none unless stored choice metadata is proven durable and
requires additive cleanup. Acceptance compares provider text, persisted text,
UI display, and submitted value.

### Cut E — remove SQL semantic duplication

`KEEP`: RPC transactionality, identity, ranges, structural scene/save checks.

`REWRITE`: setup/opening RPC inputs to use the edition/catalog authority and
structural validators only.

`DELETE`: hardcoded department/position/body/speech/heroine semantic arrays
after caller/catalog proof; retain compatibility readers for historical saves.

Migration boundary: additive RPC replacement/privilege changes only; apply
only after source/DB contract gate and isolated TEST setup/opening acceptance.

### Cut F — memory/summary integration and legacy deletion

`KEEP`: raw Story, parsed blocks, open facts, provenance, replay.

`REWRITE`: summary generation/context window to consume facts and source IDs.

`DELETE`: summary-only authority, stale fallback/truncation semantic writers,
and legacy adapters after historical replay proof.

Migration boundary: additive summary/fact indexes if necessary. Acceptance
requires refresh, multi-turn continuity, replay, and old-row compatibility.

## 10. Test reset plan

The current suite should be reset around authority, not count. The following
is the required disposition map for the current families.

| Test family | Disposition | Action |
|---|---|---|
| `authority-action-lifecycle.test.mjs` | `KEEP` / `REWRITE` | Keep CAS, fencing, replay and catalog-gate behavior; remove SQL/source-string assertions. |
| `db-contract-gate.test.mjs` | `KEEP` | Keep catalog behavior and Stage A/B contract semantics; no SQL body regex. |
| `extract-observation-contract.test.mjs` | `REWRITE` | Keep quote/identity/shape tests; replace finite event/relation/clothing rejection tests with open-fact preservation and mechanical projection tests. |
| `relation-authority-contract.test.mjs` | `REWRITE` | Prove one writer, exact evidence, arbitrary fact persistence, and no player-input success. |
| `relation-interaction-contract.test.mjs` | `REWRITE` | Remove closed `RELATION_KINDS` as universal truth; keep engine-vs-observation precedence. |
| `sexual-state` tests | `REWRITE` | Keep bounded counters and safety/provenance; remove intimacy ladder as human relationship authority. |
| `csa-definition-contract.test.mjs`, `csa-enactment-contract.test.mjs`, `csa-runtime-contract.test.mjs` | `KEEP` | They prove deterministic CSA mechanics, not the narrative universe. |
| `scene-runtime-contract.test.mjs` | `KEEP` / `REWRITE` | Keep canonical scene, location, presence and recovery; mark legacy hydration expectations as temporary. |
| setup/opening tests | `REWRITE` | Keep server validation, reservation/idempotence, exactly-four shape, raw Story and replay; delete fallback-authoring expectations. |
| narrative protocol/parser tests | `KEEP` / `REWRITE` | Keep framing/speaker/ACTING/THOUGHT; delete semantic regex inference and exact prose snapshots. |
| `turn-pipeline-replay.test.mjs`, `turn-transaction-replay.test.mjs` | `KEEP` / `REWRITE` | Keep atomic commit, expected turn, replay invariance; add open fact readback. |
| `frontend-projection.test.mjs` | `KEEP` / `REWRITE` | Keep server context winning refresh/recovery; remove fixed semantic labels as authority. |
| media/TTS tests | `KEEP` | Presentation failure must not control durability. |
| content catalog tests | `KEEP` / `REWRITE` | Keep identity/catalog uniqueness; remove tests that make SQL copies canonical. |
| source/SQL regex, exact prompt prose, dead-return, filename/phase tests | `DELETE` | They do not prove current observable behavior. |
| legacy adapter tests | `LEGACY_READ_ONLY` | Keep only with a stored-row/replay fixture proving current reader need. |
| live canary contract tests | `KEEP` | Test guards and report/failure preservation only; never invoke live TEST from `npm test`. |

## 11. Risk analysis

Real integrity/safety risks that remain structural:

- accepting an unregistered identity;
- accepting a quote not present in the current Story;
- allowing a stale/duplicate owner to write;
- bypassing expected-turn or transaction/replay identity;
- allowing LLM output to patch arbitrary save keys;
- letting a semantic projection overwrite a stronger engine/CSA rule;
- letting media/UI/client state become durable state.

These are addressed by registered IDs, exact contiguous evidence, server
action/turn provenance, fenced named RPCs, one commit boundary, structural
save/scene validation, and explicit engine precedence.

Obsolete semantic restrictions include finite event/relation/action lists,
one-word emotion fields, four clothing slots as complete reality, posture
tokens as the only physical description, intimacy ladders as relationship
truth, and server-authored choice fallback. They reduce hallucination only by
deleting meaning. Exact evidence and identity validation can reject invented
facts without rejecting facts merely because their semantic wording is new.

Open facts still require observation; player intent alone never creates a
successful fact. An uncertain or contradictory observation can remain an
evidence-backed fact with uncertainty expressed in `fact_text`; it does not
become a mechanical state change without the relevant deterministic proof.
CSA compliance must remain separate from consent, affection, comfort, trust,
emotion, and relationship sentiment.

## 12. Recommended immediate first implementation cut

After owner review, implement **Cut A — open observation envelope**:

1. Add the smallest additive fact payload/storage boundary.
2. Remove semantic type/field rejection from new Extract writes while keeping
   shape, identity, quote, provenance, size, and replay checks.
3. Keep current mechanical projections as optional consumers; unknown
   projections warn/fail open without deleting the fact.
4. Add behavioral tests for arbitrary evidenced facts, unknown optional
   projections, duplicate/replay identity, exact quote rejection, registered
   identity rejection, and player-intent-only rejection.
5. Run a dedicated TEST canary only after source/DB contract review.

Do not implement this cut in the current audit. The operator must approve the
authority redesign and migration boundary first.

## Audit conclusion

The current system has strong action/turn/scene structural boundaries, but its
Extract and persistence path makes finite semantic lists the gate for what can
exist. CSA mechanics, scene routing, counters, and media selectors can remain
finite when isolated as projections. They cannot be the only durable record of
an open-ended Story. The next implementation must delete semantic authority,
not add a larger taxonomy.

This audit is complete for operator review. No executable changes are
authorized or included.
