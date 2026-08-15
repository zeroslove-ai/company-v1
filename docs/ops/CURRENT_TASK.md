# Company v1 — CURRENT TASK

Status: READY
Task ID: narrative-memory-simplification-v1
Updated: 2026-08-15
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Starting point

Repository: `zeroslove-ai/company-v1`.
Branch: `company/scene-location-presence-v1`.
Canonical PR: #67, base `main`, must remain OPEN / DRAFT / UNMERGED.

Accepted source/test executable before this task:
`53710caa6a2255dc2b8d1aab47053df5f9d6fe06`.

Its docs-only completion descendant:
`faad762ae34c5e50d022d5cd70b2a40b9242e774`.

The former live task `deep-level7-live-acceptance-v7` was registered at `04c68d0ffb617f380e7d59085851bb60911f9be5` but had no `EXECUTION: STARTED`. It is superseded by this owner architecture correction before execution.

## Owner architecture correction

The open-fact/open-observation subsystem grew into an unnecessary second narrative-memory system.

The intended game model is simpler:

**Story authors the narrative -> Extract derives only narrow machine/UI state plus one natural-language `turn_summary` -> Commit persists the turn -> the next Story reads recent raw turns plus older turn summaries and infers narrative continuity itself.**

Before the open-fact redesign, recent raw narrative plus turn summaries were already the useful continuity mechanism. The current runtime now additionally sends `open_observations`, requires `block_observations[].facts`, assigns `fact_id`/subject/object/source-block provenance, and accumulates `save.open_observations`. That extra semantic-memory authority is not required by the product and has already produced deterministic blockers such as `OPEN_FACT_UNKNOWN_ID`.

This task is deletion/simplification, not a replacement memory framework.

## Target memory model

### 1. Recent raw turns

Story context must contain the latest **6 committed raw turns** in chronological order.

Each recent raw turn may contain only the existing useful committed turn material such as:
- turn number
- player action
- raw `story_text`
- committed parsed blocks if currently needed by Story/recovery callers
- committed literal choices if currently needed

Do not create a new semantic representation of these six turns.

### 2. Older continuity

Turns older than the latest six are represented to Story by their existing natural-language `turn_summary` only, in chronological order.

Keep the current same-Extract-call `turn_summary`; do not add a Summary/Memory LLM call.

A summary is ordinary compressed narrative continuity. It is not a taxonomy, fact ledger, importance-scoring engine, entity graph, or semantic authority.

### 3. Story inference

Story LLM reads the latest six raw turns plus older summaries and naturally infers relationships, promises, refusals, emotions, physical continuity, work context, and other narrative meaning.

Do not require the server to enumerate or validate those meanings as separate semantic facts.

Narrow deterministic product state may still exist where a proven consumer needs it, for example canonical scene/location/presence, compact clothing UI projection, progression, institutional CSA state, current time, and other true machine state. Those narrow states must not become a second general narrative-memory engine.

## Required source changes

### A. Remove open observations from Story memory authority

In `buildStoryContextProjection` and Story rules/payload:
- remove `context.open_observations` projection;
- remove Story instructions that treat `open_observations` as durable narrative facts;
- change recent raw continuity from latest 3 turns to latest 6 turns;
- build `turn_summary_memory` only from turns older than those latest six.

Story should receive recent raw narrative + older summaries, not an additional fact ledger.

### B. Remove fresh open-fact generation contract

From the fresh Extract prompt/contract:
- remove `block_observations` as a required output channel;
- remove nested `facts` instructions;
- remove the requirement that arbitrary emotion/relation/agreement/refusal/physical/intimate meaning be represented as an open fact;
- remove fresh `open_facts` generation/normalization as narrative continuity authority;
- keep `turn_summary` as the free natural-language narrative continuity product from the same Extract call.

Extract should continue to produce only narrow observations that have real machine/UI consumers. If a narrative meaning does not need a narrow machine projection, the Story itself plus `turn_summary` is sufficient continuity.

### C. Stop writing general narrative open observations

Commit must stop appending fresh narrative facts into `save.open_observations`.

Existing historical `save.open_observations` or persisted Extract `open_facts` may remain as inert legacy data if removing the stored field itself would require migration or would break historical row decoding, but:
- they must not be projected into new Story prompts;
- they must not receive new writes;
- they must not be revalidated as an active gameplay gate;
- they must not be required for replay/Commit of new turns.

Prefer deleting now-unused active reader/writer/validator code when caller proof shows it is no longer needed. Do not create a compatibility subsystem to preserve obsolete semantics.

### D. Keep turn summary simple

`turn_summary` remains generated by the existing Extract call.

Prompt it as concise natural Korean continuity memory of what materially happened in that completed Story. It may mention promises, refusals, relationship changes, work events, physical/clothing/intimate continuity, or anything else the Story actually established.

No enum, subject/object IDs, exact-quote ledger, fact IDs, source-block accounting, importance score, vector embedding, graph, semantic tag, separate memory model, or additional LLM call.

### E. Context retrieval

Story may continue fetching enough committed turns (for example current `p_recent_turns: 50`) so that the projection can supply:
- latest six raw turns;
- older turn summaries.

Do not increase context complexity merely because more rows are fetched. The Story-facing memory shape should remain these two layers only, plus narrow current machine state.

## Deletion-first audit within this task

Inspect all active callers of:
- `open_observations`
- `open_facts`
- `block_observations`
- `fact_id`
- `source_block` when used solely for general narrative facts
- `normalizeOpenFacts`
- `normalizeBlockObservations`
- persisted open-fact validation that still participates in ordinary new-turn replay/Commit

Remove or isolate obsolete fresh-path code in the same task rather than leaving a parallel memory system behind.

Do not touch source-block/provenance concepts that are independently required by another proven non-memory consumer; prove the caller before retaining them.

## Tests / proof

Update tests to prove the simplified architecture rather than preserving the old implementation.

Must prove at minimum:
1. Story gets the latest six raw committed turns in chronological order.
2. A seventh-and-older turn leaves the raw window and is represented by `turn_summary_memory`.
3. Story prompt/payload contains no active `open_observations` narrative-memory channel.
4. Fresh Extract no longer requires or requests `block_observations` / general `open_facts`.
5. A normal Story -> Extract -> Commit turn succeeds without any fact ledger.
6. Commit does not append new `save.open_observations` entries.
7. `turn_summary` persists/readbacks through the existing transaction path.
8. Replay/recovery of current-format new turns does not depend on open-fact validation.
9. Compact clothing/current scene/current time/CSA/progression and other proven narrow machine state remain intact.
10. Full regression passes after deleting stale tests that existed only to enforce the superseded open-fact architecture.

Test count may decrease if obsolete open-fact contract tests are deleted. Do not add compatibility code merely to preserve the old count.

## Forbidden

Do not replace the removed subsystem with another one.

Specifically forbidden:
- new fact/memory ledger;
- entity graph;
- vector DB/embedding memory;
- importance scoring;
- subject/object semantic graph;
- new enum/taxonomy/allowlist;
- generic semantic validator/gateway;
- fact repair/fuzzy matcher;
- second Summary/Memory LLM call;
- retry/regeneration to hide architecture defects;
- provider/model/temperature/token changes;
- new parser generation;
- migration solely to clean historical inert JSON during this task;
- Production access;
- TEST live gameplay/deploy/reset under this source/test task;
- manual-game access;
- merge/PR Ready/rebase/squash/force-push;
- new branch/PR.

## Completion

Source/test only.

Before COMPLETE:
- show the actual active reader/writer deletion map for open-fact/open-observation memory;
- report the final Story memory payload shape;
- report the final fresh Extract output shape;
- run focused tests and full regression;
- run syntax checks for changed JS/MJS and `git diff --check`;
- verify PR #67 remains OPEN / DRAFT / UNMERGED.

Set CURRENT_TASK to `WAITING_REVIEW`, commit/push on the same branch, post one immutable terminal report to Issue #68, and STOP.

Do not launch deep live acceptance yourself. After operator review, the next live acceptance must validate the simplified **latest-six raw turns + older turn summaries** architecture rather than the superseded open-fact subsystem.
