# Company v2 Clean Runtime Canon — 2026-08-19

**Status:** OWNER CANON / BINDING DESIGN  
**Decision:** Stop repairing the current Company fresh gameplay runtime. Build a clean-room gameplay runtime spine while preserving product content and reusable infrastructure.

---

## 0. Why the rebuild is now mandatory

The preserved owner manual acceptance game `df3045fd-c359-4cdc-8783-357ddfebe398` failed after only 7 committed turns.

Independent DB readback confirms the failure is not one isolated seam:

1. **Turn concurrency / workflow collapse**
   - canonical save remained at committed turn 7;
   - two action rows existed for expected turn 8;
   - a synthetic CSA action terminalized as `stale_action_timeout` while a real owner input row remained `story_streaming` with no Story text.

2. **CSA transaction is incorrectly modeled as gameplay**
   - the app generated literal fake player turns such as `회사 규정 변경사항 1건이 공식 반영된다.`;
   - applying an exact app rule therefore consumed ordinary narrative turn machinery.

3. **Finite identity contamination**
   - Extract assigned player `금태양` evidence to registered NPC `general_park_jungwoo`.

4. **Memory / presentation instability**
   - a successful rich Story turn committed with blank `turn_summary` and blank Mind Monitor;
   - other turns over-generated Mind Monitor for every office resident instead of relevant actors.

5. **Physical-state observation is not trustworthy enough**
   - observed clothing/position updates could be stale, contradictory, or attached to the wrong actor.

6. **Protocol garbage reached canonical visible Story**
   - provider self-repair text such as `[ooc]...[/ooc]`, malformed DIALOGUE text and repeated scene restart content was persisted/displayed as Story.

These failures span orchestration, persistence, identity, observation, memory and protocol boundaries simultaneously. Continuing to patch the existing runtime is rejected.

---

## 1. Product continuity vs runtime continuity

The **Company product is preserved**. The **current gameplay runtime implementation is not**.

### Preserve / reuse through explicit clean interfaces

- Company setting and world identity;
- character canon and prompt-card content;
- registered character IDs and names;
- location catalog and registered location IDs;
- CSA preset/catalog definitions;
- existing visual design/components where they are presentation-only;
- image/TTS infrastructure as later sidecars;
- Cloudflare/Supabase deployment knowledge;
- exact literal player action/choice principle;
- user-owned manual QA evidence as read-only reference.

### Do not use as implementation base

- current fresh Story→Extract→Commit orchestration;
- `app.js` client-owned stage machine / local pending step authority;
- current fresh `game_actions` workflow semantics;
- current legacy/fresh Extract adapters;
- current evidence path grammar / reducer chains;
- old fresh parser compatibility layers;
- synthetic CSA gameplay-turn behavior;
- old save shape compatibility as a design constraint;
- stale tests whose purpose is to preserve the old runtime shape.

Existing runtime code may be inspected as donor/reference only. **New runtime modules must not import old gameplay-engine modules.**

---

## 2. Clean-room location in the repository

Build the new runtime in a physically separate tree, for example:

```text
company-v1/
  src/                  # old runtime, historical/reference
  runtime-v2/
    server/
    domain/
    prompts/
    db/
    tests/
  frontend-v2/
```

Exact paths may be adjusted once, but the rule is binding:

> `runtime-v2` may import static content/catalog data and small proven infrastructure utilities, but it must not import `src/engine`, old runtime-core reducers, old fresh Extract normalizers, or the old frontend turn state machine.

The first implementation PR must include an import-boundary test/grep proving this isolation.

---

## 3. New runtime's entire narrative spine

The v2 runtime must be explainable as:

```text
literal player action
        ↓
ONE server-owned turn request
        ↓
Story LLM
        ↓
stream player-visible narrative
        ↓
small post-Story observation
        ↓
small deterministic state reduction
        ↓
one atomic durable commit
        ↓
next turn / readback
```

The browser does not own Story→Extract→Commit progression.

The client may know only:

```text
game_id
action_id / turn number
literal input
stream connection state
```

It does not own `step=story|extract|commit`, semantic recovery, retries, or replacement actions.

---

## 4. New persistence model — no old mutable-runtime compatibility

Use new v2 mutable tables / RPCs. Do not write new v2 gameplay through old `game_save`, `game_turns`, or `game_actions` contracts.

Existing static/product records may be referenced by ID, but v2 runtime truth is isolated.

Recommended minimal durable model:

### `company_v2_games`

```text
game_id
content_version
created_at
```

### `company_v2_state`

One row per game:

```text
game_id
revision
committed_turn
state jsonb
updated_at
```

Initial mutable state should stay small:

```json
{
  "player": {"id":"player-1","name":"...","level":7,"exp":0},
  "time": {"day":1,"minute":540},
  "scene": {"location_id":"...","present_npc_ids":[]},
  "clothing": {},
  "player_meter": {},
  "active_csa": []
}
```

Do not add relationship/event/emotion/open-fact ledgers in the initial runtime.

### `company_v2_turn_jobs`

Exactly one row per `game_id + turn_number`.

```text
game_id
turn_number
action_id
literal_action
status = processing | committed | failed
story_text
error_code
attempt_no
updated_at
```

The unique game+turn row is the concurrency primitive. A second request for an already-processing turn reconnects to that job; it does not create another row.

An explicit owner resubmission after terminal `failed` may start a new attempt on the same turn job under a new action identity/attempt counter. No automatic LLM retry.

### `company_v2_turns`

One committed canonical row per turn:

```text
game_id
turn_number
literal_action
story_text
parsed_blocks
choices
turn_summary
mind_monitor
state_after / state_delta as narrowly needed
committed_at
```

No revision/history compatibility is required in Phase 1. Feedback revision is added later as a v2-native mechanism rather than copied from v1.

---

## 5. One server-owned `/api/v2/turn`

The canonical turn operation owns the entire fresh turn:

1. validate game + expected turn;
2. reserve/reconnect the unique v2 turn job;
3. build minimal committed Story context;
4. call Story once;
5. stream Story deltas to the client while accumulating server-side;
6. canonicalize structural protocol blocks;
7. call one post-Story observation once;
8. reduce the few enabled v2 state fields deterministically;
9. commit `company_v2_state + company_v2_turns + job terminal status` through one authoritative server-side commit boundary;
10. emit terminal committed state.

If Story fails, the job becomes terminal `failed`. No Extract/Commit follows.

If optional observation partially fails, the valid Story still commits; only unsupported optional projection is omitted.

---

## 6. Story contract — simple and human

Story is the narrative author.

Story receives only:

- literal current player action;
- current time;
- current location;
- current present registered actors;
- relevant character canon;
- active exact CSA premise;
- confirmed finite clothing facts when enabled;
- recent raw turns;
- older narrative summaries.

Story does not receive:

- success/failure verdict;
- consent/relationship verdict;
- generic event taxonomy;
- physical execution plan;
- action router/classification;
- image/media class;
- old runtime workflow metadata.

### Output format

Minimize control syntax.

Preferred v2 Story output should use the smallest protocol necessary for streaming/readback, for example only:

```text
[NARRATIVE]
...

[DIALOGUE id="heroine1"]
...

[THOUGHT]
...

[CHOICE]
...
[/CHOICE]
```

Do not expose scene IDs as marker parameters. Do not allow provider OOC/self-repair blocks into canonical display.

Unsupported control-looking lines are discarded structurally, not semantically interpreted.

---

## 7. Observation v2 — typed objects, no save paths

Do not use string paths such as `npc_scene_state.heroine3.clothing...` as LLM output.

The observation response must use typed objects.

Target shape after the first vertical slice may be:

```json
{
  "elapsed_minutes": 3,
  "scene": {
    "location_id": null,
    "entered": [{"actor_id":"heroine1","quote":"..."}],
    "exited": []
  },
  "clothing": [
    {
      "actor_id":"heroine1",
      "quote":"...",
      "slots":{"uniform_top":"open"}
    }
  ],
  "player_meter": null,
  "turn_summary":"...",
  "mind_monitor": {
    "heroine1":{"surface":"...","subconscious":"..."}
  }
}
```

Rules:

- actor IDs must be exact registered IDs;
- player and NPC identities are disjoint;
- quotes for durable observations must be exact Story substrings;
- reducers consume typed fields directly;
- no arbitrary save path;
- no event/relationship/emotion taxonomy;
- no generic physical/posture/contact ontology.

Mind Monitor remains interpretive presentation text and does not require evidence quotes.

---

## 8. Identity rule

The v2 runtime must have one explicit identity map per game/content version:

```text
player_id -> player names/aliases
npc_id -> exact registered names/aliases
```

The player alias set can never authorize an NPC observation.

NPC durable observation requires one of:

- exact actor ID already supplied structurally by parsed DIALOGUE/target/navigation; or
- exact registered NPC name/alias contained in the supporting quote.

If ambiguous, drop the optional observation.

No fuzzy identity classifier.

---

## 9. Scene and navigation

Keep scene state minimal:

```text
location_id
present_npc_ids
```

No durable focal, beat, goal or focus thread in the initial runtime.

Exact deterministic navigation is allowed before Story only when structurally unambiguous:

- exact registered location phrase; or
- one/multiple exact registered NPCs that all map to one unique canonical destination and the literal action explicitly expresses movement.

Otherwise Story handles narrative movement and observation may update scene only from exact evidence.

---

## 10. CSA is not a turn

CSA/app apply uses a separate endpoint such as:

`POST /api/v2/csa/apply`

It:

1. verifies the signed deterministic transaction;
2. CAS-updates `company_v2_state` revision;
3. updates active CSA / exact supported finite mechanical projection;
4. leaves `committed_turn` unchanged;
5. creates no v2 turn job;
6. creates no v2 turn history row;
7. refreshes context.

The next real Story sees the already-active rule.

---

## 11. Clothing only after the core turn works

Four-slot clothing remains the first optional physical mechanic:

```text
uniform_top
uniform_bottom
underwear_top
underwear_bottom
```

No posture/contact/sexual-position grammar.

Two writer reasons only:

1. exact structured CSA required-state transaction;
2. exact Story-observed typed clothing change.

Contradictory or uncertain observation preserves prior value.

---

## 12. Summary and memory

Memory strategy:

```text
recent 6 raw committed Story turns
+
older turn_summary
```

A committed non-empty Story must never have an empty durable summary.

If observation returns blank summary, deterministically persist a bounded excerpt from canonical committed Story as `turn_summary` in the same commit.

No second LLM summarizer.

---

## 13. Mind Monitor

Mind Monitor remains in the same observation call.

Target only relevant NPCs:

- current direct interaction target when structurally known;
- actual local DIALOGUE speaker(s);
- exact navigation target where relevant.

Do not target everyone merely because they are present.

Missing MM is fail-open and never blocks a turn.

---

## 14. Features intentionally deferred

Do not put these in Phase 1:

- relationship/event ledgers;
- feedback revision;
- image selection;
- TTS;
- player sexual meter if it delays the core vertical slice;
- generalized physical state;
- old save/history import;
- v1 replay compatibility;
- migration of existing games.

They are added only after the user confirms the smaller runtime actually plays well.

---

## 15. Development phases — manual play early, not last

### Phase 1 — clean vertical slice

Goal: user can play 5 natural turns.

Include only:

- fresh v2 game fixture/setup;
- minimal opening;
- one server-owned streaming turn endpoint;
- literal player input;
- Story;
- exactly four provider choices;
- one small observation call;
- summary + relevant Mind Monitor;
- minimal scene/time state;
- durable v2 turn/state tables;
- refresh/reconnect same turn job;
- no automatic retries.

Then deploy to TEST and STOP for **user 5-turn manual acceptance**.

Do not wait for 300 legacy tests or 30 features before first manual play.

### Phase 2 — Company mechanics

Only after Phase 1 user acceptance:

- exact navigation hardening;
- CSA non-turn transaction;
- four-slot clothing;
- direct Story context projection of active rule/clothing.

Then user 10-turn manual acceptance.

### Phase 3 — product sidecars / mechanics

Only after Phase 2 acceptance:

- player sexual meter if still desired;
- feedback revision as v2-native flow;
- image/TTS sidecars;
- UI refinements.

Then longer 20–30+ turn acceptance.

---

## 16. Testing philosophy

New runtime tests prove invariants, not old implementation shape.

Phase 1 tests should remain compact:

- one request -> one turn job;
- same turn concurrent request -> same job/conflict, never duplicate;
- literal action unchanged;
- Story streams;
- Story failure -> terminal failed, no auto retry;
- optional observation failure -> Story still commits;
- exactly four committed choices;
- refresh reconnects to same job;
- summary always non-empty for non-empty Story;
- player ID cannot write NPC state;
- protocol garbage absent from canonical blocks;
- committed state/history readback survives refresh.

Do not port the old full test suite wholesale.

---

## 17. Deployment isolation

Prefer separate TEST identities for v2:

```text
API Worker: game-proxy-company-v2
Frontend:   gamebuilder-company-v2
URL/runtime flag must not route normal v1 users into v2 accidentally.
```

Production remains untouched until explicit later owner authorization.

The old v1 runtime remains frozen as historical reference during v2 development.

---

## 18. Final rule

The new runtime should be understandable from a small number of files and one diagram.

If a proposed feature requires adding a second authority, compatibility mirror, generic semantic taxonomy, retry system or another workflow stage, reject it unless a concrete user-visible requirement proves it necessary.

> **Company v2 starts from gameplay, not from compatibility. Story plays the scene; one small observer records only necessary facts; the server owns the turn; the database stores one reality.**
