# Company v1 — CURRENT TASK

Status: WAITING_REVIEW
Task ID: cut3-relation-event-authority-v1
Updated: 2026-08-15
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution queue for Company v1.

## Why this task exists

Cut 2 Scene / Location / Presence Authority is closed through TEST Stage B and scoped live acceptance. The post-Cut2 game-model checkpoint at `a64d9913115e4eb57282823e3ae2ab04f45f014d` independently identified Relationship / Event Authority as the highest-priority remaining root defect.

The preserved 7-turn manual game proves that meaningful contact, explicit boundary reaction, discomfort, apology, and continued interaction occurred in Story, while `active_relations`, `event_ledger`, and `sexual_event_ledger` remained empty and heroine4 relationship state largely stayed at its initial values. This is durable-consequence loss, not merely a presentation complaint.

Current source also has a direct duplicate authority defect: observational `reduceRelationUpdates()` and Engine-side `applyEngineRelationEnactments()` both mutate `active_relations` independently.

The owner has now resolved the PR-topology blocker:

- PR #67 is the single canonical implementation PR and is retargeted to `main`.
- former stacked PR #65 and #66 are closed as superseded review containers only; their commits remain in #67 ancestry.
- no history rewrite/rebase/squash was performed.
- do not create another PR or branch for this Cut.

## Binding authority

Read and obey in order:

1. `/CURRENT_TRUTH.md`
2. `/AGENTS.md`
3. `/docs/audit/company-v1-current-truth-2026-08-13/09_CURRENT_TRUTH.md`
4. `/docs/audit/company-v1-current-truth-2026-08-13/10_SOLE_WRITER_DECISION.md`
5. `/docs/audit/POST_CUT2_GAME_MODEL_RECOVERY_2026-08-14.md`
6. this file
7. Issue #68 persistent roadmap/evidence comment

Current source/Git/live TEST truth outrank prose. One durable domain has one canonical writer. Historical applied migrations and preserved evidence are immutable.

Manual playtest game `78fb1d94-266f-455a-bda4-7656cc2370c1` is immutable READ-ONLY evidence and must never be reset or mutated.

## Repository / PR / identity guard

Repository: `zeroslove-ai/company-v1`
Expected branch: `company/scene-location-presence-v1`
Canonical PR: #67
Expected PR base: `main`
Expected PR state: OPEN / DRAFT / UNMERGED
Checkpoint starting HEAD: `a64d9913115e4eb57282823e3ae2ab04f45f014d`
Reviewed/deployed pre-Cut3 runtime executable: `a919baf87d92e841e64b731576ccb176d5745570`

Before edits:

1. fetch current remote HEAD and PR #67 metadata
2. confirm #67 still targets `main`, remains Draft/Open/Unmerged, and no new PR exists for this work
3. confirm #65/#66 closure did not rewrite branch ancestry
4. inspect every executable change after `a919baf...`; docs-only task/checkpoint commits must remain distinguishable from runtime
5. verify current source writer/caller inventory below from actual callers, not filenames
6. if branch/PR ancestry unexpectedly diverged, STOP BLOCKED rather than rebasing or opening a new PR

## Goal

Make one canonical in-memory Relation/Event reducer the sole owner of fresh-turn durable relationship/event consequences before `commit_company_turn` persists the save.

The target flow is:

`Engine mandatory relation facts + exact Extract relation/event observations -> typed relation/event inputs -> ONE canonical reducer -> active_relations / relationship consequence fields / event ledgers -> commit_company_turn`

No other fresh-turn module may independently mutate those durable domains after this Cut.

## Required writer inventory before implementation

Trace actual callers/writes for at least:

- `active_relations`
- `npc_relationship_state` fields (`closeness`, `romance_status`, `current_boundary`, milestones, relationship summary if currently writable)
- `event_ledger`
- `sexual_event_ledger`
- any relation-presentation helper/mirror
- Engine CSA relation enactments
- Extract `relation_updates`, NPC relationship observations, general events, sexual events
- Story/context/frontend readers of these fields

Classify each as canonical writer, typed input producer, derived projection, compatibility reader, or deletion candidate.

Do not add a second coordinating writer while leaving both current writers alive.

## Canonical reducer requirements

Create or refactor toward one explicit canonical relation/event reducer boundary. Exact file naming is implementation choice, but ownership must be unmistakable.

It must consume typed inputs from two origins:

1. **Engine-authoritative relation events** derived deterministically from validated mandatory/CSA enactments.
2. **Observational relation/event inputs** derived from fresh Extract only when backed by exact Story evidence and registered identities.

Required deterministic rules:

- Engine mandatory relation event wins over conflicting observational Extract for the same actor/turn/domain.
- unresolved/unknown actor or target cannot create a relation/event consequence; drop with warning, do not reject the ordinary turn.
- player free input is intent/attempt, never automatic relation/event success.
- exact Story/structural evidence is required for observational consequence.
- applying the same typed event twice is idempotent.
- a new incompatible active relation for the same actor deterministically ends/supersedes the prior canonical relation before activating the new one.
- explicit valid end closes the matching active relation; ending a nonexistent relation produces a warning, not a turn failure.
- relation presentation labels/helpers never choose the durable target and never write canonical relation state.
- general/sexual event ledger dedupe must be deterministic and replay-safe.
- do not invent a relationship milestone or relationship summary from player input text alone.
- do not let uncertainty in Extract block the Story/turn; uncertain observation means no durable consequence plus warning.

## Mandatory deletion / simplification targets in this Cut

On successful focused proof, remove the duplicate fresh-turn writer paths rather than wrapping them forever.

At minimum:

- `csa-commit-reducer.js` must stop directly mutating `active_relations`; it may emit typed Engine relation inputs only.
- `observation-reducers.js` must stop independently owning `active_relations` and event-ledger durable writes; it may validate/project typed observational inputs for the canonical reducer.
- any superseded helper whose only purpose was one of those duplicate writes must be deleted or reduced to pure input normalization.
- obsolete tests asserting the old two-writer implementation must be REWRITE/DELETE, not preserved with compatibility code.

Do not delete historical persisted-data/replay adapters unless caller/data proof for their deletion is part of this exact domain and is complete.

## Scope boundary with Physical/Sexual and Memory Cuts

This Cut may persist **relation/event consequences** of physical or sexual interactions when exact evidence exists, but it must NOT become the full physical-state or sexual-state rewrite.

Do not redesign posture/clothing/contact geometry, player arousal, summary generation, recent memory, parser generations, setup/opening catalog semantics, or frontend session architecture here.

If a needed relation/event consequence requires a new canonical durable field/schema, STOP at a reviewed Stage-A migration proposal; do not apply a migration in this task unless the existing save shape already supports the required state.

Prefer using existing `active_relations`, `npc_relationship_state`, `event_ledger`, and `sexual_event_ledger` shapes if they can represent the invariant cleanly.

## Player-agency / game-flow rule

Do not solve missing consequence by hard-gating free player inputs or forcing the Provider to narrate a predetermined social outcome.

Story remains responsible for natural NPC reaction and outcome. Extract observes. The canonical reducer decides only whether supported evidence becomes durable fact.

A malformed/ambiguous optional relation observation must degrade to no relation mutation with warning; it must not make an otherwise valid turn fail.

Do not add retry/regeneration, provider/model/temperature/token changes, fuzzy target repair, semantic regex gates, or synthetic success inferred directly from player action text.

## Focused invariants / tests

Keep or add behavior-level tests proving at least:

1. Engine relation input and conflicting Extract input in one turn -> Engine wins deterministically.
2. ordinary exact-evidence Extract relation update -> canonical relation is created.
3. unresolved target -> no relation created, warning only.
4. same input replay -> no duplicate active relation/event.
5. superseding relation -> prior canonical relation ended before new active relation.
6. explicit relation end -> matching active relation ended; nonexistent end warns only.
7. relationship boundary/closeness observation changes only with exact evidence and registered actor.
8. general event dedupe is replay-safe.
9. sexual event dedupe/evidence remains replay-safe without turning player intent into success.
10. degraded/invalid optional Extract relation data does not block Commit and does not mutate relation/event state.
11. CSA reducer no longer writes `active_relations` directly.
12. observation reducer no longer independently writes the canonical relation/event durable domains.
13. Story context/frontend readers still see the canonical resulting state.

Classify touched existing tests KEEP / REWRITE / DELETE. Do not restore old phase/source-text/compatibility tests.

Run focused suites first, then full `npm.cmd test`, syntax checks for changed JS/MJS, and `git diff --check`.

## Live / DB / deployment boundary for this task

This is the **source + focused contract implementation stage** only.

Allowed:
- source/test/docs changes on current branch
- local tests/static checks
- read-only TEST DB/manual evidence inspection when needed
- update PR #67 description if necessary to describe Cut 3 scope

Forbidden:
- new branch or PR
- merge / PR Ready / rebase / squash
- Production access
- TEST gameplay writes/reset
- DB migration apply or DDL/DML
- API/frontend deployment
- manual playtest mutation/reset
- provider/model/config change
- retry/regeneration/fuzzy repair/new parser generation
- unrelated Scene/Memory/Setup/Physical-state refactor

## Success criteria

Success requires:

1. exactly one fresh-turn canonical relation/event reducer owns all targeted durable relation/event writes
2. Engine and Extract become typed inputs with deterministic precedence
3. current duplicate `active_relations` writers are removed
4. optional ambiguous observations remain fail-open for game flow while durable acceptance remains evidence-gated
5. focused invariants pass
6. full current test suite passes without stale compatibility code
7. no DB/deploy/Production/manual-game mutation
8. PR #67 remains the only open implementation PR, Draft/Open/Unmerged, based on `main`
9. exact executable FINAL_SHA is reported separately from docs-only completion state

On success:

- set Status `WAITING_REVIEW`
- post a terminal COMPLETE report to Issue #68 with exact START_SHA/FINAL_SHA, changed writer map, deleted duplicate paths, test results, and statement that live TEST/deploy was not run
- STOP for operator review before any deployment/live acceptance or migration

On failure/block:

- do not patch around the architecture conflict
- set WAITING_REVIEW and report exact blocker/evidence
- STOP

Success phrase:

`CUT 3 RELATION / EVENT SOLE AUTHORITY IMPLEMENTED — AWAITING OPERATOR REVIEW`
