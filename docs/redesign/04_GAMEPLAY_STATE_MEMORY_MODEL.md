# Company Redesign — Gameplay / State / Memory Model

Status: OWNER-REVIEW DRAFT  
Date: 2026-08-21

This model separates **what happened in Story** from **what must be machine-readable**. The goal is long-play continuity without rebuilding a giant semantic ontology.

## 1. Four kinds of truth

### 1.1 Static content truth

Owned by accepted repository content.

Examples:

- registered character IDs/canon;
- location catalog;
- organization/setup catalogs;
- the active 9-rule CSA MVP defined by `07_CSA_MVP_CATALOG.md`.

Historical non-MVP CSA templates are not active runtime truth.

### 1.2 Narrative truth

Owned by committed literal player action + committed Story.

Examples:

- what someone said;
- whether a request was rejected/accepted;
- interpersonal tone;
- promises, arguments, jokes, embarrassment;
- open-ended physical/social consequences;
- scene-specific events.

The runtime does not force all narrative meaning into enums/ledgers.

### 1.3 Structural/mechanical truth

Machine-readable state exists only where exact behavior is genuinely needed.

Initial recommended minimum:

- player creation/profile identity;
- day/time;
- current registered location;
- current present registered actors;
- active `상식개변` rules from the accepted 9-template catalog and their lifecycle;
- four-slot clothing because retained MVP clothing rules need exact continuity;
- optional explicitly approved player meter(s);
- bounded current-scene continuity note.

### 1.4 Presentation/interpretation

Examples:

- Mind Monitor;
- image choice;
- TTS;
- focal/display character;
- UI compact labels.

These may fail locally and never redefine narrative truth.

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

`active_rules` contains only template IDs/scope/lifecycle values derived from the accepted 9-rule catalog. It does not copy arbitrary historical rule semantics into save state.

`player_mechanics` exists only for mechanics explicitly retained by owner decision. Empty compatibility fields are not permitted.

## 3. Current-scene continuity note

Test a **single replaceable natural-language scene note** before adopting a generic posture/contact ontology.

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
- replaces itself as scene changes;
- never invents contact/object/pose absent from Story;
- uncertainty preserves the last supported fact or omits uncertain detail;
- location/presence remain separately structured.

Acceptance scenario `A-SCENE-002` decides whether this is sufficient. If not, introduce the smallest extra structure proven necessary.

## 4. Turn record

Each accepted chronological turn preserves at least:

```text
turn_number
revision
literal_player_action
story_text
structured_speaker_metadata (only if architecture accepts a safe parser)
turn_summary (optional memory/presentation aid)
mind_monitor (optional presentation)
observation_projection (retained machine fields only)
committed_at
```

Raw committed Story remains recoverable.

Feedback revision changes the revision of the same chronological turn rather than creating a new turn number.

## 5. Story authority

Story receives a bounded projection of:

- exact literal player action;
- accepted player profile fields relevant to the scene;
- current day/time;
- current location + relevant description;
- present/relevant actor IDs and compact canon;
- relevant active rule premises from the accepted 9-rule catalog;
- current scene note;
- recent raw committed turns;
- older grounded memory chunks.

Story does not receive precomputed success/failure, relationship stage, consent matrix, action taxonomy, generic physical execution plan, or probability roll.

## 6. Post-Story observation

Default candidate: one small observer/projection boundary after Story.

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

Do not output generic relationship/event/emotion ledgers, arbitrary save paths, generic physical-action taxonomy, CSA attitude/compliance semantics, media authority, or success/failure interpretation of open narrative actions.

Exact system actions such as applying a retained clothing rule bypass open-ended observation only for the encoded finite clothing mechanic.

## 7. Memory model

### 7.1 Recent memory

Keep a bounded number of recent committed turns as raw literal action + raw Story.

Recommended starting window: 6–8 turns; exact budget remains an architecture/performance decision.

### 7.2 Older memory

Older continuity uses chronological grounded memory chunks produced from committed turns.

Conceptual form:

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
- summarize committed material only;
- no invented relationship stage/event classification;
- blank/invalid/unavailable summary falls back to bounded raw committed Story;
- memory failure may reduce convenience but cannot erase the event.

### 7.3 Memory compaction timing

Do not require a separate LLM call every turn purely for memory.

Acceptable candidates:

- same observer emits turn summary and periodic chunk material;
- deterministic aggregation of turn summaries with raw fallback;
- periodic compaction only as material ages out of recent raw context.

Choose the simplest design that passes `A-MEMORY-001`.

## 8. Mind Monitor storage/readback

Mind Monitor is saved with the turn for history/UI consistency but is not durable world truth.

Next Story does not treat prior Mind Monitor as hard fact unless narrative/state also established it. Missing monitor cannot block Commit.

## 9. Character relationship/emotion

Do not create a generic relationship/emotion/event ledger during core redesign.

Long-running relationship change first lives in committed Story + grounded memory. Add specific structured relationship state later only if a concrete accepted mechanic/UI proves it is needed.

## 10. Location/navigation

Machine truth:

- stable location IDs;
- current location;
- present registered actors.

Navigation may be deterministic only when an unambiguous registered destination/target is structurally resolved under the accepted contract. Ambiguous/open movement remains Story-authored. No generic semantic intent router is required.

## 11. CSA/rules

Rule state is separate from chronological Story turns.

```text
Open app
→ select/edit one of the accepted 9 templates/scopes
→ validate exact active product definition
→ atomic apply/change/remove transaction
→ durable rule state changes
→ ordinary Story turn count unchanged
→ next Story reads relevant active premise
```

Runtime supports only mechanics actually needed by the nine retained templates.

- clothing rules may synchronize exact four-slot state;
- request-triggered/open-ended behavior remains Story-authored from exact rule wording/scope;
- no generic CSA execution DSL for historical candidates;
- no API path accepts non-MVP template IDs.

NPC personal interpretation remains Story-authored.

## 12. State deletion law

Every durable field must answer:

1. Which accepted scenario needs it?
2. Who is the sole writer?
3. Who reads it?
4. What happens if absent?
5. Can raw Story/memory replace it more safely?

If these answers are missing, do not add/retain the field.

Historical compatibility is not a product requirement unless the owner explicitly authorizes save migration.
