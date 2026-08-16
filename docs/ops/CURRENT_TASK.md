# Company v1 — CURRENT TASK

Status: READY
Task ID: story-speaker-identity-live-evidence-closure-v1
Updated: 2026-08-16
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Starting point

Repository: `zeroslove-ai/company-v1`.
Branch: `company/scene-location-presence-v1`.
Canonical PR: #67, base `main`, must remain OPEN / DRAFT / UNMERGED.

Operator review `5304838713` accepted `story-speaker-identity-projection-root-cause-v1` as accurate BLOCKED evidence, not feature success.

Reviewed gameplay/source executable remains `b3c06f931d8bd216f217412343621781670f0722`.
Focused identity regression SHA is `6446b9873ee14865a9f292e5795d4f547c3690af`; it changes tests only and proves the current source master/parser accepts registered `heroine3` while rejecting `heroine3_alias`.
The preceding terminal docs SHA is `f76e22a003a4f94dfccd61ab2f936ae91302d294`.

The prior live closure artifact reported `Unknown Story speaker_id: heroine3`, but did not preserve the exact parser/master/probe boundary needed to reconcile that diagnostic with current source. Do not infer a runtime fix from contradictory evidence.

Historical manual game `78fb1d94-266f-455a-bda4-7656cc2370c1` is READ-ONLY and must never be accessed or mutated. Production access is forbidden.

## Objective

Close the contradictory speaker-identity evidence with one bounded dedicated TEST live run on the exact reviewed runtime, preserving canonical transport/parser evidence. If the registered `heroine3` path succeeds, continue the previously blocked literal-choice closure. If it fails, preserve enough evidence to identify the exact deterministic boundary and STOP without workaround.

## Required work

1. Verify #67 topology/ancestry and separate reviewed executable `b3c06f9...` from test/docs descendants.
2. Verify the TEST API deployed executable identity. Deploy exact reviewed executable `b3c06f931d8bd216f217412343621781670f0722` only if identity is not already exact. No frontend deploy.
3. Use only the existing reviewed canary/SSE transport decoder and dedicated TEST game path. Do not create another probe/parser/decoder generation.
4. Run one bounded Setup -> Opening flow. Preserve in TEMP evidence sufficient to identify:
   - Setup/opening canonical registered character IDs relevant to the active Opening plan;
   - provider raw Story terminal payload/frame before fresh parsing;
   - parser master registered character IDs at the parse boundary;
   - exact parser success/error code/message;
   - Opening returned provider-authored four literal choices if successful.
5. If the same raw `[DIALOGUE speaker_id="heroine3"]` fails while parser master demonstrably contains registered `heroine3`, classify the exact source/runtime drift or boundary defect from preserved evidence and STOP. No retry.
6. If Opening succeeds, select exactly one returned provider-authored choice literal unchanged as the next `player_action`; verify persisted/history identity is byte-for-byte the selected literal and current-format committed `parsed_blocks` remain replay authority.
7. Then submit one ordinary free-text turn to prove free text remains ordinary gameplay and verify Story -> Extract -> Commit plus replay/recovery/idempotence.
8. Do not require a particular semantic relation/event/emotion/sexual outcome from this closure; this task tests identity/choice/replay transport boundaries, not provider semantic luck.
9. Reset only the dedicated TEST game at the end, including after a deterministic failure if reset remains safe. Never touch the preserved manual game.
10. Preserve evidence in OS TEMP, not repository paths. Do not commit live artifacts.

## Architecture constraints

- Registered stable character IDs remain strict finite integrity authority. No alias acceptance/fuzzy repair/parser relaxation.
- No source/runtime/test change is authorized unless this fresh bounded run proves a deterministic repository defect. If proven, STOP as BLOCKED with exact evidence; do not hotfix in this task.
- No retry/regeneration, provider/model/temperature/token change, fallback Story, regex cleanup, semantic hard gate, or new parser.
- Exactly-four choices are provider-authored literal strings. No server semantic fallback/choice metadata.
- Recent six raw Story + older natural-language `turn_summary` remains continuity authority.
- Story authors narrative; Extract observes grounded facts; server owns identity/provenance/transaction/idempotence/narrow projections.
- CSA remains institutional rule/context, not consent/comfort/affection/emotion authority.
- Scene/location/presence, compact clothing UI continuity, TEST-only Level-7 seam, sexual state/media adapters, image catalogs/pools/families, and TTS are protected actual-consumer systems. Media classification must never gate Story/Extract fact occurrence.
- Historical applied migrations are immutable.

## Authorized operations

Authorized:
- read-only source/history inspection on existing branch;
- exact TEST API deploy of reviewed executable only if required by identity mismatch;
- dedicated TEST Setup/Opening/two bounded ordinary turns as described;
- existing TEST-only Level-7 seam only if already required by the dedicated harness; do not manufacture gameplay state;
- dedicated TEST game reset;
- TEMP evidence capture;
- docs-only completion update.

Not authorized:
- source/runtime/test modification or migration/DDL;
- frontend deploy;
- Production access;
- any access/mutation/reset of preserved manual game `78fb1d94-266f-455a-bda4-7656cc2370c1`;
- new branch/PR, merge, Ready, rebase, squash, force-push;
- retries/regeneration or provider/model changes.

## Completion

On success or deterministic BLOCKED finding:
- report exact deployed identity, dedicated TEST game ID, canonical speaker-ID evidence, raw provider speaker ID, parser-master evidence, literal-choice identity result if reached, free-text/replay result if reached, reset proof, and exact branch ancestry;
- set CURRENT_TASK to `WAITING_REVIEW` in a docs-only completion commit;
- post one immutable terminal report to Issue #68;
- STOP for operator review.
