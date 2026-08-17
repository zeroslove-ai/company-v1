# 02 — DB Save Residue and QA Evidence

- Audit task: `minimal-story-runtime-authority-audit-v1`
- Start SHA: `0bf8a6a9b856b343249ffbba157dbbf090dd82c5`
- Supabase project inspected read-only: `fmcrspgxstsmxxsmkeee`
- QA game inspected read-only: `f31b6c1b-0b27-4a4e-8c9d-7a238360891f`
- Disposable TEST game inspected read-only for reset/default comparison: `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`
- Preserved/manual game `78fb1...`: **not accessed**
- Production: **not accessed**
- No reset, migration, RPC write, turn generation, provider call, deployment, or data mutation was performed.

## 1. Conclusion

The TEST database still structurally requires several semantic roots that the Minimal Story Runtime no longer wants as fresh gameplay authority.

This is not just stale data in an old QA save. `validate_company_save_v1()` currently requires the roots, and create/reset/setup/opening boundaries preserve them. Therefore a source-only Story cleanup would be incomplete: a future authorized semantic cut must change the validator/default/reset contract at the same time, otherwise the removed roots are resurrected on fresh saves.

The read-only QA evidence also proves two deterministic runtime failures:

1. active/applicable CSA is narrated as optional or individually adjudicated on turns 3–5 and again as “implementation procedure still being checked” on turn 7;
2. a movement turn from source NPC A to destination NPC B is committed with A and B both present at the destination because Commit treats local speakers anywhere in the turn as final destination presence.

The second failure is a general temporal-collapse bug, not a one-off character bug.

---

## 2. TEST DB structural inventory

Read-only catalog inspection covered the current public runtime tables and functions.

Relevant tables present:

- `games`
- `game_master`
- `game_save`
- `game_actions`
- `game_turns`
- `image_library`

Observed row counts at audit time:

- `games`: 4
- `game_master`: 4
- `game_save`: 4
- `game_actions`: 35
- `game_turns`: 32
- `image_library`: 102

The exact counts are audit-time evidence only, not a product invariant.

---

## 3. Current live function boundary

### `get_company_context`

Returns the full game/master/save context plus recent turns. This means the DB/API boundary itself does not enforce a narrow Story projection. The application must intentionally select the minimal Story inputs; passing a full save downstream and filtering ad hoc is the current contamination risk.

### `commit_company_turn`

Remains the sole durable turn writer. It validates the proposed next save with `validate_company_save_v1`, writes active turn history including pre/post save snapshots, and updates `game_save`.

Keep the atomic writer. Simplify what it is allowed/required to persist.

### `reset_company_game`

Resets from `game_master.initial_save`. It strips several older roots (`story_summary_overall`, `story_summary_recent`, `npc_emotion`, `npc_work_state`, `event_ledger`) and scene mirrors, but it does **not** remove the current semantic roots audited below.

Therefore `game_master.initial_save` is a fresh-state resurrection boundary, not historical-only data.

### `reserve_company_player_setup` / `commit_company_opening`

These functions preserve the initial semantic save shape while applying player/opening/world/scene/clothing bootstrap state. They do not narrow away the retired semantic roots.

### `create_company_game`

Validates initial save data with the same save validator. As long as that validator requires the retired roots, a genuinely minimal fresh game cannot be created.

---

## 4. `validate_company_save_v1()` — current required roots

The current function requires all of the following roots:

- `save_schema_version`
- `edition`
- `turn_state`
- `player`
- `scene`
- `player_scene_state`
- `player_sexual_state`
- `world_state`
- `npc_stats`
- `npc_relationship_state`
- `npc_scene_state`
- `csa_active`
- `csa_rules`
- `csa_attitudes`
- `csa_runtime_state`
- `csa_aftereffect_state`
- `last_image_id`
- `last_choices`
- `last_choice_meta`

For Minimal Story Runtime, the validator itself is therefore still encoding old semantic authority.

### Required roots to remove from the fresh-save contract

- `npc_stats`
- `npc_relationship_state`
- `csa_attitudes`
- `csa_runtime_state`
- `csa_aftereffect_state`
- `last_image_id` as gameplay state

`last_image_id` may still exist as presentation/cache data elsewhere, but it should not be a required gameplay save root.

### Roots that remain narrow mechanics

- `scene` after reducing it to structural current scene facts;
- `player_scene_state`;
- `npc_scene_state`;
- `player_sexual_state` only for proven product mechanics/UI;
- `world_state` clock;
- `csa_active` and `csa_rules` as rule-definition/lifecycle state;
- choices/turn state as transaction/UI mechanics.

---

## 5. Fresh reset/default residue comparison

Both authorized TEST games were inspected read-only at `game_master.initial_save` and current `game_save.data`.

| Root | QA initial | QA current | disposable initial | disposable current | Result |
|---|---:|---:|---:|---:|---|
| `npc_stats` | yes | yes | yes | yes | fresh default residue |
| `npc_relationship_state` | yes | yes | yes | yes | fresh default residue |
| `csa_attitudes` | yes | yes | yes | yes | fresh default residue |
| `csa_runtime_state` | yes | yes | yes | yes | fresh default residue |
| `csa_aftereffect_state` | yes | yes | yes | yes | fresh default residue |
| `last_image_id` | yes | yes | yes | yes | required presentation residue |
| `last_choices` | yes | yes | yes | yes | narrow turn/UI mechanic |
| `last_choice_meta` | yes | yes | yes | yes | narrow turn/UI mechanic |
| `npc_scene_state` | yes | yes | yes | yes | narrow physical/scene mechanic |
| `player_scene_state` | yes | yes | yes | yes | narrow physical/scene mechanic |
| `player_sexual_state` | yes | yes | yes | yes | narrow current UI/mechanic |
| `scene` | yes | yes | not in original initial snapshot | yes | canonicalized by current reset/bootstrap path |
| `sexual_event_ledger` | no | yes | no | no | QA-derived semantic/event residue, not a required initial root |

The disposable game had `committed_turn=0` and current `save_revision=1052`; it was **not reset or played** during this audit. Its current shape was used only as evidence that the current reset/bootstrap system can canonicalize scene state while retaining the old semantic roots.

---

## 6. Edition hydration is a second resurrection source

Source audit of `src/engine/gameplay-state.js` found `HYDRATION_SOURCES` for:

- `npc_stats` ← character `initial_stats`;
- `npc_relationship_state` ← `initial_relationship`;
- `csa_attitudes` ← `initial_csa_attitudes`;
- `npc_scene_state` ← `initial_scene_state`.

`hydrateGameplayState()` also fills generic NPC values such as affinity/resistance/CSA acceptance/sexual arousal and maps legacy affection into affinity.

The current `content/characters.json` still contains legacy `initial_stats` and `initial_relationship` data for the five heroines. Thus even if DB defaults were cleaned without changing source hydration/content, fresh turns could recreate the removed semantic state.

This must be part of the same future cut.

---

## 7. QA current semantic residue snapshot

At audit time:

- `committed_turn = 7`
- `save_revision = 9`
- active rules: `csa_1`, `csa_1_1`
- `csa_runtime_state = {}`
- `csa_aftereffect_state = {}`
- each heroine's `csa_attitudes = {}`

Generic heroine stats remained populated:

| NPC | affinity | affection | resistance | csa_acceptance | sexual_arousal |
|---|---:|---:|---:|---:|---:|
| heroine1 | 0 | 0 | 45 | 50 | 0 |
| heroine2 | 0 | 0 | 60 | 35 | 0 |
| heroine3 | 0 | 0 | 35 | 65 | 0 |
| heroine4 | 0 | 0 | 65 | 30 | 0 |
| heroine5 | 0 | 0 | 30 | 70 | 0 |

The generic relationship objects were also still present with static bootstrap summaries/boundaries.

These values are not harmless because `npc_stats` is currently sent to Story for active actors. `csa_attitudes` is also sent, although empty in this QA run.

---

## 8. QA turn-by-turn authority evidence

The table below summarizes every active committed QA turn. It uses committed rows only; no provider rerun was performed.

| Turn | Player action / scenario | Story authority result | Extract/Commit result | Minimal-runtime finding |
|---:|---|---|---|---|
| 1 | two company rules officially activated | institutional rule change is introduced; heroine4 remains clothed at the activation moment | scene stays meeting room + heroine4; `npc_stats` changes because hydration expands defaults; CSA eval/runtime arrays both empty | activation moment itself does not retroactively prove a physical transition; hydration residue appears immediately |
| 2 | asks heroine4 about prior work context | ordinary meeting dialogue | no generic semantic maps change; CSA eval/runtime arrays empty | semantic roots remain static baggage |
| 3 | asks why heroine4 has not undressed | heroine4 says rule was just announced and she is still checking how to apply it | no CSA semantic updates; scene unchanged | **BUG:** active applicable common-sense rule treated as pending procedure |
| 4 | makes a sexual request under the newly active rule | heroine4 is uncomfortable and says “업무 규정은 업무 규정일 뿐” and she does not yet know how to accept the request | no CSA semantic updates; scene unchanged | **BUG:** discomfort is valid, but it is used to suspend the applicable rule rather than coexist with it |
| 5 | challenges whether she will violate the rule | heroine4 says she is still checking application and “이 규정을 어떻게 이행할지는… 제가 판단할 문제” | no CSA semantic updates; one dropped-evidence warning | **Strongest BUG proof:** individual judgment is allowed to override an active applicable institutional fact |
| 6 | `서원희를 찾아간다` | Story correctly shows source meeting room/heroine4 → player leaves → destination office/heroine1 | Commit stores destination office but final presence becomes `[heroine4, heroine1]`; Mind Monitor includes both | **BUG:** whole-turn speaker set collapses chronology and teleports source NPC A to destination B |
| 7 | tells heroine1 that the new rule is announced but people have not undressed | heroine1 says all teams apply but implementation procedure is still being checked/adjusted by department | wrong `[heroine4, heroine1]` presence persists; Mind Monitor includes both | CSA optionality drift continues; turn 6 scene corruption contaminates following context |

### Generic semantic-map delta across the seven turns

Read-only comparison of every committed pre/post save shows:

- turn 1: `npc_stats_changed=true` only because hydration expanded the defaults;
- turns 2–7: `npc_stats_changed=false`;
- turns 1–7: `npc_relationship_state_changed=false`;
- turns 1–7: `csa_attitudes_changed=false`;
- turns 1–7: `csa_runtime_state_changed=false`;
- turns 1–7: `csa_aftereffect_state_changed=false`;
- turns 1–7: `csa_trigger_evaluations` count = 0;
- turns 1–7: `csa_runtime_updates` count = 0.

This is the key empirical point: these semantic systems are live in shape and code, but they add no useful authoritative state in this fresh QA trace. Their mere existence still biases prompts, validators, UI contracts, and reducers.

---

## 9. CSA drift reconstruction

Current active rule `csa_1` is a world-scoped company rule for female employees during work. Its human-readable content says female employees work nude. It was activated on day 1 at minute 667. The active save also contains a clothing execution preset, but the Minimal Story Runtime canon explicitly rejects using a finite execution engine as narrative authority.

The intended chain is:

1. CSA app/transaction commits the rule definition and activation fact;
2. Story receives the active rule's human content + scope + effective/trigger facts;
3. if the rule applies in the current scene, Story treats compliance as an ordinary workplace premise and authors the natural observable HOW;
4. NPC embarrassment/discomfort/disagreement may be narrated separately;
5. Extract observes only concrete Story outcomes (for example clothing state actually shown), not “acceptance” or “resistance” semantics;
6. Commit persists the narrow observed structural/physical fact.

The current chain instead exposes `npc_stats.csa_acceptance`/`resistance` to Story and uses prompt wording that demotes rules to “context”. Even though this audit does not claim the model deterministically read those numbers as a veto, the combination is an unnecessary competing authority and must be removed.

### Strength

CSA `strength` is still used by the product/app capability layer. It can remain a narrow non-Story mechanic. It should not be sent to Story as a narrative “authority strength” cue.

### `csa_attitudes`

The QA values are all empty objects and never change. The fresh Story projection nevertheless includes them for active actors. There is no current evidence that this state provides narrative value. Remove it from the fresh save/runtime rather than trying to calibrate it.

---

## 10. Movement temporal-collapse proof

Turn 6 is the canonical regression trace.

### Actual Story chronology

1. `[SCENE]` source: `brand_strategy_meeting_room`;
2. heroine4 speaks in the source room;
3. Story explicitly narrates the player leaving the meeting room;
4. Story moves to `brand_strategy_office`;
5. heroine1 is described at the destination;
6. heroine1 speaks at the destination.

The Story itself is correct.

### Extract result

The Extract scene observation still reports the old meeting-room location, no final presence snapshot, and no entry/exit evidence. This is weak end-state observation, but it does not itself require teleporting heroine4.

### Commit result

The turn has an authoritative navigation destination, so `scene-reducer` correctly changes the final location to `brand_strategy_office`. It then adds registered local dialogue speakers from the **entire Story** into final presence. Because heroine4 spoke before departure and heroine1 spoke after arrival, both are added to the destination.

Final committed state:

- location: `brand_strategy_office`
- present: `[heroine4, heroine1]`

This violates temporal order.

### Root cause symbol

`src/engine/runtime-core/scene-reducer.js` contains the fallback that treats `explicitLocalSpeakerIds` as final presence even when those speakers occurred before an authoritative movement boundary.

This behavior is also locked by current scene runtime tests, including the contract that an authoritative destination can accept a registered local speaker when final snapshot is unknown.

### Correct general rule

A speaker proves presence **at the time of that local dialogue**, not at every later location in the same turn.

For a movement turn, final destination presence must be derived from ordered, destination-phase evidence or a genuinely complete final snapshot. The implementation must delete the whole-turn speaker-union fallback; it must not add an exception for heroine4, turn 6, or this exact movement string.

---

## 11. Honorific finding: explicitly not a bug

Turn 6 heroine1 uses an informal line ending. CURRENT_TASK explicitly states that the honorific issue is not a target bug. No honorific regression, prompt patch, or Golden Play criterion should be created from this trace.

This audit deliberately treats it as **NOT BUG / OUT OF SCOPE**.

---

## 12. DB change direction for the future single cut — plan only

No DB mutation is authorized by this task. The next implementation task should, in one coordinated TEST migration/code cut:

1. remove retired semantic roots from `validate_company_save_v1()` requirements;
2. stop `create_company_game`, reset, setup, and opening from preserving/reseeding them;
3. clean those roots from `game_master.initial_save` and current `game_save.data` only under the exact future task authorization;
4. leave historical `game_turns.pre_save/post_save` snapshots untouched and readable;
5. keep historical Extract adapters/readers isolated from fresh write paths;
6. reduce canonical `scene` durable fields to structural current-scene facts and derive presentation-only focal/last-speaker values rather than treating them as narrative authority;
7. keep physical/clothing/player-sexual narrow mechanics only where a concrete current product consumer exists.

Production rollout/migration is not part of this audit and must remain separately authorized.

---

## 13. Audit acceptance for this document

This document closes CURRENT_TASK sections D/E/F/G/H with read-only evidence:

- DB validator/reset resurrection boundary proven;
- fresh semantic roots quantified across two authorized TEST games;
- all seven committed QA turns reviewed;
- CSA optionality drift demonstrated from committed Story, not a regenerated guess;
- movement A→B temporal-collapse cause proven at Story/Extract/Commit boundaries;
- honorific issue explicitly excluded;
- no live/provider/reset/migration/deploy side effect occurred.
