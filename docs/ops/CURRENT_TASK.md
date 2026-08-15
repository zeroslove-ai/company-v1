# Company v1 — CURRENT TASK

Status: READY
Task ID: deep-level7-live-acceptance-v7
Updated: 2026-08-15
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Starting point

Repository: `zeroslove-ai/company-v1`.
Branch: `company/scene-location-presence-v1`.
Canonical PR: #67, base `main`, must remain OPEN / DRAFT / UNMERGED.

Reviewed gameplay executable:
`53710caa6a2255dc2b8d1aab47053df5f9d6fe06`.

Reviewed SSE harness ancestor:
`97d0fc840a3e99717ca75c07e7055f18944398d1`.

Fresh optional-observation fail-open review: Issue #68 comment `5301920394`.
Previous V6 terminal: Issue #68 comment `5301754574`.
Previous V6 review: Issue #68 comment `5301876748`.

TEST Supabase: `fmcrspgxstsmxxsmkeee`.
Disposable TEST game: `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`.
Historical manual game `78fb1d94-266f-455a-bda4-7656cc2370c1` must not be accessed or mutated.

## Purpose

Resume the same deep Level-7 live acceptance after removing the deterministic `OPEN_FACT_UNKNOWN_ID` whole-turn blocker.

This is acceptance/proof, not another architecture or harness-building task. Exercise the real Story -> Extract -> Commit -> committed readback/recovery path deeply enough to either prove the current architecture or stop on the next real deterministic defect.

Do not retry/regenerate until a favorable semantic result appears. Do not add a new parser, gateway, semantic gate, fallback taxonomy, or repair LLM.

## Mandatory preflight

1. Fresh-fetch Issue #68. If this exact task already has a terminal or operator review, stop without duplicate work.
2. Verify PR #67 remains base `main`, OPEN / DRAFT / UNMERGED, and current HEAD descends from reviewed executable `53710caa...` and reviewed SSE harness `97d0fc840...`.
3. Distinguish docs-only branch HEAD from executable identity.
4. Verify the dedicated TEST game identity exactly. Never use the historical manual game.
5. Verify the previously reviewed TEST-only Level-7 acceleration seam; do not alter Production progression and do not manufacture gameplay state with ad-hoc DB writes.
6. All new evidence artifacts must go to OS TEMP or another path outside the repository.

## Authorized TEST operations

This task authorizes only the TEST operations needed for this acceptance:

- verify the currently deployed TEST API Worker identity;
- if needed, deploy the exact reviewed executable lineage containing `53710caa6a2255dc2b8d1aab47053df5f9d6fe06`; do not deploy unrelated branch drift;
- use the already-reviewed TEST-only Level-7 acceleration seam on disposable TEST game `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`;
- reset only that disposable TEST game before/after the bounded run as needed;
- run the existing reviewed canary/live acceptance harness and read TEST action/turn/save evidence required for proof;
- use already-existing diagnostics if required, then clean them before terminal.

No Production access. No manual-game access. No migration/DDL under this task. If a DB contract/DDL change is required, stop BLOCKED rather than applying it.

## Scenario coverage

Acceptance is scenario-driven, not a fixed turn count. Continue only while needed to cover meaningful depth.

### A. Core spine and choices

- Setup/Opening and ordinary free-text conversation.
- Provider-authored exactly four literal choices persist/read/render; selecting one becomes the ordinary next player input string.
- Story, Extract, Commit, committed readback and replay agree on action/turn identity.

### B. Open semantic memory

- At least one meaningful fact outside old event/relation/emotion/posture/sexual taxonomies is narrated by Story, grounded in exact Story evidence, committed, and available to later context.
- Mixed valid + invalid optional observations must preserve valid facts and complete the turn.
- Unknown/malformed optional fact/projection/block observation must fail open locally and must not erase the Story or other valid observations.
- No success fact may be manufactured directly from player input.

### C. CSA Level-7 behavior

- Exercise a strong CSA context naturally, including compliance/resistance or institutional-rule tension.
- CSA supplies rule identity/context/lifecycle/applicability rather than a finite physical execution grammar.
- Institutional compliance remains separate from consent, comfort, affection, trust, relationship, and emotion.

### D. Physical/clothing/intimate continuity

- Exercise posture/contact wording outside former finite semantic enums and verify narrative/open memory is not rejected because no old taxonomy value exists.
- Verify compact clothing continuity if clothing changes occur; compact clothing remains a narrow product projection, not the universe of physical meaning.
- If an intimate/sexual path occurs in the bounded scenario, verify the narrative fact/memory survives independently of image-family classification.

### E. Memory depth and recovery

- Continue beyond the immediate recent raw-Story window so at least one earlier committed fact must survive through durable summary/open-observation context rather than only the latest raw stories.
- Refresh/recovery must reconstruct the same durable context.
- Replay/readback must be idempotent; no duplicate fact creation from replay.

### F. Media boundary

- Observe media/image selection when naturally applicable.
- Finite image catalogs/action families/general-sex pools are presentation adapters only.
- Missing, alternate, or unclassifiable image selection may change the image result but must never reject the turn, delete the narrative fact, or redefine whether the action occurred.

## Failure discipline

- One bounded scenario. No retry/regeneration to obtain a pass.
- On the first deterministic failure, preserve HTTP status, raw SSE/terminal event, action status/error, relevant Story/Extract/Commit payload identity, committed TEST DB state, deployed Worker identity, and TEMP evidence paths; then stop.
- Classify the failure before proposing a fix: deployment identity / harness transport / Story / Extract / Commit / persisted read-replay / context-memory / UI-media / DB contract.
- If source or migration changes are required, do not patch under this acceptance task. Terminal BLOCKED with root-cause evidence for operator review.

## Acceptance criteria

PASS only if the exercised scenario proves the real committed gameplay spine and no hidden finite semantic gate is required for the meaning exercised.

Test counts are supporting evidence only, not acceptance proof.

Report exact scenario/turns, Story evidence, Extract observations/warnings, committed facts/summaries, recovery/replay evidence, Level-7/CSA behavior, clothing/media behavior if exercised, exact deployed identity, and final TEST cleanup.

## Completion

1. Reset only disposable TEST game `2d00d76e-85b1-4cf0-8dab-a04e8a044b84` to the documented clean baseline after the bounded run.
2. Clean/disable any temporary diagnostic toggle used.
3. Set CURRENT_TASK to `WAITING_REVIEW` in a docs-only completion commit.
4. Post one immutable terminal report to Issue #68 with PASS/BLOCKED/FAILED, exact executable/deployed identities, evidence paths, TEST cleanup proof, and explicit zero Production/manual-game access.
5. Stop. Do not patch a discovered defect and do not create the next task yourself.

## Forbidden

- new branch/PR; reopen #65/#66; merge/Ready/rebase/squash/force-push;
- Production access;
- any access/mutation/reset of historical manual game `78fb1d94-266f-455a-bda4-7656cc2370c1`;
- provider/model/temperature/token changes;
- retry/regeneration/fuzzy repair/parser relaxation/new parser/semantic hard gate;
- ad-hoc direct DB mutation to manufacture gameplay state outside the reviewed TEST-only Level-7 acceleration seam;
- new semantic enum/allowlist/fallback/gateway to make acceptance pass;
- treating image/media classification as authority over whether a narrative fact occurred;
- editing historical applied migrations or immutable terminal evidence.
