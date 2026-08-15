# Company v1 — CURRENT TASK

Status: READY
Task ID: narrative-semantic-state-residue-simplification-v1
Updated: 2026-08-15
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Starting point

Repository: `zeroslove-ai/company-v1`.
Branch: `company/scene-location-presence-v1`.
Canonical PR: #67, base `main`, must remain OPEN / DRAFT / UNMERGED.

Accepted gameplay executable:
`5dc5ee740fad5ce395c59dcd03a263df28e526dc`.

Accepted simplified-memory live evidence:
- task `deep-level7-live-acceptance-v8-simplified-memory`
- terminal comment `5302186228`
- operator ACCEPTED review `5302207560`
- docs-only acceptance descendant `36a327992bea80c545499d5de9c6aabbf78e34be`

The accepted narrative-memory model is now:

**latest 6 committed raw turns + chronological older natural-language `turn_summary` entries.**

Do not recreate a second general narrative-memory authority.

## Owner direction

The previous open-fact system was removed because ordinary narrative meaning does not need a server-owned fact ledger. The same rule now applies to older semantic residue that still duplicates Story/summary continuity.

Story authors narrative. Extract should only derive narrow state that has a real product/UI/mechanical consumer. Commit should persist only that narrow state plus the committed Story/summary transaction.

A relation, emotion, work event, promise, refusal, conflict, or other narrative meaning does **not** need its own server taxonomy merely so a later Story can remember it. Recent raw Story and older `turn_summary` are the continuity mechanism.

This task is deletion/simplification. Do not replace removed state with a new ledger, graph, enum, gateway, classifier, score, repair layer, or additional LLM call.

## Verified residue before execution

Fresh source inspection at the accepted descendant showed:

- `src/engine/story-prompt.js` still projects `active_relations` into Story context and target authority.
- `src/engine/runtime-core/extract-observation.js` still contains closed fresh semantic contracts for `relation_updates`, general events, `npc_observations.relationship`, `npc_observations.emotion`, and `npc_observations.work`.
- general event types are still a closed set (`promise`, `refusal`, `conflict`, `intimacy`, `csa_event`, `work_event`, `secret`).
- `src/engine/runtime-core/relation-event-reducer.js` still writes `active_relations`, `npc_relationship_state`, and `event_ledger`.
- `src/engine/runtime-core/observation-reducers.js` still writes `npc_emotion` and `npc_work_state`.
- `src/engine/gameplay-state.js` still projects `npc_emotion`, `npc_relationship_state`, and `npc_work_state` through `active_npc_state`.
- current `RELATION_KINDS` is an empty Set, so the active relation subsystem cannot accept a new fresh relation kind even though old relation state still influences Story targeting.

At the same time, source inspection found real consumers that must not be casually removed in this task:

- `npc_stats` feeds the visible character stat strip and committed stat deltas.
- `sexual_event_ledger` feeds relationship/sexual records, player sexual counters, and media pool selection.
- canonical scene/location/presence, player/NPC physical state, compact clothing state, current time, progression, institutional CSA state, literal choices, committed Story/summary, and Mind Monitor have proven product consumers.

Treat this list as a starting inventory, not permission to preserve other stale fields without caller proof.

## Primary objective

Remove the remaining **continuity-only general semantic state** from the active fresh-turn Story -> Extract -> Commit path.

After this task, ordinary narrative continuity should come from raw Story + `turn_summary`, not from parallel relation/event/emotion/work semantic state.

## Required work

### A. Remove stale relation authority

Inventory every active caller/reader/writer of:
- `active_relations`
- `relation_updates`
- `npc_relationship_state`
- `RELATION_KINDS`
- relation presentation helpers that exist only for that superseded semantic authority

Expected direction if caller proof matches current inspection:
- remove `active_relations` from Story context and `target_authority`;
- remove stale active-relation fallback from target selection/order;
- remove fresh `relation_updates` from Extract V2 contract/normalization;
- remove fresh `npc_observations.relationship` from the general observation contract;
- remove Commit writers/reducers that only maintain these continuity fields;
- delete relation-only tests/helpers that no longer have a real consumer.

Do not replace this with another relationship enum or semantic object. Relationships remain narrative continuity in recent Story/summary unless a separate proven product feature requires a specific narrow state.

### B. Remove general event ledger authority

Inventory every active caller/reader/writer of:
- `event_ledger`
- `events.general`
- `GENERAL_EVENT_TYPES`
- general event importance/active/summary/participant semantic normalization

Expected direction if no real product consumer is found:
- remove fresh general-event generation/normalization;
- remove general event ledger writes/readers;
- remove closed general event type taxonomy;
- delete tests that exist only to preserve that superseded ledger.

Do **not** remove `sexual_event_ledger` under this step. It has proven visible/mechanical consumers and is a separate narrow domain.

### C. Remove continuity-only NPC emotion/work state

Inventory active callers of:
- `npc_emotion`
- `npc_work_state`
- fresh `npc_observations.emotion`
- fresh `npc_observations.work`

If their only role is to duplicate narrative continuity into Story/Extract context, remove them from:
- fresh Extract contract;
- normalization;
- Commit reducers/writers;
- Story/Extract `active_npc_state` projection;
- view-model plumbing that is not actually rendered/consumed;
- stale tests.

Do not add replacement mood/work enums or hidden summaries. Relevant emotion/work context remains in recent Story and `turn_summary`.

### D. Consumer-proof the remaining narrow state

Do not perform a blind wipe. For each remaining semantic-looking domain encountered during the inventory, identify its concrete product consumer.

Known preserve candidates with current proof:
- `npc_stats`: visible UI stat strip / committed deltas; may remain a narrow game stat system, but must not become a substitute narrative-memory ledger.
- `sexual_event_ledger` and derived sexual counters/relationship sexual record: visible/mechanical consumer.
- physical/clothing state: visible current-state/attire consumer.
- scene/location/presence: navigation/current-scene consumer.
- time/progression/CSA: actual mechanics/UI.

`csa_attitudes`, relationship summaries/presentation fields, or any other nearby state must be checked by real source callers. If there is no current product/UI/mechanical consumer, remove the active fresh writer/projection rather than preserving it for hypothetical future use.

### E. Simplify Story target/context authority

Story targeting must rely on current action/scene authority rather than stale semantic relation memory.

Preserve the existing useful priority around:
- explicit current player target when present;
- canonical current scene/focal interaction;
- current registered scene actors/speakers.

Do not invent a new target graph, relationship fallback, fuzzy target resolver, or semantic selector.

### F. Fresh Extract should describe only needed narrow observations

After deletion, fresh Extract V2 should not ask for or accept general narrative meaning merely to persist it.

Remove obsolete general semantic keys/types from the fresh contract rather than silently accepting and ignoring them forever.

Keep only current proven narrow outputs such as scene observation, required physical/clothing/UI state, needed stats/mechanics, time, Mind Monitor, CSA narrow outputs, sexual/mechanical outputs with real consumers, image presentation data, `turn_summary`, and warnings.

A malformed or omitted optional narrow projection must not kill an otherwise valid ordinary turn.

## Historical data / compatibility

Historical save JSON may physically contain removed fields such as `active_relations`, `npc_relationship_state`, `npc_emotion`, `npc_work_state`, or `event_ledger`.

Do not add a migration merely to erase old JSON in this source/test task.

Historical fields may remain inert if physical deletion would require data migration, but they must:
- receive no new fresh-turn writes;
- not be projected into new Story prompts as narrative authority;
- not gate current-format replay/Commit;
- not select targets or author outcomes;
- not require a new compatibility subsystem.

Prefer stripping/ignoring at the current-format read boundary when needed.

## Tests / proof

Update tests to prove the simplified architecture rather than preserve old semantics.

Must prove at minimum:
1. Story context/target authority no longer depends on `active_relations`.
2. Fresh Extract V2 no longer requests/accepts `relation_updates` or general `events.general` continuity semantics.
3. Fresh Extract no longer requests/accepts `npc_observations.relationship`, `npc_observations.emotion`, or `npc_observations.work` when no proven consumer remains.
4. Normal Story -> Extract -> Commit works with those semantic channels absent.
5. Commit no longer writes new `active_relations`, general `event_ledger`, `npc_relationship_state`, `npc_emotion`, or `npc_work_state` entries where those domains are removed.
6. Historical versions of those fields, if present, are inert and do not affect current Story targeting/replay.
7. `npc_stats` visible stat behavior remains intact.
8. `sexual_event_ledger` and its visible/mechanical consumers remain intact.
9. scene/location/presence, time, progression, CSA, physical/clothing, choices, Mind Monitor, and turn summaries remain intact.
10. full regression passes after deleting stale semantic-residue tests. Test count may decrease.

Do not add compatibility runtime merely to keep an old test count green.

## Forbidden

- new fact/memory/relation/event ledger;
- new semantic taxonomy/enum/allowlist to replace deleted ones;
- new relationship graph or target graph;
- vector/embedding memory;
- importance scoring;
- semantic classifier/gateway;
- fuzzy repair/matching;
- retry/regeneration to hide defects;
- extra Summary/Memory LLM call;
- new parser generation;
- provider/model/temperature/token changes;
- Production access;
- TEST live gameplay/deploy/reset under this source/test task;
- DB migration/DDL;
- historical manual-game access;
- merge / PR Ready / rebase / squash / force-push;
- new branch/PR.

## Execution discipline

- Work only on existing branch `company/scene-location-presence-v1` / PR #67.
- Source/test only.
- Do not launch the next live acceptance yourself.
- Do not create new safety/semantic gates as a substitute for deleting residue.
- When a stale semantic field has no real consumer, delete the active path instead of building an adapter around it.

## Completion

Before COMPLETE:
- provide a consumer map: removed domains vs retained domains and their concrete consumers;
- provide the exact Story-facing context/target shape after simplification;
- provide the exact Fresh Extract V2 semantic domains after simplification;
- list deleted writers/readers/validators/tests;
- run focused tests and full regression;
- run syntax checks for changed JS/MJS and `git diff --check`;
- verify PR #67 remains OPEN / DRAFT / UNMERGED.

Set CURRENT_TASK to `WAITING_REVIEW`, commit/push on the same branch, post one immutable terminal report to Issue #68, and STOP.

No live acceptance until operator review.