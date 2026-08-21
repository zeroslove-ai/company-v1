# Company — CURRENT TASK

Status: READY
Task ID: company-full-redesign-milestone0-production-boundary-correction-v1
Mode: SOURCE CORRECTION — A′ MILESTONE 0 PRODUCTION BOUNDARIES
Updated: 2026-08-21
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Reuse this existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK file or an ops/task-registration branch.

## 0. Review result

Prior task:

`company-full-redesign-milestone0-source-correction-v1`

Prior terminal:

- Issue #68 terminal: `5366772054`
- reviewed exact source SHA: `e222783f38579a676d6b8cbb07a0d732786bdbef`
- Draft PR: #97
- branch: `company-redesign/milestone0-v1`

Operator review:

- Issue #68 comment: `5366925152`
- decision: `CHANGES_REQUIRED`

Do not merge/deploy/apply the migration at the reviewed SHA.

Continue the same source branch and Draft PR #97. Do not create a parallel implementation branch or PR.

Before editing, verify PR #97 is still at `e222783f38579a676d6b8cbb07a0d732786bdbef` or a descendant containing only this authorized correction. If unrelated source appeared, STOP and report the mismatch.

## 1. Binding authority

Unchanged:

- Product/UI authority: PR #95 @ `9d9aec5a198d8673eb37aba8a0541adbd6c84627`
- Engine/acceptance authority: PR #96 @ `9d44c4719fa6b098d53cac5cf946b93fafa6786b`
- UI donor: Company v1 snapshot `5ec1a76ac782d3a4fc8042f3d6a62854204b1c84`
- owner redesign decisions in Issue #68, especially `5364770509`

Preserve the accepted A′ Milestone 0 direction. This task does not reopen product design.

## 2. Preserve accepted work from `e222783...`

Do not regress:

- canonical Company Story/Opening context;
- Worker-compatible canonical `content/*.json` binding;
- real async `SupabaseR3Store` production construction;
- donor map / Mind Monitor / canonical display-label wiring;
- one server-owned turn;
- Story once + one post-Story Observer;
- Observer fail-open;
- one `(game_id, turn_number)` job;
- action/attempt fencing;
- bounded progress writes;
- atomic ordinary-turn Commit;
- no browser-owned Story → Observer → Commit coordinator;
- no v1/v2 compatibility writer;
- no active CSA/TTS/Image/Feedback runtime in Milestone 0;
- no dynamic sexual gauges, relationship/event engine, generic physical ontology, or speculative memory engine.

## 3. Correction A — Opening must persist canonical state atomically on Supabase

### Proven defect

`InMemoryR3Store.createOpening()` applies `stateAfter` to canonical state.

The unapplied SQL function `company_r3_create_opening(...)` currently inserts turn 0 but does **not** update `company_r3_state.state` to `p_state_after`.

That makes production readback diverge from the in-memory contract: Opening time/location/present actors/`scene_note`/clothing changes can disappear from canonical state even though turn 0 stores `state_after`.

### Required behavior

Correct the existing unapplied migration source `20260821000100_company_r3_milestone0.sql` so Opening is one atomic durable operation:

1. lock/read the canonical R3 state for the game;
2. if canonical Opening turn 0 already exists, return the existing canonical result without reapplying a new `p_state_after`;
3. if no Opening exists, insert exactly one turn 0 record and update `company_r3_state.state = p_state_after` in the same transaction/function invocation;
4. Opening does not advance gameplay `committed_turn` beyond 0 and does not fabricate a gameplay job;
5. concurrent duplicate Opening requests cannot produce two different canonical Opening states;
6. stored turn-0 `state_after` and post-Opening `company_r3_state.state` must agree;
7. no v1/v2 table access or migration/backfill.

Keep the migration source unapplied in this task.

Add the smallest useful source/unit contract proving InMemory and production-store Opening semantics agree at the adapter boundary. Do not build a large SQL-text test suite; exact live DB proof belongs to the later TEST rollout.

## 4. Correction B — SSE EOF is never commit success

### Proven defect

`frontend-r3/r3-client.js::consumeR3Sse()` currently resolves normally when the stream reaches EOF without a terminal event.

`frontend-r3/app.js` then may show `저장되었습니다.` even though no committed terminal was received.

### Required terminal law

For both Opening and ordinary turns:

- a successful stream must produce exactly one terminal event with `status=committed`;
- `status=failed` is a failure, never success;
- EOF without terminal is `reconnect/readback required` or an explicit stream failure, never a successful commit;
- duplicate/malformed terminal framing must not silently become success;
- the frontend must not display `저장되었습니다.` unless a committed terminal was actually observed;
- valid Story deltas already shown remain visible if the stream later fails/closes;
- no automatic Story regeneration/retry is added;
- reconnect/readback uses canonical server state/job rather than inventing client stage authority.

Implement this with the thinnest possible client contract. Do not reintroduce the old browser turn coordinator.

Add focused tests for:

1. committed terminal → success;
2. failed terminal → failure;
3. EOF without terminal → failure/reconnect-required;
4. no false `저장되었습니다.` path without committed terminal.

## 5. Correction C — provider first-content and total Story deadlines must be real

### Proven defect

Current `runtime-r3/server/provider.js` has two timeout bugs:

1. `request(... storyTotalMs ...)` clears the AbortController timer immediately after `fetch()` returns headers, so the configured 120s Story total deadline does not bound body streaming;
2. `readOpenAiStream()` starts a 30s first-content timer but does not clear it when the first valid Story delta arrives, so a healthy stream can be cancelled around 30s even after content has started.

### Required behavior

Implement independent deadlines:

- first-content deadline applies only until the first non-empty Story content delta;
- clear/disable the first-content deadline immediately when that first content is received;
- total Story deadline spans request + complete streamed body consumption;
- total deadline remains active after first content and is cleared only when Story stream finishes/fails;
- Observer timeout remains a bounded non-stream request;
- timeout failure does not create a committed turn;
- no hidden retry/regeneration;
- preserve immediate streaming and existing bounded DB progress policy.

Add narrow deterministic tests using short injected timeout values proving:

1. no first content before deadline → first-content failure;
2. first content arrives before deadline and stream continues past that first-content duration → it is **not** cancelled by the first-content timer;
3. a stream exceeding total deadline → total Story failure;
4. no duplicate provider call/retry is introduced.

## 6. Review the DB reservation boundary while touching persistence — no broad redesign

Do a narrow consistency review of `company_r3_reserve_turn` against A′ invariants:

- one canonical job per `(game_id, turn_number)`;
- expected committed-turn/revision protection remains server/DB safe under concurrency;
- literal action remains the reserved canonical action;
- stale attempts cannot commit.

If a concrete race allows reservation of a non-next turn despite the accepted server contract, fix it narrowly in the same **unapplied** migration source and add one focused regression. If no such defect is proven, make no speculative change and report that result.

Do not redesign retry law, job schema, or persistence architecture in this task.

## 7. Validation

Run only forward-facing validation:

- focused R3 tests including the new Opening/SSE/timeout regressions;
- exact-head CI;
- syntax checks for changed JS/MJS;
- `git diff --check`;
- Worker/build dry-run if available with zero deploy/DB/network mutation.

Passing old broad test count is not product acceptance; report it only as supporting evidence if CI runs it.

## 8. Allowed scope

Expected edits only in the existing Milestone 0 family:

- `runtime-r3/**`;
- `frontend-r3/**`;
- `test/r3-*.test.mjs`;
- `supabase/migrations/20260821000100_company_r3_milestone0.sql` (still unapplied);
- branch copy of `docs/ops/CURRENT_TASK.md` only if runner lifecycle requires it.

Do not edit:

- `runtime-v2/` / `frontend-v2/`;
- old `src/engine/` or old frontend implementation;
- PR #95/#96 design authority;
- historical applied migrations.

## 9. Operational prohibitions

This remains SOURCE ONLY.

- no merge / auto-merge;
- no migration apply;
- no Supabase DB writes;
- no Worker deploy;
- no TEST/Production game creation or gameplay;
- no reset/delete/repair of any game;
- no Production/hospital access;
- no provider/model/temperature/token/secret/config change;
- no Milestone 1;
- no CSA/TTS/Image/Feedback runtime activation.

All historical/manual/evidence games remain read-only.

## 10. Completion boundary

Update the existing Draft PR #97 and post one terminal report to Issue #68:

`COMPANY_FULL_REDESIGN_MILESTONE0_PRODUCTION_BOUNDARIES_READY_FOR_SOURCE_REVIEW`

Include:

- `TASK_ID: company-full-redesign-milestone0-production-boundary-correction-v1`;
- starting reviewed SHA `e222783f38579a676d6b8cbb07a0d732786bdbef`;
- final source SHA / PR #97 exact head;
- exact changed paths;
- Opening atomic state/readback correction proof;
- SSE terminal-required proof;
- provider first-content + total-timeout proof;
- reserve-boundary review result and any narrow fix;
- focused tests / exact-head CI / build results;
- migration applies 0;
- DB writes 0;
- deploys 0;
- gameplay 0;
- preserved-game mutations 0.

Then STOP `WAITING_REVIEW`.

Do not merge or register rollout/Milestone 1 automatically.
