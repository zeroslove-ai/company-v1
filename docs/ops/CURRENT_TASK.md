# Company v1 — CURRENT TASK

Status: WAITING_REVIEW
Task ID: narrative-semantic-residue-fail-open-closure-v1
Updated: 2026-08-15
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Starting point

Repository: `zeroslove-ai/company-v1`.
Branch: `company/scene-location-presence-v1`.
Canonical PR: #67, base `main`, must remain OPEN / DRAFT / UNMERGED.

Candidate executable under correction:
`648a823a7b336aef84d0b900f98f41d326c56822`.

Current docs-only branch head before this registration:
`09c0eca2cc6bb4a9544e47ed026fb9d92cc222a1`.

Operator review requiring correction:
Issue #68 comment `5302348564`.

The accepted narrative continuity architecture remains:

**latest 6 committed raw turns + chronological older natural-language `turn_summary` entries.**

Do not restore any general fact/relation/event/emotion/work memory authority.

## Confirmed defect

The previous deletion cut correctly removed continuity-only relation/general-event/emotion/work writers and Story projections, but introduced a replacement semantic hard gate in `src/engine/runtime-core/extract-observation.js`.

`prepareFreshExtractInput()` currently throws `FRESH_SEMANTIC_RESIDUE_FORBIDDEN` when a fresh provider output contains non-empty:
- `relation_updates`;
- `events.general`;
- `npc_observations.<id>.relationship`;
- `npc_observations.<id>.emotion`;
- `npc_observations.<id>.work`.

That turns obsolete optional provider residue into a whole-turn failure. This violates the architecture: removed semantic channels must have no authority, and optional observation noise must not erase an otherwise valid Story/Extract result.

## Objective

Close this one boundary defect without restoring the removed semantic state and without adding another gateway.

Fresh current-format normalization must:
- never persist or expose the removed semantic channels;
- tolerate accidental stale/unknown optional observation residue by dropping it with diagnostic warning(s);
- preserve valid sibling narrow projections in the same Extract result;
- continue to hard-fail genuine structural authority violations such as arbitrary save/state patches.

This is source/test only. No live acceptance in this lease.

## Required work

### A. Remove the bespoke semantic hard gate

Delete the `FRESH_SEMANTIC_RESIDUE_FORBIDDEN` throw path and any tests whose only purpose is to require that semantic hard failure.

Do not replace it with:
- another per-domain semantic rejection error;
- regex/keyword detection;
- fuzzy repair;
- provider retry/regeneration;
- a generic semantic classifier/gateway.

### B. Make fresh optional observation handling fail open

At the existing fresh Extract normalization boundary, obsolete or unknown optional provider observation fields must not become current-format authority.

Preferred architecture:
- true forbidden save-patch/authority fields remain explicit hard failures (`state_delta`, arbitrary `save`, `world_state`, etc.);
- optional provider observation fields/domains outside the current proven contract are omitted from the normalized result and surfaced as warnings;
- known valid narrow siblings continue through normalization.

Do not silently copy unknown fields into persistence. Do not create a compatibility state object for them.

The normalized current-format output must still contain only the current narrow contract: scene observation, player physical/sexual projection, NPC physical/stats/CSA-attitude projection, sexual events with real consumers, evidence, time, Mind Monitor, action/image presentation fields, turn summary, and warnings.

### C. Preserve the deletion result

Do not restore fresh writers/readers/projections for:
- `active_relations` / `relation_updates`;
- general `event_ledger` / `events.general`;
- `npc_relationship_state` as fresh narrative writer;
- `npc_emotion`;
- `npc_work_state`;
- `RELATION_KINDS` or general event semantic enums.

Historical stored residue may remain inert at persisted/read boundaries. No migration is authorized.

### D. Preserve proven narrow consumers

Do not regress:
- visible `npc_stats` and committed deltas;
- `sexual_event_ledger` and derived sexual records/counters;
- scene/location/presence;
- player/NPC physical state and compact clothing UI continuity;
- time, progression, institutional CSA;
- provider-authored literal choices and free text;
- Mind Monitor;
- Story plus `turn_summary` memory;
- media/image presentation behavior.

Finite media/image taxonomies are not narrative truth and must not gate whether Story facts occurred.

## Required tests / proof

Add focused regressions proving all of the following:

1. A fresh Extract containing non-empty stale `relation_updates` plus a valid narrow sibling does not abort; relation residue is absent from normalized output and a diagnostic warning is present.
2. Non-empty `events.general` is dropped warning-only while a valid `events.sexual` sibling remains normalized and usable.
3. NPC `relationship` / `emotion` / `work` residue is dropped warning-only while valid physical/stats/CSA-attitude siblings for the same registered NPC survive.
4. Unknown optional observation noise does not become persisted current-format state.
5. Explicit structural save-patch authority violations remain hard-fail.
6. Historical persisted/replay rows containing removed fields remain readable/inert according to the existing persisted compatibility boundary; no fresh writer is reintroduced.
7. Existing retained consumer tests continue to pass.
8. Full regression, changed-file syntax checks, and `git diff --check` pass.

Test count alone is not acceptance evidence.

## Forbidden

- Production access;
- TEST live gameplay, reset, deployment, DB write, migration, or DDL;
- access/mutation/reset of manual game `78fb1d94-266f-455a-bda4-7656cc2370c1`;
- provider/model/temperature/token changes;
- retry/regeneration to obtain a favorable result;
- new fact/relation/event/memory ledger;
- new semantic taxonomy/enum/allowlist for narrative meaning;
- regex/fuzzy repair or semantic gateway;
- new parser generation or parser relaxation;
- compatibility runtime added only to preserve stale tests;
- merge / PR Ready / rebase / squash / force-push;
- new branch or PR.

## Completion

Before COMPLETE:
- identify the exact hard-gate code deleted;
- show the resulting fresh optional-field behavior and warning shape;
- show that valid sibling narrow projections survive;
- show structural save-patch hard failures remain;
- list changed/deleted tests;
- run focused tests, full regression, syntax checks, and `git diff --check`;
- verify PR #67 remains OPEN / DRAFT / UNMERGED.

Set CURRENT_TASK to `WAITING_REVIEW` in a docs-only completion commit, post one immutable terminal report to Issue #68, and STOP.

No live acceptance until operator review.

## Source/test correction handoff

Implementation commit: `0fc5099` (`fix: fail open on semantic residue`).

The bespoke `FRESH_SEMANTIC_RESIDUE_FORBIDDEN` whole-turn failure path was
removed. Fresh optional relation/general-event/emotion/work residue and
unknown optional observation domains are dropped before current-format
normalization with diagnostic `extract_optional_dropped:*` warnings; valid
narrow sibling projections continue through normalization. Explicit
save/state patch authority violations remain hard failures.

Verification: focused Extract/turn/scene/state tests `35/35` PASS; full
`npm.cmd test` `417/417` PASS; changed JS/MJS syntax checks PASS; and
`git diff --check` PASS. No live acceptance, DB write, migration/DDL, TEST
reset, deployment, or Production access was performed. PR #67 remains OPEN /
DRAFT / UNMERGED.
