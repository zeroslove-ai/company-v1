# 01 — Story Prompt Authority Inventory

- Audit task: `minimal-story-runtime-authority-audit-v1`
- Canon: `docs/COMPANY_V1_MINIMAL_STORY_RUNTIME_RESET_CANON_2026-08-16.md`
- Start branch: `company/scene-location-presence-v1`
- Start SHA: `0bf8a6a9b856b343249ffbba157dbbf090dd82c5`
- Scope: docs-only static/source audit. No gameplay/runtime/test/config behavior was changed.

## 1. Conclusion

The current fresh-turn path is not yet a Minimal Story Runtime.

Three distinct authority layers still leak into Story generation:

1. **persisted semantic residue is projected into Story**: `npc_stats` and `csa_attitudes` are copied through `active_npc_state` for current projected actors;
2. **pre-Story code judges narrative meaning**: player dialogue intent taxonomies, entrant/remote cast inference, fuzzy target resolution, nearby-NPC candidate selection, and keyword-gated body/background projection run before Story;
3. **CSA wording is internally contradictory**: the payload carries active institutional rules, but the system prompt repeatedly calls them “context” and explicitly separates them from enactment without stating the new canonical positive premise: **when an active rule applies, the affected employee naturally follows it as ordinary workplace common sense; discomfort/refusal/judgment are reactions, not a veto on applicability**.

This combination exactly permits the observed QA drift where an active rule is repeatedly treated as pending, optional, or individually adjudicated.

The fix should therefore be one semantic cut, not another rule-specific prompt patch.

---

## 2. Fresh Opening input inventory

Primary sources:

- `src/engine/opening-prompt.js`
- `src/api/turn-routes.js`
- `src/engine/player-setup.js`

Current Opening user payload is structurally much smaller than ordinary Story and is not the main contamination source. Its effective inputs are:

| Current Opening input | Provenance | Story-visible? | Disposition direction |
|---|---|---:|---|
| `edition` | edition content | yes | keep as mechanical/version identity, not narrative authority |
| player opening projection | validated player setup + catalog canon | yes | keep stable player canon; do not add semantic save roots |
| `opening_plan.weekday` | deterministic opening plan | yes | keep opening-only |
| `opening_plan.minute_of_day` | deterministic opening plan | yes | keep opening-only |
| `opening_plan.location_name` | canonical map/opening location | yes | keep opening-only |
| `opening_plan.work_hook_label` | deterministic opening seed | yes | keep opening-only |
| `opening_plan.scene_goal` | deterministic opening seed | yes | keep opening-only; do not persist as generic Story semantic authority |
| `turn_context.day` | canonical clock | yes | keep, but collapse duplicate time projections |
| `turn_context.minute_of_day` | canonical clock | yes | keep, but collapse duplicate time projections |
| `turn_context.location_id/name` | canonical opening location | yes | keep, but collapse duplicate location projections |
| cross-team/narrative setup note | opening plan/content | yes | keep opening-only |
| active character canon | selected opening actors + edition canon | yes | keep character canon |
| `allowed_speaker_ids` | registered/output contract | yes | keep as parser/output validation mechanic, not world meaning |

### Opening finding

Opening does **not** currently inject `npc_stats`, `npc_relationship_state`, `csa_attitudes`, `csa_runtime_state`, or `csa_aftereffect_state` as narrative inputs. Do not “fix” Opening by importing ordinary-turn runtime state. The one-cut implementation should only de-duplicate its canonical time/location representation and keep its bootstrap role narrow.

---

## 3. Fresh ordinary Story payload — exact top-level inventory

Primary source: `src/engine/story-prompt.js::buildStoryPrompt`.

Current top-level payload:

1. `edition`
2. `turn_trigger`
3. `registered_identities`
4. `scene_actors`
5. `possible_entrants`
6. `remote_contacts`
7. `reference_characters`
8. `player_dialogue_policy`
9. `target_authority.explicit_player_target_ids`
10. `world_rules`
11. `registered_locations`
12. `context`
13. `player_action` when non-empty
14. `player_private_origin` when present
15. `feedback_text` on feedback revision
16. `expected_turn`

`context` is built by `buildStoryContextProjection()` and currently contains:

- game id/title;
- current day/minute;
- player projection;
- canonical scene projection;
- `active_npc_state` inherited from `buildSceneContextCore()`;
- workplace projection;
- latest six raw committed turns;
- older `turn_summary` memory.

The current shape is substantially broader than the Minimal Story Runtime target.

---

## 4. Exact semantic-root visibility into Story

Primary sources:

- `src/engine/gameplay-state.js::buildSceneContextCore`
- `src/engine/story-prompt.js::buildStoryContextProjection`
- `src/engine/csa/story-projection.js::buildStoryWorldProjection`

`ACTIVE_NPC_MAPS` currently equals:

- `npc_stats`
- `npc_scene_state`
- `csa_attitudes`

For the active projection IDs, full entries from these maps are copied into `context.active_npc_state`.

| Save/domain root | Fresh Story direct input? | Proven path / reason |
|---|---:|---|
| `npc_stats` | **YES** | `buildSceneContextCore` → `active_npc_state.npc_stats` → Story `context` |
| `csa_attitudes` | **YES** | `buildSceneContextCore` → `active_npc_state.csa_attitudes` → Story `context` |
| `npc_scene_state` | **YES, narrow state mixed with the maps above** | current physical/position/clothing continuity for projected actors |
| `npc_relationship_state` | **NO direct Story path found** | not in `ACTIVE_NPC_MAPS`; current Story continuity instead uses recent raw turns + older summaries |
| `csa_runtime_state` | **NO direct Story path** | `buildSceneContextCore` can expose it inside `global_csa`, but `buildStoryContextProjection` explicitly deletes `global_csa` |
| `csa_aftereffect_state` | **NO direct Story path found** | no fresh Story projection found |
| `sexual_event_ledger` | **NO direct Story path found** | consumed later by display/media logic, not Story |
| `player_sexual_state` | not as a generic root | player physical/sexual prompt projection is separately gated; numeric mechanics should stay out of Story |
| media/image selection state | **NO direct Story input** | current image authority is post-Story/Extract/display |

### Important distinction

A root can be absent from Story and still be a live semantic contaminant elsewhere. `npc_relationship_state`, `csa_runtime_state`, `csa_aftereffect_state`, and `sexual_event_ledger` therefore remain part of the end-to-end removal audit even though they are not current direct Story inputs.

---

## 5. `scene_actors` / character canon

`buildStoryCharacterProjection()` currently expands present heroines/general NPCs into character prompt canon. This is legitimate Story context only when it remains **character canon**: identity, personality, speech/addressing style, role, distinctive traits, and similar authored character facts.

The problem is not character canon itself. The problem is that the same actor IDs are then used to select generic state maps (`npc_stats`, `csa_attitudes`) and to drive other pre-Story semantic machinery.

Target rule:

> Character canon stays. Generic relationship/acceptance/resistance/stat state does not ride along merely because the character is active.

---

## 6. Workplace / possible entrant authority

Primary source: `src/engine/workplace-context.js` and `buildStoryCharacterProjection()`.

The current Story receives:

- current location metadata including floor, department, type, visibility, scene tags, adjacency;
- `eligible_nearby_npcs`;
- `possible_entrants`, composed from explicit/pending entrant IDs plus nearby candidates;
- all `registered_locations`;
- all `registered_identities`.

This is broader than the new canon requires. Most of this is engine/map/search material, not Story meaning.

### Minimal target

Story should normally need only:

- current canonical location identity/name;
- current canonical present actors;
- exact compact canon for an explicitly referenced non-present person when that reference is needed;
- exact authoritative destination when the player is structurally navigating;
- no generic nearby candidate list;
- no permission-like entrant candidate list;
- no entire map catalog;
- no all-NPC directory as world context.

The parser/validator may keep the full registered ID universe outside the narrative payload.

---

## 7. Pre-Story semantic judgment inventory

Primary source: `src/engine/scene-cast.js`.

The file currently declares that the engine decides who “exists” and “can speak” before Story. That is a direct residue of the older authority model.

### 7.1 Player dialogue intent taxonomy

Fresh caller: `src/api/turn-routes.js` imports and uses `buildSceneCastContract`, `resolvePlayerNavigationIntent`, and `validatePlayerDialogueAgainstPolicy`.

The current pre-Story layer contains:

- `HIGH_IMPACT_INTENTS` including instruction, promise, agreement, confession, threat, movement decision, investigation decision, relationship change, and authority assertion;
- `INTENT_PATTERNS` regular-expression classification;
- `classifyDialogueIntents()`;
- `resolvePlayerDialoguePolicy()`;
- `validatePlayerDialogueAgainstPolicy()`;
- semantic length/intent/target checks derived from raw natural-language input.

These functions do not merely validate structure. They decide **what the player's text means** before Story. Under Minimal Story Runtime this is the wrong layer.

Disposition: remove the semantic taxonomy from the fresh path. Keep only strict structural safety/identity/output validation that does not reinterpret the player's meaning.

### 7.2 Navigation intent

`resolvePlayerNavigationIntent()` currently combines:

- movement regexes;
- subject heuristics;
- exact location names/aliases;
- character targeting;
- `allowUniqueKoreanGivenName: true` fuzzy identity resolution;
- saved/default NPC location inference.

A narrow navigation resolver is still needed because location is structural durable state. But it must be reduced to **exact, typed, deterministic identity/location resolution**. The fuzzy given-name and broader semantic intent classification are not required to keep structural navigation.

### 7.3 Entrant and remote inference

Current fresh path also precomputes:

- `entering_npc_ids` from call/action regexes and pending queues;
- `remote_npc_ids` from remote-action regexes and pending queues.

Those lists then become Story cast authority. This is pre-Story actor selection and should be removed from the fresh semantic path. Story may naturally narrate an explicitly requested call/contact/arrival; Extract observes what actually happened. Registered-ID validation remains outside narrative meaning.

### 7.4 Keyword-gated player body/background projection

`src/engine/player-setup.js::buildPlayerPromptProjection` uses keyword/evidence gates to decide whether body measurements, sexual body fields, and background are sent to Story.

This is another semantic classifier. Stable player canon should be selected by product design, not by a growing regex interpretation of the current input. Narrow physical facts needed for continuity may be included directly; numeric mechanics should remain non-Story state.

---

## 8. CSA Story projection audit

Primary source: `src/engine/csa/story-projection.js`.

Current `world_rules[]` carries more than the human rule:

- `id`
- `content`
- authority/strength-derived value
- `phase`
- `institutional_form`
- `mode`
- subject scope
- counterparty scope
- trigger
- known scene actor IDs
- applicable scene actor IDs
- optional clothing projection with actor current state and precomputed `compliant`
- created/updated/activated timestamps

### What Story actually needs

For a minimal rule-aware Story, the retained rule projection should be limited to:

- human-readable rule content;
- human scope: subject and counterparty when required;
- effective/activation fact;
- only the trigger condition necessary to know whether the rule applies now.

Current actual physical/clothing state is a separate fact and must not be encoded as a `compliant` semantic conclusion.

### What should not bias Story

Do not expose as narrative authority:

- numeric/ordinal strength or authority tier;
- institutional form/mode labels whose only purpose is engine taxonomy;
- precomputed `known_scene_actor_ids` / `applicable_scene_actor_ids`;
- `clothing_projection.compliant`;
- finite execution metadata, required-action grammar, enactment IDs, direct-coverage contracts.

Strength may remain a CSA app/capability mechanic outside Story.

---

## 9. The decisive contradictory wording

Current `DURABLE_STORY_RULES` says, in substance:

- institutional rules provide workplace context and human-readable constraints;
- rules are not proof that a physical outcome occurred;
- NPC attitude, emotion, discomfort, and personal judgment remain free as reaction.

The second and third clauses are useful. The first becomes wrong when it is read as “optional context” rather than an active common-sense rule.

The new canon needs one positive premise, stated once and without an execution grammar:

> An active rule that applies to an actor is an ordinary fact of this workplace. The actor naturally behaves in accordance with it unless the Story contains a concrete exception permitted by the rule itself. Discomfort, dislike, embarrassment, protest, or personal judgment may coexist with compliance; those reactions do not turn an applicable active rule into an optional rule.

This does **not** mean:

- the engine precomputes a physical action;
- every rule produces an ACTING token;
- a rule sentence itself proves a physical state transition;
- consent/emotion/relationship are inferred by the engine;
- trigger conditions are ignored.

It means Story, as the narrative authority, receives the correct world premise and authors the natural HOW.

---

## 10. History and continuity inputs

The current Story history boundary is already directionally correct:

- latest six committed turns: raw player action + raw Story + parsed blocks + literal choices;
- older turns: committed `turn_summary` only.

This is the preferred narrative continuity source. It is specifically why a parallel generic relationship state is unnecessary as Story authority.

Keep this boundary, with two constraints:

1. do not reintroduce `npc_relationship_state` to “help” continuity;
2. summaries are compressed memory, not a semantic taxonomy or a replacement for recent raw Story.

---

## 11. Target Minimal Story input shape

Not a wire-format commitment, but the next implementation should converge on the following authority set:

### Narrative inputs

- current raw player input / feedback revision text;
- current canonical time;
- current canonical location;
- current canonical present actors;
- current actor character canon;
- stable player canon;
- confirmed narrow physical/clothing facts needed for continuity;
- active CSA rules as **content + human scope + effective/trigger facts only**;
- exact authoritative navigation destination when applicable;
- recent raw Story history;
- older committed summaries.

### Mechanics that may exist but must not be Story meaning

- full ID/location registries;
- action/turn IDs;
- save schema version;
- CSA capability/strength/slot rules;
- structured transaction validation;
- choice validation;
- player sexual numeric meters;
- image/media selection;
- atomic turn state.

### Inputs to delete from Story

- generic NPC stats;
- generic relationship state;
- CSA attitudes/runtime/aftereffects;
- nearby/possible entrant candidate systems;
- semantic dialogue intent taxonomy;
- fuzzy actor selection;
- precomputed rule compliance/applicability labels;
- semantic scene goal/focus/focal/last-speaker authority;
- media/image semantics.

---

## 12. Audit acceptance for this document

This inventory establishes the source-side provenance required by CURRENT_TASK sections B/C/F:

- exact Opening and ordinary Story payload surfaces identified;
- direct Story visibility of legacy semantic roots separated from mere DB existence;
- all major pre-Story semantic judgment paths identified with fresh callers;
- CSA projection narrowed conceptually without implementing it;
- the prompt contradiction behind “active rule as optional procedure” is isolated;
- no symptom-specific patch is proposed.
