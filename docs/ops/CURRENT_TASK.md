# Company v1 — CURRENT TASK

Status: WAITING_REVIEW
Task ID: opening-structured-persistence-test-rollout-v1
Updated: 2026-08-16
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Starting point

Repository: `zeroslove-ai/company-v1`.
Branch: `company/scene-location-presence-v1`.
Canonical PR: #67, base `main`, must remain OPEN / DRAFT / UNMERGED.

Accepted source/test/migration contract:
- task `opening-structured-persistence-contract-v1`
- operator review `5303762857` = ACCEPTED
- reviewed source/test/migration SHA `c62c92e231a0f0b44a723474bd16a7dba1985124`
- docs-only reviewed HEAD before this registration `39bbb76763ee5d185868801000ea2557cc467065`
- additive migration `20260816000100_company_v1_opening_structured_persistence.sql`

The reviewed migration replaces the zero-active-caller five-argument Opening writer with canonical `commit_company_opening(uuid, uuid, text, text, jsonb, jsonb)` carrying server-produced `p_parsed_blocks`. Current-format replay prefers committed `opening_state.parsed_blocks`; historical rows lacking it retain the single inert persisted-parser fallback.

Historical manual game `78fb1d94-266f-455a-bda4-7656cc2370c1` is READ-ONLY and must not be accessed or mutated.
Production access is forbidden.

## Objective

Roll the exact reviewed Opening structured persistence contract into TEST and prove the live DB/API/replay boundary end-to-end. This is a bounded TEST rollout/acceptance cut, not a new redesign cut.

Do not change the reviewed contract merely to make rollout pass. If migration application, live RPC catalog, exact-SHA deployment, Setup/Opening, replay/recovery, or reset reveals a deterministic defect, preserve evidence and STOP for operator review instead of layering compatibility, retry, parser, provider, or semantic-gate fixes.

## Required execution order

1. Freeze and verify exact Git ancestry before mutation:
   - #67 remains base `main`, OPEN / DRAFT / UNMERGED;
   - current HEAD is a descendant of reviewed source/test/migration SHA `c62c92e231a0f0b44a723474bd16a7dba1985124` with only docs/ops/audit changes after it;
   - migration file content at execution HEAD is byte-equivalent to reviewed migration content.

2. Verify live TEST pre-state before applying anything:
   - migration `20260816000100_company_v1_opening_structured_persistence` is not already applied, or if already applied unexpectedly, STOP with exact evidence;
   - current live TEST Opening writer is the old five-argument signature before apply;
   - record its ACL/security/search_path facts.

3. Apply exactly the reviewed additive migration to TEST. Do not edit historical migrations and do not create a replacement migration in this lease.

4. Immediately verify live TEST post-state:
   - migration is present exactly once;
   - six-argument `commit_company_opening(uuid, uuid, text, text, jsonb, jsonb)` exists;
   - old five-argument signature no longer exists;
   - canonical writer is SECURITY DEFINER with safe `search_path = public, pg_temp`;
   - execute privilege is service_role-only according to the intended policy;
   - function body persists `opening_state.parsed_blocks` in the same canonical transaction with story/choices and preserves setup/turn-zero/idempotence/scene/clothing behavior.

5. Deploy the exact reviewed API executable needed by the new RPC contract to TEST. The deployed gameplay source must correspond to reviewed source/test/migration SHA `c62c92e231a0f0b44a723474bd16a7dba1985124`; docs-only descendants are not new executable identity. Do not deploy frontend unless source proof shows it is actually required by this contract; server projection/frontend consumer was already reviewed as compatible.

6. Verify actual deployed Worker identity/source equivalence before live gameplay. Do not infer deployment success from CLI exit alone.

7. Run one bounded dedicated TEST Setup -> Opening -> replay/recovery acceptance using existing canonical harness/helpers where possible. Do not use or mutate the preserved manual game.

Acceptance must prove:
- Setup reserves/commits normally.
- Opening Story produces provider-authored exactly four literal choices and the server commits them unchanged.
- `opening_state.parsed_blocks` is present after commit and corresponds to the server-produced Opening structured projection.
- `/api/context` / Opening replay uses committed structured blocks.
- Current-format replay does not require raw Opening reparse; where the existing harness can prove it safely, demonstrate structured replay authority without manufacturing a second writer.
- Recovery/replay does not call Story again for an already committed Opening.
- Ordinary first gameplay turn after Opening can proceed through Story -> Extract -> Commit without regression.
- Scene/location/presence, compact clothing, progression/TEST Level-7 seam, CSA rule identity/lifecycle, sexual/media adapters, and recent-six/older-summary memory architecture are not altered by this rollout.
- Image/media selection remains presentation-only and cannot gate narrative/Extract facts.

8. Reset only the dedicated TEST acceptance game using the canonical reset path and verify clean reset. Never reset or mutate `78fb1d94-266f-455a-bda4-7656cc2370c1`.

## Failure policy

At the first deterministic defect:
- capture exact HTTP/SSE/action status/live DB/deployed identity evidence relevant to the failure;
- do not retry for a favorable provider result;
- do not change provider/model/temperature/tokens;
- do not add compatibility overloads, fuzzy repair, parser relaxation/new parser, semantic enums/gates, or direct DB state manufacturing;
- reset the dedicated TEST game if safe and possible without destroying failure evidence;
- mark CURRENT_TASK `WAITING_REVIEW` with BLOCKED/FAILED evidence and STOP.

A transient external failure may be classified as such only with concrete evidence; do not hide deterministic defects behind retry.

## Authorized operations

Authorized in TEST only:
- apply migration `20260816000100_company_v1_opening_structured_persistence.sql` exactly as reviewed;
- deploy exact reviewed API executable required by the contract;
- create/use one dedicated TEST acceptance game through existing supported paths;
- Setup/Opening/replay/recovery/one ordinary turn acceptance;
- canonical reset of that dedicated TEST game;
- docs/audit completion evidence inside #67.

Not authorized:
- Production access of any kind;
- access/mutation/reset of preserved manual game `78fb1d94-266f-455a-bda4-7656cc2370c1`;
- source/runtime redesign in this lease;
- new migration or editing any migration;
- frontend deploy unless proven strictly required and reported before doing it;
- new branch/PR, merge, Ready, rebase, squash, force-push;
- direct DB mutation to manufacture gameplay/progression state;
- provider/model/temperature/token changes or retries/regeneration for favorable output.

## Completion

On success:
- report exact registration/start HEAD, reviewed executable/migration SHA, deployed Worker identity, migration live identity, live RPC signature/ACL/security/search_path proof, dedicated TEST game ID, Opening parsed_blocks/replay proof, first ordinary turn result, and final reset proof;
- distinguish executable SHA from any docs-only completion SHA;
- set CURRENT_TASK to `WAITING_REVIEW` in a docs-only completion commit;
- post one immutable terminal report to Issue #68;
- STOP for operator review.

## Execution outcome: BLOCKED

- Start HEAD: `ca25605082cd14991320f18df939b87326aed8e3`
- Reviewed executable/migration SHA: `c62c92e231a0f0b44a723474bd16a7dba1985124`
- Migration applied exactly once: `20260816000100_company_v1_opening_structured_persistence`
- Live canonical writer: six arguments; old five-argument writer absent;
  SECURITY DEFINER; `search_path=public, pg_temp`; service_role-only
- Worker: `game-proxy-company-v1`, version
  `4660b79f-8ff3-40f5-ae1f-cd8134219f7c`; health HTTP 200;
  `edition_id=company-v1`
- Dedicated TEST game: `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`
- Setup and Opening passed. First ordinary Story failed with
  `story_protocol_invalid` / `Malformed Story control marker` on action
  `e0fcda84-3130-4b19-9bcd-5851f9662ae6`.
- Extract/Commit were not attempted. No retry or runtime/provider workaround
  was made.
- Preserved failure artifact:
  `C:\Users\JAEWAN\AppData\Local\Temp\company-v1-canary-cut1-authority.json`
- Canonical final reset passed HTTP 200/`ok=true`; clean state recorded as
  `committed_turn=0`, `save_revision=975`, `processing_status=idle`, with no
  recent actions.
- API redeploy count: 1 exact reviewed executable; frontend deploy: 0;
  Production access: 0; migration apply count: 1 authorized migration;
  source/migration/provider changes after review: 0.
- This task is blocked pending operator review. No next task was generated.

On blocked/failed execution, report the same identity fields available plus the first decisive failure evidence and STOP without creating a workaround task yourself.
