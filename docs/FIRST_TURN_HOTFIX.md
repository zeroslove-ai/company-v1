# First-turn choices and Extract latency hotfix

## Incident record

- Development game ID: `11111111-1111-4111-8111-111111111111`
- First committed action ID: `64df8e22-54f5-43fc-ada5-623f6e7a91b0`
- Committed turn: 1
- Observed action duration: approximately 113 seconds

The first public action committed successfully. Extract and `game_turns.choices` contained four choices, but the authoritative save's `last_choices` remained empty. A Context reload therefore removed the browser choice buttons. The game data has already been recovered from the latest committed turn; this hotfix performs no reset, migration, or additional database write.

## Changes

- Persist top-level Extract choices into `nextSave.last_choices`, including an intentional empty snapshot, and warn when the count is not four.
- Prefer parsed Story choices over Extract-generated choices before persisting the Extract result.
- Disable DeepSeek thinking for non-streaming Extract JSON, require JSON-object output, cap Extract output at 2048 tokens, and surface `extract_truncated` for length-limited responses.
- Keep the Extract prompt concise and require Korean human-readable output, a minimal delta, concise summary and Mind monitor, and no Story repetition.
- Restore choices from the authoritative save or the latest committed turn after Context refresh, restore Mind monitor from that latest turn, and render Story choices immediately while Extract and Commit continue.

## Deployment and validation

- API Worker: `game-proxy-company-v1` version `e524b347-21c3-481e-afb3-9ba70f649d03`
- Frontend Worker: `gamebuilder-company-v1` version `f6fe2da9-629e-4d68-97b9-b68ad87043b4`
- API and frontend Wrangler dry-runs passed.
- Remote Context smoke passed: turn 1, authoritative save choices 4, latest committed choices 4, and latest Mind monitor present.
- Public browser DOM shows Turn 1, four choices, Mind monitor, and API-connected status.
- Automatic Story, Extract, and Commit calls: 0.
- Additional Supabase writes: 0.

The next live gameplay validation is reserved for the user: Turn 2.
