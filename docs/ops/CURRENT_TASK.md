# Company — CURRENT TASK

Status: READY
Task ID: company-full-redesign-milestone0-test-rollout-resume-v1
Mode: TEST ROLLOUT RESUME — R3 SETUP + OPENING ONLY
Updated: 2026-08-21
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Reuse this existing `docs/ops/CURRENT_TASK.md` in place. Do not create another CURRENT_TASK file or an ops/task-registration branch.

## 0. Authority / reviewed source

This task resumes the failed Milestone 0 TEST rollout after the narrow R3 Supabase native-fetch source correction was reviewed and merged.

Binding authority:

- Product-first redesign authority: PR #95 @ `9d9aec5a198d8673eb37aba8a0541adbd6c84627`
- A′ Engine authority: PR #96 @ `9d44c4719fa6b098d53cac5cf946b93fafa6786b`
- complete Company v1 UI donor snapshot: `5ec1a76ac782d3a4fc8042f3d6a62854204b1c84`
- Milestone 0 base source accepted from PR #97 head `fed4e05108573bb71bb9086a95b9f85e592ebd29`
- R3 native-fetch correction accepted from PR #98 head `b5bb46929cd14850feb7fe30e50f270a8cc279ea`
- source acceptance comment: Issue #68 `5368708508`
- correction merge main SHA: `f3f30b5d8fb42e92744f4c8694fe628743d6883a`
- prior rollout failure terminal: `5368025850`
- prior rollout failure review: `5368094133`

Do not modify source in this task. If live acceptance exposes a source defect, STOP and return exact evidence for a narrow source correction.

## 1. Existing live TEST state — do not repeat completed operations

The first rollout already established these facts:

- TEST migration `20260821000100_company_r3_milestone0` was applied exactly once and is live.
- do NOT edit, reapply, replace, or rerun this migration.
- R3 API Worker existing deployment before correction: `game-proxy-company-r3`, Version `53b24119-4fbb-47c4-82ca-debb32cb381c`.
- R3 frontend Worker existing deployment: `gamebuilder-company-r3`, Version `117650ff-b7bb-42f9-81ea-c0a8969f0b9e`.
- frontend source was unchanged by PR #98.
- catalog endpoint and frontend root previously returned HTTP 200.
- no valid R3 game/state/turn/job rows were created; final counts were zero.
- one PowerShell-path Korean Setup attempt that became `???` is invalid harness evidence and must never be reused as product evidence.
- one codepoint-constructed UTF-8-safe Setup reached the real API but failed at the now-corrected native-fetch boundary.

## 2. Preflight

Before any write:

1. re-read latest Issue #68 comments and confirm no newer owner/task decision supersedes this task;
2. confirm main contains exact correction merge `f3f30b5d8fb42e92744f4c8694fe628743d6883a` and no unexpected executable source drift;
3. confirm migration `20260821000100_company_r3_milestone0` is already present exactly once in TEST; do not apply it;
4. read-only verify R3 game/state/turn/job counts. Expected baseline is zero; if non-zero, report exact IDs/counts and STOP before creating another game unless the rows are clearly from a legitimate newer owner action;
5. verify R3 frontend deployed identity still serves the expected Milestone 0 UI. Because PR #98 changed no frontend source, do not redeploy frontend merely for symmetry;
6. verify API deployment can be produced from exact current reviewed source with `wrangler.r3.api.jsonc`.

## 3. Deploy corrected API only

Deploy only the R3 API Worker from exact reviewed main lineage containing PR #98 correction.

- Worker: `game-proxy-company-r3`
- config: `wrangler.r3.api.jsonc`
- record resulting Worker Version ID.

Do not deploy Production/v1/v2/hospital workers.

Frontend:

- default: no redeploy;
- only redeploy `gamebuilder-company-r3` if read-only preflight proves deployed frontend artifact drifted from the already-reviewed Milestone 0 frontend source;
- if no drift, record existing Version `117650ff-b7bb-42f9-81ea-c0a8969f0b9e` as retained.

## 4. UTF-8-safe acceptance harness — mandatory

Use one temporary ASCII-only Node `.mjs` or equivalent byte-safe harness.

Rules:

- source file itself must be ASCII-safe where practical;
- construct Korean strings from `String.fromCodePoint(...)`, `\uXXXX` escapes, or equivalent deterministic Unicode construction;
- send requests with native Node `fetch` and `JSON.stringify` directly;
- do not pipe Korean JSON through PowerShell/cmd stdin, here-string, shell codepage conversion, or copy/paste transport;
- record input codepoints and readback codepoints.

Use one canonical Setup profile consistent with the accepted Product canon. Reuse the intended `김도윤` profile if convenient, but construct the name byte-safely.

## 5. Exactly one fresh R3 game / Setup

Create exactly one fresh R3 TEST game through the normal R3 public Setup path.

Required Setup proof:

- HTTP success;
- returned game_id is a new R3 game ID;
- exact Korean player name round-trips without mojibake;
- profile fields round-trip exactly: name, department_id, position_id, age, height_cm, weight_kg, penis_length_cm, body_type_id, speech_style_id;
- DB readback shows exactly one matching `company_r3_games` row and one `company_r3_state` row;
- initial state uses canonical catalog IDs, not fabricated/demo names;
- no turn job exists before Opening if contract says Opening is separate; document exact actual shape rather than assuming.

Do not create a second fresh game if this Setup fails. STOP on the first valid-harness product/runtime failure.

## 6. Opening exactly once

After successful Setup, invoke Opening exactly once through the normal R3 API path.

Milestone 0 Opening acceptance must verify:

- Story is real Company interactive-fiction Opening, never productivity-assistant/helpdesk framing;
- registered Company characters/locations only; no fabricated NPC;
- player-private `상식개변` premise follows PR #95 Product authority;
- Story streaming/SSE works and narrative remains the primary output;
- exactly four natural Story-authored next-action literals are available according to the 2026-08-21 owner redesign decision; the same post-Story Observer/Extract may structure them for UI, with no separate choice LLM and no stale/prior-turn fallback;
- valid Story is not discarded merely because choice extraction fails; if choice projection is missing/invalid, preserve Story and report the exact evidence rather than retrying/regenerating;
- no ordinary next action is submitted in this task.

Record exact SSE event sequence/counts at a useful summary level without flooding Issue #68 with every delta.

## 7. DB / product readback after Opening

Read back the fresh game using direct TEST DB inspection and normal API context where appropriate.

Verify at minimum:

- game/state rows exist once;
- committed turn/revision match the R3 Opening contract;
- Opening turn/history row count is correct;
- no duplicate `(game_id, turn_number)` job/turn ownership;
- no processing/failed residue after successful Opening;
- Story text is durable;
- four literal choices, if projected by the accepted contract, are the exact current-Opening literals and not stale/fallback values;
- summary/Observer fields match the minimal A′ contract;
- scene has structured location/present actors plus bounded natural-language `scene_note`, with no parallel generic posture/contact ontology introduced;
- no dynamic player sexual/arousal/erection/ejaculation gauge or supporting sexual-event-ledger gameplay state is introduced;
- CSA/TTS/Image/Feedback remain outside active Milestone 0 behavior;
- existing v1/v2/hospital/manual/QA/evidence games remain untouched.

## 8. UI read-only check

Use the deployed `gamebuilder-company-r3` UI only for read-only product verification after Setup/Opening state exists.

Confirm:

- product visibly reads as `상식개변: 회사편`, not a chat/productivity app;
- presentation follows the high-parity Company v1 donor direction from snapshot `5ec1a76a...` for the surfaces included in Milestone 0;
- Story/history/current stream remain central;
- no blocking loading overlay covers streamed Story;
- player profile/state and current scene render from real R3 data rather than fake defaults;
- disabled/deferred controls do not claim functionality they do not have.

Do not use UI to submit an ordinary gameplay action.

## 9. Stop conditions

Immediately STOP on the first valid-harness failure if any of these occur:

- Setup HTTP/API/DB failure;
- UTF-8 mismatch after byte-safe harness;
- duplicate/unexpected R3 rows;
- Opening Worker exception;
- fabricated/unregistered actor/location;
- assistant/helpdesk framing indicating wrong product context;
- Story replaced/discarded because choices were not exactly four;
- hidden regeneration/retry or second Story generation;
- stale choice fallback;
- source/runtime/frontend defect requiring code changes;
- evidence that migration/schema contract is wrong.

No retry-until-pass. No source hotfix inside rollout. Preserve evidence and terminalize FAILED/BLOCKED.

## 10. Forbidden operations

- no migration reapply/edit/new migration;
- no source/test/frontend changes;
- no provider/model/temperature/token/secret/config changes except normal deployment consumption of already-approved config;
- no ordinary gameplay action after Opening;
- no choice click/free-text turn submission;
- no CSA mutation;
- no TTS/Image/Feedback work;
- no Milestone 1;
- no Production/hospital/v1/v2 game mutation/access beyond explicitly required read-only repo comparison;
- no reset/delete/repair of preserved evidence games;
- no creation of a second R3 game after a valid-harness failure;
- no auto-registration of Milestone 1.

## 11. Success terminal

If Setup + Opening pass, post exactly one terminal report:

`COMPANY_FULL_REDESIGN_MILESTONE0_TEST_ROLLOUT_RESUME_READY_FOR_OWNER_REVIEW`

Status: `WAITING_OWNER_REVIEW`

Include:

- Task ID and registration main SHA;
- source acceptance comment `5368708508`;
- PR #98 exact head and merge SHA;
- deployed R3 API Version ID;
- retained/redeployed frontend Version ID and reason;
- migration preflight proving `20260821000100` was not reapplied;
- fresh game ID;
- Setup HTTP/result and exact UTF-8 codepoint proof;
- Opening HTTP/SSE/terminal result;
- DB game/state/turn/job counts and statuses;
- durable Story/choice/summary/scene evidence;
- product/UI checklist result;
- confirmation ordinary gameplay turns = 0 after Opening;
- confirmation CSA/TTS/Image/Feedback/Milestone 1 = 0;
- confirmation no preserved game was mutated.

Then STOP. Do not register Milestone 1 automatically. Owner/operator review decides the next CURRENT_TASK.

If any valid-harness failure occurs, post one precise FAILED/BLOCKED terminal with the exact first failing boundary and evidence, then STOP.