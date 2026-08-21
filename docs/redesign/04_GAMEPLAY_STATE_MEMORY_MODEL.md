# Company Redesign — Gameplay / State / Memory Model

Status: OWNER-REVIEW DRAFT  
Date: 2026-08-21

This model deliberately separates **what happened in Story** from **what must be machine-readable**.

The goal is to preserve long-play continuity without rebuilding a giant semantic ontology.

## 1. Four kinds of truth

### 1.1 Static content truth

Owned by repository `content/*.json`.

Examples:

- registered character IDs/canon;
- location catalog;
- organization/setup catalogs;
- CSA preset definitions.

Runtime does not rewrite this truth.

### 1.2 Narrative truth

Owned by committed player action + committed Story.

Examples:

- what someone said;
- whether a request was rejected/accepted;
- interpersonal tone;
- promises, arguments, jokes, embarrassment;
- open-ended physical/social consequences;
- scene-specific events.

The runtime must not force all narrative meaning into enums/ledgers.

### 1.3 Structural/mechanical truth

Machine-readable state retained only where the game genuinely needs exact behavior.

Initial recommended minimum:

- player creation/profile identity;
- day/time;
- current registered location;
- current present registered actors;
- active `상식개변` rules and their lifecycle;
- four-slot clothing if retained;
- optional explicitly approved player meter(s);
- current-scene continuity note described below.

### 1.4 Presentation/interpretation

Examples:

- Mind Monitor;
- image choice;
- TTS;
- focal/display character;
- UI compact labels.

These may be derived and may fail locally. They do not redefine narrative truth.

## 2. Proposed minimal durable game state

Conceptual shape, not final DB schema:

```json
{
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
  },
  "time": {
    "day": 1,
    "minute": 540
  },
  "scene": {
    "location_id": "brand_strategy_office",
    "present_actor_ids": ["heroine1"],
    "scene_note": {
      "text": "현재 장면에서 다음 턴에 꼭 이어져야 할 임시 공간·행동 사실",
      "updated_turn": 7
    }
  },
  "active_rules": [],
  "clothing": {},
  "player_mechanics": {}
}
```

`player_mechanics` exists only for mechanics explicitly retained by owner decision. Empty compatibility fields are not permitted.

## 3. Current-scene continuity note

The redesign should test a **single replaceable natural-language scene note** before adopting a generic posture/contact ontology.

Purpose:

- carry ongoing pose/contact that may last many turns;
- carry important held/placed objects;
- preserve immediate spatial relationships;
- give Story a compact “what is physically still true right now” anchor.

Example:

```json
{
  "text": "김제나는 플레이어 무릎 위에 옆으로 앉아 있고, 검토 중인 보고서는 책상 오른쪽에 펼쳐져 있다.",
  "updated_turn": 12
}
```

Rules:

- one bounded current snapshot, not an accumulating fact ledger;
- derived only from committed Story/current prior scene note;
- replaces itself as the scene changes;
- must never invent a contact/object/pose absent from Story;
- if generation is uncertain, preserve the last supported note or omit uncertain detail rather than fabricating precision;
- location/presence remain separately structured.

This is a candidate approach. Acceptance scenario `A-SCENE-002` decides whether it is sufficient. If not, introduce the smallest additional structure proven necessary.

## 4. Turn record

Each accepted chronological turn should preserve at least:

```text
turn_number
revision
literal_player_action
story_text
structured_story_blocks_or_speaker_metadata (if accepted by architecture)
turn_summary (optional presentation/memory aid)
mind_monitor (optional presentation)
observation_projection (only retained machine fields)
committed_at
```

The raw committed Story must always remain recoverable.

Feedback revision changes the revision of the same chronological turn; it does not create a new turn number.

## 5. Story authority

Ordinary gameplay starts from the exact literal player action.

Story receives a bounded projection of:

- exact player action;
- accepted player profile fields relevant to the scene;
- current day/time;
- current location + relevant location description;
- present/relevant actor IDs and compact canon;
- active rule premises relevant to the turn;
- current scene note;
- recent raw committed turns;
- older grounded memory chunks.

Story does not receive precomputed success/failure, relationship stage, consent matrix, action taxonomy, generic physical execution plan, or probability roll.

## 6. Post-Story observation

Use one small observer/projection boundary after Story unless later architecture evidence proves another design superior.

Candidate outputs:

```text
elapsed_minutes
location_id if Story clearly moved
entered_actor_ids / exited_actor_ids with evidence
new scene_note
ordinary clothing changes with actor/evidence
optional retained player-mechanic delta
turn_summary
mind_monitor
warnings
```

Do not output:

- generic relationship/event/emotion ledgers;
- arbitrary save patch paths;
- generic physical-action taxonomy;
- CSA attitude/compliance semantics;
- media authority;
- success/failure interpretation of open narrative actions.

Exact structured system actions, such as applying a CSA clothing rule, bypass open-ended observation for the exact encoded finite mechanic.

## 7. Memory model

### 7.1 Recent memory

Keep a bounded number of recent committed turns as raw player action + raw Story.

Recommended starting window: 6–8 turns; exact budget is an architecture/performance decision.

### 7.2 Older memory

Older continuity should be represented by chronological grounded memory chunks produced from already committed turns.

Preferred conceptual form:

```json
{
  "from_turn": 1,
  "to_turn": 4,
  "summary": "...",
  "source_turns": [1,2,3,4]
}
```

Rules:

- preserve chronology;
- summarize only committed material;
- no invented relationship stage/event classification;
- when a memory summary is blank/invalid/unavailable, raw committed Story must remain available as deterministic bounded fallback;
- memory failure may reduce convenience but may not erase the event.

### 7.3 Memory compaction timing

Do not require a separate LLM call every turn purely for memory.

Acceptable candidates for architecture review:

- same post-Story observer emits turn summary and periodic chunk material;
- deterministic aggregation of turn summaries with raw fallback;
- periodic compaction only when a chunk ages out of recent raw context.

Choose the simplest design that passes `A-MEMORY-001`.

## 8. Mind Monitor storage/readback

Mind Monitor is saved with the turn for history/UI consistency, but it is not durable world truth.

Next Story must not treat prior Mind Monitor as hard fact unless the same information is also established by narrative/state.

A missing monitor cannot block Commit.

## 9. Character relationship/emotion

Do not create a generic relationship/emotion/event ledger during the core redesign.

Long-running relationship change should first live in committed Story + grounded memory.

If later owner experience shows a concrete UI/mechanic requires structured relationship state, add only the specific model proven by a new acceptance scenario.

## 10. Location/navigation

Machine truth:

- stable location IDs;
- current location;
- present registered actors.

Navigation can be deterministic only when the player action structurally identifies an unambiguous registered destination/target under the accepted navigation contract.

Open ambiguous movement remains Story-authored.

No generic semantic intent router is required merely to move around the company.

## 11. CSA/rules

Rule state is separate from chronological Story turns.

Conceptual transaction:

```text
Open app
→ edit/select rule
→ validate finite product definition/scope
→ atomic apply/change/remove transaction
→ durable rule state changes
→ ordinary Story turn count unchanged
→ next Story reads new rule premise
```

Exact encoded finite state may synchronize directly, for example four-slot clothing requirements.

NPC personal interpretation remains Story-authored.

## 12. State deletion law

Every durable field must answer:

1. Which accepted scenario needs it?
2. Who is the sole writer?
3. Who reads it?
4. What happens if it is absent?
5. Can raw Story/memory replace it more safely?

If these answers are missing, do not add/retain the field.

Historical compatibility is not a product requirement for the new runtime unless owner explicitly authorizes save migration.
