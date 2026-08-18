# Company v1 — Hospital Reference Spine Alignment Canon

**Owner decision date:** 2026-08-18  
**Status:** OWNER CANON / BINDING DESIGN  
**Applies to:** Company v1 fresh Story / Extract / reducer / Commit path, continuity memory, scene navigation, and related fresh-runtime residue  
**Supersedes on conflict:** 2026-08-16 Minimal Story Runtime Reset Canon and 2026-08-17 Post-Merge Gameplay Simplification Canon implementation assumptions, while preserving their deletion-first / Story-first / sole-writer decisions

---

## 0. Owner decision

Hospital-v2 was reviewed as a reference architecture because it has demonstrated long-running play despite having historical technical debt. The lesson to adopt is **not its source shape, hotfix accumulation, giant Worker, relationship/event ledgers, or prompt-priority stacking**. The useful lesson is its resilient narrative spine:

`literal player action`
→ `Story`
→ `player-visible final narrative`
→ `one post-Story Extract`
→ `small deterministic state reducers`
→ `Commit`
→ `durable save + committed turn history`
→ `next Story`.

Company v1 keeps its stronger workflow durability, canonical scene, structured app transaction, replay/recovery, modular runtime-core, and exact finite CSA mechanic support. However, direct 33-turn manual QA on 2026-08-18 proves that **the fresh Story→Extract→Reducer boundary is still too fragmented and strict**. Story can successfully advance the game while optional state is silently lost because Extract output vocabulary, evidence plumbing, and reducer expectations do not line up.

Therefore the next semantic implementation is **not a list of symptom hotfixes** and not a rollback to Hospital source. It is one final simplification/alignment cut:

> **Make fresh Company behave like the proven Hospital narrative spine: Story progresses the game, one lightweight Extract observes only what the product truly needs, code deterministically owns the few retained machine states, and Commit records one durable reality.**

No new semantic architecture is authorized by this canon.

---

## 1. Canonical runtime after alignment

The fresh runtime must be explainable as:

```text
literal player text / clicked literal choice
        ↓
minimal committed facts
        ↓
STORY
sole narrative author
        ↓
raw streamed player-visible narrative
        ↓
ONE FRESH EXTRACT CALL
  - structural scene observation
  - compact clothing observation when needed
  - narrow player sexual delta when needed
  - elapsed time
  - natural-language turn summary
  - Mind Monitor presentation text
        ↓
SMALL DETERMINISTIC REDUCERS
        ↓
COMMIT
identity / provenance / transaction / replay
        ↓
game_save + game_turns
        ↓
next Story / UI readback
```

Independent side systems remain:

```text
game_actions = workflow/crash/retry authority only
CSA app      = signed transaction/lifecycle + exact supported finite mechanics
Image/TTS    = presentation sidecars
Frontend     = coordination/readback only
```

No side system may become narrative meaning authority.

---

## 2. What is retained from current Company

Do **not** rebuild these areas merely to resemble Hospital:

1. `game_actions` server-side workflow durability and resume/retry state.
2. committed `game_turns` and `game_save` authority.
3. canonical registered character/location identity.
4. canonical narrow `save.scene` structural model.
5. exact literal player action and choice round-trip.
6. deterministic exact navigation for structurally resolvable destinations.
7. app/CSA signed transaction lifecycle.
8. exact finite clothing CSA mechanic such as `clothing_state.required_state`.
9. feedback revision as a new revision of the same turn rather than delete-and-rollback mutation.
10. modular runtime-core boundaries instead of Hospital's monolithic Worker.

These are Company improvements and remain.

---

## 3. What must be removed or simplified

### 3.1 Fresh Extract must become genuinely lightweight

Current Company calls the fresh Extract narrow, but its actual prompt still combines a large amount of work: scene presence, movement evidence, actor attribution, compact physical/clothing observation, player sexual mechanics, exact evidence, elapsed time, summary, Mind Monitor for multiple actors, CSA prohibitions, and many legacy contract warnings.

The aligned fresh Extract should retain only fields with a current product reason:

```text
extract_version
outcome
scene_observation
player_observation.sexual      (only if retained UI mechanic)
npc_observations.clothing      (only observed changes not already exact CSA mechanic)
evidence                        (one current evidence vocabulary)
elapsed_minutes
turn_summary
mind_monitor
warnings
```

`player_observation.physical` / free `position_label` and NPC free physical position are **not automatically retained**. They survive only if a concrete current UI/next-Story consumer is proven during implementation. If not, remove them from fresh durable state and let Story + narrative memory carry the posture/position continuity.

Do not create a replacement physical ontology.

### 3.2 Delete fresh legacy vocabulary, do not merely tell the model not to use it

Fresh gameplay must not expose or normalize old semantic surfaces whose only purpose is historical compatibility, including where proven unreachable by current persisted replay:

- generic events;
- sexual-event taxonomy;
- generic stats;
- CSA attitude/runtime/aftereffect semantics;
- action target/image selection authority in Extract;
- relationship/emotion/work semantic patches;
- generic event/open-fact ledgers;
- stale save-patch vocabulary.

Historical compatibility readers may remain only when concrete stored-data/replay consumers are proven. Fresh provider/schema code should not carry historical vocabulary for convenience.

---

## 4. One evidence vocabulary

The 33-turn manual session exposed a core design failure: Extract may emit a valid physical proposal and `physical_change` evidence while the reducer expects a differently named evidence path such as `position`/`posture`, causing a silent drop.

This is not acceptable.

Fresh evidence must have **one actor-scoped shape that the reducer consumes directly without translation layers**.

Recommended meaning:

```json
{
  "actor_id": "heroine3",
  "quote": "exact contiguous Story substring",
  "changes": {
    "clothing": {
      "underwear_bottom": "removed"
    }
  }
}
```

The exact serialized schema may differ, but these requirements are binding:

1. actor identity is explicit;
2. exact Story quote is stored once;
3. changed current-contract fields are adjacent to that actor/evidence;
4. reducer consumes that same normalized object directly;
5. no `physical_change` → `evidenceMap` → `position evidence` renaming chain;
6. ambiguous actor evidence drops only that optional actor update;
7. optional evidence failure never rejects a correct Story turn.

Exact supported structured CSA mechanics remain the narrow exception: their already-structured required mechanical state is synchronized directly and does not need Story rediscovery.

---

## 5. Story remains the game engine

Story remains the only narrative author.

Story input should stay minimal:

- exact literal current player action;
- current committed time;
- current committed location;
- current present registered actors;
- relevant character/personality/speech/body canon;
- current confirmed compact clothing state needed for continuity;
- current applicable active CSA premise and exact supported mechanical projection;
- latest raw committed turns;
- older chronological narrative memory.

Do not give Story:

- precomputed action success/failure;
- consent/comfort verdicts;
- relationship stages;
- generic resistance/acceptance values;
- sexual event/action taxonomy;
- generic physical execution plans;
- media classification;
- semantic route classifications other than exact structural navigation/app transaction.

Story may decide natural response/outcome where the world does not already determine an exact mechanical fact.

---

## 6. Mind Monitor — same Extract call, presentation authority only

Mind Monitor should follow the practical Hospital pattern: **generate it in the same post-Story Extract call. Do not add another LLM stage solely for Mind Monitor.**

It is nevertheless a presentation/readback field, not durable narrative authority.

Binding rules:

1. same Extract call may output `mind_monitor` alongside core observation and summary;
2. it receives Story, target NPC identity/personality, scene, and applicable world premise context;
3. it does **not** require exact Story quote provenance because it is interpretive presentation text, not a durable factual state transition;
4. missing/partial Mind Monitor is fail-open;
5. no retry/regeneration solely to fill Mind Monitor;
6. empty Mind Monitor must not change Commit, Story, scene, summary, or next-turn authority;
7. next Story must not treat prior Mind Monitor text as a hard fact unless that meaning also exists in committed narrative memory;
8. UI may display it directly when present.

The implementation goal is not to split Mind Monitor into another service. The goal is to simplify the rest of Extract enough that generating natural character-specific inner monologue in the same call is reliable.

---

## 7. Narrative memory and summary fail-safe

Current memory design remains conceptually correct:

```text
latest six committed turns = raw Story
older turns = chronological natural-language summary memory
```

The 33-turn user session showed successful Extract turns with empty summaries. Once such a turn leaves the recent raw-six window, an important continuity cliff can occur.

The aligned design must therefore make **committed raw Story the fail-safe memory authority**.

Required behavior:

1. use non-empty provider `turn_summary` when available;
2. when an older committed turn has an empty summary, do not drop the turn from memory;
3. deterministically project a bounded excerpt/compact representation from the already committed `game_turns.story_text` / committed parsed narrative for memory input;
4. this is a read-time continuity fallback, not a second LLM summary generation and not a new semantic ledger;
5. never retry Extract merely because summary is empty;
6. do not invent relationship/event facts in the fallback.

The purpose is simple: **a committed Story must not vanish from long-term narrative memory because optional summary generation failed.**

---

## 8. Scene, location, presence, and focus

### 8.1 Durable scene truth

Keep structural truth narrow:

```text
location_id
present_npc_ids
updated_turn
```

`last_speaker_id` may remain if an independent current consumer exists, but it should be derivable from committed parsed dialogue whenever possible.

`focal_character_id` must be audited aggressively. The 33-turn QA showed stale focus surviving while a different actor became the actual dialogue/action center. If focus is only presentation convenience, derive it from current committed dialogue/current scene instead of preserving it as semantic state.

Do not add a new focus classifier.

### 8.2 Presence remains conservative

- explicit authoritative location move clears source-local presence;
- destination-phase exact Story evidence or registered local dialogue may add actors;
- omission alone does not remove an actor;
- exact exit evidence removes an actor;
- source-phase speakers do not teleport to destination.

### 8.3 Exact navigation improvement

Current deterministic NPC navigation is too narrow when multiple exact registered NPCs are mentioned.

Allowed structural extension:

```text
one mentioned registered NPC
  + exactly one registered destination
  => resolve

multiple mentioned registered NPCs
  + every mentioned NPC resolves to the same one registered destination
  => resolve that destination

multiple mentioned NPCs
  + destinations differ / ambiguous
  => no deterministic resolution; Story handles it
```

This is not a generic intent parser. It only resolves exact registered identities to a single structurally unambiguous destination.

---

## 9. Compact clothing

Keep four-slot clothing because it has a real continuity/UI/CSA mechanical consumer:

- `uniform_top`
- `uniform_bottom`
- `underwear_top`
- `underwear_bottom`

States remain the minimal existing set only where still needed by current content/UI.

Two write paths are allowed and must stay distinct in reason:

1. **exact structured CSA mechanic** → deterministic direct synchronization of its exact required state;
2. **ordinary Story-established clothing change** → one actor-scoped exact-evidence observation through fresh Extract.

No third clothing authority, no generic physical execution DSL, no Story-text regex compliance engine.

---

## 10. Player sexual mechanic

The 33-turn manual session showed the current player sexual state remaining effectively unchanged despite extended Story content, while frontend readers still expose arousal/progress/count/erection-related values.

A visible mechanic without a reliable fresh writer must not remain half-alive.

Implementation must make an explicit binary decision based on current product ownership:

### If retained

Use the Hospital-style narrow mechanic:

```text
Extract proposes a small delta/current finite display state + exact Story quote
→ deterministic reducer clamps/counts/resets
→ one durable player sexual state
```

No sexual event ledger, no relationship effect, no generic action taxonomy, no permission semantics.

### If not retained

Remove its fresh writer, save state, UI readers, tests, and projection together. Do not preserve a zombie UI field just because it existed historically.

The preferred direction is to retain only if the current player-facing UI genuinely needs the meter.

---

## 11. Relationship, emotion, and event state are not the answer

Do **not** respond to long-term continuity concerns by reintroducing:

- generic relationship ledger;
- event ledger;
- sexual event history;
- emotion state ledger;
- open-fact ledger;
- promise/boundary taxonomy.

Hospital's long play is not evidence that its large relationship/event save machinery caused stability.

First prove the simple memory spine:

```text
recent committed raw Story
+
older natural-language summary
+
raw committed Story fallback when summary is missing
```

Only a concrete repeated long-play failure with a clearly defined product consumer may justify a future narrow durable mechanic.

---

## 12. Commit becomes smaller, not smarter

Commit owns:

- action/turn identity;
- expected revision;
- transactionality;
- idempotence/dedupe/replay;
- registered IDs;
- exact provenance validation for the few retained optional machine projections;
- one deterministic save transition;
- one committed turn history row.

Commit must not decide:

- whether the narrative was natural;
- whether a relationship changed;
- whether an NPC consented beyond exact product mechanic state;
- whether an open-ended physical action semantically succeeded;
- whether Mind Monitor is correct;
- whether summary prose is good enough.

Malformed optional observations are dropped locally and the Story turn continues.

---

## 13. game_actions stays workflow-only

`game_actions` is retained because Company has stronger crash/retry/resume durability than Hospital.

It owns in-flight workflow identity/stage and persisted intermediate Story needed for resume.

It must not become:

- semantic world state;
- relationship/event authority;
- a rewritten player intent authority;
- a second current scene authority.

The committed world is still `game_save + game_turns`.

---

## 14. Direct 33-turn evidence that motivates this cut

Manual TEST game:

`9755b57b-5cbb-44dd-a624-020fe516c16d`

Observed before/around main `196e4ef632017c88c27f76c2d00a77f8ce194f7c`:

- 33 committed turns and exact-four choices on all 33 committed turns;
- UTF-8 user input functioning;
- Story continuity generally substantially better than prior architecture;
- physical/position observations appeared in Extract but durable `position_label` could remain null due to evidence vocabulary mismatch;
- player sexual state remained effectively unchanged throughout despite a current UI reader;
- turn summaries were empty on multiple successful Extract turns, including turns 12, 27, 29, and 32;
- Mind Monitor was empty on multiple successful Extract turns, including 12, 27, 28, 29, 30, and 32;
- a multi-NPC explicit destination phrase could fail deterministic navigation and leave canonical location one or more turns behind Story;
- focal state could remain on an older actor while current dialogue/action centered another actor.

These are not six unrelated product defects. They demonstrate **one over-fragmented fresh observation boundary**.

PR #78 / main `196e4ef...` already repaired the separate proven clothing-CSA absent-NPC bootstrap seam. Do not reopen that exact defect unless new evidence on the merged/deployed version proves it persists.

---

## 15. Implementation strategy — one coherent cut

Proposed implementation identity:

`hospital-reference-spine-alignment-v1`

This should be one coherent simplification cut, not a chain of tiny repair tasks.

### Phase A — fresh-path inventory

Audit actual current callers and classify:

- fresh Story inputs;
- fresh Extract output fields;
- fresh normalization fields;
- reducer consumers;
- current UI consumers;
- historical-only compatibility callers;
- scene/focus readers;
- player sexual readers/writers;
- memory readers;
- exact navigation resolver.

Every retained field needs a current consumer and authority reason.

### Phase B — deletion and contract reduction

- delete unreachable fresh legacy Extract vocabulary;
- remove duplicate evidence translations;
- remove unproven physical/posture durability;
- reduce focus authority if presentation-derived;
- keep only one fresh evidence shape;
- keep Mind Monitor in the same Extract call but fail-open/presentation-only;
- add committed raw-Story memory fallback for missing old summaries;
- make retained player sexual mechanic one-writer coherent or delete it end-to-end;
- extend exact multi-NPC same-destination navigation structurally.

### Phase C — tests

Prefer scenario/contract tests over implementation-shape preservation.

At minimum prove:

1. literal player input round-trip;
2. exact single and multi-NPC same-destination navigation;
3. movement clears source presence and destination evidence adds only destination actors;
4. exact clothing CSA mechanical state persists;
5. ordinary clothing evidence writes only the correct actor;
6. optional physical observation failure does not fail the turn;
7. retained player sexual mechanic changes only from exact Story evidence;
8. summary-empty committed turn still remains in older Story memory through raw fallback;
9. empty Mind Monitor does not affect Commit/next Story;
10. fresh Extract has no generic relation/event/emotion/work/sexual-event authority;
11. refresh/replay returns the same committed state.

### Phase D — merge/deploy preparation

- full unit/contract suite;
- exact-head CI;
- owner review;
- merge only after review;
- deploy exact merged main to TEST;
- structural/API smoke only.

### Phase E — user manual acceptance, last

**Automated Codex/Hermes long live gameplay is forbidden for this alignment cut.**

After exact merged-main TEST deploy/smoke:

1. prepare one fresh disposable manual TEST game / URL;
2. do not consume gameplay turns automatically;
3. STOP at `WAITING_USER_LIVE_ACCEPTANCE`;
4. the user performs 30–50+ turn manual play;
5. only user-observed evidence may open follow-up repairs.

Live product acceptance is deliberately the final phase, not an early automated loop.

---

## 16. Hard prohibitions

- no Hospital source copy/paste architecture migration;
- no giant Worker consolidation;
- no new semantic router/classifier/verifier;
- no general consent/compliance engine;
- no relationship/event/emotion/open-fact ledger reintroduction;
- no finite generic physical/sexual action grammar;
- no generic CSA execution DSL;
- no third parser generation;
- no retry/regenerate-until-lucky behavior;
- no provider/model change to mask defects;
- no Mind Monitor-specific LLM stage unless a later product decision explicitly changes this canon;
- no optional subsystem failure causing Story loss;
- no automated long live QA before user manual acceptance;
- no Production change without a separate owner-authorized task.

---

## 17. Architecture acceptance checklist

Every future implementation/review must answer:

| Question | Required answer |
|---|---|
| Is the displayed/player literal the same value Story receives? | YES |
| Does Story remain the sole narrative author? | YES |
| Is general natural language semantically classified before Story? | NO |
| Is fresh Extract one post-Story call? | YES |
| Is fresh Extract limited to current consumers? | YES |
| Is Mind Monitor in the same Extract call but presentation-only? | YES |
| Can missing Mind Monitor fail the turn? | NO |
| Can missing summary make committed Story disappear from older memory? | NO |
| Is there one evidence vocabulary for retained optional machine changes? | YES |
| Are exact supported CSA mechanics applied directly without narrative rediscovery? | YES |
| Does Commit judge open-ended narrative meaning? | NO |
| Are relation/event/emotion ledgers required for general continuity? | NO |
| Does `game_actions` remain workflow-only? | YES |
| Is durable physical state limited to proven consumers? | YES |
| Is user manual live play the final product acceptance stage? | YES |

---

## 18. One-sentence canon

> **Company v1 gives the literal player action and minimal committed reality to Story, lets Story progress the game, uses one lightweight Extract call to observe only a few necessary facts plus summary and Mind Monitor, lets small deterministic reducers own those retained machine states, and commits one durable reality without letting side systems or compatibility residue become a second game engine.**

Short form:

> **Story progresses; one Extract observes; code owns only the few real mechanics; Commit records; the user validates the final game.**
