# Company Game Contract v1

## Scope and authority

This is the implementation contract for Company v1. It fixes responsibility across the current action pipeline; it does not add an endpoint, migration, model call, or deployment. `save` is the current authoritative game state, `game_turns` is the immutable committed-turn history, and the UI consumes a view model rather than raw persistence objects.

```text
Master → Context → Story named SSE → parsed Story → Extract delta
→ guarded merge → Commit → save / game_turns → Context reload → UI view model
```

## Current Context response

`POST /api/context` returns `{ ok: true, data: { context } }`. `context` is the result of `get_company_context`:

```json
{
  "game": { "id": "uuid", "edition_id": "company-v1", "title": "" },
  "master": { "data": {} },
  "save": { "committed_turn": 0, "save_revision": 0, "data": {} },
  "recent_turns": []
}
```

`save.data` has `edition: "company-v1"` and `save_schema_version: 1`. `recent_turns` is ordered oldest to newest; its last item is the newest committed turn. Missing optional fields are absent/empty data, never an instruction to delete a different persisted field.

## Story named SSE and parser

`POST /api/story` emits named SSE events:

- `meta`: `{ action_id, turn_id, expected_turn, replayed }`
- `delta`: `{ text }` one or more times
- `complete`: `{ action_id, turn_id, warnings, replayed }`
- `error`: `{ code, message, retryable }`

The worker persists the complete raw Story and parsed result before final `complete`. A replay emits the stored raw Story and makes no model call. `parseNarrative(raw)` preserves `raw` and returns `{ raw, blocks, player_status, choices, warnings }`. `blocks` contains recognized `scene` and `dialogue` objects, plus `unparsed` fallback blocks. Four choices are expected; a different count is `choices_not_exactly_four`, not a parser crash or repair trigger.

## Extract, merge, and Commit

Extract normalizes to:

```json
{
  "state_delta": {}, "outcome": "success", "evidence": {},
  "turn_summary": "", "mind_monitor": {}, "choices": [],
  "dialogue_lines": [], "warnings": []
}
```

Only allowed state-delta paths merge. Unknown paths, stale `updated_turn` patches, invalid snapshots, and absent NPC patches become warnings. Sexual-completion changes without evidence are blocking errors. The merge clones the current save, applies allowed deltas, and then makes top-level Extract choices the authoritative `nextSave.last_choices` snapshot. A non-four count warns but still commits; an empty array intentionally clears stale choices.

Commit receives `action_id` and `expected_turn`, writes the authoritative next save, and records the turn's Story, parsed blocks, Extract delta, summary, Mind monitor, and choices. The UI must not submit a full save.

## Action, replay, and recovery

- `action_id` is client-generated once per user action and persists in pending recovery metadata.
- `expected_turn` is `save.turn_state.committed_turn + 1`; a conflict is blocking and must reload Context.
- Stored Story and Extract responses replay without another LLM call.
- Recovery is derived from persisted processing status and presence of Story/Extract: retry Story, resume/retry Extract, resume/retry Commit, complete, or wait for Story.
- Warnings retain usable Story/Extract output. Blocking errors prevent the next state transition and require recovery or Context reload.

## Context reload and UI contract

The frontend reloads Context after Commit. Choices resolve in this order: non-empty `save.last_choices`, newest `recent_turns[].choices`, newest `recent_turns[].parsed_blocks.choices`, then `[]`. Mind monitor resolves from the current Extract result first, then newest turn `mind_monitor`, then `{}`.

UI renderers must not read raw save ad hoc because persistence layout, turn history, missing-field semantics, and fallback priority are contract concerns. `buildCompanyGameViewModel(context)` is a pure boundary: it does not fetch, mutate Context, touch the DOM, read global state, or create NPC state for a missing NPC.

## Field authority

| Field | Authoritative source | Missing meaning |
| --- | --- | --- |
| `story_text` | stored action, then `game_turns.story_text` | no completed Story |
| `choices` | parsed Story when valid; otherwise Extract; committed save snapshot for reload | no available next choices |
| `player_status` | parsed Story `PLAYER_STATUS` | no display status |
| `player_inner_thought` | not yet in Company contract | empty display only, no inferred thought |
| `dialogue_lines` | Extract envelope | no structured dialogue metadata |
| `npcs_present` | `save.last_npcs_present` / scene state | no inferred NPC list |
| `action_target_id` | not yet in Company contract | empty display only |
| `focal_character_id` | save | no focal character |
| `last_speaker_id` | save / parsed dialogue history | independent from focal character |
| `image_character_id` | not yet in Company contract | empty display only |
| `npc_stats` | save after guarded merge | no NPC state creation |
| `npc_relationship_state` | save after guarded merge | no relationship inference |
| `mind_monitor` | current Extract, then newest turn record | no monitor data |
| `scene_state` | save after guarded merge | no scene state |
| `clothing_state` | not yet in Company save contract | `null`, not a generated wardrobe |
| `turn_summary` | Extract, stored in turn record | no concise summary |
| image selection data | not yet in Company contract; `last_image_id` only | `null` selection |

## Unresolved items

Structured inner thought, action target, clothing state, image-character selection, and structured dialogue consumption need a later contract PR. They must not be silently introduced through UI defaults or donor global state.
