# Feedback revision contract

## Scope

Version 1 may revise only the latest committed turn. Feedback is not a player action and must preserve the original player action. A revision starts from the original pre-turn save and creates a new revision ID.

## Required behavior

- Preserve the original turn as a `superseded` record; do not delete it.
- The same feedback request is idempotent.
- Re-run only Story, Extract, and Commit for the selected latest turn.
- Prevent duplicate state patches, relationship changes, and event-ledger entries from the replaced result.
- Do not revise a historical turn if a later turn exists; defer that capability to a separate rewind feature.
- On feedback-generation failure, retain the current valid Commit unchanged.
- Image and TTS failure never make a revision fail.
