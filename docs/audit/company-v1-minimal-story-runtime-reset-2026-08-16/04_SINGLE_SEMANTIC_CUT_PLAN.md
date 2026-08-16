# 04 — Single Semantic Cut Plan

- Audit task: `minimal-story-runtime-authority-audit-v1`
- Start SHA: `0bf8a6a9b856b343249ffbba157dbbf090dd82c5`
- This document is a **plan only**. No source/runtime/test/config/DB behavior was changed by the audit task.
- The next session must author a new implementation task from this plan; this audit does not self-create or start that task.

## 1. Goal

Perform one coordinated semantic simplification cut that makes this graph true:

**Player input + current facts + active human rules + recent Story/history → Story → Extract observation → narrow Commit → presentation derivation**

and makes these graphs impossible on the fresh path:

- generic NPC stats → Story behavior;
- relationship state → Story behavior;
- CSA acceptance/resistance/attitude/runtime → Story behavior;
- regex semantic classifier → Story target/intent/outcome;
- finite sexual/CSA execution taxonomy → Commit meaning;
- any speaker anywhere in a movement turn → final destination presence;
- Extract image/media semantics → gameplay state;
- historical compatibility shape → fresh writer.

This must be one authority-model cut. Do not split it into symptom hotfixes such as “fix turn 5 rule text”, “exclude heroine4 on movement”, or “raise csa_acceptance”.

---

# 2. Target authority model after the cut

## Story owns

- natural-language meaning of the current player input;
- NPC response and narrative HOW;
- relationship/emotional/narrative continuity from recent raw Story + older summaries;
- natural behavior under active applicable company rules;
- the separation between rule-compliant behavior and personal discomfort/dislike/judgment;
- natural actor arrival/contact/departure when the player asks for it and the Story makes it happen.

## Pre-Story engine owns only

- exact registered identity validation;
- exact structural navigation destination when deterministically resolved;
- canonical current location/presence/time;
- committed rule definitions/active lifecycle;
- narrow current physical/clothing facts;
- atomic turn/action state;
- output protocol constraints.

## Extract owns only observation

- ordered/final scene observation;
- directly observable physical/clothing facts;
- directly evidenced retained player-sexual mechanic facts if still required;
- elapsed time;
- turn summary;
- presentation-only Mind Monitor derivation/output if retained in the same call.

It does not decide affinity, relationship status, CSA acceptance, rule execution, target semantics, sexual-event taxonomy, or image selection.

## Commit owns only persistence

- atomic action/turn lifecycle;
- minimal current scene;
- narrow physical/clothing state;
- retained player-sexual mechanic state;
- deterministic clock;
- CSA definition/active/progression mechanics;
- literal choices/summary/history fields required by product/replay.

## Presentation owns

- image character/pool/tags/selection;
- `last_image_id` if a cache is still useful;
- relationship/history badges if retained as a product surface;
- focal/last-speaker UI highlighting;
- CSA strength/authority labels;
- Mind Monitor rendering;
- TTS segmentation.

---

# 3. One-cut file/symbol plan

The implementation should modify all required layers in the same task/branch so no intermediate architecture makes a removed field “necessary” again.

## A. Story projection collapse

### `src/engine/story-prompt.js`

Symbols:

- `buildStoryCharacterProjection`
- `buildStoryContextProjection`
- `DURABLE_STORY_RULES`
- `buildStoryPrompt`

Changes:

1. Replace the broad payload with the Minimal Story input set from `01_STORY_PROMPT_AUTHORITY_INVENTORY.md`.
2. Remove Story-visible:
   - `registered_identities` full directory;
   - `possible_entrants`;
   - semantic `remote_contacts` cast authority;
   - `player_dialogue_policy`;
   - `target_authority`;
   - full `registered_locations`;
   - `context.game` id/title;
   - semantic scene goal/focus/focal/last-speaker fields;
   - `active_npc_state.npc_stats`;
   - `active_npc_state.csa_attitudes`.
3. Keep only compact explicitly referenced non-present character canon when required.
4. Keep current physical/clothing facts independently of generic stats.
5. Rewrite CSA wording once:
   - active + applicable rule is ordinary workplace fact;
   - Story authors natural compliance;
   - discomfort/dislike/judgment remain free reactions;
   - rule text alone does not prove a physical transition;
   - no finite execution token/grammar is required.
6. Keep `player_private_origin` only as player-private causal knowledge. It may never become NPC knowledge.

### `src/engine/gameplay-state.js`

Symbols:

- `ACTIVE_NPC_MAPS`
- `buildSceneContextCore`
- `HYDRATION_SOURCES`
- `hydrateGameplayState`
- `migrateCompanySave`
- `TURN_CHANGE_ROOTS`

Changes:

1. Stop using generic `buildSceneContextCore` as a broad Story authority carrier.
2. Split/replace with narrow projections for:
   - structural scene;
   - physical/clothing continuity;
   - non-Story mechanics.
3. Delete fresh hydration/default-fill for:
   - generic NPC stats;
   - generic relationship state;
   - CSA attitudes.
4. Make `migrateCompanySave` strip retired active-save roots from fresh runtime objects so old DB JSON cannot leak back into new Commit output.
5. Keep historical turn snapshots untouched.

### `src/engine/csa/story-projection.js`

Symbol: `buildStoryWorldProjection`

Changes:

Reduce Story-visible rule projection to:

- id if required for traceability;
- human-readable content;
- subject scope;
- counterparty scope when required;
- effective/activation fact;
- necessary trigger condition.

Remove Story-visible:

- strength/authority tier;
- institutional form/mode taxonomy;
- known/applicable actor lists;
- `clothing_projection.compliant`;
- finite execution metadata/required-state conclusions.

Actual clothing remains a separate current fact.

### `src/engine/workplace-context.js`

Changes:

- stop sending `eligible_nearby_npcs` to Story;
- stop converting nearby staff into Story candidate authority;
- keep map/catalog helpers only where navigation/UI needs them outside Story.

### `src/engine/player-setup.js`

Symbol: `buildPlayerPromptProjection`

Changes:

- remove keyword-based semantic gating as the rule for deciding which stable player facts matter;
- define one explicit stable player canon projection;
- define a separate narrow physical projection;
- keep numeric mechanics out of Story.

---

## B. Delete pre-Story narrative meaning judgment

### `src/engine/scene-cast.js`

Remove from the fresh path:

- `HIGH_IMPACT_INTENTS`;
- `INTENT_PATTERNS` semantic ontology;
- `classifyDialogueIntents()`;
- `resolvePlayerDialoguePolicy()`;
- semantic `validatePlayerDialogueAgainstPolicy()` behavior;
- fuzzy unique-given-name resolution;
- pre-Story entrant inference;
- pre-Story remote-cast inference;
- pending entrant/remote semantic queues if no non-semantic product use remains.

Keep/refactor only:

- current canonical present IDs;
- strict registered-ID/full-name resolution;
- exact location identity/alias resolution;
- narrow structural navigation intent.

### `src/api/turn-routes.js`

Symbols/paths:

- `projectStorySaveForNavigation`
- `buildStoryTurnTrigger`
- `playerPrivateOriginFor`
- fresh turn Story/Extract pipeline

Changes:

1. Keep structural navigation preprojection because location has one durable writer.
2. Feed Story the exact destination, but do not preselect destination cast or semantic dialogue outcome.
3. Remove fresh calls to the deleted dialogue-policy/cast semantic layer.
4. Keep rule transaction application before Story so same-turn activation is effective.
5. Keep `playerPrivateOriginFor` narrow and private.
6. Remove gameplay dependence on Extract image semantics; move selection after Commit/presentation.

---

## C. Extract collapse

### `src/engine/extract-prompt.js`

Replace the fresh output contract with a minimal observer shape.

Required fresh outputs should be limited to product-proven fields such as:

- `extract_version`;
- `scene_observation` with ordered/end-state facts;
- player/NPC narrow physical or clothing observations;
- direct retained player-sexual observations if necessary;
- evidence;
- `elapsed_minutes`;
- `turn_summary`;
- warnings for actual structural validation problems;
- Mind Monitor as presentation-only output if kept in this call.

Delete fresh instructions/output for:

- affinity/affection/resistance/CSA acceptance;
- `csa_attitude`;
- generic relationship/emotion/work semantic updates;
- `events.sexual` closed action taxonomy;
- `csa_trigger_evaluations`;
- `csa_runtime_updates`;
- `action_target_id`;
- image character/selection/tags/pool.

Do not keep ghost domains merely to “drop with warning”. Fresh schema should simply not contain them.

### `src/engine/runtime-core/extract-observation.js`

Changes:

- make fresh normalization match the new minimal schema;
- delete fresh normalizers for removed semantic domains;
- delete fresh finite sexual-event taxonomy;
- preserve narrow evidence validation;
- preserve strict ID/location validation;
- make scene observation chronology/end-state capable.

### `src/engine/runtime-core/persisted-extract-observation.js`

Disposition: keep historical read-only.

Change only as necessary to make the boundary explicit:

- persisted/legacy rows may still be normalized for replay;
- no output from this adapter may feed the fresh current-save writer as semantic authority.

### `src/engine/runtime-core/legacy-extract-adapter.js`

Same rule: historical reader only. No fresh caller.

---

## D. Commit collapse

### `src/engine/runtime-core/observation-reducers.js`

Remove fresh reducers for:

- NPC generic stat deltas;
- relationship state;
- CSA attitudes;
- sexual-event ledger taxonomy.

Keep only narrow reducers for:

- physical/clothing facts;
- retained player-sexual mechanics with direct evidence;
- other explicitly retained mechanics.

### `src/engine/runtime-core/commit-reducer.js`

Keep orchestration but ensure it can only invoke retained narrow reducers.

No removed root may be copied forward merely because it existed in `currentSave`.

### `src/engine/runtime-core/csa-commit-reducer.js`

Keep:

- rule definition/activation/deactivation state;
- progression/experience mechanics.

Delete/ignore as fresh authority:

- provider runtime execution claims;
- semantic trigger/runtime update channels no longer present in Extract.

Historical CSA runtime data remains readable from old snapshots only.

---

## E. Fix scene chronology by deleting the general bad rule

### `src/engine/runtime-core/scene-reducer.js`

Delete the fallback:

> registered local speaker anywhere in the turn ⇒ present at final authoritative destination.

Replace it with ordered end-state logic:

1. authoritative navigation destination still determines final location when exact structural navigation was resolved;
2. Story/Extract evidence is processed in source order;
3. a local dialogue speaker proves presence at that point in the Story only;
4. a movement boundary ends the source-location phase;
5. final presence is derived from destination-phase local evidence, explicit entries/exits, or a complete final snapshot;
6. remote speakers never become local presence;
7. absent end-state evidence does not resurrect a source-room speaker at the destination.

### Turn-6 acceptance example

Story:

- source meeting room: heroine4 speaks;
- player leaves;
- destination office: heroine1 speaks.

Required committed result:

- final location: office;
- heroine1 may be present;
- heroine4 is not carried into the office solely because she spoke before departure.

This must be implemented as chronology semantics, not as an NPC-specific filter.

---

## F. Save/DB contract cut

No DB change is authorized by this audit. The future implementation task should include one explicitly authorized TEST migration/function revision so source and DB contracts change together.

### Functions to revise

- `validate_company_save_v1`
- `create_company_game`
- `reset_company_game`
- `reserve_company_player_setup`
- `commit_company_opening`
- any helper that reconstructs the canonical initial/current save

### Remove fresh-save requirements/preservation for

- `npc_stats`
- `npc_relationship_state`
- `csa_attitudes`
- `csa_runtime_state`
- `csa_aftereffect_state`
- `last_image_id` as gameplay root
- retired semantic scene keys that are not required for current structural scene.

### Preserve

- historical `game_turns.pre_save/post_save` exactly as committed;
- old Extract payloads for read-only replay;
- atomic `commit_company_turn` writer model;
- physical/clothing and other explicitly retained narrow mechanics.

### Data mutation safety

A future migration must name exactly which TEST game rows, if any, it is allowed to rewrite. It must not silently scrub the preserved/manual game or Production. A safe implementation can first make removed roots **inert and stripped by fresh runtime/reset/commit projection**; targeted row cleanup requires separate explicit authorization inside that implementation task.

---

## G. Content/default cut

### `content/characters.json`

Remove legacy mutable bootstrap semantics that only exist to hydrate the retired state model:

- `initial_stats` generic relationship/acceptance/resistance/arousal values;
- `initial_relationship` generic mutable relationship state;
- any `initial_csa_attitudes` if present/used.

Keep authored character canon, including personality/speech and stable `csa_style` narrative guidance. `csa_style` may describe how a character emotionally reacts to rules, but must not override an active applicable rule's common-sense applicability.

---

## H. Presentation cut

### `src/api/runtime-display.js`

Remove product projections that make retired generic state look authoritative:

- affinity/affection;
- resistance;
- CSA acceptance;
- generic NPC arousal;
- generic durable relationship object.

Keep/derive:

- character canon;
- current physical/clothing facts;
- player narrow sexual mechanic if product still requires it;
- active CSA app data;
- presentation labels derived from catalogs/mechanics.

### `src/frontend/pages/view-model.js`
### `src/frontend/pages/relationship-icons.js`

Remove dependencies on retired NPC stats/relationship/sexual-event ledger semantics.

If a relationship/history badge remains useful, derive it from committed Story/turn summaries rather than creating another mutable relationship authority.

### Media

Move `image_character_id`, tag/pool/situation selection, and `selectImage` out of Extract semantics.

Presentation may derive image candidates from:

- committed parsed Story;
- final current scene actors;
- narrow visible physical facts;
- image catalog.

The result must not alter gameplay state or future Story meaning.

---

# 4. Test reset inside the same cut

Static tests must be changed with the authority model, not used as a reason to preserve it.

## Tests to rewrite/delete where they lock old semantics

### `test/prompt-boundary-contract.test.mjs`

Delete assertions that require:

- nearby candidate NPCs;
- `possible_entrants` semantic authority;
- full all-NPC/all-location Story directories;
- semantic target/dialogue-policy payloads.

Add assertions that Story payload excludes:

- `npc_stats`;
- `npc_relationship_state`;
- `csa_attitudes`;
- `csa_runtime_state`;
- `csa_aftereffect_state`;
- semantic entrant/remote schedulers;
- CSA strength/compliance/execution semantics;
- media selection fields.

### `test/scene-runtime-contract.test.mjs`

Delete/replace tests that intentionally accept a source speaker as final destination presence when the final snapshot is unknown.

Keep:

- canonical scene schema/invariants;
- strict location IDs;
- entry/exit normalization;
- remote/local separation;
- deterministic authoritative navigation.

Add ordered movement regressions.

### `test/extract-observation-contract.test.mjs`

Delete fresh-schema expectations for:

- NPC stats;
- CSA attitude;
- sexual-event closed taxonomy;
- CSA trigger/runtime semantic updates;
- image selection.

Keep direct observation/evidence, physical/clothing, end scene, elapsed time, summary, and retained player mechanics.

### `test/csa-runtime-contract.test.mjs`

Keep tests proving:

- Story gets human active rule facts;
- no finite execution contract/direct-coverage authority;
- provider execution claims cannot write physical state;
- rule lifecycle/progression remains deterministic.

Delete the test that locks `clothing_projection.compliant` as precomputed Story semantics.

Add a prompt contract for the positive rule premise: active + applicable means ordinary workplace compliance; emotion remains separate.

### Other impacted suites

Review and update in the same cut:

- `test/gameplay-state-contract.test.mjs`
- `test/runtime-display-contract.test.mjs`
- `test/frontend-projection-contract.test.mjs`
- `test/frontend-view-model.test.mjs`
- `test/frontend-state-contract.test.mjs`
- `test/setup-opening*.test.mjs`
- `test/turn-pipeline-replay.test.mjs`
- `test/turn-transaction-replay.test.mjs`
- DB contract/validator tests.

Historical replay tests must prove old rows remain readable without restoring old fresh authority.

---

# 5. Golden Play regression suite

Static shape tests are not enough. The QA failure is narrative behavior under competing authority. The next implementation task should add a small deterministic Golden Play fixture/evaluation layer.

No Golden Play case should test the explicitly out-of-scope honorific issue.

## GP01 — Active continuous CSA, no player reminder

Given:

- an active rule applies to the current NPC;
- trigger is continuous/currently effective;
- NPC may dislike the rule.

Expect:

- Story naturally treats the rule as ordinary workplace fact;
- Story must not say it is optional, pending personal approval, or up to the employee whether to comply;
- no finite execution-engine jargon appears.

## GP02 — Discomfort and compliance coexist

Expect Story may show embarrassment, anger, discomfort, criticism, or protest while still narrating behavior consistent with an applicable active rule.

This protects the new separation: **reaction freedom != rule veto**.

## GP03 — Trigger-bound rule, before/after trigger

Before the exact trigger:

- no premature required behavior.

After the exact trigger occurs in player input/Story:

- Story naturally responds under the rule;
- no precomputed execution ID/route/compliance marker is needed.

## GP04 — Movement A → B with speakers on both sides

Story order:

- A speaks at source;
- player leaves source;
- B speaks at destination.

Expect final scene:

- destination location B;
- B present if evidenced;
- A not present solely because A spoke earlier.

## GP05 — Remote speaker never becomes local presence

A phone/remote dialogue participant may appear in Story/Mind Monitor presentation, but final local `present_npc_ids` must remain unchanged unless Story separately narrates physical arrival.

## GP06 — Minimal Story payload absence

Assert that a fresh ordinary Story request contains no:

- generic NPC stats/relationship state;
- CSA attitudes/runtime/aftereffects;
- rule strength/compliance/execution metadata;
- nearby/possible entrant scheduler;
- semantic dialogue policy;
- image/media selection.

## GP07 — Direct physical/clothing continuity

Story visibly establishes a clothing/physical change.

Expect:

- Extract observes the exact fact;
- Commit persists the narrow state;
- no generic acceptance/relationship/sexual-event taxonomy is created.

## GP08 — Narrative relationship continuity without relationship state

Given:

- recent raw Story establishes tension/closeness;
- older summary contains prior shared event;
- no `npc_relationship_state` exists.

Expect Story preserves the interpersonal continuity from history alone.

## GP09 — Presentation-only media

Given a committed Story that clearly features an actor/situation:

- image candidate selection may occur after Commit;
- no image field appears in Extract gameplay semantics;
- no image choice can mutate future Story/Commit authority.

## GP10 — Fresh reset/create produces minimal root set

On authorized disposable TEST data only:

- create/reset/opening/first commit must not resurrect retired semantic roots;
- validator accepts the minimal save;
- historical old turns remain readable.

### Optional LLM judge

An LLM judge may be used **evaluation-only** for GP01–GP03/GP08 narrative quality. It must not:

- retry provider output;
- mutate runtime state;
- become a production gate inside the turn path;
- replace deterministic structural assertions.

Store judge output as CI/evaluation evidence only.

---

# 6. One-cut implementation order

The task should remain one semantic cut, but implementation should be staged internally in this dependency order:

1. define new Story/Extract/save contracts in tests/fixtures;
2. collapse Story inputs and delete pre-Story semantic judgment;
3. collapse Extract fresh schema;
4. collapse Commit reducers and fix scene chronology;
5. remove hydration/content resurrection;
6. revise DB validator/reset/create/opening contract under explicit TEST authorization;
7. remove UI/media dependencies on retired state;
8. preserve historical read-only adapters;
9. run deterministic full suite + Golden Play;
10. only after review, separately authorize any live TEST migration/deploy operation required by the implementation task.

Do not land a state where Story stops reading a semantic root but DB/UI/tests still require it indefinitely. That is how ghost authority re-enters later work.

---

# 7. Implementation acceptance criteria

The future implementation is complete only when all are true:

1. ordinary Story payload matches the Minimal Story input set;
2. `npc_stats`, `npc_relationship_state`, `csa_attitudes`, `csa_runtime_state`, and `csa_aftereffect_state` cannot influence fresh Story;
3. pre-Story raw-text logic does not classify relationship/high-impact dialogue semantics or choose narrative cast; navigation/identity resolution is exact and structural only;
4. active applicable CSA is a positive common-sense Story premise, with emotion/reaction separate;
5. fresh Extract contains no generic NPC stats, relationship, CSA attitude/runtime, sexual-event taxonomy, target semantics, or media selection;
6. fresh Commit has no writer for those removed domains;
7. a movement turn cannot teleport a source speaker into the destination by whole-turn speaker union;
8. fresh save validator/reset/create/opening do not require or resurrect removed roots;
9. existing historical turn snapshots remain readable without becoming current state;
10. generic NPC stat/relationship UI dependencies are removed or presentation-derived;
11. media selection is presentation-only;
12. static tests no longer lock old authority;
13. Golden Play GP01–GP10 pass;
14. no honorific behavior change is bundled into the cut;
15. no unrelated UI redesign, gameplay feature, provider/model/retry change, or new authority system is added.

---

# 8. Explicit non-goals

Do not use this cut to:

- tune individual NPC behavior;
- add new relationship meters;
- calibrate CSA acceptance/resistance numbers;
- add a better execution engine;
- add a new entrant scheduler;
- add a new semantic classifier;
- fix honorific tone;
- redesign the whole UI;
- change provider/model/retry policy;
- migrate Production;
- add unrelated gameplay features.

The purpose is deletion and authority simplification.

---

# 9. Handoff statement

The four audit documents in this directory are sufficient for a fresh session to author **one implementation task** for the Minimal Story Runtime semantic cut.

This audit task ends at plan/review. It does not authorize implementation, migration, reset, deployment, merge, Ready transition, provider call, or creation of the next task.