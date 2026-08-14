# Company v1 — CURRENT TASK

Status: WAITING_REVIEW
Task ID: open-semantic-observation-authority-reset-audit-v2
Updated: 2026-08-15
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution queue for Company v1.

## Why this task exists

The first open-semantic audit (`open-semantic-observation-authority-reset-audit`, final docs-only SHA `59243b80d7524336d95719af9a0a2e302a21b277`) correctly exposed the broad problem: Company v1 asks Story and Extract LLMs to handle open-ended narrative meaning, but many finite enums/allowlists/fallbacks still constrain that meaning before it reaches durable memory.

However, operator review returned `CHANGES_REQUIRED` because the first audit was not sufficiently grounded in actual product/gameplay consumers. It conflated three different things:

1. **Intentional product catalogs** such as the finite player-setup choices and stable main-character IDs.
2. **Narrow UI/mechanical state** such as clothing status that the product actually displays and needs to preserve deterministically.
3. **Semantic gates** that incorrectly define the universe of possible narrative meaning (event types, relation kinds, posture tokens, intimacy ladders, server-authored choice prose, etc.).

This second audit must correct that mistake by tracing every finite list to its real gameplay/UI/storage/integrity consumer and by using the preserved manual game READ-ONLY as behavioral evidence. The goal is not “remove every list.” The goal is:

**Remove every finite list/gate/duplicate authority that can be removed without losing intended gameplay, UI, persistence, identity, transactionality, or required deterministic mechanics. Keep one canonical intentional catalog where the product explicitly defines choices. Keep narrow UI/mechanical projections only where there is a proven consumer. Open narrative meaning must not be gated by finite taxonomies.**

No gameplay implementation is authorized in this task. Produce a corrected, source+DB+actual-gameplay grounded redesign and STOP for review.

## Binding identity / topology

Repository: `zeroslove-ai/company-v1`
Branch: `company/scene-location-presence-v1`
Canonical PR: #67
Expected PR: base `main`, OPEN / DRAFT / UNMERGED
Starting branch HEAD: `59243b80d7524336d95719af9a0a2e302a21b277` or docs-only operator registration descendant.
Accepted gameplay executable remains `1a5c5540a0235fb2e53b2452516897af7664eba1` unless source ancestry proves otherwise.
TEST Supabase: `fmcrspgxstsmxxsmkeee`.
Dedicated TEST game may be read-only inspected; no mutation/reset/gameplay run.
Preserved manual game `78fb1d94-266f-455a-bda4-7656cc2370c1` MAY be queried READ ONLY in this task specifically to understand real gameplay continuity and current stored state. NEVER reset, update, delete, or otherwise mutate it.
Do not create/reopen another branch/PR. Do not merge/Ready/rebase/squash.

## Product facts that must be treated correctly

### Player setup catalogs are intentional product content
Verify actual UI/API callers, but begin from the evidence that these files define deliberate finite setup choices:
- `content/organization.json` — selectable player departments.
- `content/positions.json` — selectable player positions.
- `content/body_types.json` — selectable player body types.
- `content/speech_styles.json` — selectable player speech styles.

Do NOT classify these catalogs for deletion merely because they are finite. The relevant audit questions are:
- Is this the one canonical content source?
- Is the same list duplicated in frontend/JS/SQL/migration code?
- Can duplicate validation/copies be derived from or removed in favor of one canonical catalog without reducing integrity?
- Does any copy accidentally gate unrelated open Story/Extract meaning?

If the DB duplicate list is the only safe boundary for an untrusted request, prove that before retaining it. If API/content validation plus structural DB checks can safely replace the duplicate, recommend removal of the duplicate only—not removal of the product catalog.

### `heroine1` through `heroine5` are stable IDs for the five main Company NPCs
They are not an event/relation taxonomy. Verify all five current character records and live callers. Stable registered character IDs are expected to remain if required for identity, assets, voice, content, scene membership, or save/replay references.

Do not remove or rename these IDs simply to eliminate a finite list. Audit only duplicate hardcoded arrays/copies and any semantic assumptions attached to the word `heroine` beyond stable identity.

### Clothing is an explicit UI/continuity exception
The current product UI displays compact clothing state. The LLM may forget clothing across turns. Therefore a narrow canonical clothing projection may remain if real frontend/context consumers prove it is required.

Audit requirements:
- find every clothing writer and reader;
- prove the exact frontend/UI fields rendered;
- reduce to one canonical writer if duplicates remain;
- retain only states/slots actually needed by gameplay/UI or clear deterministic rules;
- open narrative facts about clothing/accessories/partial states must be preservable even if they cannot map to the compact UI projection;
- projection failure must never erase the underlying narrative fact.

## Corrected classification — caller/gameplay based

Every discovered finite list/gate must be classified with one of these dispositions, with caller evidence:

### `CONTENT_CATALOG_KEEP`
Intentional finite game/product content, such as player setup options or registered character/location catalogs. Keep one canonical source. Remove redundant copies if safe.

### `STRUCTURAL_KEEP`
Identity, protocol framing, expected turn, action ownership, exact evidence provenance, object/array shape, transactionality, idempotence, dedupe/replay identity, required registered IDs, scene integrity.

### `UI_STATE_KEEP`
A narrow canonical state that the UI or explicit product feature actually renders/depends on and that must survive LLM forgetting (candidate: compact clothing state). Must have one writer and may not gate richer narrative facts.

### `MECHANICAL_PROVE_OR_REMOVE`
Finite mechanics that might be needed by a deterministic subsystem. Do NOT presume they survive. For every item, name the actual consumer and demonstrate what breaks if the list is removed. If no material gameplay/UI/integrity behavior breaks, disposition becomes DELETE.

### `SEMANTIC_REMOVE`
Finite taxonomies/regexes/fallbacks that constrain arbitrary narrative meaning, rewrite player/Story meaning, or cause otherwise valid facts to become null/empty/dropped.

### `LEGACY_READ_ONLY`
Only for proven historical saved-data/replay readers. No new writes/validation through it. State exact deletion criterion.

### `DEAD_DELETE`
No live caller or only obsolete tests/docs. Recommend deletion in the earliest safe implementation cut.

**Default rule:** if a finite list has no proven product/UI/structural/mechanical consumer, delete it. “It already exists” and “tests expect it” are not retention reasons.

## Mandatory full-system audit

Trace the actual active path end to end:

`player setup / input / choice`
→ `Story prompt + provider`
→ `wire/parser`
→ `Extract prompt + provider JSON`
→ `normalizer`
→ `reducers`
→ `commit_company_turn / setup/opening RPCs`
→ `game_save / game_turns / game_actions`
→ `get_company_context / history / replay`
→ `next Story prompt`
→ `frontend/UI`

For every list/enum/allowlist/fallback/regex/switch/schema semantic field encountered, record:
- exact file/function/SQL function;
- exact live callers;
- whether player setup, Story, Extract, Commit, DB, replay, or UI consumes it;
- whether it can block/drop/rewrite a valid narrative fact;
- whether it can be removed with zero gameplay impact;
- whether a single canonical source can replace duplicate copies;
- proposed disposition from the corrected classification above.

Search beyond known examples. Do not stop at the first audit's 50 grouped families.

## Specific deep audits

### 1. Setup / catalogs / main NPC identity
Trace frontend → API → content → setup RPC for department, position, body type, speech style and main-character IDs.

Determine separately:
- intentional finite catalog;
- duplicate JS copy;
- duplicate SQL copy;
- structural validation;
- dead/stale copy.

The desired outcome is ONE source of product meaning where possible, not removal of intended player choices.

### 2. Extract open observation
Re-audit:
- `extract-prompt.js`
- `runtime-core/extract-observation.js`
- `observation-reducers.js`
- `relation-event-reducer.js`
- legacy extract adapters/readers.

Finite emotion/event/relation/work/posture/sexual meaning vocabularies are presumptive `SEMANTIC_REMOVE` unless they are only optional downstream projections. Design the open evidence-backed fact channel so arbitrary observed facts survive.

### 3. CSA — much stricter review
Do not start from the assumption that physical execution grammar is legitimate.

Inventory all CSA:
- rule/app IDs and lifecycle;
- activation/deactivation/capacity;
- applicability;
- `RELATION_KINDS`;
- `execution_action` / action kinds;
- `posture_after`;
- mandatory enactment / direct-coverage logic;
- planner/validator/reducer;
- Story prompt sections;
- Extract/Commit coupling;
- relation/event/physical/sexual state coupling.

Target hypothesis to test:
- **keep** only the minimum deterministic app/rule identity, lifecycle, transaction and applicability needed for the user-created institutional rule system;
- Story receives the active rule and current context and narrates how it is followed/resisted/interpreted naturally;
- Extract observes what actually happened;
- do not require the world to map every rule consequence to a finite physical action token;
- institutional compliance must stay separate from personal consent, comfort, affection, trust and emotion.

For every physical CSA token/list, prove a deterministic consumer that cannot be safely replaced by rule context + Story + Extract. If that proof is absent, recommend removal.

### 4. Physical / posture / sexual
Audit all finite posture, position, contact, sexual-action and intimacy-stage lists. Narrative fact storage must be open.

Keep only genuinely consumed counters/projections after caller proof. Hardcoded intimacy-stage ladders must not remain narrative relationship authority.

### 5. Clothing
Treat compact clothing state as likely `UI_STATE_KEEP`, not generic `SEMANTIC_REMOVE`, but still audit for unnecessary slots/states and duplicate writers.

Use actual frontend render/view-model code to prove what must remain.

### 6. Choices
Target product path:
`Story LLM -> exactly four literal provider-authored strings -> parser/persist -> UI -> selected literal string becomes player input`.

Audit and plan removal of deterministic server-authored semantic fallback choices and any choice type/event metadata that is not required for rendering four buttons.

Exactly-four is a presentation contract, not a semantic taxonomy.

### 7. DB / RPC / migrations
Read-only inspect current TEST DB and migration source. Distinguish:
- transaction/ownership/shape/integrity validation to keep;
- intentional catalog identity;
- duplicate semantic arrays/copies to remove if safely derivable upstream;
- old compatibility projection/readers;
- JSON semantic gates.

Do not edit applied migrations. Future cleanup must be additive.

### 8. Memory / summary / next-turn consumption
An open fact ledger is unacceptable if it becomes write-only data.

Trace how facts will reach:
- next Story turn;
- long-term Story context;
- per-NPC continuity;
- history/replay;
- feedback/recovery.

Use the preserved 7-turn game READ ONLY to verify current failures such as empty `turn_summary`, stale recent summary, corrupted overall summary, and relation/event loss. Do not rely only on old prose if current rows can be read safely.

### 9. Frontend/UI consumers
Inventory all structured state visibly rendered or functionally consumed by the client. This determines which compact projections are genuine product state versus dead backend taxonomy.

Especially prove:
- clothing fields;
- relationship/stat fields;
- scene/location;
- choices;
- CSA state;
- any posture/physical/sexual UI state.

A field being stored does not prove it is needed. A field being shown in UI does not prove its current writer/taxonomy is correct.

## Required deliverable

Create a NEW corrected document, do not overwrite the first audit:

`docs/audit/OPEN_SEMANTIC_OBSERVATION_AUTHORITY_RESET_V2_2026-08-15.md`

It must contain:

1. Game/product model summary in plain language: what the player can configure, what Story owns, what Extract owns, what the server/DB owns, what UI requires.
2. End-to-end authority trace with actual current callers.
3. Complete finite-list inventory, expanded beyond the first audit.
4. For each list: caller evidence, gameplay impact if removed, disposition, canonical owner, deletion/retention rationale.
5. A dedicated **REMOVE WITH ZERO GAMEPLAY IMPACT** table. Maximize this list.
6. A dedicated **KEEP BECAUSE PRODUCT ACTUALLY NEEDS IT** table with proof. Include player setup catalogs / stable IDs / compact clothing only if proven.
7. A **DUPLICATE AUTHORITY** table showing where the same intended catalog/state is copied in content/JS/SQL/DB and exactly which copy should disappear.
8. CSA before/after map with explicit proposed deletion of unnecessary physical command/enactment layers.
9. Open observation/fact schema and evidence/provenance rules; no required semantic type enum.
10. Memory/readback design proving open facts reach next Story and long-term continuity.
11. Choice simplification deletion plan.
12. DB additive migration strategy.
13. Test KEEP/REWRITE/DELETE plan; obsolete finite-semantic tests do not protect runtime.
14. Actual preserved 7-turn game evidence relevant to the redesign, READ ONLY.
15. Revised implementation sequence. Each implementation cut must maximize deletion and name exact files/functions/tests likely to DELETE/REWRITE/KEEP.
16. Recommended first implementation cut. It must be architecture-first and should remove substantial semantic gating, not merely add another ledger alongside all old authority.

## Binding rules

- Intentional player configuration catalogs may remain finite; duplicate copies should not become separate authorities.
- Stable registered IDs may remain finite.
- UI-required compact state may remain finite only with caller proof and one canonical writer.
- Open narrative meaning must not require matching an event/relation/emotion/posture/sexual taxonomy.
- No `other` catch-all enum.
- No regex/keyword classifier as existence gate for narrative facts.
- No deterministic success inference directly from player input.
- Exact Story evidence/provenance remains required for Extract-observed durable facts where applicable.
- No arbitrary LLM save patch.
- Unknown optional projection must fail open without erasing the underlying fact.
- CSA institutional rule state != personal consent/comfort/affection/trust/emotion.
- No provider/model/temperature/token/retry workaround.
- No third parser.
- No stale-test compatibility runtime.
- Historical applied migrations and terminal report comments are immutable.
- No new PR/branch.

## Allowed

- Whole-repo source/test/content/docs search.
- Read-only TEST DB schema/function/data inspection.
- Read-only preserved manual-game queries.
- Git/PR/CI inspection.
- Create the V2 audit document and update CURRENT_TASK terminal state.

## Forbidden

- Any gameplay/source/test/migration semantic implementation change.
- Any DB write/reset/DDL/migration apply.
- Any TEST gameplay/LLM call.
- Any API/frontend deploy.
- Production access.
- Any mutation of preserved manual game.
- provider/model/config changes or retry/regeneration.
- new branch/PR, merge, Ready, rebase, squash.

## Validation / terminal report

Before terminal report:
- prove the V2 audit includes source + DB + frontend + actual manual-game read evidence;
- prove player setup catalogs and `heroine1..5` were classified by actual product use rather than by “finite = bad”;
- prove clothing retention/removal decisions use actual UI callers;
- prove every CSA physical finite token family received a remove-or-prove analysis;
- run `git diff --check`;
- ensure only docs/CURRENT_TASK changed;
- verify PR #67 remains OPEN/DRAFT/UNMERGED.

Then:
- set CURRENT_TASK to `WAITING_REVIEW` in a docs-only commit;
- post one terminal report to Issue #68 with START_SHA, FINAL_SHA, V2 audit path, inventory counts, number of zero-impact deletions proposed, number of proven product keeps, CSA conclusion, DB duplicate conclusion, exact recommended first implementation cut, and forbidden-operations confirmation;
- STOP. Do not auto-start implementation before operator review.

---

## V2 terminal handoff

TASK_ID: open-semantic-observation-authority-reset-audit-v2
TASK_BLOB_SHA: ba456e4b8c9a1634f92fd0e2c4d0c446da5d1ab3
START_SHA: ba456e4b8c9a1634f92fd0e2c4d0c446da5d1ab3
FINAL_SHA: see terminal report (final docs-only SHA)
BRANCH: company/scene-location-presence-v1
PR: #67 OPEN / DRAFT / UNMERGED

DELIVERABLE:
`docs/audit/OPEN_SEMANTIC_OBSERVATION_AUTHORITY_RESET_V2_2026-08-15.md`

INVENTORY:
- 48 expanded finite-list/gate families.
- 12 proposed zero-gameplay-impact deletion candidates, each with a caller-proof prerequisite.
- 9 proven product/identity/UI keep categories.
- Setup catalogs and `heroine1..5` are product/identity keeps from actual API/frontend/content callers, not from finiteness alone.
- Compact clothing is a narrow UI-state keep candidate from `view-model.js`/`render.js` callers and preserved context evidence.
- CSA physical execution/posture/relation-kind/mandatory-enactment families are REMOVE-OR-PROVE, with semantic removal as the default; rule identity/lifecycle remains conditional on concrete consumer proof.

EVIDENCE:
- Source/API/engine/frontend/migration caller trace completed.
- Preserved manual game `78fb1d94-266f-455a-bda4-7656cc2370c1` queried READ ONLY through deployed context/history; no reset or mutation.
- Seven-turn evidence recorded: clothing and active CSA rules present; relation/event/sexual ledgers empty; turn summaries empty; overall summary corrupted.
- Direct catalog limitation recorded honestly: no new direct Supabase catalog query because local psql/Supabase CLI and assumed credentials were unavailable; operator-verified live facts and migration/source evidence were used.

RECOMMENDED_FIRST_CUT:
Architecture-first open-observation boundary: remove closed Extract semantic gating while adding structural exact-evidence persistence/readback in the same cut. Do not add a write-only parallel ledger.

VALIDATION:
- `git diff --check`: pending final verification.
- Only audit/CURRENT_TASK documentation changes authorized; no source/content/migration/config/script/test/runtime file changed.
- Forbidden operations—DB write/reset/migration/DDL, TEST gameplay/LLM, API/frontend deploy, Production, provider/model/retry, new taxonomy/gate/parser, new branch/PR, merge/Ready, and preserved-artifact mutation: all 0.

STOP: wait for owner architecture review. Do not start implementation or generate a next CURRENT_TASK.
