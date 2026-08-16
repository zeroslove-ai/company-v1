# Company v1 — CURRENT TASK

Status: READY
Task ID: opening-provider-exact-four-root-cause-v1
Updated: 2026-08-16
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Starting point

Repository: `zeroslove-ai/company-v1`.
Branch: `company/scene-location-presence-v1`.
Canonical PR: #67, base `main`, must remain OPEN / DRAFT / UNMERGED.

Previous operator review: `5306072891` — `setup-opening-world-authority-test-rollout-v1` accepted as accurate BLOCKED evidence.

Current branch HEAD at registration parent: `66fca08ffa8425270ad3b032d27c57d2c4455823`.
Reviewed Setup/Opening world-authority source/test/migration SHA remains `1a221665f91b352607724912ba8a06250ac60fc5`.
TEST migration `20260816045221 / company_v1_setup_opening_world_authority` is already applied and immutable.

TEST Supabase project: `fmcrspgxstsmxxsmkeee`.
Dedicated TEST game: `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`.
Preserved manual game `78fb1d94-266f-455a-bda4-7656cc2370c1` is forbidden. Production is forbidden.

## Proven blocker

The world-authority migration itself passed its intended live boundary: SQL semantic setup catalogs are removed, registered-ID integrity is dynamic, ghost primary ID is rejected before mutation, canonical Scene remains valid, and the dedicated TEST game was finally reset clean.

The first valid application Opening request then failed deterministically at HTTP 200 SSE terminal `invalid_request: opening choices must contain exactly four items` with `retryable=false`. Provider visible deltas existed, but no committed Opening Story/parsed blocks were available because persistence correctly rejected the non-four choice shape. No retry or workaround was attempted.

Exactly-four is an intentional UI/presentation shape. It is not permission for the server to author semantic fallback choices, silently truncate/pad provider output, retry/regenerate, or relax the contract.

## Objective

Find the earliest owning cause of the Opening non-four provider choice result and restore one coherent provider-authored exact-four literal choice path without adding a second semantic choice author or a compatibility gateway.

## Required work

1. Freeze exact START HEAD and verify PR #67 is still base `main`, OPEN / DRAFT / UNMERGED. Verify all executable deltas since the last reviewed source SHA before changing anything.
2. Trace the complete Opening choice path end-to-end in source/tests:
   - Opening prompt/instruction construction;
   - provider response/stream assembly;
   - fresh Opening parser and choice extraction;
   - exact-four structural validation;
   - Opening commit/persistence;
   - recovery/UI projection of committed literal choices.
3. Inventory every place that can author, rewrite, filter, dedupe, truncate, pad, default, fallback, or validate Opening choices. For each finite choice mechanism use REMOVE-OR-PROVE.
4. Determine why a provider-visible Opening response can reach the commit boundary with a non-four choice set under the current canonical prompt/parser contract. Do not infer from the error string alone; prove the producer/parser mismatch in source or a focused deterministic fixture.
5. Preserve the target contract:
   - provider authors exactly four literal choice strings;
   - parser/persistence preserve those literal strings;
   - UI renders those same strings;
   - selecting one sends that exact literal as player input;
   - free text remains ordinary gameplay.
6. Delete any duplicate server-authored semantic fallback choice prose/metadata or stale Opening-only choice authority proven unnecessary. Do not replace it with another fallback layer.
7. If producer instructions are duplicated, contradictory, stale, or permit ambiguous choice syntax, consolidate them at the earliest owning boundary. Reuse the canonical fresh marker/choice grammar rather than creating a third parser or special Opening parser generation.
8. Keep exactly-four as structural presentation validation. Do not relax to 0..N, silently slice/pad, synthesize alternatives, retry/regenerate, or change provider/model/temperature/tokens.
9. Add focused tests that prove:
   - a canonical provider Opening with exactly four literals survives prompt/parse/persist projection unchanged;
   - malformed/non-four provider output fails structurally without server-authored semantic replacement;
   - no deterministic fallback prose is introduced;
   - ordinary Story choice contract is not regressed;
   - literal identity is preserved through committed Opening recovery where current source can test it without live DB mutation.
10. Run targeted invariant tests plus the relevant broader suite. Test count alone is not acceptance; inspect failures against the canonical contract.
11. Classify stale tests as KEEP / REWRITE / DELETE. Do not add runtime compatibility to keep obsolete fallback assumptions green.
12. If source inspection proves the non-four result is purely provider nondeterminism with no contradictory/insufficient producer contract and no repository defect, do not invent a patch. Record BLOCKED evidence explaining the proof and STOP for operator review.

## Architecture constraints

- One durable domain -> one canonical writer.
- Provider is the semantic author of choices; server owns exact-four structural validation and literal persistence, not alternative semantic prose.
- No retry/regeneration, provider/model/config change, fuzzy repair, truncation/padding, deterministic semantic fallback choices, new parser generation, parser relaxation, regex semantic gate, or arbitrary save patch.
- Repository/application owns setup/world semantic catalogs; TEST DB world-authority migration is already applied and must not be rolled back or edited.
- `save.scene` remains sole Scene/location/presence authority.
- Story/Extract open-ended meaning must not be restricted by choice taxonomy.
- CSA institutional state remains separate from consent/comfort/affection/emotion.
- Media/image catalogs and sexual image families are protected presentation adapters; do not change or delete them in this task.
- TEST-only Level 7 acceleration seam is protected and unchanged.

## Authorized operations

Authorized:
- source/test/docs edits within this exact root-cause scope;
- read-only Git/PR inspection;
- focused and broader local tests;
- docs/audit evidence updates;
- one docs-only terminal status commit/report.

Not authorized:
- TEST gameplay/LLM calls;
- TEST DB writes/reset/migration/DDL;
- API/frontend deploy;
- Production access;
- any access/mutation/reset of preserved manual game;
- provider/model/temperature/token changes;
- retry/regeneration;
- new branch/PR, merge, Ready, rebase, squash or force-push.

## Acceptance

PASS only if a repository-owned root cause is proven and corrected at the earliest authority boundary while preserving provider-authored exactly-four literal choices with no server semantic fallback, or if deletion-only proof shows a duplicate/stale choice authority can be removed safely. Focused tests must prove literal identity and structural non-four rejection.

If no repository defect is provable, BLOCKED evidence is an acceptable terminal result and no speculative runtime patch is allowed.

## Completion

On PASS or deterministic BLOCKED evidence:
- set this file to `WAITING_REVIEW` in one docs-only completion commit;
- report START_SHA, executable FINAL_SHA if any, exact changed files, root-cause proof, deleted/retained choice authorities, targeted/broader tests, DB/deploy/Production operations (expected zero), and FINAL_DOCS_SHA;
- post one immutable terminal report to Issue #68;
- STOP for operator review. Do not create the next task yourself.
