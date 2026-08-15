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

## Literal-choice closure evidence — BLOCKED — 2026-08-16

The acceptance-only follow-up used the already deployed reviewed Worker
`game-proxy-company-v1`, Version
`10044238-541e-4e8a-a115-fb5a6cd1ecb5`; no redeployment occurred. The live
Opening migration/RPC contract remained read-only verified.

The single bounded run used dedicated TEST game
`2d00d76e-85b1-4cf0-8dab-a04e8a044b84`. Setup passed with setup ID
`30267c31-cbea-4042-bd22-9c1c82f43c0b`. Opening returned HTTP 200 and a
complete SSE event with four literal choices, then the strict parser stopped
on provider output `[DIALOGUE speaker_id="heroine3"]` with
`Unknown Story speaker_id: heroine3`. No selected-literal turn or free-text
turn was attempted after this first deterministic failure.

Evidence is preserved at
`C:\Users\JAEWAN\AppData\Local\Temp\company-v1-story-marker-literal-choice-live-closure.json`.
The dedicated game was reset once through the canonical API and independently
read back clean (`committed_turn=0`, idle, setup/opening not started, no CSA,
no recent turns/history). No retry, regeneration, provider/model workaround,
parser relaxation, fuzzy repair, semantic fallback, source/runtime/test
change, migration/DDL, deployment, Production access, or preserved manual
game access occurred. This is BLOCKED pending operator review; it is not a
runtime hotfix authorization.

## Speaker identity projection investigation — BLOCKED / no runtime source defect

- Task: `story-speaker-identity-projection-root-cause-v1`
- Start HEAD: `67d0f87d3c8e4af411e8513a5ed728ca00a34de0`
- Source/test SHA: `6446b9873ee14865a9f292e5795d4f547c3690af`
- Reviewed executable SHA: `b3c06f931d8bd216f217412343621781670f0722`

The source trace found no stale `heroine3` alias or template producer. The
current Company edition catalog registers `heroine3`; `masterFromEdition()`
projects the character catalog into the parser master, and the Opening
projection exposes the active canonical ID. A focused regression proves that
`heroine3` is accepted through that registered path while `heroine3_alias`
remains rejected by the strict parser. No parser alias, fuzzy repair, retry,
provider change, or runtime workaround was added.

The preserved live closure artifact still records an outer
`Unknown Story speaker_id: heroine3` diagnostic, but it does not preserve the
probe implementation and cannot be independently parsed as valid JSON in the
current worktree. Its available raw evidence is therefore contradictory to
the source behavior and is insufficient to establish the exact live failure
boundary. This is recorded as a deterministic evidence contradiction / BLOCKED
finding, not as authorization for a runtime fix.

Changed source: 0. Changed test: `test/setup-opening.test.mjs` only.
Live TEST/gameplay/reset, DB writes, migration/DDL, deployments, Production,
and preserved-artifact mutations: 0.
