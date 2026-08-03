# Phase 0.5 gameplay contract

## Adopted decisions

Phase 0.5 freezes the following gameplay decisions: 2C free sandbox with light long-term progress; 3C2 canonical compilation with one in-app confirmation; 4C four active CSA slots with free replacement; 5C deterministic conflict precedence; 6C immediate current-normalization with reinterpreted memories; 7C norm removal with event consequences retained; 8C scene-state progression; 9C soft availability with at most three speaking-focus NPCs; 10C recent summary plus event ledger; 11C lightweight character behavior core; 12C independent persistence axes; 13C probability only for extreme bold actions; 14C mandatory exact-action scope; 15C lightweight work hooks; and 16C simple player setup with free input and automatic completion.

## Player freedom and canonical CSA compilation

Players may use presets or write free-form CSA proposals. Each proposal is compiled to one canonical contract and shown once for confirmation without consuming a game turn. The contract names its actor, target, trigger, duration, scope, `required_action`, `execution_mode`, and strength. No repair model or repeated interpretation call is permitted.

At most four CSA rules are active. Replacing or deactivating an active rule is free. Activation applies current social normality immediately; past memories are reinterpreted but never deleted. Deactivation ends the normative rule while completed events, emotions, relationships, and explicit aftereffects remain. Aftereffects must be declared by the individual CSA contract.

## Conflict and execution rules

Applicable rules are ordered by: (1) actor/target/trigger applicability, (2) more specific scope, (3) explicit override, (4) strength, then (5) most recent rule. A conflict that cannot be resolved deterministically is surfaced as an application conflict; Story must not invent both outcomes.

`mandatory` requires exactly the compiled `required_action` when its scope applies. It does not automatically authorize additional action, emotion, dialogue, consent, intimacy, or follow-up behavior. `normative` changes the current social expectation but preserves the NPC's ability to respond, negotiate, or refuse with contextual consequences. Rule recognition is separate from whether a rule is accepted or liked.

## State model

### Relationship: multi-axis

```json
{
  "closeness": "stranger|acquaintance|familiar|trusted|intimate",
  "romance_status": "none|interest|mutual_interest|dating|ended",
  "current_boundary": "open|cautious|refusing|hostile",
  "milestones": {
    "first_kiss_turn": null,
    "sexual_relationship_started_turn": null
  },
  "relationship_summary": ""
}
```

Milestones and relationship axes never auto-promote one another. Sexual, consent, attraction, and relationship information are separate dimensions.

### Common-sense baseline and per-CSA attitude

```json
{
  "common_sense_baseline": 0,
  "csa_attitudes": {
    "csa_id": {
      "familiarity": 0,
      "resistance": 0,
      "last_changed_turn": 0
    }
  }
}
```

Experience with one CSA never changes familiarity with a different CSA automatically.

### Scene, availability, and focus

Scene state tracks scene ID, location, participants, focus thread, goal, beat, exit conditions, and `updated_turn`. Time or location changes require explicit narrative evidence; one turn normally changes at most one location and one time block. NPC availability is soft: zones, time tags, meetings, and work can lead to travel, contact, or waiting scenes. Only real physical restrictions are hard blocks. Speaking focus contains at most three NPCs, and `focal_character_id`, `last_speaker_id`, and participants remain distinct.

### Memory, behavior, and work hooks

Recent summary is paired with an append-only, deduplicated event ledger. Each main NPC has a lightweight behavior core: public persona, private want, fear, pride trigger, trust trigger, hard and soft boundary, speech rhythm, work goal, relationship hook, CSA response tendency, and unresolved issue. A lightweight work hook has no score; it moves through `open`, `active`, `resolved`, or `abandoned`.

## Outcomes and player setup

Only extreme `bold` actions use displayed probability. Normal, voluntary, and direct CSA actions do not use probability. Outcomes are `success`, `partial`, `refused`, `interrupted`, or `blocked`; one outcome never fails the entire turn. Do not classify a physically possible player action as `blocked` merely because it is inconvenient or risky.

Player setup offers simple role/department choices plus free input. Missing nonessential profile data may be completed automatically, then presented as a one-line profile for confirmation.

## Phase boundary

This is a contract, fixture, and static-test phase only. It does not create SQL, a Supabase project, a Cloudflare Worker, a deployment, or a real Story, Extract, Commit, or TTS call. Soft parser, Extract, image, and TTS problems are fail-open warnings and do not require Story regeneration or block a valid Commit.
