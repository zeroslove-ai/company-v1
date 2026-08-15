# Company v1 — CURRENT TASK

Status: READY
Task ID: deep-level7-live-acceptance-v6
Updated: 2026-08-15
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Accepted starting point

Repository: `zeroslove-ai/company-v1`.
Branch: `company/scene-location-presence-v1`.
Canonical PR: #67, base `main`, must remain OPEN / DRAFT / UNMERGED.

Accepted gameplay executable:
`0627f01d5118e3a936d9280fb8f889644137550c`.

Accepted canary safety executable:
`521e8acf6c519ea05b92a45caef2f1ff601ad27c`.

Accepted SSE harness executable:
`97d0fc840a3e99717ca75c07e7055f18944398d1`.
Operator review: Issue #68 comment `5301710693`.

Previous V5 rerun was BLOCKED only by the now-closed local SSE evidence-reader defect. Do not reinterpret that blocker as a gameplay/provider defect.

TEST Supabase: `fmcrspgxstsmxxsmkeee`.
Disposable TEST game: `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`.
Preserved manual game `78fb1d94-266f-455a-bda4-7656cc2370c1` is historical READ-ONLY evidence and must not be accessed or reset.

## Purpose

Resume the deep Level-7 live acceptance that V5 could not reach. This is an acceptance/proof task, not a source redesign task.

Use the reviewed gameplay executable plus the accepted canary/SSE harness. Exercise the real Story -> Extract -> Commit -> committed readback spine deeply enough to prove or precisely block on the next real defect.

Do not add another harness/parser/gateway. Do not retry until a stochastic pass appears.

## Mandatory preflight

1. Fresh-fetch Issue #68 and verify this exact task has no terminal/review already.
2. Verify PR #67 is OPEN / DRAFT / UNMERGED, base `main`, and HEAD is this registration descendant.
3. Verify the executable ancestry includes accepted gameplay `0627f01...`, canary safety `521e8acf...`, and SSE harness `97d0fc8...`; distinguish docs-only HEAD from executable identities.
4. Verify TEST-only Level-7 acceleration seam remains the previously reviewed seam and does not alter Production progression.
5. Verify dedicated TEST game identity exactly. Never use the preserved manual game.
6. All new evidence output must use OS TEMP or another path outside the repository.

## Authorized live operations

This task authorizes only the TEST operations required for this acceptance:
- deploy/verify the exact accepted API executable identity if the currently deployed TEST Worker is not already that identity;
- use the reviewed TEST-only Level-7 acceleration seam;
- reset only disposable TEST game `2d00d76e-85b1-4cf0-8dab-a04e8a044b84` before/after the bounded run as needed;
- run explicit canary/live acceptance modes and read TEST DB/action/turn/save evidence required for proof;
- temporary diagnostics only if already-existing reviewed diagnostic support is required, with cleanup proof before terminal.

No Production access. No manual-game access. No migration unless a missing DB contract is discovered; if DDL is required, STOP rather than applying it under this task.

## Scenario coverage

Acceptance is scenario-driven, not a fixed turn count. Continue only while needed to cover the following without artificial repetition:

A. Core spine
- Setup/Opening and ordinary free-text conversation.
- Provider-authored exactly four literal choices persist/render/read back; selected literal can become ordinary next player input.
- Story, Extract, Commit and committed recovery/replay agree on action/turn identity.

B. Open semantic observations
- At least one meaningful arbitrary fact outside old closed event/relation/emotion/posture taxonomies is narrated by Story, grounded by exact Extract evidence, committed, and available to later context.
- Unknown optional narrow projection must fail open without erasing the underlying open fact.
- Do not manufacture success directly from player input.

C. CSA at Level 7
- Exercise a strong CSA context naturally, including compliance/resistance or institutional-rule tension.
- Verify CSA supplies rule identity/context/lifecycle/applicability rather than a finite physical execution grammar.
- Institutional compliance must remain distinct from consent/comfort/affection/trust/emotion.

D. Physical/clothing/intimate continuity
- Exercise posture/contact wording outside former finite enums and verify narrative/open-fact continuity is not gated by an old taxonomy.
- Verify compact clothing UI continuity if clothing changes occur; richer facts must not be dropped because compact projection cannot classify them.
- If an intimate/sexual path occurs in the bounded scenario, verify the narrative fact and memory do not depend on sexual image-family classification.

E. Memory depth
- Continue beyond the immediate latest-three raw Story window so at least one earlier committed fact must be carried by committed per-turn summary/open-observation memory rather than raw recent Story alone.
- Verify recovered/refreshed context preserves the same durable memory and replay remains idempotent.

F. Media boundary
- Observe image/media selection when naturally applicable. Finite general/sex pools and sexual image families may select presentation assets.
- Missing/alternate image selection must not reject the turn, erase Extract facts, or redefine whether the narrative event occurred.

## Failure discipline

- One bounded scenario. Do not retry/regenerate to obtain a passing semantic outcome.
- On first deterministic failure, preserve HTTP status, raw SSE, terminal event, action status/error, relevant committed DB state, exact deployed identity, and TEMP artifact paths, then STOP.
- Classify failure as harness / deployment identity / DB contract / Story / Extract / Commit / context-memory / UI-media boundary before proposing a fix.
- If source or migration change is required, do not patch under this task. Terminal as BLOCKED with root-cause evidence so the operator can create the next architecture task.

## Acceptance criteria

PASS only if the covered scenarios prove the committed gameplay spine and no hidden finite semantic gate is required for the exercised meaning. Test count alone is not proof.

Report exact turns/scenarios, Story evidence, Extract observations, committed facts/summaries, recovery/replay evidence, Level-7/CSA behavior, clothing/media behavior if exercised, and final TEST cleanup state.

## Completion

1. Reset only the disposable TEST game to the documented clean baseline after the run.
2. Disable/clean any temporary diagnostic toggle if used.
3. Set CURRENT_TASK to WAITING_REVIEW in a docs-only completion commit.
4. Post one immutable terminal report to Issue #68 with result PASS/BLOCKED/FAILED, exact executable/deployed identities, evidence paths, DB cleanup proof, and no Production/manual-game access.
5. STOP. Do not patch a discovered defect and do not create the next task yourself.

## Forbidden

- New branch/PR; reopen #65/#66; merge/Ready/rebase/squash/force-push.
- Production access.
- Any access or mutation of preserved manual game `78fb1d94-266f-455a-bda4-7656cc2370c1`.
- Provider/model/temperature/token changes.
- Retry/regeneration/fuzzy repair/parser relaxation/new parser/semantic hard gate.
- Direct DB mutation to manufacture gameplay state outside the reviewed TEST-only Level-7 acceleration seam.
- New semantic enum/allowlist/fallback/gateway to make acceptance pass.
- Editing historical applied migrations or immutable terminal evidence.
