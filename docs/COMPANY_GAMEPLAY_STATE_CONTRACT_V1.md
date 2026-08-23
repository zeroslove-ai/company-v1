# Company gameplay state contract v1

## Status and compatibility

This contract fixes the Company gameplay-state boundary for future implementation. It does not activate gameplay, alter an API endpoint, change a prompt, create a database migration, or apply data. Persisted saves remain `edition: "company-v1"` and `save_schema_version: 1`; the database currently accepts only version 1. The pure `migrateCompanySave()` function makes v1 saves compatible with these optional state additions without changing their version. A version-incrementing database migration requires its own PR and authorization.

Missing data means unavailable data, not a deletion request and not a silent numeric zero. The explicit v1 migration defaults are the only exception: it adds absent `world_state.game_time` as Day 1 09:00 and absent `player_sexual_state` as the documented zero state. It preserves every unknown save field and never mutates its input.

## Global CSA rules and per-NPC attitudes

CSA rules are always global game rules. The authoritative save fields are `csa_active`, `csa_rules`, `csa_runtime_state`, and `csa_aftereffect_state`. Personal suggestions, player-only rules, `active_suggestions`, and per-NPC active CSA lists are forbidden.

NPC variation exists only under `csa_attitudes[npc_id][csa_id]`:

```json
{
  "familiarity": 0,
  "resistance": 0,
  "acceptance": 0,
  "discomfort": 0,
  "conscious_violation": false,
  "last_changed_turn": 0
}
```

`familiarity`, `resistance`, `acceptance`, and `discomfort` are integers in `0..100`; `last_changed_turn` is a non-negative integer. Missing attitude fields remain missing until an allowed guarded delta supplies them—readers must not silently treat them as zero.

Each global rule has three independent runtime axes in `csa_runtime_state[csa_id]`:

```json
{
  "lifecycle": "active|temporarily_interrupted|suspended|completed|deactivated",
  "applicability": "applicable|not_applicable|unknown",
  "execution_state": "not_started|proposed|executed|refused|interrupted"
}
```

`lifecycle` owns whether the global rule continues to exist, `applicability` records whether its scope fits this turn, and `execution_state` records only the current-turn execution result. `temporarily_interrupted` preserves the rule and its history; it is not deletion. An NPC may refuse an applicable rule, but a rule never blocks free player input. Story/Extract may propose evidence and a delta; guarded Commit alone validates permitted transitions.

## Time and player sexual state

Canonical time is `world_state.game_time`:

```json
{ "day": 1, "minute_of_day": 540 }
```

`day >= 1`; `minute_of_day` is an integer in `0..1439`. Every committed turn records `time_before`, `elapsed_minutes`, and `time_after`. Extract only proposes `elapsed_minutes`: normal turns allow `1..30`; explicit `evidence.time_advance === true` allows `1..480`; absent, non-integer, or out-of-range proposals become 3 minutes. Commit calculates rollover with `advanceGameTime()`. Legacy `world_state.time_block` is display-only and never authoritative.

```json
{
  "arousal": 0,
  "ejaculation_progress": 0,
  "ejaculation_count": 0,
  "updated_turn": 0
}
```

`arousal` and `ejaculation_progress` are clamped to `0..100`; `ejaculation_count` is a non-negative integer. Extract supplies deltas only. `ejaculation_completed: true` requires explicit Story evidence (`sexual_resolution: true`) at Commit. Without it, Commit ignores only that completion flag, preserves the remaining valid deltas, and records `unauthorized_ejaculation_completion_ignored`; it does not block the entire turn. Completion increments the count and resets both progress and arousal to 0. An absent sexual delta leaves state unchanged.

## Extract, merge, and turn changes

The extended Extract envelope contains `state_delta`, `outcome`, `evidence`, `turn_summary`, `mind_monitor`, `choices`, `dialogue_lines`, `npcs_present`, independent `action_target_id`, `focal_character_id`, `last_speaker_id`, `image_character_id`, `elapsed_minutes`, `turn_changes`, and `warnings`. Identity fields are strings or `null`; no focal/last-speaker/narrator inference is allowed. Dialogue entries preserve source order and use `speaker_id`, `speaker_name`, `direction`, `text`, and `order`.

Fresh Story parsing is authoritative for verbatim `player_inner_thought`, dialogue identity/order, and observed literal CHOICE blocks. Extract V2 never generates or falls back to choices. `canonical_choices` is available only when observed Story choices are exactly four, non-empty, and distinct; otherwise the UI keeps free input available. Footer incompleteness is a warning, not a Story hard failure.

`deriveTurnChanges(beforeSave, afterSave)` runs only after a guarded merge and derives display summaries from actual persisted before/after values. LLM text is never a direct source of turn-change display data. Before Commit changes are provisional; after Commit they are authoritative.

## Owner override 2026-08-23 — CSA and first-arrival state

Issue #68 comment `5384780073` supersedes conflicting assumptions for future
owner acceptance:

- New games begin at the player's first arrival / first day at the company;
  selected rank does not imply prior tenure or relationships.
- CSA APPLY/CHANGE/REMOVE is a chronological, streamed enactment turn with a
  scoped in-world institutional mechanism. It must not silently rewrite the
  past or mutate durable state in zero turns. This remains a later scoped
  implementation task.
- CSA rule compliance is a world/policy fact and must remain separate from
  affection, comfort, consent, trust, desire, romance, or unrelated obedience.
- Exact player action dimensions and exact canonical movement destination are
  preserved through Story/Observer/Commit; source-location actors do not leak
  into the destination without destination evidence.

## Mind Monitor and hydration

The canonical Mind Monitor shape is per NPC:

```json
{ "npc-id": { "surface": "", "subconscious": "" } }
```

Only `surface` and `subconscious` display. `surface` is a 150–300 Korean-character natural first-person NPC monologue; `subconscious` is a 180–350 Korean-character natural first-person NPC monologue. Neither uses quotation marks, status labels such as `calm` or `uncertain`, CSA/system meta-explanation, or keyword lists. A changed common-sense rule is expressed only as the NPC's natural self-justification.

`body`, `physical`, `body_reaction`, `physical_action`, and Korean body-reaction keys are removed with warnings. The normalizer never mutates its input, creates no absent NPC entry, and does not assume focal character equals last speaker. A legacy plain string is retained separately as `legacy_text` with a warning so it is not lost, but is not fabricated into a canonical NPC entry.

`hydrateGameplayState(save, master)` first performs the pure v1 migration, then fills initial NPC map entries only for master characters absent from the save. Existing NPC data is never overwritten. The five heroine characters are now registered in `content/characters.json` and `fixtures/gameplay-state-v1/five-character-master-v1.json` (`heroine1`–`heroine5`); see `docs/COMPANY_HEROINES_V1.md` for the full narrative canon, role differentiation, and relationship design behind each one.

The five-character master contract reserves these fields for every character: `character_id`, `name`, `age`, `gender`, `department`, `position`, `role_title`, `company_tenure`, `initial_relationship`, `initial_stats`, `initial_csa_attitudes`, `voice_id`, `storage_bucket`, `storage_prefix`, `primary_image_path`, and `adult_image_prefix`. Runtime narrative content is compacted into a single `prompt_card` field (`identity`, `appearance`, `personality`, `speech`, `addressing`, `distinctive_traits`, `csa_style`; serialized ≤600 characters) so a Story/Extract request only ever carries the characters actually active in the current turn. The full, unabridged setting — detailed appearance, personality, habits, work profile, relationship hooks, per-teammate address forms, dialogue examples, team relationships, and the youngest-line pairing — lives only in `docs/COMPANY_HEROINES_V1.md`, which is documentation-only and is never imported by `src/**` or `content/**`. A character ID is a permanent stable key; name and position changes never replace it. Storage prefixes are keyed by that ID, one primary image belongs to the character, and adult images have their own prefix. All five character IDs are resolved with `mapping_status: "resolved"`:

| character_id | storage_bucket | storage_prefix | primary_image_path | adult_image_prefix |
| --- | --- | --- | --- | --- |
| `heroine1` | `Image` | `Heroine1` | `Heroine1/one_main.jpg` | `Heroine1/adult/` |
| `heroine2` | `Image` | `Heroine2` | `Heroine2/minami_main.jpg` | `Heroine2/adult/` |
| `heroine3` | `Image` | `Heroine3` | `Heroine3/jena_main.jpg` | `Heroine3/adult/` |
| `heroine4` | `Image` | `Heroine4` | `Heroine4/live_main.jpg` | `Heroine4/adult/` |
| `heroine5` | `Image` | `Heroine5` | `Heroine5/may_main.jpg` | `Heroine5/adult/` |

This PR records those provided Storage binding values only; it does not query, upload, move, or modify Storage. `voice_id` is `null` for all five and is intentionally out of scope here.

`initial_csa_attitudes` is `{}` for all five characters. `content/csa_presets.json` has no registered rule items yet, so there is no real global CSA ID to key a per-rule attitude against — inventing one would fabricate state the guarded merge could never validate. Each character's narrative sexual/social-openness disposition instead lives in the non-persisted `csa_response_profile` field, which Story reads as canon but which is never written into `csa_attitudes[npc_id][csa_id]`. Once concrete global CSA IDs are approved, a follow-up PR converts the relevant parts of `csa_response_profile` into real `initial_csa_attitudes[csa_id]` entries.
