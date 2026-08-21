# Company Redesign — Gameplay / State / Memory Model

Status: OWNER-REVIEW DRAFT  
Date: 2026-08-21

This model separates **what happened in Story** from **what must be machine-readable**. Goal: long-play continuity without giant semantic ontology.

## 1. Four kinds of truth

### Static content truth

Owned by accepted repository content: registered characters, locations, setup catalogs, and active nine-rule CSA MVP. Historical non-MVP rules are not active runtime truth.

### Narrative truth

Owned by committed literal player action + committed Story: dialogue, rejection/acceptance, tone, promises, arguments, open-ended physical/social consequences, scene events.

Do not force all narrative meaning into enums/ledgers.

### Structural/mechanical truth

Initial minimum:

- player profile identity;
- day/time;
- current registered location;
- current present registered actors;
- active accepted CSA rules/lifecycle;
- four-slot clothing because retained MVP clothing rules need exact continuity;
- optional owner-approved player mechanic(s);
- bounded current-scene continuity note.

### Presentation/interpretation

Mind Monitor, image, TTS, focal/display character, compact UI labels. These may fail locally and do not redefine narrative truth.

## 2. Proposed minimal durable state

Conceptual only:

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
  "time": { "day": 1, "minute": 540 },
  "scene": {
    "location_id": "brand_strategy_office",
    "present_actor_ids": ["heroine1"],
    "scene_note": {
      "text": "현재 다음 턴에 꼭 이어져야 할 공간·행동 사실",
      "updated_turn": 7
    }
  },
  "active_rules": [],
  "clothing": {},
  "player_mechanics": {}
}
```

`active_rules` stores only accepted template identity/scope/lifecycle values; it does not duplicate full arbitrary semantics into save.

`player_mechanics` exists only for explicitly retained mechanics. No compatibility zombie fields.

## 3. Current-scene continuity note

Test a **single replaceable bounded natural-language snapshot** before adopting generic posture/contact ontology.

Purpose: carry ongoing pose/contact, important held/placed objects, immediate spatial relationship, and other facts the very next Story must not forget.

Example:

```json
{
  "text": "김제나는 플레이어 무릎 위에 옆으로 앉아 있고, 보고서는 책상 오른쪽에 펼쳐져 있다.",
  "updated_turn": 12
}
```

Rules:

- bounded snapshot, not accumulating fact ledger;
- grounded only in committed Story/current prior note;
- rewritten as scene changes;
- never invent uncertain contact/object/pose;
- location/presence remain separately structured.

This remains an OPEN implementation choice until `A-SCENE-002` proves it sufficient. If not, add the smallest extra structure actually needed.

## 4. Turn record

Preserve at least:

```text
turn_number
revision
literal_player_action
story_text
structured_speaker_metadata (only if safe parser accepted)
turn_summary
mind_monitor
observation_projection
committed_at
```

Raw committed Story remains recoverable. Feedback revision replaces revision of same chronological turn, not turn number.

## 5. Story authority

Story receives bounded projection of exact player action, accepted relevant profile context, time, current location/description, relevant actor IDs/canon, relevant active premises from accepted nine rules, scene note, recent raw turns, and older grounded memory.

Story does **not** receive precomputed success/failure, relationship stage, consent matrix, action taxonomy, physical execution plan, or probability roll.

## 6. Post-Story observation

Recommended starting topology: **one small observer call after Story**, combining projections that inspect the same completed narrative:

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

This avoids multiplying LLM seams. If live evidence later proves one field materially harms reliability, split only that proven field.

Do not output generic relationship/event/emotion ledgers, arbitrary save paths, generic physical-action taxonomy, CSA attitude/compliance semantics, media authority, or success/failure interpretation.

Exact system actions such as retained clothing-rule application bypass open observation only for their encoded finite mechanic.

Observer/MM failure is local and never causes a second Story generation.

## 7. Memory model

### Recent memory

Keep bounded recent committed turns as raw literal action + raw Story. Starting recommendation: 6–8 turns.

### Older memory

Use chronological grounded chunks from committed turns:

```json
{
  "from_turn": 1,
  "to_turn": 4,
  "summary": "...",
  "source_turns": [1,2,3,4]
}
```

Rules: preserve chronology; summarize committed material only; no invented relation/event classification; blank/invalid summary falls back to bounded raw Story; memory failure cannot erase event.

### Compaction timing

Do not require a separate memory LLM every turn. Prefer observer summary + deterministic aggregation/raw fallback, or periodic compaction only when material ages out of recent raw context. Choose simplest design passing `A-MEMORY-001`.

## 8. Mind Monitor

Saved with turn for history/UI consistency but not durable world truth. Next Story cannot treat prior monitor as hard fact unless narrative/state also established it. Missing monitor cannot block Commit.

## 9. Relationship/emotion

No generic relationship/emotion/event ledger in core redesign. Long-running changes first live in Story + grounded memory. Add specific structured state later only when an accepted mechanic/UI proves need.

## 10. Location/navigation

Machine truth: stable location IDs, current location, present registered actors.

Deterministic navigation only when destination/target is structurally unambiguous. Ambiguous movement remains Story-authored. No generic semantic intent router.

## 11. CSA/rules

Rule state is separate from chronological Story turns.

```text
Open app
→ select/edit accepted template/scope
→ validate active product definition
→ atomic apply/change/remove transaction
→ durable rule state changes
→ ordinary Story turn unchanged
→ next Story reads relevant premise
```

Runtime supports only mechanics needed by retained nine templates. Clothing rules may synchronize exact four slots; request/open behavior remains Story-authored from exact wording/scope; non-MVP IDs rejected; no generic CSA execution DSL.

## 12. State deletion law

Every durable field must answer:

1. Which accepted scenario needs it?
2. Who is sole writer?
3. Who reads it?
4. What happens if absent?
5. Can raw Story/memory replace it more safely?

If answers are missing, do not add/retain the field.

Historical compatibility is not a product requirement unless owner explicitly authorizes save migration.
