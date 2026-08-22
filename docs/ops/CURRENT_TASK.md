# Company — CURRENT TASK

Status: READY
Task ID: company-r3-feedback-revision-source-fix-v1
Mode: FIX TWO VERIFIED FEEDBACK SOURCE DEFECTS -> FOCUSED TESTS -> STOP BEFORE TEST ROLLOUT
Updated: 2026-08-22 23:31 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Reuse this exact existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK file, ops/recovery branch, QA framework, compatibility layer, or competing execution authority.

## 0. Authority / verified source

Binding authority:
- product-first canon PR #95 head `9d9aec5a198d8673eb37aba8a0541adbd6c84627`;
- A-prime engine/live-first canon PR #96 head `9d44c4719fa6b098d53cac5cf946b93fafa6786b`;
- `A-FEEDBACK-001 — Revise latest turn, do not advance chronology`;
- `docs/FEEDBACK_REVISION_CONTRACT.md`;
- owner lean-development directives `5380380688` and `5380381500`;
- source-audit terminal `5380794753` + accepted review `5380805884`;
- implementation terminal `5380919544`;
- operator source review `5380931080` — `SOURCE_FIX_REQUIRED_BEFORE_TEST_ROLLOUT`;
- this exact CURRENT_TASK blob after registration.

Verified source head before this registration:
`05abdeab59761ac8387a2df58babce30662f327d` (`feat: add company r3 feedback revision`).

The implementation is NOT approved for migration application or TEST rollout yet.

Core architecture remains:
`Story 1 call -> Observer 1 call -> small reducer -> atomic commit`.

CSA rules 7/9 remain frozen and completely outside this task.

## 1. Accepted implementation — do not redesign

The following implementation direction from `05abdea` is accepted and must not be reopened:
- `company_r3_turns` remains the sole latest gameplay projection, one row per chronological turn;
- narrow append-only `company_r3_turn_revision_history`;
- narrow `company_r3_feedback_attempts` request fencing;
- server-owned `POST /api/r3/games/:game_id/feedback`;
- original literal action recovered server-side;
- feedback uses exact stored pre-turn state;
- one Story call + one Observer call + existing reducer + atomic revision commit;
- same chronological turn, logical revision +1, state revision +1, committed_turn unchanged;
- existing feedback modal/client wiring with provisional preview; committed old Story remains authoritative until terminal success;
- no provider/model/temperature/token/timeout/config change;
- no CSA change.

Do not broaden feature semantics or refactor the vertical slice.

## 2. Verified defects — fix exactly these

### Defect A — invalid PL/pgSQL local variable

File:
`supabase/migrations/20260822000300_company_r3_feedback_revision.sql`

Function:
`company_r3_commit_feedback_revision`

The function executes:
`select * into v_job from public.company_r3_turn_jobs ...`

but its DECLARE block does not define `v_job`.

Required fix:
add exactly the appropriate local declaration, e.g.
`v_job public.company_r3_turn_jobs%rowtype;`

Do not otherwise restructure the function merely for style.

### Defect B — feedback history stores the wrong state_revision_before

The accepted revision uses the original exact pre-Turn-N `state_before` for every feedback revision of that same Turn N. Therefore the matching `state_revision_before` must also remain the original pre-Turn-N revision from the prior accepted revision-history snapshot.

Current incorrect behavior writes the current post-Turn-N world revision:
- SQL feedback history insert uses `v_state.revision`;
- `InMemoryR3Store.commitFeedbackRevision` uses `state.revision`.

Required fixes:
- SQL: new feedback history row must use `v_history.state_revision_before` for `state_revision_before`;
- in-memory: new feedback history row must use `prior.state_revision_before`;
- `state_revision_after` must still be the newly incremented current state revision;
- `state_before` remains the exact original stored pre-turn state;
- no inference/backfill for historical rows.

This must remain correct across repeated feedback revisions of the same latest turn.

## 3. Required deterministic regression coverage

Modify only the focused feedback test file as needed.

Add one explicit second-feedback sequence on the same Turn N proving all of these together:
- initial ordinary Turn N logical revision = 1;
- first feedback -> logical revision 2;
- second feedback -> logical revision 3;
- `committed_turn` does not advance on either feedback;
- canonical context still has exactly one gameplay row for Turn N;
- exact original `literal_action` remains unchanged through revision 3;
- revision-history rows 1, 2, 3 exist;
- `state_before` for revisions 1, 2, 3 is the same exact pre-Turn-N state;
- `state_revision_before` for revisions 1, 2, 3 is the same original pre-Turn-N revision;
- `state_revision_after` advances monotonically for accepted replacements;
- second feedback performs exactly one additional Story call and one additional Observer call, not a replay/duplicate generation.

Add one narrow migration-source assertion that would fail if `company_r3_commit_feedback_revision` again references `v_job` without the expected declaration. Keep this simple; do not build a SQL parser/framework.

Retain the existing idempotency/stale-fence/failure tests unless the minimal correction genuinely requires a tiny adjustment.

## 4. Validation

Run only:
- `node --test test/r3-feedback-revision.test.mjs`;
- syntax checks for changed JS files;
- `git diff --check`.

Do NOT run the entire historical suite or another gameplay campaign.

The terminal must state exact focused test count and whether the second-feedback regression passed.

## 5. Strict forbidden scope

Do NOT:
- apply `20260822000300_company_r3_feedback_revision.sql`;
- apply any migration;
- deploy API/frontend to TEST or Production;
- create/reset/read/write TEST games for live feedback;
- touch preserved evidence games;
- change provider/model/temperature/token/timeout/config;
- change Story/Observer architecture;
- change feedback UI beyond what is necessary for these two source defects (normally no frontend edit should be needed);
- change CSA source/semantics or rerun CSA;
- touch CSA rules 7/9;
- add semantic parser/NER/fuzzy/router/classifier/gate/executor;
- add compatibility layers or generic versioning/event-sourcing framework;
- create a new branch or another CURRENT_TASK file.

If fixing these two defects reveals a broader schema/architecture requirement, STOP and report instead of expanding scope.

## 6. Required terminal

Commit/push the bounded correction to `main`, then post one terminal report to Issue #68 with:
- `STATUS: WAITING_REVIEW_SOURCE_FIXED_NOT_DEPLOYED`;
- Task ID and CURRENT_TASK blob;
- execution lease;
- start head and final head;
- exact changed paths;
- confirmation Defect A fixed (`v_job` declared);
- confirmation Defect B fixed in SQL + in-memory;
- second-feedback regression details including revisions 1->2->3 and state revision boundaries;
- focused test result count;
- syntax/diff result;
- explicit confirmation migration was NOT applied and nothing was deployed;
- explicit confirmation no DB/game/Production/provider/config/CSA mutation occurred.

Stop after terminal. Do not apply migration, deploy, run live feedback, or overwrite CURRENT_TASK yourself.