# Company v1 — CURRENT TASK

Status: READY
Task ID: merge-hospital-spine-alignment-test-manual-handoff-v1
Updated: 2026-08-18
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority for this task identity.

## 0. Review decision and binding canon

Binding design:

`docs/COMPANY_V1_HOSPITAL_REFERENCE_SPINE_ALIGNMENT_CANON_2026-08-18.md`

Predecessor task:

`hospital-reference-spine-alignment-v1`

Predecessor terminal: Issue #68 comment `5325444104`.

Owner/operator review decision: `ACCEPT`.

Reviewed PR:

- PR: `#82`
- PR base: `main`
- reviewed base main: `20080497d782598600200afa45b5171087595ff9`
- reviewed executable source/test SHA: `67b8cce260e23a953ef8d8353b96fb0c316c64e2`
- reviewed PR/lifecycle head: `4cc4b67b1b29d9269eedbbbb81b9ebf38ee76928`
- exact-head Company v1 tests run: `32115092019` — SUCCESS
- PR state at registration: OPEN / UNMERGED / MERGEABLE

The rework is accepted because it completes the bounded corrections required by Issue #68 review `5323687546` while preserving the binding Hospital Reference Spine Alignment canon:

1. fresh Extract prompt is positive/current-contract oriented instead of teaching dead legacy semantic vocabulary;
2. fresh provider `scene_observation.focal_candidate_id` is removed;
3. unsupported fresh `*.posture` actor-evidence paths are removed while current `position_label` remains because it has a proven presentation consumer;
4. one actor-scoped exact Story evidence vocabulary is consumed directly by retained reducers;
5. old blank summaries retain bounded committed-Story read-time continuity fallback;
6. Mind Monitor remains in the same Extract call, presentation-only and fail-open;
7. exact single/multi-NPC same-destination structural navigation and exact clothing CSA mechanics remain intact;
8. historical persisted compatibility remains isolated and is not fresh semantic authority.

No further source repair is authorized by this task.

## 1. Frozen execution identity

Repository: `zeroslove-ai/company-v1`

Required pre-merge main:

`20080497d782598600200afa45b5171087595ff9`

Expected task branch:

`company/merge-hospital-spine-alignment-test-manual-handoff-v1`

At execution start:

1. fresh-fetch GitHub/main and PR #82;
2. require current `main` to equal the required pre-merge main exactly;
3. require PR #82 to remain OPEN, non-Draft, mergeable, base `main`, and exact head `4cc4b67b1b29d9269eedbbbb81b9ebf38ee76928`;
4. require the exact-head Company v1 tests for that head to remain SUCCESS;
5. require PR #82 changed paths/scope to remain the reviewed Hospital spine rework plus workflow lifecycle docs only;
6. if any of these identities drift, STOP `BLOCKED_HOSPITAL_SPINE_MERGE_DRIFT`. Do not rebase, repair, infer, or substitute a newer head.

## 2. Phase A — normal merge only

Reverify the reviewed PR and then normal-merge PR #82 to main using exact expected head protection.

Requirements:

- merge method: normal merge (`merge`), not squash/rebase;
- require GitHub to accept exact expected head `4cc4b67b1b29d9269eedbbbb81b9ebf38ee76928`;
- capture the returned merge commit SHA;
- fresh-fetch `main` and require `main` == returned merge commit SHA;
- do not merge any other PR;
- do not alter source/config/tests/content during this task.

If merge fails or the PR/head changes, STOP and report exact state. No source repair is authorized here.

## 3. Phase B — exact merged-main CI

Require the Company v1 test workflow for the exact merged-main SHA to complete SUCCESS.

Also perform/read the normal non-mutating verification available for the merged main:

- repository/worktree integrity as applicable;
- no unexpected changed source beyond PR #82;
- no new migration/schema/content/provider/model changes.

If merged-main CI is not green, STOP `BLOCKED_HOSPITAL_SPINE_MERGED_MAIN_CI`. Do not patch around the failure in this task.

## 4. Phase C — TEST deployment and structural smoke only

Deploy the exact merged-main runtime to TEST only.

Expected deployment behavior:

- deploy the exact merged-main API Worker/runtime used by Company v1 TEST;
- frontend source is not changed by PR #82, so do not perform an unnecessary frontend source workaround/rewrite; retain the existing source-equivalent TEST frontend unless an exact structural deployment requirement proves otherwise;
- record deployed Worker version(s) and exact source/main SHA;
- run effective TEST DB contract checks read-only;
- run Action Stage A / Scene Stage B read-only contract gates where applicable;
- run API structural/read-only smoke and frontend asset/reachability smoke;
- smoke may use an explicitly disposable UUID only if the smoke contract requires one and must not become gameplay acceptance;
- no Story/Extract/Commit gameplay loop is authorized in this phase.

Hard deployment boundaries:

- TEST only;
- Production/hospital-v2 forbidden;
- no migration, DDL, migration-history repair, broad DB push, or history mutation;
- no provider/model/TTS/binding change;
- no source/config/content repair during deployment;
- no retry-until-lucky or gameplay regeneration.

If exact merged-main cannot deploy or structural smoke fails, STOP with the exact blocker. Do not alter application semantics in this task.

## 5. Phase D — create one genuinely fresh manual TEST fixture, last step only

This phase runs only after merge, merged-main CI, exact TEST deployment, and structural smoke all pass.

Create exactly one fresh disposable Level-7 TEST game for the user's manual acceptance.

Freshness is mandatory because a prior handoff accidentally reset/reused an old evidence UUID. Do not repeat that failure.

Required fixture procedure:

1. generate one new UUID that has never appeared in prior Company v1 manual/QA/evidence work;
2. before any write, prove that UUID is absent from at least `games`, `game_save`, `game_actions`, and `game_turns` in TEST;
3. if any row exists, discard that candidate UUID without mutating it and generate another new UUID;
4. create/seed only the proven-absent UUID as a TEST-only Level-7 turn-zero fixture using the current authorized fixture path;
5. never reset/reseed/reuse any pre-existing UUID;
6. preserve every existing manual/QA/evidence game read-only, including `9755b57b-5cbb-44dd-a624-020fe516c16d`, `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`, and all other prior fixtures;
7. perform ZERO Setup/Opening/Story/Extract/Commit gameplay calls in the final manual fixture;
8. verify after preparation: `committed_turn=0`, action count `0`, active committed turn count `0`, Level `7`, TEST-only identity, and public frontend URL HTTP reachable;
9. record the exact new game UUID and public TEST frontend URL.

The user, not Codex/Hermes, is the gameplay acceptance authority for this fixture.

## 6. Final terminal and stop condition

On success:

- set this CURRENT_TASK to `WAITING_USER_LIVE_ACCEPTANCE` on this task branch;
- record exact reviewed PR head, merge-main SHA, merged-main CI run/result, TEST Worker version(s), structural smoke/gate results, new fixture UUID, zero-turn readback, and public TEST URL;
- post one terminal report to Issue #68;
- terminal classification: `HOSPITAL_REFERENCE_SPINE_ALIGNMENT_WAITING_USER_LIVE_ACCEPTANCE`;
- STOP.

Do not create another CURRENT_TASK and do not start another Cut.

The user will perform the next long manual product-play acceptance, targeting roughly 30–50+ turns. Follow-up repair authority may be created only from that user-owned evidence after explicit review.

## 7. Absolute prohibitions

- no unreviewed source/test/config/content changes;
- no merge of anything except reviewed PR #82;
- no automated long live QA;
- no gameplay turns in the final manual fixture;
- no reset/mutation/reuse of any pre-existing manual/QA/evidence game;
- no Production or hospital-v2 operation;
- no migration/DDL/history repair/broad DB push;
- no provider/model/TTS/binding change;
- no semantic router/classifier/verifier;
- no finite generic physical/sexual grammar;
- no relationship/event/emotion/open-fact ledger;
- no generic CSA execution DSL;
- no retry/regeneration loop;
- no next roadmap Cut.
