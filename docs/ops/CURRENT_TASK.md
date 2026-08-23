# Company — CURRENT TASK

Status: READY
Task ID: company-r3-mobile-cold-start-p0-v1
Mode: P0 CLEAN-SESSION BOOT RECOVERY -> TEST DEPLOY -> SELF-ACCEPTANCE -> HUMAN-LIKE REPLAY
Updated: 2026-08-23 15:19 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`
Owner defect evidence / operator review: Issue #68 comment `5384590975`

Reuse this exact existing `docs/ops/CURRENT_TASK.md` in place. This is one executable wake task created from the previous `WAITING_OWNER_DECISION` hold after a real user-visible P0 defect and explicit owner correction instruction.

## 0. Binding baseline

Preserve unless this task proves the exact boot defect requires a narrow change:
- product-first canon PR #95 head `9d9aec5a198d8673eb37aba8a0541adbd6c84627`;
- A-prime engine/live-first canon PR #96 head `9d44c4719fa6b098d53cac5cf946b93fafa6786b`;
- accepted executable source `19a4c2b8d9d2d1e3fc4a93c184d4b52e785af300`;
- TEST API `game-proxy-company-r3` version `e4317d6f-9bfe-4774-a744-90789d066d4e`;
- TEST frontend `gamebuilder-company-r3` version `e0b654d7-06e1-4851-92a3-02af5cf5ba59`;
- reset migration `20260823000100_company_r3_same_game_reset` already applied exactly once to TEST;
- `docs/ops/AUTONOMOUS_LIVE_QA_LOOP.md` remains binding.

## 1. P0 evidence

Owner opened the public R3 TEST frontend on a mobile browser and was blocked before gameplay by the visible fallback:

`게임 화면을 불러오지 못했습니다: Failed to execute 'json' on 'Response': Unexpected end of JSON input`

This invalidates the prior owner-ready/green hold classification. HTTP 200, DOM existence, previously warm browser sessions, or already-created disposable games do not satisfy clean-session boot acceptance.

## 2. Objective

Find and fix the exact clean-session cold-start failure so a real new user can open the public TEST URL, complete Korean Setup, see Opening, submit Turn1, refresh/re-enter, and continue normally on both desktop and mobile clean contexts.

## 3. Required execution sequence

1. **Reproduce first; do not guess.**
   - Use the exact currently deployed R3 TEST frontend/API discovered from live deployment metadata.
   - Use a genuinely clean browser/storage context with no prior game/localStorage/session state.
   - Reproduce on mobile viewport; also check clean desktop.
   - Capture browser console and required initial network requests.
   - Identify the exact request and response causing `Response.json()` to fail: status, content-type, body length/body validity, redirect/error behavior, and caller path.

2. **Classify root cause.**
   - Determine whether the defect is API empty/truncated/non-JSON response, frontend incorrect endpoint/origin/request path, unconditional JSON parsing of a valid empty response, deployment/static asset mismatch, or another concrete transport/bootstrap defect.
   - Do not infer from HTTP 200 alone.

3. **Apply the smallest root fix.**
   - Fix the actual defective layer.
   - Do not hide an API/server defect behind a generic client fallback.
   - If frontend response handling itself is unsafe, add only the minimal correct status/content-type/body handling while keeping actionable visible errors.
   - No new architecture, compatibility layer, parser, retry loop, auth framework, or unrelated refactor.

4. **Focused regression protection.**
   - Add/update only deterministic focused coverage for the concrete cold-start regression and directly touched bootstrap boundary.
   - Do not chase test-count parity or revive obsolete tests.

5. **TEST deployment.**
   - Deploy only affected R3 TEST artifact(s).
   - Preserve existing `R3_GAME_ACCESS_SECRET` binding and accepted baseline semantics.
   - No Production.
   - No provider/model/temperature/token/CSA7/9 changes.
   - No unrelated migration/schema/RLS/grant/secret changes.

6. **Mandatory clean-session self-acceptance before owner retest.**
   - fresh clean desktop browser -> public frontend URL -> setup shell visible and usable;
   - fresh clean mobile browser/viewport -> public frontend URL -> setup shell visible and usable;
   - create one fresh disposable R3 game through the visible UI;
   - Korean Setup succeeds;
   - Opening visibly renders;
   - one ordinary Turn1 submits and commits;
   - refresh and re-entry return the same game correctly;
   - no blocking fallback surface;
   - no uncaught console exception;
   - no required-request network failure or JSON parse failure;
   - screenshot(s) visually inspected, not merely captured;
   - HTTP 200/DOM presence alone is insufficient evidence.

7. **Narrow replay after fix.**
   - Continue 5–10 ordinary human-like browser turns around boot/re-entry/refresh and normal action flow.
   - Include at least one free-form Korean input and one choice-button action.
   - Check that the fix did not regress Story streaming, choice readiness, game persistence, agency, or navigation.

## 4. Stop/continue rule

- If the same or another objective boot/load/network blocker remains, keep this task active and continue root-fix/redeploy/replay within this scope.
- If a different unrelated P0/P1 is discovered during mandatory replay, report exact evidence to Issue #68 and stop for operator re-scope only when necessary.
- Do **not** ask the owner to reproduce or retest until the clean-session self-acceptance gate above is fully green.

## 5. Completion report required in Issue #68

Report:
- exact root cause;
- changed files and final source SHA;
- affected TEST artifact(s) and deployed version IDs;
- focused test result;
- clean desktop cold-start evidence;
- clean mobile cold-start evidence;
- Setup -> Opening -> Turn1 evidence;
- refresh/re-entry evidence;
- console/network result;
- 5–10 turn replay result;
- screenshot visual-inspection result;
- final classification.

Then set this same `CURRENT_TASK.md` to `WAITING_REVIEW` and STOP for operator review. Do not create a report-only branch/file or a new CURRENT_TASK path.
