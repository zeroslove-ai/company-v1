# Company v1 — CURRENT TASK

Status: WAITING_REVIEW
Task ID: cut2-opening-speaker-id-contract-closure
Updated: 2026-08-14
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution queue for Company v1.

## Why this task exists

The immediately prior live-acceptance task `cut2-navigation-live-acceptance-location-normalized` stopped FAILED before navigation because Opening emitted an invalid dialogue identity:

`Unknown Story speaker_id: hero5ine`

Accepted evidence from that run:

- reviewed executable remains `72012e00685bb12ed0defe66f52df44613cc1a20`
- deployed TEST API Worker Version remains `726420b6-5850-41c1-bc4b-178fffb9238d`
- setup succeeded and the opening plan location was `brand_strategy_office`
- Opening reached the Story wire decoder and failed fail-closed on unknown `speaker_id=hero5ine`
- no retry/regeneration occurred
- complete Worker-facing Opening SSE evidence was preserved outside the repository at `C:\Users\JAEWAN\AppData\Local\Temp\company-cut2-navigation-location-normalized-72012e0.json`, SHA-256 `7ef5e53b0d2be518c89c1f786c3ac9cb0e56fed78dd9edfa5f988ebd4bd1ddc2`
- navigation/Extract/Commit assertions were not reached and no claim is made that they passed or failed
- final dedicated TEST reset was independently verified clean at committed_turn=0, save_revision=870, actions=0, turns=0, setup/not_started, opening/not_started, Scene v1 setup/location null/empty presence
- PR #67 remained OPEN / DRAFT / UNMERGED
- Scene Stage B/migration/frontend/Production/manual-playtest/runtime-source edits remained zero

Independent source inspection also established a separate generation-contract asymmetry:

- `story-wire-protocol.js` correctly rejects every DIALOGUE `speaker_id` not present in the canonical identity directory
- `opening-prompt.js` tells the model to use an exact registered ID, but the actual allowed IDs are only implicit as object keys inside `active_character_canon`; there is no dedicated `allowed_speaker_ids` whitelist that the model is told to copy verbatim
- the parser/wire decoder must remain strict; fuzzy correction of `hero5ine` to `heroine5`, name inference, retry, or fallback dialogue would hide the protocol violation

This task closes only that explicit Opening generation-contract gap. It does not claim that the missing whitelist is the only possible cause of every future provider typo.

## Binding authority and operating rules

Before work, read and obey:

1. `/CURRENT_TRUTH.md`
2. `/AGENTS.md`
3. `/docs/audit/company-v1-current-truth-2026-08-13/09_CURRENT_TRUTH.md`
4. `/docs/audit/company-v1-current-truth-2026-08-13/10_SOLE_WRITER_DECISION.md`
5. this file
6. Issue #68 operator review for `cut2-navigation-live-acceptance-location-normalized`

Binding principles:

- current Git/source/live TEST DB/deployed identity outrank completion prose
- one durable domain has one canonical writer
- no compatibility code for stale tests
- no retry/provider/model/semantic hard gate to hide structural defects
- historical applied migrations are immutable
- unknown speaker IDs remain invalid; do not introduce fuzzy identity repair
- manual playtest evidence is preserved

## Repository / identity guard

Repository: `zeroslove-ai/company-v1`
Expected branch: `company/scene-location-presence-v1`
Task-registration parent HEAD: `466d3436068108146ac4797d83d56aab3e90b395`
Reviewed executable lineage before this task: `72012e00685bb12ed0defe66f52df44613cc1a20`
PR: #67 — must remain OPEN / DRAFT / UNMERGED.

Before edits:

1. verify current branch/HEAD and ancestry
2. verify all commits after `72012e0...` before this task are docs/workflow-only
3. verify no operator review already handled this exact task identity
4. verify PR #67 remains Draft/Open/Unmerged
5. do not touch preserved manual playtest evidence

## Goal

Make the fresh Opening generation contract explicitly enumerate the only dialogue speaker IDs that may be emitted for that opening, while preserving strict parser/wire validation.

Target contract:

> Every `[DIALOGUE speaker_id="..."]` in a fresh Opening must copy one ID verbatim from an explicit `allowed_speaker_ids` list supplied in the Opening request payload. The list contains `player` plus the actual active opening character IDs carried in `active_character_canon`. Names, near-matches, reordered strings, invented IDs, and inactive/unlisted IDs are not valid substitutes.

## Required source inspection

Inspect at minimum:

- `src/engine/opening-prompt.js`
- `src/engine/gameplay-state.js` (`buildActiveCharacterCanon`)
- `src/engine/story-wire-protocol.js`
- `src/engine/fresh-narrative-parser.js`
- current tests that own the fresh Opening prompt contract and Story identity validation

Confirm before patching:

1. current Opening payload carries active IDs only implicitly through `active_character_canon`
2. there is no explicit `allowed_speaker_ids` whitelist already supplied to the model
3. wire/parser identity validation already rejects unknown IDs exactly and should remain unchanged

If any of these are false at current HEAD, STOP BLOCKED with evidence instead of forcing this design.

## Required implementation

Prefer the smallest correct change at the Opening generation boundary.

Expected shape:

- build `active_character_canon` once from the validated opening active IDs
- derive an explicit deterministic `allowed_speaker_ids` from `player` plus the keys actually present in that active canon
- include that list in the fresh Opening user payload
- strengthen `FRESH_OPENING_OUTPUT_PROTOCOL` / durable Opening rules so every DIALOGUE `speaker_id` must be copied verbatim from `allowed_speaker_ids`
- explicitly prohibit transformed/near-match IDs and character names in the `speaker_id` attribute
- preserve plain narrative as valid; dialogue is not mandatory merely to satisfy this task
- preserve existing active-character canon, Opening facts, player-private premise, exact-four choice behavior, and current Story protocol

Do not broaden the whitelist to every registered character merely because the parser directory knows them. Fresh Opening dialogue should use the active opening cast plus `player` unless current canonical source proves a different explicit invariant.

## Forbidden implementation patterns

- no parser or wire-decoder relaxation
- no fuzzy correction such as `hero5ine -> heroine5`
- no name-to-ID inference at the control-marker boundary
- no fallback/synthetic dialogue
- no retry/regeneration
- no provider/model/temperature/token/config change
- no third parser generation
- no navigation or Scene reducer change
- no unrelated Opening/setup/world-authority cleanup in this task

## Required regression tests

Add or strengthen focused tests proving:

1. built fresh Opening request contains explicit `allowed_speaker_ids`
2. the list contains `player` plus exactly the active opening character IDs actually carried in `active_character_canon`, with deterministic dedupe/order
3. an unrelated registered but inactive character is not added merely because it exists in the master character catalog
4. the system/output protocol explicitly requires verbatim copying from `allowed_speaker_ids`
5. valid registered/allowed IDs still parse normally
6. the observed malformed ID shape `hero5ine` remains rejected as `STORY_PROTOCOL_INVALID / Unknown Story speaker_id: hero5ine`; no compatibility repair is introduced
7. existing Story prompt visible-body, narrative protocol, navigation-authority, and Opening contract regressions remain green

Avoid whole-prompt snapshots. Test semantic contract elements rather than incidental prose.

## Validation

Required:

- focused Opening prompt + Story identity/wire/parser tests
- navigation authority regression tests
- full `npm test` as regression signal if source/tests changed
- syntax checks for modified JS/MJS
- `git diff --check`
- report exact focused/full counts, but do not treat raw count as correctness proof

## Allowed

- minimal `src/engine/opening-prompt.js` generation-contract change
- focused tests
- docs/audit update only if needed to describe verified source contract after validation
- docs-only CURRENT_TASK completion state
- normal Git commit/push on the existing branch
- Issue #68 lease / terminal report

## Forbidden operations

- API/frontend deploy
- TEST live setup/Opening/Story/Extract/Commit/reset or DB writes in this task
- migration edits/apply, including Scene Stage B
- Production access
- manual playtest mutation/reset
- provider/model/config changes
- retry/regeneration
- parser/wire relaxation or fuzzy speaker repair
- navigation authority / Scene reducer changes
- broad Cut 3+ work
- PR Ready/merge
- historical migration edits

## Success criteria

Success requires all of the following:

1. pre-patch Opening prompt/parser contract asymmetry is demonstrated at current HEAD
2. fresh Opening payload exposes a deterministic explicit `allowed_speaker_ids` whitelist derived from actual active opening canon plus `player`
3. prompt requires exact verbatim IDs from that list
4. unknown/near-match IDs remain fail-closed at the existing wire/parser boundary
5. no fuzzy repair/fallback/retry/provider change
6. focused regressions pass
7. navigation regressions remain green
8. full suite has no untriaged canonical-contract regression
9. PR #67 remains Draft/Open/Unmerged
10. deployment/TEST write/reset/migration/Production/manual-playtest mutation = 0
11. exact executable candidate SHA is reported separately from any later docs-only descendant

## Stop boundary

Do not deploy the candidate and do not rerun live navigation acceptance in this task.

After success:

- set this task to `Status: WAITING_REVIEW`
- commit/push source+tests and the completion state
- post terminal report to Issue #68
- STOP for operator review

The next operator task, if accepted, will deploy the exact reviewed executable and resume the location-normalized navigation live acceptance with complete Worker-facing SSE evidence and no retry.

Success phrase:

`CUT 2 OPENING SPEAKER ID CONTRACT CLOSED — AWAITING OPERATOR REVIEW`

## Completion report to Issue #68

First lines:

```text
TASK_ID: cut2-opening-speaker-id-contract-closure
STATUS: COMPLETE | BLOCKED | FAILED
START_SHA: <sha>
FINAL_SHA: <sha>
BRANCH: company/scene-location-presence-v1
```

Then include:

- task blob SHA / lease comment
- pre-patch prompt/wire identity asymmetry evidence
- exact files changed
- exact allowed-speaker derivation rule
- tests added/changed
- focused + full suite results
- executable candidate SHA
- docs-only descendant SHA if any
- PR #67 state
- TEST writes/reset = 0
- deployment = 0
- migration/Scene Stage B = 0
- frontend deploy = 0
- Production access = 0
- manual playtest mutation/reset = 0
- exact STOP state
