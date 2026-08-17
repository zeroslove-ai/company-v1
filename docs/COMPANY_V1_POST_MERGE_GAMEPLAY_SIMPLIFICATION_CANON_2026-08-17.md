# Company v1 — Post-Merge Gameplay Simplification Canon

Status: **OWNER CANON / BINDING DESIGN**
Date: 2026-08-17
Owner direction: deletion-first redesign after direct manual gameplay QA
Repository: `zeroslove-ai/company-v1`
Design base `main`: `9d1a80137980baa67ccfba60bae2173ca17cf8d8`
Implementation branch: `company/gameplay-core-simplification-v1`

This document supersedes older implementation assumptions wherever they conflict with the decisions below. The 2026-08-16 Minimal Story Runtime Reset remains the architectural foundation; this document is the owner-approved post-merge refinement derived from direct manual gameplay evidence.

---

## 1. Owner decision

Do not continue repairing Company v1 by attaching another compatibility layer, semantic gateway, parser, verifier, reducer exception, retry loop, or duplicated state representation to the current runtime.

The next work must follow this order:

1. identify the smallest gameplay spine that is actually required;
2. delete obsolete or duplicated authority around that spine;
3. repair broken single-writer paths only after the obsolete paths are removed;
4. add back only proven product mechanics, each with one explicit owner and one reason to exist;
5. keep presentation features outside narrative authority;
6. prove the result through literal-input and real gameplay scenarios rather than implementation-shape tests alone.

A new abstraction is not automatically an improvement. If the same result can be achieved by deleting a layer and connecting two already-canonical boundaries directly, deletion is preferred.

The target remains:

`literal player input`
→ `minimal committed context`
→ `Story`
→ `narrow post-Story observation`
→ `Commit / one durable transition`
→ `game_save + game_turns`
→ `readback / next Story`

No other component may silently become narrative authority.

---

## 2. Verified baseline and scope boundary

PR #67 has already landed on `main` through merge commit `9d1a80137980baa67ccfba60bae2173ca17cf8d8`. The accepted executable/source-test ancestor remains `f03e32c4194c114d702c43df1f6122c17c4ca7c1`.

PR #69 (`ci: run Company v1 tests on main`) is a separate infrastructure-only follow-up. It is not gameplay architecture authority and is not part of this implementation cut. This canon does not authorize merging PR #69, Production rollout, Production DB changes, or Production gameplay access.

The direct manual QA that motivated this canon is read-only regression evidence. Do not mutate that preserved game to make the failures disappear.

---

## 3. What the manual QA proved

The following are treated as architecture facts for this redesign, not isolated one-off symptoms.

### 3.1 Choice authority is split

Opening choices can currently outrank the latest committed turn choices in the frontend. Old Opening actions therefore reappear later in play. In at least one observed turn the literal persisted player action also differed materially from the action Story actually performed.

This proves that the player-action path is not yet one literal authority from UI to Story.

### 3.2 Exact structured clothing mechanics and durable clothing state disagree

An activated structured CSA required all four clothing slots to be `removed`. Story repeatedly described the character as undressed/nude while durable state remained `worn` until a later explicit user question caused Extract to rediscover the fact.

This proves that a finite product mechanic already represented exactly in structured rule data is being routed through an unnecessary narrative rediscovery gate.

### 3.3 Physical continuity has parallel evidence shapes

Story and Extract could observe a kneeling state while Commit preserved `unknown`. The evidence needed by the physical reducer was not the same evidence shape produced at the Extract boundary.

This proves the physical path has too many intermediate representations.

### 3.4 Player sexual mechanics have a reader/reducer but no reliable fresh writer

Explicit erection and sexual stimulation appeared in Story while durable player sexual state stayed unchanged.

This proves the mechanic is currently a partial subsystem rather than a coherent single-writer path.

### 3.5 Actor attribution can be wrong

A player physical/clothing passage could be accepted as NPC clothing evidence under the single-NPC shortcut. This proves actor attribution cannot be repaired by looser quote heuristics.

### 3.6 CSA meaning is wrong in both directions

The runtime can still make an active rule feel unbelievable or exceptional while also over-expanding a rule into unrelated compliance. Both are wrong.

The correct rule is exact and narrow:

- active/applicable CSA content is an ordinary in-force premise from its effective time;
- personal emotion may react to the situation but not deny that premise;
- the rule changes only what it actually states;
- it grants no unrelated consent, obedience, affection, trust, romance, arousal, or permission.

### 3.7 Direct actions can be delayed into repeated staging

A direct executable request could take multiple turns of preparation, waiting, and repeated confirmation before the requested act meaningfully began.

This proves Story needs a progression contract, not an action-execution engine.

### 3.8 Work-oriented semantic residue is still active

Fresh Story/Opening prompts, opening-plan generation, save state, and setup RPCs still contain `workplace fiction`, `work_hook`, first-work goals, onboarding/work framing, and related scene focus data.

The direct QA showed this becoming a stylistic attractor even after play had moved far away from normal work. Static company setting is intended; compulsory work agenda is not.

### 3.9 Character prompt cards duplicate job identity and suppress human characterization

Department/position/role already exist as identity fields, yet prompt cards repeat job performance, execution responsibility, professional composure, and work-style cues. The model therefore keeps reverting to professional/report-like behavior.

### 3.10 Story cannot currently see enough existing body canon

The source character data contains body and intimate appearance facts, while active Story canon omits most of that information. As a result, exposed/intimate scenes fall back to generic repeated gestures instead of character-specific description.

### 3.11 Some UI features are readers without current writers

Legacy-style NPC stats and image-selection presentation still have surviving readers while fresh runtime no longer has the corresponding coherent writer. A visible reader without a writer is not a reason to resurrect the old subsystem.

### 3.12 Canonical scene is over-specified

Observed durable state could have `location_id=meeting_room` while `scene_id=opening`. `goal` and `focus_thread` also preserve old semantic/work agenda. `beat` is an implementation counter without a proven narrative requirement.

This proves canonical scene contains duplicated or semantic fields that can contradict the actual structural world state.

---

## 4. The target runtime: one spine, narrow sidecars

### 4.1 Narrative authority

**Story is the only narrative author.**

Story receives facts and the literal player action. It is not given precomputed semantic outcomes, consent verdicts, relationship verdicts, success classifications, resistance scores, work goals, execution stages, or narrative event taxonomies.

Story may naturally decide NPC response and outcome where the world does not already determine an exact mechanical result.

### 4.2 Observation authority

**Fresh Extract is a narrow observer, not another narrative model of the world.**

It may propose only fields with a proven current consumer:

- scene presence/location observations where Story itself establishes them;
- compact physical state needed by product continuity;
- narrow player sexual mechanics if retained by the UI/mechanic;
- elapsed minutes;
- Mind Monitor presentation text;
- one natural-language turn summary;
- exact evidence needed for those narrow machine fields.

It must not produce a generic event ledger, relationship ledger, emotion ledger, work state, CSA-attitude state, semantic action taxonomy, or arbitrary save patch.

### 4.3 Commit authority

**Commit validates structure and provenance, not meaning.**

Commit owns:

- action/turn identity;
- expected revision;
- idempotence/replay;
- registered IDs;
- exact evidence provenance for optional narrow machine projections;
- one save transition;
- one committed turn row.

If an optional projection is malformed or ambiguously attributed, that projection is dropped and the turn continues. A nonessential physical/media/stat observation must never invalidate correct Story.

### 4.4 Presentation sidecars

Mind Monitor, images, TTS, numeric reaction meters, and other UI convenience features are downstream sidecars.

They may observe committed Story/state. They may not decide whether Story happened, whether CSA applies, whether an action is allowed, or whether a turn commits.

---

## 5. Literal player action and choice authority

There must be exactly one player-action value for a turn.

### 5.1 Choice source

- Before turn 1 is committed, Opening may expose the Opening provider's four choices.
- After turn 1, the only choice source is the latest committed `game_turns.choices` for the current game/revision.
- `opening_state.choices` must never outrank later committed choices.
- No fallback may silently substitute old choices from a different turn.

### 5.2 Round trip

A clicked choice is sent as the exact literal string displayed to the user. That same literal becomes `game_actions.player_action` and the Story input.

Free-text input follows the same path.

Do not insert a semantic router between displayed text and Story.

### 5.3 Story preservation contract

For an explicit material action, Story must preserve:

- actor;
- target;
- material action/request;
- explicit player self-state stated in the input;
- explicit directionality such as who touches whom.

Story may determine response and consequence but may not substitute a different actor/target/action merely to make the scene easier to narrate.

Do not create a runtime semantic verifier for this. Enforce it through a compact Story contract and regression scenarios against actual provider output.

---

## 6. Story progression contract

The model must not use multi-turn staging as a default escape route.

When the player's requested action is currently executable under established world facts, Story should advance it to a meaningful result in that same turn. It may show a short natural transition, but it should not repeatedly produce:

- preparation without action;
- another permission question for an action already requested;
- `wait / continue / hurry` choice loops;
- repeated reminders of an unrelated meeting/work deadline solely to avoid progressing the current scene.

If the action is genuinely blocked, Story may show the block. If an unrelated action is not covered by CSA, the NPC may naturally accept, refuse, negotiate, or react according to character and context.

The server must not implement a finite physical execution grammar to force this behavior.

---

## 7. Company setting without compulsory work agenda

Company v1 remains set in a company. Do **not** delete:

- company identity;
- departments;
- positions/roles;
- registered employees/NPCs;
- offices, meeting rooms, lounges, pantry, building map;
- hierarchy and role facts that naturally matter in dialogue.

Delete the runtime idea that every Story must pursue work.

### 7.1 Remove fresh work authority

Fresh runtime must stop writing/projecting:

- `world_state.work_hook`;
- Opening `work_hook_id`;
- Opening `work_hook_label`;
- default `첫 업무` hooks;
- default `첫 업무 관계` scene goals;
- work-driven `scene.goal`;
- work-driven `scene.focus_thread`;
- `Write natural Korean workplace fiction` as a universal Story style instruction;
- any equivalent required-work agenda whose only purpose is to keep Story on office tasks.

Historical stored values may remain in old immutable rows but must be ignored by fresh runtime and stripped by the fresh save minimalizer when appropriate.

### 7.2 Opening after the cut

Opening needs only enough state to begin a scene:

- day/weekday and time;
- location;
- primary actor;
- optional supporting actor;
- player identity;
- company/world identity;
- the private app premise.

Opening Story itself should establish a natural initial situation. It does not require a durable work objective.

A company opening can contain work because the characters are at work, but work is context, not a mandatory narrative quest.

---

## 8. Minimal canonical scene

Fresh canonical scene should contain only structural fields that cannot be recovered safely from another authority.

Target shape:

```text
scene = {
  version,
  location_id,
  present_npc_ids,
  focal_character_id,
  last_speaker_id,
  updated_turn
}
```

Remove from fresh canonical scene:

- `scene_id` — duplicates/contradicts location and already produced `opening` vs `meeting_room` drift;
- `goal` — semantic agenda residue;
- `focus_thread` — semantic/work agenda residue;
- `beat` — remove unless implementation proves a current independent product consumer; tests protecting only the old shape do not count as a consumer.

If a current UI needs a display label, derive it from location/current turn rather than reintroducing an independent semantic scene identity.

Presence remains structural and conservative:

- movement target/location is deterministic where navigation intent is exact;
- a registered local speaker can prove presence for the relevant phase;
- omission does not imply exit;
- explicit exit evidence is required to remove a present NPC unless an authoritative location move clears the previous location;
- source-phase speakers must not leak into a destination after movement.

---

## 9. Physical continuity: remove the grammar, keep the useful state

Do not expand posture/contact/action enums.

### 9.1 Keep

- canonical four-slot clothing state because it is a proven product/UI continuity projection:
  - `uniform_top`
  - `uniform_bottom`
  - `underwear_top`
  - `underwear_bottom`
- `worn | removed | open | unknown` as the existing compact clothing values;
- at most one free natural-language `position_label` per actor if a current product/UI/next-Story consumer is proven.

### 9.2 Remove

- durable finite posture grammar when it merely duplicates natural Story (`kneeling`, `sitting`, etc. as a closed semantic taxonomy);
- multiple parallel physical evidence objects;
- magic/planning/actor heuristics whose complexity exists only to compensate for ambiguous evidence plumbing;
- any physical state whose only consumer is an obsolete test.

### 9.3 One evidence shape

Fresh Extract should return one actor-scoped physical observation and one actor-scoped exact Story evidence source for that observation. Do not maintain separate incompatible paths for clothing evidence, physical-change evidence, local embedded evidence, and legacy evidence.

Ambiguous actor attribution drops that actor's optional update. It never changes a different actor and never blocks the turn.

---

## 10. Exact mechanical CSA effects vs narrative CSA meaning

This is the narrow exception that keeps exact product mechanics from being forced through LLM rediscovery.

### 10.1 Exact state-setting mechanical effects

When a supported CSA preset already contains an exact finite mechanical state used by the product — currently the clear example is `clothing_state.required_state` — the runtime may synchronize that exact mechanical state deterministically after activation/applicability.

This is **not** a general physical execution engine. It is direct application of an already-structured product state selected by the user.

Requirements:

- no inference from natural-language rule text;
- no generic execution-action taxonomy;
- no mandatory-enactment planner;
- no success/consent classifier;
- only exact supported preset data may drive an exact existing mechanical state;
- Story still narrates the transition naturally;
- the mechanical state must not create unrelated actions.

### 10.2 Narrative rules

Other CSA content remains a Story premise.

Example: an on-request oral-stimulation rule makes that exact requested act ordinary/in-force when its conditions apply. It does not authorize breast touching, intercourse, romance, or general obedience.

### 10.3 Remove generic CSA execution gateways

Fresh gameplay should not require generic `execution_policy`, `mandatory_enactment`, semantic execution contracts, direct-coverage contracts, or equivalent generic physical-action gateways merely to translate every rule into a machine grammar.

During implementation, prove callers and delete these modules/paths when their remaining purpose is only the superseded execution architecture. Preserve only the narrow lifecycle/transaction and exact mechanical-effect code that has a current product consumer.

---

## 11. Character canon redesign

Role facts and human characterization must be separated.

### 11.1 Identity fields

Keep independently:

- name;
- age;
- department;
- position;
- role title;
- stable ID.

Do not repeat these as personality rules unless they genuinely describe the person's character.

### 11.2 Prompt card

Rewrite heroine prompt cards around:

- personality;
- conversational rhythm;
- humor/awkwardness;
- pride/insecurity;
- emotional expression;
- intimacy/social expression;
- distinctive habits;
- how the character changes tone under pressure or familiarity.

Remove repeated generic work-performance directives such as always leading with execution plans, always behaving professionally, always treating every situation as a task/report, or duplicating role responsibility already present in identity.

### 11.3 Body canon visible to Story

Active adult heroine Story canon should receive compact body identity that improves consistent description, such as body type/height and existing appearance facts.

Intimate body details should be projected only when current confirmed mechanical clothing state makes the relevant area exposed. Visibility is derived from existing four-slot clothing state, not a new semantic classifier.

Do not reveal a hidden intimate fact merely because it exists in source data.

---

## 12. Player sexual mechanics

The existing player sexual state is retained only as a narrow gameplay/UI mechanic, not a sexual-event ledger.

Target durable fields are limited to fields with actual product use, such as:

- erection state;
- arousal/progress if visibly used;
- ejaculation progress/count if visibly used;
- updated turn.

Fresh Extract may propose these from exact Story evidence. Commit writes them through one reducer.

Delete or bypass generic `events.sexual` / sexual-event-ledger machinery if caller proof shows it is no longer needed by the current product. Do not store a taxonomy of every sexual act merely to update the player's small mechanic state.

Tuning must not require an unrealistic fixed minimum number of repetitive stimulation turns. Progress values are product pacing, not semantic truth; tune them separately after the writer path works.

---

## 13. Memory

Narrative memory remains deliberately simple:

- latest six committed raw turns;
- older chronological natural-language `turn_summary`.

No replacement generic ledger, vector memory, fact graph, relationship history mirror, open-facts bag, work ledger, sexual event ledger, or event taxonomy is introduced.

A durable machine state exists only for a concrete current mechanic/UI requirement.

---

## 14. Extract simplification

Fresh Extract must have its own small contract. It must not pass through a legacy superset normalizer whose enums and fields survive only for old persisted outputs.

Target fresh output conceptually:

```text
{
  extract_version: 2,
  outcome,
  scene_observation,
  player_mechanics?,
  npc_physical?,
  physical_evidence?,
  elapsed_minutes,
  mind_monitor,
  turn_summary,
  warnings
}
```

Exact field names may be refined during implementation, but there must be only one current representation per domain.

Historical persisted observations may use one inert read adapter if required for old rows. That adapter may normalize/drop legacy fields for display/replay, but fresh completion must not flow through it and it must never block a new turn.

Delete fresh support for obsolete:

- stats/csa-attitude domains;
- relation updates;
- general events;
- CSA runtime updates;
- generic sexual event arrays;
- arbitrary action target/media selection when those are presentation-only;
- degraded retry semantics used as a hidden second completion path.

---

## 15. UI reaction stats: do not resurrect `npc_stats`

Current UI readers that display old `affinity`, `resistance`, `csa_acceptance`, `sexual_arousal`, or relationship summary must not cause the old semantic state system to return.

### 15.1 Delete now

- `csa_acceptance` — conceptually wrong because valid active CSA is not optional based on acceptance;
- `resistance` as a CSA/action gate;
- relationship summary as a machine-authored authority;
- dead UI readers that imply a working writer where none exists.

### 15.2 Optional Cut 2 sidecar

If numeric reaction meters remain a desired UI feature, Cut 2 may introduce at most a tiny presentation-only `npc_reaction_state` with independently useful display values such as affinity and sexual arousal.

Rules:

- one writer from committed Story observation;
- never projected back to Story as permission/consent/action authority;
- never used by CSA applicability;
- missing/ambiguous update drops without blocking;
- recent Story/summary remain narrative continuity authority.

Cut 1 must not rebuild this system.

---

## 16. Images and media: presentation sidecar only

Fresh Extract should not own image selection.

A later presentation-sidecar implementation may select assets from:

- committed parsed Story;
- current focal/present actor;
- current confirmed clothing state;
- finite asset metadata.

Image selection failure means no image or a neutral fallback image. It never rejects Story, changes state, or retries the narrative.

TTS follows the same principle.

---

## 17. DB and migration design

Historical migrations are immutable. Any DB change is additive.

Cut 1 may add one migration that redefines the current Company functions so fresh/reset/setup flows match this canon.

Required goals:

- new setup no longer requires or writes `work_hook_id`;
- new opening bootstrap no longer requires semantic `scene_goal` / work focus;
- fresh save minimalization strips `world_state.work_hook` and obsolete fresh scene semantic fields;
- scene validation accepts only the new minimal scene shape;
- old stored JSON fields may remain in historical rows but become inert and are removed on the supported fresh/reset/minimalization boundary where safe;
- no migration fabricates new narrative facts from historical Story.

DB remains structural durability, not narrative authority.

No Production migration is authorized by this canon. TEST application requires a later explicit task.

---

## 18. Module deletion targets

Cut 1 implementation must audit exact callers, then aggressively delete/inline/rename code whose only purpose is a superseded layer. The default disposition is below.

### Remove or collapse when fresh callers confirm no independent need

- `workplace-context.js` as a workplace semantic abstraction; move any still-useful general-NPC identity helpers to a neutral catalog/helper and delete the wrapper;
- generic CSA execution-policy / mandatory-enactment / semantic execution gateway paths;
- fresh legacy Extract superset normalization paths;
- physical evidence translation layers that duplicate the one actor-scoped evidence contract;
- finite posture grammar if no genuine product consumer remains;
- sexual event ledger if the small player mechanic does not need it;
- stale stats/relationship readers/writers;
- fresh image-selection fields inside Extract;
- old work-hook Opening helpers and tests;
- compatibility code whose only consumer is an obsolete fresh path.

### Keep

- Story parser/marker protocol required to render raw Story blocks;
- stable registered character/location catalogs;
- deterministic navigation resolver for exact location/registered target intent;
- canonical minimal scene reducer;
- four-slot clothing state;
- narrow CSA lifecycle/transaction state;
- time/progression mechanics actually displayed/used;
- recent raw turns + older summary;
- Mind Monitor as non-authoritative presentation;
- TTS/image asset infrastructure as nonblocking sidecars.

A historical comment or old test is not proof that a runtime layer must survive.

---

## 19. Two-cut implementation plan

### Cut 1 — `gameplay-core-simplification-v1`

Purpose: remove conflicting authority and repair the core play loop before adding presentation features.

Required scope:

1. fix exact choice source and literal round trip;
2. simplify Story prompt and remove universal workplace-fiction/work-goal authority;
3. simplify Opening and remove work-hook plumbing from source plus additive TEST-ready migration file;
4. shrink canonical scene; remove stale semantic scene fields and movement overwrite path;
5. collapse fresh physical observation/evidence to one actor-scoped path;
6. keep four-slot clothing; wire exact structured `clothing_state` CSA effects directly as narrow mechanical state without a generic enactment engine;
7. remove durable finite posture grammar unless a real product consumer is proven; prefer free `position_label` only if needed;
8. restore the narrow player sexual mechanic writer without a generic sexual-event ledger;
9. enforce exact CSA premise/scope in Story without `csa_acceptance`/resistance/semantic execution gates;
10. enforce literal actor/target/action preservation and same-turn meaningful progression through Story contract/scenario tests, not a new verifier;
11. revise active heroine prompt cards away from duplicated work-function identity;
12. project compact body canon and clothing-derived visible intimate canon;
13. delete fresh dead gateways/adapters proven obsolete by caller audit;
14. update tests to protect player-visible behavior and the smaller architecture rather than removed shapes.

Cut 1 source work is source/test/migration-file only. No TEST DB application, Worker deployment, Production access, or live gameplay is authorized by the initial implementation task.

After source review, a separate owner/operator task may apply the additive migration to TEST and deploy a TEST candidate for direct manual play.

### Cut 2 — `presentation-sidecars-cleanup-v1`

Cut 2 may start only after Cut 1 is reviewed and its core behavior is accepted.

Possible scope:

1. remove dead legacy stat UI or add the minimal presentation-only reaction meters if still desired;
2. move image selection fully to a committed-Story presentation sidecar;
3. remove remaining media/Extract coupling;
4. delete historical compatibility adapters after final caller proof where persisted readback no longer needs them;
5. clean remaining dead readers and naming residue;
6. perform final code-size / authority audit and delete superseded tests/helpers.

Cut 2 must not reopen the core Story/Extract/Commit architecture unless Cut 1 evidence proves a real defect.

---

## 20. Cut 1 source acceptance scenarios

Automated tests must be behavior-oriented and cover at least:

1. Opening choices exist at turn 0, but after a committed turn only the newest committed turn choices are rendered.
2. Clicking a choice preserves the exact literal through action reservation and Story input.
3. Free text preserves the exact literal through the same path.
4. Movement changes canonical location without any stale `opening` scene identity reappearing.
5. Fresh scene no longer needs work goal/focus/work hook.
6. An exact structured nude/clothing CSA synchronizes the four compact clothing slots for the applicable actor without waiting for a later Extract rediscovery.
7. A narrative on-request CSA applies only to its exact stated act and does not imply unrelated touching/consent.
8. Optional physical observation with ambiguous actor evidence is dropped, not misattributed and not turn-blocking.
9. Explicit Story evidence for erection/sexual progress updates the retained player mechanic.
10. Story prompt contains no universal requirement to return to work/meeting/onboarding when the player's current focus is elsewhere.
11. Story receives the relevant active character body canon, while intimate hidden details are not projected when clothing state says they are covered.
12. Recent-six raw history plus older chronological summaries remain unchanged in principle.
13. Removed stats/work/event/relationship/CSA-attitude fields cannot re-enter fresh Extract/save through compatibility parsing.
14. Side systems cannot reject an otherwise valid Story turn for missing optional physical/media/stat data.

Provider-output quality cases that cannot be made deterministic in a unit test must be recorded as TEST manual acceptance scenarios rather than replaced with regex semantic gates.

---

## 21. TEST manual acceptance after Cut 1 deployment authorization

When a later task explicitly authorizes TEST migration/deployment, use a new disposable TEST game. Do not mutate preserved evidence games.

Manual acceptance should include ordinary conversation and intimate/CSA progression in one natural session rather than synthetic endpoint-only calls.

Minimum observations:

- current choices stay current for multiple turns;
- player text is not silently replaced;
- movement/presence stays coherent;
- active CSA feels ordinary in-force rather than unbelievable;
- unrelated behavior is not auto-authorized by CSA;
- exact clothing mechanical rule and displayed Story/state remain consistent;
- direct executable requests progress meaningfully in the same turn instead of five-turn staging loops;
- player sexual mechanic changes when Story explicitly establishes its facts;
- heroine dialogue and narration remain character-specific rather than repeatedly snapping back to work reports/meeting countdowns;
- exposed body description can use existing character-specific canon without inventing hidden facts;
- optional projection failures do not kill a turn;
- history remains coherent after facts leave the six-turn raw window.

Passing source tests alone is not product-play acceptance.

---

## 22. Prohibited repairs

Do not solve this cut by adding:

- a new semantic action router;
- a new Story meaning verifier;
- a second choice source/fallback authority;
- a finite consent matrix;
- a finite physical action grammar;
- a relationship/event/open-fact ledger;
- a general CSA execution DSL;
- a retry-until-provider-obeys loop;
- provider/model swapping as a correctness strategy;
- regexes that determine whether arbitrary narrative behavior is valid;
- a compatibility copy of deleted state under a new name;
- Production-only logic differences;
- more persistent fields merely because they are easy to add.

If the implementation needs one of these to work, stop and re-evaluate whether an older layer should be deleted instead.

---

## 23. Completion and stop rule

Cut 1 is complete only when:

- the runtime can still be explained by the minimal spine;
- deleted authorities do not have fresh shadow replacements;
- every retained durable field has a concrete current product consumer;
- exact literal choice/free-text authority is proven;
- scene/work/physical/CSA/player-mechanic defects above are covered by focused tests;
- source diff demonstrates meaningful simplification, not only feature growth;
- full tests and syntax/diff checks pass;
- a completion report lists removed files/paths and net semantic-surface reduction;
- no TEST/Production deployment or DB application occurred without a separate authorization.

Then stop at `WAITING_REVIEW`. Do not auto-create Cut 2 and do not merge.
