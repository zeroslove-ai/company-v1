# Company v1 — CURRENT TASK

Status: READY
Task ID: story-control-marker-root-cause-v1
Updated: 2026-08-16
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Starting point

Repository: `zeroslove-ai/company-v1`.
Branch: `company/scene-location-presence-v1`.
Canonical PR: #67, base `main`, must remain OPEN / DRAFT / UNMERGED.

Previous rollout `opening-structured-persistence-test-rollout-v1` was accepted as BLOCKED evidence by operator review `5303999559`.

Live TEST facts established by that rollout:
- additive migration `20260816000100_company_v1_opening_structured_persistence` is applied exactly once;
- canonical Opening writer is six-argument `commit_company_opening(uuid, uuid, text, text, jsonb, jsonb)`;
- old five-argument writer is absent;
- writer is SECURITY DEFINER with `search_path=public, pg_temp` and service_role-only execute;
- `opening_state.parsed_blocks` is persisted by the canonical transaction;
- exact reviewed API executable `c62c92e231a0f0b44a723474bd16a7dba1985124` is deployed to TEST as Worker version `4660b79f-8ff3-40f5-ae1f-cd8134219f7c`;
- Setup and Opening passed on dedicated TEST game, but first ordinary Story failed with `story_protocol_invalid` / `Malformed Story control marker` for action `e0fcda84-3130-4b19-9bcd-5851f9662ae6`;
- no Extract/Commit followed that failure and the dedicated TEST game was reset cleanly.

Historical manual game `78fb1d94-266f-455a-bda4-7656cc2370c1` is READ-ONLY and must not be accessed or mutated. Production access is forbidden.

## Objective

Find and fix the root cause of the ordinary Story `Malformed Story control marker` failure at the existing Story production / fresh parser contract boundary. This is a source/test architecture cut. Do not perform live TEST gameplay, DB writes/reset, migration/DDL, or deploy in this lease.

This failure class has appeared before. Inventory the actual current producer prompt/output contract, transport assembly, fresh Story parser control-marker grammar, parser callers, and tests before changing code. Determine whether the defect is a contradictory/obsolete producer instruction, duplicate control syntax, parser ownership mismatch, transport corruption, or another deterministic repository defect.

## Architecture constraints

- Fresh Story parser remains the generation contract; do not create a third parser generation.
- Committed `parsed_blocks` remain replay authority for current-format committed turns/Opening.
- Do not relax parsing merely to accept malformed or ambiguous control syntax.
- Do not add retry/regeneration, provider/model/temperature/token changes, fuzzy repair, regex cleanup of provider output, fallback Story, compatibility parser, or a new semantic/protocol gateway.
- Prefer deleting contradictory/obsolete control-marker instructions or duplicate grammar ownership over adding normalization.
- Exactly-four provider-authored literal choices remain presentation shape; server must not become a semantic choice author.
- Story remains open-ended narrative; do not introduce event/relation/emotion/posture/sexual semantic enums or allowlists.
- CSA remains natural institutional rule context, not a finite physical execution grammar.
- Media/image catalogs and sex/general image pools are presentation adapters and are out of scope; do not delete or alter them.
- TEST Level-7 acceleration seam, scene/location/presence, compact clothing, sexual state/media adapters, and recent-six/older-summary memory architecture are out of scope unless direct caller proof shows the control-marker defect originates there.

## Required work

1. Verify exact ancestry and #67 topology before edits. Current HEAD must descend from reviewed executable/migration SHA `c62c92e231a0f0b44a723474bd16a7dba1985124`; executable changes after it must be inventoried rather than assumed absent.
2. Trace the complete ordinary Story boundary:
   - prompt/template instructions that define control markers;
   - provider request assembly and any streaming/text concatenation;
   - fresh parser marker recognition and rejection path producing `Malformed Story control marker`;
   - Opening vs ordinary Story differences;
   - committed/replay readers to ensure the fix does not reintroduce raw reparse authority.
3. Search current source/tests for every accepted/forbidden control-marker spelling and duplicate grammar definition. REMOVE-OR-PROVE any obsolete finite marker vocabulary or duplicated parser contract.
4. Reconstruct the deterministic failure class from preserved report evidence and repository tests without replaying the live provider call. If the exact raw failed Story is not available in repository evidence, build the smallest source-level fixture representing the malformed marker class already identified by the parser error; do not invent a different failure.
5. Fix the earliest repository-owned root cause. Prefer one authoritative grammar/instruction boundary and delete superseded producer/parser assumptions in the same cut.
6. Add focused regression tests proving:
   - canonical ordinary Story output accepted by the producer contract parses into expected blocks/choices;
   - the previously failing malformed-marker class is prevented at the repository-owned producer/contract boundary or deterministically rejected for the correct reason without a workaround;
   - Opening and ordinary Story share compatible structured block semantics where intended;
   - current-format replay continues to prefer committed `parsed_blocks` and does not call Story/parser again;
   - no server-authored semantic choice fallback is introduced.
7. Run focused tests, full suite, syntax checks for changed JS/MJS, and `git diff --check`.

If investigation proves the malformed marker was solely provider noncompliance with a single clear current contract and there is no contradictory repository-owned instruction/assembly/parser defect, do not add retries or parser tolerance. Mark BLOCKED with exact source/test proof for operator review.

## Authorized operations

Authorized:
- source/test/docs changes inside existing #67 branch only;
- deletion/consolidation of contradictory or duplicate Story control-marker contract code/tests;
- focused/full local tests and syntax/diff checks;
- docs/audit completion evidence.

Not authorized:
- TEST live gameplay, DB write/reset, migration/DDL, or deployment;
- Production access;
- access/mutation/reset of preserved manual game `78fb1d94-266f-455a-bda4-7656cc2370c1`;
- provider/model/temperature/token changes, retry/regeneration;
- parser relaxation/new parser/fuzzy cleanup/fallback Story;
- new branch/PR, merge, Ready, rebase, squash, force-push;
- changes to applied historical migration `20260816000100_company_v1_opening_structured_persistence.sql`.

## Completion

On success or deterministic BLOCKED finding:
- distinguish executable source/test SHA from any docs-only completion SHA;
- report exact files changed/deleted, root cause, parser/producer ownership decision, focused/full test results, and invariant checks;
- set CURRENT_TASK to `WAITING_REVIEW` in a docs-only completion commit;
- post one immutable terminal report to Issue #68;
- STOP for operator review.
