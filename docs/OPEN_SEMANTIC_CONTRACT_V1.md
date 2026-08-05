# Open Semantic Contract v1

## Purpose

This stacked patch removes two remaining content-facing closures without weakening runtime
integrity:

1. Company CSA no longer exposes donor-era hospital group, trigger, or duration identifiers.
2. Opening locations, work hooks, and scene goals come from edition map content instead of a
   short engine-owned list.

## Compatibility

- Existing saves and pending preset payloads using `nurse`, `doctor`, `hospital_staff`,
  `patient`, `guardian`, or hospital trigger/duration ids are canonicalized at the runtime
  boundary.
- The bundled legacy JSON remains readable; `/api/app-state`, validation, Story, Extract, and
  persisted new operations use Company-native ids.
- Arbitrary concise custom group/trigger/duration text is preserved for nonsexual rules.
- Sexual direct execution still requires the finite action/direction audit taxonomy plus a
  known Company group or an explicit stable selector such as `character:heroine2`.
- Turn idempotency, CSA lifecycle, DB schema, action state, and bounded numeric metrics remain
  strict finite system states.

## Opening content

`buildOpeningPlan` consumes `edition.map.locations`. A location may optionally define:

- `opening_enabled`
- `opening_position_ids`
- `opening_hooks` as strings or `{ id, label }`
- `opening_goals` as strings

When hooks or goals are absent, deterministic location-derived text is used. No extra LLM call is
added.

## Deployment

No Supabase migration or reset is required. Deploy only the final verified top-of-stack SHA, API
Worker first and Frontend Worker second.


## Final runtime closure audit

- General-NPC CSA resolution consumes Company-native groups and explicit stable selectors; legacy
  hospital ids enter only through the canonical alias adapter.
- Ambiguous or absent general-NPC matches remain unresolved rather than selecting a convenient NPC.
- Automatic TTS is limited to the selected/focal Mind Monitor character. Unknown and one-off
  speakers never inherit another character's voice, and TTS OFF still clears work before any API
  request can start.
- The public NPC finder UI, client method, and API route are removed. Free-text movement such as
  `민아를 찾아간다` continues through the normal Story → Extract → Commit pipeline.
