# Story control-marker root-cause cut

## Execution identity

- Task: `story-control-marker-root-cause-v1`
- Start HEAD: `bceafd9adc0e001b42a5de29caf02485da9ea6c7`
- Branch: `company/scene-location-presence-v1`
- CURRENT_TASK start blob: `08b07401832e85475720e62a45773fecc067be4d`
- Reviewed executable/migration SHA: `c62c92e231a0f0b44a723474bd16a7dba1985124`
- Prior live failure artifact: `C:\Users\JAEWAN\AppData\Local\Temp\company-v1-canary-cut1-authority.json`

## Evidence-derived root cause

The preserved ordinary Story stream began with
`[SCENE brand_strategy_meeting_room]`. The strict shared wire parser correctly
recognizes `[SCENE]` as a bare marker and therefore deterministically rejected
the attributed form as `STORY_PROTOCOL_INVALID / Malformed Story control
marker`. The JSON `scene_id` in the Story context was available to the model,
but the ordinary Story producer contract did not explicitly say that it was
data rather than marker syntax. Opening and ordinary prompts also carried
overlapping marker instructions.

This was corrected at the repository-owned producer contract boundary, not by
relaxing the parser: one shared `FRESH_MARKER_GRAMMAR` now explicitly defines
bare `[SCENE]` and forbids scene IDs/attributes inside that marker. Both
ordinary Story and Opening prompts consume the same grammar. The strict parser
remains the single acceptance boundary and no normalization, retry, provider
change, fallback Story, or semantic gateway was added.

## Focused regressions

- Canonical structured Story marker output remains accepted by the existing
  fresh parser and stream decoder tests.
- The preserved malformed class `[SCENE brand_strategy_meeting_room]` is
  explicitly rejected at the strict wire boundary with the expected error.
- The ordinary Story prompt exposes the exact marker/data boundary.
- Opening and ordinary Story prompts share the same marker grammar.
- Existing committed `parsed_blocks` replay tests continue to prove replay
  authority without Story/parser regeneration or server-authored choices.

## Validation

- `node --test test/narrative-protocol.test.mjs test/narrative-request-contract.test.mjs`: 18/18 PASS
- `node --test test/setup-opening.test.mjs`: 24/24 PASS
- `node --test test/setup-opening.test.mjs test/setup-opening-bootstrap.test.mjs test/turn-pipeline-replay.test.mjs test/action-structured-persistence.test.mjs`: 38/38 PASS
- `npm.cmd test`: 420/420 PASS
- Changed JS/MJS syntax checks: PASS
- `git diff --check`: PASS
- TEST live gameplay/reset: 0
- DB writes/migration/DDL: 0
- API/frontend deploy: 0
- Production/manual-game access: 0
- Preserved failure artifact: unchanged and uncommitted

## Stop state

The source/test root-cause fix is ready for operator review. No live canary or
deployment was performed, and no next task was generated.

## TEST rollout evidence — 2026-08-16

The exact reviewed executable lineage containing
`b3c06f931d8bd216f217412343621781670f0722` was deployed to TEST only as
Worker `game-proxy-company-v1`, Version
`10044238-541e-4e8a-a115-fb5a6cd1ecb5`, at
`2026-08-15T21:08:34.371359Z`. Health was HTTP 200 with `ok=true` and
`edition_id=company-v1`. The live Opening migration/RPC contract was
read-only verified; no migration or DDL was applied.

The existing canary on dedicated TEST game
`2d00d76e-85b1-4cf0-8dab-a04e8a044b84` returned Opening HTTP 200/complete,
parser success, 4 raw choices, 4 canonical choices, and a complete SSE
payload with 4 parsed and 4 canonical choices. It then passed two ordinary
free-text Story/Extract/Commit turns and Turn 1 Story/Extract/Commit replay;
history contained parsed blocks for both committed turns. Final reset plus a
separate read-only context check was clean (`committed_turn=0`, idle,
setup/opening not started, no CSA, no recent turns).

The exact literal-choice round-trip is retained in the prior v9 live evidence
at `C:\Users\JAEWAN\AppData\Local\Temp\company-v1-deep-level7-v9-evidence.json`:
the selected Opening literal and submitted `player_action` matched exactly.
That evidence used ancestor `0fc509911e5bdf5aabb92fe5241a845f686bdb17`, which
is an ancestor of the reviewed executable; the current change is limited to
Story marker grammar and does not alter choice handling. Combined with the
current Opening/parser/replay evidence, the rollout is PASS.

No retry, regeneration, workaround, parser/provider change, frontend deploy,
Production access, or preserved manual-game access occurred. Preserved
artifacts remain unchanged.
