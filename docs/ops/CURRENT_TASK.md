# Company v1 — CURRENT TASK

Status: WAITING_REVIEW
Task ID: open-observation-authority-core-v1
Updated: 2026-08-15
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution queue for Company v1.

## Why this task exists

The accepted V2 audit (`docs/audit/OPEN_SEMANTIC_OBSERVATION_AUTHORITY_RESET_V2_2026-08-15.md`, reviewed at final docs-only SHA `0435dde32427bf409eeab379976b1046d619e999`) proves a foundational architecture defect: Story and Extract are open-ended LLM stages, but the fresh runtime still forces observed narrative meaning through closed event/relation/emotion/posture/sexual taxonomies and deterministic server-authored fallbacks. Valid narrative facts can therefore disappear, become null, or be rewritten merely because they do not fit a predefined list.

This task is the first implementation cut of the semantic reset. It must be deletion-first, not an additive compatibility layer.

Target architecture:

`Player input / literal choice`
→ `Story LLM owns narrative`
→ `Extract LLM emits arbitrary evidence-backed observed facts + only proven narrow projections`
→ `server validates identity/evidence/action/turn/provenance/dedupe only`
→ `one durable open-fact writer`
→ `commit_company_turn`
→ `context/history/replay/next Story read the committed facts`

There is NO required event/relation/emotion/posture/sexual semantic type enum in the open-fact channel.

## Binding identity / topology

Repository: `zeroslove-ai/company-v1`
Branch: `company/scene-location-presence-v1`
Canonical PR: #67
Expected PR: base `main`, OPEN / DRAFT / UNMERGED
Starting HEAD: `0435dde32427bf409eeab379976b1046d619e999` or a docs-only operator registration descendant.
Accepted pre-reset gameplay executable lineage includes `1a5c5540a0235fb2e53b2452516897af7664eba1`; do not assume current docs-only HEAD is a new executable approval.
TEST Supabase: `fmcrspgxstsmxxsmkeee`.
Preserved manual game `78fb1d94-266f-455a-bda4-7656cc2370c1` is READ ONLY forever; do not mutate/reset it.
Dedicated TEST game `2d00d76e-85b1-4cf0-8dab-a04e8a044b84` must not be used in this source implementation task unless explicitly authorized below. No live gameplay is authorized in this task.
Do not create/reopen another branch or PR. Do not merge/Ready/rebase/squash.

## Product rules that must NOT regress

### Keep intentional content/identity catalogs
The following are not semantic-gate debt merely because they are finite:
- `content/organization.json` setup departments;
- `content/positions.json` setup positions;
- `content/body_types.json` setup body types;
- `content/speech_styles.json` setup speech styles;
- stable registered character IDs including `heroine1..heroine5`;
- registered locations / scene identity.

Do not delete or rename these product choices/IDs in this task.

### Keep compact clothing as a narrow UI continuity projection
Current UI consumes compact clothing state and the LLM may forget it. Preserve the existing useful clothing projection, but reduce duplicate writers if caller proof makes deletion safe. An unprojectable clothing/accessory fact must still survive in the open-fact channel.

### Keep image/media catalogs as presentation adapters
`image_library`, image pools, image tags, sexual action image families (`manual`, `oral`, `penetration`, `climax`, etc.) and deterministic image selection may remain finite because they select assets.

Critical boundary:
- image match failure may change/no-op image presentation;
- image taxonomy MUST NOT decide whether a Story action/fact occurred;
- image taxonomy MUST NOT gate/drop Extract open facts;
- do not remove sexual-image functionality in this task.

### Choices stay simple
Target path:
`Story provider -> exactly four literal CHOICE strings -> parser/persist -> UI -> selected literal string becomes player input`.
Exactly-four is presentation shape only. Server code must not become a second semantic choice author.

## Mandatory Phase 0 — freeze actual callers before edits

Before changing runtime, trace and record in the completion report the exact fresh-path callers/readers of:
- `src/engine/extract-prompt.js`
- `src/engine/runtime-core/extract-observation.js`
- `src/engine/runtime-core/observation-reducers.js`
- `src/engine/runtime-core/relation-event-reducer.js`
- `src/engine/relationship/*`
- `src/engine/sexual-state/*`
- choice fallback code
- `src/api/turn-routes.js`
- current save validator / `commit_company_turn` migration definitions
- `get_company_context`, history and replay readers
- frontend relationship/stat/clothing/media readers.

Classify each old closed-semantic writer/reader as DELETE NOW, LEGACY READ-ONLY, or PROVEN NARROW PROJECTION. Do not keep a fresh writer because an obsolete test references it.

## Required implementation

### 1. Define one structural open observation envelope

Implement one dependency-neutral canonical contract for fresh Extract observations. Exact field names may vary if source architecture strongly favors another shape, but the semantics must be equivalent to:

```json
{
  "subject_id": "registered-character-id-or-player",
  "object_id": "registered-character-id-or-player-or-null",
  "fact_text": "open natural-language observed fact",
  "story_quote": "exact substring from committed Story",
  "source_block": "optional structural Story block reference"
}
```

Rules:
- no required `event_type`, `relation_kind`, `emotion_type`, `posture_type`, `sexual_action_type`, `intimacy_stage`, `other`, or equivalent semantic enum;
- `fact_text` is open natural language;
- `story_quote` must be exact evidence from the committed Story/wire body;
- subject/object identities must resolve to `player` or registered current characters where applicable;
- no arbitrary LLM patch object may be merged into save;
- player input is intent/attempt, never evidence of success by itself;
- unknown optional projection does not erase a valid fact;
- malformed/unsupported optional fact must fail open for the turn: skip/warn that fact rather than reject an otherwise valid Story/turn, except malformed identity/evidence that would corrupt durable authority.

### 2. Change the fresh Extract generation contract

Rewrite the fresh Extract prompt so the provider is asked to extract arbitrary meaningful observed facts grounded in exact Story evidence instead of classifying all meaning into the old closed event/relation/emotion/posture/sexual universes.

Preserve only narrow structured projections that have a proven product/UI/mechanical consumer, especially compact clothing and structural scene/identity data where the current architecture requires them.

Do not add a new catch-all taxonomy. Do not add regex/keyword classification. Do not add another LLM call.

### 3. Replace fresh-path semantic normalization with structural normalization

Fresh Extract normalization must validate structure/evidence/registered IDs, not semantic vocabulary membership.

An arbitrary valid fact such as these must be able to survive without a code/schema release:
- a character accepts an apology but remains disappointed;
- two characters agree to prepare a later meeting together;
- a character avoids being alone with the player;
- a character leans sideways against a desk with folded arms;
- a character removes an accessory or rolls sleeves in a way not represented by compact clothing slots;
- an intimate/sexual event whose wording/position does not match an old action enum.

Do not loosen structural speaker/scene/action/turn identity checks.

### 4. One durable open-fact writer in the normal Commit boundary

Persist accepted open facts through the normal Commit flow only. `commit_company_turn` remains the normal durable transaction boundary.

Required durable properties:
- action_id / turn_number provenance;
- subject/object identity;
- exact Story quote/evidence;
- open fact text;
- deterministic replay/idempotent dedupe identity owned by server code;
- chronological readback.

Do not create two durable fact writers. Do not let Extract write the DB directly. Do not let frontend write gameplay facts.

If current DB/save validation cannot safely store/read the open fact ledger, create ONE additive migration source and verification as needed. Historical applied migrations are immutable. DO NOT APPLY any migration in this task.

### 5. Readback must exist in the same cut

A write-only fact ledger is forbidden.

The same implementation must expose committed facts through the active server context/history/replay path and feed them back into later Story context so facts remain available after the immediate raw recent-turn window.

Do not solve this with another provider call or a semantic classifier. Preserve chronological/provenance structure. If prompt-size bounding is necessary, use deterministic structural bounding and document exactly what can fall outside the prompt; the durable source itself must remain complete.

This does not need to finish the final long-term summary redesign, but it must eliminate the architecture where meaningful facts are durably written and then invisible to the next Story.

### 6. Delete/bypass old fresh semantic authorities in THIS cut

Do not merely add `fact_ledger` while continuing to require old closed semantics for fresh turns.

After caller proof, remove or remove-from-fresh-path the old semantic authority for at least:
- closed general event types;
- closed narrative relation-kind requirement;
- finite emotion/mood existence gate;
- intimacy-stage ladder as narrative relationship authority;
- posture `sitting/standing` as the universe of valid posture facts;
- sexual-action enum as the universe of valid sexual facts.

Where an old field is still required only for a visible counter/icon/UI projection, isolate it as a derived optional projection. Projection failure must not discard the open fact.

Old persisted rows may remain readable through a narrow `LEGACY_READ_ONLY` adapter if current stored-data/replay evidence proves the reader is still needed. No new fresh write may be routed through that legacy semantic adapter.

Delete dead tests/guards in the same change after caller proof. Do not preserve them with compatibility runtime.

### 7. Simplify choices without spending the cut on choices

Remove the deterministic server-authored fallback choice prose if caller proof confirms the UI already consumes provider-authored literal choices/free text.

Do not invent replacement semantic choice categories. If provider output violates exactly-four, preserve observability and free-text gameplay; do not silently author four unrelated actions in server code.

Choice work is a small deletion within this cut, not the main project.

### 8. Do NOT yet rewrite CSA physical mechanics in this task

The accepted V2 audit makes CSA physical execution grammar the next major deletion surface. Do not add to it or rely on it as open-fact authority here.

This task establishes the open observation/memory substrate first. The next architecture cut after acceptance should remove/reduce `execution_action`, `posture_after`, `RELATION_KINDS` coupling, mandatory enactment/direct coverage and scene obligations, retaining only proven institutional rule identity/lifecycle/applicability/transaction mechanics.

If current CSA physical writers collide with the new fact writer, isolate or stop their semantic relation/event writes now, but do not undertake the full CSA rewrite unless absolutely required to prevent duplicate durable authority. Document the remaining exact deletion targets.

## TEST-only Level 7 acceptance design — plan now, implement only if naturally isolated

Production progression remains unchanged. Current source unlocks strong CSA at Lv7.

Future live acceptance must use a dedicated TEST-only Level 7 acceleration seam so deep scenarios can be reached without ~100 organic low-level turns.

In this source task:
- identify the safest single TEST-only harness/seed/override seam;
- it must not be a second gameplay writer;
- it must be impossible to affect Production by normal runtime configuration;
- no ad-hoc direct DB mutation should become the normal testing workflow.

You MAY implement the seam in the test harness only if it is clearly isolated from gameplay runtime and requires no live DB write/deploy to validate locally. Otherwise document it for the next acceptance task and STOP. Do not modify Production progression logic.

## Required tests

At minimum, add/rewrite focused tests proving:

1. An arbitrary unseen relationship/emotion/event fact with exact Story evidence survives normalization and Commit.
2. An arbitrary posture/physical fact outside old enums survives as an open fact.
3. An arbitrary intimate/sexual fact outside old action enums survives as an open fact; no old enum is required for existence.
4. Evidence quote mismatch is not durably accepted.
5. Unknown/unregistered subject/object does not become durable authority and does not crash an otherwise valid turn.
6. Replay/idempotence cannot duplicate the same committed fact.
7. Open facts are returned by context/history/replay and reach later Story prompt input.
8. Compact clothing UI projection still works and an unmatched clothing fact survives separately.
9. Image selection/media tests still pass and image tag mismatch does not gate fact persistence.
10. Setup catalogs and stable heroine IDs are unchanged.
11. Provider-authored literal choices remain the UI/source contract; deterministic server prose fallback is removed if caller proof permits.
12. Legacy saved data required for replay remains readable without becoming a fresh writer.

Run the full current test suite after deleting/rewriting obsolete semantic-gate tests. Test-count reduction is acceptable when obsolete tests are deleted; explain every meaningful reduction.

## Forbidden

- Production access or mutation.
- Any TEST live gameplay/LLM call in this source implementation task.
- Any DB write/reset/DDL or migration apply.
- API/frontend deploy.
- Mutation/reset of manual game `78fb1d94-266f-455a-bda4-7656cc2370c1`.
- New branch/PR, merge, PR Ready, rebase, squash.
- Editing historical applied migration files.
- Provider/model/temperature/token changes.
- Retry/regeneration loop.
- Fuzzy semantic repair.
- Regex/keyword semantic classifier.
- New semantic catch-all enum.
- Third narrative parser.
- Arbitrary LLM save patch.
- Compatibility runtime added only to keep stale tests green.
- Removing or degrading compact clothing UI state, image/sexual-image media functionality, setup catalogs, registered character/location identity, scene structural integrity, action/turn ownership, exact evidence checks.

## Validation / terminal report

Before reporting COMPLETE:
- show START_SHA and executable candidate SHA separately from docs-only handoff SHA;
- list every runtime source file added/modified/deleted;
- list every semantic gate/writer/reader actually deleted or removed from fresh path;
- list any old reader retained as LEGACY_READ_ONLY with exact caller/deletion criterion;
- if additive migration source was created, show it and prove it was NOT applied;
- run focused tests and full test suite;
- run syntax checks for modified JS/MJS;
- run `git diff --check`;
- verify PR #67 remains base `main`, OPEN / DRAFT / UNMERGED;
- DB writes/resets/migration apply/deploy/Production/manual-game mutation must all be 0.

Then set CURRENT_TASK to `WAITING_REVIEW`, commit/push the implementation on the same branch, post one immutable terminal report to Issue #68, and STOP. Do not deploy or start live acceptance automatically.

## Implementation handoff — WAITING_REVIEW

- Task ID: `open-observation-authority-core-v1`
- Task blob / registration SHA at start: `afda38e21496e00321d8c9664231cd87af015685`
- Start HEAD: `afda38e21496e00321d8c9664231cd87af015685` (docs-only descendant of the accepted source baseline)
- Runtime candidate SHA: assigned by the implementation commit below; docs-only task state is separate from executable review identity.
- Branch: `company/scene-location-presence-v1`; PR #67 remains `OPEN / DRAFT / UNMERGED`, base `main`.

### Caller freeze and authority disposition

- Fresh Extract producer: `src/engine/extract-prompt.js`; fresh structural boundary: `src/engine/runtime-core/extract-observation.js`; fresh route caller: `/api/extract` in `src/api/turn-routes.js`.
- Fresh reducer path: `reduceGameplayCommit` -> `reduceObservationDomains`; durable writer remains the named `commit_company_turn` RPC.
- `relation-event-reducer.js` and `relationship/*` / `sexual-state/*` remain LEGACY_READ_ONLY or proven narrow mechanical projections for persisted rows and Engine/CSA obligations; fresh Extract event/relation/emotion writers are removed from the fresh normalized input. Future deletion criterion: no current persisted replay/Engine consumer.
- Compact clothing, scene identity/presence, image/media, setup catalogs, and stable registered IDs remain PROVEN NARROW PROJECTION / product authorities. Unmatched narrative meaning is preserved as an open fact.
- `persisted-extract-observation.js` remains a LEGACY_READ_ONLY boundary for stored V1/V2 rows; it is not used for fresh provider completion.
- `get_company_context` / `/api/context`, `/api/history`, replay readers, and `buildStoryContextProjection` now expose committed open observations; history reads `game_turns.post_save`.

### Implemented contract

- Fresh Extract accepts `open_facts[]` with registered `subject_id` / optional `object_id`, open `fact_text`, exact contiguous `story_quote`, and optional `source_block`.
- Server-owned `fact_id` includes action/turn identity and structural fact content; normal Commit appends with deterministic idempotent dedupe.
- Exact evidence and registered identity checks remain structural. Invalid optional facts are skipped with warnings; valid facts survive. No arbitrary save patch is accepted.
- Story ACTING no longer injects player posture into durable observation state without Extract evidence.
- Deterministic server-authored choice fallback prose was removed; malformed provider choices remain observable and unavailable rather than being rewritten.
- No additive migration was needed: `game_save.data` JSONB and existing `commit_company_turn` / `game_turns.post_save` already carry the structural ledger. Migration apply count: 0.
- TEST-only Level 7 acceleration seam was not implemented; it remains a separate acceptance harness design item.

### Verification

- Focused lifecycle / Extract / choice / setup-opening / relation-authority / atomicity tests: PASS.
- Full `npm.cmd test`: PASS, 459/459. (`npm test` PowerShell shim was blocked by local execution policy; equivalent `npm.cmd test` was used.)
- Modified JS/MJS syntax checks: PASS.
- `git diff --check`: PASS before commit.
- API/frontend dry-runs: not run; this source task forbids deployment preparation beyond local verification and no deploy was authorized.
- DB writes/resets: 0. Migration apply: 0. API/frontend deployments: 0. Production/manual-game access or mutation: 0.
