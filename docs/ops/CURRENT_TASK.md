# Company v1 — CURRENT TASK

Status: WAITING_REVIEW
Task ID: deep-level7-live-acceptance-v9-simplified-runtime
Updated: 2026-08-15
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Starting point

Repository: `zeroslove-ai/company-v1`.
Branch: `company/scene-location-presence-v1`.
Canonical PR: #67, base `main`, must remain OPEN / DRAFT / UNMERGED.

Accepted source/test executable:
`0fc509911e5bdf5aabb92fe5241a845f686bdb17`.

Accepted correction review:
Issue #68 comment `5302484444`.

The active narrative continuity model is intentionally simple:

**latest 6 committed raw turns + chronological older natural-language `turn_summary` entries.**

Fresh general narrative relation/event/emotion/work state has been removed. Do not restore it and do not introduce a replacement memory/semantic layer.

TEST Supabase: `fmcrspgxstsmxxsmkeee`.
Disposable TEST game: `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`.
Historical manual game `78fb1d94-266f-455a-bda4-7656cc2370c1` must not be accessed or mutated.

## Purpose

Run one broad Level-7 TEST acceptance against the simplified runtime after semantic-residue deletion and fail-open closure.

This is not another narrow architecture audit. Exercise enough real gameplay in one run to determine whether the simplified Story -> Extract -> Commit system is actually usable and continuous without the removed general semantic state.

Do not patch source during this lease. On the first deterministic product defect, preserve evidence and stop.

## Authorized operations

- deploy the exact accepted source/test executable lineage to the TEST API Worker if needed;
- reset only disposable TEST game `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`;
- invoke the existing TEST-only Level-7 acceleration seam;
- run the canonical Story -> Extract -> Commit -> context/readback/replay path;
- query TEST DB/readback evidence needed for acceptance;
- use only existing diagnostic switches if genuinely needed, and disable them before terminal.

No Production, manual-game access, migration/DDL, provider/model changes, source patching, or new branch/PR.

## Scenario coverage

Use a scenario-driven run rather than one micro-test per invariant. Aim for roughly 8-12 committed ordinary turns if no earlier decisive defect occurs.

### A. Core playability

- setup/opening succeeds;
- free-text player actions work;
- provider-authored literal choices are displayed and at least one exact literal choice round-trips as the next player action;
- explicit player intent/action kind and target are not silently substituted;
- Story -> Extract -> Commit identities and turn order agree.

### B. Simplified narrative continuity

Naturally establish several ordinary narrative facts across the run, such as:
- a work promise or refusal;
- a relationship reaction or boundary;
- an emotional reaction;
- a current work situation.

Verify continuity is carried by recent raw Story and, once older than the six-turn raw window, by `turn_summary` only.

Do not require or create `active_relations`, general `event_ledger`, `npc_relationship_state`, `npc_emotion`, or `npc_work_state` as fresh continuity authority.

### C. Removed semantic residue must stay non-authoritative

Across fresh turns/readback verify:
- new current-format Commit does not create fresh general relation/event/emotion/work continuity state;
- stale or accidental optional provider residue, if emitted, is dropped warning-only and does not kill an otherwise valid turn;
- valid sibling narrow projections in the same Extract result survive;
- historical inert fields, if physically present, do not become current Story authority.

Do not fail merely because an old inert JSON field exists.

### D. Retained real consumers

Exercise, where naturally reachable:
- visible `npc_stats` changes and UI/readback projection;
- scene/location/presence;
- player/NPC physical and compact clothing continuity;
- progression and time;
- strong institutional CSA as context only;
- Mind Monitor;
- sexual mechanics / `sexual_event_ledger` only if naturally reached, without forcing the scenario merely to satisfy coverage;
- media/image remains presentation-only and must not determine narrative truth.

### E. Long-enough continuity

Cross the six-raw-turn boundary. Verify:
- latest six committed raw turns are the recent Story context;
- at least one meaningful early turn leaves the raw window;
- its committed `turn_summary` remains in chronological older memory;
- a later relevant Story can naturally carry that older continuity without a general semantic ledger.

### F. Replay/recovery

- replay at least one committed current-format turn;
- committed turn/save revision remains invariant on replay;
- refresh/context readback reconstructs latest raw turns + older summaries consistently;
- replay does not recreate removed semantic state.

## Failure discipline

At the first deterministic product failure:
- record exact turn/action id and failing stage;
- preserve Story text, Extract result/error, Commit/readback, relevant summaries/context, HTTP/SSE terminal state, Worker identity, and TEMP evidence path;
- stop without retrying for a favorable semantic outcome;
- do not patch source or add a gate/repair/retry/model change during this lease.

Harness-only failure may be classified separately, but do not confuse it with product failure and do not create a new gameplay gateway to work around it.

## PASS criteria

PASS requires one coherent live TEST run proving:
1. ordinary gameplay remains usable after semantic-state deletion;
2. removed relation/general-event/emotion/work channels are not needed for continuity and do not block fresh turns;
3. latest-six raw Story + older `turn_summary` carries continuity across the raw-window boundary;
4. retained narrow machine/UI state still functions where exercised;
5. replay/recovery is idempotent;
6. final dedicated TEST cleanup succeeds.

Test counts alone are not acceptance evidence.

## Completion

After PASS or first decisive failure:
- reset only the disposable TEST game to clean documented baseline;
- disable any temporary diagnostic switch used;
- set CURRENT_TASK to `WAITING_REVIEW` in one docs-only completion commit;
- post one immutable terminal report to Issue #68;
- STOP. Do not create the next task yourself.

## Forbidden

- Production access;
- any access/mutation/reset of historical manual game `78fb1d94-266f-455a-bda4-7656cc2370c1`;
- source/runtime patch during acceptance;
- migration/DDL;
- provider/model/temperature/token changes;
- retry/regeneration to obtain a lucky pass;
- new fact/relation/event/emotion/work memory ledger;
- new semantic taxonomy/gateway/repair layer;
- new parser generation;
- merge / PR Ready / rebase / squash / force-push / new branch / new PR.

## Execution result — waiting for operator review

The accepted executable lineage `0fc509911e5bdf5aabb92fe5241a845f686bdb17`
was deployed to the TEST Worker `game-proxy-company-v1` as Version
`20052ce9-4c65-4158-9bae-5a7cd8372e1e`. The Stage B action contract gate and
Wrangler dry-run passed before deployment; health returned HTTP 200 with
`edition_id=company-v1`.

One coherent dedicated TEST run completed eight ordinary Story → Extract →
Commit turns. Setup/opening passed, an exact literal Opening choice
round-tripped, free-text actions committed, removed semantic residue remained
empty/non-authoritative in fresh Extract results, and replay returned
`meta.replayed=true`, `complete.replayed=true`, `extract.replayed=true`, and
`commit.replayed=true` without changing committed turn or save revision. The
live history readback contained eight committed records with natural-language
`turn_summary` values, and the accepted source projection contract uses the
latest six raw turns plus chronological older summaries. The temporary
acceptance probe requested a broad `recent_turns=15` readback, so its artifact
does not claim a direct six-item response; the six-plus-summary boundary is
verified from the accepted projection contract alongside the live history.

Preserved evidence: `C:\Users\JAEWAN\AppData\Local\Temp\company-v1-deep-level7-v9-evidence.json`.
Final TEST reset passed with `committed_turn=0`, `processing_status=idle`,
setup/opening `not_started`, zero recent turns, and `save_revision=973`.
No Production or historical manual-game access occurred. No source,
migration, provider/model, or repository runtime file changed.
