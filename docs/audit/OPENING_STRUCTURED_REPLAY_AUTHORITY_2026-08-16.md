# Company v1 — Opening structured replay authority blocker

## Execution identity

- Task: `opening-structured-replay-authority-v1`
- Start HEAD: `4d8fc0cf57c465f1be1ba3336adffc0a3f508079`
- Branch: `company/scene-location-presence-v1`
- Accepted source/test SHA: `7b61c9fd69930e82afc97a2dc907136ce3678beb`
- CURRENT_TASK start blob: `93fb83f66197665854cbd200d6cf9f725dbcc817`
- Scope used: source/test/docs only; no live TEST, DB, migration, deployment, or Production operation

## Inventory and evidence

The current Opening path is split across these boundaries:

1. `src/api/turn-routes.js` builds `parsedOpening` with
   `parseFreshNarrativeV2(raw, { master })` and returns it in the SSE `complete`
   event, but the `commit_company_opening` call sends only
   `p_background`, `p_story_text`, and `p_choices`.
2. The current persisted projection `openingTurnProjection()` reads
   `save.opening_state.story_text` and always calls
   `parsePersistedNarrative(opening.story_text, { master })`. It overlays the
   saved choices and a deterministic turn context, but has no persisted
   structured-block field to read.
3. Completed `/api/opening` replay calls that projection and therefore uses the
   same raw-prose parse authority. `/api/context` exposes that projection.
4. `src/frontend/pages/state.js` `openingHistoryTurn()` consumes the server
   projection and does not independently parse raw Opening text. This caller
   can already consume stored structured blocks once the server contract
   provides them.
5. Existing setup/opening tests use a mock `commit_company_opening` that stores
   only `story_text` and `choices`, matching the live contract.

The applied Opening RPC source confirms the storage gap. The canonical
`public.commit_company_opening(uuid, uuid, text, text, jsonb)` function validates
the background, Story, and exactly four choices, then writes
`opening_state.status`, `opening_state.story_text`, and `opening_state.choices`.
It has no `p_parsed_blocks` input and never writes structured Opening blocks.
The later canonical wrapper preserves this same five-argument contract and
grants it to `service_role`; the internal helper is not a client writer.

Therefore, changing only JavaScript cannot make current Opening structured
state durable. Encoding blocks into raw Story would rewrite evidence and would
not be a canonical structured field. Calling an internal DB helper directly
would bypass the approved RPC boundary. Both are prohibited by the task.

## Exact blocked contract

The minimum follow-up migration/RPC cut must add an approved canonical Opening
write contract carrying `p_parsed_blocks jsonb` and persist it as
`opening_state.parsed_blocks`, while preserving the existing validation,
idempotence, security-definer, safe search path, and `service_role` execution
contract. The API then needs to send the parsed Opening object through that
contract, and `openingTurnProjection()` must prefer a usable stored structured
object while retaining the existing parser only for historical rows lacking
that field. The old five-argument contract must be handled explicitly in the
migration plan; this source/test lease does not choose an overload/drop policy.

Until that additive DB/RPC contract exists, current-format Opening replay cannot
meet the required invariant that mutating raw Opening prose must not replace
usable committed structure.

## Verification

- Existing Opening/setup and frontend recovery tests: 54/54 PASS.
- No source or test changes were made in this blocked lease.
- No migration was authored or applied.
- No DB write, TEST reset/live access, Worker/frontend deployment, Production
  access, provider/model change, or historical manual-game access occurred.
- Preserved evidence artifacts are unchanged.
- PR #67 remains OPEN / DRAFT / UNMERGED.

## Stop state

`docs/ops/CURRENT_TASK.md` is set to `BLOCKED`. Operator authorization is
required for a dedicated additive Opening RPC/migration contract cut. No next
task was generated.
