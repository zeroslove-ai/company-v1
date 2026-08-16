# Company v1 — CURRENT TASK

Status: WAITING_REVIEW
Task ID: deep-level7-live-acceptance-v10-physical-memory-runtime
Updated: 2026-08-16
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Starting point

Repository: `zeroslove-ai/company-v1`.
Branch: `company/scene-location-presence-v1`.
Canonical PR: #67, base `main`, must remain OPEN / DRAFT / UNMERGED.

Previous operator review: `5307183204` ACCEPTED `physical-sexual-residue-closure-v1`.
Reviewed executable SHA: `e4c15345c1c23afda85df09381830421d8428d73`.
Reviewed docs/final SHA: `15c3146d63ecc10ef9df2bde3e51480520b32bdb`.

Disposable TEST game: `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`.
TEST API Worker: `game-proxy-company-v1`.
Preserved manual game `78fb1d94-266f-455a-bda4-7656cc2370c1` is forbidden to access or mutate.
Production is forbidden.

Accepted architecture to validate:
- Story authors narrative.
- Extract observes narrow machine/UI projections plus one natural-language `turn_summary`.
- Commit is transaction authority, not a semantic interpreter.
- next Story receives latest six committed raw turns plus chronological older turn summaries.
- `save.scene` is canonical scene/location/presence/focal/last-speaker authority.
- physical posture/position changes require exact Story-grounded Extract evidence; unevidenced proposals must preserve prior durable state and warn only.
- compact four-slot clothing, `player_sexual_state`, evidenced `sexual_event_ledger`, `npc_stats`, CSA institutional state, progression, media/image and TTS remain narrow proven consumers.
- relation/emotion/work/general-event/open-fact style semantic ledgers are not fresh narrative-memory authority.

## Objective

Run one broad scenario-driven TEST-only acceptance of the accumulated simplified runtime after the physical/sexual evidence and residue closures. This is the acceptance step; do not split it into additional micro harness tasks unless a deterministic product defect proves a source change is required.

## Required execution

1. Freeze START HEAD and verify PR #67 remains OPEN / DRAFT / UNMERGED, base `main`.
2. Verify the currently deployed TEST API identity. If it does not contain the reviewed executable `e4c15345c1c23afda85df09381830421d8428d73`, deploy exactly that reviewed executable lineage to the TEST API Worker under the established TEST-only lease. Do not deploy frontend merely for this acceptance.
3. Canonically reset only the disposable TEST game and verify turn/action/history are empty and progression is Level 1.
4. Apply only the existing TEST-only Level-7 acceleration seam. Do not create another acceleration path and do not change Production progression.
5. Run Setup + Opening, then commit **12–16 ordinary turns in one coherent scenario**. Avoid tiny independent probes. Use a mix of:
   - at least one actual provider-returned Opening/player choice literal transported unchanged;
   - later provider choice literal(s) where available;
   - several free-text player actions.
6. Scenario coverage must naturally exercise as much of the following as possible without changing provider/model/config or inventing server-side outcomes:
   - ordinary work/conversation continuity;
   - a promise, request, refusal/agreement, or work detail that should survive beyond the six-raw-turn boundary through `turn_summary_memory`;
   - scene/location/presence transitions and stable speaker/target identity;
   - arbitrary natural-language posture/position outside any old finite posture vocabulary;
   - physical/contact intent where player input remains intent only and Story/Extract determine what actually occurred;
   - strong institutional CSA context with compliance/resistance separated from consent/comfort/affection/trust;
   - compact clothing continuity if the scenario produces a clothing change;
   - an intimate/sexual mechanical path if naturally reachable at Level 7, including `player_sexual_state` and/or `sexual_event_ledger`, while proving it does not automatically mutate relationship/consent state;
   - media/image classification as presentation-only: no/alternate classification must not block Story/Extract/Commit.
7. For posture/position evidence specifically, inspect committed state and Extract evidence turn-by-turn:
   - if a changed axis has valid exact Story evidence, the durable axis may change;
   - if Extract proposes a changed axis without valid exact Story evidence, durable state must remain at its previous value and only a warning may be emitted;
   - do not manufacture an unevidenced Extract output just to force this case. Record naturally observed cases; source/unit regressions already cover the deterministic negative path.
8. At the first boundary where turn 1 leaves the latest-six raw window, verify:
   - exactly six latest raw committed turns are projected;
   - older committed `turn_summary` entries remain chronological;
   - a meaningful older promise/work/relationship detail can influence later Story naturally without any relation/event/emotion/work ledger.
9. Verify fresh Extract/Commit does **not** recreate removed semantic-memory authority such as `open_facts`, `open_observations`, fresh general relation/event/emotion/work ledgers, or a new semantic gate/equivalent.
10. Verify preserved narrow consumers still function: canonical scene, `npc_stats`, physical/clothing UI state when observed, progression/CSA, Mind Monitor, choices, and sexual/media mechanics when reached.
11. Perform same-action replay/recovery on at least one committed ordinary turn and verify idempotent committed identity/state.
12. Record concise evidence sufficient to identify turn numbers, literal/free-text actions, summary-window boundary, physical evidence decisions, relevant narrow state, replay result, Worker version/source identity, and final cleanup. Evidence-file formatting is secondary; do not block a successful product run merely because an auxiliary evidence reader is imperfect.
13. Finish with one canonical reset of the disposable TEST game and verify turn 0 / history 0 / action 0 / Level 1 and canonical scene bootstrap.

## Stop-on-defect policy

One scenario attempt only. Do not retry/regenerate a failed provider Story/Extract to obtain a prettier result.

On the first deterministic product defect:
- capture the failing turn/action/HTTP stage and the smallest relevant raw/structured evidence;
- perform cleanup reset if safe;
- STOP as BLOCKED/FAILED for operator review.

Do **not** patch source, parser, provider, prompt, model settings, retry logic, fuzzy matching, semantic gates, compatibility layers, or DB schema inside this live acceptance task.

Auxiliary harness/evidence formatting mistakes are not product defects. If the gameplay pipeline itself already proved the requested invariant and only a disposable evidence formatter failed, report the limitation instead of starting another microtask or rerunning the whole scenario.

## Architecture constraints

- No new narrative memory ledger, entity graph, vector DB, importance score, semantic gateway, finite relationship/emotion/event taxonomy, or third summary/memory LLM.
- Do not resurrect `open_facts` / `open_observations` or equivalents.
- No direct player-input or ACTING success writer.
- No CSA physical/sexual enactment authority; CSA remains institutional context/lifecycle/mechanics only.
- Unknown optional projection/classification fails open and cannot block Story/Extract/Commit.
- Historical applied migrations are immutable.
- Image/media/TTS remain presentation sidecars.

## Authorized operations

Authorized:
- read-only Git/PR/source/deployed-identity inspection;
- TEST API Worker deployment of the exact reviewed executable only if required;
- disposable TEST game reset/setup/opening/gameplay/history/replay;
- existing TEST-only Level-7 acceleration seam;
- read-only TEST DB verification needed for acceptance evidence;
- docs completion record and immutable Issue #68 terminal report.

Not authorized:
- Production access or deployment;
- any access/mutation/reset of preserved manual game `78fb1d94-266f-455a-bda4-7656cc2370c1`;
- frontend deployment;
- migration/DDL authoring or application;
- source/runtime/test behavior edits;
- provider/model/temperature/token changes;
- retry/regeneration, parser relaxation/new parser, fuzzy repair, semantic hard gate, compatibility runtime;
- new branch/PR, merge, Ready, rebase, squash, force-push.

## Acceptance

PASS only if the 12–16 turn scenario proves the current simplified runtime can progress normally with literal/free-text input, canonical scene and machine/UI projections, evidence-gated physical state, long-context continuity through six raw turns + older natural-language summaries, replay/idempotence, and final TEST reset, without reintroducing removed semantic-memory authority or coupling media/CSA taxonomies to narrative truth.

On PASS or first deterministic blocker:
- set this file to `WAITING_REVIEW` in a docs-only completion commit;
- post one immutable terminal report to Issue #68 with exact reviewed executable/deployed identity, turn count, decisive evidence, replay result, final reset state, forbidden-operation confirmation, and final docs SHA;
- STOP for operator review. Do not generate the next task yourself.

## Execution result — 2026-08-16

Status: `WAITING_REVIEW` after one TEST-only scenario PASS. The temporary
evidence reader omitted the top-level `save_revision` field from its compact
snapshots; replay HTTP/idempotency and committed-turn invariance were captured,
and this auxiliary evidence limitation is recorded for operator review. No
provider Story/Extract failure occurred and no provider retry/regeneration was
performed.

- Start HEAD: `dd89ecbbe60ccf2c268484dd97492f6ff8a7db3d`.
- Reviewed executable: `e4c15345c1c23afda85df09381830421d8428d73`.
- TEST API deployed exact reviewed lineage: `game-proxy-company-v1`, Worker
  Version `73fb5490-c728-4f65-9325-b0ddaf57fa4a`.
- Stage B action contract gate and Wrangler dry-run: PASS. API health: HTTP
  200, `ok=true`, `edition_id=company-v1`.
- Disposable TEST game only: reset, Level-7 TEST seam, setup, Opening, 16
  ordinary turns, replay, and final reset. Preserved manual game and
  Production were not accessed.
- Opening provider choices: 4; parsed choices: 4; final canonical choices: 4.
  Turn 1 transported an unchanged provider-returned Opening literal. Turn 10
  transported a later provider-returned choice literal. The remaining turns
  used free-text actions.
- Turn 1–16 Story → Extract → Commit: PASS. Scene remained canonical; actual
  presence and speaker identities changed during the run. Post-commit state
  introduced zero new semantic-memory key paths relative to the Level-7
  baseline. No `open_facts`/`open_observations` path appeared.
- At the summary boundary, history contained 16 records. The latest raw
  subset was turns 11–16, while older turns 7–10 remained chronological with
  natural-language summaries. No relation/event/emotion/work ledger was
  introduced by the run.
- Physical/contact intent was observed as narrative input without a durable
  physical/clothing mutation. Sexual mechanics were not naturally reached;
  `player_sexual_state` remained unchanged. CSA did not block the narrative
  path (`csa_active=[]`, no CSA trigger update).
- Same-action replay: Story `meta.replayed=true` and `complete.replayed=true`,
  Extract `replayed=true`, Commit `success=true` and `replayed=true`; committed
  turn remained 16. The compact evidence reader did not retain the numeric
  `save_revision` field, so that field is an explicit operator-review evidence
  limitation rather than a runtime failure.
- Final reset: committed turn 0, processing `idle`, setup `not_started`,
  opening `not_started`, canonical scene `setup`, Level 1, `csa_active=[]`,
  history 0.
- No source/runtime/test changes, migrations, DB schema changes, frontend
  deployment, Production access, preserved-game access, provider/model change,
  or PR state change was made by this acceptance.
- External evidence artifact (not committed):
  `C:\Users\JAEWAN\AppData\Local\Temp\company-v1-deep-level7-v10-evidence.json`.
