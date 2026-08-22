# Company — CURRENT TASK

Status: WAITING_OWNER_DECISION
Task ID: company-r3-stable-test-owner-hold-v1
Mode: HOLD GREEN TEST BASELINE -> WAKE ONLY ON EXPLICIT OWNER INPUT OR REAL DEFECT
Updated: 2026-08-23 02:23 KST
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

Reuse this exact existing `docs/ops/CURRENT_TASK.md` in place. This is a non-executable hold. Codex/Hermes must not start work from this file while Status is `WAITING_OWNER_DECISION`.

## 0. Accepted baseline

Binding authority:
- product-first canon PR #95 head `9d9aec5a198d8673eb37aba8a0541adbd6c84627`;
- A-prime engine/live-first canon PR #96 head `9d44c4719fa6b098d53cac5cf946b93fafa6786b`;
- owner lean-development directives `5380380688` and `5380381500`;
- capability TEST freeze review `5381387742`;
- reset rollout acceptance/freeze review `5381592085`;
- post-reset stability terminal `5381648347`;
- post-reset stability acceptance review `5381662701`;
- accepted executable source `19a4c2b8d9d2d1e3fc4a93c184d4b52e785af300`;
- current TEST API `game-proxy-company-r3` version `e4317d6f-9bfe-4774-a744-90789d066d4e`;
- current TEST frontend `gamebuilder-company-r3` version `e0b654d7-06e1-4851-92a3-02af5cf5ba59`;
- reset migration `20260823000100_company_r3_same_game_reset` applied exactly once to TEST.

Accepted/frozen TEST surfaces:
- per-game capability boundary: GREEN/frozen;
- latest-turn feedback revision + continuation: GREEN/frozen;
- same-game reset + refresh + post-reset Turn1: GREEN/frozen;
- ordinary human-like product/agency/continuity play through Turn7: GREEN;
- history/export and TTS previously accepted;
- choices remain fail-open: no valid Story tail may yield zero buttons while free input remains usable.

## 1. Why this is a hold

The latest six-turn human-like continuation found:
- no repeatable player-agency substitution or contradiction;
- coherent NPC identity, movement/location, request/refusal/self-state continuity;
- no duplicate chronology, stuck job, transport/state corruption, or pre-reset resurrection;
- one final no-tail choice reliability miss with working free input, which is not a blocker under the frozen choice policy.

There is currently no evidence-backed source correction to start automatically.

Known non-actionable boundaries:
- image sidecar is deferred because verified approved media bytes/manifest/serving authority are absent;
- CSA rules 7/9 remain frozen provider/model capability exceptions and must not be rerun or tuned absent explicit owner policy change;
- Production rollout is not authorized by any current owner instruction.

Do not invent work merely to keep the loop busy.

## 2. Wake conditions

A new executable CURRENT_TASK may be registered only after one of these occurs:

A. **Explicit owner product/deployment instruction**
- owner names the next feature, correction, release step, or authorizes a bounded Production action.

B. **Approved image/media input arrives**
- verified approved image bytes/URLs plus finite manifest/binding authority sufficient to implement the existing R3 media slot without inventing assets or semantic authority.

C. **Explicit owner CSA7/9 policy change**
- owner authorizes provider/model/config work or otherwise changes the frozen capability-exception policy.

D. **New real user-visible defect**
- reproducible product defect from actual play or deterministic transport/state/data corruption that materially affects the player.

A lone provider semantic miss, an isolated no-tail choice, stale scanner advisory already classified, or desire for more QA is not by itself a wake condition.

## 3. Forbidden while held

Do NOT:
- start another QA/playtest campaign;
- create new games, reset games, or mutate existing TEST games;
- patch source/runtime/frontend/tests/content/config;
- deploy/redeploy API/frontend;
- apply/reapply migrations;
- change RLS/grants/schema/secrets;
- touch Production;
- rerun CSA7/9 or tune provider/model/prompt/timeouts;
- fabricate image assets/URLs/manifest;
- create an auth/security/ops/test framework;
- create another CURRENT_TASK file or ops branch;
- overwrite this hold without a valid wake condition and operator review.

Read-only inspection is allowed only when needed to classify a genuine wake event.

## 4. Hold protocol

If a watcher notification arrives while no wake condition exists:
- re-read Issue #68;
- confirm this hold is still current;
- do not mutate CURRENT_TASK or runtime;
- report `WAITING_OWNER_DECISION`.

If a wake condition exists:
- operator must first review the exact new evidence/instruction in Issue #68;
- then overwrite this same file in place with one narrowly scoped executable task;
- verify the registration is docs-only and exactly one existing path changed;
- post the new READY registration comment;
- then STOP and allow the watcher to execute it.

## 5. Current classification

`STATUS: WAITING_OWNER_DECISION`

The current TEST baseline is accepted and stable enough that autonomous development should stop here until owner input or a real defect provides new product authority.
