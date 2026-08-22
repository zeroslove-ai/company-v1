# Company — CURRENT TASK

Status: READY
Task ID: company-r3-feedback-revision-test-rollout-v1
Mode: APPLY FEEDBACK MIGRATION TO TEST -> DEPLOY EXACT SOURCE -> ONE DISPOSABLE LIVE REVISION PROBE -> STOP
Updated: 2026-08-22 23:39 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Reuse this exact existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK file, ops/recovery branch, QA framework, compatibility layer, or competing execution authority.

## 0. Authority / accepted source

Binding authority:
- product-first canon PR #95 head `9d9aec5a198d8673eb37aba8a0541adbd6c84627`;
- A-prime engine/live-first canon PR #96 head `9d44c4719fa6b098d53cac5cf946b93fafa6786b`;
- `A-FEEDBACK-001 — Revise latest turn, do not advance chronology`;
- `docs/FEEDBACK_REVISION_CONTRACT.md`;
- owner lean-development directives `5380380688` and `5380381500`;
- feedback audit terminal `5380794753` + review `5380805884`;
- source implementation terminal `5380919544`;
- source correction review `5380931080`;
- source-fix terminal `5380951904`;
- accepted rollout review `5380962542`;
- this exact CURRENT_TASK blob after registration.

Accepted executable source is exactly:
`2898a929db239f210f448bab87579872aae8ec81`

The registration commit is docs-only. Runtime/frontend/migration behavior must correspond to the accepted executable source above.

Core architecture remains:
`Story 1 call -> Observer 1 call -> small reducer -> atomic commit`.

CSA rules 7/9 remain frozen capability exceptions and are completely outside this task.

## 1. Goal

Prove the accepted R3 latest-turn feedback revision vertical slice on TEST with one disposable game and real deployed API/frontend.

Required end state:
- TEST migration `20260822000300_company_r3_feedback_revision.sql` is applied exactly once and its narrow schema/RPC/ACL shape is verified;
- TEST API and frontend run the accepted feedback source;
- one fresh disposable R3 game proves ordinary Turn 1 revision 1, feedback revision 2, feedback revision 3, and same-request replay without revision 4;
- normal context/browser/history shows one accepted gameplay row for Turn 1 throughout;
- exact original literal player action remains unchanged;
- DB revision history preserves exact original pre-Turn-1 state/revision boundary across revisions 1/2/3;
- refresh renders only accepted latest revision once.

This is a bounded feature rollout/probe, not a general R3 regression campaign.

## 2. Hard boundaries

Allowed:
- read current main and existing TEST deployment/config/migration state;
- run the focused local feedback test and syntax/diff preflight if useful;
- inspect TEST migration ledger/schema/RPC ACL;
- apply only `supabase/migrations/20260822000300_company_r3_feedback_revision.sql` to the existing Company R3 TEST database, exactly once if absent;
- deploy the accepted R3 API source to TEST `game-proxy-company-r3`;
- deploy the accepted R3 frontend source to TEST `gamebuilder-company-r3`;
- create exactly one new disposable `company_r3_*` TEST game for this task;
- perform Opening, exactly one ordinary Turn 1, two feedback revisions of that same Turn 1, one replay of an already committed feedback request ID, refresh/readback, and read-only DB verification for this disposable game;
- use browser/network inspection necessary to prove the existing feedback modal behavior.

Forbidden:
- Production access/deploy/migration;
- touching, resetting, revising, or writing any preserved/previous game;
- any second disposable game unless the first cannot be created due deterministic infrastructure failure; if that happens, STOP instead of silently creating more;
- CSA sampling or CSA source changes; especially no CSA 7/9 work;
- provider/model/temperature/token/timeout/config changes;
- Story retry/regeneration beyond the two explicit user feedback submissions;
- 30/50-turn campaigns or unrelated gameplay matrices;
- runtime/frontend/migration/test source changes during rollout;
- generic semantic validator/router/parser/compatibility work;
- hidden retry-until-pass.

If source correction is required, STOP with exact evidence. Do not patch source inside this rollout task.

## 3. Preflight — exact identities first

Before any TEST mutation:
1. verify `origin/main` contains accepted executable source `2898a929db239f210f448bab87579872aae8ec81` plus only this docs registration after it;
2. verify current `docs/ops/CURRENT_TASK.md` blob matches this registered task;
3. verify no competing newer owner/operator instruction or active lease exists in Issue #68;
4. identify the existing Company R3 TEST Supabase project from repository/config/previous accepted deployment evidence; do not guess a project;
5. inspect migration ledger for `20260822000300_company_r3_feedback_revision`;
6. identify current TEST API/frontend versions before deployment.

Migration rule:
- if `20260822000300_company_r3_feedback_revision` is absent, apply it once to TEST;
- if it is already present, do NOT reapply; verify the resulting schema/RPCs and continue;
- if ledger/schema disagree, STOP as deterministic rollout corruption.

Do not apply any other pending migration merely because it exists.

## 4. TEST migration acceptance

After migration state is established, verify read-only:

### Tables
- `company_r3_turn_revision_history` exists;
- `company_r3_feedback_attempts` exists;
- no historical R3 turn rows were bulk backfilled/rewritten/deleted by this migration.

### RPCs
Verify canonical service-role-only signatures exist for:
- `company_r3_begin_feedback_revision`;
- `company_r3_commit_feedback_revision`;
- `company_r3_fail_feedback_revision`.

Verify `company_r3_create_opening` and `company_r3_commit_turn` are the canonical signatures expected by current R3 source and now write exact revision-history snapshots for future commits.

### ACL
- public/anon/authenticated cannot execute feedback RPCs;
- service_role can execute them;
- revision-history/attempt tables are not exposed as public gameplay writers.

If migration application or RPC creation fails, STOP. Do not deploy around it.

## 5. Deploy exact source to TEST

Only after migration acceptance:
- deploy API once to TEST `game-proxy-company-r3` from current main/executable source lineage;
- deploy frontend once to TEST `gamebuilder-company-r3` from the same lineage;
- record exact resulting Worker version IDs;
- verify each deployed TEST surface is healthy and points to TEST, not Production.

Do not redeploy repeatedly to repair provider behavior. A deterministic deploy failure may be retried only as an infrastructure command retry if no new version was created; report exact evidence.

## 6. One disposable live game

Create exactly one fresh TEST game after migration/deploy. Record its `game_id` immediately and mark it disposable evidence for this task.

Use a normal valid R3 profile. Do not use direct DB semantic seeding.

### Phase A — Opening + ordinary Turn 1

1. Create game through normal TEST product/API flow.
2. Produce Opening normally.
3. Submit one ordinary Korean player action through the real TEST UI/input path. Use one clear literal and record it byte-for-byte before submission.
4. Wait for one committed Turn 1 only.
5. Record pre-feedback canonical context and DB facts.

Required pre-feedback facts:
- `committed_turn = 1`;
- `company_r3_turns` has exactly one Turn 1 row;
- Turn 1 logical `revision = 1`;
- stored `literal_action` equals submitted literal exactly;
- one Turn 1 revision-history row exists at revision 1;
- that history row has exact non-null `state_before`, `state_after`, `state_revision_before`, `state_revision_after`.

Do not continue to Turn 2.

### Phase B — first feedback revision via real UI

Use the actual TEST feedback button/modal.

Submit one concise revision request that asks to improve the latest Story without changing the original player action.

Capture the request's `revision_request_id` from the real outbound request/network evidence.

During streaming, verify presentation behavior:
- the previously committed Turn 1 Story remains the canonical rendered/history content until terminal success;
- provisional replacement Story appears only in the feedback preview/status area;
- one modal submit causes one feedback request;
- feedback submit/close controls do not permit duplicate active submission.

After committed terminal + refresh/readback verify:
- `committed_turn` remains 1;
- state revision advanced exactly once from the pre-feedback value;
- Turn 1 logical revision is 2;
- literal action is byte-for-byte unchanged;
- `company_r3_turns` still has exactly one Turn 1 row;
- normal UI/history/context shows revised Turn 1 once;
- revision-history rows for Turn 1 are exactly revisions 1 and 2;
- revision 2 `state_before` equals revision 1 `state_before` exactly;
- revision 2 `state_revision_before` equals revision 1 `state_revision_before` exactly;
- revision 2 `state_revision_after` equals prior current state revision + 1;
- revision 2 links to/supersedes revision 1 as implemented.

### Phase C — second feedback revision on the same Turn 1

Use the same real feedback feature again with a different concise feedback text and a fresh `revision_request_id`.

After commit + refresh/readback verify:
- chronology remains Turn 1 only; no Turn 2 is created;
- Turn 1 logical revision is 3;
- state revision advanced exactly once again;
- literal action remains byte-for-byte identical to the original ordinary input;
- one canonical Turn 1 gameplay row only;
- revision-history rows are exactly 1, 2, 3 for Turn 1;
- all three rows have identical original `state_before`;
- all three rows have identical original `state_revision_before`;
- `state_revision_after` is monotonic across revisions 1 -> 2 -> 3;
- revision 3 supersedes revision 2;
- browser/history/context after refresh renders only accepted revision 3 once.

Do not submit any further semantic feedback samples.

### Phase D — idempotent replay of an already committed request

Replay exactly one already committed feedback request using the SAME `(game_id, revision_request_id)` captured from Phase B or C and the original request body for that ID.

This replay may be performed through a direct TEST API request because the browser correctly generates fresh UUIDs for new user submissions.

Required:
- terminal/readback indicates existing terminal state/replay behavior without a new accepted revision;
- no Story streaming delta for a newly generated revision is accepted as evidence of a new run;
- Turn 1 remains revision 3;
- state revision does not change;
- no revision 4 history row appears;
- no second gameplay row appears;
- feedback-attempt identity remains singular for that request ID.

Do not attempt to infer provider-call counts from style. Use durable revision/attempt/stream evidence.

## 7. Final browser/readback acceptance

On the disposable game's normal TEST frontend after a hard refresh:
- exactly Opening + one Turn 1 article are rendered;
- Turn 1 text is the latest accepted revision 3;
- original player literal remains unchanged wherever action/history is displayed/exported;
- feedback control is enabled when the latest committed ordinary turn is eligible and no unresolved next-turn job exists;
- input/normal submit remains usable;
- no blocking desktop/mobile layout regression needs to be invented or broadly retested; only check that the feedback modal/control did not visibly break the current page.

Do not continue gameplay beyond Turn 1.

## 8. Failure policy

STOP immediately for deterministic product/data defects such as:
- migration cannot apply/create canonical RPCs;
- wrong ACL/writer boundary;
- ordinary Turn 1 lacks an exact history snapshot after migration;
- feedback advances chronology;
- literal action changes;
- canonical gameplay row duplicates;
- feedback revision loses/changes original pre-turn `state_before` or `state_revision_before`;
- state revision increments more than once per accepted feedback;
- duplicate request creates revision 4 or another provider-backed generation/commit;
- refresh loses or duplicates accepted gameplay;
- UI replaces committed Story before successful terminal or double-submits one explicit feedback action.

A single stylistic Story miss, missing exact-four choice tail, choices_observer_mismatch, or known provider-capability limitation is NOT authorization to tune provider/model/config or rerun until pass. Record it only if relevant and continue structural acceptance when safe.

## 9. Required terminal report

Post exactly one terminal report to Issue #68 with:
- Task ID, CURRENT_TASK blob, execution lease;
- exact start/final main SHA and accepted executable source SHA;
- migration ledger before/after and whether 00300 was newly applied or already present;
- TEST Supabase project identifier actually used;
- verified new table/RPC/ACL facts;
- TEST API Worker version ID before/after;
- TEST frontend Worker version ID before/after;
- disposable game ID;
- exact ordinary Turn 1 literal action;
- Turn 1 / state revisions after ordinary commit, feedback 1, feedback 2, and replay;
- revision-history proof for revisions 1/2/3 including state_revision_before/state_revision_after parity and supersedes linkage;
- canonical Turn 1 row count after each phase;
- feedback request IDs used, identifying which one was replayed;
- real UI evidence for modal preview/old-Story preservation/single submit/success replacement/refresh;
- final browser/context/history parity;
- confirmation no Turn 2, preserved game, Production, CSA, CSA 7/9, provider/model/config/timeout, 30/50 campaign, or source patch was touched.

Terminal status:
- `STATUS: COMPLETE_FEEDBACK_TEST_GREEN` if all required structural/product checks are green; or
- `STATUS: BLOCKED_FEEDBACK_TEST_DEFECT` with the first deterministic blocker and preserved evidence.

Stop after terminal. Do not overwrite CURRENT_TASK or start another task yourself.
