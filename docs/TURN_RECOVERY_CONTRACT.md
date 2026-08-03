# Turn recovery contract

## Turn state machine

The only processing states are `idle`, `story_streaming`, `extracting`, `committing`, `ready`, `story_failed`, `extract_failed`, and `commit_failed`. Every turn carries `action_id`, `turn_id`, and `expected_turn`. The frontend accepts a new player action only from `idle` or `ready`; duplicate click and duplicate submit protection use `action_id`.

## Recovery rules

- An incomplete SSE stream is never concatenated with a newly generated Story.
- A completed Story body may continue directly to Extract after reconnection.
- A completed Extract result may continue directly to Commit after reconnection.
- If a Commit response is lost, query the action status by `action_id`; a replayed successful Commit is a success, not a new turn.
- A commit conflict preserves the current save and reports conflict recovery; it never silently overwrites state.
- Repeating the same action must not generate a second Story while an existing action is recoverable.
- Generating a second Story is allowed only after the first Story failed before a complete Story body existed and the player explicitly retries.
- Browser temporary state is reconciled from authoritative turn/action status; neither side blindly overwrites the other.
- Image and TTS failures do not alter turn recovery state.

## Required recovery cases

Fixtures must cover interrupted streaming, completed Story before Extract, completed Extract before Commit, lost Commit response, replay, conflict, and rapid duplicate input.
