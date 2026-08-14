# Company v1 — CURRENT TASK

Status: READY
Task ID: open-semantic-observation-authority-reset-audit
Updated: 2026-08-15
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution queue for Company v1.

## Why this task exists

Cut 1 and Cut 2 authority consolidation remain accepted. Cut 3 also succeeded in consolidating duplicate Relation/Event durable writers into one canonical reducer path at accepted gameplay executable `1a5c5540a0235fb2e53b2452516897af7664eba1`.

However, the latest live/contract investigation exposed a broader architectural problem that crosses the old Cut 3/4/5/6 boundaries: Company v1 still asks two LLMs to author and observe a free-form narrative, then repeatedly constrains the observed meaning through finite JS/SQL enums, allowlists, fixed semantic fields, regex gates, deterministic fallback prose, and narrow state ladders. Facts that do not fit those boxes can be omitted by the Extract prompt, rejected by normalization, or silently dropped before durable state. This is incompatible with the intended open-ended LLM chat-game model.

The immediately preceding task `cut3-relation-event-typed-observation-contract-closure` ended BLOCKED with classification `NON_QUALIFYING_STORY_EVIDENCE` under the current closed taxonomy. That report is accepted as evidence for the old contract only. It is NOT approval of the closed taxonomy as the target architecture. Operator review comment on Issue #68 explicitly supersedes that assumption.

The target principle for this audit is:

**Story LLM authors the narrative. Extract LLM observes arbitrary meaningful facts from that narrative. The server owns identity, exact evidence, transactionality, idempotence, replay, structural integrity, and narrow deterministic mechanics; the server must not enumerate the universe of possible emotions, events, relationships, physical actions, or narrative consequences.**

This task is architecture/audit only. Do not make gameplay executable changes yet. First produce a complete evidence-based map and staged deletion/redesign plan, then STOP for operator review.

## Binding identity / topology

Repository: `zeroslove-ai/company-v1`
Branch: `company/scene-location-presence-v1`
Canonical PR: #67
Expected PR: base `main`, OPEN / DRAFT / UNMERGED
Starting HEAD: `347c7903d4b16b556bcfcca0ec55d7332a662128` or the docs-only operator registration descendant for this task.
Accepted gameplay executable before this audit: `1a5c5540a0235fb2e53b2452516897af7664eba1`.
Current deployed TEST Worker evidence may be inspected read-only if needed, but no deploy/live call is authorized.
TEST Supabase project: `fmcrspgxstsmxxsmkeee` — read-only metadata/function/schema inspection is allowed; no data mutation, reset, migration, or DDL.
Preserved manual game `78fb1d94-266f-455a-bda4-7656cc2370c1` is immutable and MUST NOT be accessed or mutated.
Do not create/reopen another PR or branch.

## Primary audit question

For every finite vocabulary, allowlist, enum, regex meaning gate, fixed semantic field set, deterministic fallback, schema validator, parser restriction, and SQL semantic list in the active Story → Extract → Commit → Save → Replay path, determine:

1. Does it protect **structural integrity** only?
2. Does it implement a **narrow deterministic machine mechanic** that genuinely requires finite tokens?
3. Does it instead define or restrict **narrative meaning that the Story/Extract LLM should own**?
4. Is it only a **legacy read adapter/projection** that should not govern new writes?
5. Can it cause a valid observed fact to become null/empty, be omitted, be rewritten, or be dropped?
6. Who calls it now? Is the caller live, test-only, replay-only, UI-only, or dead residue?

Do not assume the known examples below are exhaustive. Search the whole active repository and relevant TEST DB functions/constraints.

## Required classification

Every discovered gate must be assigned exactly one disposition:

### `STRUCTURAL_KEEP`
Keep only when it protects protocol/data integrity without deciding semantic meaning.
Examples that are likely structural but MUST still be verified:
- registered actor/NPC/location IDs;
- action/turn ownership and expected-turn checks;
- exact Story evidence substring existence;
- object/array/string/basic numeric shape;
- dedupe/idempotence/replay identity;
- canonical scene membership uniqueness;
- speaker ID registration;
- block framing needed to render Story/Dialogue/Thought/Choice;
- exactly four non-empty choice strings as a presentation shape, if this remains the product contract.

### `MECHANICAL_ISOLATE`
A finite vocabulary may remain only inside a deterministic subsystem that genuinely needs it, but it must not define the universe of narrative facts.
Likely examples to verify:
- CSA app transaction verbs / deterministic mandatory enactment metadata;
- canonical machine projections such as a clothing slot needed for a specific CSA rule;
- optional physiological counters that need bounded numeric values;
- media/image tags used only for asset selection.

For each such item, prove that an unknown/open Story fact can still be durably remembered even when it cannot be projected into this narrow mechanic.

### `SEMANTIC_REMOVE`
Remove from the new-write authority when it limits open-ended narrative meaning.
Examples to investigate include event categories, relation kinds, posture token sets, sexual action taxonomies used as memory gates, emotion/work field allowlists, intimacy ladders, deterministic server-authored choice prose, semantic regex classifiers, and any other closed meaning vocabulary.

### `LEGACY_READ_ONLY`
Retain only if current historical data/replay requires it. It must not validate or shape new Story/Extract writes. Name the stored data/caller proving the compatibility need and define its deletion condition.

## Mandatory source inventory

At minimum inspect all live callers and tests around the following; then continue searching beyond them:

### Extract observation contract
- `src/engine/extract-prompt.js`
- `src/engine/runtime-core/extract-observation.js`
- `src/engine/runtime-core/observation-reducers.js`
- persisted/legacy Extract adapters and their active callers.

Audit fixed top-level/domain/field allowlists including, but not limited to:
- `NPC_DOMAINS`
- `PHYSICAL`
- clothing slots/states
- sexual fields and erection states
- stat axes
- emotion/work/relationship field sets
- general/sexual event field/type sets
- relation update fields/states
- CSA runtime observation fields/statuses.

Do not merely propose adding more values. Determine whether each list should exist at all in new-write semantic authority.

### Relation / event / memory meaning
- `src/engine/runtime-core/relation-event-reducer.js`
- `src/engine/csa/execution-policy.js`
- `src/engine/sexual-state/ledger.js`
- `src/engine/sexual-state/validator.js`
- `src/engine/relationship/reducer.js`
- `src/engine/relationship/guards.js`
- all presentation/replay readers of `active_relations`, `event_ledger`, `sexual_event_ledger`, `npc_relationship_state`, `npc_emotion`, `npc_work_state`, `npc_stats`.

Explicitly examine the current coupling where CSA mechanical `RELATION_KINDS` also gate Extract narrative relation updates. The redesign must distinguish deterministic rule-enactment relations from arbitrary narrative relationship facts.

### Physical state / posture / clothing
- `src/engine/state/posture.js`
- `src/engine/state/physical-state.js`
- `src/engine/state/clothing.js`
- `src/engine/story-wire-protocol.js`
- `src/engine/story-prompt.js`
- Extract prompt/normalizer physical paths.

Known contradiction to verify:
- posture/physical state modules describe new posture/position as open natural-language values;
- Story protocol/prompt still constrain structural `posture_after` to `sitting|standing`.

Audit whether the four-slot clothing model is a narrow machine projection rather than the sole durable description of what a character is wearing/doing with clothing. Unknown garments/accessories/partial states must not disappear merely because they cannot map to four slots.

### Choices
- Story prompt
- Opening prompt
- fresh parser
- `reduceStoryChoiceProjection()`
- opening/turn commit paths
- frontend rendering/input/recovery
- DB opening/turn choice validation.

Target direction to evaluate:
- Story LLM is the sole author of choice text.
- Keep exactly four literal choices as a simple presentation protocol if required.
- Delete deterministic server-authored choice alternatives and semantic choice categorization/metadata.
- A malformed choice footer must not cause the server to invent a different player decision. Free typed input remains valid gameplay.

### Story/parser semantic gates
Inventory parser/wire regexes and finite tokens that do more than identify structural markers or exact registered speakers. Distinguish:
- framing/identity parsing that should stay;
- semantic inference/rewriting/fallback that should move out or be removed;
- historical replay adapter code that may remain read-only.

Do not create a third parser.

### CSA finite vocabulary
Audit all sets/allowlists in:
- semantic contract
- execution policy
- applicability/capability/catalog/planner/validator/reducer
- mandatory enactment / prompt sections.

Do NOT delete deterministic mechanics simply because they use enums. Instead prove the boundary: CSA may use finite command grammar to execute a player-configured institutional rule, but those enums must never become the only vocabulary by which Story consequences, emotions, relationships, physical interactions, or memories may be persisted.

### Media/UI-only vocabularies
Audit image-selection tag allowlists and similar presentation-only adapters. Classify them separately. They may remain finite if failure only means “no matching asset,” never “the narrative fact did not happen.”

### SQL / DB semantic duplication
Read-only inspect current TEST DB functions/constraints and repository migrations. At minimum cover:
- `reserve_company_player_setup`
- `company_apply_opening_scene_v1`
- `commit_company_opening`
- `commit_company_turn`
- `validate_company_save_v1`
- `company_validate_scene_v1`
- initial clothing/bootstrap helpers
- any constraints/checks on current JSON state.

Known findings to verify/current-source-map:
- player setup SQL currently hardcodes department, position, body type, speech style, and heroine IDs even though repository content/catalog should own semantic membership;
- opening scene SQL also hardcodes heroine IDs;
- save/scene validators are mostly structural;
- opening choice count is structural;
- opening summary logic still contains stale/mojibake fallback behavior and raw truncation, relevant to later Memory/Summary authority.

Historical applied migrations are immutable. Any future DB change must be additive and is NOT authorized in this audit.

## Target architecture to design

The audit must produce a concrete target, not just a list of complaints.

### 1. Open semantic observation / fact authority
Design a generic evidence-backed durable observation model capable of preserving arbitrary meaningful facts without a closed event taxonomy. A candidate shape may contain concepts such as:
- stable fact/event id generated by server;
- subject/actor/participant registered IDs where applicable;
- concise free-form Korean fact/summary authored by Extract;
- exact contiguous Story evidence quote(s);
- turn/action provenance;
- active/resolved/supersedes linkage only when needed;
- optional free labels that never gate persistence.

The exact schema is for this audit to propose after caller/data analysis. Do not create a new closed `type` enum under a different name.

### 2. Separate open facts from deterministic projections
Define how open narrative facts coexist with narrow machine projections:
- Scene location/presence remains canonical structured state because routing requires it.
- CSA transaction/enactment state remains deterministic.
- Optional stats/counters/physiological values may remain projections where the product actually consumes them.
- Clothing machine slots may remain only if a deterministic rule needs them.
- Open facts must preserve meaning that cannot be represented by any projection.

A projection failure must not erase the underlying fact.

### 3. Relationship/emotion/work continuity
Design how arbitrary relationship and emotional consequences survive beyond three recent turns without requiring fixed event categories or a one-word mood.
Consider whether free fact streams plus per-NPC rolling semantic summaries are the durable read model. Numeric affinity/CSA acceptance/etc may remain optional derived mechanics/UI signals, not the sole memory of human relationship change.

### 4. Physical/sexual continuity
Design an open physical-fact path that can preserve arbitrary posture/contact/clothing/sexual facts with exact evidence without requiring them to match a finite action enum. Keep only narrow machine state needed for deterministic gameplay counters or CSA execution.

Explicitly address removal/demotion of the hardcoded intimacy-stage ladder as narrative authority.

### 5. Choice simplification
Design the smallest path:
Story LLM -> exactly four literal choice strings -> parser/persist -> UI.
No server-authored semantic fallback choices. No choice event/type taxonomy. No choice metadata deciding gameplay meaning. Player selecting a choice submits the exact displayed string; free text remains ordinary input.

### 6. Memory / summary integration
The new open fact model must not become another unused ledger. Define how Story prompt/recent context/summary/recovery will actually consume durable facts. Account for existing evidence that `turn_summary` may be empty and `story_summary_recent/overall` are unreliable. The audit may reprioritize old Cut 6 work if necessary.

## Required deliverable

Create or replace one audit document:

`docs/audit/OPEN_SEMANTIC_OBSERVATION_AUTHORITY_RESET_2026-08-15.md`

It must contain:

1. **Current authority trace** — Story -> wire/parser -> Extract prompt -> provider JSON -> normalizer -> reducers -> Commit -> DB -> context/replay/UI.
2. **Complete semantic-gate inventory table** with file/function, live callers, current purpose, concrete failure/drop mode, disposition (`STRUCTURAL_KEEP` / `MECHANICAL_ISOLATE` / `SEMANTIC_REMOVE` / `LEGACY_READ_ONLY`).
3. **DB semantic-duplication table** with exact live functions/constraints and future disposition.
4. **Choice path audit** proving exactly where provider choice text can be replaced/invented today.
5. **Before/after authority map** for event/fact, relation, emotion, work, physical, clothing, sexual/physiological, choices, summary/memory, CSA mechanics, media.
6. **Proposed open observation schema** with examples covering cases that current fixed boxes lose: apology accepted/rejected ambiguously, promise, betrayal, trust repair, resentment, awkwardness, mixed emotion, arbitrary body posture/contact, uncommon clothing/accessory, and an arbitrary sexual/physical interaction not in current enum.
7. **Persistence/read model** — show exactly how these facts reach the next Story turn and long-term summary instead of becoming write-only data.
8. **Migration/compatibility strategy** — old stored fields/replay remain readable; no historical migration edits; identify which legacy writer/reader is deleted at which proof point.
9. **Implementation sequence** in small reviewable cuts. Each cut must list exact modules/tests `KEEP`, `REWRITE`, `DELETE`, live acceptance needed, and DB migration boundary if any.
10. **Test reset plan** — identify current tests that encode obsolete finite semantics and classify them KEEP/REWRITE/DELETE. Do not preserve old behavior just to keep test counts high.
11. **Risk analysis** — distinguish real integrity/safety risks from obsolete semantic restrictions. Explain how exact evidence + registered identities + server provenance prevents LLM hallucinations without a closed narrative taxonomy.
12. **Recommended immediate first implementation cut** after this audit. It should maximize deletion of semantic authority while minimizing migration risk. Do not implement it in this task.

## Binding redesign rules

- No new event/relation/emotion/posture/sexual taxonomy to replace the old one.
- No “generic_other” catch-all enum; free semantic text/facts are the point.
- No regex classifier deciding whether a narrative fact is allowed to exist.
- No deterministic inference from raw player input to successful state. Story evidence remains required for observed outcomes.
- No direct arbitrary `save` patch from the LLM. Extract emits observations/facts; server owns persistence structure.
- Registered identity validation remains.
- Exact Story evidence/provenance remains for durable observed facts.
- Unknown optional semantic projection must fail open without losing the underlying open fact.
- Do not conflate institutional/CSA compliance with personal consent, comfort, affection, trust, or relationship sentiment.
- No provider/model/temperature/token/retry workaround.
- No parser relaxation/new parser merely to bypass architecture.
- No compatibility runtime for stale tests.
- Delete superseded semantic writers/gates/tests in the implementation cut where proof completes; do not postpone all residue to a future cleanup bucket.

## Allowed

- Whole-repository source/test/docs search and read-only inspection.
- Read-only TEST Supabase schema/function/constraint queries.
- Git ancestry/PR/CI inspection.
- Create/update the audit document and CURRENT_TASK terminal evidence.
- Local static analysis scripts that do not mutate runtime data.

## Forbidden

- Gameplay executable/source/test semantic changes in this audit task.
- TEST gameplay/LLM run.
- TEST DB write/reset/migration/DDL.
- API/frontend deploy.
- Production access.
- Preserved manual-game access.
- new branch/PR, reopening #65/#66, merge, Ready, rebase, squash.
- provider/model/config changes.
- retry/regeneration.
- new semantic taxonomy/allowlist/gate.

## Validation / terminal report

Before reporting:
- prove audit scope includes active runtime AND DB boundary, not just grep results;
- provide caller evidence for deletion/legacy decisions;
- run `git diff --check` for docs changes;
- ensure no executable source/test/migration files changed;
- verify PR #67 remains OPEN/DRAFT/UNMERGED;
- verify no forbidden operations occurred.

On completion:
- set CURRENT_TASK to `WAITING_REVIEW` in a docs-only commit;
- post one terminal report to Issue #68 with START_SHA, FINAL_SHA, audit document path, counts by disposition, major authority conclusions, exact proposed first implementation cut, and forbidden-operations confirmation;
- STOP. Do not auto-register an implementation task. Operator must review the redesign first.
