# Company v1 — CURRENT TASK

Status: WAITING_REVIEW
Task ID: story-speaker-identity-projection-root-cause-v1
Updated: 2026-08-16
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Starting point

Repository: `zeroslove-ai/company-v1`.
Branch: `company/scene-location-presence-v1`.
Canonical PR: #67, base `main`, must remain OPEN / DRAFT / UNMERGED.

Operator review `5304651320` accepted the preceding `story-marker-literal-choice-live-closure-v1` terminal as accurate BLOCKED evidence, not feature success.

Reviewed gameplay/source executable remains `b3c06f931d8bd216f217412343621781670f0722`.
The preceding terminal docs SHA is `0e05b6a03c8387bac901065b2fd875bdb181b045`.

Deterministic live evidence: dedicated TEST Setup succeeded and Opening returned HTTP 200/complete plus four provider-authored literal choices, but strict parsing stopped on provider output `[DIALOGUE speaker_id="heroine3"]` with `Unknown Story speaker_id: heroine3`. No literal-choice turn was attempted after that first failure. Dedicated TEST game was reset clean. No retry/provider/parser workaround occurred.

Historical manual game `78fb1d94-266f-455a-bda4-7656cc2370c1` is READ-ONLY and must never be accessed or mutated. Production access is forbidden.

## Objective

Find and fix the root cause of the Story speaker identity mismatch without weakening registered stable identity integrity.

Trace the complete boundary:
Setup/catalog canonical registered character IDs -> Story/Opening prompt identity projection -> any heroine aliases/template labels -> provider DIALOGUE `speaker_id` -> fresh parser registered-ID set.

Determine whether `heroine3` comes from a stale producer alias/template, missing canonical-ID projection, inconsistent Setup/Open world projection, or another deterministic wiring defect. Fix the earliest owning boundary and delete superseded alias/template/compatibility logic when proof permits.

## Required work

1. Verify exact #67 topology and ancestry. Separate reviewed executable SHA from docs-only descendants.
2. Inventory every active source/test producer or consumer of Story `speaker_id`, including Setup/Opening world projection, heroine slot/alias labels, prompt examples/templates, registered NPC IDs, parser validation, and replay/recovery.
3. Establish the canonical registered identity set supplied for the failing Opening path and explain exactly why `heroine3` could be emitted while the parser rejected it.
4. Apply the smallest architecture-first source/test correction at the owning producer/projection boundary. Preferred outcomes are deletion of stale alias/template output or projection of canonical registered IDs. Do not teach the parser to accept arbitrary aliases and do not add fuzzy repair.
5. REMOVE-OR-PROVE any finite alias map/template vocabulary encountered. Stable registered character IDs are legitimate integrity state; semantic heroine labels are not automatically legitimate runtime identity.
6. Add focused regression proof that Story/Opening producer instructions expose only canonical registered speaker IDs and that an unregistered `heroine3`-style identity remains rejected by the strict parser.
7. Verify ordinary current-format replay/recovery and committed `parsed_blocks` authority are unchanged.
8. Run focused tests plus the full relevant local suite. Test count alone is not proof.

## Architecture constraints

- Registered stable character identity remains a finite integrity boundary.
- No parser relaxation/new parser, compatibility alias acceptance, fuzzy repair, regex cleanup, fallback Story, retry/regeneration, provider/model/temperature/token changes, or semantic hard gate.
- Story authors open-ended narrative meaning; identity validation only proves that a named speaker is a registered character.
- Do not reintroduce relation/general-event/emotion/work semantic ledgers or semantic choice metadata/fallbacks.
- Exactly-four choices remain provider-authored literal strings; free text remains ordinary gameplay.
- Recent six raw Story + older natural-language `turn_summary` remains continuity authority.
- CSA remains institutional rule/context, not consent/comfort/affection/emotion authority.
- Scene/location/presence, compact clothing UI continuity, TEST-only Level-7 seam, sexual state/media adapters, image catalogs/pools/families, and TTS are protected actual-consumer systems. Media classification must never gate whether Story/Extract facts occurred.
- Historical applied migrations are immutable.

## Authorized operations

Authorized:
- source/test/docs changes on existing branch `company/scene-location-presence-v1` only;
- local focused/full tests;
- read-only repository/history inspection.

Not authorized:
- live TEST gameplay, DB write/reset, migration/DDL, API/frontend deployment;
- Production access;
- any access/mutation/reset of preserved manual game `78fb1d94-266f-455a-bda4-7656cc2370c1`;
- provider/model/temperature/token changes or retries/regeneration;
- new branch/PR, merge, Ready, rebase, squash, force-push.

If the root cause requires a new DB/migration/live contract rather than source/test correction, do not invent compatibility code: preserve evidence and STOP as BLOCKED for operator review.

## Completion

On success or deterministic BLOCKED finding:
- report root cause, exact source/test SHA, changed files, removed/proven identity alias boundaries, parser invariant, focused/full test results, and exact ancestry;
- set CURRENT_TASK to `WAITING_REVIEW` in a docs-only completion commit;
- post one immutable terminal report to Issue #68;
- STOP for operator review.

## Execution result — BLOCKED / identity evidence contradiction

- Start CURRENT_TASK blob SHA: `5b1919953b93d599630fcf0bea5924c8825e007c`
- Start HEAD: `67d0f87d3c8e4af411e8513a5ed728ca00a34de0`
- Reviewed executable SHA: `b3c06f931d8bd216f217412343621781670f0722`
- Source/test SHA: `6446b9873ee14865a9f292e5795d4f547c3690af`
- Expected branch: `company/scene-location-presence-v1`

Source tracing established that `heroine3` is a registered canonical
character ID. `masterFromEdition()` combines the current character and
general-NPC catalogs, Opening projects active canonical IDs, and the strict
parser accepts registered `heroine3` while rejecting `heroine3_alias`.
No stale alias/template or source runtime defect was found, so no parser
relaxation, provider workaround, retry, or runtime change was made.

The preserved live artifact's outer `Unknown Story speaker_id: heroine3`
diagnostic is contradictory to the source behavior and does not preserve the
probe implementation needed to locate the live boundary. This task is
therefore BLOCKED for operator review rather than a runtime-fix authorization.

Changed files: `test/setup-opening.test.mjs` and the audit/current-truth/task
documents. Runtime source/content/migrations unchanged. Focused tests passed
55/55; `npm.cmd test` passed 421/421; syntax and `git diff --check` passed.
Live TEST/gameplay/reset, DB writes, migration/DDL, deployment, Production,
and preserved-artifact mutation were all 0. The preserved artifact remains
unmodified and uncommitted. This task is complete only as a WAITING_REVIEW
blocked finding; do not generate or start a next task.
