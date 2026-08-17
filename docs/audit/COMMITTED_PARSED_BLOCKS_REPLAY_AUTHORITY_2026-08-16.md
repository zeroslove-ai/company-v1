# Company v1 — committed `parsed_blocks` replay authority

## Handoff

- Task: `committed-parsed-blocks-replay-authority-v1`
- Branch: `company/scene-location-presence-v1`
- Start HEAD: `eb623c641934902edbe7ac08ea739eeb819c5547`
- Source/test commit: `7b61c9fd69930e82afc97a2dc907136ce3678beb`
- Accepted executable lineage: `0fc509911e5bdf5aabb92fe5241a845f686bdb17`
- Scope: source/test/docs only; no live TEST, DB, migration, deployment, or Production operation

## Stored-shape and caller inventory

Current gameplay writes already persist `game_actions.parsed_blocks` through
`record_story_result_owned`; `commit_company_turn` carries that same structured
value into `game_turns.parsed_blocks`. `src/api/supabase.js` reads both fields
through the existing action and turn queries.

The replay/recovery callers in `src/api/turn-routes.js` were inventoried:

| Caller | Current-format authority | Historical boundary |
| --- | --- | --- |
| `/api/history` | `game_turns.parsed_blocks` when it has an array `blocks` field | `parsePersistedNarrative(story_text)` only when usable blocks are absent |
| Story replay | `game_actions.parsed_blocks` for the complete event and metadata | Existing parser only for rows without usable blocks |
| Extract replay | `game_actions.parsed_blocks` supplies `storyBlocks` and returned `parsed_blocks` | Existing parser only for rows without usable blocks |
| Fresh Extract | The reserved action's committed structured Story blocks | Existing parser only for an action lacking usable blocks; fresh generation still uses `parseFreshNarrativeV2` |
| Commit | The reserved action's committed structured Story blocks | Existing parser only for an action lacking usable blocks |

Opening state remains a separate compatibility boundary: the current
`commit_company_opening` contract stores opening `story_text` and choices, not a
committed turn `parsed_blocks` field. Its existing persisted opening projection
was not changed by this task.

The frontend's existing persisted-block projection and the six-recent-raw plus
older-summary context contract were not changed. Raw Story remains the exact
Extract input and the visible Story presentation source; it is no longer the
parser authority when current committed structured blocks are available.

## Change

Each current committed caller now selects a usable `parsed_blocks.blocks` value
before reaching the existing `parsePersistedNarrative` boundary. No parser,
semantic fallback, gateway, or compatibility wrapper was added. Rows with
partial/empty historical structured data continue through the one existing
historical parser boundary and receive its explicit adapter warning.

## Behavioral proof

- A current pipeline replay test changes the stored raw Story after Commit while
  retaining committed structured blocks. Story replay and Extract replay return
  the committed blocks, not a projection of the changed raw text.
- History returns usable committed blocks and the persisted inner thought even
  when raw Story has a different parseable shape.
- History retains the historical parser only for a row with no usable blocks and
  verifies `legacy_narrative_adapter_used`.
- Existing pipeline, opening, frontend recovery, narrative request, and turn
  transaction tests remain green; literal choices, dialogue/ACTING, inner
  thought, summaries, and ordering contracts remain covered.

## Verification

- Targeted replay/structured-persistence set: 11/11 PASS
- Broader focused set: 80/80 PASS
- Full `npm.cmd test`: 419/419 PASS
- Changed JS/MJS syntax checks: PASS
- `git diff --check`: PASS

No DB writes, TEST reset/live access, migration/DDL, API/frontend deployment,
Production access, provider/model changes, or historical manual-game access
occurred. Preserved evidence artifacts are unchanged. PR #67 remains OPEN /
DRAFT / UNMERGED.

## Stop state

`docs/ops/CURRENT_TASK.md` is set to `WAITING_REVIEW`. No next task was
generated. Operator review is required before any later task or live operation.
