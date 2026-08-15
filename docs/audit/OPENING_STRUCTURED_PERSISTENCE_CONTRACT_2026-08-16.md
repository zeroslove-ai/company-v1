# Company v1 — Opening structured persistence contract

## Execution identity

- Task: `opening-structured-persistence-contract-v1`
- Start HEAD: `625ec976dce59b8e86d877a29eeb9a01aaf6b99d`
- Branch: `company/scene-location-presence-v1`
- CURRENT_TASK start blob: `4894a7e5c468620ee1197f7b2f37325859cd4d85`
- Source/test/migration commit: `c62c92e231a0f0b44a723474bd16a7dba1985124`
- Migration authored: `supabase/migrations/20260816000100_company_v1_opening_structured_persistence.sql`

## Caller and authority inventory

- The only active runtime Opening writer caller is `src/api/turn-routes.js`.
  It now sends the server-produced `parsedOpening` as `p_parsed_blocks` in the
  canonical `commit_company_opening` RPC payload.
- `test/setup-opening.test.mjs` contains the local behavior mock for that RPC;
  it now requires a structured object with an array `blocks` field and stores
  it in `opening_state.parsed_blocks`.
- `src/frontend/pages/state.js` consumes the server `opening_turn` projection
  and does not parse Opening raw Story text.
- The old five-argument writer has zero active runtime callers. The authored
  additive migration explicitly drops
  `commit_company_opening(uuid, uuid, text, text, jsonb)` before creating the
  six-argument canonical writer. Historical verification/preflight artifacts
  retain their old signature references as immutable evidence of the prior
  contract; they are not runtime callers and were not edited.

## Authored canonical contract

The new migration defines:

`commit_company_opening(uuid, uuid, text, text, jsonb, jsonb)`

with the final argument `p_parsed_blocks jsonb`. It preserves the existing
background/story/exact-four literal-choice checks, game/setup identity checks,
turn-zero and idempotence behavior, and the existing Opening scene/clothing
transaction. It adds only structural validation that `p_parsed_blocks` is an
object containing an array `blocks`, persists it beside `story_text` and
`choices`, uses `SECURITY DEFINER` with `search_path = public, pg_temp`, and
grants execution only to `service_role` after revoking the client roles.

No narrative semantic enum, allowlist, regex, fuzzy matcher, retry,
regeneration, provider change, or new parser was added.

## Behavioral proof

- The API mock asserts the exact `p_parsed_blocks` RPC payload equals the
  committed Opening structured projection.
- Current-format Opening replay prefers stored `opening_state.parsed_blocks`.
  The regression mutates persisted raw Opening prose after commit and confirms
  replay returns the original committed structured blocks/raw field.
- Historical Opening rows without structured blocks continue through the one
  existing inert `parsePersistedNarrative` fallback boundary.
- Existing tests preserve literal four-choice stability through Opening commit,
  context projection, replay, and frontend projection.
- Ordinary-turn structured persistence and six-recent-raw/older-summary memory
  behavior remain unchanged.

## Verification

- Targeted Opening/replay/frontend/reset/turn set: 75/75 PASS
- Full `npm.cmd test`: 419/419 PASS
- Changed JS/MJS syntax checks: PASS
- `git diff --check`: PASS
- Migration applied: 0
- DB writes/TEST reset/live gameplay: 0
- API/frontend deploy: 0
- Production/manual-game access: 0
- Preserved evidence artifacts: unchanged and uncommitted

This is source/test/migration authoring only. The authored migration is not
live and requires operator review before any TEST application or deployment.

## Stop state

`docs/ops/CURRENT_TASK.md` is set to `WAITING_REVIEW`. No next task was
generated. PR #67 remains OPEN / DRAFT / UNMERGED.

## TEST rollout result: BLOCKED

The exact reviewed migration was applied once to TEST:
`20260816000100_company_v1_opening_structured_persistence`.
Live readback confirmed the six-argument writer, removal of the five-argument
writer, SECURITY DEFINER, `search_path = public, pg_temp`, service_role-only
execution, and a function body that stores `opening_state.parsed_blocks`.

The exact reviewed executable from `c62c92e231a0f0b44a723474bd16a7dba1985124`
was deployed as Worker `game-proxy-company-v1`, version
`4660b79f-8ff3-40f5-ae1f-cd8134219f7c`, at
`2026-08-15T19:11:34.108703Z`; `/health` returned HTTP 200 with
`edition_id=company-v1`.

The bounded canary used the dedicated TEST game
`2d00d76e-85b1-4cf0-8dab-a04e8a044b84`. Setup and Opening completed, but the
first ordinary Story stopped at the first deterministic protocol error:
`story_protocol_invalid` / `Malformed Story control marker`.
The action was `e0fcda84-3130-4b19-9bcd-5851f9662ae6`; no Extract or Commit
was attempted. The preserved failure artifact is
`C:\Users\JAEWAN\AppData\Local\Temp\company-v1-canary-cut1-authority.json`.
The canonical final reset returned HTTP 200 with `ok=true`; the artifact
records `committed_turn=0`, `save_revision=975`, `processing_status=idle`,
and no recent actions after reset. No retry was performed.

This rollout is blocked pending operator review. No source, migration, or
provider workaround was made.
