# Company Redesign — Engine Architecture Decision A′

Status: ARCHITECTURE AUDIT RESULT / OWNER REVIEW  
Date: 2026-08-21  
Working branch: `company-redesign/engine-a-prime-final`

## 1. Decision

Select **A′ — trimmed v2 server kernel + Company v1 product salvage + new minimal Company domain** as the forward engine design.

A′ is **not** “continue v2”. It deliberately keeps only the product-neutral transport/concurrency lessons from v2 and rejects the v2 demo product layer.

The complete composition is:

```text
Company v1 high-parity UI/content donor
+ new thin frontend controller
+ new minimal Company view model/domain
+ trimmed server-owned A′ turn kernel
+ Story LLM + one post-Story observer
+ isolated new persistence namespace
```

Hospital remains a **play-feel/prompt reference only**, especially for natural Story + four Story-authored choices. It is not the runtime base.

## 2. Why A′ wins

### Candidate A evidence worth keeping

The current v2 source already proves a small set of hard infrastructure ideas:

- one server route can own the complete ordinary turn;
- one `(game, turn)` job reserves work;
- `action_id + attempt_no` fencing prevents stale attempts from committing;
- Story deltas stream immediately;
- partial Story progress can be persisted for reconnect;
- observer failure can be fail-open while valid Story survives;
- one atomic DB commit advances the canonical turn/state;
- explicit retry exists instead of automatic regenerate-until-lucky.

These solve failures that are expensive to rediscover.

### Why not reuse current v2 product/domain

Current v2 domain/provider/frontend were built around a reduced/demo contract and are not Company product authority. They must be replaced.

### Why not Candidate B as runtime base

Hospital is useful as evidence for play feel, four-choice narration, prompt shape and interaction rhythm. Reusing its full runtime risks importing unrelated semantic domains and duplicates concurrency/streaming work already solved more cleanly in v2.

### Why not Candidate C

A new runtime would mostly rewrite the same reservation/fencing/SSE/atomic-commit mechanics. That adds risk without improving the player-facing product.

## 3. Exact v2 kernel salvage boundary

### KEEP / PORT SMALL

From `runtime-v2/server/*` preserve the ideas, not necessarily filenames:

- one server-owned `/turn` lifecycle;
- job reservation keyed by `(game_id, turn_number)`;
- action identity;
- attempt fencing;
- explicit stale-job timeout;
- bounded partial Story progress snapshots;
- atomic commit RPC;
- explicit failed-attempt retry;
- SSE transport framing;
- service-role-only persistence authority.

### REWRITE

- route/version naming;
- product context loading;
- initial profile/state;
- Opening;
- Story prompt/provider messages;
- Story parsing/projection;
- observer schema;
- reducer;
- context response shape;
- memory projection;
- CSA commands;
- feedback revision;
- frontend API controller.

### DELETE / DO NOT PORT

- demo NPC/location lists;
- demo Opening prose;
- `[NARRATIVE]/[DIALOGUE]/[THOUGHT]` protocol as canonical Story authority;
- v2 empty-choice assumptions;
- product meaning encoded in transport/kernel tests;
- compatibility logic that exists only for failed v1/v2 state shapes.

## 4. v1 server-side salvage boundary

Company v1 is not wholesale discarded.

### KEEP or copy nearly verbatim

- canonical `content/*.json` semantic catalogs;
- server-side Setup validation/range checks from `src/engine/player-setup.js`;
- canonical catalog-name resolution helpers;
- small content adapter validation ideas from `src/engine/edition.js`;
- exact four-slot clothing mechanic mappings needed by the retained 9-rule MVP;
- small exact-name / registered-ID resolution helpers when they do not infer gameplay meaning;
- media/TTS contract helpers later when the sidecars are re-enabled.

### REJECT as engine base

Do not port the old large runtime semantic stack:

- `runtime-core/extract-observation.js` generic observation taxonomy;
- `runtime-core/scene-reducer.js` compatibility-heavy scene state;
- generic action/outcome authority;
- old physical/posture/contact ontology;
- relation/event/sexual ledgers;
- old Story control-marker protocol;
- old CSA transaction planner/execution DSL;
- browser-owned Story → Extract → Commit coordinator.

Useful individual ideas may be rewritten narrowly after a concrete acceptance failure, but these modules do not survive as architecture.

## 5. New ordinary-turn lifecycle

One player action equals one server-owned operation.

```text
1. Browser submits literal action + action_id + expected_turn
2. Server loads committed context
3. Server reserves one turn job
4. Story LLM streams natural Korean Story to browser
5. Server persists a few bounded progress snapshots
6. Story completes
7. One small observer reads completed Story once
8. Pure reducer applies only accepted structural fields
9. One atomic DB transaction commits Story + state + turn record
10. terminal event returns committed context
11. Frontend rebuilds one view model and renders
```

The browser never invokes Story, Extract and Commit as separate stages.

## 6. Story is the narrative authority

Story receives:

- literal player action unchanged;
- relevant player profile projection;
- current time;
- current registered location;
- current present registered actors;
- current bounded `scene_note`;
- relevant actor canon/prompt cards;
- active rule premises with exact selected scope;
- current clothing where relevant;
- recent raw turns;
- older grounded summaries within a token budget.

Story does not receive:

- precomputed action outcome;
- generic success probability;
- relationship stage;
- consent/compliance matrix;
- action taxonomy;
- physical execution plan;
- dynamic player sexual meter;
- historical 44-rule CSA semantics.

Story writes:

- natural Korean narrative;
- dialogue in a visible natural convention where useful;
- exactly four natural full next-action suggestions.

No automatic Story regeneration occurs merely because choices/MM/observer fields are imperfect.

## 7. Story wire — deliberately simple

Canonical Story is **plain player-visible text**.

Recommended visible dialogue convention:

```text
서원희(조금 고개를 기울이며): "대사"
```

Recommended choice footer:

```text
다음 행동
1. ...
2. ...
3. ...
4. ...
```

This is not hidden control syntax. It is readable player content.

During streaming, raw Story text is always readable. After Commit, a safe presentation parser may turn unambiguous dialogue/choice text into the existing v1 cards/buttons. Parser failure falls back to raw Story; it cannot invalidate Story.

## 8. One post-Story observer only

Observer is a projection tool, not a second author.

Target schema:

```json
{
  "elapsed_minutes": 3,
  "location": {
    "location_id": "brand_strategy_office",
    "quote": "exact Story substring"
  },
  "entered": [
    {"actor_id":"heroine2","quote":"exact Story substring"}
  ],
  "exited": [],
  "scene_note": "bounded current-scene snapshot",
  "clothing_changes": [],
  "choices": ["...","...","...","..."],
  "turn_summary": "grounded concise summary",
  "mind_monitor": {
    "heroine1": {"surface":"...","subconscious":"..."}
  },
  "warnings": []
}
```

Observer may not return arbitrary save paths or unknown semantic domains.

### Validation philosophy

Validate only high-risk structural authority:

- actor IDs must exist;
- location IDs must exist;
- entered/exited/location changes require an exact Story quote;
- choice strings must appear in the completed Story and be four unique non-empty strings;
- clothing slots/states must be finite valid values;
- Mind Monitor actor must be relevant/present.

Do **not** build a generic validator for every narrative meaning.

## 9. Fail-open observer behavior

If Story succeeds but observer fails completely:

- Story still commits;
- literal action still commits;
- state keeps prior location/presence/scene_note/clothing unless a deterministic system mechanic changed them;
- summary uses a bounded Story fallback;
- Mind Monitor is empty for that turn;
- choice buttons are unavailable for that turn;
- free input remains available;
- no stale previous choices are shown;
- no second Story call occurs.

This is preferable to losing a good Story because a side projection was malformed.

## 10. Minimal durable state

Static player profile is separated from mutable gameplay state.

### Game/profile

Conceptually:

```json
{
  "game_id": "uuid",
  "content_version": "...",
  "profile": {
    "name": "...",
    "department_id": "...",
    "position_id": "...",
    "age": 0,
    "height_cm": 0,
    "weight_kg": 0,
    "penis_length_cm": 0,
    "body_type_id": "...",
    "speech_style_id": "..."
  }
}
```

### Mutable state

```json
{
  "time": {"day":1,"minute":540},
  "scene": {
    "location_id":"brand_strategy_office",
    "present_actor_ids":["heroine1"],
    "scene_note":"..."
  },
  "active_rules": [],
  "clothing": {}
}
```

No compatibility zombie fields are allowed.

## 11. Persistence namespace

Do **not** mutate historical v1/v2 evidence tables in place.

Recommended clean runtime namespace:

```text
company_r3_games
company_r3_state
company_r3_turn_jobs
company_r3_turns
company_r3_system_events
```

The name `r3` is an implementation generation only; product identity remains `company-v1 / 상식개변: 회사편`.

### `company_r3_games`

Owns game identity, content version and validated static player profile.

### `company_r3_state`

Owns one mutable JSON state, revision and committed turn.

### `company_r3_turn_jobs`

Owns in-flight action reservation, attempt fencing, partial Story progress, stage/error metadata.

### `company_r3_turns`

Stores canonical committed history:

```text
game_id
turn_number
revision
literal_action
story_text
choices
turn_summary
mind_monitor
observer_raw
observer_applied
warnings
state_after
committed_at
```

Opening is chronological turn 0.

`revision` is included now because feedback revision is a retained product feature; ordinary turns start at revision 1.

### `company_r3_system_events`

Small audit log for non-Story transactions, initially rule apply/change/remove only.

It does not advance gameplay turn.

## 12. Turn-job stages and retry law

Keep stage information on the server, not in browser localStorage.

Useful stages:

```text
reserved
story_streaming
story_complete
committing
committed
failed
```

Persist final completed Story before or at commit preparation so a transient Commit retry does not automatically regenerate a different Story.

Retry rules:

- before Story completion: explicit retry may regenerate because no Story was committed;
- after Story completion but before canonical Commit: prefer reusing the stored completed Story/observer artifact;
- after Commit: reconnect/readback returns committed result;
- stale older attempt can never commit over a newer attempt;
- no hidden retry-until-lucky.

## 13. Progress persistence

Do not write the DB for every streamed token.

Keep a tiny bounded policy, e.g. a handful of snapshots per attempt. Streaming to the browser remains immediate; DB snapshots exist only for reconnect/recovery.

This is infrastructure, not gameplay state.

## 14. Context/readback simplification

Current v2 persistence performs several separate context queries. A′ should prefer one server-owned context/readback RPC or another bounded request shape so every render/reconnect does not fan out through unnecessary DB calls.

Target context contains only what the frontend needs:

```text
game/profile
committed state
recent/history window
current job if any
resolved display directory/catalog projection
```

The frontend does not reconstruct gameplay truth from multiple endpoints.

## 15. Memory — no new memory engine in Milestone 0

Start simple:

- last 6–8 turns: raw action + raw Story;
- older turns: chronological `turn_summary` values under a token budget;
- current `scene_note` separately.

Do not add a separate memory LLM every turn.

Only if 20–30+ turn live play proves older summaries insufficient should a periodic memory-chunk compactor be added.

The failure case must be shown first.

## 16. Character identity guard

Use canonical registered IDs throughout structured state.

For Story context:

- include full canon for present actors;
- exact canonical names mentioned in the literal action may add a **referenced actor context** without automatically making that actor present;
- no fuzzy name creation;
- prose mentioning an unknown person does not register a new canonical actor;
- observer cannot map an unknown name to the nearest character.

This specifically prevents failures such as treating “민아 보러간다” as permission to invent a different `김민아` identity.

## 17. `scene_note` continuity

One bounded replaceable note remains the initial immediate-continuity mechanism.

Example:

```text
김제나는 플레이어 무릎 위에 옆으로 앉아 있고, 검토 중인 문서는 책상 오른쪽에 펼쳐져 있다.
```

The observer rewrites it only from supported current Story/prior continuity.

No posture/contact ontology is built beside it.

If live play shows a specific fact cannot survive reliably, add the smallest exact field necessary for that failure only.

## 18. CSA transaction

CSA apply/change/remove is a separate endpoint/domain command.

```text
browser app
→ template + subject_scope + optional counterparty_scope
→ server validates against active 9-rule catalog and finite scope vocabulary
→ lock state/revision
→ update active_rules
→ apply exact retained deterministic mechanic when required
→ append system event
→ commit state revision
→ return updated context
```

Ordinary gameplay turn does not advance.

No fake Story action is created.

### Clothing

The exact four-slot mechanic from v1 is a strong salvage candidate because it contains no generic narrative semantics.

For broad employee scopes, all finite registered affected actors can be updated deterministically. Off-screen narrative consequences remain Story-authored.

## 19. Frontend architecture

The old Company v1 presentation remains the UI donor.

New frontend controller is intentionally thin:

```text
load context
render view model
submit action
consume story_delta
consume terminal
render committed context
```

It does not own turn stages.

New view model is a pure adapter from A′ context into the existing Company UI surfaces.

## 20. Optional sidecars

Image and TTS remain later sidecars.

They never:

- delay Commit;
- alter state;
- trigger Story regeneration;
- become narrative authority.

## 21. Complexity budget

A′ must stay explainable.

Do not add an abstraction unless an accepted scenario needs it.

Forbidden speculative systems in the first core:

- generic action classifier/router;
- generic outcome engine;
- generic relationship engine;
- generic event ledger;
- generic physical ontology;
- generic CSA execution DSL;
- separate choice model;
- separate MM model;
- per-turn memory model call;
- automatic Story repair/retry loop.

The intended normal LLM cost is **2 calls per turn**:

```text
Story
Observer
```

## 22. Operational observability for live play

Live failures must be diagnosable without adding gameplay authority.

Keep per committed turn:

- literal action;
- raw Story;
- raw observer JSON;
- applied observer projection;
- warnings;
- state before/after or deterministic state_after;
- latency/timing metadata in logs;
- job error stage/code when failed.

Diagnostics are evidence only and never feed back into Story automatically.

## 23. Architecture acceptance

A′ is accepted only if a first vertical slice can demonstrate on TEST:

1. real Company v1-style Setup/UI;
2. recognizable Company Opening;
3. free input + four Story-authored choices;
4. visible streaming without blocking overlay;
5. literal player action preserved;
6. one server-owned Commit;
7. relevant Mind Monitor;
8. refresh/readback parity;
9. identity continuity;
10. `scene_note` continuity over several turns.

Automated tests are a guardrail. Real live play is the product gate.
