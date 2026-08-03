# Company narrative contract v1

## Story shape and authorship

Story is the authored narrative source and is preserved verbatim even when parsing is incomplete. Named blocks are `[SCENE]`, `[DIALOGUE speaker="…" direction="…"]`, `[PLAYER_INNER_THOUGHT]`, `[PLAYER_STATUS]`, and `[CHOICES]`. Parsed scene/dialogue blocks retain order; unparsed text remains an `unparsed` fallback block. Malformed blocks produce warnings rather than a retry, repair call, or parser throw.

`[PLAYER_INNER_THOUGHT]` is Story-authored verbatim text, not Mind Monitor data. Extract must not invent it. Its absence is an empty value, never a fallback to old thought. A future UI may render it in a separate slot.

The prose target is 800–1000 Korean characters for A (light confirmation, immediate reaction, simple state check), 1000–1500 for B (ordinary dialogue request, conflict, concrete action, or work progress), and 1200–2000 for C (location movement, multiple NPC growth, important CSA execution, or large state change), excluding Context, action, and choices. These are writing targets, not hard validation gates. A turn ordinarily covers immediate reaction, first development, further information/action, and a concrete scene outcome. During general-NPC interaction or an NPC-present scene, aim for at least three NPC utterances; that is likewise not a retry/repair gate. Dialogue is rendered as speaker name, brief concrete direction, then line text.

Story never selects the player's next action. The player chooses four Story choices or provides free input. A CSA never blocks free player input.

## Choices and display status

Exactly four parsed Story choices are authoritative. Extract choices are a fallback only when Story did not yield exactly four. Invalid count is `choices_not_exactly_four`; Story raw text and available blocks still render.

Player status may display only supplied data: player name, department, position, current location, Day/game time, committed turn, guarded turn changes, active global CSA count or names, and arousal only when actually present. Personal suggestions are forbidden. Missing time, ejaculation progress, turn changes, or other future fields remain unavailable rather than being invented.
