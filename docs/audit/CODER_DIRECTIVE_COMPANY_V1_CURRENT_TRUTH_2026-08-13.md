# Company v1 Current-Truth Audit — Coder Directive

Date: 2026-08-13
Audit branch: `audit/company-v1-authority-baseline-2026-08-13`
Frozen code baseline: `5ba68bb204767756b9c8a4b5a72ea4003f2075b6`
Repository: `zeroslove-ai/company-v1`

## 0. Mission

This is NOT another hotfix task and NOT an Opening-specific repair.

The project has accumulated stacked PRs, runtime hotfixes, prompt/parser changes, DB functions, migrations, legacy compatibility paths, old design documents, and a large test suite while the actual authority model kept drifting. The purpose of this branch is to reconstruct one auditable `CURRENT_TRUTH` for the entire Company v1 runtime before any further gameplay repair.

The required output is a small set of authoritative audit documents that explain what the system actually does today, what should remain authoritative, what is duplicated/stale, and what the next architecture cutover must remove or simplify.

Do not optimize for preserving existing code. Prefer deletion and consolidation when multiple layers own the same meaning.

## 1. Audit Freeze — binding rules

During this task:

- NO runtime behavior changes.
- NO Supabase writes, migrations, function replacements, grants/revokes, reset, seed, or production/test data mutation.
- NO Cloudflare deployment.
- NO PR merge or Ready transition.
- NO model/provider changes.
- NO prompt tuning to fix individual examples.
- NO new semantic gates, regex classifiers, retry loops, regeneration, or fallback ladders.
- NO large test expansion.
- Do not fix bugs as you discover them. Record evidence and disposition only.
- Preserve existing live evidence artifacts and historical fixtures.

All repository changes on this branch must be documentation/audit artifacts only unless a separately approved follow-up task explicitly changes that rule.

## 2. Do not over-focus on Opening

The latest Opening failure is useful evidence, but it is not the audit target.

Audit the complete runtime as one system:

`setup/opening -> player action -> structured/app transaction -> Story -> stream/parser -> Extract -> deterministic reducers -> Commit -> DB save/history -> context hydration -> frontend rendering -> next turn`

Also cover feedback/revision/reset only insofar as they create or mutate canonical authority.

Opening-specific findings belong in the same authority/protocol model as normal turns; do not build a special architecture around Opening.

## 3. Tests / harness — reduced audit scope

There is already a test harness/history of live or semi-live verification work. It may have fallen behind because development moved quickly.

Do NOT spend this audit classifying every one of the ~700 tests.

Only do enough test investigation to answer:

1. Where are the existing harnesses, fixtures, smoke scripts, live-test helpers, and workflow entry points?
2. Which of them can still be reused after the canonical architecture is established?
3. Which are obviously stale because they assert a superseded protocol/authority?
4. Which existing tests are architecture-level and should be retained as safety rails?
5. Is there currently any real end-to-end path that exercises actual Story/Extract + TEST DB + runtime/Worker? If yes, identify it; if no, state that plainly.

Do not count tests as a quality metric.

After `CURRENT_TRUTH` is accepted, the next implementation phase will rebase/rebuild a lean test harness around the final contracts. Full-suite execution belongs at final candidate checkpoints, not during every development step.

## 4. Required investigation

### A. Freeze the exact Git lineage

Record:

- main HEAD at audit time
- this audit branch base SHA
- current active hotfix/Q lineage
- deployed runtime SHA/version if verifiable from repository evidence; if deployment cannot be independently verified, record it as `UNKNOWN/UNVERIFIED` rather than guessing
- all currently open PRs relevant to Company v1

For each open PR classify it by Git ancestry and unique content, not by title:

- `IN_CURRENT_LINEAGE` — exact head/content already incorporated
- `ACTIVE_UNMERGED` — still contains intended unique current work
- `SUPERSEDED` — concept replaced by later implementation
- `DIVERGED_REFERENCE_ONLY` — old branch with historical value but not safe to merge
- `ABANDONED` — obsolete approach that should not return

Do not close PRs in this audit. Produce the close/keep plan only.

### B. Build the actual Authority Matrix

For each domain identify:

- canonical representation
- writer(s)
- reader(s)
- persistence location
- fallback/repair path
- competing or legacy writer
- whether authority is deterministic Engine, Provider Story, Extract observation, DB transaction, or UI projection
- final disposition: `KEEP`, `SIMPLIFY`, `REWRITE`, `DELETE`

At minimum cover:

- game/master/content definition
- player profile/setup
- scene identity/location/time/presence
- player physical scene state/posture/clothing
- NPC physical scene state/posture/clothing
- Story raw text
- parsed Story blocks / source ordering
- dialogue / acting / thought / choices
- CSA rule definitions
- CSA activation/deactivation transaction
- CSA scope/trigger state
- CSA mandatory result/runtime state
- CSA relations
- generic relationship state
- Extract observations
- turn context / recent history
- summary
- Mind Monitor
- image selection
- progression
- pending/reservation/action authority
- feedback revision
- reset

The matrix must expose every place where more than one layer can write the same semantic fact.

### C. Trace protocol producer -> consumer contracts

For each major boundary, inspect BOTH producer and consumer source. Do not infer a contract from one side only.

Required chains include:

1. Story prompt -> raw provider output -> stream transport -> parser -> canonical stored Story -> frontend renderer
2. Story -> Extract prompt -> Extract parser/validator -> observation reducer -> commit reducer -> canonical save
3. structured CSA app action -> validation/signature -> projected context -> Story knowledge -> commit definition writer -> canonical save
4. canonical save -> get_company_context/hydration -> Story/Extract next-turn prompts
5. DB reserve/commit RPC -> JS expectations -> DB constraints/privileges

Record mismatches explicitly.

### D. Audit Supabase as a second source tree

Read-only inspection only.

Project: `fmcrspgxstsmxxsmkeee`

Inventory current production schema/functions/RPC privileges that can mutate Company v1 state. Compare them with repository migrations and current JS callers.

Special attention:

- old/dead RPCs that still possess mutation authority
- SQL functions with hard-coded gameplay/content defaults or allowlists
- save writers outside the intended atomic commit path
- migration history vs actual deployed function definitions
- SECURITY DEFINER / grants
- reserve-vs-commit responsibility
- opening/setup writers
- reset writers

Do not change the DB during this task.

### E. Reconcile design documents with code

Find prior architecture/authority/reset/handoff/current-state documents, especially the August 8 design work.

Do not create another layer of conflicting documentation.

For every prior document that still matters, classify it:

- current binding truth
- useful historical rationale
- superseded
- dangerous/stale

`CURRENT_TRUTH` must state which documents future agents should read and which should no longer be treated as implementation authority.

### F. Use live failures as evidence, not as architecture targets

Review preserved live evidence only to test whether the authority model explains observed failures.

Known evidence includes multi-turn playtests and recent CSA/Opening failures. Treat them as examples that reveal system-level problems such as:

- multiple writers
- state/narrative authority conflation
- non-atomic transactions
- source-order loss
- provider knowledge-context mistakes
- stale canonical state
- parser/UI contract mismatch

Do not produce a long bug-by-bug patch list. Group failures under architectural causes.

## 5. Binding target principles for the future architecture

The audit should evaluate current code against these principles. Do not implement them yet.

### Single authority per semantic fact

One semantic fact gets one canonical writer. Other layers may project/read it but must not independently recreate or override it.

### Atomic canonical mutation

A failed Story/Extract/action must not leave canonical gameplay definitions or state mutated. Rule definition/state/turn advancement that belong to one committed turn must become canonical together.

### State authority != human narrative authority

The Engine may guarantee deterministic results/state without becoming the author of mechanical human prose. Provider Story should remain responsible for natural human enactment/narrative where possible; deterministic state remains Engine authority.

### Player Agency

Player input is intent/attempt authority. Provider may paraphrase semantically but must not invent player apology, withdrawal, concession, promise, refusal, decision, movement, contact, or escalation.

### CSA is world/institution authority

CSA is a world/company common-sense rule, not a per-NPC effect. NPCs may know the institutional rule but must not know app/player mechanics. The Player may privately know they initiated a rule through the app when that is true.

### Story source order is visible order

Plain narrative and visible acting must not be silently demoted into dialogue metadata or lost by same-speaker UI merging.

### Extract is observation, not a competing rules engine

Extract should not independently decide deterministic CSA truth already owned by Engine/Commit. Reduce Extract responsibility where deterministic authority exists.

### Fail-open presentation

Malformed/missing optional presentation fields — choices, thought, acting, Mind Monitor, image, optional Extract data — should warn/fallback/drop where safe rather than block gameplay.

Hard failure is reserved for real integrity boundaries such as wrong game/action authority, concurrency conflicts, signed transaction tamper, canonical save corruption risk, or DB transaction integrity.

### Delete before adding

When an old compatibility writer/gate/repair exists because of a superseded architecture, prefer removal over adding another translation layer.

## 6. Required audit deliverables

Create under `docs/audit/company-v1-current-truth-2026-08-13/`:

1. `00_AUDIT_LEDGER.md`
   - exact baseline
   - data/source surfaces inspected
   - anything inaccessible/unverified
   - audit freeze confirmation

2. `01_LINEAGE_AND_PR_INVENTORY.md`
   - current Git lineage
   - every relevant open PR classification
   - recommended later close/keep order

3. `02_AUTHORITY_MATRIX.md`
   - full domain writer/reader/persistence/conflict/disposition table

4. `03_PROTOCOL_MATRIX.md`
   - producer -> consumer contracts and mismatches across Story/Extract/Commit/UI/DB

5. `04_DATABASE_BASELINE.md`
   - actual deployed schema/RPC/mutation surfaces/privileges vs repo migration expectation

6. `05_TEST_AND_HARNESS_BASELINE.md`
   - concise harness/test map only; no exhaustive 700-test taxonomy
   - reusable/stale/unknown
   - proposed post-current-truth lean verification layers

7. `06_EVIDENCE_TO_ARCHITECTURE.md`
   - map known live failures to architectural causes
   - Opening is one example, not the center

8. `07_MODULE_DISPOSITION.md`
   - module/function/RPC/document groups marked `KEEP / SIMPLIFY / REWRITE / DELETE`
   - include why and dependency order

9. `08_TARGET_ARCHITECTURE.md`
   - one coherent future turn flow and authority model
   - specify what disappears, not just what gets added
   - identify migration-free vs DB-change-required decisions

10. `09_CURRENT_TRUTH.md`
    - short canonical entrypoint for all future sessions/coders
    - exact current baseline
    - binding principles
    - current authoritative documents
    - known non-authoritative/dead paths
    - next implementation cutover order
    - explicit `DO NOT` list

`09_CURRENT_TRUTH.md` must be concise enough that a new agent can read it first and not need chat memory to avoid repeating old mistakes.

## 7. Quality bar

Do not write statements like “appears to”, “probably”, or “seems” when the repository/DB can be inspected.

For every important conclusion, include source path + symbol/function/RPC and, where useful, commit/PR evidence.

When a conclusion cannot be verified, mark `UNVERIFIED` and state what evidence is missing.

Distinguish:

- current code truth
- current DB truth
- historical intent
- live evidence
- proposed future architecture

Do not silently merge these categories.

## 8. Stop condition

This audit is complete only when a fresh coder can answer from the documents alone:

1. What writes each important game state today?
2. Which writers are duplicates or legacy?
3. What is the complete turn protocol today?
4. Where do Story, Extract, Engine, Commit, DB, and UI authorities overlap?
5. Which open PRs are current vs historical debris?
6. What DB functions still have mutation authority?
7. Which existing test harness pieces are reusable?
8. What exactly should be deleted/simplified before the next gameplay repair?
9. What is the single intended target architecture?
10. What must the next coder NOT reintroduce?

At completion: commit documentation only, push this same audit branch, and report final SHA plus a concise list of confirmed high-severity architectural conflicts. Do not implement the repair in the same branch.