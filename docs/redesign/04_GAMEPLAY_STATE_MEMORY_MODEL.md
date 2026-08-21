# Company Redesign — Gameplay / State / Memory Model

Status: OWNER-REVIEW DRAFT / CORE STATE DECISIONS LOCKED  
Date: 2026-08-21

This model separates **what happened in Story** from **what must be machine-readable**. Goal: long-play continuity without giant semantic ontology.

## 1. Four kinds of truth

### Static content truth

Owned by accepted repository content: registered characters, locations, setup catalogs, and active nine-rule CSA MVP. Historical non-MVP rules are not active runtime truth.

### Narrative truth

Owned by committed literal player action + committed Story: dialogue, rejection/acceptance, tone, promises, arguments, open-ended physical/social consequences, scene events, and the four Story-authored current-turn choices.

Do not force all narrative meaning into enums/ledgers.

### Structural/mechanical truth

Initial minimum:

- player profile identity;
- day/time;
- current registered location;
- current present registered actors;
- one bounded current `scene_note`;
- active accepted CSA rules with selected scope/lifecycle;
- four-slot clothing because retained MVP clothing rules need exact continuity.

There is **no dynamic player sexual/arousal/erection/ejaculation mechanic** in the redesign core.

### Presentation/interpretation

Mind Monitor, extracted choice buttons, image, TTS, focal/display character, compact UI labels. These may fail locally and do not redefine narrative truth.

## 2. Minimal durable state

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
  "active_rules": [
    {
      "template_id": "...",
      "subject_scope": "...",
      "counterparty_scope": null,
      "active": true
    }
  ],
  "clothing": {}
}
```

`active_rules` stores accepted template identity, selected scope and lifecycle; it does not copy an arbitrary generic execution plan into save.

Do not retain removed player-meter compatibility fields.

## 3. `scene_note` is the initial physical continuity model

The redesign intentionally starts with **one replaceable bounded natural-language scene snapshot**, not a generic posture/contact ontology.

Purpose:

- carry ongoing pose/contact;
- carry held/placed objects;
- preserve immediate spatial relationship;
- keep active conversational/physical situation available to next Story.

Example:

```json
{
  "text": "김제나는 플레이어 무릎 위에 옆으로 앉아 있고, 보고서는 책상 오른쪽에 펼쳐져 있다.",
  "updated_turn": 12
}
```

Rules:

- one current snapshot, not accumulating fact ledger;
- grounded only in committed Story and currently supported prior note;
- rewritten as scene changes;
- uncertain detail is omitted rather than invented;
- location/presence remain separately structured;
- no parallel generic posture/contact/action state is built “for later”.

If owner manual play exposes a concrete failure that one scene_note cannot solve, propose only the smallest extra structure tied to that failing scenario.

## 4. Turn record

Preserve at least:

```text
turn_number
revision
literal_player_action
story_text
story_choices_visible_or_source_evidence
extracted_choices
structured_speaker_metadata (only if safe parser accepted)
turn_summary
mind_monitor
observation_projection
committed_at
```

Raw committed Story remains recoverable. Feedback revision replaces revision of the same chronological turn, not turn number.

The four choices belong to the turn that authored them. No prior-turn choice may become current truth.

## 5. Story authority

Story receives bounded projection of:

- exact player action;
- accepted relevant profile context;
- time;
- current location/description;
- relevant actor IDs/canon;
- relevant active nine-rule premises with their selected subject/counterparty scope;
- current scene_note;
- recent raw turns;
- older grounded memory.

Story is also responsible for writing exactly four natural next-action suggestions based on the scene it just authored.

Story does **not** receive precomputed success/failure, relationship stage, consent matrix, action taxonomy, physical execution plan, probability roll, dynamic player sexual meter, or historical non-MVP CSA semantics.

## 6. Post-Story Extract/observer

Recommended starting topology: **one small observer call after Story**, reading the completed Story once and projecting:

```text
elapsed_minutes
location_id if Story clearly moved
entered_actor_ids / exited_actor_ids with evidence
new scene_note
ordinary clothing changes with actor/evidence
choices[4] copied from Story evidence
turn_summary
mind_monitor
warnings
```

Choice rules:

- Extract copies/structures the four literal Story-authored suggestions;
- it does not invent missing replacement choices;
- partial/malformed choice extraction is local failure only;
- valid Story can commit without choice buttons, with free input remaining available.

Do not output generic relationship/event/emotion ledgers, arbitrary save paths, generic physical-action taxonomy, CSA attitude/compliance semantics, media authority, success/failure interpretation, or player sexual-meter deltas.

Exact system actions such as retained clothing-rule application bypass open observation only for their encoded finite mechanic.

Observer/MM/choice-extraction failure never causes a second Story generation.

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

Do not require a separate memory LLM every turn. Prefer observer summary + deterministic aggregation/raw fallback, or periodic compaction when material ages out of recent raw context. Choose simplest design passing `A-MEMORY-001`.

## 8. Mind Monitor

Saved with turn for history/UI consistency but not durable world truth. Next Story cannot treat prior monitor as hard fact unless narrative/state also established it. Missing monitor cannot block Commit.

## 9. Relationship/emotion

No generic relationship/emotion/event ledger in core redesign. Long-running changes first live in Story + grounded memory. Add specific structured state later only when an accepted mechanic/UI proves need.

## 10. Location/navigation

Machine truth: stable location IDs, current location, present registered actors.

Deterministic navigation only when destination/target is structurally unambiguous. Ambiguous movement remains Story-authored. No generic semantic intent router.

## 11. CSA/rules and flexible scope

Rule state is separate from chronological Story turns.

```text
Open app
→ choose one of 9 templates
→ choose supported subject scope
→ choose supported counterparty scope only where meaningful
→ validate finite scope IDs
→ atomic apply/change/remove transaction
→ durable rule state changes
→ ordinary Story turn unchanged
→ next Story reads exact template + selected scope premise
```

Scope flexibility is data, not a generic execution language.

Recommended minimal rule instance:

```json
{
  "template_id": "masturbate_for_recipient",
  "subject_scope": "female_employee",
  "counterparty_scope": "player"
}
```

A different supported subject/counterparty combination should not require a new template or new execution DSL. Unary rules omit counterparty. Unknown scope IDs fail structural validation.

Runtime supports only mechanics needed by retained nine templates. Clothing rules may synchronize exact four slots; request/open behavior remains Story-authored from exact wording + selected scope; non-MVP IDs are rejected.

If source audit proves flexible scope causes material complexity or incoherent semantics, stop and return evidence to owner rather than silently hard-fixing templates.

## 12. Removed state law

The redesign does not persist dynamic player sexual/arousal/erection/ejaculation gameplay state or a sexual-event ledger supporting it.

Static setup/profile facts remain separate from removed dynamic mechanics.

## 13. State deletion law

Every durable field must answer:

1. Which accepted scenario needs it?
2. Who is sole writer?
3. Who reads it?
4. What happens if absent?
5. Can raw Story/memory replace it more safely?

If answers are missing, do not add/retain the field.

Historical compatibility is not a product requirement unless owner explicitly authorizes save migration.
