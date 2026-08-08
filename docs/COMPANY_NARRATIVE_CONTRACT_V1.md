# Company narrative contract v1

## User-visible three-section output

The user-visible Story body has exactly these three sections, in this order:

```text
[1. 서사 및 행동]
[2. 플레이어 속마음]
[3. 선택지]
```

Dialogue belongs naturally inside `[1. 서사 및 행동]`; there is no separate user-visible `[DIALOGUE]` section and no requirement to emit one. Internal parser markers may preserve dialogue metadata, but they never add a fifth user section. Story is preserved verbatim even when parsing is incomplete. Named parser blocks are `[SCENE]`, `[DIALOGUE speaker="…" direction="…"]`, `[PLAYER_INNER_THOUGHT]`, and `[CHOICES]` (with `[4. 선택지]` accepted as a legacy alias for saved-turn history only). Parsed scene/dialogue blocks retain order; unparsed text remains an `unparsed` fallback block. Malformed blocks produce warnings rather than a retry, repair call, or parser throw. There is no player status-board section — the UI renders structured save state directly.

`[2. 플레이어 속마음]` and `[PLAYER_INNER_THOUGHT]` contain a current-turn-only, first-person conversational monologue of 180–500 Korean characters. It has no quotation marks, status summary, or keyword list. It is Story-authored verbatim text, not Mind Monitor data. Extract must not invent, rewrite, or extend it; Extract receives the parser value unchanged or an empty value. Its absence is empty, never a fallback to a prior turn. A future UI may render it in a separate slot.

The prose target is 800–1000 Korean characters for A (light confirmation, immediate reaction, simple state check), 1000–1500 for B (ordinary dialogue request, conflict, concrete action, or work progress), and 1200–2000 for C (location movement, multiple NPC growth, important CSA execution, or large state change), excluding Context, action, and choices. These are writing targets, not hard validation gates. A turn ordinarily covers immediate reaction, first development, further information/action, and a concrete scene outcome. During general-NPC interaction or an NPC-present scene, aim for at least three NPC utterances; that is likewise not a retry/repair gate. Dialogue is rendered as speaker name, brief concrete direction, then line text.

Story never selects the player's next action. The player chooses four Story choices or provides free input. A CSA never blocks free player input.

## Choices and display status

Exactly four parsed Story choices are authoritative. Extract choices are a fallback only when Story did not yield exactly four. Invalid count is `choices_not_exactly_four`; Story raw text and available blocks still render.

Player status may display only supplied data: player name, department, position, current location, Day/game time, committed turn, guarded turn changes, active global CSA count or names, and arousal only when actually present. Personal suggestions are forbidden. Missing time, ejaculation progress, turn changes, or other future fields remain unavailable rather than being invented.
