# 03 — REMOVE / KEEP Classification

- Audit task: `minimal-story-runtime-authority-audit-v1`
- Start SHA: `0bf8a6a9b856b343249ffbba157dbbf090dd82c5`
- Classification unit: one audited authority item/contract row below.
- Rule: every row is assigned to exactly one of the five CURRENT_TASK categories.

## 1. Counts

| Category | Count |
|---|---:|
| `KEEP_STORY_INPUT` | 25 |
| `KEEP_NARROW_MECHANIC_NOT_STORY` | 32 |
| `KEEP_HISTORICAL_READ_ONLY` | 5 |
| `DERIVE_AT_PRESENTATION` | 11 |
| `REMOVE` | 79 |
| **Total** | **152** |

The large REMOVE count is intentional. The unit of work is not “fields in one JSON object”; it includes fresh prompt inputs, helper judgments, DB roots/defaults, Extract fields, Commit consumers, UI dependencies, and tests that would otherwise recreate or protect the old authority model.

---

# 2. `KEEP_STORY_INPUT` — 25

Every KEEP below has a concrete narrative need. “It already exists” or “a current test expects it” is not accepted as a reason.

| ID | Item | Concrete reason to keep in Story |
|---|---|---|
| S01 | raw current `player_action` | primary authority for the player's current intent/action |
| S02 | `feedback_text` on feedback revision | the revised Story must know the user's explicit correction request |
| S03 | current canonical game time | prevents invented elapsed time/day and anchors temporal continuity |
| S04 | current canonical location identity/name | Story must know where the current scene actually is |
| S05 | current canonical `present_npc_ids` | current physical presence is a structural world fact |
| S06 | current scene-actor character canon | identity/personality/speech/role canon is required to write the actor consistently |
| S07 | exact explicitly referenced non-present character compact canon | a named target/contact can be described without exposing the entire NPC directory |
| S08 | stable player identity/department/position/address/speech canon | prevents role/title drift and supports natural workplace dialogue |
| S09 | confirmed player physical/clothing facts relevant to continuity | Story cannot preserve an observable physical state it is not told; use facts, not semantic meters |
| S10 | confirmed NPC physical/clothing facts relevant to continuity | same continuity need for currently relevant NPCs |
| S11 | latest six raw committed Story turns | recent narrative wording/order/interpersonal continuity is authoritative evidence |
| S12 | older committed turn summaries | bounded long-term narrative memory without recreating generic relationship state |
| S13 | active CSA human-readable rule content | Story must know the institutional fact it is expected to narrate naturally |
| S14 | active CSA subject scope | Story must know who the rule applies to |
| S15 | active CSA counterparty scope when required | necessary for rules whose applicability depends on the other participant |
| S16 | active CSA activation/effective-time fact | distinguishes an active rule from one not yet effective; avoids retroactive rewriting |
| S17 | active CSA necessary trigger condition | prevents premature behavior for request/trigger-bound rules without exposing execution grammar |
| S18 | institutional activation/deactivation turn trigger | the activation turn needs to know that the world rule changed this turn |
| S19 | exact authoritative navigation destination after deterministic structural resolution | location is durable structure; Story must narrate the destination the engine has structurally committed to |
| S20 | Opening bootstrap current time/location | turn 0 has no prior Story; Opening still needs exact starting world coordinates |
| S21 | Opening selected primary/support character canon | the first playable scene needs its actual authored actors |
| S22 | Opening work-hook/scene-goal seed | Opening has no player action/history to create a playable work situation; keep this opening-only seed, never generic durable semantic state |
| S23 | Opening player setup canon | the first Story must reflect the player created by setup |
| S24 | Opening cross-team/narrative setup note | opening-only authored setup fact needed for the initial workplace scene |
| S25 | `player_private_origin` limited to player-only causal knowledge of a structured action | preserves the fact that the player privately knows they initiated a rule transaction while preventing NPCs from receiving that private knowledge |

### Story KEEP boundary

The retained Story input set is intentionally factual and narrative. No row above is an acceptance score, relationship conclusion, scheduler, execution result, rule-compliance boolean, or media decision.

---

# 3. `KEEP_NARROW_MECHANIC_NOT_STORY` — 32

These items have a concrete product/integrity need, but Story must not treat them as world meaning.

| ID | Item | Concrete reason to keep outside Story |
|---|---|---|
| M01 | edition/save-schema identity | versioning/integrity, not narrative meaning |
| M02 | `expected_turn` / `action_id` reservation sequencing | atomic turn ordering/idempotency |
| M03 | registered NPC ID universe | validates emitted speaker/reference IDs without exposing an all-NPC world list to Story |
| M04 | registered location catalog/aliases/navigation graph | deterministic structural navigation and ID validation |
| M05 | exact full-name/ID resolver | maps explicit references to registered identity without guessing narrative meaning |
| M06 | exact structural player navigation resolver | location is durable state and needs a deterministic writer; resolver must be exact and narrow |
| M07 | Story marker/parser registered-speaker validation | syntax/identity integrity only |
| M08 | exactly-four-choice parser/storage validation | product choice contract; choices are proposals, not world-state conclusions |
| M09 | canonical scene structural save root | durable current location/presence must survive turns |
| M10 | `player_scene_state` narrow physical storage | current posture/clothing/physical continuity with direct evidence |
| M11 | `npc_scene_state` narrow physical/clothing storage | same for NPCs; no generic relationship/stat meaning |
| M12 | `player_sexual_state` numeric mechanics | current UI/mechanic uses player arousal/progress/count; keep outside Story unless an observable physical fact is separately projected |
| M13 | `csa_active` durable active list | rule lifecycle mechanic |
| M14 | `csa_rules` durable definitions | committed rule content/source/scope must persist |
| M15 | CSA strength/capability/slot mechanics | app/editor capability currently depends on strength; do not send the value to Story as narrative authority |
| M16 | CSA transaction signature/validation | protects authorized structured rule changes |
| M17 | `player_progress` / `csa_experienced_ids` | progression/product mechanic, not narrative interpretation |
| M18 | `world_state` clock + deterministic elapsed application | one structural time writer is still required |
| M19 | `last_choices` / `last_choice_meta` | input/UI/replay mechanic; literal choices remain proposals |
| M20 | `turn_summary` persistence | bounded history memory used by future Story |
| M21 | `game_actions` / `game_turns` lifecycle and feedback revisions | atomicity, audit history, recovery |
| M22 | fresh Extract end-scene structural observation/evidence | post-Story observer must tell Commit the actual final scene state |
| M23 | fresh Extract narrow physical/clothing observation | records only directly observable state needed for continuity |
| M24 | fresh Extract direct player sexual-mechanic observation | only if directly evidenced and consumed by the retained player mechanic |
| M25 | fresh Extract `elapsed_minutes` | post-Story time observation feeding the deterministic clock writer |
| M26 | CSA definition/lifecycle Commit reducer | persists activation/definition/progression, not physical execution claims |
| M27 | Opening plan/bootstrap deterministic mechanism | setup needs a repeatable opening contract; it ends at bootstrap |
| M28 | save schema/version invariant | integrity guard for fresh saves |
| M29 | `opening_state` structured replay/bootstrap state | preserves opening recovery/replay without becoming ordinary-turn narrative authority |
| M30 | CSA preset catalog metadata used by app transaction editor | product/editor needs catalog semantics such as strength/capability; Story does not |
| M31 | raw Story supplied to Extract observer | Extract must observe the actual generated Story, not a precomputed semantic plan |
| M32 | registered locations supplied to Extract only for structural ID validation | validates observed scene IDs; not a Story world-directory input |

---

# 4. `KEEP_HISTORICAL_READ_ONLY` — 5

These survive only so already-committed history remains readable. They must not be copied back into the fresh active save or fresh prompt.

| ID | Item | Concrete reason |
|---|---|---|
| H01 | historical `game_turns.pre_save/post_save` snapshots including retired roots | immutable audit/replay evidence; do not rewrite old turns |
| H02 | persisted Extract V2 historical normalization | existing committed rows may contain the old shape and still need rendering/replay |
| H03 | legacy Extract `state_delta` adapter | compatibility reader for old rows only |
| H04 | superseded/archived `game_actions` and `game_turns` semantic payloads | revision/history auditability; never fresh authority |
| H05 | historical `csa_runtime_state` / `csa_aftereffect_state` inside archived snapshots | old snapshots remain parseable without keeping those roots in current save |

`src/engine/runtime-core/persisted-extract-observation.js` is the model for this boundary: historical compatibility may exist, but it must be unreachable as a fresh writer.

---

# 5. `DERIVE_AT_PRESENTATION` — 11

These can be computed from committed Story, retained mechanics, catalogs, or history. They do not belong in fresh narrative authority or durable gameplay semantics.

| ID | Item | Presentation derivation |
|---|---|---|
| P01 | `image_character_id` | derive from final/visible Story actors |
| P02 | image selection/tags/pool/situation | derive from committed Story + presentation catalog, not Extract semantic output |
| P03 | `last_image_id` | presentation cache/state if needed; not required gameplay save root |
| P04 | `image_library` choice | presentation selector over image catalog |
| P05 | CSA strength/authority/scope labels | format retained CSA mechanic fields for UI only |
| P06 | relationship/history badges or summaries if still shown | derive from raw Story/committed summaries/history rather than generic durable relationship state |
| P07 | institutional announcement segments | render from the committed CSA transaction/rule activation event |
| P08 | location/role/position labels | resolve canonical IDs through catalogs |
| P09 | current focal character / last speaker UI view | derive from parsed committed Story/current presence; do not make them future Story authority |
| P10 | TTS segments | derive from parsed Story dialogue blocks |
| P11 | Mind Monitor and target list | derive as a player-facing interpretation from the committed Story/actors actually observed in the turn; it must not feed gameplay authority back into Story/Commit |

---

# 6. `REMOVE` — 79

These items either create competing narrative authority, resurrect obsolete save semantics, encode finite taxonomies the Story now owns, or lock the wrong behavior in UI/tests.

| ID | Remove item | Why |
|---|---|---|
| R01 | `npc_stats.affinity` | generic relationship score; recent Story/summary owns continuity |
| R02 | `npc_stats.affection` | legacy duplicate/generic relationship score |
| R03 | `npc_stats.resistance` | precomputed behavior bias competing with Story |
| R04 | `npc_stats.csa_acceptance` | direct competing authority over applicable institutional rule behavior |
| R05 | NPC generic `sexual_arousal` stat | generic NPC semantic meter; no required fresh authority shown in QA |
| R06 | active-save `csa_attitudes` | QA remained empty; still leaks into Story |
| R07 | active-save `npc_relationship_state` | parallel semantic relationship authority; QA static |
| R08 | active-save `csa_runtime_state` | fresh QA empty/dead; historical values can remain read-only |
| R09 | active-save `csa_aftereffect_state` | same; no fresh minimal-runtime need |
| R10 | active-save `sexual_event_ledger` | finite event taxonomy; current downstream uses are presentation/legacy semantics |
| R11 | edition character `initial_stats` | rehydrates removed generic stats |
| R12 | edition character `initial_relationship` | rehydrates removed relationship semantics |
| R13 | edition/hydration `initial_csa_attitudes` source | rehydrates removed CSA attitude semantics |
| R14 | semantic `HYDRATION_SOURCES`/default-fill for stats/relationship/attitudes | fresh-turn resurrection path |
| R15 | Story `active_npc_state.npc_stats` | direct semantic prompt contamination |
| R16 | Story `active_npc_state.csa_attitudes` | direct semantic prompt contamination |
| R17 | Story `possible_entrants` | pre-Story actor selection authority |
| R18 | Story `workplace.eligible_nearby_npcs` | scheduler/candidate semantics before Story |
| R19 | Story full workplace floor/department/type/visibility/tags/adjacency metadata | map engine data beyond current narrative need |
| R20 | Story full `registered_locations` catalog | validator/navigation data, not narrative context |
| R21 | Story full `registered_identities` all-NPC list | output validator can hold it outside prompt; broad list encourages unrequested actors |
| R22 | Story `player_dialogue_policy` | pre-Story interpretation of user intent |
| R23 | Story `target_authority` | semantic target conclusion derived before Story |
| R24 | `HIGH_IMPACT_INTENTS` / `classifyDialogueIntents` taxonomy | regex ontology deciding narrative meaning |
| R25 | `resolvePlayerDialoguePolicy` and semantic validation | same pre-Story meaning authority |
| R26 | fuzzy unique-given-name identity resolution | ambiguous target guessing; keep exact identity only |
| R27 | pre-Story entering-NPC inference | actor arrival belongs to Story then Extract observation |
| R28 | pre-Story remote-NPC inference/cast authority | remote/local narrative result should not be decided by regex cast scheduler |
| R29 | keyword-gated player body/background projection | semantic regex decides which facts “matter”; replace with explicit product projection |
| R30 | Story CSA authority/strength tier | biases compliance/intensity; strength remains app mechanic only |
| R31 | Story CSA `phase` / `institutional_form` / `mode` taxonomy | redundant engine semantics once content/scope/effective trigger are retained |
| R32 | Story precomputed known/applicable actor ID lists | precomputed applicability conclusion competes with Story |
| R33 | Story `clothing_projection.compliant` | explicit precomputed semantic conclusion |
| R34 | Story CSA execution/required-action semantic projection | finite execution grammar rejected by canon |
| R35 | wording that demotes active applicable rules to optional “context” | directly matches QA optionality drift |
| R36 | Story scene `goal/focus_thread/beat` narrative framing inputs | persisted semantic scene planner not in minimal structural scene |
| R37 | Story scene `focal_character_id/last_speaker_id` as future authority | current action/raw Story should drive interaction; UI can derive these |
| R38 | Extract-context `active_npc_state` semantic stats/attitudes | post-Story observer does not need acceptance/relationship bias |
| R39 | Extract-context `global_csa/csa_runtime_state` | fresh observer should see active human rules only when needed to interpret observable facts, not runtime semantic state |
| R40 | fresh Extract `csa_trigger_evaluations` | QA always empty; Story owns meaning and rule trigger premise, Commit owns lifecycle |
| R41 | fresh Extract `csa_runtime_updates` | QA always empty; obsolete semantic runtime channel |
| R42 | fresh Extract `npc_observations.stats` | generic stat writer surface |
| R43 | fresh Extract `npc_observations.csa_attitude` | generic CSA-attitude writer surface |
| R44 | fresh Extract `events.sexual` closed taxonomy | finite semantic action ontology; keep direct narrow physical facts only |
| R45 | fresh Extract `action_target_id` | semantic target conclusion duplicated from Story/current input |
| R46 | fresh Extract image-character/image-selection outputs | presentation authority in the wrong layer |
| R47 | fresh warning/drop normalization surface for already-removed relationship/emotion/work/general domains | fresh contract should not enumerate ghost domains merely to drop them |
| R48 | Extract instructions for CSA acceptance/affinity/arousal semantics | explicitly teaches obsolete semantic model |
| R49 | fresh Commit NPC-stat reducer | writer for removed generic stats |
| R50 | fresh Commit relationship reducer | writer for removed parallel relationship semantics |
| R51 | fresh Commit CSA-attitude reducer | writer for removed attitude semantics |
| R52 | fresh Commit sexual-event taxonomy/ledger reducer | writer for removed event ontology |
| R53 | whole-turn local-speaker ⇒ final-destination presence fallback | proven turn-6 temporal-collapse bug |
| R54 | validator requirement for `npc_stats` | forces obsolete root into every fresh save |
| R55 | validator requirement for `npc_relationship_state` | same |
| R56 | validator requirement for `csa_attitudes` | same |
| R57 | validator requirement for `csa_runtime_state` | same |
| R58 | validator requirement for `csa_aftereffect_state` | same |
| R59 | validator requirement for `last_image_id` | presentation field required as gameplay state |
| R60 | create/reset/setup/opening preservation/reseeding of retired semantic roots | resurrection boundary |
| R61 | retired semantic roots in `game_master.initial_save` | reset resurrection source |
| R62 | runtime-display generic NPC stat projection | keeps ghost metrics product-visible and therefore artificially “required” |
| R63 | runtime-display generic relationship projection | keeps removed semantic authority product-visible |
| R64 | frontend relationship-icons legacy metrics/event semantics | UI dependency on removed ontology |
| R65 | view-model media pool driven by `sexual_event_ledger` | presentation coupled to finite gameplay event taxonomy |
| R66 | tests locking nearby-candidate/pre-Story semantic contracts | protects the wrong authority model |
| R67 | tests locking whole-turn speaker⇒presence behavior | directly locks proven movement bug |
| R68 | fresh Extract tests requiring stats/CSA-attitude/sexual-event/image/CSA-runtime fields | makes obsolete schema appear mandatory |
| R69 | CSA test locking `clothing_projection.compliant` | locks precomputed compliance semantics |
| R70 | `relationship/reducer.js` fresh-path reachability | generic relationship writer is outside minimal fresh commit |
| R71 | fresh Story/Extract compatibility warning/drop machinery once historical adapter is isolated | ghost-domain compatibility belongs only in historical reader |
| R72 | durable scene `goal/focus_thread/beat` semantic keys | minimal durable scene should be structural, not a narrative planner |
| R73 | durable scene focal/last-speaker as narrative authority | derive for UI; do not feed back as future Story authority |
| R74 | `pending_scene_entrances` / `pending_remote_contacts` pre-Story semantic queues | scheduler semantics; no current minimal-runtime need |
| R75 | duplicated Opening time/location projections after one canonical opening context exists | duplicate authority surface with no product benefit |
| R76 | Story `context.game` id/title | runtime identity metadata does not help author the current scene |
| R77 | fresh image tag/action closed taxonomy | media vocabulary should not become gameplay semantic ontology |
| R78 | `selectImage` driven by Extract semantic output | media selection belongs after gameplay state as presentation derivation |
| R79 | test/UI contracts requiring removed generic NPC stats/relationship fields | compatibility must follow the new authority model, not preserve ghost fields |

---

# 7. Important split decisions

## 7.1 CSA strength is not deleted globally

`strength` is classified as `KEEP_NARROW_MECHANIC_NOT_STORY` because current CSA app capability/slot/validation logic uses it. Only its **Story narrative authority** is removed.

## 7.2 Player sexual mechanics are not equated with NPC semantic stats

The current player meter/progress/count has a concrete current UI/mechanical consumer. It may remain narrow state if updated only from direct observable evidence. Generic NPC `sexual_arousal` is a different system and has no equivalent preservation case in the QA evidence.

## 7.3 Character personality is not “relationship state”

Authored character canon, including a character's stable temperament or `csa_style`, remains Story input. Mutable generic relationship/acceptance/resistance state is removed. A character may dislike a rule in personality while still treating an active applicable rule as workplace fact.

## 7.4 Historical residue is not migrated away

Old turn snapshots can keep retired roots for audit/replay. The cut must stop copying those roots into **current active save** and fresh prompts. Historical adapters stay one-way read-only.

## 7.5 Mind Monitor is presentation, not Commit authority

Mind Monitor may continue to be generated from committed Story for player-facing UI. It must not become a source for scene, relationship, CSA, physical, or future-Story truth.

---

# 8. Net target

After the future cut, the runtime should have one obvious boundary:

**Story receives facts and writes meaning. Extract observes Story. Commit writes only narrow structural/mechanical facts. Presentation derives its labels/media/interpretations without feeding them back as gameplay authority.**

This classification is the complete disposition input for the single-cut plan in `04_SINGLE_SEMANTIC_CUT_PLAN.md`.