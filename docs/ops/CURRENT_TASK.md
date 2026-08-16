# Company v1 — CURRENT TASK

Status: READY
Task ID: canary-opening-literal-choice-roundtrip-v1
Updated: 2026-08-16
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Starting point

Repository: `zeroslove-ai/company-v1`.
Branch: `company/scene-location-presence-v1`.
Canonical PR: #67, base `main`, must remain OPEN / DRAFT / UNMERGED.

Previous operator review: `5306431826` accepted `opening-exact-four-live-evidence-closure-v1` as accurate BLOCKED evidence, not feature success.
Terminal docs SHA: `2db1370765ba6a47c6124e7140fa43ec2c8fb7b1`.
Reviewed gameplay/runtime lineage for the blocked live run: `1a221665f91b352607724912ba8a06250ac60fc5`.

TEST project: `fmcrspgxstsmxxsmkeee`.
Dedicated TEST game: `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`.
Preserved manual game `78fb1d94-266f-455a-bda4-7656cc2370c1` is forbidden. Production is forbidden.

## Proven state

- One bounded live Opening attempt produced exactly four non-empty unique provider-authored literal choices.
- The existing canary then used its own free-text Turn 1 instead of selecting one returned Opening literal unchanged.
- Therefore the remaining gap is acceptance-harness capability: exact Opening literal -> next `player_action` round-trip is not yet proven.
- Independent TEST readback after reset is clean: committed_turn=0, processing idle, setup/opening not_started, zero turns/actions, canonical `save.scene` present, legacy Scene mirrors absent.
- No repository choice-authority defect, provider defect, parser defect, or persistence defect is proven by this gap.

## Objective

Extend the existing canonical live-playtest canary/harness so an acceptance scenario can select one provider-returned Opening choice literal exactly and submit that exact string as the next ordinary `player_action`, without inventing a second gameplay protocol, rewriting choice semantics, or adding runtime compatibility behavior.

This is a harness/source-test cut only. Do not perform live TEST gameplay, DB mutation/reset, deployment, or migration in this task.

## Required work

1. Freeze START HEAD and verify #67 remains base `main`, OPEN / DRAFT / UNMERGED. Inventory executable deltas since the last reviewed canary harness lineage before editing.
2. Trace the current canonical canary flow from Setup -> Opening response/parsed choices -> ordinary action submission.
3. Reuse the existing HTTP/SSE decoder, API routes, action reservation, Story -> Extract -> Commit flow, and replay checks. Do not create a second client protocol or parser.
4. Add the narrowest harness capability to choose one literal from the actual Opening-returned canonical/provider-authored choices and pass that exact string unchanged into the normal next-turn action path.
5. Preserve literal identity byte-for-byte/string-for-string. Do not prepend numbering, labels, metadata, action tags, semantic IDs, summaries, or normalization beyond transport-required JSON encoding.
6. The harness must not author fallback choices, truncate/pad choices, retry/regenerate Opening, or substitute a hardcoded semantic choice when the returned list is unavailable/invalid.
7. If the requested literal index/value is unavailable, fail the harness clearly before ordinary gameplay rather than silently switching to free text.
8. Keep free-text mode intact as a separate ordinary gameplay path; do not make all canary runs choice-driven.
9. Add focused tests proving:
   - exact returned Opening literal is the submitted `player_action`;
   - Korean/unicode/punctuation/spacing survives unchanged;
   - no numbering/metadata rewrite occurs;
   - invalid/missing selection fails closed in the harness only;
   - existing free-text mode remains unchanged;
   - replay/idempotence request identity is not altered by the new harness option;
   - no provider/model/parser/runtime semantic behavior changes.
10. Remove any now-redundant ad-hoc literal-choice test helper if the new canonical harness path supersedes it; do not preserve stale duplicate harness code for tests.
11. Run focused canary/transport/action tests, full suite as regression signal, changed-source syntax checks, and `git diff --check`.
12. Do not modify Story/Extract/Commit runtime semantics, DB functions/migrations, setup/world authority, scene authority, progression, CSA semantics, clothing, sexual/media/image adapters, or frontend gameplay behavior.

## Architecture constraints

- Provider authors exactly four literal choice strings; server/harness may select and transport one, never author or semantically rewrite it.
- Exactly-four is presentation shape, not semantic taxonomy.
- One gameplay protocol and one canonical action writer.
- No retry/regeneration, provider/model/temperature/token change, parser relaxation/new parser, fuzzy repair, semantic regex gate, fallback/truncate/pad, or arbitrary save patch.
- TEST-only Level 7 acceleration seam remains protected and unchanged.
- Media/image catalogs including sexual image families remain presentation adapters and must not gate narrative facts.
- Production progression remains unchanged.

## Authorized operations

Authorized:
- source/test/docs edits limited to canonical canary/harness and its focused tests;
- read-only Git/PR/source inspection;
- focused/full tests and static checks.

Not authorized:
- TEST live gameplay/setup/opening/reset;
- TEST DB writes or migrations/DDL;
- API/frontend deployment;
- Production access;
- any access to preserved manual game;
- runtime gameplay semantic changes;
- provider/model/config changes or retries;
- new branch/PR, merge, Ready, rebase, squash, force-push.

## Acceptance

PASS only if the existing canonical canary can deterministically consume an actual returned Opening choice and submit the exact same literal through the normal action path, while free-text behavior and all runtime authority boundaries remain unchanged.

If achieving this would require changing gameplay/runtime semantics rather than the harness boundary, STOP BLOCKED and document the exact coupling instead of patching runtime.

## Completion

On PASS or deterministic BLOCKED evidence:
- set CURRENT_TASK to `WAITING_REVIEW` in one docs-only completion commit after any source/test commit;
- report exact START SHA, source/test SHA, changed harness files, focused/full tests, syntax/diff checks, and FINAL_DOCS_SHA;
- confirm live TEST/DB/deploy/Production/manual-game operations were zero;
- post one immutable terminal report to Issue #68;
- STOP for operator review. Do not generate the next task yourself.
