# Company — CURRENT TASK

Status: READY
Task ID: company-r3-bare-public-owner-readiness-v1
Mode: BARE PUBLIC URL INDEPENDENT END-TO-END QA -> ROOT-FIX OBJECTIVE DEFECTS -> OWNER-READY GATE
Updated: 2026-08-23 15:42 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`
Previous terminal: Issue #68 comment `5384668398`
Operator review: accepted mobile cold-start P0 root fix and mandatory self-acceptance.

Reuse this exact existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK path or an ops/recovery branch.

## 0. Binding baseline

Accepted executable/source baseline:
- product-first canon PR #95 head `9d9aec5a198d8673eb37aba8a0541adbd6c84627`;
- A-prime engine/live-first canon PR #96 head `9d44c4719fa6b098d53cac5cf946b93fafa6786b`;
- accepted cold-start executable source `2511ce2a741a769d06aae2f71996185189f30480`;
- prior terminal docs checkpoint main `20e9bf3505928a61122ffb727f7ba165e9aa7b9c`;
- TEST API `game-proxy-company-r3` version `e4317d6f-9bfe-4774-a744-90789d066d4e`;
- TEST frontend `gamebuilder-company-r3` version `731cc702-2451-442a-895c-2d10c38dccc9`;
- same-game reset migration `20260823000100_company_r3_same_game_reset` already applied exactly once to TEST;
- `docs/ops/AUTONOMOUS_LIVE_QA_LOOP.md` remains binding.

Accepted/frozen evidence that this task must not reopen without new contradictory evidence:
- cold-start root cause: public frontend used relative `/api/r3`, causing frontend-origin `/api/r3/catalogs` -> HTTP 404 / empty body -> `Response.json()` failure;
- root fix: canonical public `gamebuilder-company-r3` resolves to `game-proxy-company-r3`; explicit `?api=` override remains supported for diagnostics but is forbidden for this task's acceptance path;
- clean desktop/mobile bare-URL Setup shell after fix: GREEN;
- one fresh bare-URL Setup -> Opening -> Turn1 -> refresh/re-entry: GREEN;
- six-turn post-fix human-like replay: GREEN;
- capability boundary, feedback revision/continuation, same-game reset, history/export/TTS and previously accepted ordinary continuity remain frozen unless this task produces new real evidence;
- CSA rules 7/9 remain frozen provider/model capability exceptions; do not rerun or tune them.

## 1. Why another pass is required

The P0 proved a specific QA blind spot: prior live/browser evidence could succeed through an explicit `?api=` override, warm storage, or an already-created game while the actual bare public user entry path was broken.

The owner must not be used as the next basic integration test. Before handing the URL back, independently verify that the real public path is usable beyond one repaired smoke session and that retained user-facing controls also work from the same resolved API origin.

## 2. Hard acceptance-path rules

For all acceptance evidence in this task:
- start from the bare public frontend URL `https://gamebuilder-company-r3.zeroslove.workers.dev`;
- no `?api=` query override;
- no pre-supplied `game_id` query;
- no localStorage/sessionStorage preseed;
- no cookie/storage reuse from previous R3 games;
- no direct API gameplay substitute for a UI action;
- no devtools/request injection to make the path work;
- use fresh disposable TEST games only;
- Production is forbidden.

Read-only API/DB inspection after a visible UI action is allowed to verify persistence and diagnose an observed defect.

## 3. Required independent campaigns

Run two genuinely independent clean-browser campaigns against the deployed public TEST frontend.

### Campaign A — mobile-first real-user path

Use a fresh mobile context at approximately 390x844.

Required:
1. bare public URL -> Korean Setup shell visible and usable;
2. create a new disposable game through visible Setup UI;
3. Opening visibly completes;
4. continue at least 8 committed ordinary turns;
5. include both Story choice buttons and Korean free input;
6. include at least:
   - one direct NPC conversation and follow-up;
   - one non-work/social action;
   - one refusal/change-of-mind/self-state action;
   - one location/scene movement;
7. refresh after a normal committed turn and continue the same game;
8. verify no loader/fallback covers Story or controls;
9. visually inspect screenshots at Setup/Opening and mid-game, including action controls at the bottom of the mobile viewport;
10. inspect console and required network requests for uncaught errors, 404/empty-body JSON failures, CORS failures, dead controls, or wrong API origin.

### Campaign B — independent desktop path

Use a second fresh desktop browser context and a different disposable game.

Required:
1. bare public URL -> new Korean Setup -> Opening;
2. continue at least 8 committed ordinary turns using a materially different route/action style from Campaign A;
3. alternate choice and free-input actions;
4. exercise refresh/re-entry;
5. exercise one latest-turn feedback revision through the visible UI, then continue with one ordinary turn;
6. exercise same-game reset once through the visible UI, verify canonical new Opening exactly once, then submit and commit one post-reset Turn1;
7. exercise history/export presentation and one retained TTS control in the visible state they claim to support;
8. exercise one already-known-green representative CSA rule through the visible app: apply -> verify revision changes without consuming gameplay turn -> one relevant ordinary Story turn -> remove -> verify readback. Do not use frozen CSA 7/9 and do not turn this into a nine-rule matrix;
9. visually inspect screenshots before and after the user-facing sidecar operations;
10. inspect console/network and persisted readback.

Minimum combined ordinary human-like gameplay: 16 committed turns across the two independent games, excluding Opening, reset Opening, feedback transaction, and CSA apply/remove transactions.

## 4. What to inspect on every critical step

Verify actual usability and evidence, not DOM existence:
- request goes to `game-proxy-company-r3.zeroslove.workers.dev`, never frontend-origin `/api/r3/*` on the canonical public host;
- Korean literal action submitted by the UI matches stored literal action;
- one visible click creates at most one intended job/turn;
- Story streaming becomes visible without blocking the reading surface;
- terminal commit returns controls to ready state;
- current choices are enabled and map to their full current literal action;
- free input remains usable;
- refresh/re-entry restores the same committed game state;
- NPC identity, location/presence, scene_note, refusal/self-state and direct follow-up continuity remain coherent;
- no obvious Story action/target/topic substitution;
- no pageerror/uncaught console error/required-request failure;
- no bootstrap fallback or empty/non-JSON response parse error;
- screenshots are actually visually reviewed.

For sampled critical turns compare submitted literal -> Story -> observer -> state/readback. Do not call a campaign green only because turns committed.

## 5. Defect handling

If an objective defect is found:
- capture exact visible + network/state evidence first;
- classify root cause before source change;
- apply only the smallest coherent root fix if the defect clearly belongs to the current public-path/frontend/integration surface;
- add only focused deterministic regression coverage;
- deploy only affected TEST artifact(s);
- replay the exact reproducer from a new clean bare-URL context, then resume the remaining campaign;
- do not ask the owner to reproduce it.

If a materially unrelated P0/P1 requires architecture/product authority outside this task, stop at `WAITING_REVIEW` with exact evidence for operator re-scope rather than inventing a broad fix.

Do not:
- change provider/model/temperature/token limits merely to pass QA;
- rerun/tune frozen CSA7/9;
- add hidden retry/regeneration or a second Story writer;
- add a generic parser/semantic gate/compatibility framework;
- change DB schema/RLS/grants/migrations unless a new deterministic defect proves it necessary and operator re-scopes first;
- touch Production;
- mutate preserved historical/QA evidence games.

## 6. Completion gate

This task may report GREEN only if all of the following are demonstrated on the deployed TEST version:
- mobile clean bare-URL campaign GREEN;
- independent desktop clean bare-URL campaign GREEN;
- at least 16 combined ordinary committed turns with human-like action review;
- refresh/re-entry GREEN in both campaigns;
- mobile action controls visibly usable;
- feedback revision + continuation GREEN from bare public path;
- same-game reset + post-reset Turn1 GREEN from bare public path;
- history/export + retained TTS control usable from bare public path;
- one representative non-frozen CSA apply/effect/remove/readback GREEN from bare public path;
- no frontend-origin `/api/r3/*` request on canonical public host;
- no blocking fallback, uncaught console exception, required-request failure, empty/non-JSON parse failure, or known objective P0/P1 defect;
- screenshots visually inspected;
- visible/narrative state agrees with persisted readback on sampled critical turns.

If all are GREEN, set this same file to `WAITING_REVIEW`, post the full terminal report to Issue #68, and STOP for operator review. Do not send the owner a test request yourself.

## 7. Required terminal report

Report in Issue #68:
- exact starting and final main/source SHAs;
- TEST API/frontend version IDs actually exercised;
- Campaign A game ID, turn count and coverage summary;
- Campaign B game ID, turn count and coverage summary;
- bare-URL network-origin proof;
- refresh/re-entry evidence for both;
- feedback/reset/history/TTS/representative-CSA evidence;
- sampled literal -> Story -> observer/state findings;
- console/network findings;
- screenshot visual-inspection findings;
- any source/test/deploy changes made and why;
- final classification and any remaining objective defect.
