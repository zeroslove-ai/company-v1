# Company v1 — CURRENT TASK

Status: READY
Task ID: cut2-opening-speaker-id-contract-cleanup
Updated: 2026-08-14
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution queue for Company v1.

## Why this task exists

The prior task `cut2-opening-speaker-id-contract-closure` produced candidate `a919baf87d92e841e64b731576ccb176d5745570` and correctly closed the fresh Opening speaker-ID generation contract:

- fresh Opening payload now exposes `allowed_speaker_ids = ['player', ...Object.keys(active_character_canon)]`
- prompt requires every DIALOGUE speaker_id to copy one of those IDs verbatim
- inactive/unlisted/near-match IDs remain invalid
- parser/wire strictness remains fail-closed
- `hero5ine` remains rejected exactly
- no retry, fuzzy repair, provider/model change, parser relaxation, deploy, TEST write, migration, Production, or manual-playtest mutation occurred
- focused tests reported 48/48 and full suite 445/445; GitHub Actions run for `a919baf...` is independently verified success
- PR #67 remains OPEN / DRAFT / UNMERGED

Independent operator inspection found one unacceptable new test-data contamination in `test/setup-opening.test.mjs`: the newly added semantic-contract test committed the player name literal as mojibake `源?섎뒛` instead of a valid intentional fixture string. This does not invalidate the runtime speaker-whitelist implementation, but newly introduced mojibake must not be accepted merely because tests pass.

## Binding authority

Read and obey:

1. `/CURRENT_TRUTH.md`
2. `/AGENTS.md`
3. `/docs/audit/company-v1-current-truth-2026-08-13/09_CURRENT_TRUTH.md`
4. `/docs/audit/company-v1-current-truth-2026-08-13/10_SOLE_WRITER_DECISION.md`
5. this file
6. Issue #68 operator review for `cut2-opening-speaker-id-contract-closure` at candidate `a919baf...`

Current source/Git facts outrank report prose. No compatibility code for stale tests. No provider/model/retry/semantic hard gate. Historical migrations immutable. Manual playtest evidence is preserved.

## Repository / identity guard

Repository: `zeroslove-ai/company-v1`
Expected branch: `company/scene-location-presence-v1`
Required parent candidate: `a919baf87d92e841e64b731576ccb176d5745570`
PR: #67 — must remain OPEN / DRAFT / UNMERGED.

Before editing:

1. verify current HEAD is a docs-only descendant of `a919baf...` created only by this CURRENT_TASK registration
2. verify `src/engine/opening-prompt.js` at current HEAD is executable-equivalent to `a919baf...`
3. verify no operator review already handled this cleanup task identity
4. preserve all untracked evidence and manual-playtest data untouched

If any runtime/config/migration/test change other than the exact task-registration commit is present after `a919baf...`, STOP BLOCKED.

## Goal

Remove only the newly introduced mojibake test literal while preserving the already-reviewed runtime implementation exactly.

## Required change

In `test/setup-opening.test.mjs`, in the test:

`fresh Opening protocol requires verbatim allowed speaker IDs without making dialogue mandatory`

replace only the corrupted player `name` fixture value `源?섎뒛` with a valid deliberate fixture string such as `김하늘`.

Do not change the test assertion semantics. Do not alter runtime source.

## Required proof

Before and after patch, prove:

- `src/engine/opening-prompt.js` is byte-identical to `a919baf...`
- `src/engine/story-wire-protocol.js` and `src/engine/fresh-narrative-parser.js` remain unchanged
- the only non-CURRENT_TASK repository delta from `a919baf...` is that one test-fixture literal
- focused Opening/narrative/navigation contract tests pass
- full `npm test` passes as regression signal
- modified JS/MJS syntax checks pass
- `git diff --check` passes

Do not treat raw test count as correctness proof.

## Forbidden

- runtime/source behavior edits
- parser/wire changes
- retry/regeneration
- fuzzy identity repair
- provider/model/config change
- API/frontend deploy
- TEST live setup/Opening/Story/Extract/Commit/reset or DB writes
- migration/Scene Stage B apply/edit
- Production access
- manual playtest mutation/reset
- navigation/Scene authority edits
- broad Cut 3+ work
- PR Ready/merge
- historical migration edits
- deleting or modifying preserved evidence

## Success criteria

1. corrupted literal no longer exists in the newly added test
2. replacement fixture is valid intentional UTF-8 text
3. runtime source is byte-identical to `a919baf...`
4. focused/full validation passes
5. PR #67 remains Draft/Open/Unmerged
6. all forbidden operations remain zero

After success:

- set this task to `Status: WAITING_REVIEW`
- commit/push the one test-literal fix plus completion-state update
- report both the new branch HEAD and the unchanged runtime executable identity `a919baf...` separately
- post terminal report to Issue #68
- STOP

Success phrase:

`CUT 2 OPENING SPEAKER ID TEST CONTAMINATION CLEANED — AWAITING OPERATOR REVIEW`
